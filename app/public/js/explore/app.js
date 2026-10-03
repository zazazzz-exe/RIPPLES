// Ripples 3D explorer. Ported from ripples-climate-map.html: the scene, camera,
// panels and navigation are the mockup's; the data now comes from /api/explore,
// so risk, gaps and the scorecard follow the server's fixed rules (S4), and
// letters, guidance cards and simulations go through the approval gate (S2).
import { toCities } from "./adapter.js";

const api = {
  async get(p) { const r = await fetch("/api" + p); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`); return d; },
  async post(p, body = {}) { const r = await fetch("/api" + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`); return d; },
};
// Report ids submitted from this browser, to highlight "your" evidence. Never sent anywhere.
const MINE_KEY = "ripples-my-reports";
function loadMine() { try { return new Set(JSON.parse(localStorage.getItem(MINE_KEY) || "[]")); } catch { return new Set(); } }
function saveMine(id) { const s = loadMine(); s.add(id); try { localStorage.setItem(MINE_KEY, JSON.stringify([...s])); } catch { /* storage blocked */ } }
const FORCE_NOGL = new URLSearchParams(location.search).has("nogl");

let GEO, boot;
try {
  [GEO, boot] = await Promise.all([fetch("/data/ph-geo.json").then((r) => r.json()), api.get("/explore")]);
} catch (e) {
  document.body.insertAdjacentHTML("beforeend", `<p class="nogl">Could not load the map data (${String(e.message).replace(/</g, "&lt;")}). Is the server running?</p>`);
  throw e;
}
const AS_OF = boot.as_of;
const DEMO_TYPHOON = boot.typhoon;
const CITIES = toCities(boot, { mine: loadMine() });
let demo = Boolean(boot.simulation);

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
function hash64(str){let h1=0x811c9dc5,out="";for(let k=0;k<8;k++){for(let i=0;i<str.length;i++){h1^=str.charCodeAt(i)+k;h1=Math.imul(h1,16777619)>>>0;}out+=h1.toString(16).padStart(8,"0");}return out;}
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

/* ================= projection & scene ================= */
const K=8,LON0=122,LAT0=12.85,COS=Math.cos(LAT0*Math.PI/180),LAND=0.9;
const PX=lon=>(lon-LON0)*K*COS, PZ=lat=>-(lat-LAT0)*K;
const unproj=(x,z)=>({lon:x/(K*COS)+LON0,lat:-z/K+LAT0});
let noGL=false,renderer,scene,camera,controls,ocean,traveler,particles,typhoon;
const cityPins=[],projPins=[],evacPins=[],chain=[];
const canvas=$("#gl");
try{if(FORCE_NOGL)throw new Error("nogl");renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight,false);}catch(e){noGL=true;}
if(!window.THREE||!THREE.MapControls)noGL=true;
const SPREAD=3.2,CITY_R=6.2,CITY_PHI=0.86,PROJ_R=4.2,PROJ_PHI=0.9;
function overviewSph(){if(noGL)return null;const a=innerWidth/innerHeight;return new THREE.Spherical(Math.max(178,128/a),0.62,0);}
const OV_TARGET=()=>noGL?null:new THREE.Vector3(innerWidth>900?-14:0,0,6);
function glowTex(){const c=document.createElement("canvas");c.width=c.height=64;const g=c.getContext("2d");const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,"rgba(255,255,255,1)");gr.addColorStop(.25,"rgba(255,255,255,.55)");gr.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
function stormTex(){const S=256,c=document.createElement("canvas");c.width=c.height=S;const g=c.getContext("2d");g.translate(S/2,S/2);
  for(let arm=0;arm<4;arm++){for(let i=0;i<220;i++){const t=i/220,a=arm*Math.PI/2+t*5.2,r=10+t*112;const x=Math.cos(a)*r,y=Math.sin(a)*r;g.fillStyle=`rgba(${200+55*t|0},${235-40*t|0},255,${(1-t)*.5})`;g.beginPath();g.arc(x,y,16*(1-t*.6),0,7);g.fill();}}
  const gr=g.createRadialGradient(0,0,0,0,0,24);gr.addColorStop(0,"rgba(2,8,23,1)");gr.addColorStop(1,"rgba(2,8,23,0)");g.fillStyle=gr;g.beginPath();g.arc(0,0,24,0,7);g.fill();return new THREE.CanvasTexture(c);}
const C=CITIES;const cityPos=i=>noGL?null:new THREE.Vector3(PX(C[i].lon),LAND,PZ(C[i].lat));
const projPos=(ci,pi)=>{if(noGL)return null;const c=C[ci],p=c.projects[pi];return new THREE.Vector3(PX(c.lon+p.dx*SPREAD),LAND,PZ(c.lat+p.dy*SPREAD));};

if(!noGL){
  scene=new THREE.Scene();scene.background=new THREE.Color(0x020817);scene.fog=new THREE.Fog(0x020817,220,520);
  camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.05,1400);
  controls=new THREE.MapControls(camera,canvas);
  Object.assign(controls,{enableDamping:true,dampingFactor:.09,minDistance:2.5,maxDistance:340,maxPolarAngle:1.28,screenSpacePanning:false,zoomSpeed:1.1,rotateSpeed:.6});
  const s0=overviewSph();s0.radius*=1.9;s0.phi=.25;camera.position.setFromSpherical(s0).add(OV_TARGET());controls.target.copy(OV_TARGET());camera.lookAt(controls.target);
  scene.add(new THREE.HemisphereLight(0x9cc4ff,0x040a1c,.95));const dl=new THREE.DirectionalLight(0xffffff,.75);dl.position.set(-60,140,80);scene.add(dl);
  ocean=new THREE.Mesh(new THREE.PlaneGeometry(1000,1000),new THREE.ShaderMaterial({extensions:{derivatives:true},
    uniforms:{uTime:{value:0},uDeg:{value:new THREE.Vector2(K*COS,K)},uOrigin:{value:new THREE.Vector2(LON0,LAT0)},uStorm:{value:new THREE.Vector3(0,0,0)}},
    vertexShader:`varying vec2 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform float uTime;uniform vec2 uDeg,uOrigin;uniform vec3 uStorm;varying vec2 vW;
      float gl1(vec2 p){vec2 g=abs(fract(p-.5)-.5)/fwidth(p);return 1.-min(min(g.x,g.y),1.);}
      void main(){vec2 d=vec2(vW.x/uDeg.x+uOrigin.x,-vW.y/uDeg.y+uOrigin.y);float mi=gl1(d),ma=gl1(d/5.);float r=length(vW-vec2(0.,6.))/260.;float f=1.-smoothstep(.15,1.,r);
        vec3 c=mix(vec3(.008,.03,.075),vec3(.02,.065,.15),f);c+=vec3(.12,.25,.5)*mi*.22*f+vec3(.25,.45,.9)*ma*.32*f;
        float sd=length(vW-uStorm.xy);c+=vec3(.5,.08,.16)*uStorm.z*exp(-sd*sd/180.)*.55;
        float w=mod(sd-uTime*9.,14.);c+=vec3(.6,.15,.25)*uStorm.z*smoothstep(1.2,0.,abs(w-7.))*exp(-sd*sd/700.)*.25;
        gl_FragColor=vec4(c,1.);}`}));
  ocean.rotation.x=-Math.PI/2;scene.add(ocean);
  const toV2=([lon,lat])=>new THREE.Vector2(PX(lon),-PZ(lat));
  const shapes=GEO.ph.map(poly=>{const sh=new THREE.Shape(poly[0].map(toV2));poly.slice(1).forEach(h=>sh.holes.push(new THREE.Path(h.map(toV2))));return sh;});
  const land=new THREE.Mesh(new THREE.ExtrudeGeometry(shapes,{depth:LAND,bevelEnabled:false,curveSegments:1}),[
    new THREE.MeshStandardMaterial({color:0x1a3766,emissive:0x07152f,roughness:.82,metalness:.15}),new THREE.MeshStandardMaterial({color:0x0a1a3a,emissive:0x0d2a66,emissiveIntensity:.55,roughness:.6})]);
  land.rotation.x=-Math.PI/2;scene.add(land);
  function ringLines(polys,y){const a=[];polys.forEach(p=>p.forEach(r=>{for(let i=0;i<r.length-1;i++)a.push(PX(r[i][0]),y,PZ(r[i][1]),PX(r[i+1][0]),y,PZ(r[i+1][1]));}));const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(a,3));return g;}
  scene.add(new THREE.LineSegments(ringLines(GEO.ph,LAND+.01),new THREE.LineBasicMaterial({color:0xa9d4ff,transparent:true,opacity:.85})));
  scene.add(new THREE.LineSegments(ringLines(GEO.ph,.03),new THREE.LineBasicMaterial({color:0x3f7fe0,transparent:true,opacity:.6})));
  const nb=new THREE.Mesh(new THREE.ShapeGeometry(GEO.nb.map(p=>new THREE.Shape(p[0].map(toV2))),1),new THREE.MeshBasicMaterial({color:0x0a1631}));nb.rotation.x=-Math.PI/2;nb.position.y=.05;scene.add(nb);
  scene.add(new THREE.LineSegments(ringLines(GEO.nb,.07),new THREE.LineBasicMaterial({color:0x29466f,transparent:true,opacity:.6})));
  const gtex=glowTex(),ADD=THREE.AdditiveBlending;
  // city pins
  C.forEach((c,i)=>{const g=new THREE.Group();g.position.copy(cityPos(i));
    const mk=(geo,col,op,extra)=>new THREE.Mesh(geo,new THREE.MeshBasicMaterial(Object.assign({color:col,transparent:true,opacity:op,blending:ADD,depthWrite:false},extra||{})));
    const beam=mk(new THREE.CylinderGeometry(.06,.06,1,8,1,true),0xffffff,.95),halo=mk(new THREE.CylinderGeometry(.22,.22,1,12,1,true),0xffffff,.14);
    const head=new THREE.Mesh(new THREE.OctahedronGeometry(.42),new THREE.MeshBasicMaterial({color:0xffffff}));
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:gtex,color:0xffffff,blending:ADD,depthWrite:false,transparent:true,opacity:.9}));spr.scale.set(2.4,2.4,1);
    const base=new THREE.Mesh(new THREE.RingGeometry(.75,.86,48),new THREE.MeshBasicMaterial({color:0x8fb4e8,transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false}));base.rotation.x=-Math.PI/2;base.position.y=.04;
    const arc=mk(new THREE.RingGeometry(.75,.98,64,1,Math.PI/2,-Math.PI*2*.001),0x35e39a,.95,{side:THREE.DoubleSide});arc.rotation.x=-Math.PI/2;arc.position.y=.05;
    const pulse=mk(new THREE.RingGeometry(.9,1.0,48),0xffffff,.6,{side:THREE.DoubleSide});pulse.rotation.x=-Math.PI/2;pulse.position.y=.06;
    const hit=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.25,1,8),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));hit.userData={kind:"city",i};
    g.add(beam,halo,head,spr,base,arc,pulse,hit);scene.add(g);
    cityPins.push({g,beam,halo,head,spr,arc,pulse,hit,h:2,hT:2,hover:false,col:new THREE.Color()});});
  // project pins and evacuation markers
  C.forEach((c,ci)=>{projPins[ci]=[];evacPins[ci]=[];
    c.projects.forEach((p,pi)=>{const g=new THREE.Group();g.position.copy(projPos(ci,pi));g.visible=false;const col=new THREE.Color(STAT[p.status].hex);const h=.35+p.progress/100*.5;
      const beam=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,h,6,1,true),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.95,blending:ADD,depthWrite:false}));beam.position.y=h/2;
      const head=new THREE.Mesh(new THREE.OctahedronGeometry(.07),new THREE.MeshBasicMaterial({color:col}));head.position.y=h+.08;
      const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:gtex,color:col,blending:ADD,depthWrite:false,transparent:true,opacity:.8}));spr.scale.set(.4,.4,1);spr.position.y=h+.08;
      const ring=new THREE.Mesh(new THREE.RingGeometry(.12,.15,32),new THREE.MeshBasicMaterial({color:gapOf(p)?(gapOf(p)==="Overdue"?0xff2e5b:0xff6bd6):col,transparent:true,opacity:.8,side:THREE.DoubleSide,blending:ADD,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.02;
      const hit=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,h+.35,8),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));hit.position.y=(h+.35)/2;hit.userData={kind:"proj",ci,pi};
      g.add(beam,head,spr,ring,hit);scene.add(g);projPins[ci].push({g,head,spr,ring,hit,h,hover:false,gap:!!gapOf(p),col});});
    c.evac.forEach(e=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.09,.09,.09),new THREE.MeshBasicMaterial({color:0x35e39a}));m.position.set(PX(c.lon+e[2]*SPREAD),LAND+.06,PZ(c.lat+e[3]*SPREAD));m.visible=false;scene.add(m);evacPins[ci].push(m);});});
  // readiness route
  const routeFS=`uniform float uTime,uActive,uProg,uLen;uniform vec3 uColor;varying vec2 vUv;
    void main(){float x=vUv.x;float f=fract(x*uLen-uTime*.9);float dash=smoothstep(0.,.08,f)*(1.-smoothstep(.45,.55,f));float a=.38+.45*dash;float head=exp(-pow((x-uProg)*22.,2.))*uActive;a=mix(a,1.,uActive*.6)+head;
      gl_FragColor=vec4(mix(uColor,vec3(1.,.9,.9),clamp(head,0.,1.)),a);}`;
  for(let i=0;i<C.length-1;i++){const A=cityPos(i),B=cityPos(i+1);A.y=B.y=LAND+.12;const d=A.distanceTo(B);const M=A.clone().add(B).multiplyScalar(.5);M.y+=1.1+d*.24;
    const curve=new THREE.QuadraticBezierCurve3(A,M,B);const mat=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uActive:{value:0},uProg:{value:-1},uLen:{value:Math.max(2,d/2.2)},uColor:{value:new THREE.Color(0xff2e4a)}},
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:routeFS,transparent:true,depthWrite:false,blending:ADD});
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(24,Math.round(d*2)),.085,6,false),mat));chain.push({a:i,b:i+1,curve,mat,len:d});}
  traveler=new THREE.Group();traveler.add(new THREE.Mesh(new THREE.SphereGeometry(.3,16,12),new THREE.MeshBasicMaterial({color:0xffffff})));
  const ts=new THREE.Sprite(new THREE.SpriteMaterial({map:gtex,color:0xff4a62,blending:ADD,depthWrite:false,transparent:true}));ts.scale.set(4,4,1);traveler.add(ts);traveler.visible=false;scene.add(traveler);
  // typhoon
  typhoon=new THREE.Group();const tTrack=new THREE.CatmullRomCurve3(DEMO_TYPHOON.track.map(([la,lo])=>new THREE.Vector3(PX(lo),LAND+3,PZ(la))));
  const tl=new THREE.Line(new THREE.BufferGeometry().setFromPoints(tTrack.getPoints(120)),new THREE.LineDashedMaterial({color:0xff6b8a,dashSize:1.2,gapSize:.9,transparent:true,opacity:.8}));tl.computeLineDistances();
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:stormTex(),transparent:true,depthWrite:false,opacity:.95}));sp.scale.set(16,16,1);
  const eye=new THREE.Sprite(new THREE.SpriteMaterial({map:gtex,color:0xff2e5b,blending:ADD,depthWrite:false,transparent:true}));eye.scale.set(3,3,1);
  typhoon.add(tl);const storm=new THREE.Group();storm.add(sp,eye);typhoon.add(storm);typhoon.visible=false;scene.add(typhoon);typhoon.userData={curve:tTrack,storm,sp,t:0,tT:0};
  const N=600,pp=new Float32Array(N*3);for(let i=0;i<N;i++){pp[i*3]=(Math.random()-.5)*220;pp[i*3+1]=2+Math.random()*40;pp[i*3+2]=(Math.random()-.5)*260;}
  const pg=new THREE.BufferGeometry();pg.setAttribute("position",new THREE.BufferAttribute(pp,3));
  particles=new THREE.Points(pg,new THREE.PointsMaterial({map:gtex,size:.7,color:0x7fb0ff,transparent:true,opacity:.35,blending:ADD,depthWrite:false}));scene.add(particles);
}else{const m=document.createElement("p");m.className="nogl";m.textContent="The 3D map needs WebGL, which this browser has turned off. You can still open every City Page from the city log.";document.body.appendChild(m);}

function refreshPins(){if(noGL)return;C.forEach((c,i)=>{const r=riskOf(c),sc=scoreOf(c),p=cityPins[i];p.col.set(RISK[r.lvl].hex);p.hT=1.4+r.s*1.15;
  [p.beam,p.halo,p.spr,p.pulse].forEach(m=>m.material.color.copy(p.col));
  p.arc.geometry.dispose();p.arc.geometry=new THREE.RingGeometry(.75,.98,64,1,Math.PI/2,-Math.PI*2*Math.max(.001,(sc.kept??0)/100));});}

/* ================= world labels ================= */
const world=$("#world");const wls=[];
function addWL(cls,html,lat,lon,y,o){const el=document.createElement("div");el.className="wl "+cls;el.innerHTML=html;world.appendChild(el);const w=Object.assign({el,p:new THREE.Vector3(PX(lon),y??LAND,PZ(lat)),cls},o||{});wls.push(w);return w;}
if(!noGL){
  addWL("region","LUZON",17.6,121.5);addWL("region","VISAYAS",12.25,123.4);addWL("region","MINDANAO",7.3,124.4);
  addWL("sea","WEST PHILIPPINE SEA",14.2,117.6,.1);addWL("sea","PHILIPPINE SEA",14.2,127.2,.1);addWL("sea","SULU SEA",8.6,120.6,.1);addWL("sea","CELEBES SEA",5.3,123.6,.1);
  C.forEach((c,i)=>{const w=addWL("pin","",c.lat,c.lon,LAND,{city:i});w.el.addEventListener("click",()=>{if(mode==="map"&&!busy)enterCity(i);});
    w.el.addEventListener("pointerenter",()=>setHover({kind:"city",i}));w.el.addEventListener("pointerleave",()=>setHover(null));
    c.projects.forEach((p,pi)=>{const short=p.name.split(/[,(]/)[0].trim();const s=addWL("ppin",`<i></i>${esc(short.length>30?short.slice(0,28)+"…":short)}`,c.lat+p.dy*SPREAD,c.lon+p.dx*SPREAD,LAND,{proj:[i,pi]});
      s.el.style.setProperty("--c",gapOf(p)?(gapOf(p)==="Overdue"?"#ff2e5b":"#ff6bd6"):STAT[p.status].css);
      s.el.addEventListener("click",()=>{if(mode==="city"&&!busy&&cur.c===i)openProject(pi);});
      s.el.addEventListener("pointerenter",()=>setHover({kind:"proj",ci:i,pi}));s.el.addEventListener("pointerleave",()=>setHover(null));});
    c.evac.forEach(e=>addWL("evac","EVAC",c.lat+e[3]*SPREAD,c.lon+e[2]*SPREAD,LAND+.15,{evac:i}));});
}
function refreshCityLabels(){wls.forEach(w=>{if(w.city==null)return;const c=C[w.city],r=riskOf(c);w.el.style.setProperty("--c",RISK[r.lvl].css);w.el.innerHTML=`<i></i>${esc(c.name.replace(" City",""))} <b>${r.lvl.toUpperCase()}</b>`;});}

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
  canvas.classList.toggle("hovering",!!h);}

/* ================= camera & state machine ================= */
let mode="map",busy=false,cur={c:-1,p:-1},trail=[],navKeep=false;
function setMode(m){mode=m;document.body.className="mode-"+m+((m==="city"||m==="project"||(m==="fly"&&navKeep))?" nav-on":"")+(demo?" demo-on":"");if(m!=="map"&&m!=="city")tip.hidden=true;
  if(!noGL){projPins.forEach((arr,ci)=>arr.forEach(p=>p.g.visible=(m==="city"||m==="project"||m==="fly")&&ci===cur.c));evacPins.forEach((arr,ci)=>arr.forEach(e=>e.visible=(m==="city"||m==="project")&&ci===cur.c));}}
setMode("map");
let anim=null;const easeIO=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2,easeS=k=>-(Math.cos(Math.PI*k)-1)/2;
function run(dur,step,cb,ease){if(noGL){cb&&cb();return;}controls.enabled=false;anim={t0:performance.now(),dur:reduced?Math.min(dur,350):dur,step,cb,ease:ease||easeIO};}
const curSph=()=>new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
// Camera targets are skipped without WebGL so the panels still open (fallback mode).
const sphAt=(r,phi)=>noGL?null:new THREE.Spherical(r,phi,curSph().theta);
const wrapA=a=>((a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
// view offset frames the city beside the City Page panel
let vo=0,voT=0;
function applyVO(){if(noGL)return;const W=innerWidth,H=innerHeight;if(vo<.001){camera.clearViewOffset();return;}
  if(W>760)camera.setViewOffset(W,H,-Math.min(520,W)/2*vo,0,W,H);else camera.setViewOffset(W,H,0,H*.29*vo,W,H);}
function tweenTo(target,s2,dur,cb,lift){if(noGL){cb&&cb();return;}const t0=controls.target.clone(),s1=curSph(),dT=wrapA(s2.theta-s1.theta),lr1=Math.log(s1.radius),lr2=Math.log(s2.radius);lift=lift||0;
  run(dur,k=>{controls.target.lerpVectors(t0,target,k);const r=Math.exp(lr1+(lr2-lr1)*k)+Math.sin(Math.PI*k)*lift;const ph=s1.phi+(s2.phi-s1.phi)*k-Math.sin(Math.PI*k)*(lift?.25:0);
    camera.position.setFromSpherical(new THREE.Spherical(r,ph,s1.theta+dT*k)).add(controls.target);camera.lookAt(controls.target);},cb);}
function findRoute(a,b){for(const r of chain){if(r.a===a&&r.b===b)return{r,rev:false};if(r.a===b&&r.b===a)return{r,rev:true};}return null;}
function travel(a,b,cb){if(noGL){cb&&cb();return;}const fr=findRoute(a,b);
  if(!fr){const d=cityPos(a).distanceTo(cityPos(b));tweenTo(cityPos(b),sphAt(CITY_R,CITY_PHI),1500+Math.min(1500,d*12),cb,d*.9);return;}
  const{r,rev}=fr,theta=curSph().theta,d=r.len;r.mat.uniforms.uActive.value=1;traveler.visible=true;
  run(Math.min(3800,1700+d*24),k=>{const u=rev?1-k:k;const p=r.curve.getPoint(u);const tg=new THREE.Vector3(p.x,LAND,p.z);controls.target.copy(tg);const lift=Math.sin(Math.PI*k);
    camera.position.setFromSpherical(new THREE.Spherical(CITY_R+lift*(8+d*.6),CITY_PHI-lift*.3,theta)).add(tg);camera.lookAt(tg);traveler.position.copy(p);r.mat.uniforms.uProg.value=u;},
    ()=>{r.mat.uniforms.uActive.value=0;r.mat.uniforms.uProg.value=-1;traveler.visible=false;cb&&cb();},easeS);}
const flash=()=>{const f=$("#flash");f.classList.remove("go");void f.offsetWidth;f.classList.add("go");};
const cityPanel=$("#city"),projPanel=$("#proj");
function showCity(ci){cur={c:ci,p:-1};renderCity();cityPanel.hidden=false;setMode("city");updateNav();voT=1;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{cityPanel.classList.add("open");cityPanel.scrollTop=0;}));
  if(pendingProj>=0){const p=pendingProj;pendingProj=-1;setTimeout(()=>openProject(p),reduced?0:650);}else setRoute();}
function hideCity(cb){voT=0;if(cityPanel.hidden){cb&&cb();return;}cityPanel.classList.remove("open");setMode("fly");setTimeout(()=>{cityPanel.hidden=true;cb&&cb();},reduced?150:500);}
function showProj(pi){cur.p=pi;renderProject();projPanel.hidden=false;setMode("project");updateNav();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{projPanel.classList.add("open");flash();}));setRoute();}
function hideProj(cb){if(projPanel.hidden){cb&&cb();return;}projPanel.classList.remove("open");setMode("fly");setTimeout(()=>{projPanel.hidden=true;cb&&cb();},reduced?150:540);}
const closeAll=cb=>hideProj(()=>hideCity(cb));
const cityView=ci=>sphAt(CITY_R,CITY_PHI);
function enterCity(ci){if(busy)return;busy=true;navKeep=false;trail=[];setHover(null);cur.c=ci;setMode("fly");
  tweenTo(cityPos(ci),cityView(ci),1800,()=>{busy=false;showCity(ci);});}
function openProject(pi){if(busy||mode!=="city")return;busy=true;navKeep=true;trail.push({c:cur.c,p:-1});setHover(null);const ci=cur.c;
  hideCity(()=>tweenTo(projPos(ci,pi),sphAt(PROJ_R,PROJ_PHI),1100,()=>{busy=false;showProj(pi);}));}
function goNext(){if(busy)return;navKeep=true;
  if(mode==="city"){busy=true;const a=cur.c,b=(a+1)%C.length;trail.push({c:a,p:-1});hideCity(()=>{cur.c=b;setMode("fly");travel(a,b,()=>{busy=false;showCity(b);});});}
  else if(mode==="project"){busy=true;const ci=cur.c,a=cur.p,b=(a+1)%C[ci].projects.length;trail.push({c:ci,p:a});
    hideProj(()=>tweenTo(projPos(ci,b),sphAt(PROJ_R,PROJ_PHI),900,()=>{busy=false;showProj(b);}));}}
function goTo(s){busy=true;navKeep=true;const from={...cur};
  const after=()=>{if(s.p<0){cur.c=s.c;setMode("fly");const go=()=>{busy=false;showCity(s.c);};
      if(from.c!==s.c)travel(from.c,s.c,go);else tweenTo(cityPos(s.c),cityView(s.c),900,go);}
    else{cur.c=s.c;setMode("fly");tweenTo(projPos(s.c,s.p),sphAt(PROJ_R,PROJ_PHI),900,()=>{busy=false;showProj(s.p);});}};
  closeAll(after);}
function goBack(){if(busy)return;const s=trail.pop();if(!s){goMap();return;}goTo(s);}
function jump(k){if(busy)return;if(mode==="city"&&k!==cur.c){trail.push({c:cur.c,p:-1});goTo({c:k,p:-1});}else if(mode==="project"&&k!==cur.p){trail.push({c:cur.c,p:cur.p});goTo({c:cur.c,p:k});}}
function goMap(){if(busy)return;busy=true;navKeep=false;trail=[];closeAll(()=>tweenTo(OV_TARGET(),overviewSph(),1800,()=>{busy=false;cur={c:-1,p:-1};setMode("map");renderLog();setRoute();}));}

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
function advCard(a,isNew){const col=ADVC[a.type]||"#93a9cf";
  if(a.pending)return `<details class="adv new" style="--c:${col}" open><summary><span class="atype">${esc(a.type)} · ${esc(a.level)}</span>
    <span class="atitle">${esc(a.title)}<span class="newtag">SIMULATED</span><small>${esc(a.time)} · ${esc(a.source)}</small></span><span class="atog" aria-hidden="true">+</span></summary>
    <div class="aud"><div style="grid-column:1/-1"><h4>Guidance awaiting approval</h4><p>Guidance for households, schools, farmers and barangay officials has been drafted and is waiting for a reviewer on the <a href="/ops">Scorecard</a> page. Follow official warnings and evacuation orders from PAGASA and NDRRMC now.</p></div></div></details>`;
  return `<details class="adv ${isNew?"new":""}" style="--c:${col}" ${isNew?"open":""}><summary><span class="atype">${esc(a.type)} · ${esc(a.level)}</span>
    <span class="atitle">${esc(a.title)}${isNew?'<span class="newtag">NEW</span>':""}<small>${esc(a.time)} · ${esc(a.source)}</small></span><span class="atog" aria-hidden="true">+</span></summary>
    <div class="aud"><div><h4>For households</h4><p>${esc(a.households)}</p></div><div><h4>For schools</h4><p>${esc(a.schools)}</p></div>
    <div><h4>For farmers</h4><p>${esc(a.farmers)}</p></div><div><h4>For barangay officials</h4><p>${esc(a.barangay)}</p></div></div></details>`;}
function renderCity(opts){opts=opts||{};const c=C[cur.c],r=riskOf(c),s=scoreOf(c),rc=RISK[r.lvl].css,gs=gapsOf(c),advs=advisoriesOf(c);
  const cnt=k=>k==="All"?c.projects.length:c.projects.filter(p=>p.status===k).length;
  const prows=c.projects.map((p,pi)=>({p,pi})).filter(({p})=>pFilter==="All"||p.status===pFilter).map(({p,pi})=>{const g=gapOf(p),sc=STAT[p.status].css;
    return `<button class="prow" data-p="${pi}" style="--c:${sc}"><span class="bar4"></span><span style="min-width:0"><span class="pn" style="display:block">${esc(p.name)}</span><span class="pm" style="display:block">${esc(p.type)} · ${esc(p.agency)} · due ${fmtYM(p.deadline)}</span></span>
      <span class="pr"><span class="st">${esc(statusLabel(p))}</span>${g?`<span class="flag" style="--fc:${g==="Overdue"?"#ff2e5b":"#ff6bd6"}">● ${g.toUpperCase()}</span>`:`<span>${p.progress}%</span>`}<span class="mini" style="--p:${p.progress}%"></span></span></button>`;}).join("")||`<p class="meta">No ${pFilter.toLowerCase()} projects in this city.</p>`;
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
      <div class="riskcard ${opts.bump?"bump":""}" style="--c:${rc}"><div class="rk-top"><div><div class="rk-l">REAL-RISK LEVEL</div><div class="rk-big">${r.lvl}</div>${r.changed?`<div class="rk-l" style="margin-top:4px">WAS ${esc(r.baseline.toUpperCase())} BEFORE THE SIMULATION</div>`:""}</div>
        <button class="btn-storm" data-act="demo" aria-pressed="${demo}" style="font-size:13px;padding:8px 12px">${demo?"END DEMO":"RUN TYPHOON DEMO"}</button></div>
        <div class="meter">${["Low","Moderate","High","Critical"].map(k=>`<i class="${RISK[k].n<=RISK[r.lvl].n?"f":""}"></i>`).join("")}</div>
        <div class="meter-l"><span>LOW</span><span>MODERATE</span><span>HIGH</span><span>CRITICAL</span></div>
        <ul class="why"><li><b>+${r.h}</b><span>Hazard now: ${hzLine}</span></li><li><b>+${r.g}</b><span>Open gaps: ${gapLine}</span></li><li><b>= ${r.s}</b><span>Score out of 6. Rule-based, so every level can be explained.</span></li></ul>
        <p class="safe">This level does not mean you are safe. Official warnings and evacuation orders always come first: <a href="https://www.pagasa.dost.gov.ph" target="_blank" rel="noopener">PAGASA</a> · <a href="https://ndrrmc.gov.ph" target="_blank" rel="noopener">NDRRMC</a></p></div>
    </section>
    <section><h2 class="sec-h">Advisory board <small>${advs.length} active · newest first</small></h2>${advs.map((a,k)=>advCard(a,a.isDemo&&opts.newAdv)).join("")}</section>
    <section id="t-projects"><h2 class="sec-h">Climate projects <small>from the ${esc(c.lccap)}</small></h2>
      <div class="pfil" role="group" aria-label="Filter projects by status">${["All","Not started","In progress","Completed","Delayed"].map(k=>`<button class="chip ${pFilter===k?"on":""}" data-pf="${k}" aria-pressed="${pFilter===k}">${k==="All"?"All":`<i class="dot" style="--c:${STAT[k].css}"></i>${k}`} <b>${cnt(k)}</b></button>`).join("")}</div>
      <div id="plist">${prows}</div></section>
    <section><h2 class="sec-h">Open gaps this season <small>${gs.length} raising the risk level</small></h2>
      ${gs.length?gs.map(p=>{const g=gapOf(p);return `<div class="gap" style="--fc:${g==="Overdue"?"#ff2e5b":"#ff6bd6"}"><span class="flag">●</span><div><b>${esc(p.name)} · ${g.toLowerCase()}</b><p>Interim measure: ${esc(p.interim||"Assign watchers during advisories.")}</p></div></div>`;}).join(""):`<p class="meta">No open gaps. Every finished defense is maintained.</p>`}</section>
    <section id="t-prepare"><h2 class="sec-h">Seasonal outlook <small>sample · no live PAGASA outlook connected</small></h2><div class="outlook">${c.outlook.map(([m,t])=>`<div><b>${esc(m)}</b><p>${esc(t)}</p></div>`).join("")}</div></section>
    <section><h2 class="sec-h">Evacuation centers <small>green markers on the map</small></h2><ul class="list">${c.evac.map(e=>`<li>${esc(e[0])}<span>${e[1].toLocaleString()} people</span></li>`).join("")}</ul></section>
    <section><h2 class="sec-h">Community actions <small>verified ways to help</small></h2><ul class="list">${c.actions.map(a=>`<li><span style="font-family:var(--f-body);color:var(--ice);font-size:12.5px;white-space:normal"><em>${esc(a[0])}</em>${esc(a[1])}</span><span>${esc(a[2])}</span></li>`).join("")}</ul>
      <p class="note">No money passes through the app. Sponsors give directly to partner NGOs or the LGU.</p></section>
    ${c.reports.length?`<section><h2 class="sec-h">Readiness reports <small>approved by a reviewer</small></h2>${c.reports.map(rp=>`<details class="adv" style="--c:var(--sun)"><summary><span class="atype">Pre-season readiness</span><span class="atitle">${esc(rp.title)}</span><span class="atog" aria-hidden="true">+</span></summary><div class="aud"><div style="grid-column:1/-1"><p style="white-space:pre-wrap">${esc(rp.text)}</p></div></div></details>`).join("")}</section>`:""}
    <section id="t-score"><h2 class="sec-h">Public scorecard <small>as of ${fmtYM(AS_OF)}</small></h2>
      <div class="score"><div><b id="scKept">${s.kept??"—"}%</b><span>Promises kept on time (${s.keptN} of ${s.dueN} due)</span></div><div><b>${s.maint??"—"}%</b><span>Finished defenses maintained (${s.okN} of ${s.doneN})</span></div><div><b id="scFu">${s.rep}/${s.sent}</b><span>Follow-ups answered. ${s.silent} with no reply recorded</span></div></div>
      <p style="margin:10px 0 0"><span class="badge" title="In production, every promise, status change and piece of evidence is timestamped on the Stellar network so no one can quietly edit the record. Not connected in this version.">Simulated record hash · ${hash64(c.id).slice(0,6)}…${hash64(c.id).slice(-4)} · Stellar not connected</span></p></section>
    <section><h2 class="sec-h">Official sources</h2><div class="srcs"><a href="https://www.pagasa.dost.gov.ph" target="_blank" rel="noopener">PAGASA ↗</a><a href="https://ndrrmc.gov.ph" target="_blank" rel="noopener">NDRRMC ↗</a><a href="https://hazardhunter.georisk.gov.ph" target="_blank" rel="noopener">HazardHunterPH ↗</a><a href="https://noah.up.edu.ph" target="_blank" rel="noopener">Project NOAH ↗</a></div></section>
  </div>`;
  updateNav();if(opts.keepScroll==null)cityPanel.scrollTop=0;}
cityPanel.addEventListener("click",e=>{const pr=e.target.closest(".prow");if(pr){openProject(+pr.dataset.p);return;}
  const pf=e.target.closest("[data-pf]");if(pf){pFilter=pf.dataset.pf;const st=cityPanel.scrollTop;renderCity({keepScroll:1});cityPanel.scrollTop=st;return;}
  const tb=e.target.closest("[data-tab]");if(tb){cityTab=tb.dataset.tab;cityPanel.querySelectorAll("[data-tab]").forEach(b=>{b.classList.toggle("on",b===tb);b.setAttribute("aria-selected",b===tb);});
    const sec=$("#t-"+cityTab);if(sec)cityPanel.scrollTo({top:sec.offsetTop-cityPanel.querySelector(".c-head").offsetHeight+4,behavior:reduced?"auto":"smooth"});return;}
  if(e.target.closest('[data-act="demo"]'))toggleDemo();});
cityPanel.addEventListener("pointerover",e=>{const pr=e.target.closest(".prow");setHover(pr?{kind:"proj",ci:cur.c,pi:+pr.dataset.p}:null);});
cityPanel.addEventListener("pointerleave",()=>setHover(null));

/* ================= PROJECT VIEW ================= */
function waves(y0,rows,amp){let d="";for(let r=0;r<rows;r++){d+=`M0 ${y0+r*18}`;for(let x=0;x<820;x+=40)d+=` q10 ${-amp} 20 0 t20 0`;}return d;}
function schematic(p){const t=p.type,g=gapOf(p);let grid="",g2="";for(let x=0;x<=800;x+=20)grid+=`M${x} 0V500`;for(let y=0;y<=500;y+=20)grid+=`M0 ${y}H800`;for(let x=0;x<=800;x+=100)g2+=`M${x} 0V500`;for(let y=0;y<=500;y+=100)g2+=`M0 ${y}H800`;
  let art="",lab="";
  if(t==="Dike"){art=`<path class="sk" d="${waves(330,5,4)}" opacity=".45" clip-path="url(#L)"/><path class="fc" d="M240 400L330 250H470L560 400Z"/><path class="hi draw" d="M0 400H240L330 250H470L560 400H800"/>
      <path class="sk" d="M330 250L360 210H440L470 250" stroke-dasharray="5 5"/><path class="dim" d="M600 250V400M594 250H606M594 400H606"/>`;lab=`<text x="616" y="330">CREST HEIGHT</text><text x="60" y="320">RIVER SIDE</text><text x="600" y="440">PROTECTED SIDE</text><text x="352" y="200">RAISED CREST</text>`;
    if(g)art+=`<path class="gap" d="M300 236H500"/>`,lab+=`<text class="r" x="300" y="228">OPEN SECTION</text>`;}
  else if(t==="Drainage"){art=`<path class="sk" d="M0 160H800M0 168H800" opacity=".7"/><path class="fc" d="M250 240H550V380H250Z"/><path class="hi draw" d="M250 240H550V380H250Z"/><path class="sk" d="M270 260H530V360H270Z"/>
      <path class="sk" d="M120 160V240H250M680 160V240H550" /><path class="sk" d="M300 340q25-10 50 0t50 0t50 0t50 0" opacity=".6"/>`;lab=`<text x="290" y="420">BOX CULVERT · 2.0 × 1.4 M</text><text x="20" y="150">ROAD LEVEL</text><text x="80" y="230">INLET</text>`;
    if(g)art+=`<path d="M270 360H530V320Q400 300 270 330Z" fill="var(--maint)" opacity=".35"/>`,lab+=`<text class="r" x="280" y="300">SILT BUILD-UP</text>`;}
  else if(t==="Mangrove"){let tr="";[90,190,290,390,490,590,690].forEach((x,i)=>{const h=60+(i%3)*25;tr+=`M${x} 330V${330-h}M${x-36} ${330-h+10}Q${x} ${330-h-50} ${x+36} ${330-h+10}M${x} 330l-24 40M${x} 330l24 40M${x} 330l-10 44M${x} 330l10 44`;});
    art=`<path class="sk" d="${waves(350,6,3)}" opacity=".45"/><path class="hi draw" d="${tr}"/><path class="sk" d="M0 380H800" opacity=".6"/>`;lab=`<text x="20" y="420">MEAN SEA LEVEL</text><text x="520" y="200">WAVE ENERGY ↓</text>`;}
  else if(t==="Seawall"){art=`<path class="sk" d="${waves(330,6,5)}" opacity=".5" clip-path="url(#L)"/><path class="fc" d="M420 160H560V430H340L420 330Z"/><path class="hi draw" d="M340 430L380 380H400L420 330V160H560V430"/><path class="sk" d="M560 220H800" />`;
    lab=`<text x="580" y="210">BOULEVARD</text><text x="60" y="300">STORM SURGE</text>`;if(g)art+=`<path class="gap" d="M340 430L300 470M380 430L350 470"/>`,lab+=`<text class="r" x="220" y="490">SCOUR AT TOE</text>`;}
  else if(t==="Pump"){art=`<path class="fc" d="M300 200H520V400H300Z"/><path class="hi draw" d="M300 400V200L410 140L520 200V400Z"/><path class="sk" d="M520 300H700V260M700 260h40M300 340H150V420"/><circle class="sk" cx="410" cy="300" r="40"/><path class="sk" d="M410 270v60M380 300h60"/>
      <path class="sk" d="${waves(430,3,3)}" opacity=".4"/>`;lab=`<text x="560" y="250">OUTFALL</text><text x="80" y="460">SUMP</text>`;if(g)art+=`<path class="gap" d="M300 400V200L410 140L520 200V400"/>`,lab+=`<text class="r" x="310" y="120">FOUNDATION ONLY</text>`;}
  else if(t==="Evac"){art=`<path class="fc" d="M220 220H580V420H220Z"/><path class="hi draw" d="M200 230L400 120L600 230M220 220V420H580V220"/><path class="sk" d="M370 420V330H430V420M260 260h60v40h-60zM480 260h60v40h-60z"/><path class="sk" d="M620 420V200M620 200h50v30h-50"/><path class="sk" d="M0 420H800" opacity=".6"/>`;lab=`<text x="210" y="460">800 PERSONS · SIGNAL 5 RATED</text>`;}
  else if(t==="Greening"){let tr="";[110,250,390,530,670].forEach(x=>tr+=`M${x} 380V300M${x-40} 300a40 34 0 1 0 80 0a40 34 0 1 0-80 0`);
    art=`<path class="sk" d="M640 120a30 30 0 1 0 1 0" opacity=".6"/><path class="hi draw" d="${tr}"/><path class="sk" d="M0 380H800M0 400H800" opacity=".7"/><path class="sk" d="M40 392h40M140 392h40M240 392h40M340 392h40M440 392h40M540 392h40M640 392h40" opacity=".5"/>`;lab=`<text x="20" y="440">SHADED CORRIDOR · −3 °C SURFACE TARGET</text>`;}
  else{art=`<path class="hi draw" d="M400 420V160M370 420L400 160L430 420M380 300h40M375 360h50"/><path class="sk" d="M400 160m-18 0a18 18 0 1 0 36 0a18 18 0 1 0-36 0"/><path class="sk" d="M440 140q30 20 0 40M460 120q50 40 0 80M360 140q-30 20 0 40M340 120q-50 40 0 80"/>
      <path class="sk" d="${waves(430,3,3)}" opacity=".45"/><path class="sk" d="M560 420V340M548 340h24"/>`;lab=`<text x="580" y="350">WATER-LEVEL GAUGE</text><text x="440" y="240">SIREN</text>`;
    if(g)art+=`<path class="gap" d="M380 140L420 180M420 140L380 180"/>`,lab+=`<text class="r" x="440" y="270">OFFLINE</text>`;}
  return `<svg class="schem" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><clipPath id="L"><rect width="330" height="500"/></clipPath></defs><path class="gr" d="${grid}"/><path class="gr2" d="${g2}"/>${art}${lab}</svg>`;}
function renderProject(){const c=C[cur.c],p=c.projects[cur.p],g=gapOf(p),sc=STAT[p.status].css;projPanel.style.setProperty("--c",g?"#ff2e5b":sc);
  $("#pCrumbs").innerHTML=`<span>PH</span><span class="sep">▸</span><span>${esc(c.name)}</span><span class="sep">▸</span><b>${esc(p.type)}</b><span class="sample">SAMPLE DATA</span>`;
  $("#pCount").innerHTML=`PROJECT <b>${cur.p+1}</b> / ${c.projects.length}`;$("#fcoord").textContent=`${fmtLat(c.lat+p.dy)} ${fmtLon(c.lon+p.dx)}`;
  const segs=Array.from({length:20},(_,k)=>`<i style="--k:${k}" class="${k<Math.round(p.progress/5)?"f":""}"></i>`).join("");
  const ms=[];if(p.start)ms.push([p.start,"Work started"]);p.evidence.filter(e=>e[1]==="LGU update").slice().reverse().forEach(e=>ms.push([e[0],e[2]]));ms.push([p.deadline,"Deadline in "+c.lccap]);if(p.done)ms.push([p.done,"Completed"]);
  ms.sort((a,b)=>ym(a[0])-ym(b[0]));const t0=Math.min(ym(ms[0][0]),NOW)-2,t1=Math.max(ym(ms[ms.length-1][0]),NOW)+2,pos=t=>((t-t0)/(t1-t0)*100).toFixed(2)+"%";
  const reply=p.fu.reply?`<p class="reply">${esc(p.fu.reply)}</p>`:p.fu.awaiting?`<p class="reply none">A follow-up letter was sent. The 15-working-day reply clock is running.</p>`:p.fu.sent?`<p class="reply none">No reply recorded since the last follow-up. Silence is shown on the scorecard.</p>`:`<p class="reply none">No follow-up sent yet.</p>`;
  const h=hash64(p.id+p.status+p.progress);
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
   <li class="step" style="--i:6"><span class="eyebrow">Evidence</span><ul class="ev">${p.evidence.map(e=>`<li class="${e[4]==="mine"?"mine":""}"><span class="d">${fmtYM(e[0])}</span><span><b>${esc(e[1])}${e[4]==="mine"?" (you)":""} · <span class="${e[3]?"v":"u"}">${e[3]?"corroborated":"unverified"}</span></b>${esc(e[2])}${e[5]&&e[5].length?`<br><small class="u">Flagged for a reviewer: ${esc(e[5].join("; "))}</small>`:""}</span></li>`).join("")}</ul>
     <p style="margin:10px 0 0"><span class="badge" title="In production, status changes and evidence are timestamped on Stellar so records cannot be quietly edited. Not connected in this version.">Simulated record hash · ${h.slice(0,8)}…${h.slice(-6)} · Stellar not connected</span></p></li></ol>`;
  $("#info").scrollTop=0;
  const el=$("#pct"),to=p.progress,start=performance.now()+700,dur=reduced?1:1100;(function tick(now){const k=Math.max(0,Math.min(1,(now-start)/dur));el.textContent=Math.round(to*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(tick);})(performance.now());
  renderMedia(p);updateNav();}
let mediaTok=0;async function renderMedia(p){const tok=++mediaTok;const ph=await Photos.get(p.id);if(tok!==mediaTok)return;
  if(ph){$("#media").innerHTML=`<img class="kb" src="${ph.url}" alt="Citizen photo report: ${esc(p.name)}">`;$("#ftag").textContent=ph.meta.kind==="dispute"?"CITIZEN DISPUTE · UNVERIFIED":"CITIZEN PHOTO · UNVERIFIED";
    $("#fcap").textContent="Your photo stays on this device; location data was stripped. Your written report was sent for triage and stays unverified until two more matching reports or a satellite check back it up.";}
  else{$("#media").innerHTML=schematic(p);$("#ftag").textContent="SCHEMATIC";$("#fcap").textContent=`No field photo yet. Citizen photos, satellite checks and LGU updates appear here as evidence.`;}
  $("#factions").innerHTML=`<button class="btn-sm" data-act="report">＋ ${ph?"Replace":"Add"} photo report</button>`;}
projPanel.addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(!b)return;const a=b.dataset.act;if(a==="letter")openLetter(cur.c,cur.p);else if(a==="report")openReport("status");else if(a==="dispute")openReport("dispute");});

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

/* ================= DEMO MODE (server simulation) ================= */
function toggleDemo(){if(busy)return;demo?endDemo():startDemo();}
function applyDemoUI(){document.body.classList.toggle("demo-on",demo);$("#demoBar").classList.toggle("on",demo);$("#demoBtn").setAttribute("aria-pressed",String(demo));$("#demoBtn").lastChild.textContent=demo?"END DEMO":"TYPHOON DEMO";}
async function reload(opts={}){const d=await api.get("/explore");toCities(d,{mine:loadMine()}).forEach((n,i)=>Object.assign(C[i],n));demo=Boolean(d.simulation);applyDemoUI();
  refreshPins();refreshCityLabels();renderFilters();renderLog();
  if(mode==="city"){const st=cityPanel.scrollTop;renderCity({keepScroll:1,...opts});if(!opts.bump)cityPanel.scrollTop=st;}else if(mode==="project")renderProject();}
async function startDemo(){let r;try{r=await api.post("/simulate/typhoon");}catch(e){toast(e.message);return;}demo=true;applyDemoUI();
  if(!noGL){typhoon.visible=true;typhoon.userData.t=0;typhoon.userData.tT=.62;
    if(mode==="map"){busy=true;tweenTo(new THREE.Vector3(PX(123.5),0,PZ(13.4)),new THREE.Spherical(120,.55,curSph().theta),1600,()=>{busy=false;});}}
  setTimeout(()=>afterStorm(r),noGL||reduced?300:2600);}
async function afterStorm(r){await reload({bump:true,newAdv:true});
  const ci=mode==="city"||mode==="project"?cur.c:Math.max(0,C.findIndex(c=>c.pilot));const c=C[ci];const a=r.affected.find(x=>x.city_id===c.id);
  toast(`${a?`${c.name}: Wind Signal No. ${a.signal}. Risk is now ${a.real_risk_level}.`:`${r.name} is not affecting ${c.name}.`} ${r.awaiting_approval} drafts are waiting for approval.`,"Review drafts",()=>{location.href="/ops";});}
async function endDemo(){try{await api.post("/simulate/reset");}catch(e){toast(e.message);return;}demo=false;applyDemoUI();
  if(!noGL){typhoon.userData.tT=0;typhoon.userData.t=0;}await reload();toast("Simulation ended. Unapproved simulated drafts were discarded.");}
$("#demoBtn").addEventListener("click",toggleDemo);$("#demoEnd").addEventListener("click",endDemo);

/* ================= buttons & keys ================= */
$("#btnNext").addEventListener("click",goNext);$("#btnBack").addEventListener("click",goBack);$("#btnMap").addEventListener("click",goMap);
$("#strip").addEventListener("click",e=>{const b=e.target.closest("button");if(b)jump(+b.dataset.k);});
$("#startTour").addEventListener("click",()=>enterCity(0));
function zoomBy(f){if(busy||noGL)return;const s=curSph();s.radius=THREE.MathUtils.clamp(s.radius*f,controls.minDistance,controls.maxDistance);tweenTo(controls.target.clone(),s,380);}
function rotBy(a){if(busy||noGL)return;const s=curSph();s.theta+=a;tweenTo(controls.target.clone(),s,520);}
$("#zIn").addEventListener("click",()=>zoomBy(.66));$("#zOut").addEventListener("click",()=>zoomBy(1.5));
$("#rL").addEventListener("click",()=>rotBy(Math.PI/6));$("#rR").addEventListener("click",()=>rotBy(-Math.PI/6));
$("#tilt").addEventListener("click",()=>{if(busy||noGL)return;const s=curSph();s.phi=s.phi>.4?.08:.72;tweenTo(controls.target.clone(),s,700);});
$("#home").addEventListener("click",()=>{if(busy||noGL)return;tweenTo(OV_TARGET(),overviewSph(),1100);});
addEventListener("keydown",e=>{if(e.target.matches("input,textarea,select"))return;const open=[...document.querySelectorAll(".modal")].find(m=>!m.hidden);
  if(open){if(e.key==="Escape")closeModal(open);return;}
  if(mode==="city"||mode==="project"){if(e.key==="ArrowRight"){e.preventDefault();goNext();}else if(e.key==="ArrowLeft"){e.preventDefault();goBack();}else if(e.key==="m"||e.key==="M"||e.key==="Escape")goMap();}
  else if(mode==="map"){if(e.key==="+"||e.key==="=")zoomBy(.66);else if(e.key==="-")zoomBy(1.5);}});

/* ================= picking ================= */
const ray=window.THREE?new THREE.Raycaster():null,ndc={x:0,y:0};let needPick=false,lastPtr=null,downAt=null;
const plane=window.THREE?new THREE.Plane(new THREE.Vector3(0,1,0),-LAND):null,tmp=window.THREE?new THREE.Vector3():null;
function pickAt(){if(noGL||busy)return null;ray.setFromCamera(ndc,camera);let list=[];
  if(mode==="map")list=cityPins.filter(p=>p.g.visible).map(p=>p.hit);else if(mode==="city")list=(projPins[cur.c]||[]).map(p=>p.hit);else return null;
  const ll=ray.ray.intersectPlane(plane,tmp);if(ll){const g=unproj(ll.x,ll.z);$("#ll").textContent=`${g.lat.toFixed(2)}°N ${g.lon.toFixed(2)}°E`;}
  const hits=ray.intersectObjects(list,false);return hits.length?hits[0].object.userData:null;}
canvas.addEventListener("pointermove",e=>{ndc.x=e.clientX/innerWidth*2-1;ndc.y=-(e.clientY/innerHeight)*2+1;lastPtr={x:e.clientX,y:e.clientY};needPick=true;});
canvas.addEventListener("pointerdown",e=>{downAt={x:e.clientX,y:e.clientY};$("#hint").classList.add("gone");});
canvas.addEventListener("pointerup",e=>{if(!downAt)return;const moved=Math.hypot(e.clientX-downAt.x,e.clientY-downAt.y);downAt=null;if(moved>=6)return;
  ndc.x=e.clientX/innerWidth*2-1;ndc.y=-(e.clientY/innerHeight)*2+1;const h=pickAt();if(!h)return;if(h.kind==="city")enterCity(h.i);else if(h.kind==="proj")openProject(h.pi);});
canvas.addEventListener("pointerleave",()=>setHover(null));

/* ================= loop ================= */
const v3=window.THREE?new THREE.Vector3():null;
function labelLoop(dist){const W=innerWidth,H=innerHeight;
  for(const w of wls){let show=true,op=1;
    if(w.city!=null){const p=cityPins[w.city];show=mode==="map"&&p.g.visible&&(dist<120||p.hover);v3.copy(p.g.position);v3.y+=(p.h+1.6)*p.g.scale.y;}
    else if(w.proj){show=(mode==="city")&&w.proj[0]===cur.c;const pp=projPins[w.proj[0]][w.proj[1]];v3.copy(pp.g.position);v3.y+=(pp.h+.3)*pp.g.scale.y;}
    else if(w.evac!=null){show=mode==="city"&&w.evac===cur.c;v3.copy(w.p);}
    else{v3.copy(w.p);show=mode==="map";if(w.cls==="region")op=THREE.MathUtils.clamp((dist-45)/60,0,1);else op=THREE.MathUtils.clamp((dist-70)/60,0,1);}
    if(show){v3.project(camera);if(v3.z>1||v3.x<-1.2||v3.x>1.2||v3.y<-1.2||v3.y>1.2)show=false;}
    if(!show||op<=0){if(w.vis!==false){w.el.style.visibility="hidden";w.vis=false;}continue;}
    if(w.vis!==true){w.el.style.visibility="visible";w.vis=true;}w.el.style.opacity=op;
    const x=(v3.x*.5+.5)*W,y=(-v3.y*.5+.5)*H;w.el.style.transform=(w.city!=null||w.proj)?`translate(${x}px,${y}px) translate(-50%,-130%)`:`translate(${x}px,${y}px) translate(-50%,-50%)`;}}
function loop(){requestAnimationFrame(loop);if(noGL)return;const now=performance.now(),t=now/1000;
  if(anim){const k=Math.min(1,(now-anim.t0)/anim.dur);anim.step(anim.ease(k));if(k>=1){const cb=anim.cb;anim=null;controls.enabled=true;controls.update();cb&&cb();}}
  else{controls.update();const tg=controls.target;tg.x=THREE.MathUtils.clamp(tg.x,-70,70);tg.z=THREE.MathUtils.clamp(tg.z,-90,90);}
  vo+=(voT-vo)*.08;applyVO();
  ocean.material.uniforms.uTime.value=t;chain.forEach(r=>r.mat.uniforms.uTime.value=t);
  const dist=camera.position.distanceTo(controls.target),sc=THREE.MathUtils.clamp(dist/66,.14,2.5);
  cityPins.forEach((p,i)=>{p.h+=(p.hT-p.h)*.06;const hs=p.hover?1.3:1;p.g.scale.setScalar(sc*hs);[p.beam,p.halo].forEach(m=>{m.scale.y=p.h;m.position.y=p.h/2;});p.hit.scale.y=p.h+2.2;p.hit.position.y=(p.h+2.2)/2;
    const y=p.h+.55+Math.sin(t*2+i)*.14;p.head.position.y=y;p.spr.position.y=y;p.head.rotation.y=t*1.3+i;p.head.material.color.copy(p.hover?new THREE.Color(0xffffff):p.col);
    const ph=(t*.7+i*.137)%1;p.pulse.scale.setScalar(1+ph*1.4);p.pulse.material.opacity=.7*(1-ph);
    const inCity=(mode!=="map")&&i===cur.c;p.g.visible=pass(C[i])&&!(inCity&&dist<30);});
  const psc=THREE.MathUtils.clamp(dist/6.5,.6,2.2);
  projPins.forEach(arr=>arr.forEach((p,k)=>{if(!p.g.visible)return;p.g.scale.setScalar(psc*(p.hover?1.35:1));p.head.rotation.y=t*1.5+k;
    if(p.gap){const ph=(t*.9+k*.2)%1;p.ring.scale.setScalar(1+ph*1.6);p.ring.material.opacity=.9*(1-ph);}p.head.material.color.copy(p.hover?new THREE.Color(0xffffff):p.col);}));
  const tu=typhoon.userData;tu.t+=(tu.tT-tu.t)*.012;const sv=tu.tT>0;typhoon.visible=sv;
  if(sv){const pt=tu.curve.getPoint(Math.max(.001,tu.t));tu.storm.position.copy(pt);tu.sp.material.rotation=-t*.9;const a=Math.min(1,tu.t/.1);tu.sp.material.opacity=.95*a;typhoon.children[0].material.opacity=.8*a;
    ocean.material.uniforms.uStorm.value.set(pt.x,pt.z,a);}else ocean.material.uniforms.uStorm.value.z=0;
  particles.rotation.y=t*.006;
  if(needPick&&!anim&&(mode==="map"||mode==="city")){needPick=false;const h=pickAt();setHover(h?(h.kind==="city"?{kind:"city",i:h.i}:{kind:"proj",ci:h.ci,pi:h.pi}):null);}
  if(hover&&lastPtr&&!tip.hidden)tip.style.transform=`translate(${Math.min(lastPtr.x+18,innerWidth-280)}px,${Math.min(lastPtr.y+18,innerHeight-160)}px)`;
  renderer.render(scene,camera);labelLoop(dist);}
addEventListener("resize",()=>{if(noGL)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);applyVO();});

/* ================= boot ================= */
function start(){refreshPins();refreshCityLabels();renderFilters();renderLog();applyDemoUI();
  $("#logAsOf").textContent=`CITY LOG · AS OF ${fmtYM(AS_OF).toUpperCase()}`;
  if(demo&&!noGL){typhoon.visible=true;typhoon.userData.t=typhoon.userData.tT=.62;}
  const t=parseRoute();
  if(!noGL&&!t)tweenTo(OV_TARGET(),overviewSph(),reduced?10:2600,null);
  loop();if(t)routeTo(t);setTimeout(()=>$("#hint").classList.add("gone"),14000);}
start();
