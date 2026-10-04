// Ripples map explorer. A Mapbox satellite map with the mockup's 3D pins, route,
// panels and navigation (from ripples-climate-map.html); the data now comes from /api/explore,
// so risk, gaps and the scorecard follow the server's fixed rules (S4), and
// follow-up letters go through the approval gate (S2).
import { toCities } from "./adapter.js";
import { schematic } from "../shared/schematic.js";
import { verifyRecord, short } from "../shared/ledger.js";

const api = {
  async get(p) { const r = await fetch("/api" + p); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`); return d; },
  async post(p, body = {}) { const r = await fetch("/api" + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`); return d; },
};
// Report ids submitted from this browser, to highlight "your" evidence. Never sent anywhere.
const MINE_KEY = "ripples-my-reports";
function loadMine() { try { return new Set(JSON.parse(localStorage.getItem(MINE_KEY) || "[]")); } catch { return new Set(); } }
function saveMine(id) { const s = loadMine(); s.add(id); try { localStorage.setItem(MINE_KEY, JSON.stringify([...s])); } catch { /* storage blocked */ } }
const FORCE_NOGL = new URLSearchParams(location.search).has("nogl");

let GEO, boot, CFG;
try {
  [GEO, boot, CFG] = await Promise.all([fetch("/data/ph-geo.json").then((r) => r.json()), api.get("/explore"), api.get("/config").catch(() => ({}))]);
} catch (e) {
  document.body.insertAdjacentHTML("beforeend", `<p class="nogl">Could not load the map data (${String(e.message).replace(/</g, "&lt;")}). Is the server running?</p>`);
  throw e;
}
const AS_OF = boot.as_of;
const CITIES = toCities(boot, { mine: loadMine() });

/* ================= helpers ================= */
const $=s=>document.querySelector(s);
const esc=t=>String(t??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
const MONS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const ym=s=>{const[y,m]=s.split("-").map(Number);return y*12+m-1;};
const fmtYM=s=>{if(!s)return"—";const[y,m]=s.split("-").map(Number);return MONS[m-1]+" "+y;};
const NOW=ym(AS_OF);
const fmtLat=v=>`${Math.abs(v).toFixed(3)}°N`, fmtLon=v=>`${Math.abs(v).toFixed(3)}°E`;
function km(a,b){const R=6371,r=Math.PI/180,dLa=(b.lat-a.lat)*r,dLo=(b.lon-a.lon)*r;const h=Math.sin(dLa/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLo/2)**2;return Math.round(2*R*Math.asin(Math.sqrt(h)));}
let toastT;function toast(msg,btn,fn){$("#toastMsg").textContent=msg;const b=$("#toastBtn");b.hidden=!btn;if(btn){b.textContent=btn;b.onclick=()=>{$("#toast").classList.remove("on");fn();};}
  $("#toast").classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>$("#toast").classList.remove("on"),btn?7000:2800);}

/* ================= rules: risk, gaps, scorecard ================= */
const RISK={Low:{css:"#35e39a",hex:0x35e39a,n:1},Moderate:{css:"#ffd23f",hex:0xffd23f,n:2},High:{css:"#ff8a2b",hex:0xff8a2b,n:3},Critical:{css:"#ff2e5b",hex:0xff2e5b,n:4}};
const STAT={"Not started":{css:"#8ea0c4",hex:0x8ea0c4},"In progress":{css:"#4cc3ff",hex:0x4cc3ff},"Completed":{css:"#35e39a",hex:0x35e39a},"Delayed":{css:"#ffae2b",hex:0xffae2b}};
const ADVC={Heat:"#ff8a2b",Rain:"#4cc3ff",Flood:"#4c8dff",Typhoon:"#ff2e5b",Drought:"#d9a35b",Thunderstorm:"#b18cff",Coastal:"#3fd6d6"};
// Risk, gaps and the scorecard come from the server's fixed rules (S4).
const gapOf=p=>p.gap;
const gapsOf=c=>c.projects.filter(gapOf);
const advisoriesOf=c=>c.advisories;
const riskOf=c=>c.risk;
const scoreOf=c=>c.score;
const statusLabel=p=>p.status==="Not started"&&gapOf(p)?"Not started · overdue":p.status;


/* ================= photo store (this device only; photos are never uploaded) ================= */
const Photos=(()=>{let dbp;const cache=new Map();
  function db(){if(!dbp)dbp=new Promise((res,rej)=>{try{const r=indexedDB.open("ripples-climate",1);r.onupgradeneeded=()=>r.result.createObjectStore("p");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}catch(e){rej(e);}});return dbp;}
  async function get(id){if(cache.has(id))return cache.get(id);let rec=null;try{const d=await db();rec=await new Promise(r=>{const q=d.transaction("p").objectStore("p").get(id);q.onsuccess=()=>r(q.result||null);q.onerror=()=>r(null);});}catch(e){}
    const v=rec?{url:URL.createObjectURL(rec.blob),meta:rec.meta}:null;cache.set(id,v);return v;}
  async function put(id,blob,meta){const cur=cache.get(id);if(cur)URL.revokeObjectURL(cur.url);cache.set(id,{url:URL.createObjectURL(blob),meta});try{const d=await db();d.transaction("p","readwrite").objectStore("p").put({blob,meta},id);}catch(e){}}
  return{get,put};})();
function stripToJpeg(file){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>{const max=1800,s=Math.min(1,max/Math.max(img.width,img.height));const cv=document.createElement("canvas");cv.width=Math.round(img.width*s);cv.height=Math.round(img.height*s);
  cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);cv.toBlob(b=>b?res(b):rej(new Error("encode")),"image/jpeg",.86);URL.revokeObjectURL(img.src);};img.onerror=()=>rej(new Error("read"));img.src=URL.createObjectURL(file);});}

/* ================= Mapbox map + three.js pins ================= */
// The base map is Mapbox (satellite imagery with streets and place names). Our
// pins, beams, pulses and gap rings are three.js objects drawn inside the map as
// a custom 3D layer, so they move with it. Without a token or WebGL, every City
// Page still opens from the city log.
const STYLE="mapbox://styles/mapbox/satellite-streets-v12";
const PH_BOUNDS=[[116.9,4.6],[126.7,19.4]];
const SPREAD=1; // projects sit at their recorded approximate coordinates
const CITY_PX=14,PROJ_PX=52; // on-screen pixels per pin unit
const C=CITIES;
let noGL=FORCE_NOGL||!window.mapboxgl||!window.THREE||!(CFG&&CFG.mapbox_token);
let map,renderer,scene,camera,traveler,ORIGIN,KM,L;
const cityPins=[],projPins=[],evacPins=[],facing=[];
const cityLL=i=>[C[i].lon,C[i].lat];
const projLL=(ci,pi)=>{const c=C[ci],p=c.projects[pi];return[c.lon+p.dx*SPREAD,c.lat+p.dy*SPREAD];};
const evacLL=(c,e)=>[c.lon+e[2]*SPREAD,c.lat+e[3]*SPREAD];
// Scene units are kilometres around ORIGIN; x east, y up, z south (as Mercator y).
const toScene=(ll,alt=0)=>{const m=mapboxgl.MercatorCoordinate.fromLngLat(ll);return new THREE.Vector3((m.x-ORIGIN.x)/KM,alt,(m.y-ORIGIN.y)/KM);};
const pxUnit=()=>1/(512*Math.pow(2,map.getZoom())*KM); // scene units per screen pixel
function glowTex(){const c=document.createElement("canvas");c.width=c.height=64;const g=c.getContext("2d");const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,"rgba(255,255,255,1)");gr.addColorStop(.25,"rgba(255,255,255,.55)");gr.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
// A glow that always faces the camera (sprites don't work inside Mapbox's camera).
function glowPlane(tex,col,size,op){const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshBasicMaterial({map:tex,color:col,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:op,side:THREE.DoubleSide}));facing.push(m);return m;}
function showNoGL(msg){const m=document.createElement("p");m.className="nogl";m.textContent=msg;document.body.appendChild(m);}

// Readiness route between consecutive cities, as gently curved lines.
function arcLL(a,b,n=64){const[x1,y1]=a,[x2,y2]=b,dx=x2-x1,dy=y2-y1,mx=(x1+x2)/2-dy*.18,my=(y1+y2)/2+dx*.18,pts=[];
  for(let i=0;i<=n;i++){const t=i/n,u=1-t;pts.push([u*u*x1+2*u*t*mx+t*t*x2,u*u*y1+2*u*t*my+t*t*y2]);}return pts;}
const chain=[];for(let i=0;i<C.length-1;i++)chain.push({a:i,b:i+1,pts:arcLL(cityLL(i),cityLL(i+1)),len:km(C[i],C[i+1])});
const pointAt=(pts,u)=>{const f=Math.max(0,Math.min(1,u))*(pts.length-1),i=Math.min(pts.length-2,Math.floor(f)),k=f-i;return[pts[i][0]+(pts[i+1][0]-pts[i][0])*k,pts[i][1]+(pts[i+1][1]-pts[i][1])*k];};
const DASH=[[0,4,3],[.5,4,2.5],[1,4,2],[1.5,4,1.5],[2,4,1],[2.5,4,.5],[3,4,0],[0,.5,3,3.5],[0,1,3,3],[0,1.5,3,2.5],[0,2,3,2],[0,2.5,3,1.5],[0,3,3,1],[0,3.5,3,.5]];
// The active segment lights up behind the traveler.
function gradAt(u,rev){const O="rgba(240,95,60,0)",F="rgba(255,140,110,.9)";if(u==null)return["interpolate",["linear"],["line-progress"],0,O,1,O];
  const b=Math.min(.996,Math.max(.003,u));
  return rev?["interpolate",["linear"],["line-progress"],0,O,b-.002,O,b,"#ffffff",1,F]:["interpolate",["linear"],["line-progress"],0,F,b,"#ffffff",b+.002,O,1,O];}
function addRoute(){
  map.addSource("route",{type:"geojson",lineMetrics:true,data:{type:"FeatureCollection",features:chain.map((r,k)=>({type:"Feature",properties:{k},geometry:{type:"LineString",coordinates:r.pts}}))}});
  map.addLayer({id:"route-glow",type:"line",source:"route",layout:{"line-cap":"round"},paint:{"line-color":"#f05f3c","line-width":10,"line-blur":8,"line-opacity":.45}});
  map.addLayer({id:"route-line",type:"line",source:"route",layout:{"line-cap":"round"},paint:{"line-color":"#f05f3c","line-width":2.4,"line-opacity":.8}});
  map.addLayer({id:"route-dash",type:"line",source:"route",paint:{"line-color":"#ffe4d8","line-width":2.4,"line-opacity":.9,"line-dasharray":DASH[0]}});
  map.addLayer({id:"route-active",type:"line",source:"route",filter:["==",["get","k"],-1],layout:{"line-cap":"round"},paint:{"line-width":6,"line-gradient":gradAt(null)}});}

function initScene(){
  ORIGIN=mapboxgl.MercatorCoordinate.fromLngLat([122,12.85],0);KM=ORIGIN.meterInMercatorCoordinateUnits()*1000;
  // scene (x, y up, z) -> Mercator (x, y, altitude)
  L=new THREE.Matrix4().makeTranslation(ORIGIN.x,ORIGIN.y,0).scale(new THREE.Vector3(KM,-KM,KM)).multiply(new THREE.Matrix4().makeRotationX(Math.PI/2));
  scene=new THREE.Scene();camera=new THREE.Camera();
  const gtex=glowTex(),ADD=THREE.AdditiveBlending;
  // city pins
  C.forEach((c,i)=>{const g=new THREE.Group();g.position.copy(toScene(cityLL(i)));
    const mk=(geo,col,op,extra)=>new THREE.Mesh(geo,new THREE.MeshBasicMaterial(Object.assign({color:col,transparent:true,opacity:op,blending:ADD,depthWrite:false},extra||{})));
    const beam=mk(new THREE.CylinderGeometry(.06,.06,1,8,1,true),0xffffff,.95),halo=mk(new THREE.CylinderGeometry(.22,.22,1,12,1,true),0xffffff,.14);
    const head=new THREE.Mesh(new THREE.OctahedronGeometry(.42),new THREE.MeshBasicMaterial({color:0xffffff}));
    const spr=glowPlane(gtex,0xffffff,2.4,.9);
    const base=new THREE.Mesh(new THREE.RingGeometry(.75,.86,48),new THREE.MeshBasicMaterial({color:0x8fb4e8,transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false}));base.rotation.x=-Math.PI/2;base.position.y=.04;
    const arc=mk(new THREE.RingGeometry(.75,.98,64,1,Math.PI/2,-Math.PI*2*.001),0x35e39a,.95,{side:THREE.DoubleSide});arc.rotation.x=-Math.PI/2;arc.position.y=.05;
    const pulse=mk(new THREE.RingGeometry(.9,1.0,48),0xffffff,.6,{side:THREE.DoubleSide});pulse.rotation.x=-Math.PI/2;pulse.position.y=.06;
    g.add(beam,halo,head,spr,base,arc,pulse);scene.add(g);
    cityPins.push({g,beam,halo,head,spr,arc,pulse,h:2,hT:2,hover:false,col:new THREE.Color()});});
  // project pins and evacuation markers
  C.forEach((c,ci)=>{projPins[ci]=[];evacPins[ci]=[];
    c.projects.forEach((p,pi)=>{const g=new THREE.Group();g.position.copy(toScene(projLL(ci,pi)));g.visible=false;const col=new THREE.Color(STAT[p.status].hex);const h=.35+p.progress/100*.5;
      const beam=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,h,6,1,true),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.95,blending:ADD,depthWrite:false}));beam.position.y=h/2;
      const head=new THREE.Mesh(new THREE.OctahedronGeometry(.07),new THREE.MeshBasicMaterial({color:col}));head.position.y=h+.08;
      const spr=glowPlane(gtex,col,.4,.8);spr.position.y=h+.08;
      const ring=new THREE.Mesh(new THREE.RingGeometry(.12,.15,32),new THREE.MeshBasicMaterial({color:gapOf(p)?(gapOf(p)==="Overdue"?0xff2e5b:0xd8799a):col,transparent:true,opacity:.8,side:THREE.DoubleSide,blending:ADD,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.02;
      g.add(beam,head,spr,ring);scene.add(g);projPins[ci].push({g,head,spr,ring,h,hover:false,gap:!!gapOf(p),col});});
    c.evac.forEach(e=>{const g=new THREE.Group();g.position.copy(toScene(evacLL(c,e)));g.visible=false;
      const m=new THREE.Mesh(new THREE.BoxGeometry(.09,.09,.09),new THREE.MeshBasicMaterial({color:0x35e39a}));m.position.y=.06;g.add(m);scene.add(g);evacPins[ci].push(g);});});
  traveler=new THREE.Group();traveler.add(new THREE.Mesh(new THREE.SphereGeometry(.3,16,12),new THREE.MeshBasicMaterial({color:0xffffff})),glowPlane(gtex,0xf26b4c,4,1));traveler.visible=false;scene.add(traveler);
  buildLabels();}

const layer={id:"ripples-3d",type:"custom",renderingMode:"3d",
  onAdd(m,gl){renderer=new THREE.WebGLRenderer({canvas:m.getCanvas(),context:gl,antialias:true});renderer.autoClear=false;},
  render(gl,matrix){camera.projectionMatrix=new THREE.Matrix4().fromArray(matrix).multiply(L);frame();
    if(renderer.resetState)renderer.resetState();else renderer.state.reset();renderer.render(scene,camera);labelLoop();map.triggerRepaint();}};

function refreshPins(){if(noGL||!scene)return;C.forEach((c,i)=>{const r=riskOf(c),sc=scoreOf(c),p=cityPins[i];p.col.set(RISK[r.lvl].hex);p.hT=1.4+r.s*1.15;
  [p.beam,p.halo,p.spr,p.pulse].forEach(m=>m.material.color.copy(p.col));
  p.arc.geometry.dispose();p.arc.geometry=new THREE.RingGeometry(.75,.98,64,1,Math.PI/2,-Math.PI*2*Math.max(.001,(sc.kept??0)/100));});}

/* ================= world labels ================= */
const world=$("#world");const wls=[];
function addWL(cls,html,o){const el=document.createElement("div");el.className="wl "+cls;el.innerHTML=html;world.appendChild(el);const w=Object.assign({el,cls},o||{});wls.push(w);return w;}
function buildLabels(){
  C.forEach((c,i)=>{const w=addWL("pin","",{city:i});w.el.addEventListener("click",()=>{if(mode==="map"&&!busy)enterCity(i);});
    w.el.addEventListener("pointerenter",()=>setHover({kind:"city",i}));w.el.addEventListener("pointerleave",()=>setHover(null));
    c.projects.forEach((p,pi)=>{const short=p.name.split(/[,(]/)[0].trim();const s=addWL("ppin",`<i></i>${esc(short.length>30?short.slice(0,28)+"…":short)}`,{proj:[i,pi],gap:!!gapOf(p)});
      s.el.style.setProperty("--c",gapOf(p)?(gapOf(p)==="Overdue"?"#ff2e5b":"#d8799a"):STAT[p.status].css);
      s.el.addEventListener("click",()=>{if(mode==="city"&&!busy&&cur.c===i)openProject(pi);});
      s.el.addEventListener("pointerenter",()=>setHover({kind:"proj",ci:i,pi}));s.el.addEventListener("pointerleave",()=>setHover(null));});
    c.evac.forEach((e,k)=>addWL("evac","EVAC",{evac:i,g:evacPins[i][k]}));});}
function refreshCityLabels(){wls.forEach(w=>{if(w.city==null)return;const c=C[w.city],r=riskOf(c);w.el.style.setProperty("--c",RISK[r.lvl].css);w.el.innerHTML=`<i></i>${esc(c.name.replace(" City",""))} <b>${r.lvl.toUpperCase()}</b>`;w.ww=null;});}

/* ================= HUD ================= */
let filter="all";
function renderFilters(){const cnt={};C.forEach(c=>{const l=riskOf(c).lvl;cnt[l]=(cnt[l]||0)+1;});
  $("#filters").innerHTML=`<button class="chip ${filter==="all"?"on":""}" data-f="all" aria-pressed="${filter==="all"}">All cities <b>${C.length}</b></button>`+
    Object.keys(RISK).map(k=>`<button class="chip ${filter===k?"on":""}" data-f="${k}" aria-pressed="${filter===k}"><i class="dot" style="--c:${RISK[k].css}"></i>${k} <b>${cnt[k]||0}</b></button>`).join("");}
$("#filters").addEventListener("click",e=>{const b=e.target.closest(".chip");if(!b)return;filter=b.dataset.f;renderFilters();renderLog();});
const pass=c=>filter==="all"||riskOf(c).lvl===filter;
function renderLog(){const all=C.flatMap(c=>c.projects),gaps=all.filter(gapOf).length,crit=C.filter(c=>["High","Critical"].includes(riskOf(c).lvl)).length;
  $("#nat").innerHTML=`<div><b>${all.length}</b><span>commitments tracked</span></div><div><b style="color:var(--crit)">${gaps}</b><span>open gaps</span></div><div><b style="color:var(--high)">${crit}</b><span>cities high or critical</span></div>`;
  $("#logBody").innerHTML=C.map((c,i)=>{const r=riskOf(c),s=scoreOf(c),g=gapsOf(c).length;
    return `<button class="row ${pass(c)?"":"off"}" data-i="${i}" style="--c:${RISK[r.lvl].css}"><span class="row-n">${String(i+1).padStart(2,"0")}</span>
      <span class="row-t"><span class="row-name">${esc(c.name)}${c.pilot?'<span class="pilot">PILOT</span>':""}</span><span class="row-loc">${esc(c.prov)} · ${esc(c.hazards.join(", "))}</span></span>
      <span class="row-r"><span class="rk">${r.lvl}</span><span class="row-sub">${g} gap${g===1?"":"s"} · ${s.kept??"—"}% kept</span></span></button>`;}).join("");
  if(!noGL)cityPins.forEach((p,i)=>p.g.visible=pass(C[i]));}
$("#logBody").addEventListener("click",e=>{const r=e.target.closest(".row");if(r&&!busy){enterCity(+r.dataset.i);if(innerWidth<=760)setLog(false);}});
$("#logBody").addEventListener("pointerover",e=>{const r=e.target.closest(".row");setHover(r?{kind:"city",i:+r.dataset.i}:null);});
$("#logBody").addEventListener("pointerleave",()=>setHover(null));
function setLog(open){$("#log").classList.toggle("collapsed",!open);$("#logToggle").textContent=open?"Hide":"Show";$("#logToggle").setAttribute("aria-expanded",open);}
$("#logToggle").addEventListener("click",()=>setLog($("#log").classList.contains("collapsed")));
if(innerWidth<=760)setLog(false);

/* hover */
let hover=null;const tip=$("#tip");
const sameH=(a,b)=>a&&b&&a.kind===b.kind&&(a.kind==="city"?a.i===b.i:a.ci===b.ci&&a.pi===b.pi);
function setHover(h){if(sameH(h,hover)||(!h&&!hover))return;hover=h;
  cityPins.forEach((p,i)=>p.hover=!!h&&h.kind==="city"&&h.i===i);
  projPins.forEach((arr,ci)=>arr.forEach((p,pi)=>p.hover=!!h&&h.kind==="proj"&&h.ci===ci&&h.pi===pi));
  document.querySelectorAll(".row.hot,.prow.hot,.wl.hot").forEach(r=>r.classList.remove("hot"));
  if(h&&h.kind==="city"){document.querySelector(`.row[data-i="${h.i}"]`)?.classList.add("hot");wls.find(w=>w.city===h.i)?.el.classList.add("hot");
    const c=C[h.i],r=riskOf(c),s=scoreOf(c);tip.style.setProperty("--c",RISK[r.lvl].css);
    tip.innerHTML=`<div class="tip-n">${esc(c.name)}</div><div class="tip-l">${esc(c.prov)} · ${esc(c.hazards.join(", "))}</div><div class="tip-r"><em>${r.lvl.toUpperCase()} RISK</em><span>${gapsOf(c).length} open gaps</span></div><div class="tip-r"><span>Promises kept on time</span><span>${s.kept??"—"}%</span></div><div class="tip-k">CLICK TO OPEN CITY PAGE ▸</div>`;
    tip.hidden=mode!=="map";}
  else if(h&&h.kind==="proj"){document.querySelector(`.prow[data-p="${h.pi}"]`)?.classList.add("hot");wls.find(w=>w.proj&&w.proj[0]===h.ci&&w.proj[1]===h.pi)?.el.classList.add("hot");
    const p=C[h.ci].projects[h.pi],g=gapOf(p);tip.style.setProperty("--c",g?"#ff2e5b":STAT[p.status].css);
    tip.innerHTML=`<div class="tip-n">${esc(p.name)}</div><div class="tip-l">${esc(p.agency)} · ${esc(p.type)}</div><div class="tip-r"><em>${esc(statusLabel(p).toUpperCase())}</em><span>${p.progress}%</span></div>${g?`<div class="tip-r"><em>${g.toUpperCase()}</em></div>`:""}<div class="tip-k">CLICK FOR EVIDENCE ▸</div>`;
    tip.hidden=mode!=="city";}
  else tip.hidden=true;
  if(map)map.getCanvas().style.cursor=h?"pointer":"";}

/* ================= search: projects and cities ================= */
// Matches every word against the name, city, type, agency, office and summary
// (so river and barangay names work too); picking a result follows the same
// route as a shared link (#/project/<id> or #/city/<id>).
const norm=s=>String(s??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const INDEX=[...C.map((c,ci)=>({kind:"city",ci,name:c.name,hay:norm([c.name,c.prov,c.region,c.hazards.join(" ")].join(" "))})),
  ...C.flatMap((c,ci)=>c.projects.map((p,pi)=>({kind:"proj",ci,pi,name:p.name,hay:norm([p.name,c.name,c.prov,p.type,p.agency,p.office,p.summary,p.status,gapOf(p)||""].join(" "))})))];
function searchFor(q){const terms=norm(q).split(/\s+/).filter(Boolean);if(!terms.length)return[];
  return INDEX.map(it=>{const n=norm(it.name);let sc=it.kind==="city"?2:0;
    for(const t of terms){if(!it.hay.includes(t))return null;sc+=n.startsWith(t)?6:n.includes(" "+t)?4:n.includes(t)?3:1;}return{it,sc};})
    .filter(Boolean).sort((a,b)=>b.sc-a.sc||a.it.name.localeCompare(b.it.name)).slice(0,10).map(x=>x.it);}
const qIn=$("#q"),qOut=$("#qres");let qRes=[],qSel=0;
function markHits(text){const terms=norm(qIn.value).split(/\s+/).filter(t=>t.length>1);let out=esc(text);
  for(const t of terms){const i=norm(text).indexOf(t);if(i>=0){out=esc(text.slice(0,i))+"<mark>"+esc(text.slice(i,i+t.length))+"</mark>"+esc(text.slice(i+t.length));break;}}return out;}
function paintSearch(){const q=qIn.value.trim();qOut.hidden=!q;qIn.setAttribute("aria-expanded",String(!!q));if(!q)return;
  qOut.innerHTML=qRes.length?qRes.map((it,k)=>{const c=C[it.ci];
    if(it.kind==="city"){const r=riskOf(c);return `<li role="option" class="city" id="qo${k}" data-k="${k}" aria-selected="${k===qSel}" style="--c:${RISK[r.lvl].css}"><i></i><span><b>${markHits(c.name)}</b><small>City · ${c.projects.length} commitments · ${r.lvl} risk</small></span></li>`;}
    const p=c.projects[it.pi],g=gapOf(p);
    return `<li role="option" id="qo${k}" data-k="${k}" aria-selected="${k===qSel}" style="--c:${g?(g==="Overdue"?"#ff2e5b":"#d8799a"):STAT[p.status].css}"><i></i><span><b>${markHits(p.name)}</b><small>${esc(c.name)} · ${esc(p.type)} · ${esc(statusLabel(p))}${g==="Needs maintenance"?" · needs maintenance":""}</small></span></li>`;}).join("")
    :`<li class="none">No project or city matches “${esc(q)}”.</li>`;
  if(qRes.length){qIn.setAttribute("aria-activedescendant","qo"+qSel);$("#qo"+qSel)?.scrollIntoView({block:"nearest"});}else qIn.removeAttribute("aria-activedescendant");}
function pickSearch(k){const it=qRes[k];if(!it)return;qIn.value="";qRes=[];paintSearch();qIn.blur();if(innerWidth<=760)setLog(false);
  const h=it.kind==="city"?`#/city/${C[it.ci].id}`:`#/project/${C[it.ci].projects[it.pi].id}`;if(location.hash!==h)location.hash=h;}
qIn.addEventListener("input",()=>{qRes=searchFor(qIn.value);qSel=0;paintSearch();});
qIn.addEventListener("keydown",e=>{if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();if(!qRes.length)return;qSel=(qSel+(e.key==="ArrowDown"?1:qRes.length-1))%qRes.length;paintSearch();}
  else if(e.key==="Enter"){e.preventDefault();pickSearch(qSel);}else if(e.key==="Escape"){qIn.value="";qRes=[];paintSearch();qIn.blur();}});
qIn.addEventListener("focus",()=>{if(qIn.value.trim())paintSearch();});
qIn.addEventListener("blur",()=>setTimeout(()=>{qOut.hidden=true;qIn.setAttribute("aria-expanded","false");},150));
qOut.addEventListener("mousedown",e=>{const li=e.target.closest("[data-k]");if(li){e.preventDefault();pickSearch(+li.dataset.k);}});
qOut.addEventListener("mousemove",e=>{const li=e.target.closest("[data-k]");if(li&&+li.dataset.k!==qSel){qSel=+li.dataset.k;qOut.querySelectorAll("[data-k]").forEach(x=>x.setAttribute("aria-selected",String(+x.dataset.k===qSel)));}});
addEventListener("keydown",e=>{if(e.key==="/"&&!e.target.matches("input,textarea,select")&&[...document.querySelectorAll(".modal")].every(m=>m.hidden)&&mode!=="project"){e.preventDefault();qIn.focus();}});

/* ================= camera & state machine ================= */
let mode="map",busy=false,cur={c:-1,p:-1},trail=[],navKeep=false;
function setMode(m){mode=m;document.body.className="mode-"+m+((m==="city"||m==="project"||(m==="fly"&&navKeep))?" nav-on":"");if(m!=="map"&&m!=="city")tip.hidden=true;
  if(!noGL){projPins.forEach((arr,ci)=>arr.forEach(p=>p.g.visible=(m==="city"||m==="project"||m==="fly")&&ci===cur.c));evacPins.forEach((arr,ci)=>arr.forEach(e=>e.visible=(m==="city"||m==="project")&&ci===cur.c));}}
setMode("map");
let anim=null;const easeIO=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2,easeS=k=>-(Math.cos(Math.PI*k)-1)/2;
function run(dur,step,cb,ease){if(noGL){cb&&cb();return;}anim={t0:performance.now(),dur:reduced?Math.min(dur,350):dur,step,cb,ease:ease||easeIO};}
// Camera moves are Mapbox easeTo/flyTo. Padding keeps the city clear of the City Page panel.
const NOPAD={top:0,bottom:0,left:0,right:0};
const ovPad=()=>innerWidth>900?{top:60,bottom:30,left:360,right:40}:{top:90,bottom:40,left:16,right:16};
const panelPad=()=>innerWidth>760?{top:70,bottom:100,left:Math.min(520,innerWidth*.5)+40,right:50}:{top:70,bottom:Math.round(innerHeight*.58)+24,left:24,right:24};
function boundsOf(lls){const b=new mapboxgl.LngLatBounds(lls[0],lls[0]);lls.forEach(l=>b.extend(l));return b;}
function fitZoom(b,padding,max){const c=map.cameraForBounds(b,{padding});return Math.min(max,c&&c.zoom?c.zoom:max);}
const overviewCam=()=>noGL?null:{center:boundsOf(PH_BOUNDS).getCenter(),zoom:fitZoom(PH_BOUNDS,ovPad(),7)+.3,pitch:35,bearing:0,padding:ovPad()};
function cityCam(ci){if(noGL)return null;const c=C[ci],b=boundsOf([cityLL(ci),...c.projects.map((_,pi)=>projLL(ci,pi)),...c.evac.map(e=>evacLL(c,e))]);
  return{center:b.getCenter(),zoom:fitZoom(b,panelPad(),14.5)-.35,pitch:55,bearing:map.getBearing(),padding:panelPad()};}
const projCam=(ci,pi)=>noGL?null:{center:projLL(ci,pi),zoom:16,pitch:62,bearing:map.getBearing(),padding:NOPAD};
function camTo(o,dur,cb,fly){if(noGL||!o){cb&&cb();return;}const d=reduced?Math.min(dur,350):dur;map.stop();
  (fly&&!reduced?map.flyTo:map.easeTo).call(map,{...o,duration:d,essential:true,curve:1.5});if(cb)setTimeout(cb,d+40);}
function findRoute(a,b){for(const r of chain){if(r.a===a&&r.b===b)return{r,rev:false};if(r.a===b&&r.b===a)return{r,rev:true};}return null;}
// Fly to the next city while the traveler runs along the route.
let travelU=null;
function travel(a,b,cb){if(noGL){cb&&cb();return;}const fr=findRoute(a,b),dur=fr?Math.min(3800,1700+fr.r.len*1.7):2600;
  camTo(cityCam(b),dur,cb,true);if(!fr)return;
  const{r,rev}=fr;map.setFilter("route-active",["==",["get","k"],chain.indexOf(r)]);traveler.visible=true;
  run(dur,k=>{const u=rev?1-k:k;travelU={r,u,lift:Math.sin(Math.PI*k)};map.setPaintProperty("route-active","line-gradient",gradAt(u,rev));},
    ()=>{traveler.visible=false;travelU=null;map.setFilter("route-active",["==",["get","k"],-1]);},easeS);}
const flash=()=>{const f=$("#flash");f.classList.remove("go");void f.offsetWidth;f.classList.add("go");};
const cityPanel=$("#city"),projPanel=$("#proj");
function showCity(ci){cur={c:ci,p:-1};renderCity();cityPanel.hidden=false;setMode("city");updateNav();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{cityPanel.classList.add("open");cityPanel.scrollTop=0;}));
  if(pendingProj>=0){const p=pendingProj;pendingProj=-1;setTimeout(()=>openProject(p),reduced?0:650);}else setRoute();}
function hideCity(cb){if(cityPanel.hidden){cb&&cb();return;}cityPanel.classList.remove("open");setMode("fly");setTimeout(()=>{cityPanel.hidden=true;cb&&cb();},reduced?150:500);}
function showProj(pi){cur.p=pi;renderProject();projPanel.hidden=false;setMode("project");updateNav();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{projPanel.classList.add("open");flash();}));setRoute();}
function hideProj(cb){if(projPanel.hidden){cb&&cb();return;}projPanel.classList.remove("open");setMode("fly");setTimeout(()=>{projPanel.hidden=true;cb&&cb();},reduced?150:540);}
const closeAll=cb=>hideProj(()=>hideCity(cb));
function enterCity(ci){if(busy)return;busy=true;navKeep=false;trail=[];setHover(null);cur.c=ci;setMode("fly");
  camTo(cityCam(ci),1800,()=>{busy=false;showCity(ci);},true);}
function openProject(pi){if(busy||mode!=="city")return;busy=true;navKeep=true;trail.push({c:cur.c,p:-1});setHover(null);const ci=cur.c;
  hideCity(()=>camTo(projCam(ci,pi),1100,()=>{busy=false;showProj(pi);}));}
function goNext(){if(busy)return;navKeep=true;
  if(mode==="city"){busy=true;const a=cur.c,b=(a+1)%C.length;trail.push({c:a,p:-1});hideCity(()=>{cur.c=b;setMode("fly");travel(a,b,()=>{busy=false;showCity(b);});});}
  else if(mode==="project"){busy=true;const ci=cur.c,a=cur.p,b=(a+1)%C[ci].projects.length;trail.push({c:ci,p:a});
    hideProj(()=>camTo(projCam(ci,b),900,()=>{busy=false;showProj(b);}));}}
function goTo(s){busy=true;navKeep=true;const from={...cur};
  const after=()=>{if(s.p<0){cur.c=s.c;setMode("fly");const go=()=>{busy=false;showCity(s.c);};
      if(from.c!==s.c)travel(from.c,s.c,go);else camTo(cityCam(s.c),900,go);}
    else{cur.c=s.c;setMode("fly");camTo(projCam(s.c,s.p),900,()=>{busy=false;showProj(s.p);});}};
  closeAll(after);}
function goBack(){if(busy)return;const s=trail.pop();if(!s){goMap();return;}goTo(s);}
function jump(k){if(busy)return;if(mode==="city"&&k!==cur.c){trail.push({c:cur.c,p:-1});goTo({c:k,p:-1});}else if(mode==="project"&&k!==cur.p){trail.push({c:cur.c,p:cur.p});goTo({c:cur.c,p:k});}}
function goMap(){if(busy)return;busy=true;navKeep=false;trail=[];closeAll(()=>camTo(overviewCam(),1800,()=>{busy=false;cur={c:-1,p:-1};setMode("map");renderLog();setRoute();},true));}

/* ================= routes: #/city/<id>, #/project/<id> ================= */
let pendingProj=-1;
function routeHash(){return mode==="project"?`#/project/${C[cur.c].projects[cur.p].id}`:mode==="city"?`#/city/${C[cur.c].id}`:"";}
function setRoute(){const h=routeHash();if(h===location.hash)return;history.pushState(null,"",h||location.pathname+location.search);}
function parseRoute(){const m=location.hash.match(/^#\/(city|project)\/([\w-]+)$/);if(!m)return null;
  if(m[1]==="city"){const c=C.findIndex(x=>x.id===m[2]);return c<0?null:{c,p:-1};}
  for(let c=0;c<C.length;c++){const p=C[c].projects.findIndex(x=>x.id===m[2]);if(p>=0)return{c,p};}return null;}
function routeTo(t){if(busy){setTimeout(()=>routeTo(t),300);return;}
  if(!t){if(mode!=="map")goMap();return;}
  if((mode==="city"||mode==="project")&&t.c===cur.c&&t.p===(mode==="project"?cur.p:-1))return;
  if(mode==="map"){pendingProj=t.p;enterCity(t.c);return;}
  if(mode==="city"&&t.c===cur.c&&t.p>=0){openProject(t.p);return;}
  goTo(t);}
addEventListener("hashchange",()=>routeTo(parseRoute()));
function updateNav(){const ci=cur.c;if(ci<0)return;const prev=trail[trail.length-1];
  $("#backTo").textContent=!prev?"Philippines map":prev.p<0?(prev.c===ci&&mode==="project"?C[ci].name+" page":C[prev.c].name):C[prev.c].projects[prev.p].name;
  if(mode==="city"){const n=C[(ci+1)%C.length];$("#nextTo").textContent=`${n.name} · ${km(C[ci],n)} km`;
    $("#strip").innerHTML=C.map((c,k)=>`<button style="--c:${RISK[riskOf(c).lvl].css}" class="${k===ci?"cur":""}" data-k="${k}" title="${esc(c.name)}" aria-label="Go to ${esc(c.name)}"><i></i></button>`).join("");}
  else{const ps=C[ci].projects,n=ps[(cur.p+1)%ps.length];$("#nextTo").textContent=n.name;
    $("#strip").innerHTML=ps.map((p,k)=>`<button style="--c:${gapOf(p)?"#ff2e5b":STAT[p.status].css}" class="${k===cur.p?"cur":""}" data-k="${k}" title="${esc(p.name)}" aria-label="Go to ${esc(p.name)}"><i></i></button>`).join("");}}

/* ================= CITY PAGE ================= */
let pFilter="All",cityTab="overview";
function advCard(a){const isNew=false;const col=ADVC[a.type]||"#93a9cf";

  return `<details class="adv ${isNew?"new":""}" style="--c:${col}" ${isNew?"open":""}><summary><span class="atype">${esc(a.type)} · ${esc(a.level)}</span>
    <span class="atitle">${esc(a.title)}${isNew?'<span class="newtag">NEW</span>':""}<small>${esc(a.time)} · ${esc(a.source)}</small></span><span class="atog" aria-hidden="true">+</span></summary>
    <div class="aud"><div><h4>For households</h4><p>${esc(a.households)}</p></div><div><h4>For schools</h4><p>${esc(a.schools)}</p></div>
    <div><h4>For farmers</h4><p>${esc(a.farmers)}</p></div><div><h4>For barangay officials</h4><p>${esc(a.barangay)}</p></div></div></details>`;}
function renderCity(opts){opts=opts||{};const c=C[cur.c],r=riskOf(c),s=scoreOf(c),rc=RISK[r.lvl].css,gs=gapsOf(c),advs=advisoriesOf(c);
  const cnt=k=>k==="All"?c.projects.length:c.projects.filter(p=>p.status===k).length;
  const prows=c.projects.map((p,pi)=>({p,pi})).filter(({p})=>pFilter==="All"||p.status===pFilter).map(({p,pi})=>{const g=gapOf(p),sc=STAT[p.status].css;
    return `<button class="prow" data-p="${pi}" style="--c:${sc}"><span class="bar4"></span><span style="min-width:0"><span class="pn" style="display:block">${esc(p.name)}</span><span class="pm" style="display:block">${esc(p.type)} · ${esc(p.agency)} · due ${fmtYM(p.deadline)}</span></span>
      <span class="pr"><span class="st">${esc(statusLabel(p))}</span>${g?`<span class="flag" style="--fc:${g==="Overdue"?"#ff2e5b":"#d8799a"}">● ${g.toUpperCase()}</span>`:`<span>${p.progress}%</span>`}<span class="mini" style="--p:${p.progress}%"></span></span></button>`;}).join("")||`<p class="meta">No ${pFilter.toLowerCase()} projects in this city.</p>`;
  const hzLine=r.top?`${esc(r.top.type)} · ${esc(r.top.level)}`:"No active advisory";
  const gapLine=gs.length?gs.map(p=>`${esc(p.name.split(/[,(]/)[0].trim())} (${gapOf(p).toLowerCase()})`).join("; "):"None";
  const ci=cur.c,idx=String(ci+1).padStart(2,"0");
  cityPanel.style.setProperty("--c",rc);
  cityPanel.innerHTML=`<div class="c-head">
    <nav class="crumbs" aria-label="Breadcrumb"><span>PH</span><span class="sep">▸</span><span>${esc(c.region)}</span><span class="sep">▸</span><b>${esc(c.prov)}</b>${c.pilot?'<span class="pilot">PILOT CITY</span>':""}<span class="sample">SAMPLE DATA</span></nav>
    <div class="c-title"><h1 class="c-name">${esc(c.name)}</h1><span class="c-count">CITY <b>${idx}</b> / ${C.length}</span></div>
    <div class="c-meta">${c.hazards.map(h=>`<span class="hz">${esc(h)}</span>`).join("")}<span>· ${esc(c.lccap)}</span></div>
    <div class="tabs" role="tablist">${[["overview","Overview"],["projects","Projects"],["prepare","Prepare"],["score","Scorecard"]].map(([k,l])=>`<button role="tab" data-tab="${k}" class="${cityTab===k?"on":""}" aria-selected="${cityTab===k}">${l}</button>`).join("")}</div></div>
  <div class="c-body">
    <section id="t-overview">
      <div class="riskcard ${opts.bump?"bump":""}" style="--c:${rc}"><div class="rk-top"><div><div class="rk-l">REAL-RISK LEVEL</div><div class="rk-big">${r.lvl}</div></div></div>
        <div class="meter">${["Low","Moderate","High","Critical"].map(k=>`<i class="${RISK[k].n<=RISK[r.lvl].n?"f":""}"></i>`).join("")}</div>
        <div class="meter-l"><span>LOW</span><span>MODERATE</span><span>HIGH</span><span>CRITICAL</span></div>
        <ul class="why"><li><b>+${r.h}</b><span>Hazard now: ${hzLine}</span></li><li><b>+${r.g}</b><span>Open gaps: ${gapLine}</span></li><li><b>= ${r.s}</b><span>Score out of 6. Rule-based, so every level can be explained.</span></li></ul>
        <p class="safe">This level does not mean you are safe. Official warnings and evacuation orders always come first: <a href="https://www.pagasa.dost.gov.ph" target="_blank" rel="noopener">PAGASA</a> · <a href="https://ndrrmc.gov.ph" target="_blank" rel="noopener">NDRRMC</a></p></div>
    </section>
    <section><h2 class="sec-h">Advisory board <small>${advs.length} active · newest first</small></h2>${advs.map((a,k)=>advCard(a)).join("")}</section>
    <section id="t-projects"><h2 class="sec-h">Climate projects <small>from the ${esc(c.lccap)}</small></h2>
      <div class="pfil" role="group" aria-label="Filter projects by status">${["All","Not started","In progress","Completed","Delayed"].map(k=>`<button class="chip ${pFilter===k?"on":""}" data-pf="${k}" aria-pressed="${pFilter===k}">${k==="All"?"All":`<i class="dot" style="--c:${STAT[k].css}"></i>${k}`} <b>${cnt(k)}</b></button>`).join("")}</div>
      <div id="plist">${prows}</div></section>
    <section><h2 class="sec-h">Open gaps this season <small>${gs.length} raising the risk level</small></h2>
      ${gs.length?gs.map(p=>{const g=gapOf(p);return `<div class="gap" style="--fc:${g==="Overdue"?"#ff2e5b":"#d8799a"}"><span class="flag">●</span><div><b>${esc(p.name)} · ${g.toLowerCase()}</b><p>Interim measure: ${esc(p.interim||"Assign watchers during advisories.")}</p></div></div>`;}).join(""):`<p class="meta">No open gaps. Every finished defense is maintained.</p>`}</section>
    <section id="t-prepare"><h2 class="sec-h">Seasonal outlook <small>sample · no live PAGASA outlook connected</small></h2><div class="outlook">${c.outlook.map(([m,t])=>`<div><b>${esc(m)}</b><p>${esc(t)}</p></div>`).join("")}</div></section>
    <section><h2 class="sec-h">Evacuation centers <small>green markers on the map</small></h2><ul class="list">${c.evac.map(e=>`<li>${esc(e[0])}<span>${e[1].toLocaleString()} people</span></li>`).join("")}</ul></section>
    <section><h2 class="sec-h">Community actions <small>verified ways to help</small></h2><ul class="list">${c.actions.map(a=>`<li><span style="font-family:var(--f-body);color:var(--ice);font-size:12.5px;white-space:normal"><em>${esc(a[0])}</em>${esc(a[1])}</span><span>${esc(a[2])}</span></li>`).join("")}</ul>
      <p class="note">No money passes through the app. Sponsors give directly to partner NGOs or the LGU.</p></section>
    <section id="t-score"><h2 class="sec-h">Public scorecard <small>as of ${fmtYM(AS_OF)}</small></h2>
      <div class="score"><div><b id="scKept">${s.kept??"—"}%</b><span>Promises kept on time (${s.keptN} of ${s.dueN} due)</span></div><div><b>${s.maint??"—"}%</b><span>Finished defenses maintained (${s.okN} of ${s.doneN})</span></div><div><b id="scFu">${s.rep}/${s.sent}</b><span>Follow-ups answered. ${s.silent} with no reply recorded</span></div></div>
      <p style="margin:10px 0 0"><a class="ledger-link" href="/ledger" target="_blank" rel="noopener">${LEDGER_ICON}<span><b>Record ledger</b> Every commitment in ${esc(c.name)} is fingerprinted (SHA-256) and hash-chained, so past records can't be quietly edited. View ledger ↗</span></a></p></section>
    <section><h2 class="sec-h">Official sources</h2><div class="srcs"><a href="https://www.pagasa.dost.gov.ph" target="_blank" rel="noopener">PAGASA ↗</a><a href="https://ndrrmc.gov.ph" target="_blank" rel="noopener">NDRRMC ↗</a><a href="https://hazardhunter.georisk.gov.ph" target="_blank" rel="noopener">HazardHunterPH ↗</a><a href="https://noah.up.edu.ph" target="_blank" rel="noopener">Project NOAH ↗</a></div></section>
  </div>`;
  updateNav();if(opts.keepScroll==null)cityPanel.scrollTop=0;}
cityPanel.addEventListener("click",e=>{const pr=e.target.closest(".prow");if(pr){openProject(+pr.dataset.p);return;}
  const pf=e.target.closest("[data-pf]");if(pf){pFilter=pf.dataset.pf;const st=cityPanel.scrollTop;renderCity({keepScroll:1});cityPanel.scrollTop=st;return;}
  const tb=e.target.closest("[data-tab]");if(tb){cityTab=tb.dataset.tab;cityPanel.querySelectorAll("[data-tab]").forEach(b=>{b.classList.toggle("on",b===tb);b.setAttribute("aria-selected",b===tb);});
    const sec=$("#t-"+cityTab);if(sec)cityPanel.scrollTo({top:sec.offsetTop-cityPanel.querySelector(".c-head").offsetHeight+4,behavior:reduced?"auto":"smooth"});return;}});
cityPanel.addEventListener("pointerover",e=>{const pr=e.target.closest(".prow");setHover(pr?{kind:"proj",ci:cur.c,pi:+pr.dataset.p}:null);});
cityPanel.addEventListener("pointerleave",()=>setHover(null));

/* ================= PROJECT VIEW ================= */
function renderProject(){const c=C[cur.c],p=c.projects[cur.p],g=gapOf(p),sc=STAT[p.status].css;projPanel.style.setProperty("--c",g?"#ff2e5b":sc);
  $("#pCrumbs").innerHTML=`<span>PH</span><span class="sep">▸</span><span>${esc(c.name)}</span><span class="sep">▸</span><b>${esc(p.type)}</b><span class="sample">SAMPLE DATA</span>`;
  $("#pCount").innerHTML=`PROJECT <b>${cur.p+1}</b> / ${c.projects.length}`;$("#fcoord").textContent=`${fmtLat(c.lat+p.dy)} ${fmtLon(c.lon+p.dx)}`;
  const segs=Array.from({length:20},(_,k)=>`<i style="--k:${k}" class="${k<Math.round(p.progress/5)?"f":""}"></i>`).join("");
  const ms=[];if(p.start)ms.push([p.start,"Work started"]);p.evidence.filter(e=>e[1]==="LGU update").slice().reverse().forEach(e=>ms.push([e[0],e[2]]));ms.push([p.deadline,"Deadline in "+c.lccap]);if(p.done)ms.push([p.done,"Completed"]);
  ms.sort((a,b)=>ym(a[0])-ym(b[0]));const t0=Math.min(ym(ms[0][0]),NOW)-2,t1=Math.max(ym(ms[ms.length-1][0]),NOW)+2,pos=t=>((t-t0)/(t1-t0)*100).toFixed(2)+"%";
  const reply=p.fu.reply?`<p class="reply">${esc(p.fu.reply)}</p>`:p.fu.awaiting?`<p class="reply none">A follow-up letter was sent. The 15-working-day reply clock is running.</p>`:p.fu.sent?`<p class="reply none">No reply recorded since the last follow-up. Silence is shown on the scorecard.</p>`:`<p class="reply none">No follow-up sent yet.</p>`;
  $("#info").innerHTML=`<ol class="rail">
   <li class="step" style="--i:0"><span class="eyebrow">Location</span><p class="loc">${esc(c.name)}, ${esc(c.prov)}</p><p class="meta mono">${fmtLat(c.lat+p.dy)} · ${fmtLon(c.lon+p.dx)}</p></li>
   <li class="step" style="--i:1"><span class="eyebrow">Project</span><h2 class="pname">${esc(p.name)}</h2><p class="meta"><span class="cat">${esc(p.type)}</span>${esc(c.lccap)} commitment · <span class="mono">₱${p.budget}M</span></p><p class="sum">${esc(p.summary)}</p></li>
   <li class="step" style="--i:2"><span class="eyebrow">Current progress</span><div class="prog"><span class="pct" id="pct">0</span><span class="pct-u">%</span></div><div class="bar" role="img" aria-label="${p.progress} percent">${segs}</div><p class="meta">Physical progress · as of ${fmtYM(p.evidence[0]?.[0]||AS_OF)}</p></li>
   <li class="step" style="--i:3"><span class="eyebrow">Status</span><div class="status"><span class="pill" style="--c:${sc}">${esc(p.status)}</span>${g==="Overdue"?'<span class="pill o">Overdue</span>':""}${g==="Needs maintenance"?'<span class="pill m">Needs maintenance</span>':""}${p.maint==="OK"?'<span class="meta">Maintenance checked: OK</span>':""}</div>
     ${g?`<p class="interim"><b>Interim measure:</b> ${esc(p.interim||"Assign watchers during advisories.")}</p>`:""}</li>
   <li class="step" style="--i:4"><span class="eyebrow">Date / timeline</span><div class="tl"><div class="tl-line"></div><div class="tl-done" style="width:${pos(Math.min(NOW,ym(ms[ms.length-1][0])))}"></div>
     ${ms.map(m=>`<span class="tl-m ${ym(m[0])<=NOW?"past":""} ${m[1].startsWith("Deadline")?"dl":""}" style="left:${pos(ym(m[0]))}" title="${esc(fmtYM(m[0]))}: ${esc(m[1])}"></span>`).join("")}<span class="tl-now" style="left:${pos(NOW)}"><span>${fmtYM(AS_OF).toUpperCase()}</span></span></div>
     <ul class="ms">${ms.map(m=>`<li><span class="d">${fmtYM(m[0])}</span><span>${esc(m[1])}</span></li>`).join("")}</ul></li>
   <li class="step" style="--i:5"><span class="eyebrow">Responsible office</span><p class="office">${esc(p.office)}</p><p class="meta">${esc(p.agency)} · follow-ups sent: ${p.fu.sent} · replies: ${p.fu.replied}</p>${reply}
     <div class="pacts"><button class="btn-sm warn" data-act="letter">Draft follow-up letter</button><button class="btn-sm" data-act="report">Submit photo report</button>${p.status==="Completed"?'<button class="btn-sm" data-act="dispute">Dispute "completed"</button>':""}</div></li>
   <li class="step" style="--i:6"><span class="eyebrow">Public rating</span><div class="rating" id="rating" data-pid="${esc(p.id)}">${ratingHTML({...p.rating,mine:null},false)}</div></li>
   <li class="step" style="--i:7"><span class="eyebrow">Evidence</span><ul class="ev">${p.evidence.map(e=>`<li class="${e[4]==="mine"?"mine":""}"><span class="d">${fmtYM(e[0])}</span><span><b>${esc(e[1])}${e[4]==="mine"?" (you)":""} · <span class="${e[3]?"v":"u"}">${e[3]?"corroborated":"unverified"}</span></b>${esc(e[2])}${e[5]&&e[5].length?`<br><small class="u">Flagged for a reviewer: ${esc(e[5].join("; "))}</small>`:""}</span></li>`).join("")}</ul>
     ${p.media.references.length?`<div class="refs"><span class="meta">Source references (linked, not shown)</span><ul>${p.media.references.map(r=>`<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)}</a> <span class="meta">· ${esc(r.source)}</span></li>`).join("")}</ul></div>`:""}</li>
   <li class="step" style="--i:8"><span class="eyebrow">Record integrity · blockchain ledger</span><div id="integrity"><p class="meta">Checking this record against the ledger…</p></div></li></ol>`;
  $("#info").scrollTop=0;
  const el=$("#pct"),to=p.progress,start=performance.now()+700,dur=reduced?1:1100;(function tick(now){const k=Math.max(0,Math.min(1,(now-start)/dur));el.textContent=Math.round(to*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(tick);})(performance.now());
  renderMedia(p);updateNav();loadRating(p);loadIntegrity(p);}
let mediaTok=0;async function renderMedia(p){const tok=++mediaTok;const ph=await Photos.get(p.id);if(tok!==mediaTok)return;
  if(ph){$("#media").innerHTML=`<img class="kb" src="${ph.url}" alt="Citizen photo report: ${esc(p.name)}">`;$("#ftag").textContent=ph.meta.kind==="dispute"?"CITIZEN DISPUTE · UNVERIFIED":"CITIZEN PHOTO · UNVERIFIED";
    $("#fcap").textContent="Your photo stays on this device; location data was stripped. Your written report was sent for triage and stays unverified until two more matching reports or a satellite check back it up.";}
  else if(p.media.photos.length){const r=p.media.photos[0];
    $("#media").innerHTML=`<img class="kb" src="/img/projects/${esc(r.file)}" alt="Reference photo: ${esc(r.title)}">`;$("#ftag").textContent=`REFERENCE PHOTO · ${r.match.toUpperCase()}`;
    $("#fcap").innerHTML=`${esc(r.title)}. Reference only, not this sample project's own record. Photo: ${r.source_url?`<a href="${esc(r.source_url)}" target="_blank" rel="noopener">${esc(r.source)}</a>`:esc(r.source)} (${r.license_url?`<a href="${esc(r.license_url)}" target="_blank" rel="noopener">${esc(r.license_note)}</a>`:esc(r.license_note)}).`;}
  else{$("#media").innerHTML=schematic(p);$("#ftag").textContent="SCHEMATIC";$("#fcap").textContent=`No field photo yet. Citizen photos, satellite checks and LGU updates appear here as evidence.`;}
  $("#factions").innerHTML=`<button class="btn-sm" data-act="report">＋ ${ph?"Replace":"Add"} photo report</button>`;}
projPanel.addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(!b)return;const a=b.dataset.act;if(a==="reverify")loadIntegrity(C[cur.c].projects[cur.p]);else if(a==="letter")openLetter(cur.c,cur.p);else if(a==="report")openReport("status");else if(a==="dispute")openReport("dispute");});

/* ================= record integrity (blockchain ledger) ================= */
// The server sends the project's record and its ledger blocks; the hashes are
// recomputed here in the browser, so the check does not rely on the server.
const LEDGER_ICON=`<svg class="chain" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/></svg>`;
const fmtWhen=iso=>{try{return new Date(iso).toLocaleString("en-PH",{dateStyle:"medium",timeStyle:"short"});}catch(e){return iso;}};
let integTok=0;
async function loadIntegrity(p){const tok=++integTok;const el=$("#integrity");if(!el)return;el.innerHTML=`<p class="meta">Checking this record against the ledger…</p>`;
  try{const d=await api.get(`/projects/${encodeURIComponent(p.id)}/integrity`);const v=await verifyRecord(d);if(tok!==integTok||!$("#integrity"))return;
    const b=d.latest;
    $("#integrity").innerHTML=`<div class="ledger ${v.ok?"ok":"bad"}">
      <div class="ledger-status"><span class="ledger-ico" aria-hidden="true">${v.ok?"✓":"!"}</span><div><b>${v.ok?"Record matches the ledger":"Record does not match the ledger"}</b>
        <small>${v.ok?"Verified just now in your browser (SHA-256)":"The record changed after its last block, or a block was altered"}</small></div>${LEDGER_ICON}</div>
      <dl class="ledger-dl"><dt>Fingerprint</dt><dd class="mono" title="${esc(b.fingerprint)}">${short(b.fingerprint,10,6)}</dd>
        <dt>Block</dt><dd class="mono">#${b.height} <span class="meta">chained to</span> #${b.height-1} · ${short(b.prev_hash)}</dd>
        <dt>Recorded</dt><dd>${esc(fmtWhen(b.at))} · ${esc(b.event)}</dd>
        <dt>History</dt><dd>${d.history.length} block${d.history.length===1?"":"s"} for this project · chain of ${d.chain.height+1} blocks ${d.chain.valid?"intact":"broken"}</dd></dl>
      <div class="pacts"><button class="btn-sm" data-act="reverify">Verify again</button><a class="btn-sm" href="/ledger#${encodeURIComponent(p.id)}" target="_blank" rel="noopener">Open in ledger ↗</a></div></div>`;}
  catch(e){if(tok===integTok&&$("#integrity"))$("#integrity").innerHTML=`<p class="meta">The ledger could not be checked right now (${esc(e.message)}).</p>`;}}

/* ================= public rating (anonymous, one per browser) ================= */
// A random ID kept in this browser; the server stores only a salted hash of it.
const VOTER_KEY="ripples-voter";let memVoter=null;
function newVoter(){return crypto.randomUUID?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,"0")).join("");}
function voterId(){try{let v=localStorage.getItem(VOTER_KEY);if(!v){v=newVoter();localStorage.setItem(VOTER_KEY,v);}return v;}catch(e){return memVoter||(memVoter=newVoter());}}
const thumb=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="${d?"transform:rotate(180deg)":""}"><path d="M7 10v11H4V10zM7 10l4-7c1.7 0 2.6 1.2 2.2 2.8L12.5 9H19a2 2 0 0 1 2 2.3l-1.4 7.5A2.5 2.5 0 0 1 17.2 21H7"/></svg>`;
let ratingState=null,ratingBusy=false;
function ratingHTML(t,showReasons){const total=t.up+t.down,upPct=total?Math.round(t.up/total*100):0;
  return `<div class="rate"><button class="rate-btn up ${t.mine==="up"?"on":""}" data-rate="up" aria-pressed="${t.mine==="up"}" aria-label="Thumbs up. ${t.up} so far">${thumb(false)}<b>${t.up}</b></button>
    <button class="rate-btn down ${t.mine==="down"?"on":""}" data-rate="down" aria-pressed="${t.mine==="down"}" aria-label="Thumbs down. ${t.down} so far">${thumb(true)}<b>${t.down}</b></button>
    <span class="rate-sum">${total?`${upPct}% positive · ${total} rating${total===1?"":"s"}`:"No ratings yet"}</span></div>
    ${total?`<div class="rate-bar" aria-hidden="true"><i style="width:${upPct}%"></i></div>`:""}
    ${t.mine==="down"&&showReasons&&t.reason_options?`<div class="rate-why"><span class="meta">Main reason (optional)</span><div class="rate-chips">${Object.entries(t.reason_options).map(([k,l])=>`<button class="chip ${t.mine_reason===k?"on":""}" data-reason="${k}" aria-pressed="${t.mine_reason===k}">${esc(l)}</button>`).join("")}</div></div>`:""}
    <p class="meta rate-note">Anonymous opinions. Ratings don't change the project's status or risk.</p>`;}
function paintRating(showReasons){const el=$("#rating");if(!el||!ratingState||el.dataset.pid!==ratingState.project_id)return;el.innerHTML=ratingHTML(ratingState,showReasons);}
async function loadRating(p){ratingState=null;try{ratingState=await api.get(`/projects/${encodeURIComponent(p.id)}/rating?voter=${encodeURIComponent(voterId())}`);paintRating(ratingState.mine==="down");}catch(e){/* counts from the map data stay visible */}}
async function sendRating(vote,reason){if(ratingBusy||!ratingState)return;ratingBusy=true;const pid=ratingState.project_id;
  try{ratingState=await api.post(`/projects/${encodeURIComponent(pid)}/rating`,{voter:voterId(),vote,reason});
    const p=C[cur.c]?.projects.find(x=>x.id===pid);if(p)p.rating={up:ratingState.up,down:ratingState.down};
    paintRating(vote==="down");}
  catch(e){toast(e.message);}ratingBusy=false;}
$("#info").addEventListener("click",e=>{const r=e.target.closest("[data-rate]");
  if(r){const v=r.dataset.rate;sendRating(ratingState&&ratingState.mine===v?null:v,null);return;}
  const w=e.target.closest("[data-reason]");if(w)sendRating("down",ratingState&&ratingState.mine_reason===w.dataset.reason?null:w.dataset.reason);});

/* ================= letter & report ================= */
let letterFor=null;
function openModal(id){const m=$(id);m.hidden=false;m.querySelector("button,textarea,select")?.focus({preventScroll:true});}
function closeModal(m){m.hidden=true;}
document.querySelectorAll(".modal").forEach(m=>{m.addEventListener("click",e=>{if(e.target===m||e.target.closest("[data-close]"))closeModal(m);});});
async function openLetter(ci,pi){letterFor={ci,pi};const p=C[ci].projects[pi];$("#mlS").textContent=`${p.name} → ${p.office}`;$("#letterText").value="Preparing the draft…";openModal("#mLetter");
  try{const d=await api.get(`/flows/follow-up-letter/preview?project_id=${encodeURIComponent(p.id)}`);$("#letterText").value=`To: ${d.office}\nSubject: ${d.subject}\n\n${d.body}`;}
  catch(e){$("#letterText").value=`Could not prepare the letter: ${e.message}`;}}
$("#copyLetter").addEventListener("click",async()=>{const t=$("#letterText");try{await navigator.clipboard.writeText(t.value);toast("Letter copied");}catch(e){t.select();toast("Press Ctrl+C (or Cmd+C) to copy the selected letter");}});
$("#sendLetter").addEventListener("click",async()=>{if(!letterFor)return;const{ci,pi}=letterFor,p=C[ci].projects[pi];
  try{const d=await api.post("/flows/follow-up-letter",{project_id:p.id});closeModal($("#mLetter"));
    toast(d.review_state==="DRAFT"?`Draft ${d.id} is waiting for approval on the Scorecard page.`:`Letter ${d.id} released to the test outbox.`,"Open Scorecard",()=>{location.href="/ops";});await reload();}
  catch(e){toast(e.message,"Open Scorecard",()=>{location.href="/ops";});}});
let reportKind="status",pendingFile=null;
function openReport(kind){reportKind=kind;pendingFile=null;const p=C[cur.c].projects[cur.p];$("#rKind").value=kind;$("#mrS").textContent=p.name;
  $("#drop").innerHTML=`<span>Drop a photo here or click to choose</span><small>JPG, PNG or WebP</small>`;openModal("#mReport");}
$("#drop").addEventListener("click",()=>{$("#file").value="";$("#file").click();});
$("#drop").addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();$("#file").click();}});
$("#drop").addEventListener("dragover",e=>{e.preventDefault();$("#drop").classList.add("drag");});$("#drop").addEventListener("dragleave",()=>$("#drop").classList.remove("drag"));
$("#drop").addEventListener("drop",e=>{e.preventDefault();$("#drop").classList.remove("drag");pick(e.dataTransfer.files[0]);});
$("#file").addEventListener("change",e=>pick(e.target.files[0]));
async function pick(f){if(!f||!f.type.startsWith("image/")){toast("Choose an image file (JPG, PNG or WebP).");return;}try{pendingFile=await stripToJpeg(f);$("#drop").innerHTML=`<img src="${URL.createObjectURL(pendingFile)}" alt="Selected photo"><small>Location and camera data removed</small>`;}catch(e){toast("That image couldn't be read. Try a JPG or PNG.");}}
const REPORT_TYPES={status:"status update",dispute:"dispute",maint:"maintenance problem"};
$("#rSubmit").addEventListener("click",async()=>{const p=C[cur.c].projects[cur.p];const kind=$("#rKind").value,text=$("#rText").value.trim();
  if(!text){toast("Describe what you saw.");return;}
  try{const r=await api.post("/reports",{project_id:p.id,report_type:REPORT_TYPES[kind],text,photo_description:$("#rPhoto").value.trim()});
    if(pendingFile)await Photos.put(p.id,pendingFile,{kind,text});saveMine(r.evidence_id);closeModal($("#mReport"));await reload();
    toast(r.flags.length?`Recorded as unverified and sent to a reviewer: ${r.flags.join("; ")}.`:r.status==="corroborated"?`Recorded. It matches ${r.basis.matching_reports} recent reports${r.basis.satellite_check?" and a satellite check":""}, so it is corroborated.`:"Recorded. It stays unverified until two more matching reports or a satellite check back it up.");}
  catch(e){toast(e.message);}});

/* ================= refresh after a letter or report ================= */
async function reload(){const d=await api.get("/explore");toCities(d,{mine:loadMine()}).forEach((n,i)=>Object.assign(C[i],n));
  refreshPins();refreshCityLabels();renderFilters();renderLog();
  if(mode==="city"){const st=cityPanel.scrollTop;renderCity({keepScroll:1});cityPanel.scrollTop=st;}else if(mode==="project")renderProject();}

/* ================= buttons & keys ================= */
$("#btnNext").addEventListener("click",goNext);$("#btnBack").addEventListener("click",goBack);$("#btnMap").addEventListener("click",goMap);
$("#strip").addEventListener("click",e=>{const b=e.target.closest("button");if(b)jump(+b.dataset.k);});
$("#startTour").addEventListener("click",()=>enterCity(0));
function zoomBy(f){if(busy||noGL)return;map.easeTo({zoom:map.getZoom()-Math.log2(f),duration:reduced?0:380});}
function rotBy(a){if(busy||noGL)return;map.easeTo({bearing:map.getBearing()-a*180/Math.PI,duration:reduced?0:520});}
$("#zIn").addEventListener("click",()=>zoomBy(.66));$("#zOut").addEventListener("click",()=>zoomBy(1.5));
$("#rL").addEventListener("click",()=>rotBy(Math.PI/6));$("#rR").addEventListener("click",()=>rotBy(-Math.PI/6));
$("#tilt").addEventListener("click",()=>{if(busy||noGL)return;map.easeTo({pitch:map.getPitch()>20?0:60,duration:reduced?0:700});});
$("#home").addEventListener("click",()=>{if(busy||noGL)return;camTo(overviewCam(),1100);});
addEventListener("keydown",e=>{if(e.target.matches("input,textarea,select"))return;const open=[...document.querySelectorAll(".modal")].find(m=>!m.hidden);
  if(open){if(e.key==="Escape")closeModal(open);return;}
  if(mode==="city"||mode==="project"){if(e.key==="ArrowRight"){e.preventDefault();goNext();}else if(e.key==="ArrowLeft"){e.preventDefault();goBack();}else if(e.key==="m"||e.key==="M"||e.key==="Escape")goMap();}
  else if(mode==="map"){if(e.key==="+"||e.key==="=")zoomBy(.66);else if(e.key==="-")zoomBy(1.5);}});

/* ================= picking (screen space, against each pin's beam) ================= */
let needPick=false,lastPtr=null;
function scr(v){const p=v.clone().project(camera);return{x:(p.x*.5+.5)*innerWidth,y:(-p.y*.5+.5)*innerHeight,ok:p.z<1&&p.z>-1};}
function segDist(px,py,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((px-a.x)*dx+(py-a.y)*dy)/l));return Math.hypot(px-a.x-t*dx,py-a.y-t*dy);}
function pickAt(x,y){if(noGL||!scene||busy)return null;let best=null,bd=1e9;
  const test=(g,top,tol,data)=>{if(!g.visible)return;const a=scr(g.position);if(!a.ok)return;const t=g.position.clone();t.y+=top*g.scale.y;const d=segDist(x,y,a,scr(t));if(d<tol&&d<bd){bd=d;best=data;}};
  if(mode==="map")cityPins.forEach((p,i)=>test(p.g,p.h+.6,18,{kind:"city",i}));
  else if(mode==="city")(projPins[cur.c]||[]).forEach((p,pi)=>test(p.g,p.h+.15,14,{kind:"proj",ci:cur.c,pi}));
  return best;}
const hideHint=()=>$("#hint").classList.add("gone");
function bindMap(){
  map.on("mousemove",e=>{lastPtr={x:e.point.x,y:e.point.y};$("#ll").textContent=`${e.lngLat.lat.toFixed(2)}°N ${e.lngLat.lng.toFixed(2)}°E`;needPick=true;});
  map.on("click",e=>{const h=pickAt(e.point.x,e.point.y);if(!h)return;if(h.kind==="city")enterCity(h.i);else if(h.kind==="proj")openProject(h.pi);});
  map.on("mousedown",hideHint);map.on("touchstart",hideHint);
  map.getCanvasContainer().addEventListener("pointerleave",()=>setHover(null));}

/* ================= per-frame update (called from the map's render) ================= */
function frame(){const now=performance.now(),t=now/1000,u=pxUnit(),zoom=map.getZoom();
  cityPins.forEach((p,i)=>{p.h+=(p.hT-p.h)*.06;const hs=p.hover?1.3:1;p.g.scale.setScalar(u*CITY_PX*hs);[p.beam,p.halo].forEach(m=>{m.scale.y=p.h;m.position.y=p.h/2;});
    const y=p.h+.55+Math.sin(t*2+i)*.14;p.head.position.y=y;p.spr.position.y=y;p.head.rotation.y=t*1.3+i;p.head.material.color.copy(p.hover?new THREE.Color(0xffffff):p.col);
    const ph=(t*.7+i*.137)%1;p.pulse.scale.setScalar(1+ph*1.4);p.pulse.material.opacity=.7*(1-ph);
    const inCity=(mode!=="map")&&i===cur.c;p.g.visible=pass(C[i])&&!(inCity&&zoom>10);});
  projPins.forEach(arr=>arr.forEach((p,k)=>{if(!p.g.visible)return;p.g.scale.setScalar(u*PROJ_PX*(p.hover?1.35:1));p.head.rotation.y=t*1.5+k;
    if(p.gap){const ph=(t*.9+k*.2)%1;p.ring.scale.setScalar(1+ph*1.6);p.ring.material.opacity=.9*(1-ph);}p.head.material.color.copy(p.hover?new THREE.Color(0xffffff):p.col);}));
  evacPins.forEach(arr=>arr.forEach(g=>{if(g.visible)g.scale.setScalar(u*PROJ_PX);}));
  if(travelU){traveler.position.copy(toScene(pointAt(travelU.r.pts,travelU.u),travelU.lift*u*90));traveler.scale.setScalar(u*CITY_PX);}
  // glows face the camera
  const fc=map.getFreeCameraOptions().position,cam=new THREE.Vector3((fc.x-ORIGIN.x)/KM,fc.z/KM,(fc.y-ORIGIN.y)/KM);scene.updateMatrixWorld();
  for(const m of facing)if(m.parent&&m.parent.visible)m.lookAt(cam);
  if(needPick&&lastPtr&&(mode==="map"||mode==="city")){needPick=false;setHover(pickAt(lastPtr.x,lastPtr.y));}
  if(hover&&lastPtr&&!tip.hidden)tip.style.transform=`translate(${Math.min(lastPtr.x+18,innerWidth-280)}px,${Math.min(lastPtr.y+18,innerHeight-160)}px)`;}
// HTML labels follow the pins. Project labels that would overlap are hidden
// (hovered and open-gap projects win); hovering a pin always shows its label.
const hideW=w=>{if(w.vis!==false){w.el.style.visibility="hidden";w.vis=false;}};
function labelLoop(){const W=innerWidth,H=innerHeight,items=[],placed=[];
  for(const w of wls){let show=true,v;
    if(w.city!=null){const p=cityPins[w.city];show=mode==="map"&&p.g.visible;v=p.g.position.clone();v.y+=(p.h+1.6)*p.g.scale.y;}
    else if(w.proj){const pp=projPins[w.proj[0]][w.proj[1]];show=mode==="city"&&w.proj[0]===cur.c&&pp.g.visible;v=pp.g.position.clone();v.y+=(pp.h+.3)*pp.g.scale.y;}
    else{show=mode==="city"&&w.evac===cur.c;v=w.g.position.clone();v.y+=.15*w.g.scale.y;}
    let s=null;if(show){s=scr(v);if(!s.ok||s.x<-60||s.x>W+60||s.y<-60||s.y>H+60)show=false;}
    if(show)items.push({w,s,pri:w.el.classList.contains("hot")?0:w.city!=null?0:w.proj?(w.gap?1:2):3});else hideW(w);}
  items.sort((a,b)=>a.pri-b.pri);
  for(const{w,s}of items){if(w.ww==null){w.ww=w.el.offsetWidth;w.wh=w.el.offsetHeight;}
    const x=s.x-w.ww/2,y=w.evac!=null?s.y-w.wh/2:s.y-w.wh*1.3;
    if(w.proj){if(placed.some(q=>x<q.x+q.w+3&&q.x<x+w.ww+3&&y<q.y+q.h+3&&q.y<y+w.wh+3)){hideW(w);continue;}placed.push({x,y,w:w.ww,h:w.wh});}
    else if(w.city!=null)placed.push({x,y,w:w.ww,h:w.wh});
    if(w.vis!==true){w.el.style.visibility="visible";w.vis=true;}w.el.style.transform=`translate(${x}px,${y}px)`;}}
// Route dash animation and our own tweens (traveler, route glow).
let dashStep=-1;
function loop(){requestAnimationFrame(loop);if(noGL||!scene)return;const now=performance.now();
  if(anim){const k=Math.min(1,(now-anim.t0)/anim.dur);anim.step(anim.ease(k));if(k>=1){const cb=anim.cb;anim=null;cb&&cb();}}
  const s=Math.floor(now/70)%DASH.length;if(s!==dashStep){dashStep=s;map.setPaintProperty("route-dash","line-dasharray",DASH[s]);}}

/* ================= boot ================= */
function start(){refreshPins();refreshCityLabels();renderFilters();renderLog();
  $("#logAsOf").textContent=`CITY LOG · AS OF ${fmtYM(AS_OF).toUpperCase()}`;
  const t=parseRoute();
  if(!noGL&&!t)camTo(overviewCam(),reduced?10:2600,null,true);
  loop();if(t)routeTo(t);setTimeout(hideHint,14000);}
if(!noGL){mapboxgl.accessToken=CFG.mapbox_token;
  try{map=new mapboxgl.Map({container:"gl",style:STYLE,projection:"mercator",center:[122,12.5],zoom:3.4,pitch:0,minZoom:2.5,maxZoom:18,maxPitch:75,keyboard:false,antialias:true});}
  catch(e){noGL=true;}}
if(noGL){showNoGL(!(CFG&&CFG.mapbox_token)&&!FORCE_NOGL?"The map needs a Mapbox token (MAPBOX_TOKEN in app/.env). You can still open every City Page from the city log.":"The map needs WebGL, which this browser has turned off. You can still open every City Page from the city log.");start();}
else{let booted=false;
  // If the map style can't load (Mapbox down, offline), run without the map so the log and project panels still work.
  const fallback=(msg)=>{if(booted)return;booted=true;noGL=true;showNoGL(msg);start();};
  // Background tabs load the map slowly, so the timer only counts while the tab is visible.
  let slow;const wait=()=>{slow=setTimeout(()=>{if(document.hidden)return wait();map.isStyleLoaded()||fallback("The map didn't load (Mapbox may be down or offline). You can still open every city and project from the city log; reload to try the map again.");},12000);};wait();
  map.on("load",()=>{if(booted)return;booted=true;clearTimeout(slow);initScene();addRoute();map.addLayer(layer);bindMap();start();});
  map.on("error",e=>{const st=e&&e.error&&e.error.status;
    if(st===401||st===403){clearTimeout(slow);fallback("Mapbox rejected the token. Check MAPBOX_TOKEN in app/.env and its allowed URLs.");}
    else if(!booted&&!map.isStyleLoaded()&&st>=500){clearTimeout(slow);fallback("The map service is not responding right now. You can still open every city and project from the city log; reload to try the map again.");}});}
