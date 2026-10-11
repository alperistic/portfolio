import type { ObjectId } from "@/content";
import { ACCENT } from "@/lib/scene/layout";

/** Kleines Symbol je Himmelsobjekt (Legende). Reine Form, keine Emojis. */
export function Glyph({ id }: { id: ObjectId }) {
  const c = ACCENT[id];
  const common = { width: 18, height: 14, viewBox: "0 0 18 14", "aria-hidden": true as const };
  switch (id) {
    case "alper":
      return (
        <svg {...common}>
          <circle cx="9" cy="7" r="2.4" fill={c} />
          <circle cx="9" cy="7" r="5.2" fill="none" stroke={c} strokeOpacity=".45" />
        </svg>
      );
    case "werdegang":
      return (
        <svg {...common}>
          <path d="M2 10 6 4l5 5 5-6" fill="none" stroke={c} strokeOpacity=".5" />
          {[
            [2, 10],
            [6, 4],
            [11, 9],
            [16, 3],
          ].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="1.2" fill={c} />
          ))}
        </svg>
      );
    case "offerre":
      return (
        <svg {...common}>
          <path d="M9 7c3-3.2 7-1.6 7 .6M9 7C6 10.2 2 8.6 2 6.4" fill="none" stroke={c} strokeOpacity=".7" />
          <circle cx="9" cy="7" r="1.8" fill={c} />
        </svg>
      );
    case "pipeline":
      return (
        <svg {...common}>
          <ellipse cx="9" cy="7" rx="6.5" ry="2.6" fill="none" stroke={c} strokeOpacity=".35" />
          <circle cx="5.5" cy="8" r="2" fill="#f5c890" />
          <circle cx="13" cy="5.6" r="1.5" fill={c} />
        </svg>
      );
    case "insertcoin":
      return (
        <svg {...common}>
          <circle cx="8" cy="7" r="5.5" fill={c} fillOpacity=".18" />
          <circle cx="10.5" cy="6" r="3.2" fill="#72e6ff" fillOpacity=".22" />
          <circle cx="9" cy="7" r="1.2" fill="#fff" />
        </svg>
      );
    case "late":
      return (
        <svg {...common}>
          <path d="M9 3 3 11M9 3l2 8M9 3l7 6" fill="none" stroke={c} strokeOpacity=".6" />
          <circle cx="9" cy="3" r="1.6" fill={c} />
        </svg>
      );
    case "skills":
      return (
        <svg {...common}>
          <g fill={c}>
            <circle cx="5" cy="6" r="1.1" />
            <circle cx="8.5" cy="3.5" r=".8" />
            <circle cx="9.5" cy="7.5" r="1.4" />
            <circle cx="13" cy="9.5" r=".9" />
            <circle cx="13.5" cy="4.5" r=".7" />
            <circle cx="6" cy="10.5" r=".7" />
          </g>
        </svg>
      );
    case "kontakt":
      return (
        <svg {...common}>
          <path d="M1.5 12.5 16.5 1.5" stroke={c} strokeOpacity=".45" />
          <circle cx="9" cy="7" r="3.8" fill="none" stroke={c} strokeOpacity=".5" />
          <circle cx="9" cy="7" r="1.6" fill={c} />
        </svg>
      );
  }
}
