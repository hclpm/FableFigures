/* ===========================================================================
   Fable Figures — editor engine + desktop shell.  Crafted by Lee.
   =========================================================================== */
"use strict";
const SVGNS="http://www.w3.org/2000/svg";
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const {ICONS,iconSVG,ICON_SIZES,BIO_GROUPS,HUMAN_GROUPS,SHAPES,ARROW_HEADS,ARROW_PRESETS,NETWORK_PRESETS,FONTS,ARTBOARDS,I18N}=window.CAM;
const RECOLOR=new Set(window.CAM.RECOLOR_ICONS||[]);
const isElectron=!!(window.camrender&&window.camrender.isElectron);

/* ---------------- persistence ---------------- */
const LS_PROJ="camrender.projects", LS_SET="camrender.settings";
let projectsCache=null;   // when a project folder is set (file mode), projects live here
function fileMode(){return !!(isElectron&&window.camrender&&window.camrender.libWrite&&settings&&settings.projectDir);}
function libFile(){return settings.projectDir.replace(/[\\/]+$/,"")+"/fable-figures-library.json";}
function loadProjects(){if(fileMode())return projectsCache||[];try{return JSON.parse(localStorage.getItem(LS_PROJ)||"[]");}catch{return[];}}
function saveProjects(p){if(fileMode()){projectsCache=p;try{window.camrender.libWrite({file:libFile(),data:JSON.stringify(p)});}catch(e){}}else localStorage.setItem(LS_PROJ,JSON.stringify(p));}
async function refreshProjectsCache(){if(!fileMode()){projectsCache=null;return;}try{const txt=await window.camrender.libRead(libFile());projectsCache=txt?JSON.parse(txt):[];}catch(e){projectsCache=[];}}
function loadSettings(){const def={lang:"en",appearance:"light",theme:"ivory",artboard:"slide",autosave:true,projectDir:""};try{return Object.assign(def,JSON.parse(localStorage.getItem(LS_SET)||"{}"));}catch{return def;}}
function saveSettings(){localStorage.setItem(LS_SET,JSON.stringify(settings));}
let settings=loadSettings();
function T(k){return (I18N[settings.lang]&&I18N[settings.lang][k])||I18N.en[k]||k;}

/* ---------------- editor state ---------------- */
const ART={w:1600,h:1000};
const state={seq:1,objs:[],sel:[],view:{zoom:1,tx:0,ty:0},bg:{color:"#FFFFFF",image:null},uploads:[],art:"slide"};
let curProjectId=null, dirty=false;
const content=$("content"),objlayer=$("objlayer"),overlay=$("overlay"),bglayer=$("bglayer"),stage=$("stage");
function gid(){return "o"+(state.seq++);}
function markDirty(){dirty=true;}

const history={undo:[],redo:[]};
function snapshot(){return JSON.stringify({objs:state.objs,bg:state.bg,seq:state.seq});}
function pushHistory(){history.undo.push(snapshot());if(history.undo.length>120)history.undo.shift();history.redo.length=0;updateUndo();markDirty();}
function commitPre(p){if(p==null)return;history.undo.push(p);if(history.undo.length>120)history.undo.shift();history.redo.length=0;updateUndo();markDirty();}
function restore(s){const d=JSON.parse(s);state.objs=d.objs;state.bg=d.bg;state.seq=d.seq;state.sel=state.sel.filter(id=>objById(id));render();renderProps();}
function undo(){if(!history.undo.length)return;history.redo.push(snapshot());restore(history.undo.pop());updateUndo();markDirty();}
function redo(){if(!history.redo.length)return;history.undo.push(snapshot());restore(history.redo.pop());updateUndo();markDirty();}
function updateUndo(){$("undoBtn").disabled=!history.undo.length;$("redoBtn").disabled=!history.redo.length;}

function rot(px,py,a){const c=Math.cos(a),s=Math.sin(a);return{x:px*c-py*s,y:px*s+py*c};}
function objById(id){return state.objs.find(o=>o.id===id);}
function isSel(id){return state.sel.includes(id);}
function selObjs(){return state.sel.map(objById).filter(Boolean);}
function toCanvas(e){const p=stage.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const m=content.getScreenCTM().inverse();const r=p.matrixTransform(m);return{x:r.x,y:r.y};}

/* ============================ SHAPES ============================ */
function shapePath(kind,x,y,w,h,fill,stroke,sw,extra){
  extra=extra||"";const a=`fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}`;const r=Math.min(w,h),cx=x+w/2,cy=y+h/2;
  const poly=(pts)=>`<polygon points="${pts}" stroke-linejoin="round" ${a}/>`;
  switch(kind){
    case "rect": return `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${a}/>`;
    case "round": return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(20,r*0.18)}" ${a}/>`;
    case "ellipse": return `<ellipse cx="${cx}" cy="${cy}" rx="${w/2}" ry="${h/2}" ${a}/>`;
    case "circle": {const rr=Math.min(w,h)/2;return `<circle cx="${cx}" cy="${cy}" r="${rr}" ${a}/>`;}
    case "diamond": return poly(`${cx},${y} ${x+w},${cy} ${cx},${y+h} ${x},${cy}`);
    case "triangle": return poly(`${cx},${y} ${x+w},${y+h} ${x},${y+h}`);
    case "rtriangle": return poly(`${x},${y} ${x},${y+h} ${x+w},${y+h}`);
    case "pillshape": return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h/2}" ${a}/>`;
    case "hexagon":{const q=w*0.25;return poly(`${x+q},${y} ${x+w-q},${y} ${x+w},${cy} ${x+w-q},${y+h} ${x+q},${y+h} ${x},${cy}`);}
    case "pentagon":{return poly([0,1,2,3,4].map(i=>{const an=-Math.PI/2+i*2*Math.PI/5;return (cx+Math.cos(an)*w/2)+","+(cy+Math.sin(an)*h/2);}).join(" "));}
    case "octagon":{return poly([0,1,2,3,4,5,6,7].map(i=>{const an=-Math.PI/2+Math.PI/8+i*Math.PI/4;return (cx+Math.cos(an)*w/2*1.08)+","+(cy+Math.sin(an)*h/2*1.08);}).join(" "));}
    case "parallelogram":{const q=w*0.22;return poly(`${x+q},${y} ${x+w},${y} ${x+w-q},${y+h} ${x},${y+h}`);}
    case "trapezoid":{const q=w*0.2;return poly(`${x+q},${y} ${x+w-q},${y} ${x+w},${y+h} ${x},${y+h}`);}
    case "chevron":{const q=w*0.3;return poly(`${x},${y} ${x+w-q},${y} ${x+w},${cy} ${x+w-q},${y+h} ${x},${y+h} ${x+q},${cy}`);}
    case "arrowblock":{const t=h*0.3,hd=w*0.32;return poly(`${x},${y+t} ${x+w-hd},${y+t} ${x+w-hd},${y} ${x+w},${cy} ${x+w-hd},${y+h} ${x+w-hd},${y+h-t} ${x},${y+h-t}`);}
    case "cylinder":{const ry=Math.min(h*0.16,16);return `<path d="M${x} ${y+ry}a${w/2} ${ry} 0 0 1 ${w} 0v${h-2*ry}a${w/2} ${ry} 0 0 1 ${-w} 0z" ${a}/><path d="M${x} ${y+ry}a${w/2} ${ry} 0 0 0 ${w} 0" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;}
    case "star":{let p="";for(let i=0;i<10;i++){const an=-Math.PI/2+i*Math.PI/5,rad=i%2?r*0.2:r*0.45;p+=`${cx+Math.cos(an)*rad*(w/r)},${cy+Math.sin(an)*rad*(h/r)} `;}return poly(p);}
    case "star6":{let p="";for(let i=0;i<12;i++){const an=-Math.PI/2+i*Math.PI/6,rad=i%2?r*0.24:r*0.46;p+=`${cx+Math.cos(an)*rad*(w/r)},${cy+Math.sin(an)*rad*(h/r)} `;}return poly(p);}
    case "burst":{let p="";for(let i=0;i<24;i++){const an=-Math.PI/2+i*Math.PI/12,rad=i%2?r*0.30:r*0.48;p+=`${cx+Math.cos(an)*rad*(w/r)},${cy+Math.sin(an)*rad*(h/r)} `;}return poly(p);}
    case "heart":{return `<path d="M${cx} ${y+h*0.92} C ${x-w*0.1} ${y+h*0.55}, ${x+w*0.1} ${y}, ${cx} ${y+h*0.3} C ${x+w*0.9} ${y}, ${x+w*1.1} ${y+h*0.55}, ${cx} ${y+h*0.92} Z" ${a}/>`;}
    case "crescent":{return `<path d="M${cx} ${y} a ${w/2} ${h/2} 0 1 0 ${w*0.18} ${h} a ${w*0.34} ${h*0.42} 0 1 1 ${-w*0.18} ${-h} Z" ${a}/>`;}
    case "ring":{const ro=Math.min(w,h)/2,ri=ro*0.55;return `<path d="M${cx} ${cy-ro} a ${ro} ${ro} 0 1 0 0.01 0 Z M${cx} ${cy-ri} a ${ri} ${ri} 0 1 1 -0.01 0 Z" fill-rule="evenodd" ${a}/>`;}
    case "semicircle":{return `<path d="M${x} ${y+h} A ${w/2} ${h} 0 0 1 ${x+w} ${y+h} Z" ${a}/>`;}
    case "quarter":{return `<path d="M${x} ${y+h} L ${x} ${y} A ${w} ${h} 0 0 1 ${x+w} ${y+h} Z" ${a}/>`;}
    case "bracket":{return `<path d="M${x+w*0.5} ${y} H ${x} V ${y+h} H ${x+w*0.5}" fill="none" stroke="${stroke}" stroke-width="${Math.max(sw,3)}" stroke-linecap="round" stroke-linejoin="round"/>`;}
    case "brace":{return `<path d="M${x+w} ${y} q ${-w*0.6} 0 ${-w*0.6} ${h*0.25} q 0 ${h*0.25} ${-w*0.4} ${h*0.25} q ${w*0.4} 0 ${w*0.4} ${h*0.25} q 0 ${h*0.25} ${w*0.6} ${h*0.25}" fill="none" stroke="${stroke}" stroke-width="${Math.max(sw,3)}" stroke-linecap="round"/>`;}
    case "callout":{const rr=Math.min(16,r*0.18);return `<path d="M${x+rr} ${y}h${w-2*rr}a${rr} ${rr} 0 0 1 ${rr} ${rr}v${h*0.6-rr}a${rr} ${rr} 0 0 1 ${-rr} ${rr}h${-w*0.28}l${-w*0.12} ${h*0.22}l0 ${-h*0.22}h${-(w*0.6-rr)}a${rr} ${rr} 0 0 1 ${-rr} ${-rr}v${-(h*0.6-rr)}a${rr} ${rr} 0 0 1 ${rr} ${-rr}z" stroke-linejoin="round" ${a}/>`;}
    case "document":{return `<path d="M${x} ${y}h${w}v${h*0.8}c${-w*0.25} ${h*0.18} ${-w*0.25} ${-h*0.18} ${-w*0.5} 0c${-w*0.25} ${h*0.18} ${-w*0.25} ${-h*0.18} ${-w*0.5} 0z" stroke-linejoin="round" ${a}/>`;}
    case "cloud":{return `<path d="M${x+w*0.28} ${y+h*0.8}a${h*0.22} ${h*0.22} 0 0 1 0 ${-h*0.42}a${w*0.18} ${w*0.18} 0 0 1 ${w*0.3} ${-h*0.12}a${w*0.2} ${w*0.2} 0 0 1 ${w*0.36} ${h*0.06}a${h*0.2} ${h*0.2} 0 0 1 ${-w*0.04} ${h*0.5}z" stroke-linejoin="round" ${a}/>`;}
    case "plus":{const t=0.34;return poly(`${x+w*(0.5-t/2)},${y} ${x+w*(0.5+t/2)},${y} ${x+w*(0.5+t/2)},${y+h*(0.5-t/2)} ${x+w},${y+h*(0.5-t/2)} ${x+w},${y+h*(0.5+t/2)} ${x+w*(0.5+t/2)},${y+h*(0.5+t/2)} ${x+w*(0.5+t/2)},${y+h} ${x+w*(0.5-t/2)},${y+h} ${x+w*(0.5-t/2)},${y+h*(0.5+t/2)} ${x},${y+h*(0.5+t/2)} ${x},${y+h*(0.5-t/2)} ${x+w*(0.5-t/2)},${y+h*(0.5-t/2)}`);}
    default: return `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${a}/>`;
  }
}
function shapeThumb(kind){return `<svg viewBox="0 0 100 100">${shapePath(kind,10,18,80,64,"currentColor","#6b675d",2)}</svg>`;}

/* ============================ RENDER ============================ */
function colorFilter(o){
  const b=o.brightness==null?100:o.brightness,s=o.saturate==null?100:o.saturate,hu=o.hue||0,tint=o.tint,ta=o.tintAmt||0;
  const has=b!==100||s!==100||hu!==0||(tint&&ta>0);
  if(!has&&!o.shadow)return{def:"",ref:""};
  let p="",last="SourceGraphic";
  if(b!==100){p+=`<feComponentTransfer in="${last}" result="fb"><feFuncR type="linear" slope="${b/100}"/><feFuncG type="linear" slope="${b/100}"/><feFuncB type="linear" slope="${b/100}"/></feComponentTransfer>`;last="fb";}
  if(s!==100){p+=`<feColorMatrix in="${last}" type="saturate" values="${(s/100).toFixed(3)}" result="fs"/>`;last="fs";}
  if(hu!==0){p+=`<feColorMatrix in="${last}" type="hueRotate" values="${hu}" result="fh"/>`;last="fh";}
  if(tint&&ta>0){p+=`<feFlood flood-color="${tint}" flood-opacity="${(ta/100).toFixed(3)}" result="ff"/><feComposite in="ff" in2="${last}" operator="atop" result="ft"/>`;last="ft";}
  if(o.shadow){p+=`<feDropShadow in="${last}" dx="0" dy="2" stdDeviation="${o.shadowBlur||5}" flood-color="#000" flood-opacity="0.22"/>`;}
  return{def:`<defs><filter id="cf-${o.id}" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">${p}</filter></defs>`,ref:`filter="url(#cf-${o.id})"`};
}
function objMarkup(o){
  const w=o.w,h=o.h,x=-w/2,y=-h/2;
  if(o.type==="shape"){const sh=o.shadow?`filter="url(#sh-${o.id})"`:"";return defsShadow(o)+shapePath(o.shapeKind,x,y,w,h,o.fill,o.stroke,o.strokeWidth,`${o.dash?`stroke-dasharray="${o.strokeWidth*2.4} ${o.strokeWidth*2}"`:""} ${sh} opacity="${o.opacity}"`);}
  if(o.type==="icon"){const f=colorFilter(o);return (f.def||"")+`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 100 100" opacity="${o.opacity}" style="color:${o.fill||'#3A3F45'}" ${f.ref}>${iconSVG(o.shapeKind,o.id)}</svg>`;}
  if(o.type==="image"){const f=colorFilter(o);const clip=o.radius?`clip-path="inset(0 round ${o.radius}px)"`:"";return (f.def||"")+`<image x="${x}" y="${y}" width="${w}" height="${h}" href="${o.href}" preserveAspectRatio="${o.fit==='contain'?'xMidYMid meet':'xMidYMid slice'}" opacity="${o.opacity}" ${clip} ${f.ref}/>`;}
  if(o.type==="text"){
    if(o._editing)return "";   // hidden while the inline editor is open, so text isn't drawn twice
    const lines=String(o.text||"").split("\n"),lh=o.fontSize*1.25;
    const anchor=o.align==="center"?"middle":o.align==="right"?"end":"start";
    const tx=o.align==="center"?0:o.align==="right"?w/2:-w/2;
    const ital=o.italic?`font-style="italic"`:"",deco=o.underline?`text-decoration="underline"`:"";
    let t=`<text text-anchor="${anchor}" font-family="${o.font||FONTS[0][0]}" font-size="${o.fontSize}" font-weight="${o.weight}" ${ital} ${deco} fill="${o.fill}" opacity="${o.opacity}" style="white-space:pre">`;
    lines.forEach((ln,i)=>{t+=`<tspan x="${tx}" y="${-h/2+o.fontSize+i*lh}" ${deco}>${escapeXml(ln||" ")}</tspan>`;});
    return t+`</text>`;
  }
  return "";
}
function defsShadow(o){if(!o.shadow)return"";return `<defs><filter id="sh-${o.id}" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="2" stdDeviation="${o.shadowBlur||4}" flood-color="#000" flood-opacity="0.22"/></filter></defs>`;}
function escapeXml(s){return s.replace(/[<>&]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;"}[c]));}

function render(){
  const v=state.view;content.setAttribute("transform",`translate(${v.tx},${v.ty}) scale(${v.zoom})`);
  const bgImg=state.bg.image?`<image x="0" y="0" width="${ART.w}" height="${ART.h}" href="${state.bg.image}" preserveAspectRatio="xMidYMid slice"/>`:"";
  bglayer.innerHTML=`<rect x="-6" y="-6" width="${ART.w+12}" height="${ART.h+12}" rx="10" fill="#000" opacity="0.05"/><rect x="0" y="0" width="${ART.w}" height="${ART.h}" fill="${state.bg.color}"/>${bgImg}<rect x="0" y="0" width="${ART.w}" height="${ART.h}" fill="none" stroke="#E0DCCF" stroke-width="1"/>`;
  let html="";
  for(const o of state.objs){if(o.type==="connector"){html+=connectorMarkup(o);continue;}html+=`<g class="obj" data-id="${o.id}" transform="translate(${o.x},${o.y}) rotate(${o.rot||0})">${objMarkup(o)}</g>`;}
  objlayer.innerHTML=html;renderOverlay();
}
function groupBBox(objs){let mnx=1e9,mny=1e9,mxx=-1e9,mxy=-1e9,f=false;for(const o of objs){if(o.type==="connector"){const e=connEndpoints(o);if(e)for(const p of[e.p1,e.p2]){mnx=Math.min(mnx,p.x);mny=Math.min(mny,p.y);mxx=Math.max(mxx,p.x);mxy=Math.max(mxy,p.y);f=true;}continue;}const a=(o.rot||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);for(const sg of[[-1,-1],[1,-1],[1,1],[-1,1]]){const lx=sg[0]*o.w/2,ly=sg[1]*o.h/2,px=o.x+lx*c-ly*s,py=o.y+lx*s+ly*c;mnx=Math.min(mnx,px);mny=Math.min(mny,py);mxx=Math.max(mxx,px);mxy=Math.max(mxy,py);f=true;}}return f?{x:mnx,y:mny,w:mxx-mnx,h:mxy-mny}:null;}
function renderOverlay(){
  const z=state.view.zoom,hs=5.25/z,rs=4.5/z;let html="";const sel=selObjs();
  if(sel.length>1){const bb=groupBBox(sel);if(bb){for(const o of sel){if(o.type==="connector")continue;html+=`<rect x="${-o.w/2}" y="${-o.h/2}" width="${o.w}" height="${o.h}" transform="translate(${o.x},${o.y}) rotate(${o.rot||0})" fill="none" stroke="var(--accent)" stroke-width="${0.8/z}" opacity=".45"/>`;}html+=`<rect class="selbox" x="${bb.x}" y="${bb.y}" width="${bb.w}" height="${bb.h}" stroke-width="${1.5/z}" stroke-dasharray="${5/z} ${4/z}"/>`;const cs=[["g-nw",bb.x,bb.y],["g-ne",bb.x+bb.w,bb.y],["g-se",bb.x+bb.w,bb.y+bb.h],["g-sw",bb.x,bb.y+bb.h]];for(const c of cs)html+=`<rect class="handle" data-handle="${c[0]}" x="${c[1]-hs}" y="${c[2]-hs}" width="${hs*2}" height="${hs*2}" rx="${hs}" stroke-width="${0.8/z}"/>`;const gmx=bb.x+bb.w/2;html+=`<line x1="${gmx}" y1="${bb.y}" x2="${gmx}" y2="${bb.y-24/z}" stroke="var(--accent)" stroke-width="${1.5/z}"/><circle class="rot-handle" data-handle="grot" cx="${gmx}" cy="${bb.y-24/z}" r="${rs}" stroke-width="${0.8/z}"/>`;overlay.innerHTML=html;return;}}
  for(const o of sel){if(o.type==="connector"){html+=connectorSel(o,z);continue;}const w=o.w,h=o.h,d=0.7071;const isC=o.type==="shape"&&o.shapeKind==="circle",isE=o.type==="shape"&&o.shapeKind==="ellipse",el=isC||isE;const rx=isC?Math.min(w,h)/2:w/2,ry=isC?Math.min(w,h)/2:h/2,topY=el?-ry:-h/2;html+=`<g transform="translate(${o.x},${o.y}) rotate(${o.rot||0})">`+(el?`<ellipse class="selbox" cx="0" cy="0" rx="${rx}" ry="${ry}" stroke-width="${1.5/z}"/>`:`<rect class="selbox" x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" stroke-width="${1.5/z}"/>`);const cs=el?[["nw",-rx*d,-ry*d],["ne",rx*d,-ry*d],["se",rx*d,ry*d],["sw",-rx*d,ry*d],["n",0,-ry],["e",rx,0],["s",0,ry],["w",-rx,0]]:[["nw",-w/2,-h/2],["ne",w/2,-h/2],["se",w/2,h/2],["sw",-w/2,h/2],["n",0,-h/2],["e",w/2,0],["s",0,h/2],["w",-w/2,0]];for(const c of cs)html+=`<rect class="handle" data-handle="${c[0]}" data-id="${o.id}" x="${c[1]-hs}" y="${c[2]-hs}" width="${hs*2}" height="${hs*2}" rx="${hs}" stroke-width="${0.8/z}"/>`;html+=`<line x1="0" y1="${topY}" x2="0" y2="${topY-22/z}" stroke="var(--accent)" stroke-width="${1.5/z}"/><circle class="rot-handle" data-handle="rot" data-id="${o.id}" cx="0" cy="${topY-22/z}" r="${rs}" stroke-width="${0.8/z}"/></g>`;}
  overlay.innerHTML=html;
}

/* ============================ CONNECTORS / ARROWS ============================ */
function anchorPoint(o,t){const cx=o.x,cy=o.y,hw=o.w/2,hh=o.h/2;let dx=t.x-cx,dy=t.y-cy;if(dx===0&&dy===0)return{x:cx,y:cy};const s=Math.min(hw/Math.abs(dx||1e-6),hh/Math.abs(dy||1e-6));return{x:cx+dx*s,y:cy+dy*s};}
/* fixed connection ports: 8 perimeter positions, sitting slightly OUTSIDE the border */
const PORT_MARGIN=10;
/* Local port positions (unrotated, relative to centre) sitting a UNIFORM gap
   (PORT_MARGIN) outside the object's outline: a ring for circle/ellipse, an
   offset rounded-rectangle for everything else — so every port is the same
   distance from the border, matching the object's shape. */
function portMode(o){return (o.type==="shape"&&(o.shapeKind==="circle"||o.shapeKind==="ellipse"))?o.shapeKind:"rect";}
function shapePortsLocal(o){
  const hw=o.w/2,hh=o.h/2,m=PORT_MARGIN,out=[],mode=portMode(o);
  if(mode==="circle"){const r=Math.min(hw,hh)+m;for(let i=0;i<8;i++){const a=i/8*2*Math.PI;out.push({idx:i,x:Math.cos(a)*r,y:Math.sin(a)*r});}}
  else if(mode==="ellipse"){for(let i=0;i<8;i++){const a=i/8*2*Math.PI;out.push({idx:i,x:Math.cos(a)*(hw+m),y:Math.sin(a)*(hh+m)});}}
  else{const d=m*0.70711,pts=[[hw+m,0],[hw+d,hh+d],[0,hh+m],[-(hw+d),hh+d],[-(hw+m),0],[-(hw+d),-(hh+d)],[0,-(hh+m)],[hw+d,-(hh+d)]];pts.forEach((p,i)=>out.push({idx:i,x:p[0],y:p[1]}));}
  return out;
}
function portWorld(o,port){
  const a=(o.rot||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);let lx,ly;
  if(port&&port.idx!=null){const L=shapePortsLocal(o),lp=L[port.idx]||L[0];lx=lp.x;ly=lp.y;}
  else{const hw=o.w/2,hh=o.h/2,px=(port&&port.lx||0)*hw,py=(port&&port.ly||0)*hh,len=Math.hypot(px,py)||1;lx=px+(px/len)*PORT_MARGIN;ly=py+(py/len)*PORT_MARGIN;}
  return{x:o.x+lx*c-ly*s,y:o.y+lx*s+ly*c};
}
function shapePortsWorld(o){const a=(o.rot||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return shapePortsLocal(o).map(lp=>({port:{idx:lp.idx},x:o.x+lp.x*c-lp.y*s,y:o.y+lp.x*s+lp.y*c}));}
/* resolve one end: fixed port → world point; free point → as-is; dynamic (id, no port) → null */
function endFixed(o,side){const id=side==="from"?o.fromId:o.toId,port=side==="from"?o.fromPort:o.toPort,pt=side==="from"?o.fromPt:o.toPt;if(id){const sh=objById(id);if(sh){if(port)return portWorld(sh,port);return null;}}return pt||null;}
function connEndpoints(o){
  const fr=objById(o.fromId),to=objById(o.toId);
  let p1=endFixed(o,"from"),p2=endFixed(o,"to");
  const c1=p1||(fr?{x:fr.x,y:fr.y}:o.fromPt),c2=p2||(to?{x:to.x,y:to.y}:o.toPt);
  if(p1==null){if(!fr)return null;p1=anchorPoint(fr,c2||{x:fr.x+1,y:fr.y});}
  if(p2==null){if(!to)return null;p2=anchorPoint(to,c1||{x:to.x+1,y:to.y});}
  if(!p1||!p2)return null;return{p1,p2};
}
function pathD(p1,p2,style){if(style==="curved"){const mx=(p1.x+p2.x)/2,my=(p1.y+p2.y)/2,dx=p2.x-p1.x,dy=p2.y-p1.y,of=0.2;return `M${p1.x} ${p1.y} Q ${mx-dy*of} ${my+dx*of} ${p2.x} ${p2.y}`;}if(style==="ortho"){const mx=(p1.x+p2.x)/2;return `M${p1.x} ${p1.y} L ${mx} ${p1.y} L ${mx} ${p2.y} L ${p2.x} ${p2.y}`;}return `M${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;}
/* how far the line should stop short of the tip so only the arrowhead shows there */
function headLen(type,size){switch(type){case"triangle":case"barbed":case"diamond":return size;case"openV":return size*0.55;case"circle":case"square":return size*0.7;default:return 0;}}
function connPath(o){const e=connEndpoints(o);if(!e)return{d:"",p1:{x:0,y:0},p2:{x:0,y:0}};const{p1,p2}=e;return{d:pathD(p1,p2,o.style),p1,p2};}
function headShape(type,tip,from,color,size,sw){
  const ang=Math.atan2(tip.y-from.y,tip.x-from.x),L=size,W=size*0.7;
  const back={x:tip.x-Math.cos(ang)*L,y:tip.y-Math.sin(ang)*L};
  const perp={x:Math.cos(ang+Math.PI/2),y:Math.sin(ang+Math.PI/2)};
  const a={x:back.x+perp.x*W,y:back.y+perp.y*W},b={x:back.x-perp.x*W,y:back.y-perp.y*W};
  switch(type){
    case "triangle": return `<polygon points="${tip.x},${tip.y} ${a.x},${a.y} ${b.x},${b.y}" fill="${color}"/>`;
    case "openV": return `<path d="M${a.x} ${a.y} L ${tip.x} ${tip.y} L ${b.x} ${b.y}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
    case "barbed": return `<polygon points="${tip.x},${tip.y} ${a.x},${a.y} ${back.x+Math.cos(ang)*L*0.4},${back.y+Math.sin(ang)*L*0.4} ${b.x},${b.y}" fill="${color}"/>`;
    case "circle": return `<circle cx="${tip.x-Math.cos(ang)*W}" cy="${tip.y-Math.sin(ang)*W}" r="${W}" fill="${color}"/>`;
    case "diamond": {const mid={x:tip.x-Math.cos(ang)*L,y:tip.y-Math.sin(ang)*L};return `<polygon points="${tip.x},${tip.y} ${(tip.x+mid.x)/2+perp.x*W},${(tip.y+mid.y)/2+perp.y*W} ${mid.x},${mid.y} ${(tip.x+mid.x)/2-perp.x*W},${(tip.y+mid.y)/2-perp.y*W}" fill="${color}"/>`;}
    case "square": return `<rect x="${tip.x-W}" y="${tip.y-W}" width="${W*2}" height="${W*2}" fill="${color}" transform="rotate(${ang*180/Math.PI} ${tip.x} ${tip.y})"/>`;
    case "line": return `<path d="M${tip.x+perp.x*W*1.3} ${tip.y+perp.y*W*1.3} L ${tip.x-perp.x*W*1.3} ${tip.y-perp.y*W*1.3}" stroke="${color}" stroke-width="${sw*1.3}" stroke-linecap="round"/>`; // inhibition ⊣
    default: return "";
  }
}
function connectorMarkup(o){
  const{d,p1,p2}=connPath(o);if(!d)return"";
  const dash=o.body==="dashed"?`stroke-dasharray="${o.strokeWidth*2.6} ${o.strokeWidth*2.2}"`:o.body==="dotted"?`stroke-dasharray="${o.strokeWidth*0.2} ${o.strokeWidth*2}"`:"";
  const hsz=(o.headSize||10);let heads="";
  if(o.head&&o.head!=="none")heads+=headShape(o.head,p2,p1,o.stroke,hsz,o.strokeWidth);
  if(o.tail&&o.tail!=="none")heads+=headShape(o.tail,p1,p2,o.stroke,hsz,o.strokeWidth);
  // shorten the visible line so it stops at the arrowhead base (only the head shows at the tip)
  const dx=p2.x-p1.x,dy=p2.y-p1.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
  const hi=(o.head&&o.head!=="none")?Math.min(headLen(o.head,hsz),len*0.45):0;
  const ti=(o.tail&&o.tail!=="none")?Math.min(headLen(o.tail,hsz),len*0.45):0;
  const lp1={x:p1.x+ux*ti,y:p1.y+uy*ti},lp2={x:p2.x-ux*hi,y:p2.y-uy*hi};
  const ld=pathD(lp1,lp2,o.style);
  const cap=(hi||ti)?"butt":"round";
  return `<g class="obj" data-id="${o.id}"><path class="conn-hit" d="${d}"/><path d="${ld}" fill="none" stroke="${o.stroke}" stroke-width="${o.strokeWidth}" ${dash} stroke-linecap="${cap}" stroke-linejoin="round" opacity="${o.opacity}"/>${heads}</g>`;
}
function connectorSel(o,z){const{p1,p2}=connPath(o),r=5/z;return `<g><circle cx="${p1.x}" cy="${p1.y}" r="${r}" class="rot-handle" data-handle="cstart" data-id="${o.id}" stroke-width="${1.5/z}"/><circle cx="${p2.x}" cy="${p2.y}" r="${r}" class="rot-handle" data-handle="cend" data-id="${o.id}" stroke-width="${1.5/z}"/></g>`;}

/* ============================ FACTORY ============================ */
function addIcon(kind,cx,cy){const F=1.7,zs=ICON_SIZES[kind]||[128,128],sz=[Math.round(zs[0]*F),Math.round(zs[1]*F)];const o={id:gid(),type:"icon",shapeKind:kind,x:cx,y:cy,w:sz[0],h:sz[1],rot:0,opacity:1,shadow:false,shadowBlur:5,brightness:100,saturate:100,hue:0,tint:null,tintAmt:0};if(RECOLOR.has(kind))o.fill="#3A3F45";commitAdd(o);return o;}
function addShape(kind,cx,cy,opt){opt=opt||{};const o=Object.assign({id:gid(),type:"shape",shapeKind:kind,x:cx,y:cy,w:210,h:150,rot:0,opacity:1,fill:"#E5F1EF",stroke:"#176B63",strokeWidth:2,dash:false,shadow:false,shadowBlur:4},opt);commitAdd(o);return o;}
function addText(cx,cy,txt){const o={id:gid(),type:"text",x:cx,y:cy,w:240,h:40,rot:0,opacity:1,text:txt||"",fontSize:24,weight:600,italic:false,underline:false,fill:"#26251F",align:"center",font:FONTS[0][0]};commitAdd(o);return o;}
function addImage(href,cx,cy,w,h){const o={id:gid(),type:"image",href,x:cx,y:cy,w:w||220,h:h||160,rot:0,opacity:1,fit:"cover",radius:0,shadow:false,shadowBlur:6,brightness:100,saturate:100,hue:0,tint:null,tintAmt:0};commitAdd(o);return o;}
function addArrow(kind,cx,cy){
  const map={"arrow:straight":{},"arrow:double":{tail:"triangle"},"arrow:dashed":{body:"dashed"},"arrow:dotted":{body:"dotted"},"arrow:block":{head:"barbed",headSize:16},"arrow:curved":{style:"curved"},"arrow:elbow":{style:"ortho"},"arrow:tee":{head:"line"}};
  const opt=map[kind]||{};pushHistory();
  const c=Object.assign({id:gid(),type:"connector",fromId:null,toId:null,fromPt:{x:cx-90,y:cy},toPt:{x:cx+90,y:cy},stroke:"#5A5650",strokeWidth:3,body:"solid",head:"triangle",tail:"none",headSize:11,opacity:1,style:"straight"},opt);
  state.objs.push(c);state.sel=[c.id];render();renderProps();return c;
}
function commitAdd(o){pushHistory();state.objs.push(o);state.sel=[o.id];render();renderProps();}
function commitMany(objs){pushHistory();for(const o of objs)state.objs.push(o);state.sel=objs.map(o=>o.id);render();renderProps();}

/* ============================ PRESETS (multi-object) ============================ */
function rnd(n){return (Math.random()*2-1)*n;}
function mkShape(kind,x,y,w,h,fill,stroke,sw){return {id:gid(),type:"shape",shapeKind:kind,x,y,w,h,rot:0,opacity:1,fill,stroke:stroke||"#5A5650",strokeWidth:sw==null?2:sw,dash:false,shadow:false,shadowBlur:4};}
function mkIcon(kind,x,y,w,h){const sz=ICON_SIZES[kind]||[w||90,h||90];const o={id:gid(),type:"icon",shapeKind:kind,x,y,w:w||sz[0],h:h||sz[1],rot:0,opacity:1,shadow:false,shadowBlur:5,brightness:100,saturate:100,hue:0,tint:null,tintAmt:0};if(RECOLOR.has(kind))o.fill="#3A3F45";return o;}
function mkText(x,y,t,s,col,w){return {id:gid(),type:"text",x,y,w:w||160,h:(s||16)*1.4,rot:0,opacity:1,text:t,fontSize:s||16,weight:600,italic:false,underline:false,fill:col||"#26251F",align:"center",font:FONTS[0][0]};}
function mkConn(a,b,opt){return Object.assign({id:gid(),type:"connector",fromId:a,toId:b,fromPt:null,toPt:null,stroke:"#5A5650",strokeWidth:2.5,body:"solid",head:"triangle",tail:"none",headSize:10,opacity:1,style:"straight"},opt||{});}
const PALN=["#4FBEB2","#E0844C","#9A6CC0","#5B9BD0","#3E9C5E","#D0556A","#E0A030"];

function buildPreset(kind,cx,cy){
  const O=[];const C=(o)=>{O.push(o);return o;};
  if(kind==="animalcell"){
    C(mkShape("ellipse",cx,cy,360,260,"#DDEFEA","#4FA89A",2.5));
    const nu=C(mkIcon("nucleus",cx+40,cy-6,140,140));
    C(mkShape("circle",cx+58,cy-14,34,34,"#6C3E88","#4A2A66",0));
    for(let i=0;i<5;i++)C(mkIcon("mitochondria",cx-90+rnd(40)+i*8,cy-60+i*30+rnd(20),84,52));
    C(mkIcon("er",cx-70,cy+50,120,90));
    C(mkIcon("golgi",cx+60,cy+70,110,80));
    for(let i=0;i<4;i++)C(mkIcon("vesicle",cx-130+rnd(20)+i*14,cy-40+rnd(60),36,36));
  }else if(kind==="bacterium"){
    C(mkShape("pillshape",cx,cy,360,150,"#9FD9AC","#3E8A52",2.5));
    C(mkShape("cloud",cx,cy,150,70,"#7BC88A","#3E8A52",1.5));
    for(let i=0;i<14;i++)C(mkShape("circle",cx-140+rnd(20)+i*20,cy+rnd(45),9,9,"#2E6E3E","#2E6E3E",0));
    C(Object.assign(mkShape("rect",cx-205,cy,90,4,"#3E8A52","#3E8A52",0),{}));
  }else if(kind==="synapse"){
    C(mkShape("ellipse",cx-120,cy,200,200,"#F6C9D2","#C45E78",2.5));
    C(mkShape("ellipse",cx+150,cy,180,180,"#CFE0EE","#5E8AB8",2.5));
    for(let i=0;i<8;i++)C(mkShape("circle",cx-60+rnd(20),cy-50+i*14+rnd(8),12,12,"#fff","#C45E78",2));
    for(let i=0;i<6;i++)C(mkShape("circle",cx+10+rnd(30),cy-40+i*16,6,6,"#D97757","#D97757",0));
    C(mkText(cx,cy+120,"synapse",16,"#6B675D",180));
  }else if(kind==="pca"||kind==="umap"){
    // proper L axes (origin at bottom-left); tight, well-separated clusters
    const PW=320,PH=250,ox=cx-PW/2,oy=cy+PH/2;
    C(mkShape("rect",ox,oy-1.3,PW,2.6,"#8C887D","#8C887D",0));       // x-axis (bottom)
    C(mkShape("rect",ox-1.3,oy-PH,2.6,PH,"#8C887D","#8C887D",0));    // y-axis (left)
    const groups=kind==="pca"?3:4, per=13;                          // 3x previous point count
    const cf=kind==="pca"?[[0.30,0.66],[0.68,0.70],[0.50,0.30]]:[[0.28,0.68],[0.70,0.72],[0.42,0.30],[0.76,0.38]];
    cf.slice(0,groups).forEach(function(c,g){const ccx=ox+c[0]*PW, ccy=oy-c[1]*PH, col=PALN[g];for(let i=0;i<per;i++)C(mkShape("circle",ccx+rnd(22),ccy+rnd(20),9,9,col,"#fff",1.2));});
    C(mkText(ox+PW/2,oy+24,kind==="pca"?"PC1":"UMAP-1",12,"#8C887D",160));
    C(mkText(ox-24,oy-PH/2,kind==="pca"?"PC2":"UMAP-2",12,"#8C887D",120));
  }else if(kind==="linegraph"){
    const PW=320,PH=240,ox=cx-PW/2,oy=cy+PH/2;
    C(mkShape("rect",ox,oy-1.3,PW,2.6,"#8C887D","#8C887D",0));
    C(mkShape("rect",ox-1.3,oy-PH,2.6,PH,"#8C887D","#8C887D",0));
    const series=[["#4FBEB2",[0.85,0.62,0.68,0.42,0.5,0.32,0.2]],["#D97757",[0.6,0.52,0.46,0.36,0.3,0.22,0.12]]];
    series.forEach(function(s){const ys=s[1],n=ys.length;const pts=ys.map(function(fy,i){return [ox+(i/(n-1))*PW, oy-fy*PH];});const xs=pts.map(p=>p[0]),yv=pts.map(p=>p[1]);const pcx=(Math.min(...xs)+Math.max(...xs))/2,pcy=(Math.min(...yv)+Math.max(...yv))/2;const local=pts.map(p=>(p[0]-pcx).toFixed(1)+","+(p[1]-pcy).toFixed(1)).join(" ");C(Object.assign(mkShape("__poly",pcx,pcy,Math.max(...xs)-Math.min(...xs),Math.max(Math.max(...yv)-Math.min(...yv),12),"none",s[0],3),{_points:local}));pts.forEach(function(p){C(mkShape("circle",p[0],p[1],7,7,s[0],"#fff",1.4));});});
  }else if(kind==="barpreset"){
    const PW=300,PH=230,ox=cx-PW/2,oy=cy+PH/2;
    C(mkShape("rect",ox,oy-1.3,PW,2.6,"#8C887D","#8C887D",0));
    C(mkShape("rect",ox-1.3,oy-PH,2.6,PH,"#8C887D","#8C887D",0));
    const vals=[0.45,0.8,0.55,0.95,0.65],bw=PW/(vals.length*1.7),gap=(PW-vals.length*bw)/(vals.length+1);
    vals.forEach(function(v,i){const hgt=v*(PH-16),x=ox+gap+i*(bw+gap);C(mkShape("rect",x,oy-hgt,bw,hgt,PALN[i%PALN.length],"#5A5650",1.4));});
  }else if(kind==="cohort"){
    for(let i=0;i<10;i++)C(mkIcon(i%2?"personF":"person",cx-180+(i%5)*90,cy-60+Math.floor(i/5)*130,60,104));
    C(mkText(cx,cy+130,"Cohort (n=10)",15,"#6B675D",220));
  }else if(kind==="casecontrol"){
    for(let i=0;i<5;i++)C(mkIcon("patient",cx-200+i*70,cy-50,56,96));
    for(let i=0;i<5;i++)C(mkIcon("person",cx-200+i*70,cy+90,56,96));
    C(mkText(cx-30,cy-120,"Cases",15,"#C0556A",160));C(mkText(cx-30,cy+150,"Controls",15,"#3C6E9E",160));
  }else if(kind==="trial"){
    const arms=[["Arm A","#4FBEB2"],["Arm B","#E0844C"],["Placebo","#9AA0A6"]];
    arms.forEach((a,i)=>{for(let j=0;j<4;j++)C(mkIcon("person",cx-220+i*150+(j%2)*60,cy-40+Math.floor(j/2)*110,52,90));C(mkText(cx-190+i*150,cy+150,a[0],14,a[1],150));});
  }
  // network architectures
  else if(kind.indexOf("net:")===0) return buildNetwork(kind,cx,cy,O,C);
  return O;
}
function buildNetwork(kind,cx,cy,O,C){
  function layer(n,x,r,col){const ys=[];const gap=70;const top=cy-(n-1)*gap/2;for(let i=0;i<n;i++){const node=C(mkShape("circle",x,top+i*gap,r*2,r*2,col,"#5A5650",2));ys.push(node);}return ys;}
  if(kind==="net:mlp"){
    const L=[layer(3,cx-210,16,"#4FBEB2"),layer(4,cx-70,16,"#E0844C"),layer(4,cx+70,16,"#E0844C"),layer(2,cx+210,16,"#9A6CC0")];
    for(let i=0;i<L.length-1;i++)for(const a of L[i])for(const b of L[i+1])C(mkConn(a.id,b.id,{head:"none",strokeWidth:1.4,stroke:"#C4C0B6"}));
    C(mkText(cx-210,cy+170,"input",13,"#8C887D",120));C(mkText(cx,cy+170,"hidden",13,"#8C887D",120));C(mkText(cx+210,cy+170,"output",13,"#8C887D",120));
  }else if(kind==="net:cnn"){
    const blocks=[["Input","#5B9BD0",60,160],["Conv","#4FBEB2",46,130],["Pool","#3E9C5E",40,100],["Conv","#4FBEB2",34,80],["FC","#E0844C",80,40],["Out","#9A6CC0",60,30]];
    let x=cx-260,prev=null;blocks.forEach(b=>{const n=C(mkShape("rect",x,cy,b[2],b[3],b[1],"#5A5650",2));C(mkText(x,cy+b[3]/2+18,b[0],12,"#6B675D",90));if(prev)C(mkConn(prev.id,n.id,{strokeWidth:2}));prev=n;x+=Math.max(96,b[2]+50);});
  }else if(kind==="net:autoencoder"){
    const L=[layer(4,cx-200,14,"#5B9BD0"),layer(3,cx-90,14,"#4FBEB2"),layer(2,cx,14,"#D97757"),layer(3,cx+90,14,"#4FBEB2"),layer(4,cx+200,14,"#9A6CC0")];
    for(let i=0;i<L.length-1;i++)for(const a of L[i])for(const b of L[i+1])C(mkConn(a.id,b.id,{head:"none",strokeWidth:1.2,stroke:"#C4C0B6"}));
    C(mkText(cx,cy+150,"latent",13,"#8C887D",120));
  }else if(kind==="net:transformer"){
    const a=C(mkShape("round",cx,cy-150,220,46,"#E8F0F8","#5B9BD0",2));C(mkText(cx,cy-150,"Multi-Head Attention",13,"#26251F",200));
    const b=C(mkShape("round",cx,cy-60,220,40,"#FBEFE8","#D97757",2));C(mkText(cx,cy-60,"Add & Norm",12,"#26251F",200));
    const d=C(mkShape("round",cx,cy+40,220,46,"#EAF6EF","#3E9C5E",2));C(mkText(cx,cy+40,"Feed Forward",13,"#26251F",200));
    const e=C(mkShape("round",cx,cy+130,220,40,"#FBEFE8","#D97757",2));C(mkText(cx,cy+130,"Add & Norm",12,"#26251F",200));
    C(mkConn(a.id,b.id,{strokeWidth:2}));C(mkConn(b.id,d.id,{strokeWidth:2}));C(mkConn(d.id,e.id,{strokeWidth:2}));
  }else if(kind==="net:gnn"){
    const nodes=[[-120,-60],[40,-90],[140,10],[60,90],[-80,80],[-10,0]].map((p,i)=>C(mkShape("circle",cx+p[0],cy+p[1],30,30,PALN[i%PALN.length],"#5A5650",2)));
    const E=[[0,1],[1,2],[2,3],[3,4],[4,0],[5,0],[5,1],[5,3]];E.forEach(e=>C(mkConn(nodes[e[0]].id,nodes[e[1]].id,{head:"none",strokeWidth:2,stroke:"#B0ACA0"})));
    C(mkText(cx,cy+150,"Graph neural network",13,"#8C887D",240));
  }else if(kind==="net:pathway"){
    const a=C(mkIcon("protein",cx-200,cy-60,80,80));const b=C(mkIcon("protein",cx-40,cy-60,80,80));const c=C(mkIcon("nucleus",cx+160,cy-30,110,110));
    const g=C(mkShape("pillshape",cx+150,cy+120,160,46,"#EAF6EF","#3E9C5E",2));C(mkText(cx+150,cy+120,"target gene",12,"#26251F",150));
    C(mkConn(a.id,b.id,{head:"triangle",strokeWidth:2.5}));C(mkConn(b.id,c.id,{head:"triangle",strokeWidth:2.5}));C(mkConn(c.id,g.id,{head:"triangle",strokeWidth:2.5,style:"ortho"}));
    C(mkText(cx-200,cy+10,"receptor",12,"#8C887D",120));C(mkText(cx-40,cy+10,"kinase",12,"#8C887D",120));
  }else if(kind==="net:grn"){
    const tf=[[-140,-40],[120,-70],[60,80]].map((p,i)=>C(mkShape("hexagon",cx+p[0],cy+p[1],70,60,PALN[i],"#5A5650",2)));
    const gn=[[-40,40],[180,40],[-160,90]].map((p)=>C(mkShape("round",cx+p[0],cy+p[1],90,40,"#FFFFFF","#9AA0A6",2)));
    C(mkConn(tf[0].id,gn[0].id,{head:"triangle",stroke:"#3E9C5E",strokeWidth:2.5}));
    C(mkConn(tf[1].id,gn[1].id,{head:"triangle",stroke:"#3E9C5E",strokeWidth:2.5}));
    C(mkConn(tf[2].id,gn[0].id,{head:"line",stroke:"#D0402E",strokeWidth:2.5}));
    C(mkConn(tf[0].id,gn[2].id,{head:"line",stroke:"#D0402E",strokeWidth:2.5}));
  }else if(kind==="net:rnn"){
    const n=4,sp=118,x0=cx-(n-1)*sp/2,cells=[];
    for(let i=0;i<n;i++){const x=x0+i*sp;
      const inp=C(mkShape("circle",x,cy+72,30,30,"#5B9BD0","#3C6E9E",2));
      const cell=C(mkShape("round",x,cy,88,58,"#4FBEB2","#2E8B82",2));cells.push(cell);
      const out=C(mkShape("round",x,cy-72,70,34,"#E0844C","#B85A2E",2));
      C(mkConn(inp.id,cell.id,{head:"triangle",strokeWidth:2}));
      C(mkConn(cell.id,out.id,{head:"triangle",strokeWidth:2}));
      C(mkText(x,cy,"h"+(i+1),13,"#0B3B36",70));
      C(mkText(x,cy+72,"x"+(i+1),11,"#FFFFFF",40));
      C(mkText(x,cy-72,"y"+(i+1),12,"#3A1E0E",60));
    }
    for(let i=0;i<n-1;i++)C(mkConn(cells[i].id,cells[i+1].id,{head:"triangle",strokeWidth:2.4,stroke:"#5A5650"}));
    C(mkText(cx,cy+118,"Recurrent network (unrolled through time)",12,"#8C887D",320));
  }else if(kind==="net:unet"){
    const encX=cx-150,decX=cx+150,topY=cy-120,dy=64,ws=[72,60,50,40],hs=[64,52,42,34],enc=[],dec=[];
    for(let i=0;i<4;i++){const y=topY+i*dy;
      enc.push(C(mkShape("rect",encX,y,ws[i],hs[i],"#5B9BD0","#3A6E9E",2)));
      dec.push(C(mkShape("rect",decX,y,ws[i],hs[i],"#4FBEB2","#2E8B82",2)));
    }
    const bott=C(mkShape("rect",cx,topY+4*dy,62,36,"#D97757","#B85A2E",2));
    for(let i=0;i<3;i++)C(mkConn(enc[i].id,enc[i+1].id,{head:"triangle",strokeWidth:2,stroke:"#5A5650"}));
    C(mkConn(enc[3].id,bott.id,{head:"triangle",strokeWidth:2,stroke:"#5A5650"}));
    C(mkConn(bott.id,dec[3].id,{head:"triangle",strokeWidth:2,stroke:"#5A5650"}));
    for(let i=3;i>0;i--)C(mkConn(dec[i].id,dec[i-1].id,{head:"triangle",strokeWidth:2,stroke:"#5A5650"}));
    for(let i=0;i<4;i++)C(mkConn(enc[i].id,dec[i].id,{head:"triangle",strokeWidth:1.8,body:"dashed",stroke:"#B0ACA0"}));
    C(mkText(encX,topY-32,"encoder",12,"#3A6E9E",90));C(mkText(decX,topY-32,"decoder",12,"#2E8B82",90));
    C(mkText(cx,topY+4*dy+34,"U-Net (skip connections)",12,"#8C887D",200));
  }
  return O;
}
/* polyline support for line-graph preset */
const _origShapePath=shapePath;
function addPreset(kind,cx,cy){const objs=buildPreset(kind,cx,cy);if(!objs||!objs.length)return;commitMany(objs);}

/* override objMarkup for special __poly shape used by line graphs */
const _objMarkup=objMarkup;
objMarkup=function(o){
  if(o.type==="shape"&&o.shapeKind==="__poly"){return `<polyline points="${o._points||""}" fill="none" stroke="${o.stroke}" stroke-width="${o.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${o.opacity}"/>`;}
  return _objMarkup(o);
};

/* ============================ INTERACTION (no tool modes) ============================ */
let drag=null,pendingArrowFrom=null,lastClick=null;
stage.addEventListener("pointerdown",onPointerDown);
window.addEventListener("pointermove",onPointerMove);
window.addEventListener("pointerup",onPointerUp);
stage.addEventListener("contextmenu",onContextMenu);

function onPointerDown(e){
  if(activeEditor){commitTextEditor();return;}   // clicking the canvas finishes inline editing
  if(e.button===2)return; // handled by contextmenu
  closeCtx();
  const handleEl=e.target.closest("[data-handle]");
  const objEl=e.target.closest("[data-id]");
  const pt=toCanvas(e);
  if(pendingArrowFrom){ // arrow connect mode
    if(objEl){const to=objById(objEl.getAttribute("data-id"));if(to&&to.type!=="connector"&&to.id!==pendingArrowFrom){pushHistory();state.objs.push(mkConn(pendingArrowFrom,to.id,{strokeWidth:3,headSize:11}));render();}}
    pendingArrowFrom=null;stage.style.cursor="";return;
  }
  if(handleEl){const dir=handleEl.getAttribute("data-handle");if(dir==="grot"){startGroupRotate(pt);return;}if(dir[0]==="g"&&dir[1]==="-"){startGroupResize(dir,pt);return;}const id=handleEl.getAttribute("data-id");if(dir==="rot")startRotate(id,pt);else if(dir==="cstart"||dir==="cend")startConnEnd(id,dir);else startResize(id,dir);return;}
  // manual double-click detection (the native dblclick event is unreliable in some packaged builds)
  const _now=Date.now(),_dbl=e.button===0&&lastClick&&(_now-lastClick.t<360)&&Math.abs(e.clientX-lastClick.x)<7&&Math.abs(e.clientY-lastClick.y)<7;
  lastClick={t:_now,x:e.clientX,y:e.clientY};
  if(_dbl){
    if(objEl){const od=objById(objEl.getAttribute("data-id"));if(od&&od.type==="text"){try{startEditText(od);}catch(err){}return;}}
    else{const od=addText(pt.x,pt.y,"Text");try{startEditText(od);}catch(err){}return;}
  }
  const mod=e.shiftKey||e.metaKey||e.ctrlKey;   // Shift or Cmd(Mac)/Ctrl = toggle individual objects in/out of the selection
  if(objEl){const id=objEl.getAttribute("data-id");if(mod){if(isSel(id))state.sel=state.sel.filter(s=>s!==id);else state.sel.push(id);}else if(!isSel(id))state.sel=[id];render();renderProps();startMove(pt);return;}
  if(!mod)state.sel=[];render();renderProps();startMarquee(pt,e);
}
function startMove(pt){const items=selObjs().filter(o=>o.type!=="connector").map(o=>({o,ox:o.x,oy:o.y,fp:o.fromPt?{x:o.fromPt.x,y:o.fromPt.y}:null,tp:o.toPt?{x:o.toPt.x,y:o.toPt.y}:null}));const conns=selObjs().filter(o=>o.type==="connector").map(o=>({o,fp:o.fromPt?{x:o.fromPt.x,y:o.fromPt.y}:null,tp:o.toPt?{x:o.toPt.x,y:o.toPt.y}:null}));if(!items.length&&!conns.length)return;drag={kind:"move",start:pt,items,conns,moved:false,pre:snapshot()};}
function startResize(id,dir){const o=objById(id);const sx=dir.includes("w")?-1:dir.includes("e")?1:0,sy=dir.includes("n")?-1:dir.includes("s")?1:0;const sa={x:-sx,y:-sy},a=(o.rot||0)*Math.PI/180,ar=rot(sa.x*o.w/2,sa.y*o.h/2,a);drag={kind:"resize",o,sa,a,anchorWorld:{x:o.x+ar.x,y:o.y+ar.y},W0:o.w,H0:o.h,keepX:sx===0,keepY:sy===0,pre:snapshot()};}
function startRotate(id,pt){const o=objById(id);drag={kind:"rotate",o,start:Math.atan2(pt.y-o.y,pt.x-o.x),rot0:o.rot||0,pre:snapshot()};}
function startConnEnd(id,which){document.body.classList.add("cursor-none");drag={kind:"connend",o:objById(id),which,pre:snapshot()};}
function startMarquee(pt,e){drag={kind:"marquee",start:pt,add:e.shiftKey||e.metaKey||e.ctrlKey};}
function startGroupRotate(pt){const sel=selObjs();const bb=groupBBox(sel);if(!bb)return;const gc={x:bb.x+bb.w/2,y:bb.y+bb.h/2};const snap=sel.filter(o=>o.type!=="connector").map(o=>({o,rot0:o.rot||0}));drag={kind:"grotate",gc,start:Math.atan2(pt.y-gc.y,pt.x-gc.x),snap,pre:snapshot()};}
function startGroupResize(dir,pt){const sel=selObjs(),bb=groupBBox(sel);if(!bb)return;const map={"g-nw":[bb.x,bb.y,bb.x+bb.w,bb.y+bb.h],"g-ne":[bb.x+bb.w,bb.y,bb.x,bb.y+bb.h],"g-se":[bb.x+bb.w,bb.y+bb.h,bb.x,bb.y],"g-sw":[bb.x,bb.y+bb.h,bb.x+bb.w,bb.y]},m=map[dir];const snap=sel.map(o=>({o,x:o.x,y:o.y,w:o.w,h:o.h,fs:o.fontSize,sw:o.strokeWidth,fromPt:o.fromPt?{x:o.fromPt.x,y:o.fromPt.y}:null,toPt:o.toPt?{x:o.toPt.x,y:o.toPt.y}:null,pts:o._points}));const dims=sel.filter(o=>o.type!=="connector").map(o=>Math.min(o.w,o.h));drag={kind:"gresize",anchor:{x:m[2],y:m[3]},oc:{x:m[0],y:m[1]},snap,minDim:dims.length?Math.min(...dims):20,pre:snapshot()};}

function onPointerMove(e){
  if(!drag)return;const pt=toCanvas(e);
  if(drag.kind==="move"){const dx=pt.x-drag.start.x,dy=pt.y-drag.start.y;if(Math.abs(dx)+Math.abs(dy)>1)drag.moved=true;for(const it of drag.items){it.o.x=it.ox+dx;it.o.y=it.oy+dy;}for(const it of drag.conns){if(it.fp)it.o.fromPt={x:it.fp.x+dx,y:it.fp.y+dy};if(it.tp)it.o.toPt={x:it.tp.x+dx,y:it.tp.y+dy};}render();renderPropsLight();return;}
  if(drag.kind==="resize"){const{o,sa,a,anchorWorld}=drag;const loc=rot(pt.x-anchorWorld.x,pt.y-anchorWorld.y,-a);let nW=drag.keepX?drag.W0:Math.max(14,Math.abs(loc.x)),nH=drag.keepY?drag.H0:Math.max(14,Math.abs(loc.y));if(e.shiftKey&&!drag.keepX&&!drag.keepY){const ar=drag.W0/drag.H0;if(nW/nH>ar)nH=nW/ar;else nW=nH*ar;}const cw=rot(-sa.x*nW/2,-sa.y*nH/2,a);o.w=nW;o.h=nH;o.x=anchorWorld.x+cw.x;o.y=anchorWorld.y+cw.y;render();renderPropsLight();return;}
  if(drag.kind==="gresize"){const a=drag.anchor,oldD=Math.hypot(drag.oc.x-a.x,drag.oc.y-a.y)||1;let s=clamp(Math.hypot(pt.x-a.x,pt.y-a.y)/oldD,6/drag.minDim,12);for(const it of drag.snap){const o=it.o;if(o.type==="connector"){if(it.fromPt)o.fromPt={x:a.x+(it.fromPt.x-a.x)*s,y:a.y+(it.fromPt.y-a.y)*s};if(it.toPt)o.toPt={x:a.x+(it.toPt.x-a.x)*s,y:a.y+(it.toPt.y-a.y)*s};if(it.sw!=null)o.strokeWidth=Math.max(0.5,it.sw*s);continue;}o.x=a.x+(it.x-a.x)*s;o.y=a.y+(it.y-a.y)*s;o.w=it.w*s;o.h=it.h*s;if(it.fs!=null)o.fontSize=Math.max(4,it.fs*s);if(it.sw!=null)o.strokeWidth=Math.max(0.4,it.sw*s);if(it.pts)o._points=scalePoly(it.pts,{x:0,y:0},s);}render();return;}
  if(drag.kind==="grotate"){let ang=Math.atan2(pt.y-drag.gc.y,pt.x-drag.gc.x);let dd=(ang-drag.start)*180/Math.PI;if(e.shiftKey)dd=Math.round(dd/15)*15;for(const it of drag.snap)it.o.rot=Math.round((it.rot0+dd)*10)/10;render();return;}
  if(drag.kind==="rotate"){let ang=Math.atan2(pt.y-drag.o.y,pt.x-drag.o.x),deg=drag.rot0+(ang-drag.start)*180/Math.PI;if(e.shiftKey)deg=Math.round(deg/15)*15;drag.o.rot=Math.round(deg*10)/10;render();renderPropsLight();return;}
  if(drag.kind==="connend"){
    const cand=nearestConnectShape(pt,drag.o);
    let snap=null,best=1e9,hints=[];
    if(cand){hints=shapePortsWorld(cand);for(const pr of hints){const d=Math.hypot(pr.x-pt.x,pr.y-pt.y);if(d<best){best=d;snap=pr;}}}
    const hit=snap&&best<=18/state.view.zoom;
    if(hit){drag._snap={id:cand.id,port:snap.port};setConnFree(drag.o,drag.which,snap.x,snap.y);}
    else{drag._snap=null;setConnFree(drag.o,drag.which,pt.x,pt.y);}
    render();drawPortHints(hints,hit?snap:null);return;
  }
  if(drag.kind==="marquee"){drag.cur=pt;drawMarquee();return;}
}
function setConnFree(o,which,x,y){if(which==="cstart"){o.fromId=null;o.fromPort=null;o.fromPt={x,y};}else{o.toId=null;o.toPort=null;o.toPt={x,y};}}
function nearestConnectShape(pt,exclude){let best=null,bd=1e9;for(const o of state.objs){if(o.type==="connector"||o===exclude)continue;const dx=Math.max(Math.abs(pt.x-o.x)-o.w/2,0),dy=Math.max(Math.abs(pt.y-o.y)-o.h/2,0);const d=Math.hypot(dx,dy);if(d<bd){bd=d;best=o;}}return bd<=55?best:null;}
function drawPortHints(hints,snap){if(!hints||!hints.length)return;const z=state.view.zoom,r=4.5/z;let h="";for(const p of hints){const on=snap&&p.port.idx===snap.port.idx;h+=`<circle cx="${p.x}" cy="${p.y}" r="${on?r*1.6:r}" fill="${on?'var(--accent)':'#fff'}" stroke="var(--accent)" stroke-width="${1.3/z}"/>`;}overlay.insertAdjacentHTML("beforeend",h);}
function shiftPoly(pts,dx,dy){return pts;} // line graphs move via fromPt? handled below
function scalePoly(pts,a,s){return pts.split(" ").map(pp=>{const xy=pp.split(",");return (a.x+(+xy[0]-a.x)*s)+","+(a.y+(+xy[1]-a.y)*s);}).join(" ");}
function onPointerUp(e){if(!drag)return;
  if(drag.kind==="connend"){document.body.classList.remove("cursor-none");if(drag._snap){const sn=drag._snap;if(drag.which==="cstart"){drag.o.fromId=sn.id;drag.o.fromPort=sn.port;drag.o.fromPt=null;}else{drag.o.toId=sn.id;drag.o.toPort=sn.port;drag.o.toPt=null;}render();}}
  if(drag.kind==="move"&&drag.moved)commitPre(drag.pre);else if(["resize","rotate","connend","gresize","grotate"].includes(drag.kind))commitPre(drag.pre);else if(drag.kind==="marquee")finishMarquee();const k=drag.kind;drag=null;if(k!=="marquee")renderProps();}
function drawMarquee(){const a=drag.start,b=drag.cur;if(!b)return;const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),w=Math.abs(a.x-b.x),h=Math.abs(a.y-b.y);renderOverlay();overlay.insertAdjacentHTML("beforeend",`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="rgba(217,119,87,.08)" stroke="var(--accent)" stroke-width="${1/state.view.zoom}" stroke-dasharray="${4/state.view.zoom} ${3/state.view.zoom}"/>`);}
function finishMarquee(){const a=drag.start,b=drag.cur;if(!b)return;const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),x2=Math.max(a.x,b.x),y2=Math.max(a.y,b.y);const hit=state.objs.filter(o=>{if(o.type==="connector"){const e=connEndpoints(o);if(!e)return false;const mx=(e.p1.x+e.p2.x)/2,my=(e.p1.y+e.p2.y)/2;return mx>=x&&mx<=x2&&my>=y&&my<=y2;}return o.x>=x&&o.x<=x2&&o.y>=y&&o.y<=y2;}).map(o=>o.id);state.sel=drag.add?[...new Set([...state.sel,...hit])]:hit;render();renderProps();}

/* wheel: scroll = pan; shift = horizontal; ctrl/meta = zoom */
stage.addEventListener("wheel",e=>{e.preventDefault();if(e.ctrlKey||e.metaKey){const r=stage.getBoundingClientRect();setZoom(state.view.zoom*(e.deltaY<0?1.1:0.9),e.clientX-r.left,e.clientY-r.top);}else if(e.shiftKey){state.view.tx-=(e.deltaY||e.deltaX);render();}else{state.view.tx-=e.deltaX;state.view.ty-=e.deltaY;render();}},{passive:false});

/* double-click empty = text; on text = edit */
// (double-click handling is done via manual detection in onPointerDown, which works in all builds)
function addTextAtCenter(){const r=stage.getBoundingClientRect();const pt=toCanvas({clientX:r.left+r.width/2,clientY:r.top+r.height/2});const o=addText(pt.x,pt.y,"Text");try{startEditText(o);}catch(err){}}

/* inline text editor */
let activeEditor=null;
function startEditText(o){
  if(activeEditor)return;
  o._editing=true;render();
  const z=state.view.zoom;
  // place the editor exactly over the (now hidden) text box using canvas→screen coords
  let left=80,top=80;
  try{const ctm=content.getScreenCTM();if(ctm){const p=stage.createSVGPoint();p.x=o.x-o.w/2;p.y=o.y-o.h/2;const s=p.matrixTransform(ctm);left=s.x;top=s.y;}}catch(e){}
  const width=Math.max(o.w*z,60);
  const fpx=Math.max(o.fontSize*z,11);
  const ta=document.createElement("textarea");ta.className="inline-editor";ta.value=o.text;ta.spellcheck=false;
  Object.assign(ta.style,{left:left+"px",top:top+"px",width:width+"px",minHeight:(fpx*1.3)+"px",transformOrigin:"top left",transform:'rotate('+(o.rot||0)+'deg)',fontFamily:o.font||FONTS[0][0],fontSize:fpx+"px",fontWeight:o.weight,fontStyle:o.italic?"italic":"normal",textDecoration:o.underline?"underline":"none",color:o.fill,textAlign:o.align,lineHeight:1.25});
  document.body.appendChild(ta);
  const openAt=Date.now();
  activeEditor={ta,o,pre:snapshot()};
  const grow=()=>{ta.style.height="auto";ta.style.height=Math.max(fpx*1.3,ta.scrollHeight)+"px";};
  grow();
  // focus + SELECT ALL (typing overwrites), deferred so it sticks after the opening click
  setTimeout(()=>{try{ta.focus();ta.select();}catch(e){}},0);
  ta.addEventListener("input",()=>{o.text=ta.value;o.h=Math.max(o.fontSize*1.3,ta.value.split("\n").length*o.fontSize*1.25+8);grow();});
  // ignore the blur that the opening click can trigger; commit on a real blur later
  ta.addEventListener("blur",()=>{if(activeEditor&&activeEditor.ta===ta){if(Date.now()-openAt<260){setTimeout(()=>{try{ta.focus();}catch(e){}},0);}else commitTextEditor();}});
  ta.addEventListener("keydown",ev=>{ev.stopPropagation();if(ev.metaKey||ev.ctrlKey){const k=ev.key.toLowerCase();if(k==="b"){ev.preventDefault();o.weight=o.weight>=700?400:700;ta.style.fontWeight=o.weight;return;}if(k==="i"){ev.preventDefault();o.italic=!o.italic;ta.style.fontStyle=o.italic?"italic":"normal";return;}if(k==="u"){ev.preventDefault();o.underline=!o.underline;ta.style.textDecoration=o.underline?"underline":"none";return;}}if(ev.key==="Escape"){ev.preventDefault();commitTextEditor();}});
}
function commitTextEditor(){if(!activeEditor)return;const{ta,o,pre}=activeEditor;const v=ta.value;activeEditor=null;ta.remove();o._editing=false;if(!v.length){state.objs=state.objs.filter(x=>x!==o);state.sel=[];render();renderProps();return;}o.text=v;o.h=Math.max(o.fontSize*1.3,v.split("\n").length*o.fontSize*1.25+8);commitPre(pre);render();renderProps();}

/* ============================ CONTEXT MENU ============================ */
function onContextMenu(e){e.preventDefault();const oe=e.target.closest("[data-id]");if(oe){const id=oe.getAttribute("data-id");if(!isSel(id)){state.sel=[id];render();renderProps();}}openCtx(e.clientX,e.clientY);}
function openCtx(x,y){const m=$("ctxmenu");const has=state.sel.length>0,one=state.sel.length===1?selObjs()[0]:null;
  const item=(label,sc,fn,dis)=>`<button data-fn="${fn}" ${dis?'disabled style="opacity:.4"':''}>${label}${sc?`<span class="sc">${sc}</span>`:""}</button>`;
  let h="";
  h+=item(T("copy"),"⌘C","copy",!has)+item(T("cut"),"⌘X","cut",!has)+item(T("paste"),"⌘V","paste",!clipboard.length)+item(T("duplicate"),"⌘D","duplicate",!has);
  h+=`<div class="sep"></div>`;
  if(one&&(one.type==="icon"||one.type==="image"||one.type==="shape"||one.type==="text"))h+=item(T("editColor"),"","color");
  if(one&&one.type!=="connector")h+=item(T("addArrow"),"","arrow");
  h+=`<div class="sep"></div>`;
  h+=item(T("front"),"⌘]","front",!has)+item(T("forward"),"","forward",!has)+item(T("backward"),"","backward",!has)+item(T("back"),"⌘[","back",!has);
  h+=`<div class="sep"></div>`;
  h+=item(T("delete"),"⌫","delete",!has);
  m.innerHTML=h;m.style.left=Math.min(x,innerWidth-210)+"px";m.style.top=Math.min(y,innerHeight-10-m.offsetHeight)+"px";m.classList.add("open");
  m.style.top=Math.min(y,innerHeight-m.offsetHeight-10)+"px";
  m.querySelectorAll("[data-fn]").forEach(b=>b.onclick=()=>{ctxAction(b.getAttribute("data-fn"));closeCtx();});
}
function closeCtx(){$("ctxmenu").classList.remove("open");}
window.addEventListener("pointerdown",e=>{if(!e.target.closest("#ctxmenu"))closeCtx();},true);
function ctxAction(fn){switch(fn){case"copy":doCopy();break;case"cut":doCut();break;case"paste":doPaste();break;case"duplicate":duplicateSel();break;case"delete":deleteSel();break;case"front":zorder("front");break;case"forward":zorder("fwd");break;case"backward":zorder("bwd");break;case"back":zorder("back");break;case"color":focusColor();break;case"arrow":{const o=selObjs()[0];if(o){pendingArrowFrom=o.id;stage.style.cursor="crosshair";toast(T("addArrow"));}break;}}}
function focusColor(){renderProps();const el=document.querySelector('#rightpanel input[type=color]');if(el){el.focus();el.click&&el.click();}toast(T("editColor"));}

/* ============================ CLIPBOARD ============================ */
let clipboard=[];
let pasteShift=0;   // cascades each paste down-right (PowerPoint/BioRender style)
function doCopy(){clipboard=selObjs().map(o=>JSON.parse(JSON.stringify(o)));pasteShift=0;toast(T("copy"));}
function doCut(){if(!state.sel.length)return;doCopy();deleteSel();}
function doPaste(){if(!clipboard.length)return;pushHistory();pasteShift+=30;const s=pasteShift;const map={},ids=[];for(const o of clipboard){if(o.type==="connector")continue;const c=JSON.parse(JSON.stringify(o));c.id=gid();c.x+=s;c.y+=s;if(c.fromPt){c.fromPt.x+=s;c.fromPt.y+=s;}if(c.toPt){c.toPt.x+=s;c.toPt.y+=s;}map[o.id]=c.id;state.objs.push(c);ids.push(c.id);}for(const o of clipboard){if(o.type!=="connector")continue;const c=JSON.parse(JSON.stringify(o));c.id=gid();if(c.fromId&&map[c.fromId])c.fromId=map[c.fromId];if(c.toId&&map[c.toId])c.toId=map[c.toId];if(c.fromPt){c.fromPt.x+=s;c.fromPt.y+=s;}if(c.toPt){c.toPt.x+=s;c.toPt.y+=s;}state.objs.push(c);ids.push(c.id);}state.sel=ids;render();renderProps();}

/* ============================ ACTIONS ============================ */
function deleteSel(){if(!state.sel.length)return;pushHistory();const ids=new Set(state.sel);state.objs=state.objs.filter(o=>!ids.has(o.id));state.objs=state.objs.filter(o=>o.type!=="connector"||((!o.fromId||objById(o.fromId))&&(!o.toId||objById(o.toId))));state.sel=[];render();renderProps();}
function duplicateSel(){if(!state.sel.length)return;pushHistory();const map={},ids=[];for(const o of selObjs()){if(o.type==="connector")continue;const c=JSON.parse(JSON.stringify(o));c.id=gid();c.x+=24;c.y+=24;map[o.id]=c.id;state.objs.push(c);ids.push(c.id);}for(const o of selObjs()){if(o.type!=="connector")continue;const c=JSON.parse(JSON.stringify(o));c.id=gid();if(c.fromId&&map[c.fromId])c.fromId=map[c.fromId];if(c.toId&&map[c.toId])c.toId=map[c.toId];if(c.fromPt){c.fromPt.x+=24;c.fromPt.y+=24;}if(c.toPt){c.toPt.x+=24;c.toPt.y+=24;}state.objs.push(c);ids.push(c.id);}state.sel=ids;render();renderProps();}
function scaleSel(s){const sel=selObjs();if(!sel.length)return;const bb=groupBBox(sel);if(!bb)return;pushHistory();const cx=bb.x+bb.w/2,cy=bb.y+bb.h/2;for(const o of sel){if(o.type==="connector"){if(o.fromPt)o.fromPt={x:cx+(o.fromPt.x-cx)*s,y:cy+(o.fromPt.y-cy)*s};if(o.toPt)o.toPt={x:cx+(o.toPt.x-cx)*s,y:cy+(o.toPt.y-cy)*s};o.strokeWidth=Math.max(0.5,o.strokeWidth*s);continue;}o.x=cx+(o.x-cx)*s;o.y=cy+(o.y-cy)*s;o.w*=s;o.h*=s;if(o.fontSize)o.fontSize=Math.max(4,o.fontSize*s);if(o.strokeWidth!=null)o.strokeWidth=Math.max(0.4,o.strokeWidth*s);if(o._points)o._points=scalePoly(o._points,{x:cx,y:cy},s);}render();renderProps();}
function zorder(mode){if(!state.sel.length)return;pushHistory();const ids=new Set(state.sel),picked=state.objs.filter(o=>ids.has(o.id)),rest=state.objs.filter(o=>!ids.has(o.id));if(mode==="front")state.objs=[...rest,...picked];else if(mode==="back")state.objs=[...picked,...rest];else if(mode==="fwd"){for(let i=state.objs.length-2;i>=0;i--)if(ids.has(state.objs[i].id)&&!ids.has(state.objs[i+1].id)){[state.objs[i],state.objs[i+1]]=[state.objs[i+1],state.objs[i]];}}else if(mode==="bwd"){for(let i=1;i<state.objs.length;i++)if(ids.has(state.objs[i].id)&&!ids.has(state.objs[i-1].id)){[state.objs[i],state.objs[i-1]]=[state.objs[i-1],state.objs[i]];}}render();}
function align(how){const sel=selObjs().filter(o=>o.type!=="connector");if(sel.length<2)return;pushHistory();const L=Math.min(...sel.map(o=>o.x-o.w/2)),R=Math.max(...sel.map(o=>o.x+o.w/2)),Tp=Math.min(...sel.map(o=>o.y-o.h/2)),B=Math.max(...sel.map(o=>o.y+o.h/2));for(const o of sel){if(how==="l")o.x=L+o.w/2;if(how==="r")o.x=R-o.w/2;if(how==="cx")o.x=(L+R)/2;if(how==="t")o.y=Tp+o.h/2;if(how==="b")o.y=B-o.h/2;if(how==="cy")o.y=(Tp+B)/2;}render();renderProps();}
function distribute(){const sel=selObjs().filter(o=>o.type!=="connector");if(sel.length<3)return;pushHistory();const horiz=Math.max(...sel.map(o=>o.x))-Math.min(...sel.map(o=>o.x))>=Math.max(...sel.map(o=>o.y))-Math.min(...sel.map(o=>o.y));sel.sort((a,b)=>horiz?a.x-b.x:a.y-b.y);const first=horiz?sel[0].x:sel[0].y,last=horiz?sel[sel.length-1].x:sel[sel.length-1].y,step=(last-first)/(sel.length-1);sel.forEach((o,i)=>{if(horiz)o.x=first+step*i;else o.y=first+step*i;});render();}

/* will hold renderProps; defined later */
let renderProps=function(){}, renderPropsLight=function(){};

/* ============================ ZOOM ============================ */
function setZoom(z,cx,cy){const v=state.view,old=v.zoom;z=clamp(z,0.15,5);const r=stage.getBoundingClientRect();cx=cx==null?r.width/2:cx;cy=cy==null?r.height/2:cy;v.tx=cx-(cx-v.tx)*(z/old);v.ty=cy-(cy-v.ty)*(z/old);v.zoom=z;$("zoomVal").textContent=Math.round(z*100)+"%";render();}
function fitView(){const r=stage.getBoundingClientRect();const pad=70,z=Math.min((r.width-pad)/ART.w,(r.height-pad)/ART.h);state.view.zoom=clamp(z,0.15,5);state.view.tx=(r.width-ART.w*state.view.zoom)/2;state.view.ty=(r.height-ART.h*state.view.zoom)/2;$("zoomVal").textContent=Math.round(state.view.zoom*100)+"%";render();}
$("zoomIn").onclick=()=>setZoom(state.view.zoom*1.2);$("zoomOut").onclick=()=>setZoom(state.view.zoom/1.2);$("zoomFit").onclick=fitView;
$("undoBtn").onclick=undo;$("redoBtn").onclick=redo;
{const _b=$("addTextBtn");if(_b)_b.onclick=()=>addTextAtCenter();}

/* ============================ TOAST ============================ */
let toastTimer;function toast(msg,err){const t=$("toast");t.innerHTML=(err?`<svg viewBox="0 0 24 24" fill="none" stroke="#C23B3B" stroke-width="2"><path d="M12 8v5M12 16.5h0M10.3 3.8 2.5 18a2 2 0 001.7 3h15.6a2 2 0 001.7-3L13.7 3.8a2 2 0 00-3.4 0z" stroke-linejoin="round"/></svg>`:`<svg viewBox="0 0 24 24" fill="none" stroke="#3E7B4F" stroke-width="2"><path d="M5 13l4 4 10-11" stroke-linecap="round" stroke-linejoin="round"/></svg>`)+`<span>${msg}</span>`;t.classList.toggle("err",!!err);t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),3000);}

window.CAMRENDER_INTERNAL={state,render,fitView,toast,addIcon,addShape,addArrow,addPreset,addImage};
