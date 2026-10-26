// Freistellung für die Collage (/collage): stellt die Person auf einem Foto frei und
// speichert sie mit transparentem Hintergrund. Läuft komplett lokal über das
// Vision-Framework von macOS (Vordergrund-Maske), ohne Fremddienst, ohne Modell-Download.
//
// Benutzung (macOS 14 oder neuer):
//   swift scripts/cutout.swift <eingabe.jpg|png|heic> <ausgabe.png|webp>
//
// - Die Ausgabe wird auf die Figur zugeschnitten (transparente Ränder fallen weg).
// - `.webp` schreibt das Skript über `cwebp` (Homebrew: `brew install webp`), weil
//   ImageIO WebP nur lesen kann. Ohne `cwebp` landet eine PNG daneben.
// - Bestes Ergebnis: Hochformat, ruhiger Hintergrund, Person hebt sich klar ab.
//   Der leichte Saum am Rand ist gewollt (Greenscreen-Charme); der helle Lichtsaum
//   kommt erst auf der Seite per CSS dazu.
//
// Danach: Datei nach public/collage/ legen und im Person-Slot in content/collage.ts eintragen.

import AppKit
import CoreImage
import Foundation
import ImageIO
import UniformTypeIdentifiers
import Vision

func fail(_ msg: String) -> Never {
  FileHandle.standardError.write(("cutout: " + msg + "\n").data(using: .utf8)!)
  exit(1)
}

let args = CommandLine.arguments
guard args.count == 3 else { fail("Benutzung: swift scripts/cutout.swift <eingabe> <ausgabe.png|webp>") }
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])

guard let src = CGImageSourceCreateWithURL(inURL as CFURL, nil),
  let cg = CGImageSourceCreateImageAtIndex(src, 0, [kCGImageSourceShouldCacheImmediately: true] as CFDictionary)
else { fail("Bild nicht lesbar: \(inURL.path)") }

// EXIF-Ausrichtung berücksichtigen, damit Hochformat-Handyfotos nicht quer landen
let props = CGImageSourceCopyPropertiesAtIndex(src, 0, nil) as? [CFString: Any]
let exif = (props?[kCGImagePropertyOrientation] as? UInt32) ?? 1
let orientation = CGImagePropertyOrientation(rawValue: exif) ?? .up
let input = CIImage(cgImage: cg).oriented(orientation)

let handler = VNImageRequestHandler(ciImage: input, options: [:])
let request = VNGenerateForegroundInstanceMaskRequest()
do { try handler.perform([request]) } catch { fail("Vision-Fehler: \(error)") }
guard let result = request.results?.first, !result.allInstances.isEmpty else {
  fail("Keine Person/kein Vordergrund erkannt.")
}

// Alle erkannten Vordergrund-Instanzen zusammen (Person + was sie in der Hand hält)
let maskBuffer: CVPixelBuffer
do {
  maskBuffer = try result.generateScaledMaskForImage(forInstances: result.allInstances, from: handler)
} catch { fail("Maske nicht erzeugt: \(error)") }

let mask = CIImage(cvPixelBuffer: maskBuffer)
let clear = CIImage(color: .clear).cropped(to: input.extent)
guard let blend = CIFilter(name: "CIBlendWithMask", parameters: [
  kCIInputImageKey: input,
  kCIInputBackgroundImageKey: clear,
  kCIInputMaskImageKey: mask,
])?.outputImage else { fail("Maskieren fehlgeschlagen.") }

let ctx = CIContext(options: [.workingColorSpace: CGColorSpace(name: CGColorSpace.sRGB)!])
guard let full = ctx.createCGImage(blend, from: input.extent, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
else { fail("Rendern fehlgeschlagen.") }

// Auf die Figur zuschneiden: Begrenzungsrahmen aller Pixel mit nennenswertem Alpha
func trimmed(_ img: CGImage) -> CGImage {
  let w = img.width, h = img.height
  var px = [UInt8](repeating: 0, count: w * h * 4)
  guard let bm = CGContext(data: &px, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                           space: CGColorSpace(name: CGColorSpace.sRGB)!,
                           bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return img }
  bm.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
  var minX = w, minY = h, maxX = -1, maxY = -1
  for y in 0..<h {
    for x in 0..<w where px[(y * w + x) * 4 + 3] > 8 {
      if x < minX { minX = x }
      if x > maxX { maxX = x }
      if y < minY { minY = y }
      if y > maxY { maxY = y }
    }
  }
  guard maxX >= minX, maxY >= minY else { return img }
  let pad = 4
  let r = CGRect(x: max(0, minX - pad), y: max(0, minY - pad),
                 width: min(w, maxX + pad + 1) - max(0, minX - pad),
                 height: min(h, maxY + pad + 1) - max(0, minY - pad))
  return img.cropping(to: r) ?? img
}
let out = trimmed(full)

func writePNG(_ img: CGImage, to url: URL) {
  guard let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else {
    fail("Kann nicht schreiben: \(url.path)")
  }
  CGImageDestinationAddImage(dest, img, nil)
  guard CGImageDestinationFinalize(dest) else { fail("Schreiben fehlgeschlagen: \(url.path)") }
}

if outURL.pathExtension.lowercased() == "webp" {
  let tmp = FileManager.default.temporaryDirectory.appendingPathComponent("cutout-\(UUID().uuidString).png")
  writePNG(out, to: tmp)
  defer { try? FileManager.default.removeItem(at: tmp) }
  let p = Process()
  p.executableURL = URL(fileURLWithPath: "/usr/bin/env")
  p.arguments = ["cwebp", "-quiet", "-q", "82", "-alpha_q", "100", "-exact", tmp.path, "-o", outURL.path]
  var ok = false
  if (try? p.run()) != nil {
    p.waitUntilExit()
    ok = p.terminationStatus == 0
  }
  if !ok {
    let png = outURL.deletingPathExtension().appendingPathExtension("png")
    writePNG(out, to: png)
    print("cwebp fehlt oder schlug fehl — PNG geschrieben: \(png.path)")
    exit(0)
  }
} else {
  writePNG(out, to: outURL)
}
print("freigestellt: \(outURL.path) (\(out.width)×\(out.height) px, \(result.allInstances.count) Instanz(en))")
