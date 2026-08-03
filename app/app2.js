/* ===========================================================================
   Fable Figures — library, properties, export, home, settings, autosave, i18n.
   Shares global scope with app.js / assets.js.  Crafted by Lee.
   =========================================================================== */
"use strict";

/* ============================ LIBRARY ============================ */
let curLib="shapes";
const LIB_TABS=[["shapes","shapes"],["network","network"],["bio","biology"],["human","human"],["ai","ai"],["uploads","uploads"]];
function buildTabs(){$("libtabs").innerHTML=LIB_TABS.map(t=>`<button class="libtab ${t[0]===curLib?'active':''}" data-lib="${t[0]}">${T(t[1])}</button>`).join("");}
function libCell(type,kind,nm,inner,cls){return `<div class="libitem ${cls||''}" draggable="true" data-type="${type}" data-kind="${kind}" title="${nm}">${inner}<span class="nm">${nm}</span></div>`;}

function buildLibrary(filter){
  filter=(filter||"").trim().toLowerCase();const wrap=$("libscroll");
  $("libsearchWrap").style.display=(curLib==="ai"||curLib==="uploads")?"none":"block";
  let h="";
  if(curLib==="shapes"){
    h+=`<div class="libgroup-title">${T("shapes")}</div><div class="libgrid">`;
    for(const s of SHAPES){if(filter&&!s[1].toLowerCase().includes(filter))continue;h+=libCell("shape",s[0],s[1],shapeThumb(s[0]),"shape");}
    h+=`</div><div class="libgroup-title">Arrows & connectors</div><div class="libgrid two">`;
    for(const a of ARROW_PRESETS){if(filter&&!a[1].toLowerCase().includes(filter))continue;h+=libCell("arrow",a[0],a[1],arrowThumb(a[0]),"wide");}
    h+=`</div>`;
    wrap.innerHTML=h;
  }else if(curLib==="network"){
    h+=`<div class="libgroup-title">Architectures</div><div class="libgrid two">`;
    for(const n of NETWORK_PRESETS){if(filter&&!n[1].toLowerCase().includes(filter))continue;h+=libCell("net",n[0],n[1],`<div class="pbadge">SET</div>`+presetPreviewSVG(n[0]),"preset wide");}
    h+=`</div>`;wrap.innerHTML=h;
  }else if(curLib==="bio"){
    for(const g of BIO_GROUPS){const items=g.items.filter(it=>!filter||it[1].toLowerCase().includes(filter));if(!items.length)continue;h+=`<div class="libgroup-title">${g.title}</div><div class="libgrid">`;for(const it of items){const isP=it[0].indexOf("preset:")===0;h+=libCell(isP?"preset":"icon",it[0],it[1],(isP?`<div class="pbadge">SET</div>`+presetPreviewSVG(it[0]):`<svg viewBox="0 0 100 100">${iconSVG(it[0],"lib_"+it[0])}</svg>`),isP?"preset":"");}h+=`</div>`;}
    wrap.innerHTML=h||`<div class="uploads-hint">No matching assets.</div>`;
  }else if(curLib==="human"){
    for(const g of HUMAN_GROUPS){const items=g.items.filter(it=>!filter||it[1].toLowerCase().includes(filter));if(!items.length)continue;h+=`<div class="libgroup-title">${g.title}</div><div class="libgrid">`;for(const it of items){const isP=it[0].indexOf("preset:")===0;h+=libCell(isP?"preset":"icon",it[0],it[1],(isP?`<div class="pbadge">SET</div>`+presetPreviewSVG(it[0]):`<svg viewBox="0 0 100 100">${iconSVG(it[0],"lib_"+it[0])}</svg>`),isP?"preset":"");}h+=`</div>`;}
    wrap.innerHTML=h;
  }else if(curLib==="ai"){buildAIPane(wrap);}
  else if(curLib==="uploads"){buildUploads(wrap);}
  attachLibDnD();
}
/* full preset preview: build the preset's objects and render them fitted to a thumbnail */
function presetPreviewSVG(libKind){
  const kind=libKind.indexOf("preset:")===0?libKind.slice(7):libKind; // "animalcell" or "net:mlp"
  const saved=state.objs, savedSel=state.sel;
  try{
    const objs=buildPreset(kind,0,0);
    if(!objs||!objs.length)return `<svg viewBox="0 0 100 100"></svg>`;
    state.objs=objs; state.sel=[];
    const bb=groupBBox(objs)||{x:-50,y:-50,w:100,h:100};
    const pad=Math.max(bb.w,bb.h)*0.06+8;
    const inner=objs.map(o=>o.type==="connector"?connectorMarkup(o).replace(/class="[^"]*"/g,""):`<g transform="translate(${o.x},${o.y}) rotate(${o.rot||0})">${objMarkup(o)}</g>`).join("");
    return `<svg viewBox="${(bb.x-pad).toFixed(1)} ${(bb.y-pad).toFixed(1)} ${(bb.w+2*pad).toFixed(1)} ${(bb.h+2*pad).toFixed(1)}">${inner}</svg>`;
  }catch(e){return `<svg viewBox="0 0 100 100"></svg>`;}
  finally{state.objs=saved;state.sel=savedSel;}
}
function arrowThumb(kind){const map={"arrow:straight":["triangle","solid"],"arrow:double":["triangle","solid","triangle"],"arrow:dashed":["triangle","dashed"],"arrow:dotted":["triangle","dotted"],"arrow:block":["barbed","solid"],"arrow:curved":["triangle","solid"],"arrow:elbow":["triangle","solid"],"arrow:tee":["line","solid"]};const m=map[kind]||["triangle","solid"];const dash=m[1]==="dashed"?'stroke-dasharray="6 5"':m[1]==="dotted"?'stroke-dasharray="1 5"':"";const head=m[0]==="line"?`<path d="M82 32v16" stroke="#5A5650" stroke-width="3"/>`:m[0]==="barbed"?`<polygon points="86,40 70,30 74,40 70,50" fill="#5A5650"/>`:`<polygon points="86,40 72,32 72,48" fill="#5A5650"/>`;const tail=m[2]?`<polygon points="14,40 28,32 28,48" fill="#5A5650"/>`:"";return `<svg viewBox="0 0 100 80"><path d="M16 40h66" stroke="#5A5650" stroke-width="3" ${dash} stroke-linecap="round"/>${head}${tail}</svg>`;}
function presetThumb(kind){const k=kind.replace("preset:","");const ic={animalcell:"cell",bacterium:"bacterium",synapse:"nerve",pca:"scatter",umap:"umap",linegraph:"lineplot",barpreset:"barplot",cohort:"person",casecontrol:"patient",trial:"person"}[k]||"cell";return iconSVG(ic,"pt_"+k);}
function netThumb(kind){return `<svg viewBox="0 0 100 80">${iconSVG("network","nt_"+kind)}</svg>`;}

function attachLibDnD(){
  document.querySelectorAll("#libscroll .libitem").forEach(el=>{
    el.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/plain",JSON.stringify({type:el.getAttribute("data-type"),kind:el.getAttribute("data-kind")}));e.dataTransfer.effectAllowed="copy";});
    el.addEventListener("dblclick",()=>{const c=artCenter();placeAsset(el.getAttribute("data-type"),el.getAttribute("data-kind"),c.x,c.y);});
  });
}
function artCenter(){const r=stage.getBoundingClientRect();return toCanvas({clientX:r.left+r.width/2,clientY:r.top+r.height/2});}
function placeAsset(type,kind,x,y){if(type==="icon")addIcon(kind,x,y);else if(type==="shape")addShape(kind,x,y);else if(type==="arrow")addArrow(kind,x,y);else if(type==="net")addPreset(kind,x,y);else if(type==="preset")addPreset(kind.replace("preset:",""),x,y);else if(type==="upload"){const u=state.uploads[+kind];if(u)placeImage(u.href,x,y,u.w,u.h);}else if(type==="ai"){const im=aiImages[+kind];if(im&&im.href)placeImage(im.href,x,y,220,220);}}
function placeImage(href,x,y,w,h){let W=w||240,H=h||180,max=320;if(W>max){H=H*max/W;W=max;}addImage(href,x,y,W,H);}

stage.addEventListener("dragover",e=>{e.preventDefault();e.dataTransfer.dropEffect="copy";});
stage.addEventListener("drop",e=>{e.preventDefault();if(e.dataTransfer.files&&e.dataTransfer.files.length){handleFiles(e.dataTransfer.files,toCanvas(e));return;}let d;try{d=JSON.parse(e.dataTransfer.getData("text/plain"));}catch{return;}const pt=toCanvas(e);placeAsset(d.type,d.kind,pt.x,pt.y);});
// allow drag-drop of screenshots/images anywhere onto the window
window.addEventListener("dragover",e=>{if(e.dataTransfer&&e.dataTransfer.types.includes("Files"))e.preventDefault();});
window.addEventListener("drop",e=>{if($("editor").classList.contains("hidden"))return;if(e.target.closest("#stage"))return;if(e.dataTransfer.files&&e.dataTransfer.files.length){e.preventDefault();handleFiles(e.dataTransfer.files,artCenter());}});

$("libsearch").addEventListener("input",e=>buildLibrary(e.target.value));

/* ============================ UPLOADS (svg, drag-drop, accordion) ============================ */
function buildUploads(wrap){
  let h=`<div class="up-drop" id="upDrop">${T("uploadHere")}</div>`;
  h+=`<div class="libgroup-title">${T("thisProject")}</div>`;
  if(!state.uploads.length)h+=`<div class="uploads-hint">—</div>`;
  else{h+=`<div class="up-items open" style="max-height:none;opacity:1">`;state.uploads.forEach((u,i)=>{h+=`<div class="up-thumb" draggable="true" data-type="upload" data-kind="${i}"><img src="${u.href}"></div>`;});h+=`</div>`;}
  // other projects
  const projs=loadProjects().filter(p=>p.id!==curProjectId&&p.uploads&&p.uploads.length);
  if(projs.length)h+=`<div class="up-block">`+projs.map((p,pi)=>`<div class="up-head" data-blk="${pi}">${p.name}<span class="cnt">(${p.uploads.length})</span><span class="chev">▸</span></div><div class="up-items" data-blkitems="${pi}">`+p.uploads.map((u,ui)=>`<div class="up-thumb" draggable="true" data-otherproj="${pi}" data-otheridx="${ui}"><img src="${u.href}"></div>`).join("")+`</div>`).join("")+`</div>`;
  wrap.innerHTML=h;
  const drop=$("upDrop");drop.onclick=()=>$("uploadInput").click();drop.addEventListener("dragover",e=>{e.preventDefault();drop.style.borderColor="var(--accent)";});drop.addEventListener("dragleave",()=>drop.style.borderColor="");drop.addEventListener("drop",e=>{e.preventDefault();drop.style.borderColor="";if(e.dataTransfer.files.length)handleFiles(e.dataTransfer.files,artCenter());});
  wrap.querySelectorAll("[data-type=upload]").forEach(el=>{el.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/plain",JSON.stringify({type:"upload",kind:el.getAttribute("data-kind")}));});el.addEventListener("dblclick",()=>{const u=state.uploads[+el.getAttribute("data-kind")];placeImage(u.href,artCenter().x,artCenter().y,u.w,u.h);});});
  wrap.querySelectorAll(".up-head").forEach(hd=>hd.addEventListener("click",()=>{const items=wrap.querySelector(`[data-blkitems="${hd.getAttribute("data-blk")}"]`);hd.classList.toggle("open");items.classList.toggle("open");}));
  wrap.querySelectorAll("[data-otherproj]").forEach(el=>{el.addEventListener("dblclick",()=>{const p=projs[+el.getAttribute("data-otherproj")];const u=p.uploads[+el.getAttribute("data-otheridx")];placeImage(u.href,artCenter().x,artCenter().y,u.w,u.h);});el.addEventListener("dragstart",e=>{const p=projs[+el.getAttribute("data-otherproj")];const u=p.uploads[+el.getAttribute("data-otheridx")];e.dataTransfer.setData("text/plain",JSON.stringify({type:"uploadhref",href:u.href,w:u.w,h:u.h}));});});
}
$("uploadInput").addEventListener("change",async e=>{await handleFiles(e.target.files,artCenter());e.target.value="";});
async function handleFiles(files,at){let added=0,placed=false;for(const f of files){if(!/image|svg/.test(f.type)&&!/\.svg$/i.test(f.name))continue;let href,dim;if(/svg/.test(f.type)||/\.svg$/i.test(f.name)){const txt=await f.text();href="data:image/svg+xml;base64,"+btoa(unescape(encodeURIComponent(txt)));dim=await imgDims(href).catch(()=>({w:240,h:200}));}else{href=await blobToDataURL(f);dim=await imgDims(href);}state.uploads.unshift({href,w:dim.w,h:dim.h,name:f.name});added++;if(!placed){placeImage(href,at.x,at.y,dim.w,dim.h);placed=true;}}if(added){markDirty();if(curLib==="uploads")buildLibrary();toast(added+" image(s) added");}}
function blobToDataURL(b){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(b);});}
function imgDims(src){return new Promise(res=>{const im=new Image();im.onload=()=>res({w:im.naturalWidth||240,h:im.naturalHeight||180});im.onerror=()=>res({w:240,h:180});im.src=src;});}

/* ============================ AI (#11 robust) ============================ */
let aiImages=[];
function buildAIPane(wrap){
  wrap.innerHTML=`<div class="ai-pane"><p>${T("aiHint")}</p><textarea id="aiPrompt" placeholder="a glowing neuron, isometric 3D, white background"></textarea><div class="ai-row"><select id="aiStyle"><option value="">No style</option><option value="scientific illustration, clean, white background">Scientific</option><option value="isometric 3d render, soft studio light">Isometric 3D</option><option value="flat vector, minimal">Flat vector</option><option value="watercolor">Watercolor</option></select><button class="btn" id="aiGo" style="background:var(--accent);color:#fff;border-color:var(--accent)">${T("generate")}</button></div></div><div class="ai-gallery" id="aiGallery"></div>`;
  renderAI();$("aiGo").onclick=()=>genAI();$("aiPrompt").addEventListener("keydown",e=>{if(e.key==="Enter"&&(e.metaKey||e.ctrlKey))genAI();});
}
function renderAI(){const g=$("aiGallery");if(!g)return;if(!aiImages.length){g.innerHTML=`<div class="uploads-hint" style="grid-column:1/3">Generated images appear here.</div>`;return;}g.innerHTML=aiImages.map((im,i)=>im.loading?`<div class="ai-thumb"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M12 3a9 9 0 109 9"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/></path></svg></div>`:im.err?`<div class="ai-thumb err" data-retry="${i}">failed — click to retry</div>`:`<div class="ai-thumb" draggable="true" data-type="ai" data-kind="${i}"><img src="${im.href}"></div>`).join("");
  g.querySelectorAll("[data-type=ai]").forEach(el=>{el.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/plain",JSON.stringify({type:"ai",kind:el.getAttribute("data-kind")}));});el.addEventListener("dblclick",()=>placeImage(aiImages[+el.getAttribute("data-kind")].href,artCenter().x,artCenter().y,220,220));});
  g.querySelectorAll("[data-retry]").forEach(el=>el.onclick=()=>genAI(aiImages[+el.getAttribute("data-retry")].prompt,+el.getAttribute("data-retry")));
}
/* Root cause of prior "failed-retry": (1) pollinations can return 502/slow while the
   image is still rendering, and (2) drawing a cross-origin image to <canvas> taints it,
   so toDataURL throws. Fix: retry with backoff + longer timeout, and on canvas-taint
   fall back to using the remote URL directly (still displays & exports via <img>). */
function loadImg(url,timeout){return new Promise((res,rej)=>{const img=new Image();img.crossOrigin="anonymous";let done=false;const tm=setTimeout(()=>{if(!done){done=true;rej(new Error("timeout"));}},timeout||30000);img.onload=()=>{if(done)return;done=true;clearTimeout(tm);res(img);};img.onerror=()=>{if(done)return;done=true;clearTimeout(tm);rej(new Error("load"));};img.src=url;});}
async function genAI(promptOverride,replaceIdx){
  const p=promptOverride||($("aiPrompt")?$("aiPrompt").value.trim():"");if(!p){toast("Enter a prompt first",true);return;}
  const style=$("aiStyle")?$("aiStyle").value:"";const full=style?p+", "+style:p;
  let entry;if(replaceIdx!=null){entry=aiImages[replaceIdx];entry.loading=true;entry.err=false;}else{entry={href:null,prompt:p,loading:true,err:false};aiImages.unshift(entry);}
  renderAI();toast("Generating…");
  for(let attempt=0;attempt<3;attempt++){
    const seed=Math.floor(Math.random()*1e6);
    const url=`https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=512&height=512&nologo=true&seed=${seed}`;
    try{
      const img=await loadImg(url,30000);
      let href;
      try{const c=document.createElement("canvas");c.width=img.naturalWidth||512;c.height=img.naturalHeight||512;c.getContext("2d").drawImage(img,0,0);href=c.toDataURL("image/png");}
      catch(taint){href=url;} // cross-origin taint → keep remote URL (still works for display/export)
      entry.href=href;entry.loading=false;entry.err=false;renderAI();toast("Image ready — drag onto canvas");return;
    }catch(err){await new Promise(r=>setTimeout(r,800*(attempt+1)));}
  }
  entry.loading=false;entry.err=true;renderAI();toast("AI service unreachable. Check internet, then retry.",true);
}

/* ============================ PROPERTIES ============================ */
/* swatch palette — grouped by colour family (neutral → red → orange → yellow →
   green → teal → blue → purple → pink); the row wraps so families cluster together. */
const PALETTE=[
  "#1A1916","#26251F","#5A5650","#8C887D","#B7B2A6","#FFFFFF",          // neutral
  "#C23B3B","#D0556A","#B5485D","#E07A86",                              // red
  "#BF6141","#D97757","#E0844C","#EFA15C",                              // orange
  "#D9A21B","#E3B23C","#EBC85F",                                        // yellow / gold
  "#2F7D4F","#3E9C5E","#5FB877","#8FCB7E",                              // green
  "#2E8B82","#4FBEB2","#7BD0C7",                                        // teal
  "#2F6CA8","#3C6E9E","#5B9BD0","#86B9E2",                              // blue
  "#5350A0","#7A5FA3","#9A6CC0","#B79AD8",                              // purple
  "#C0557A","#D87DA0","#F0B6CC"                                         // pink
];
function swRow(curr,act,extra){return `<div class="swatchrow">${extra||""}`+PALETTE.map(c=>`<div class="chip ${String(curr).toLowerCase()===c.toLowerCase()?'sel':''}" style="background:${c}" data-${act}="${c}"></div>`).join("")+`</div>`;}
renderProps=function(){
  const p=$("rightpanel"),sel=selObjs();
  $("statusObj").textContent=state.objs.length?`${state.objs.length} obj${sel.length?` · ${sel.length} sel`:""}`:"";
  if(!sel.length){p.innerHTML=`<div class="prop-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3l6 16 2.2-6.2L19 10z" stroke-linejoin="round"/></svg>${T("emptyProp")}</div>`;return;}
  if(sel.length>1){p.innerHTML=multiProps(sel);bindMulti();return;}
  const o=sel[0];p.innerHTML=o.type==="connector"?connProps(o):singleProps(o);bindSingle(o);
};
function tf(o){return `<div class="psec"><h3>Transform</h3><div class="prow"><label>X</label><input class="num" id="pX" value="${Math.round(o.x)}"><label style="width:14px">Y</label><input class="num" id="pY" value="${Math.round(o.y)}"></div><div class="prow"><label>W</label><input class="num" id="pW" value="${Math.round(o.w)}"><label style="width:14px">H</label><input class="num" id="pH" value="${Math.round(o.h)}"></div><div class="prow"><label>Rotate</label><input type="range" id="pRot" min="-180" max="180" value="${o.rot||0}"><span style="font-size:11px;width:34px;text-align:right" id="pRotV">${Math.round(o.rot||0)}°</span></div><div class="prow"><label>Opacity</label><input type="range" id="pOp" min="0" max="100" value="${Math.round(o.opacity*100)}"><span style="font-size:11px;width:34px;text-align:right" id="pOpV">${Math.round(o.opacity*100)}%</span></div></div>`;}
function colorAdjustSec(o){return `<div class="psec"><h3>${T("editColor")}</h3><div class="prow"><label>Bright</label><input type="range" id="pBri" min="20" max="200" value="${o.brightness==null?100:o.brightness}"><span style="font-size:11px;width:30px;text-align:right" id="pBriV">${o.brightness==null?100:o.brightness}</span></div><div class="prow"><label>Sat</label><input type="range" id="pSat" min="0" max="200" value="${o.saturate==null?100:o.saturate}"><span style="font-size:11px;width:30px;text-align:right" id="pSatV">${o.saturate==null?100:o.saturate}</span></div><div class="prow"><label>Hue</label><input type="range" id="pHue" min="-180" max="180" value="${o.hue||0}"><span style="font-size:11px;width:30px;text-align:right" id="pHueV">${o.hue||0}</span></div><div style="font-size:10px;color:var(--subtle);margin:4px 0 7px">Tint</div>${swRow(o.tint||"none","itint",`<div class="chip ${!o.tint?'sel':''}" data-itint="none">∅</div>`)}<div class="prow" style="margin-top:9px"><label>Amount</label><input type="range" id="pTintAmt" min="0" max="100" value="${o.tintAmt||0}"><span style="font-size:11px;width:30px;text-align:right" id="pTintAmtV">${o.tintAmt||0}</span></div><button class="btn" id="pImgReset" style="width:100%;margin-top:4px">Reset color</button></div>`;}
function shadowSec(o){return `<div class="psec"><h3>Shadow</h3><div class="toggle"><span>Drop shadow</span><div class="sw ${o.shadow?'on':''}" id="pShadow"></div></div><div class="prow"><label>Blur</label><input type="range" id="pShB" min="0" max="20" value="${o.shadowBlur||4}" ${o.shadow?'':'disabled'}><span style="font-size:11px;width:30px;text-align:right" id="pShBV">${o.shadowBlur||4}</span></div></div>`;}
function arrangeSec(){return `<div class="psec"><h3>Arrange</h3><div class="prow" style="gap:6px"><button class="btn" style="flex:1" id="aFront">${T("front")}</button><button class="btn" style="flex:1" id="aFwd">${T("forward")}</button></div><div class="prow" style="gap:6px;margin-top:6px"><button class="btn" style="flex:1" id="aBwd">${T("backward")}</button><button class="btn" style="flex:1" id="aBack">${T("back")}</button></div><div class="prow" style="margin-top:6px"><button class="btn" style="flex:1" id="aDup">${T("duplicate")}</button></div></div>`;}
function singleProps(o){
  let h=tf(o);
  if(o.type==="shape"){h+=`<div class="psec"><h3>Fill</h3>${swRow(o.fill,"fill",`<button class="swatch" style="background:${o.fill};width:22px;height:22px"><input type="color" id="pFill" value="${hexOf(o.fill)}"></button>`)}</div><div class="psec"><h3>Stroke</h3>${swRow(o.stroke,"stroke")}<div class="prow" style="margin-top:9px"><label>Width</label><input type="range" id="pSW" min="0" max="16" step="0.5" value="${o.strokeWidth}"><span style="font-size:11px;width:30px;text-align:right" id="pSWV">${o.strokeWidth}</span></div><div class="toggle"><span>Dashed</span><div class="sw ${o.dash?'on':''}" id="pDash"></div></div></div>`;}
  if(o.type==="icon"){if(window.CAM.RECOLOR_ICONS.indexOf(o.shapeKind)>=0){h+=`<div class="psec"><h3>Color</h3>${swRow(o.fill||"#3A3F45","fill",`<button class="swatch" style="background:${o.fill||'#3A3F45'};width:22px;height:22px"><input type="color" id="pFill" value="${hexOf(o.fill||'#3A3F45')}"></button>`)}</div>`;}else h+=colorAdjustSec(o);}
  if(o.type==="image"){h+=`<div class="psec"><h3>Image</h3><div class="prow"><label>Fit</label><div class="seg" style="flex:1"><button data-fit="cover" class="${o.fit==='cover'?'on':''}">Cover</button><button data-fit="contain" class="${o.fit==='contain'?'on':''}">Contain</button></div></div><div class="prow"><label>Radius</label><input type="range" id="pRad" min="0" max="80" value="${o.radius||0}"><span style="font-size:11px;width:30px;text-align:right" id="pRadV">${o.radius||0}</span></div></div>`+colorAdjustSec(o);}
  if(o.type==="text"){h+=`<div class="psec"><h3>Text</h3><textarea class="ptext" id="pText">${escapeHtml(o.text)}</textarea><div class="prow" style="margin-top:9px"><label>Font</label><select class="num" id="pFont">${FONTS.map(f=>`<option value="${f[0]}" ${o.font===f[0]?'selected':''}>${f[1]}</option>`).join("")}</select></div><div class="prow"><label>Size</label><input type="range" id="pFS" min="8" max="200" value="${o.fontSize}"><input class="num" id="pFSNum" style="width:50px;text-align:right" value="${Math.round(o.fontSize)}"></div><div class="prow"><label>Style</label><div class="seg" style="flex:1"><button data-ts="bold" class="${o.weight>=700?'on':''}" style="font-weight:800">B</button><button data-ts="italic" class="${o.italic?'on':''}" style="font-style:italic">I</button><button data-ts="underline" class="${o.underline?'on':''}"><span style="text-decoration:underline">U</span></button></div></div><div class="prow"><label>Align</label><div class="seg" style="flex:1"><button data-align="left" class="${o.align==='left'?'on':''}">L</button><button data-align="center" class="${o.align==='center'?'on':''}">C</button><button data-align="right" class="${o.align==='right'?'on':''}">R</button></div></div><div style="font-size:10px;color:var(--subtle);margin-bottom:7px">Color</div>${swRow(o.fill,"fill",`<button class="swatch" style="background:${o.fill};width:22px;height:22px"><input type="color" id="pFill" value="${hexOf(o.fill)}"></button>`)}</div>`;}
  if(o.type!=="text")h+=shadowSec(o);
  h+=arrangeSec()+`<div class="danger-row"><button class="btn del" id="pDel">${T("delete")}</button></div>`;
  return h;
}
function connProps(o){
  const heads=ARROW_HEADS.map(t=>`<option value="${t}">${t}</option>`).join("");
  return `<div class="psec"><h3>Arrow / connector</h3>${swRow(o.stroke,"cstroke")}<div class="prow" style="margin-top:9px"><label>Width</label><input type="range" id="cSW" min="1" max="14" step="0.5" value="${o.strokeWidth}"><span style="font-size:11px;width:30px;text-align:right" id="cSWV">${o.strokeWidth}</span></div><div class="prow"><label>Body</label><div class="seg" style="flex:1"><button data-body="solid" class="${(o.body||'solid')==='solid'?'on':''}">Solid</button><button data-body="dashed" class="${o.body==='dashed'?'on':''}">Dash</button><button data-body="dotted" class="${o.body==='dotted'?'on':''}">Dot</button></div></div><div class="prow"><label>Route</label><div class="seg" style="flex:1"><button data-cstyle="straight" class="${o.style==='straight'?'on':''}">—</button><button data-cstyle="curved" class="${o.style==='curved'?'on':''}">⌒</button><button data-cstyle="ortho" class="${o.style==='ortho'?'on':''}">⌐</button></div></div><div class="prow"><label>Head</label><select class="num" id="cHead">${heads}</select></div><div class="prow"><label>Tail</label><select class="num" id="cTail">${heads}</select></div><div class="prow"><label>Head sz</label><input type="range" id="cHS" min="5" max="30" value="${o.headSize||10}"><span style="font-size:11px;width:30px;text-align:right" id="cHSV">${o.headSize||10}</span></div><div class="prow"><label>Opacity</label><input type="range" id="cOp" min="0" max="100" value="${Math.round(o.opacity*100)}"><span style="font-size:11px;width:34px;text-align:right" id="cOpV">${Math.round(o.opacity*100)}%</span></div></div>`+arrangeSec()+`<div class="danger-row"><button class="btn del" id="pDel">${T("delete")}</button></div>`;
}
function bulkType(sel){const t=new Set(sel.map(o=>o.type));return t.size===1?[...t][0]:null;}
function multiProps(sel){const bb=groupBBox(sel);const t=bulkType(sel);
  let h=`<div class="psec"><h3>${sel.length} selected${t&&t!=="connector"?" · "+t:""}</h3><div class="prow"><label>Group</label><span style="font-size:11.5px;color:var(--subtle)">${bb?Math.round(bb.w)+" × "+Math.round(bb.h):""}</span></div><p style="font-size:11px;color:var(--subtle);line-height:1.5;margin:2px 0 10px">Drag a corner to scale; the top handle (or buttons below) rotates each object in place.</p><div class="prow" style="gap:6px"><button class="btn" style="flex:1" id="mAlignL">⫷</button><button class="btn" style="flex:1" id="mAlignC">⊟</button><button class="btn" style="flex:1" id="mAlignR">⫸</button><button class="btn" style="flex:1" id="mAlignT">⊤</button><button class="btn" style="flex:1" id="mAlignM">⊞</button><button class="btn" style="flex:1" id="mAlignB">⊥</button></div><div class="prow" style="gap:6px;margin-top:6px"><button class="btn" style="flex:1" id="mRotL">⟲ −15°</button><button class="btn" style="flex:1" id="mRotR">⟳ +15°</button></div><div class="prow" style="gap:6px;margin-top:6px"><button class="btn" style="flex:1" id="mDist">Distribute</button><button class="btn" style="flex:1" id="mDup">${T("duplicate")}</button></div><div class="prow" style="gap:6px;margin-top:6px"><button class="btn" style="flex:1" id="mScaleDn">− 10%</button><button class="btn" style="flex:1" id="mScaleUp">+ 10%</button></div></div>`;
  if(t==="text")h+=bulkTextSec(sel);else if(t==="shape")h+=bulkShapeSec(sel);else if(t==="image"||t==="icon")h+=bulkColorSec(sel,t);else if(t==="connector")h+=bulkConnSec(sel);
  h+=`<div class="danger-row"><button class="btn del" id="pDel">${T("delete")} ${sel.length}</button></div>`;return h;}
function bulkConnSec(sel){const o=sel[0];const heads=ARROW_HEADS.map(t=>`<option value="${t}">${t}</option>`).join("");return `<div class="psec"><h3>Arrow / connector · all ${sel.length}</h3>${swRow(o.stroke,"mcstroke")}<div class="prow" style="margin-top:9px"><label>Width</label><input type="range" id="mcSW" min="1" max="14" step="0.5" value="${o.strokeWidth}"><input class="num" id="mcSWNum" style="width:44px;text-align:right" value="${o.strokeWidth}"></div><div class="prow"><label>Body</label><div class="seg" style="flex:1"><button data-mcbody="solid" class="${(o.body||'solid')==='solid'?'on':''}">Solid</button><button data-mcbody="dashed" class="${o.body==='dashed'?'on':''}">Dash</button><button data-mcbody="dotted" class="${o.body==='dotted'?'on':''}">Dot</button></div></div><div class="prow"><label>Route</label><div class="seg" style="flex:1"><button data-mcstyle="straight" class="${(o.style||'straight')==='straight'?'on':''}">—</button><button data-mcstyle="curved" class="${o.style==='curved'?'on':''}">⌒</button><button data-mcstyle="ortho" class="${o.style==='ortho'?'on':''}">⌐</button></div></div><div class="prow"><label>Head</label><select class="num" id="mcHead">${heads}</select></div><div class="prow"><label>Tail</label><select class="num" id="mcTail">${heads}</select></div><div class="prow"><label>Head sz</label><input type="range" id="mcHS" min="5" max="30" value="${o.headSize||10}"></div><div class="prow"><label>Opacity</label><input type="range" id="mcOp" min="0" max="100" value="${Math.round(o.opacity*100)}"></div></div>`;}
function bulkTextSec(sel){const o=sel[0];return `<div class="psec"><h3>Text · all ${sel.length}</h3><div class="prow"><label>Font</label><select class="num" id="mFont">${FONTS.map(f=>`<option value="${f[0]}" ${o.font===f[0]?'selected':''}>${f[1]}</option>`).join("")}</select></div><div class="prow"><label>Size</label><input type="range" id="mFS" min="8" max="200" value="${Math.round(o.fontSize)}"><input class="num" id="mFSNum" style="width:50px;text-align:right" value="${Math.round(o.fontSize)}"></div><div class="prow"><label>Style</label><div class="seg" style="flex:1"><button data-mts="bold" class="${o.weight>=700?'on':''}" style="font-weight:800">B</button><button data-mts="italic" class="${o.italic?'on':''}" style="font-style:italic">I</button><button data-mts="underline" class="${o.underline?'on':''}"><span style="text-decoration:underline">U</span></button></div></div><div class="prow"><label>Align</label><div class="seg" style="flex:1"><button data-malign="left" class="${o.align==='left'?'on':''}">L</button><button data-malign="center" class="${o.align==='center'?'on':''}">C</button><button data-malign="right" class="${o.align==='right'?'on':''}">R</button></div></div><div style="font-size:10px;color:var(--subtle);margin-bottom:7px">Color</div>${swRow(o.fill,"mfill",`<button class="swatch" style="background:${o.fill};width:22px;height:22px"><input type="color" id="mFillC" value="${hexOf(o.fill)}"></button>`)}</div>`;}
function bulkShapeSec(sel){const o=sel[0];return `<div class="psec"><h3>Shape · all ${sel.length}</h3><div style="font-size:10px;color:var(--subtle);margin-bottom:6px">Fill</div>${swRow(o.fill,"mfill",`<button class="swatch" style="background:${o.fill};width:22px;height:22px"><input type="color" id="mFillC" value="${hexOf(o.fill)}"></button>`)}<div style="font-size:10px;color:var(--subtle);margin:8px 0 6px">Stroke</div>${swRow(o.stroke,"mstroke")}<div class="prow" style="margin-top:9px"><label>Width</label><input type="range" id="mSW" min="0" max="16" step="0.5" value="${o.strokeWidth}"><input class="num" id="mSWNum" style="width:44px;text-align:right" value="${o.strokeWidth}"></div><div class="toggle"><span>Dashed</span><div class="sw ${o.dash?'on':''}" id="mDash"></div></div></div>`;}
function bulkColorSec(sel,t){const o=sel[0];let h=`<div class="psec"><h3>${t} · all ${sel.length}</h3>`;if(t==="icon"&&window.CAM.RECOLOR_ICONS.indexOf(o.shapeKind)>=0)h+=`<div style="font-size:10px;color:var(--subtle);margin-bottom:6px">Color</div>${swRow(o.fill||"#3A3F45","mfill",`<button class="swatch" style="background:${o.fill||'#3A3F45'};width:22px;height:22px"><input type="color" id="mFillC" value="${hexOf(o.fill||'#3A3F45')}"></button>`)}`;h+=`<div class="prow" style="margin-top:8px"><label>Bright</label><input type="range" id="mBri" min="20" max="200" value="${o.brightness==null?100:o.brightness}"></div><div class="prow"><label>Sat</label><input type="range" id="mSat" min="0" max="200" value="${o.saturate==null?100:o.saturate}"></div><div class="prow"><label>Hue</label><input type="range" id="mHue" min="-180" max="180" value="${o.hue||0}"></div></div>`;return h;}
function rotateAllInPlace(deg){const sel=selObjs().filter(o=>o.type!=="connector");if(!sel.length)return;pushHistory();sel.forEach(o=>o.rot=(o.rot||0)+deg);render();renderProps();}
function escapeHtml(s){return String(s).replace(/[<>&]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;"}[c]));}
function hexOf(c){if(/^#([0-9a-f]{6})$/i.test(c))return c;try{const m=document.createElement("canvas").getContext("2d");m.fillStyle=c;return m.fillStyle;}catch(e){return "#000000";}}
renderPropsLight=function(){const sel=selObjs();if(sel.length!==1)return;const o=sel[0];const set=(id,v)=>{const el=$(id);if(el&&document.activeElement!==el)el.value=v;};set("pX",Math.round(o.x));set("pY",Math.round(o.y));set("pW",Math.round(o.w));set("pH",Math.round(o.h));if($("pRot")){$("pRot").value=o.rot||0;$("pRotV").textContent=Math.round(o.rot||0)+"°";}};

function rangeH(id,vid,fn,fmt){const el=$(id);if(!el)return;let st=false;el.oninput=()=>{if(!st){pushHistory();st=true;}fn(+el.value);if(vid&&$(vid))$(vid).textContent=fmt?fmt(+el.value):(+el.value);render();};el.onchange=()=>{st=false;};}
function toggleH(id,fn){const el=$(id);if(!el)return;el.onclick=()=>{pushHistory();fn();el.classList.toggle("on");render();};}
function segH(attr,fn){document.querySelectorAll(`[data-${attr}]`).forEach(b=>b.onclick=()=>{pushHistory();fn(b.getAttribute(`data-${attr}`));render();renderProps();});}
function swH(act,fn){document.querySelectorAll(`[data-${act}]`).forEach(ch=>ch.onclick=()=>{pushHistory();fn(ch.getAttribute(`data-${act}`));render();renderProps();});}
function bindArrange(){const m={aFront:()=>zorder("front"),aFwd:()=>zorder("fwd"),aBwd:()=>zorder("bwd"),aBack:()=>zorder("back"),aDup:duplicateSel};for(const k in m){const el=$(k);if(el)el.onclick=m[k];}}
function bulkRange(id,fn){const el=$(id);if(!el)return;let st=false;el.oninput=()=>{if(!st){pushHistory();st=true;}const v=+el.value;selObjs().forEach(o=>fn(o,v));render();};el.onchange=()=>{st=false;};}
function bulkSwatch(act,fn){document.querySelectorAll(`[data-${act}]`).forEach(ch=>ch.onclick=()=>{pushHistory();const c=ch.getAttribute(`data-${act}`);selObjs().forEach(o=>fn(o,c));render();renderProps();});}
function bindMulti(){const d=$("pDel");if(d)d.onclick=deleteSel;bindArrange();
  const m={mAlignL:()=>align("l"),mAlignC:()=>align("cx"),mAlignR:()=>align("r"),mAlignT:()=>align("t"),mAlignM:()=>align("cy"),mAlignB:()=>align("b"),mDist:distribute,mDup:duplicateSel,mScaleDn:()=>scaleSel(0.9),mScaleUp:()=>scaleSel(1.1),mRotL:()=>rotateAllInPlace(-15),mRotR:()=>rotateAllInPlace(15)};
  for(const k in m){const el=$(k);if(el)el.onclick=m[k];}
  // bulk type-specific controls (apply to every selected object)
  const ft=$("mFont");if(ft)ft.onchange=()=>{pushHistory();selObjs().forEach(o=>o.font=ft.value);render();};
  bulkSwatch("mfill",(o,c)=>o.fill=c);bulkSwatch("mstroke",(o,c)=>o.stroke=c);
  const fc=$("mFillC");if(fc)fc.oninput=()=>{selObjs().forEach(o=>o.fill=fc.value);render();};
  document.querySelectorAll("[data-mts]").forEach(b=>b.onclick=()=>{pushHistory();const k=b.getAttribute("data-mts"),sel=selObjs(),ref=sel[0];const val=k==="bold"?(ref.weight>=700?400:700):k==="italic"?!ref.italic:!ref.underline;sel.forEach(o=>{if(k==="bold")o.weight=val;else if(k==="italic")o.italic=val;else o.underline=val;});render();renderProps();});
  document.querySelectorAll("[data-malign]").forEach(b=>b.onclick=()=>{pushHistory();const v=b.getAttribute("data-malign");selObjs().forEach(o=>o.align=v);render();renderProps();});
  const setAllFS=v=>selObjs().forEach(o=>{o.fontSize=v;o.h=Math.max(v*1.3,String(o.text).split("\n").length*v*1.25+8);});
  const mfs=$("mFS"),mfsn=$("mFSNum");if(mfs){let st=false;mfs.oninput=()=>{if(!st){pushHistory();st=true;}const v=+mfs.value;if(mfsn)mfsn.value=v;setAllFS(v);render();};mfs.onchange=()=>{st=false;};}
  if(mfsn)mfsn.onchange=()=>{pushHistory();const v=clamp(Math.round(+mfsn.value||12),4,400);if(mfs)mfs.value=Math.min(200,v);setAllFS(v);render();};
  bulkRange("mSW",(o,v)=>o.strokeWidth=v);const mswn=$("mSWNum");if(mswn)mswn.onchange=()=>{pushHistory();const v=+mswn.value||0;selObjs().forEach(o=>o.strokeWidth=v);render();};
  const mdash=$("mDash");if(mdash)mdash.onclick=()=>{pushHistory();const sel=selObjs(),val=!sel[0].dash;sel.forEach(o=>o.dash=val);mdash.classList.toggle("on",val);render();};
  bulkRange("mBri",(o,v)=>o.brightness=v);bulkRange("mSat",(o,v)=>o.saturate=v);bulkRange("mHue",(o,v)=>o.hue=v);
  /* bulk connector controls (apply to every selected arrow/connector) */
  const _c0=selObjs()[0];
  bulkSwatch("mcstroke",(o,c)=>o.stroke=c);bulkRange("mcSW",(o,v)=>o.strokeWidth=v);bulkRange("mcHS",(o,v)=>o.headSize=v);bulkRange("mcOp",(o,v)=>o.opacity=v/100);
  const mcswn=$("mcSWNum");if(mcswn)mcswn.onchange=()=>{pushHistory();const v=+mcswn.value||1;selObjs().forEach(o=>o.strokeWidth=v);render();};
  document.querySelectorAll("[data-mcbody]").forEach(b=>b.onclick=()=>{pushHistory();const v=b.getAttribute("data-mcbody");selObjs().forEach(o=>o.body=v);render();renderProps();});
  document.querySelectorAll("[data-mcstyle]").forEach(b=>b.onclick=()=>{pushHistory();const v=b.getAttribute("data-mcstyle");selObjs().forEach(o=>o.style=v);render();renderProps();});
  const mch=$("mcHead");if(mch&&_c0){mch.value=_c0.head||"triangle";mch.onchange=()=>{pushHistory();selObjs().forEach(o=>o.head=mch.value);render();};}
  const mct=$("mcTail");if(mct&&_c0){mct.value=_c0.tail||"none";mct.onchange=()=>{pushHistory();selObjs().forEach(o=>o.tail=mct.value);render();};}
}
function bindSingle(o){
  const d=$("pDel");if(d)d.onclick=deleteSel;bindArrange();
  const numH=(id,key)=>{const el=$(id);if(!el)return;el.onchange=()=>{pushHistory();o[key]=+el.value||0;if(key==="w"||key==="h")o[key]=Math.max(8,o[key]);render();};};
  numH("pX","x");numH("pY","y");numH("pW","w");numH("pH","h");
  rangeH("pRot","pRotV",v=>o.rot=v,v=>Math.round(v)+"°");rangeH("pOp","pOpV",v=>o.opacity=v/100,v=>Math.round(v)+"%");
  swH("fill",c=>o.fill=c);swH("stroke",c=>o.stroke=c);swH("cstroke",c=>o.stroke=c);
  const fc=$("pFill");if(fc)fc.oninput=()=>{o.fill=fc.value;render();renderProps();};
  if(o.type==="shape"){rangeH("pSW","pSWV",v=>o.strokeWidth=v);toggleH("pDash",()=>o.dash=!o.dash);}
  if(o.type==="text"){const ta=$("pText");if(ta)ta.oninput=()=>{o.text=ta.value;o.h=Math.max(o.fontSize*1.3,ta.value.split("\n").length*o.fontSize*1.25+8);render();};const ft=$("pFont");if(ft)ft.onchange=()=>{pushHistory();o.font=ft.value;render();};
    const setFS=v=>{o.fontSize=v;o.h=Math.max(v*1.3,String(o.text).split("\n").length*v*1.25+8);};
    const fs=$("pFS"),fsn=$("pFSNum");if(fs){let st=false;fs.oninput=()=>{if(!st){pushHistory();st=true;}const v=+fs.value;setFS(v);if(fsn)fsn.value=v;render();};fs.onchange=()=>{st=false;};}
    if(fsn)fsn.onchange=()=>{pushHistory();const v=clamp(Math.round(+fsn.value||12),4,400);setFS(v);if(fs)fs.value=Math.min(200,v);render();};
    document.querySelectorAll("[data-ts]").forEach(b=>b.onclick=()=>{pushHistory();const k=b.getAttribute("data-ts");if(k==="bold")o.weight=o.weight>=700?400:700;if(k==="italic")o.italic=!o.italic;if(k==="underline")o.underline=!o.underline;render();renderProps();});segH("align",v=>o.align=v);}
  if(o.type==="image"){segH("fit",v=>o.fit=v);rangeH("pRad","pRadV",v=>o.radius=v);}
  if(o.type==="icon"||o.type==="image"){rangeH("pBri","pBriV",v=>o.brightness=v);rangeH("pSat","pSatV",v=>o.saturate=v);rangeH("pHue","pHueV",v=>o.hue=v);rangeH("pTintAmt","pTintAmtV",v=>o.tintAmt=v);swH("itint",c=>{o.tint=c==="none"?null:c;if(c!=="none"&&!o.tintAmt)o.tintAmt=45;});const rb=$("pImgReset");if(rb)rb.onclick=()=>{pushHistory();o.brightness=100;o.saturate=100;o.hue=0;o.tint=null;o.tintAmt=0;render();renderProps();};}
  if(o.type!=="text"&&o.type!=="connector"){toggleH("pShadow",()=>{o.shadow=!o.shadow;renderProps();});rangeH("pShB","pShBV",v=>o.shadowBlur=v);}
  if(o.type==="connector"){rangeH("cSW","cSWV",v=>o.strokeWidth=v);rangeH("cHS","cHSV",v=>o.headSize=v);rangeH("cOp","cOpV",v=>o.opacity=v/100,v=>Math.round(v)+"%");segH("body",v=>o.body=v);segH("cstyle",v=>o.style=v);const hh=$("cHead");if(hh){hh.value=o.head||"triangle";hh.onchange=()=>{pushHistory();o.head=hh.value;render();};}const tt=$("cTail");if(tt){tt.value=o.tail||"none";tt.onchange=()=>{pushHistory();o.tail=tt.value;render();};}}
}

/* ============================ TEMPLATES (centered #12) ============================ */
function centerObjs(){const all=state.objs;if(!all.length)return;const bb=groupBBox(all);if(!bb)return;const dx=ART.w/2-(bb.x+bb.w/2),dy=ART.h/2-(bb.y+bb.h/2);for(const o of all){if(o.type==="connector"){if(o.fromPt){o.fromPt.x+=dx;o.fromPt.y+=dy;}if(o.toPt){o.toPt.x+=dx;o.toPt.y+=dy;}continue;}o.x+=dx;o.y+=dy;if(o._points)o._points=o._points.split(" ").map(pp=>{const xy=pp.split(",");return (+xy[0]+dx)+","+(+xy[1]+dy);}).join(" ");}}
function cloneObjs(objs){const map={},out=[];for(const o of objs){const c=JSON.parse(JSON.stringify(o));const nid=gid();map[o.id]=nid;c.id=nid;c._editing=false;out.push(c);}for(const c of out){if(c.type==="connector"){if(c.fromId&&map[c.fromId])c.fromId=map[c.fromId];if(c.toId&&map[c.toId])c.toId=map[c.toId];}}return out;}
function loadTemplate(kind){
  if(activeEditor)commitTextEditor();
  if(kind==="blank"){pushHistory();state.objs=[];state.sel=[];render();renderProps();toast("Cleared");return;}
  if(kind==="crypt"){
    // Always use the user's OWN saved crypt-villus design (matched loosely by name).
    const ps=loadProjects();
    const proj=ps.find(p=>/crypt/i.test(p.name)&&/vill/i.test(p.name))||ps.find(p=>/crypt/i.test(p.name))||ps.find(p=>/vill/i.test(p.name));
    if(proj&&proj.data&&proj.data.objs&&proj.data.objs.length){
      pushHistory();
      if(proj.data.art&&ARTBOARDS[proj.data.art]){state.art=proj.data.art;ART.w=ARTBOARDS[proj.data.art].w;ART.h=ARTBOARDS[proj.data.art].h;}
      state.objs=cloneObjs(proj.data.objs);
      state.bg=JSON.parse(JSON.stringify(proj.data.bg||{color:"#FFFFFF",image:null}));
      state.sel=[];fitView();renderProps();updateUndo();markDirty();toast("Loaded your “"+proj.name+"” project");
      return;
    }
    toast("No saved crypt-villus found. Build it, save the project with “Crypt-Villus” in the name, then pick this template.",true);
    return;
  }
}
/* Built-in Crypt–Villus axis: assembled from real, individually-editable cell objects. */
function buildCryptVillus(){
  pushHistory();state.objs=[];state.sel=[];
  const IC=(k,x,y,w,h,rot)=>{const o=mkIcon(k,x,y,w,h);if(rot)o.rot=rot;state.objs.push(o);return o;};
  const TX=(x,y,t,s,w,col,wt)=>{const o=mkText(x,y,t,s,col,w);if(wt)o.weight=wt;state.objs.push(o);return o;};
  const cx=800;
  TX(cx,90,"Crypt – Villus Axis",30,600,"#26251F",700);
  // up=+1 → ∩ villus dome ; up=-1 → ∪ crypt smile ; rotation ∝ horizontal offset (fan)
  const arch=(list,cxA,yBase,spacing,curv,tilt,up,w,h)=>{const N=list.length;for(let i=0;i<N;i++){const dx=(i-(N-1)/2)*spacing;IC(list[i],cxA+dx,yBase+up*curv*dx*dx,w,h,tilt*dx);}};
  arch(["enterocyte","goblet","enterocyte","enterocyte","tuft","enterocyte","enterocyte","goblet","enterocyte"],cx,214,40,0.0055,0.16,1,46,88);
  TX(cx,150,"Villus",20,260,"#6B675D",700);
  arch(["transitamp","transitamp","transitamp","transitamp","transitamp"],cx,474,48,0,0,1,46,82);
  arch(["iecstem","paneth","iecstem","paneth","iecstem","paneth","iecstem"],cx,604,46,0.0045,0.14,-1,48,88);
  TX(cx,706,"Crypt",20,260,"#6B675D",700);
  TX(cx,732,"alternating stem (teal) + Paneth (pink) cells",12,440,"#8C887D");
  centerObjs();fitView();renderProps();updateUndo();markDirty();toast("Crypt–Villus template");
}
function setArtboard(key){const ab=ARTBOARDS[key];if(!ab)return;ART.w=ab.w;ART.h=ab.h;state.art=key;fitView();markDirty();toast(ab.label);}

/* ============================ EXPORT (#6) ============================ */
function serializeSVG(){const svg=`<svg xmlns="${SVGNS}" width="${ART.w}" height="${ART.h}" viewBox="0 0 ${ART.w} ${ART.h}"><rect x="0" y="0" width="${ART.w}" height="${ART.h}" fill="${state.bg.color}"/>${state.bg.image?`<image x="0" y="0" width="${ART.w}" height="${ART.h}" href="${state.bg.image}" preserveAspectRatio="xMidYMid slice"/>`:""}${state.objs.map(o=>o.type==="connector"?connectorMarkup(o).replace(/class="[^"]*"/g,""):`<g transform="translate(${o.x},${o.y}) rotate(${o.rot||0})">${objMarkup(o)}</g>`).join("")}</svg>`;return svg;}
function svgToImage(scale){return new Promise((res,rej)=>{const str=serializeSVG(),img=new Image();img.onload=()=>res(img);img.onerror=rej;img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(str);});}
async function rasterize(scale,type,quality){const img=await svgToImage(scale);const c=document.createElement("canvas");c.width=ART.w*scale;c.height=ART.h*scale;const ctx=c.getContext("2d");if(type==="image/jpeg"){ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);}ctx.drawImage(img,0,0,c.width,c.height);return c.toDataURL(type||"image/png",quality||0.95);}
function dlAnchor(name,url){const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();}
async function saveOut(name,dataURL,filters){
  if(isElectron){const bin=atob(dataURL.split(",")[1]);const arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);const r=await window.camrender.saveFile({defaultName:name,data:Array.from(arr),filters});if(r.ok)toast("Saved: "+r.path);}
  else dlAnchor(name,dataURL);
}
async function doExport(fmt,scale){
  const base=(curProjectName()||"fable-figures").replace(/\s+/g,"_");
  try{
    if(fmt==="png"){const u=await rasterize(scale,"image/png");await saveOut(base+".png",u,[{name:"PNG",extensions:["png"]}]);toast("PNG exported");}
    else if(fmt==="svg"){const u="data:image/svg+xml;base64,"+btoa(unescape(encodeURIComponent(serializeSVG())));await saveOut(base+".svg",u,[{name:"SVG",extensions:["svg"]}]);toast("SVG exported");}
    else if(fmt==="pdf"){
      if(isElectron){const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0}html,body{width:${ART.w}px;height:${ART.h}px}</style></head><body>${serializeSVG()}</body></html>`;const micro=p=>Math.round(p/96*25400);const buf=await window.camrender.printPDF({html,widthMicrons:micro(ART.w),heightMicrons:micro(ART.h)});const r=await window.camrender.saveFile({defaultName:base+".pdf",data:Array.from(new Uint8Array(buf)),filters:[{name:"PDF",extensions:["pdf"]}]});if(r.ok)toast("PDF exported: "+r.path);}
      else{const jpg=await rasterize(scale,"image/jpeg",0.95);const pdf=jpegToPDF(jpg,ART.w*scale,ART.h*scale);dlAnchor(base+".pdf",pdf);toast("PDF exported");}
    }
  }catch(err){toast("Export failed: "+(err&&err.message||err),true);}
}
/* minimal single-image PDF (JPEG/DCTDecode) for non-Electron */
function jpegToPDF(jpegDataURL,wPx,hPx){
  const b64=jpegDataURL.split(",")[1],raw=atob(b64),len=raw.length;
  const W=Math.round(wPx*72/144),H=Math.round(hPx*72/144); // page in pt (assume 144 base dpi)
  let objs=[],xref=[],out="%PDF-1.4\n";
  function add(s){xref.push(out.length);out+=s;}
  add("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  add("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  add(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
  add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${wPx} /Height ${hPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${len} >>\nstream\n`);
  out+=raw+"\nendstream\nendobj\n";
  const content=`q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`;
  add(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);
  const xrefPos=out.length;out+=`xref\n0 6\n0000000000 65535 f \n`;
  for(let i=0;i<5;i++){out+=("0000000000"+xref[i]).slice(-10)+" 00000 n \n";}
  out+=`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  const bytes=new Uint8Array(out.length);for(let i=0;i<out.length;i++)bytes[i]=out.charCodeAt(i)&0xff;
  return URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));
}

/* ============================ HOME / PROJECTS (#21,22) ============================ */
function curProjectName(){return $("projName").value.trim()||T("untitled");}
function uniqueName(base){const names=loadProjects().filter(p=>p.id!==curProjectId).map(p=>p.name);if(!names.includes(base))return base;let i=1;while(names.includes(base+"_"+String(i).padStart(2,"0")))i++;return base+"_"+String(i).padStart(2,"0");}
function makeThumb(){return new Promise(res=>{let done=false;const t=setTimeout(()=>{if(!done){done=true;res(null);}},2500);rasterize(0.4,"image/jpeg",0.7).then(u=>{if(!done){done=true;clearTimeout(t);res(u);}}).catch(()=>{if(!done){done=true;clearTimeout(t);res(null);}});});}
async function saveProject(silent){
  if($("editor").classList.contains("hidden"))return;
  let name=curProjectName();if(name===T("untitled")||!name){name=uniqueName(T("untitled"));$("projName").value=name;}
  const thumb=await makeThumb();
  const projs=loadProjects();
  const data={objs:state.objs,bg:state.bg,art:state.art,uploads:state.uploads,seq:state.seq};
  let proj=projs.find(p=>p.id===curProjectId);
  if(!proj){proj={id:curProjectId||("p"+Date.now()),name,updated:Date.now(),thumb,data};curProjectId=proj.id;projs.unshift(proj);}
  else{proj.name=name;proj.updated=Date.now();proj.thumb=thumb;proj.data=data;}
  proj.uploads=state.uploads; // expose for cross-project panel
  saveProjects(projs);dirty=false;
  if(!silent)toast(T("saved"));$("autosaveInd").textContent=T("saved");setTimeout(()=>{if($("autosaveInd").textContent===T("saved"))$("autosaveInd").textContent="";},2000);
}
function loadProjectData(proj){state.objs=(proj.data&&proj.data.objs)||[];state.bg=(proj.data&&proj.data.bg)||{color:"#FFFFFF",image:null};state.uploads=(proj.data&&proj.data.uploads)||proj.uploads||[];state.art=(proj.data&&proj.data.art)||settings.artboard;const ab=ARTBOARDS[state.art]||ARTBOARDS.slide;ART.w=ab.w;ART.h=ab.h;state.seq=(proj.data&&proj.data.seq)||(maxId()+1);state.sel=[];history.undo.length=0;history.redo.length=0;dirty=false;}
function maxId(){return state.objs.reduce((m,o)=>Math.max(m,+String(o.id).replace(/\D/g,"")||0),0);}
function uniqueCopyName(base){const names=loadProjects().map(p=>p.name);if(!names.includes(base))return base;let i=2;while(names.includes(base+" "+i))i++;return base+" "+i;}
function duplicateProject(id){
  const projs=loadProjects();const src=projs.find(p=>p.id===id);if(!src)return;
  const copy=JSON.parse(JSON.stringify(src));               // deep copy; original is untouched
  copy.id="p"+Date.now();copy.name=uniqueCopyName((src.name||T("untitled"))+" copy");copy.updated=Date.now();
  projs.unshift(copy);saveProjects(projs);renderHome();toast(T("projCopied"));
}
/* Export all saved projects (templates) to a portable JSON file, and import/merge
   one on another machine. Import NEVER deletes existing projects — it only adds. */
function exportTemplates(){
  const projs=loadProjects();
  if(!projs.length){toast(T("noTemplatesExport"),true);return;}
  const payload=JSON.stringify({app:"fable-figures",kind:"templates",version:1,exported:Date.now(),projects:projs});
  const fname="fable-figures-templates.json";
  if(isElectron&&window.camrender&&window.camrender.saveFile){
    const bytes=Array.from(new TextEncoder().encode(payload));
    window.camrender.saveFile({defaultName:fname,data:bytes,filters:[{name:"JSON",extensions:["json"]}]}).then(r=>{if(r&&r.ok)toast(T("templatesExported")+" "+r.path);}).catch(()=>{});
  }else{
    const url=URL.createObjectURL(new Blob([payload],{type:"application/json"}));dlAnchor(fname,url);toast(T("templatesExported"));
  }
}
function importTemplatesFromFile(file){
  const fr=new FileReader();
  fr.onload=()=>{
    let parsed;try{parsed=JSON.parse(fr.result);}catch(e){toast(T("importBad"),true);return;}
    const incoming=Array.isArray(parsed)?parsed:((parsed&&parsed.projects)||[]);
    const projs=loadProjects();const names=new Set(projs.map(p=>p.name));let added=0;
    for(const p of incoming){
      if(!p||!p.data)continue;
      const c=JSON.parse(JSON.stringify(p));
      c.id="p"+Date.now().toString(36)+"_"+added;
      let base=c.name||T("untitled"),nm=base,i=2;while(names.has(nm)){nm=base+" "+i;i++;}c.name=nm;names.add(nm);
      c.updated=Date.now();projs.unshift(c);added++;
    }
    if(!added){toast(T("importBad"),true);return;}
    saveProjects(projs);renderHome();toast(added+" "+T("templatesImported"));
  };
  fr.readAsText(file);
}
function renderHome(){
  $("homeTag").textContent=T("tagline");$("newProjectLbl").textContent=T("newProject");$("recentLbl").textContent=T("recent");$("homeLang").textContent=settings.lang==="en"?"한국어":"English";
  const projs=loadProjects().sort((a,b)=>b.updated-a.updated);const g=$("projGrid");
  if(!projs.length){g.innerHTML=`<div class="empty-projects" style="grid-column:1/-1">${T("noProjects")}</div>`;return;}
  g.innerHTML=projs.map(p=>`<div class="proj-card" data-id="${p.id}"><div class="proj-dup" data-dup="${p.id}" title="${T("duplicate")}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 012-2h10" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="proj-del" data-del="${p.id}" title="${T("delete")}"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="proj-thumb" style="${p.thumb?`background-image:url(${p.thumb})`:""}"></div><div class="proj-meta"><div class="nm">${escapeHtml(p.name)}</div><div class="dt">${new Date(p.updated).toLocaleString()}</div></div></div>`).join("");
  g.querySelectorAll(".proj-card").forEach(c=>c.onclick=e=>{if(e.target.closest("[data-del]")||e.target.closest("[data-dup]"))return;openProject(c.getAttribute("data-id"));});
  g.querySelectorAll("[data-del]").forEach(d=>d.onclick=e=>{e.stopPropagation();if(confirm(T("confirmDelete"))){saveProjects(loadProjects().filter(p=>p.id!==d.getAttribute("data-del")));renderHome();}});
  g.querySelectorAll("[data-dup]").forEach(d=>d.onclick=e=>{e.stopPropagation();duplicateProject(d.getAttribute("data-dup"));});
}
function showHome(){$("editor").classList.add("hidden");$("home").classList.remove("hidden");renderHome();}
function openEditor(){$("home").classList.add("hidden");$("editor").classList.remove("hidden");buildTabs();buildLibrary();render();renderProps();updateUndo();fitView();}
function newProject(){curProjectId=null;state.objs=[];state.bg={color:"#FFFFFF",image:null};state.uploads=[];state.art=settings.artboard;const ab=ARTBOARDS[state.art]||ARTBOARDS.slide;ART.w=ab.w;ART.h=ab.h;state.seq=1;state.sel=[];history.undo.length=0;history.redo.length=0;dirty=false;$("projName").value=uniqueName(T("untitled"));openEditor();}
function openProject(id){const proj=loadProjects().find(p=>p.id===id);if(!proj)return;curProjectId=id;loadProjectData(proj);$("projName").value=proj.name;openEditor();}
function tryGoHome(){if(dirty){openModal("confirmModal");}else showHome();}
$("homeBtn").onclick=tryGoHome;$("newProjectBtn").onclick=newProject;
$("cfCancel").onclick=()=>closeModal("confirmModal");$("cfDiscard").onclick=()=>{dirty=false;closeModal("confirmModal");showHome();};$("cfSave").onclick=async()=>{await saveProject();closeModal("confirmModal");showHome();};
$("saveBtn").onclick=()=>promptSaveName();
$("projName").addEventListener("input",markDirty);
/* Save → name field first (#3) */
function promptSaveName(){$("nameTitle").textContent=T("saveProjTitle");$("nameLbl").textContent=T("projectName");$("nameOk").textContent=T("save");$("nameCancel").textContent=T("cancel");$("nameInput").value=($("projName").value.trim()||T("untitled"));openModal("nameModal");setTimeout(()=>{$("nameInput").focus();$("nameInput").select();},30);}
$("nameCancel").onclick=()=>closeModal("nameModal");
$("nameOk").onclick=async()=>{const v=$("nameInput").value.trim();if(v)$("projName").value=v;closeModal("nameModal");await saveProject();};
$("nameInput").addEventListener("keydown",e=>{e.stopPropagation();if(e.key==="Enter"){e.preventDefault();$("nameOk").click();}if(e.key==="Escape"){e.preventDefault();closeModal("nameModal");}});
/* category tab clicks (#2) */
$("libtabs").addEventListener("click",e=>{const b=e.target.closest(".libtab");if(!b)return;curLib=b.getAttribute("data-lib");buildTabs();$("libsearch").value="";buildLibrary();});

/* autosave every 5 min */
setInterval(()=>{if(settings.autosave&&dirty&&!$("editor").classList.contains("hidden")){saveProject(true);$("autosaveInd").textContent="Autosaved "+new Date().toLocaleTimeString();}},5*60*1000);

/* ============================ SETTINGS / i18n (#27) ============================ */
function applyI18n(){
  $("homeBtnLbl").textContent=T("home");
  const sb=$("saveBtn"),svg=sb.querySelector("svg").outerHTML;sb.innerHTML=svg+T("save");
  $("homeTag").textContent=T("tagline");
  updateAutosavePill();
  if(!$("editor").classList.contains("hidden")){buildTabs();renderProps();}
  renderHome();
}
$("homeGear").onclick=()=>openSettings();$("settingsBtn").onclick=()=>openSettings();
$("homeLang").onclick=()=>{settings.lang=settings.lang==="en"?"ko":"en";saveSettings();applyI18n();};
function openSettings(){$("setTitle").textContent=T("settings");$("setLangLbl").textContent=T("language");$("setAppearLbl").textContent=T("appearance");$("setThemeLbl").textContent=T("theme");$("setArtLbl").textContent=T("artboard");$("setDone").textContent=T("done");
  $("setFolderLbl").textContent=T("projectFolder");$("setFolderChange").textContent=T("change");$("setFolderDefault").textContent=T("appStorage");
  $("setTmplLbl").textContent=T("templates");$("setTmplHint").textContent=T("templatesHint");$("setTmplExport").textContent=T("export")+"…";$("setTmplImport").textContent=T("import")+"…";
  $("setFolderPath").textContent=settings.projectDir||T("appStorage");$("setFolderPath").title=settings.projectDir||"";
  $("setFolderChange").disabled=!(isElectron&&window.camrender&&window.camrender.pickFolder);
  document.querySelectorAll("#setAppear [data-appear]").forEach(b=>b.textContent=T(b.getAttribute("data-appear")));
  $("setArt").innerHTML=Object.keys(ARTBOARDS).map(k=>`<option value="${k}" ${settings.artboard===k?'selected':''}>${ARTBOARDS[k].label}</option>`).join("");
  document.querySelectorAll("#setLang [data-lang]").forEach(b=>b.classList.toggle("on",b.getAttribute("data-lang")===settings.lang));
  document.querySelectorAll("#setAppear [data-appear]").forEach(b=>b.classList.toggle("on",b.getAttribute("data-appear")===(settings.appearance||"light")));
  document.querySelectorAll("#setTheme [data-theme]").forEach(b=>b.classList.toggle("on",b.getAttribute("data-theme")===settings.theme));
  openModal("settingsModal");}
document.querySelectorAll("#setLang [data-lang]").forEach(b=>b.onclick=()=>{settings.lang=b.getAttribute("data-lang");saveSettings();openSettings();applyI18n();});
document.querySelectorAll("#setAppear [data-appear]").forEach(b=>b.onclick=()=>{settings.appearance=b.getAttribute("data-appear");saveSettings();applyAppearance();openSettings();});
document.querySelectorAll("#setTheme [data-theme]").forEach(b=>b.onclick=()=>{settings.theme=b.getAttribute("data-theme");saveSettings();applyTheme();openSettings();});
$("setArt").onchange=function(){settings.artboard=this.value;saveSettings();};
$("setFolderChange").onclick=async()=>{if(!(isElectron&&window.camrender&&window.camrender.pickFolder)){toast(T("desktopOnly"),true);return;}const dir=await window.camrender.pickFolder();if(!dir)return;const existing=loadProjects();settings.projectDir=dir;saveSettings();projectsCache=existing.slice();saveProjects(existing);/* migrate current projects into the folder */await refreshProjectsCache();openSettings();renderHome();toast(T("folderSet"));};
$("setFolderDefault").onclick=()=>{const existing=loadProjects();settings.projectDir="";saveSettings();projectsCache=null;saveProjects(existing);/* migrate back to app storage */openSettings();renderHome();};
$("setTmplExport").onclick=()=>exportTemplates();
$("setTmplImport").onclick=()=>$("tmplFile").click();
$("tmplFile").addEventListener("change",e=>{const f=e.target.files&&e.target.files[0];if(f)importTemplatesFromFile(f);e.target.value="";});
$("setDone").onclick=()=>closeModal("settingsModal");
function applyTheme(){const dark=settings.appearance==="dark";const m={ivory:dark?"#1E1D19":"#F1EFE8",white:dark?"#26241F":"#FFFFFF",slate:dark?"#222A30":"#E7E9EC"};document.querySelector(".canvaswrap").style.backgroundColor=m[settings.theme]||(dark?"#1E1D19":"#F1EFE8");}
function applyAppearance(){document.body.classList.toggle("dark",settings.appearance==="dark");applyTheme();}
/* autosave control in the status bar (MS-Word style) */
function updateAutosavePill(){const p=$("autosaveToggle");if(!p)return;p.classList.toggle("on",!!settings.autosave);$("autosaveLbl").textContent=settings.autosave?T("autosaveOn"):T("autosaveOff");}
$("autosaveToggle").onclick=()=>{settings.autosave=!settings.autosave;saveSettings();updateAutosavePill();if(settings.autosave&&dirty&&!$("editor").classList.contains("hidden"))saveProject(true);};

/* ============================ MODALS / MENUS ============================ */
function openModal(id){$(id).classList.add("open");}
function closeModal(id){$(id).classList.remove("open");}
document.querySelectorAll(".modal-back").forEach(mb=>mb.addEventListener("pointerdown",e=>{if(e.target===mb)mb.classList.remove("open");}));
function setupMenu(btn,menu){btn.addEventListener("click",e=>{e.stopPropagation();const open=menu.classList.contains("open");document.querySelectorAll(".menu").forEach(m=>m.classList.remove("open"));if(!open)menu.classList.add("open");});}
document.addEventListener("click",()=>document.querySelectorAll(".menu").forEach(m=>m.classList.remove("open")));
setupMenu($("tmplBtn"),$("tmplMenu"));
$("tmplMenu").addEventListener("click",e=>{const b=e.target.closest("[data-tmpl]");if(!b)return;const v=b.getAttribute("data-tmpl");if(v.indexOf("art:")===0)setArtboard(v.slice(4));else loadTemplate(v);});
// add artboard options to template menu
$("tmplMenu").insertAdjacentHTML("beforeend",`<div class="mh">Artboard</div>`+Object.keys(ARTBOARDS).map(k=>`<button data-tmpl="art:${k}">${ARTBOARDS[k].label}</button>`).join(""));
$("exportBtn").onclick=()=>openExport();
function openExport(){$("expTitle").textContent=T("exportTitle");$("expFmtLbl").textContent=T("format");$("expResLbl").textContent=T("resolution");$("expGo").textContent=T("exportNow");$("expCancel").textContent=T("cancel");updateExpDim();openModal("exportModal");}
let expFmt="png",expScale=2;
document.querySelectorAll("#expFmt [data-fmt]").forEach(b=>b.onclick=()=>{expFmt=b.getAttribute("data-fmt");document.querySelectorAll("#expFmt [data-fmt]").forEach(x=>x.classList.toggle("on",x===b));$("expResField").style.display=expFmt==="svg"?"none":"block";updateExpDim();});
document.querySelectorAll("#expRes [data-scale]").forEach(b=>b.onclick=()=>{expScale=+b.getAttribute("data-scale");document.querySelectorAll("#expRes [data-scale]").forEach(x=>x.classList.toggle("on",x===b));updateExpDim();});
function updateExpDim(){$("expDim").textContent=expFmt==="svg"?`${ART.w} × ${ART.h} (vector)`:`${Math.round(ART.w*expScale)} × ${Math.round(ART.h*expScale)} px`;}
$("expCancel").onclick=()=>closeModal("exportModal");
$("expGo").onclick=()=>{closeModal("exportModal");doExport(expFmt,expScale);};

/* ============================ KEYBOARD + ELECTRON MENU (#2) ============================ */
const lastAct={};
let nudge={key:null,t:0,n:0,pre:null};
function guard(name){const t=Date.now();if(lastAct[name]&&t-lastAct[name]<80)return false;lastAct[name]=t;return true;}
function act(name){
  if(name==="save"){if(guard(name)){curProjectId?saveProject():promptSaveName();}return;}
  if(name==="copy"){if(guard(name))doCopy();return;}
  if(name==="cut"){if(guard(name))doCut();return;}
  if(name==="paste"){if(guard(name))doPaste();return;}
  if(name==="duplicate"){if(guard(name))duplicateSel();return;}
  if(name==="delete"){if(guard(name))deleteSel();return;}
  if(name==="undo"){if(guard(name))undo();return;}
  if(name==="redo"){if(guard(name))redo();return;}
  if(name==="selectall"){if(guard(name)){state.sel=state.objs.map(o=>o.id);render();renderProps();}return;}
  if(name==="export"){if(guard(name))openExport();return;}
  if(name==="home"){if(guard(name))tryGoHome();return;}
  if(name==="new"){if(guard(name))newProject();return;}
  if(name==="zoomin"){setZoom(state.view.zoom*1.2);return;}
  if(name==="zoomout"){setZoom(state.view.zoom/1.2);return;}
  if(name==="fit"){fitView();return;}
}
if(isElectron&&window.camrender.onMenu)window.camrender.onMenu(act);
window.addEventListener("keydown",e=>{
  if(activeEditor)return;
  if($("editor").classList.contains("hidden"))return;
  if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))return;
  const meta=e.metaKey||e.ctrlKey;
  if(meta){const k=e.key.toLowerCase();
    if(k==="c"){e.preventDefault();act("copy");return;}
    if(k==="x"){e.preventDefault();act("cut");return;}
    if(k==="v"){e.preventDefault();act("paste");return;}
    if(k==="s"){e.preventDefault();act("save");return;}
    if(k==="d"){e.preventDefault();act("duplicate");return;}
    if(k==="a"){e.preventDefault();act("selectall");return;}
    if(k==="z"){e.preventDefault();e.shiftKey?act("redo"):act("undo");return;}
    if(k==="y"){e.preventDefault();act("redo");return;}
    if(k==="e"){e.preventDefault();act("export");return;}
    if(e.key==="]"){e.preventDefault();zorder("fwd");return;}
    if(e.key==="["){e.preventDefault();zorder("bwd");return;}
    if(e.key==="="||e.key==="+"){e.preventDefault();setZoom(state.view.zoom*1.2);return;}
    if(e.key==="-"){e.preventDefault();setZoom(state.view.zoom/1.2);return;}
    if(e.key==="0"){e.preventDefault();fitView();return;}
    return;
  }
  if(e.key==="Enter"&&state.sel.length===1&&selObjs()[0].type==="text"){e.preventDefault();startEditText(selObjs()[0]);return;}  // selected text box + Enter → edit (text selected)
  if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();deleteSel();return;}
  if(e.key==="Escape"){state.sel=[];pendingArrowFrom=null;stage.style.cursor="";render();renderProps();closeCtx();return;}
  if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)&&state.sel.length){e.preventDefault();
    const now=Date.now();
    if(nudge.key===e.key&&now-nudge.t<260)nudge.n++;else{nudge.n=0;nudge.pre=snapshot();}   // new burst → snapshot for one undo
    nudge.key=e.key;nudge.t=now;
    if(nudge.n===0)commitPre(nudge.pre);                                                       // push history once per burst
    const base=e.shiftKey?10:1,accel=Math.min(1+Math.floor(nudge.n/2),12),d=base*accel;        // gradual acceleration while held
    const dx=e.key==="ArrowLeft"?-d:e.key==="ArrowRight"?d:0,dy=e.key==="ArrowUp"?-d:e.key==="ArrowDown"?d:0;
    for(const o of selObjs()){if(o.type==="connector"){if(o.fromPt){o.fromPt.x+=dx;o.fromPt.y+=dy;}if(o.toPt){o.toPt.x+=dx;o.toPt.y+=dy;}continue;}o.x+=dx;o.y+=dy;}
    markDirty();render();renderPropsLight();}
});

/* ============================ INIT ============================ */
function init(){if(/Mac/i.test(navigator.userAgent)&&/Electron/i.test(navigator.userAgent))document.body.classList.add("mac-electron");applyAppearance();updateAutosavePill();applyI18n();if(fileMode())refreshProjectsCache().then(renderHome);else renderHome();window.addEventListener("resize",()=>{if(!$("editor").classList.contains("hidden"))render();});}
init();
