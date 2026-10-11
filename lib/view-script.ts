/*
 * Bewusst ohne Imports: wird vom Root-Layout (Server) eingebunden.
 * Gegenstück zur Laufzeit: lib/view.ts.
 */

/**
 * Läuft synchron im <head>. Liste, wenn: `?view=list`, kein WebGL 2, nur
 * Software-Rendering (failIfMajorPerformanceCaveat) oder ein sehr schwaches
 * Gerät. `?view=sky` erzwingt den Himmel. Ohne JavaScript bleibt das Attribut
 * leer — dann zeigt das CSS die Liste.
 */
export const VIEW_SCRIPT = `(function(){var d=document.documentElement,v="sky",r="";try{var q=new URLSearchParams(location.search).get("view");if(q==="list"){v="list";r="user"}else if(q!=="sky"){var g=document.createElement("canvas").getContext("webgl2",{failIfMajorPerformanceCaveat:true});if(g){var x=g.getExtension("WEBGL_lose_context");x&&x.loseContext()}else{var h=document.createElement("canvas").getContext("webgl2");v="list";r=h?"weak":"webgl";if(h){var y=h.getExtension("WEBGL_lose_context");y&&y.loseContext()}}var n=navigator;if(v==="sky"&&n.hardwareConcurrency&&n.hardwareConcurrency<3&&n.deviceMemory&&n.deviceMemory<2){v="list";r="weak"}}}catch(e){v="list";r="webgl"}d.dataset.view=v;if(r)d.dataset.why=r})();`;
