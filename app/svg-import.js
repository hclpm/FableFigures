/* Fable Figures — SVG importer.
   Breaks an SVG made in another tool into individual, editable Fable objects:
     <text>/<tspan>          → text boxes (font, weight, color, alignment; original width kept)
     <rect>/<circle>/<ellipse> → shapes (fill, stroke, stroke width, rotation)
     <line>                  → connectors without arrowheads
     <image>                 → image objects
     everything else (paths, polygons, <use> glyphs, clipped/masked groups such as an
     embedded matplotlib chart) → a vector "svg" object that can be moved, resized and rotated.
   Positions come from the browser's own layout (getScreenCTM / getBBox), so nested
   transforms, viewBox scaling and CSS-inherited styles are resolved exactly.
   Loaded after app.js/app2.js; shares their global scope. */
(function(global){
"use strict";
const SVGNS="http://www.w3.org/2000/svg",XLINK="http://www.w3.org/1999/xlink";
const SKIP=new Set(["defs","style","metadata","title","desc","script","clipPath","mask","symbol","marker","linearGradient","radialGradient","pattern","filter","font","font-face","glyph","missing-glyph","cursor","view","animate","animateTransform","animateMotion","set"]);
const GROUP=new Set(["g","a","switch"]);
const ATOMIC_SEL="use,clipPath,mask,pattern,filter,defs,metadata,foreignObject,style,textPath,marker";
let fragSeq=0;

function num(v,d){const n=parseFloat(v);return isFinite(n)?n:(d||0);}
function firstNum(v,d){if(v==null||v==="")return d;const n=parseFloat(String(v).trim().split(/[\s,]+/)[0]);return isFinite(n)?n:d;}
function toHex(c){
  if(!c||c==="none"||c==="transparent")return "none";
  const m=/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)$/i.exec(c);
  if(!m)return c;
  const a=m[4]==null?1:(m[4].endsWith("%")?parseFloat(m[4])/100:parseFloat(m[4]));
  if(a<=0.001)return "none";
  const rgb=[m[1],m[2],m[3]].map(v=>Math.round(+v));
  return a>=0.999?"#"+rgb.map(v=>v.toString(16).padStart(2,"0")).join("").toUpperCase():`rgba(${rgb.join(",")},${+a.toFixed(3)})`;
}
function paint(c,op){
  const h=toHex(c);const a=op==null?1:num(op,1);
  if(h==="none"||a>=0.999)return h;
  const m=/^#([0-9A-F]{6})$/i.exec(h);if(!m)return h;
  const n=parseInt(m[1],16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${+a.toFixed(3)})`;
}
function weightNum(w){if(w==="bold"||w==="bolder")return 700;if(w==="normal"||w==="lighter")return 400;return Math.round(num(w,400));}
function fontStr(f){return String(f||"").replace(/"/g,"'");}
function decompose(m){const sx=Math.hypot(m.a,m.b)||1,det=m.a*m.d-m.b*m.c;return{sx,sy:Math.abs(det/sx)||1,rot:Math.atan2(m.b,m.a)*180/Math.PI};}
function mapPt(m,x,y){return{x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f};}
function usesPaintServer(cs){return /^url\(/.test(cs.fill||"")||/^url\(/.test(cs.stroke||"");}
function hasEffect(cs){return (cs.clipPath&&cs.clipPath!=="none")||(cs.mask&&cs.mask!=="none")||(cs.filter&&cs.filter!=="none");}

/* ---- untrusted input: strip anything that could run code before the SVG touches the DOM ---- */
function sanitize(doc){
  doc.querySelectorAll("script,iframe,embed,object,foreignObject iframe").forEach(n=>n.remove());
  for(const el of doc.getElementsByTagName("*")){
    for(const at of Array.from(el.attributes)){
      const n=at.name.toLowerCase(),v=String(at.value).trim().toLowerCase();
      if(n.startsWith("on")||((n==="href"||n==="xlink:href"||n==="src")&&v.startsWith("javascript:")))el.removeAttribute(at.name);
    }
  }
}

/* ---- CSS: @font-face rules go to the project; everything else is scoped to one fragment ---- */
function splitCss(css){
  css=String(css||"").replace(/\/\*[\s\S]*?\*\//g,"");
  const fonts=[];css=css.replace(/@font-face\s*\{[^}]*\}/gi,m=>{fonts.push(m);return "";}).replace(/@import[^;]*;/gi,"");
  return {fonts,rest:css};
}
function scopeCss(css,scope){
  let out="";
  css.replace(/@[a-z-]+[^{]*\{/gi,"").replace(/([^{}]+)\{([^{}]*)\}/g,(_m,sel,decl)=>{
    sel=sel.trim();if(!sel||sel.startsWith("@"))return "";
    out+=sel.split(",").map(s=>`.${scope} ${s.trim()}`).join(",")+`{${decl}}`;return "";
  });
  return out;
}

/* ---- referenced defs (gradients, clip paths, symbols…) that live outside a fragment ---- */
function refsIn(node){
  const ids=new Set(),add=v=>{if(!v)return;let m;const re=/url\(\s*['"]?#([^'")\s]+)['"]?\s*\)/g;while((m=re.exec(v)))ids.add(m[1]);};
  const visit=el=>{
    for(const at of Array.from(el.attributes||[])){add(at.value);if((at.name==="href"||at.name==="xlink:href")&&/^#/.test(at.value))ids.add(at.value.slice(1));}
    if(el.localName==="style")add(el.textContent);
  };
  visit(node);node.querySelectorAll("*").forEach(visit);return ids;
}
function externalDefs(clone,root){
  const out=[],have=new Set();const queue=[...refsIn(clone)];
  while(queue.length){
    const id=queue.shift();if(have.has(id))continue;have.add(id);
    const sel=`[id="${CSS.escape(id)}"]`;
    if(clone.querySelector(sel))continue;
    const src=root.querySelector(sel);if(!src)continue;
    const c=src.cloneNode(true);out.push(c);refsIn(c).forEach(r=>{if(!have.has(r))queue.push(r);});
  }
  return out;
}

/* ================================ main entry ================================ */
async function importSvgText(text){
  const doc=new DOMParser().parseFromString(String(text),"image/svg+xml");
  if(doc.getElementsByTagName("parsererror").length||!doc.documentElement||doc.documentElement.localName!=="svg")throw new Error("Not a valid SVG");
  sanitize(doc);

  // Fonts + global (non-font) CSS from <style> blocks that are not inside an atomic group.
  const fontFaces=[];let globalCss="";
  doc.querySelectorAll("style").forEach(s=>{const r=splitCss(s.textContent);fontFaces.push(...r.fonts);if(!s.closest("g"))globalCss+=r.rest;});

  // Lay the SVG out off-screen so the browser resolves transforms, CSS and text metrics for us.
  const host=document.createElement("div");
  host.style.cssText="position:fixed;left:-300000px;top:0;opacity:0;pointer-events:none;contain:strict;width:10px;height:10px;overflow:hidden";
  const root=document.importNode(doc.documentElement,true);
  host.appendChild(root);document.body.appendChild(host);
  try{
    try{await document.fonts.ready;}catch(e){}
    const vb=root.viewBox&&root.viewBox.baseVal&&root.viewBox.baseVal.width?root.viewBox.baseVal:null;
    let W=vb?vb.width:0,H=vb?vb.height:0;const ox=vb?vb.x:0,oy=vb?vb.y:0;
    if(!W||!H){try{W=root.width.baseVal.value;H=root.height.baseVal.value;}catch(e){}}
    if(!W||!H){const bb=root.getBBox();W=bb.x+bb.width;H=bb.y+bb.height;}
    const rootInv=root.getScreenCTM().inverse();
    const mat=el=>{const m=el.getScreenCTM();if(!m)return null;const r=rootInv.multiply(m);r.e-=ox;r.f-=oy;return r;};
    const effOpacity=(el,includeSelf)=>{let o=1,n=includeSelf?el:el.parentNode;while(n&&n!==root&&n.nodeType===1){o*=num(getComputedStyle(n).opacity,1);n=n.parentNode;}return o;};
    const placeBox=(M,bx,by,bw,bh)=>{const d=decompose(M),c=mapPt(M,bx+bw/2,by+bh/2);return{x:c.x,y:c.y,w:bw*d.sx,h:bh*d.sy,rot:+d.rot.toFixed(3),sx:d.sx,sy:d.sy};};
    const out=[];let bg=null;
    const coversArtboard=g=>Math.abs(g.rot)<0.01&&g.x-g.w/2<=1&&g.y-g.h/2<=1&&g.x+g.w/2>=W-1&&g.y+g.h/2>=H-1;

    const pushFrag=el=>{
      let bb;try{bb=el.getBBox();}catch(e){return;}
      const M=mat(el);if(!M)return;
      let{x:bx,y:by,width:bw,height:bh}=bb;
      if(!(bw>0)&&!(bh>0))return;
      if(bw<0.01){bx-=0.5;bw=1;}if(bh<0.01){by-=0.5;bh=1;}
      const cs=getComputedStyle(el);
      const clone=el.cloneNode(true);clone.removeAttribute("transform");
      clone.querySelectorAll("metadata,title,desc,script").forEach(n=>n.remove());
      [clone,...clone.querySelectorAll("[data-id],[data-handle]")].forEach(n=>{n.removeAttribute("data-id");n.removeAttribute("data-handle");});
      // Bake in styles the fragment inherited from ancestors it no longer has.
      [["fill","fill"],["fillOpacity","fill-opacity"],["stroke","stroke"],["strokeWidth","stroke-width"],["strokeOpacity","stroke-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontWeight","font-weight"],["fontStyle","font-style"]]
        .forEach(([p,a])=>{if(!clone.hasAttribute(a)&&cs[p])clone.setAttribute(a,cs[p]);});
      const scope="ffx"+Date.now().toString(36)+"_"+(++fragSeq);
      clone.querySelectorAll("style").forEach(s=>{s.textContent=scopeCss(splitCss(s.textContent).rest,scope);});
      const defs=externalDefs(clone,root);
      const ser=new XMLSerializer();
      let markup=defs.length?`<defs>${defs.map(d=>ser.serializeToString(d)).join("")}</defs>`:"";
      markup+=ser.serializeToString(clone);
      const g=placeBox(M,bx,by,bw,bh);
      out.push({id:gid(),type:"svg",x:g.x,y:g.y,w:g.w,h:g.h,rot:g.rot,opacity:+effOpacity(el,false).toFixed(3),vb:[bx,by,bw,bh],markup,scope,css:globalCss.trim()?scopeCss(globalCss,scope):""});
    };

    const pushShape=(el,cs)=>{
      const tag=el.localName;let bx,by,bw,bh,kind;
      if(tag==="rect"){bx=el.x.baseVal.value;by=el.y.baseVal.value;bw=el.width.baseVal.value;bh=el.height.baseVal.value;kind=(num(el.getAttribute("rx"))>0||num(el.getAttribute("ry"))>0)?"round":"rect";}
      else if(tag==="circle"){const r=el.r.baseVal.value;bx=el.cx.baseVal.value-r;by=el.cy.baseVal.value-r;bw=bh=2*r;kind="circle";}
      else{const rx=el.rx.baseVal.value,ry=el.ry.baseVal.value;bx=el.cx.baseVal.value-rx;by=el.cy.baseVal.value-ry;bw=2*rx;bh=2*ry;kind="ellipse";}
      if(!(bw>0&&bh>0))return;
      const M=mat(el);if(!M)return;const g=placeBox(M,bx,by,bw,bh);
      if(kind==="circle"&&Math.abs(g.w-g.h)>0.5)kind="ellipse";
      const fill=paint(cs.fill,cs.fillOpacity),stroke=paint(cs.stroke,cs.strokeOpacity),op=effOpacity(el,true);
      // A plain rectangle filling the whole page before anything else is drawn = page background.
      if(tag==="rect"&&!out.length&&stroke==="none"&&fill!=="none"&&op>=0.999&&coversArtboard(g)){bg=fill;return;}
      out.push({id:gid(),type:"shape",shapeKind:kind,x:g.x,y:g.y,w:g.w,h:g.h,rot:g.rot,opacity:+op.toFixed(3),fill,stroke,
        strokeWidth:stroke==="none"?0:+(num(cs.strokeWidth,1)*(g.sx+g.sy)/2).toFixed(3),dash:!!(cs.strokeDasharray&&cs.strokeDasharray!=="none"),shadow:false,shadowBlur:4});
    };

    const pushLine=(el,cs)=>{
      const M=mat(el);if(!M)return;const d=decompose(M);
      const stroke=paint(cs.stroke,cs.strokeOpacity);if(stroke==="none")return;
      const p1=mapPt(M,el.x1.baseVal.value,el.y1.baseVal.value),p2=mapPt(M,el.x2.baseVal.value,el.y2.baseVal.value);
      out.push(mkConn(null,null,{fromPt:p1,toPt:p2,stroke,strokeWidth:+(num(cs.strokeWidth,1)*(d.sx+d.sy)/2).toFixed(3),
        body:(cs.strokeDasharray&&cs.strokeDasharray!=="none")?"dashed":"solid",head:"none",tail:"none",opacity:+effOpacity(el,true).toFixed(3),style:"straight"}));
    };

    // One <text> element = one text box. Lines come from tspans that set their own x (a new line);
    // nested tspans become styled runs (bold, size, colour, superscript via y shift).
    const pushText=(el,cs)=>{
      if(el.querySelector("textPath")||hasEffect(cs))return pushFrag(el);
      let keep=false;for(let n=el;n&&n.nodeType===1;n=n.parentNode){const v=n.getAttributeNS("http://www.w3.org/XML/1998/namespace","space")||n.getAttribute("xml:space");if(v){keep=v==="preserve";break;}}
      // Collapse ordinary whitespace like SVG does, but keep non-breaking spaces (tools often start the
      // run after a bold word with " ", and that space belongs to the run's measured width).
      const norm=t=>keep?t.replace(/[\t\r\n]/g," "):t.replace(/[ \t\r\n]+/g," ");
      const fs0=num(cs.fontSize,16),base={w:weightNum(cs.fontWeight),fill:paint(cs.fill,cs.fillOpacity),it:cs.fontStyle==="italic"||cs.fontStyle==="oblique",ff:fontStr(cs.fontFamily)};
      const lines=[];let cur=null,curY=firstNum(el.getAttribute("y"),0)+firstNum(el.getAttribute("dy"),0);
      const newLine=(x,y,src)=>{cur={x,y,src,runs:[]};lines.push(cur);};
      newLine(firstNum(el.getAttribute("x"),0)+firstNum(el.getAttribute("dx"),0),curY,el);
      const visit=node=>{
        for(const n of Array.from(node.childNodes)){
          if(n.nodeType===3){
            const t=norm(n.textContent);if(!t)continue;
            const pcs=getComputedStyle(n.parentNode),r={t,rise:curY-cur.y};
            const w=weightNum(pcs.fontWeight),f=num(pcs.fontSize,fs0),fl=paint(pcs.fill,pcs.fillOpacity),it=pcs.fontStyle==="italic"||pcs.fontStyle==="oblique",ff=fontStr(pcs.fontFamily);
            if(w!==base.w)r.w=w;if(Math.abs(f-fs0)>0.01)r.fs=f;if(fl!==base.fill&&fl!=="none")r.fill=fl;if(it!==base.it)r.it=it;if(ff!==base.ff)r.ff=ff;
            const last=cur.runs[cur.runs.length-1];
            if(last&&last.w===r.w&&last.fs===r.fs&&last.fill===r.fill&&last.it===r.it&&last.ff===r.ff&&Math.abs(last.rise-r.rise)<0.01)last.t+=t;else cur.runs.push(r);
          }else if(n.nodeType===1&&n.localName==="tspan"){
            if(getComputedStyle(n).display==="none")continue;
            let ny=n.hasAttribute("y")?firstNum(n.getAttribute("y"),curY):curY;ny+=firstNum(n.getAttribute("dy"),0);curY=ny;
            if(n.hasAttribute("x"))newLine(firstNum(n.getAttribute("x"),0)+firstNum(n.getAttribute("dx"),0),ny,n);
            visit(n);
          }
        }
      };
      visit(el);
      // tidy line ends, drop empty lines
      for(const L of lines){
        if(!keep&&L.runs.length)L.runs[0].t=L.runs[0].t.replace(/^ +/,"");
        if(L.runs.length)L.runs[L.runs.length-1].t=L.runs[L.runs.length-1].t.replace(/ +$/,"");
        L.runs=L.runs.filter(r=>r.t.length);
      }
      const used=lines.filter(L=>L.runs.length&&L.runs.some(r=>r.t.trim()));
      if(!used.length)return;
      // measured width of each line (its own textLength when present, so layout matches exactly)
      for(const L of used){
        let len=num(L.src.getAttribute("textLength"),0);
        if(!len&&!(L.src===el&&used.length>1)){try{len=L.src.getComputedTextLength();}catch(e){}}
        L.len=len||null;L.lenEst=len||L.runs.reduce((a,r)=>a+r.t.length*(r.fs||fs0)*0.55,0);
      }
      const anchor=cs.textAnchor,align=anchor==="middle"?"center":anchor==="end"?"right":"left";
      for(const L of used)L.left=align==="center"?L.x-L.lenEst/2:align==="right"?L.x-L.lenEst:L.x;
      const left=Math.min(...used.map(L=>L.left)),right=Math.max(...used.map(L=>L.left+L.lenEst));
      const top=used[0].y-fs0,bottom=used[used.length-1].y+fs0*0.3;
      const M=mat(el);if(!M)return;const g=placeBox(M,left,top,right-left,bottom-top),sx=g.sx,sy=g.sy;
      const ref=align==="center"?(left+right)/2:align==="right"?right:left;
      const text=used.map(L=>L.runs.map(r=>r.t).join("")).join("\n");
      const rich={text,font:base.ff,fs0:+(fs0*sy).toFixed(4),lines:used.map(L=>({ox:(align==="left"?L.left-left:L.x-ref)*sx,by:(L.y-top)*sy,len:L.len?L.len*sx:null,
        runs:L.runs.map(r=>{const o={t:r.t,rise:r.rise*sy};if(r.w!=null)o.w=r.w;if(r.fs!=null)o.fs=r.fs*sy;if(r.fill)o.fill=r.fill;if(r.it!=null)o.it=r.it;if(r.ff)o.ff=r.ff;return o;})}))};
      let lineHeight;if(used.length>1){const d=used.slice(1).map((L,i)=>L.y-used[i].y).sort((a,b)=>a-b);lineHeight=+(d[Math.floor(d.length/2)]/fs0).toFixed(4);}
      const o={id:gid(),type:"text",x:g.x,y:g.y,w:g.w,h:g.h,rot:g.rot,opacity:+effOpacity(el,true).toFixed(3),text,fontSize:rich.fs0,
        weight:base.w,italic:base.it,underline:/underline/.test(cs.textDecorationLine||cs.textDecoration||""),fill:base.fill==="none"?"#000000":base.fill,align,font:base.ff,rich};
      if(lineHeight)o.lineHeight=lineHeight;
      out.push(o);
    };

    const pushImage=(el,cs)=>{
      const href=el.getAttribute("href")||el.getAttributeNS(XLINK,"href");if(!href)return;
      if(hasEffect(cs))return pushFrag(el);
      const bw=el.width.baseVal.value,bh=el.height.baseVal.value;if(!(bw>0&&bh>0))return;
      const M=mat(el);if(!M)return;const g=placeBox(M,el.x.baseVal.value,el.y.baseVal.value,bw,bh);
      const par=(el.getAttribute("preserveAspectRatio")||"").trim();
      out.push({id:gid(),type:"image",href,x:g.x,y:g.y,w:g.w,h:g.h,rot:g.rot,opacity:+effOpacity(el,true).toFixed(3),
        fit:par==="none"?"fill":/slice/.test(par)?"cover":"contain",radius:0,shadow:false,shadowBlur:6,brightness:100,saturate:100,hue:0,tint:null,tintAmt:0});
    };

    const walk=parent=>{
      for(const el of Array.from(parent.children)){
        const tag=el.localName;if(el.namespaceURI!==SVGNS||SKIP.has(tag))continue;
        const cs=getComputedStyle(el);if(cs.display==="none"||cs.visibility==="hidden")continue;
        try{
          if(GROUP.has(tag)){if(hasEffect(cs)||el.querySelector(ATOMIC_SEL))pushFrag(el);else walk(el);continue;}
          const simple=!hasEffect(cs)&&!usesPaintServer(cs);
          if((tag==="rect"||tag==="circle"||tag==="ellipse")&&simple)pushShape(el,cs);
          else if(tag==="line"&&simple&&(cs.markerStart==="none"||!cs.markerStart)&&(cs.markerEnd==="none"||!cs.markerEnd))pushLine(el,cs);
          else if(tag==="text")pushText(el,cs);
          else if(tag==="image")pushImage(el,cs);
          else pushFrag(el);
        }catch(e){try{pushFrag(el);}catch(e2){}}
      }
    };
    walk(root);
    return {w:W,h:H,bg,objs:out,fontFaces:[...new Set(fontFaces)]};
  }finally{host.remove();}
}

/* Scale/move/rotate a batch of imported objects (used to fit them to the page or into an image box). */
function transformObjs(objs,k,mapP,dRot){
  for(const o of objs){
    if(o.type==="connector"){if(o.fromPt)o.fromPt=mapP(o.fromPt);if(o.toPt)o.toPt=mapP(o.toPt);o.strokeWidth*=k;continue;}
    const p=mapP({x:o.x,y:o.y});o.x=p.x;o.y=p.y;o.w*=k;o.h*=k;o.rot=((o.rot||0)+(dRot||0));
    if(o.type==="shape")o.strokeWidth*=k;
    if(o.type==="text"){o.fontSize*=k;if(o.textFit){o.textFit.len*=k;o.textFit.fs=o.fontSize;}
      if(o.rich){const R=o.rich;R.fs0*=k;for(const L of R.lines){L.ox*=k;L.by*=k;if(L.len)L.len*=k;for(const r of L.runs){r.rise*=k;if(r.fs!=null)r.fs*=k;}}}}
  }
  return objs;
}
function decodeSvgDataUrl(href){
  const m=/^data:image\/svg\+xml(;[^,]*)?,(.*)$/is.exec(href||"");if(!m)return null;
  try{return /;base64/i.test(m[1]||"")?decodeURIComponent(escape(atob(m[2]))):decodeURIComponent(m[2]);}catch(e){return null;}
}

global.importSvgText=importSvgText;
global.transformImportedObjs=transformObjs;
global.decodeSvgDataUrl=decodeSvgDataUrl;
})(window);
