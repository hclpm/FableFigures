/* ===========================================================================
   Fable Figures — assets, presets, fonts, i18n.  Crafted by Lee.
   Icons authored in a 0..100 box; gradient ids carry __ID__ (substituted at
   render with the object id so every instance gets unique gradients).
   =========================================================================== */
(function(global){
"use strict";

/* ---------- matte illustration helpers (no glossy highlight) ---------- */
function grad(id,a,b){return `<defs><radialGradient id="${id}" cx="44%" cy="42%" r="74%"><stop offset="0" stop-color="${a}"/><stop offset="100%" stop-color="${b}"/></radialGradient></defs>`;}
function lgrad(id,a,b,vert){return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${vert?0:1}" y2="${vert?1:0}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;}
function cell(id,mid,edge,rim,o){o=o||{};var rx=o.rx||33,ry=o.ry||30,cx=o.cx||50,cy=o.cy||51;return grad("b"+id,mid,edge)+`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#b${id})" stroke="${rim}" stroke-width="2"/>`;}
function nuc(id,a,b,cx,cy,rx,ry){return grad("n"+id,a,b)+`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#n${id})"/>`;}
function dots(list,fill,r){return list.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${fill}"/>`).join("");}
function grid(x0,y0,cw,ch,cols,rows,fn){var h="";for(var r=0;r<rows;r++)for(var c=0;c<cols;c++)h+=`<rect x="${x0+c*cw}" y="${y0+r*ch}" width="${cw}" height="${ch}" fill="${fn(r,c)}"/>`;return h;}
/* rounded, slightly hand-drawn trapezoid (wTop/wBot at y0..y1), used for epithelial cells */
function trap(x,y0,y1,wTop,wBot,fill,stroke,sw,round){
  round=round==null?9:round;var l1=50-wTop/2,r1=50+wTop/2,l2=50-wBot/2,r2=50+wBot/2;
  return `<path d="M${l1+round} ${y0} Q${l1} ${y0} ${l1-1} ${y0+round} L${l2-1} ${y1-round} Q${l2} ${y1} ${l2+round} ${y1} L${r2-round} ${y1} Q${r2} ${y1} ${r2+1} ${y1-round} L${r1+1} ${y0+round} Q${r1} ${y0} ${r1-round} ${y0} Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
}

var ICONS = {
  /* ===== Stem & progenitors ===== */
  pluripotent:cell("__ID__","#D9B583","#9A7038","#6E4B26",{rx:33,ry:30})+nuc("__ID__","#7A5230","#46280F",56,55,15,13),
  bloodstem:cell("__ID__","#D9B583","#9A7038","#6E4B26",{rx:30,ry:27})+nuc("__ID__","#7A5230","#46280F",55,54,13,12),
  lymphoidprog:cell("__ID__","#CBD24E","#909C30","#6E7A22")+nuc("__ID__","#8A8A2E","#565618",56,55,14,12),
  myeloidprog:cell("__ID__","#56C7BC","#2A9D94","#1C7068")+nuc("__ID__","#1C7E78","#0E4F4A",56,55,14,12),
  tprecursor:cell("__ID__","#EE7BA6","#CE4480","#9C2C5A")+nuc("__ID__","#B83068","#7C1A44",55,54,14,12),
  bprecursor:cell("__ID__","#6FA6E0","#3E78C0","#244F86")+nuc("__ID__","#2E63A8","#163E72",55,54,14,12),
  /* ===== Lymphocytes ===== */
  nkcell:cell("__ID__","#EA86AE","#C44C82","#9E2C60",{rx:31,ry:29})+nuc("__ID__","#C03A72","#7C1E48",52,52,17,15)+dots([[44,46],[60,58],[52,64],[62,46]],"#7C1E48",2.4),
  tcell:cell("__ID__","#EE7E9E","#C8487E","#A0305E",{rx:30,ry:28})+nuc("__ID__","#B83068","#7C1A44",52,52,16,15)+`<g stroke="#A0305E" stroke-width="1.8"><path d="M21 50l-7-3m7 3l-7 3"/><path d="M50 21l-3-7m3 7l3-7"/><path d="M79 50l7-3m-7 3l7 3"/></g>`,
  bcell:cell("__ID__","#7FB0E4","#3A70B2","#27548A",{rx:30,ry:28})+nuc("__ID__","#2E63A8","#163E72",52,52,16,15)+`<g stroke="#27548A" stroke-width="1.8"><path d="M21 50l-7-3m7 3l-7 3"/><path d="M50 21l-3-7m3 7l3-7"/><path d="M79 50l7-3m-7 3l7 3"/></g>`,
  plasma:cell("__ID__","#B074CE","#8A50A6","#6C3A84",{rx:33,ry:28})+nuc("__ID__","#5E2E80","#3A1A52",38,53,15,14),
  memory:cell("__ID__","#EC6A58","#C8443A","#9E2C26",{rx:31,ry:29})+nuc("__ID__","#B0302A","#761818",55,54,14,13),
  /* ===== Myeloid & blood ===== */
  neutrophil:cell("__ID__","#EBD6E8","#C7A4C8","#A484AA")+`<g fill="none" stroke="#9A57AB" stroke-width="9" stroke-linecap="round"><path d="M40 42q-8 8 0 16"/><path d="M52 38q10 6 4 18"/><path d="M44 62q8 6 16 0"/></g>`+dots([[36,40],[62,44],[40,58],[58,60],[50,48]],"#C98FD0",1.6),
  eosinophil:cell("__ID__","#F0A2BE","#D05E86","#A8446A")+`<g fill="none" stroke="#C44A86" stroke-width="10" stroke-linecap="round"><path d="M38 44q-6 8 2 16"/><path d="M58 40q8 8 0 18"/></g>`+dots([[34,40],[46,38],[60,42],[36,56],[50,60],[64,56],[44,50],[58,52]],"#E8642C",2.6),
  basophil:cell("__ID__","#CBA8D2","#A87CB4","#84588E")+dots([[34,40],[46,34],[60,40],[68,52],[60,64],[46,68],[34,62],[28,50],[48,50],[56,52]],"#3A2E72",4.6),
  monocyte:cell("__ID__","#A8C4DE","#7C9CC0","#5A7CA0",{rx:34,ry:31})+`<path d="M40 36a18 18 0 1 0 14 32a14 14 0 1 1 -14 -32z" fill="#5E7CA6"/>`,
  macrophage:grad("b__ID__","#9CBAD6","#6E92B6")+`<path d="M30 40q-12-8-6-14q8-2 10 6q6-10 16-6q2 8-4 12q12-6 18 2q0 8-10 8q12 4 8 14q-8 4-14-4q0 12-12 10q-6-6 0-14q-12 4-16-4q2-8 12-6q-8-6-0-12z" fill="url(#b__ID__)" stroke="#5A7CA0" stroke-width="2"/>`+nuc("__ID__","#5E7CA6","#3A567E",50,52,13,11),
  dendritic:grad("b__ID__","#E6C28A","#B88A4A")+`<g stroke="#A8763A" stroke-width="3" fill="none" stroke-linecap="round"><path d="M50 50L20 24M50 50L18 46M50 50L26 76M50 50L52 18M50 50L78 26M50 50L84 52M50 50L74 78M50 50L46 84"/></g><circle cx="50" cy="50" r="17" fill="url(#b__ID__)" stroke="#8A6432" stroke-width="2"/>`,
  mast:cell("__ID__","#F0B6C2","#D07E92","#A85468",{rx:32,ry:30})+dots([[36,38],[48,34],[60,40],[66,52],[58,64],[44,66],[34,58],[50,50],[42,44],[56,52]],"#7A2A52",4.4),
  erythrocyte:grad("r__ID__","#CF4636","#A82C20")+`<ellipse cx="50" cy="50" rx="34" ry="30" fill="url(#r__ID__)" stroke="#8A241A" stroke-width="2"/><ellipse cx="50" cy="50" rx="15" ry="13" fill="#9E2A1E"/>`,
  megakaryocyte:cell("__ID__","#E893A8","#C46482","#9E4865",{rx:36,ry:33})+`<path d="M38 34q-10 10 0 20q-8 12 6 18q-4 12 12 10q6-10-2-18q12 4 16-8q-10-8-18-2q8-12-6-18q-8 2-10 8z" fill="#9E3A60"/>`,
  platelets:`<g>`+["#C46482","#A84C92","#B0588A","#9E5C9C"].map(function(c,i){var x=28+(i%2)*30+i*4,y=34+Math.floor(i/2)*28;return `<path d="M${x} ${y}q8-6 14 2q4 8-4 12q-10 4-14-4q-2-8 4-10z" fill="${c}" stroke="#7C2848" stroke-width="1.4"/>`;}).join("")+`</g>`,
  /* ===== Stromal / immune (new) ===== */
  stromal:grad("b__ID__","#BFD9C9","#7FB59A")+`<path d="M50 50C32 40 16 40 8 36c10 4 22 2 42 14 4-16 0-30 2-34 2 12 0 22-2 20 14-10 26-12 34-14-10 6-20 8-34 18 16 4 26 12 34 16-12-4-22-10-42-4z" fill="url(#b__ID__)" stroke="#4E8A78" stroke-width="1.6"/><ellipse cx="50" cy="50" rx="9" ry="7" fill="#3E7264"/>`,
  immune:cell("__ID__","#9FD6E6","#4FA8C2","#2E7E96",{rx:31,ry:30})+nuc("__ID__","#2E7E96","#175466",50,51,16,15)+`<g stroke="#2E7E96" stroke-width="2"><path d="M50 20v-7M73 33l5-5M80 56h7M70 74l5 5M30 74l-5 5M20 56h-7M27 33l-5-5"/></g>`,
  /* ===== Gut epithelium (trapezoidal, rounded, BioRender-like) ===== */
  enterocyte:trap(0,8,96,84,74,"#F2C896","#C98A52",2,10)+`<g stroke="#C98A52" stroke-width="2" stroke-linecap="round">`+[18,28,38,50,62,72,82].map(function(x){return `<path d="M${x} 8V1"/>`;}).join("")+`</g>`+dots([[24,16],[40,16],[56,16],[72,16],[33,24],[50,24],[67,24]],"#E08A4C",2.2)+nuc("__ID__","#E59B5A","#B26A28",50,66,14,15),
  goblet:trap(0,12,96,80,68,"#A9D08A","#6FA94E",2,12)+`<ellipse cx="50" cy="44" rx="22" ry="26" fill="#EAF6DF"/>`+dots([[42,34],[50,30],[58,36],[44,46],[54,48],[50,40],[46,56],[56,56]],"#CDE8B6",4)+nuc("__ID__","#5E9A3E","#3E6E28",50,84,13,9),
  tuft:`<g stroke="#5E8AB8" stroke-width="2" stroke-linecap="round">`+[34,40,46,54,60,66].map(function(x){return `<path d="M${x} 12 ${x+(x<50?-3:3)} 1"/>`;}).join("")+`</g>`+trap(0,14,94,50,46,"#9CC0E2","#5E8AB8",2,14)+nuc("__ID__","#3E6E9E","#244E72",50,60,14,16),
  endocrine:trap(0,14,80,54,44,"#C9A6DE","#8A5AA8",2,12)+`<path d="M44 78q-3 12-12 18" fill="none" stroke="#8A5AA8" stroke-width="4" stroke-linecap="round"/>`+dots([[44,68],[54,70],[48,74],[58,64]],"#E6C24C",3.4)+nuc("__ID__","#7A4A98","#4E2C66",50,44,12,12),
  iecstem:trap(0,14,94,54,40,"#9FD8CE","#4FA89A",2,14)+nuc("__ID__","#4FBEB2","#2E7068",50,56,15,18),
  paneth:trap(0,12,94,54,40,"#F2B6C2","#C87A8A",2,14)+dots([[42,30],[54,26],[46,38],[58,32],[50,42],[61,40],[37,42]],"#D8506A",5)+nuc("__ID__","#C45878","#8A3450",50,74,11,11),
  mcell:trap(0,14,92,54,50,"#9CC0E2","#5E8AB8",2,12)+`<g stroke="#3E6E9E" stroke-width="2" stroke-linecap="round"><path d="M40 14v-5M48 14v-6M56 14v-5"/></g><path d="M40 60q10 16 20 0" fill="#7FA8D0"/>`+nuc("__ID__","#3E6E9E","#244E72",62,46,9,9),
  transitamp:trap(0,12,94,60,54,"#D6BBE8","#8A6CA8",2,12)+`<ellipse cx="38" cy="52" rx="11" ry="13" fill="#8A4EB0"/><ellipse cx="62" cy="52" rx="11" ry="13" fill="#8A4EB0"/><g stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".85"><path d="M40 52h-7M60 52h7"/></g>`,
  /* ===== Tissue ===== */
  muscle:lgrad("m__ID__","#D9605A","#B23A32",true)+`<path d="M10 50q40-26 80 0q-40 26-80 0z" fill="url(#m__ID__)" stroke="#9E2C24" stroke-width="2"/><g stroke="#9E2C24" stroke-width="1.3" opacity=".55"><path d="M26 42v16M36 38v24M48 36v28M60 38v24M72 42v16"/></g><circle cx="40" cy="46" r="2.6" fill="#3A1E48"/><circle cx="58" cy="54" r="2.6" fill="#3A1E48"/>`,
  nerve:grad("b__ID__","#EC92A6","#C45E78")+`<g stroke="#D07088" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M50 50L22 26M50 50L30 60M50 50L24 70M50 50L70 24M50 50l34 18"/></g><path d="M84 68q8 2 10 10" stroke="#D07088" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="50" cy="50" r="16" fill="url(#b__ID__)" stroke="#A8425E" stroke-width="2"/><circle cx="50" cy="50" r="6" fill="#9A3858"/>`,
  cardiac:lgrad("c__ID__","#D26056","#B0463C")+`<path d="M14 42q14-6 26 0q14-8 30-2q16 6 16 18q-14 6-28 0q-12 8-28 2q-16-6-16-18z" fill="url(#c__ID__)" stroke="#9E2C24" stroke-width="2"/><g stroke="#8A241C" stroke-width="2" opacity=".7"><path d="M40 36v28M56 40v26"/></g>`,
  liver:`<g>`+[[34,42],[58,40],[44,62],[66,60]].map(function(p){return `<path d="M${p[0]} ${p[1]-13}l12 6v13l-12 6l-12-6v-13z" fill="#9E6CB6" stroke="#5E3676" stroke-width="1.8"/><circle cx="${p[0]}" cy="${p[1]}" r="4.5" fill="#4E2C64"/>`;}).join("")+`</g>`,
  fibroblast:grad("b__ID__","#9FD0C2","#5E9E8A")+`<path d="M50 50C30 38 14 40 10 36c10 2 24-2 40 14 6-18 2-30 4-34 2 12 0 24-4 20 14-10 28-10 32-12-10 6-22 8-32 22 16 2 28 12 32 14-12-4-24-10-32-6z" fill="url(#b__ID__)" stroke="#4E8A78" stroke-width="1.6"/><ellipse cx="50" cy="50" rx="9" ry="7" fill="#3E7264"/>`,
  adipocyte:grad("b__ID__","#F4E2A8","#E0BE56")+`<circle cx="50" cy="50" r="34" fill="url(#b__ID__)" stroke="#B8902E" stroke-width="2"/><circle cx="50" cy="50" r="25" fill="#F0D67E" opacity=".6"/><ellipse cx="74" cy="60" rx="8" ry="10" fill="#C8A23E"/>`,
  /* ===== Molecular ===== */
  cell:cell("__ID__","#5BC9BE","#2E9C92","#1F756D",{rx:34,ry:32})+nuc("__ID__","#1C7E78","#0E4F4A",57,56,15,13),
  nucleus:grad("b__ID__","#9E6CB6","#6C3E88")+`<circle cx="50" cy="50" r="32" fill="url(#b__ID__)" stroke="#5E3676" stroke-width="2"/><g stroke="#4A2A66" stroke-width="2" fill="none" opacity=".55"><path d="M34 44q8 8 18 2M40 64q10-6 22 0M56 36q6 10-2 18"/></g>`,
  mitochondria:grad("b__ID__","#E89A8A","#C0584A")+`<ellipse cx="50" cy="50" rx="38" ry="22" fill="url(#b__ID__)" stroke="#9E3A2C" stroke-width="2"/><path d="M22 50q6-12 12 0t12 0t12 0t12 0" fill="none" stroke="#9E3A2C" stroke-width="2.4"/>`,
  er:`<path d="M16 24q20-8 40 0t28 0" fill="none" stroke="#C88AC0" stroke-width="5" stroke-linecap="round"/><path d="M16 40q20-8 40 0t28 0" fill="none" stroke="#C88AC0" stroke-width="5" stroke-linecap="round"/><path d="M16 56q20-8 40 0t28 0" fill="none" stroke="#C88AC0" stroke-width="5" stroke-linecap="round"/><path d="M16 72q20-8 40 0t28 0" fill="none" stroke="#C88AC0" stroke-width="5" stroke-linecap="round"/>`,
  golgi:`<g fill="none" stroke="#E0A24C" stroke-width="5" stroke-linecap="round"><path d="M24 32q26-14 52 0"/><path d="M22 46q28-14 56 0"/><path d="M24 60q26-12 52 0"/><path d="M30 72q20-10 40 0"/></g>`,
  vesicle:grad("b__ID__","#BFE0DA","#7FB8AE")+`<circle cx="50" cy="50" r="30" fill="url(#b__ID__)" stroke="#5E9088" stroke-width="2"/>`,
  dna:lgrad("d__ID__","#5BA8E0","#2E6FB0",true)+`<path d="M34 12c0 18 32 22 32 38s-32 20-32 38" fill="none" stroke="url(#d__ID__)" stroke-width="5" stroke-linecap="round"/><path d="M66 12c0 18-32 22-32 38s32 20 32 38" fill="none" stroke="url(#d__ID__)" stroke-width="5" stroke-linecap="round"/><g stroke-width="3.4" stroke-linecap="round"><path d="M40 24h20" stroke="#E0604A"/><path d="M36 36h28" stroke="#E6A23C"/><path d="M34 50h32" stroke="#E0604A"/><path d="M36 64h28" stroke="#E6A23C"/><path d="M40 76h20" stroke="#E0604A"/></g>`,
  rna:lgrad("d__ID__","#F0A24C","#D2762A",true)+`<path d="M40 12c0 16 30 20 30 38s-30 18-30 38" fill="none" stroke="url(#d__ID__)" stroke-width="5" stroke-linecap="round"/><g stroke-width="3.4" stroke-linecap="round"><path d="M44 24h18" stroke="#4FBEB2"/><path d="M42 40h22" stroke="#5BA8E0"/><path d="M46 66h18" stroke="#4FBEB2"/><path d="M42 80h22" stroke="#5BA8E0"/></g>`,
  protein:grad("p__ID__","#7CB6CE","#7A5CA8")+`<path d="M28 56c-6-10 2-24 14-22 4-12 22-12 26 0 12 0 16 16 6 24 4 10-8 22-20 16-8 8-24 2-22-10-6-2-9-5-4-8z" fill="url(#p__ID__)" stroke="#5E4A86" stroke-width="2"/>`,
  antibody:`<g stroke="#3A70B2" stroke-width="6" stroke-linecap="round" fill="none"><path d="M50 54V84"/><path d="M50 54L30 28"/><path d="M50 54l20-26"/></g><circle cx="30" cy="24" r="6" fill="#E6A23C"/><circle cx="72" cy="24" r="6" fill="#E6A23C"/><rect x="44" y="78" width="12" height="9" rx="2.5" fill="#2E6FB0"/>`,
  virus:`<circle cx="50" cy="50" r="24" fill="#C44A6A" stroke="#9E2C50" stroke-width="2"/><g stroke="#9E2C50" stroke-width="3" stroke-linecap="round">`+Array.from({length:12}).map(function(_,i){var a=i*Math.PI/6;return `<path d="M${50+Math.cos(a)*24} ${50+Math.sin(a)*24}L${50+Math.cos(a)*34} ${50+Math.sin(a)*34}"/>`;}).join("")+`</g><g fill="#E08AA0">`+Array.from({length:12}).map(function(_,i){var a=i*Math.PI/6;return `<circle cx="${50+Math.cos(a)*34}" cy="${50+Math.sin(a)*34}" r="3.4"/>`;}).join("")+`</g>`,
  bacterium:lgrad("b__ID__","#7BC88A","#3E8A52")+`<rect x="20" y="38" width="60" height="24" rx="12" fill="url(#b__ID__)" stroke="#2E6E3E" stroke-width="2"/><g stroke="#2E6E3E" stroke-width="2" fill="none" stroke-linecap="round"><path d="M80 44q10-6 14 2M80 56q10 6 14-2"/></g>`,
  /* ===== Data & plots ===== */
  umap:`<g stroke="#9AA0A6" stroke-width="2" stroke-linecap="round"><path d="M14 86V14M14 86h74"/></g><ellipse cx="34" cy="40" rx="16" ry="14" fill="#4FBEB2" opacity=".16"/><ellipse cx="68" cy="38" rx="13" ry="12" fill="#E0844C" opacity=".16"/><ellipse cx="56" cy="68" rx="15" ry="13" fill="#9A6CC0" opacity=".16"/>`+dots([[28,38],[36,34],[32,44],[40,38],[34,46],[42,42]],"#2E9C92",2.6)+dots([[62,34],[70,38],[66,44],[72,32]],"#C46428",2.6)+dots([[50,66],[58,70],[54,74],[62,64],[50,74]],"#724A98",2.6),
  volcano:`<g stroke="#9AA0A6" stroke-width="2" stroke-linecap="round"><path d="M50 88V14M14 84h74"/></g><g stroke="#C4C0B6" stroke-width="1.4" stroke-dasharray="3 3"><path d="M32 84V18M68 84V18M14 42h74"/></g>`+dots([[44,60],[54,58],[48,68],[58,66],[50,74]],"#A8AAA0",2.6)+dots([[24,34],[28,26],[20,40]],"#3C78C8",3)+dots([[74,30],[80,38],[76,24]],"#D0402E",3),
  heatmap:`<g stroke="#fff" stroke-width="1.2">`+grid(20,20,11,11,6,5,function(r,c){return ["#D0402E","#E2784A","#F0E0C2","#6CA8D8","#3C5C9C"][(r*6+c*2+r)%5];})+`</g>`,
  barplot:`<g stroke="#9AA0A6" stroke-width="2" stroke-linecap="round"><path d="M16 84V14M16 84h72"/></g><rect x="26" y="52" width="12" height="28" fill="#4FBEB2"/><rect x="44" y="38" width="12" height="42" fill="#E0844C"/><rect x="62" y="58" width="12" height="22" fill="#9A6CC0"/>`,
  boxplot:`<g stroke="#9AA0A6" stroke-width="2" stroke-linecap="round"><path d="M16 84V14M16 84h72"/></g>`+[[30,"#4FBEB2"],[50,"#E0844C"],[70,"#9A6CC0"]].map(function(b){var x=b[0];return `<g stroke="#5A5650" stroke-width="1.6"><path d="M${x} 24v12M${x} 64v8M${x-7} 24h14M${x-7} 72h14"/></g><rect x="${x-9}" y="36" width="18" height="28" fill="${b[1]}" stroke="#5A5650" stroke-width="1.6"/><path d="M${x-9} 50h18" stroke="#3A3632" stroke-width="2"/>`;}).join(""),
  violin:`<g stroke="#9AA0A6" stroke-width="2" stroke-linecap="round"><path d="M16 84V14M16 84h72"/></g>`+[[30,"#4FBEB2"],[50,"#E0844C"],[70,"#9A6CC0"]].map(function(v){var x=v[0];return `<path d="M${x} 22q-13 8-9 24t9 26q5-10 9-26t-9-24z" fill="${v[1]}" opacity=".85" stroke="#5A5650" stroke-width="1.4"/>`;}).join(""),
  scatter:`<g stroke="#9AA0A6" stroke-width="2" stroke-linecap="round"><path d="M16 84V14M16 84h72"/></g><path d="M22 76L82 28" stroke="#D97757" stroke-width="2" stroke-dasharray="4 3"/>`+dots([[26,72],[34,66],[40,62],[46,54],[52,50],[58,44],[64,40],[70,34]],"#3C6E9E",2.6),
  lineplot:`<g stroke="#9AA0A6" stroke-width="2" stroke-linecap="round"><path d="M16 84V14M16 84h72"/></g><polyline points="20,68 34,56 48,60 62,40 78,32" fill="none" stroke="#4FBEB2" stroke-width="2.4"/><polyline points="20,76 34,70 48,66 62,58 78,50" fill="none" stroke="#D97757" stroke-width="2.4"/>`,
  piechart:`<g transform="rotate(-90 50 50)" fill="none" stroke-width="22"><circle cx="50" cy="50" r="27" stroke="#4FBEB2" stroke-dasharray="68 102"/><circle cx="50" cy="50" r="27" stroke="#E0844C" stroke-dasharray="51 119" stroke-dashoffset="-68"/><circle cx="50" cy="50" r="27" stroke="#9A6CC0" stroke-dasharray="30 140" stroke-dashoffset="-119"/></g>`,
  facs:`<rect x="16" y="14" width="72" height="72" rx="3" fill="#fff" stroke="#9AA0A6" stroke-width="2"/><path d="M52 14v72M16 50h72" stroke="#D6D2C8" stroke-width="1.4"/>`+dots([[30,34],[36,30],[40,36],[34,40]],"#3C78C8",2.2)+dots([[64,32],[70,36],[74,30],[68,40]],"#D0402E",2.2)+dots([[30,66],[36,72],[40,66]],"#3E9C5E",2.2),
  survival:`<g stroke="#9AA0A6" stroke-width="2" stroke-linecap="round"><path d="M16 84V14M16 84h72"/></g><path d="M16 22h14v10h16v14h14v12h14" fill="none" stroke="#4FBEB2" stroke-width="2.4"/><path d="M16 26h12v16h14v14h14v14h18" fill="none" stroke="#D97757" stroke-width="2.4"/>`,
  network:`<g stroke="#A8AAA0" stroke-width="1.8"><path d="M28 30L52 50M52 50L76 30M52 50L40 78M52 50L72 74"/></g><circle cx="28" cy="30" r="8" fill="#4FBEB2"/><circle cx="76" cy="30" r="7" fill="#E0844C"/><circle cx="52" cy="50" r="9" fill="#9A6CC0"/><circle cx="40" cy="78" r="7" fill="#5B9BD0"/><circle cx="72" cy="74" r="6" fill="#3E9C5E"/>`,
  dendrogram:`<g stroke="#5A6B7A" stroke-width="2" fill="none" stroke-linecap="round"><path d="M22 84V60h16V84M30 60V44h22M52 44V84M52 44V30h22M74 30V84M74 30V62h-8"/></g>`,
  westernblot:`<rect x="16" y="14" width="68" height="72" fill="#EDEAE2" stroke="#B8B4A8" stroke-width="1.6"/><g fill="#3A3632"><rect x="24" y="30" width="16" height="7" rx="2"/><rect x="44" y="28" width="16" height="9" rx="2"/><rect x="64" y="31" width="14" height="6" rx="2"/><rect x="24" y="56" width="16" height="5" rx="2" opacity=".6"/><rect x="44" y="55" width="16" height="6" rx="2" opacity=".8"/></g>`,
  /* ===== Lab (target ~20) ===== */
  sequencer:`<rect x="14" y="22" width="72" height="54" rx="6" fill="#E4E0D4" stroke="#A8A496" stroke-width="2"/><rect x="22" y="30" width="38" height="26" rx="3" fill="#2E9C92"/><path d="M27 50l6-12 5 8 4-6 5 10" fill="none" stroke="#BFE8E2" stroke-width="2"/><circle cx="72" cy="36" r="4" fill="#E0844C"/><circle cx="72" cy="48" r="4" fill="#4FBEB2"/>`,
  microscope:`<circle cx="40" cy="20" r="8" fill="#5A6B7A"/><path d="M40 28l16 8-14 22-16-8z" fill="#4FBEB2" stroke="#2E7068" stroke-width="2" stroke-linejoin="round"/><path d="M38 58c-12 6-14 18-8 28M28 86h46" fill="none" stroke="#5A6B7A" stroke-width="4.5" stroke-linecap="round"/><rect x="34" y="62" width="24" height="6" fill="#3A3632"/>`,
  flask:`<path d="M42 14h16M46 14v22L25 76a6 6 0 005 10h40a6 6 0 005-10L54 36V14" fill="none" stroke="#5A6B7A" stroke-width="3.2" stroke-linejoin="round"/><path d="M36 56h28l9 16a4 4 0 01-3.5 6H30.5A4 4 0 0127 72z" fill="#5BA8E0" opacity=".8"/>`,
  testtube:`<path d="M40 12h20M44 12v54a10 10 0 0020 0V12" fill="none" stroke="#5A6B7A" stroke-width="3.4" stroke-linecap="round"/><path d="M44 48a10 10 0 0020 0V38H44z" fill="#D97757" opacity=".8"/>`,
  petri:`<circle cx="50" cy="50" r="32" fill="#F6C6D2" opacity=".5" stroke="#C46482" stroke-width="2.4"/><circle cx="50" cy="50" r="32" fill="none" stroke="#C46482" stroke-width="2.4"/>`+dots([[42,44],[58,52],[50,62],[60,40],[38,58]],"#A84C72",4),
  microplate:`<rect x="12" y="24" width="76" height="52" rx="4" fill="#EDEAE2" stroke="#B0AC9E" stroke-width="2"/><g fill="#5BA8E0" stroke="#4A86B0" stroke-width="0.8">`+(function(){var h="";for(var r=0;r<4;r++)for(var c=0;c<6;c++)h+=`<circle cx="${22+c*11}" cy="${33+r*11}" r="3.6"/>`;return h;})()+`</g>`,
  pipette:`<path d="M62 12l10 10-40 40-12 14 14-12 40-40z" fill="#E0844C" stroke="#A8602E" stroke-width="2" stroke-linejoin="round"/><rect x="58" y="8" width="14" height="12" rx="3" transform="rotate(45 65 14)" fill="#5A6B7A"/>`,
  pcrtube:`<g>`+[30,50,70].map(function(x,i){return `<path d="M${x-9} 22h18v32l-9 16-9-16z" fill="${["#D97757","#4FBEB2","#9A6CC0"][i]}" opacity=".7" stroke="#5A5650" stroke-width="1.6" stroke-linejoin="round"/><rect x="${x-10}" y="16" width="20" height="7" rx="2" fill="#5A6B7A"/>`;}).join("")+`</g>`,
  centrifuge:`<circle cx="50" cy="52" r="34" fill="#E4E0D4" stroke="#A8A496" stroke-width="2"/><circle cx="50" cy="52" r="22" fill="#D6D2C6" stroke="#A8A496" stroke-width="1.6"/><g stroke="#9A968A" stroke-width="2"><path d="M50 52L50 30M50 52L69 63M50 52L31 63"/></g><circle cx="50" cy="30" r="5" fill="#D97757"/><circle cx="69" cy="63" r="5" fill="#4FBEB2"/><circle cx="31" cy="63" r="5" fill="#9A6CC0"/>`,
  syringe:`<path d="M20 80l40-40" stroke="#5A6B7A" stroke-width="3" stroke-linecap="round"/><rect x="52" y="24" width="30" height="14" rx="2" transform="rotate(45 67 31)" fill="#CFE0EE" stroke="#7C9CC0" stroke-width="1.8"/><path d="M74 16l8 8M60 36l-8-8" stroke="#5A6B7A" stroke-width="2.4" stroke-linecap="round"/>`,
  mouse:`<ellipse cx="44" cy="56" rx="26" ry="17" fill="#C9C4BC" stroke="#9A968A" stroke-width="2"/><circle cx="68" cy="46" r="11" fill="#C9C4BC" stroke="#9A968A" stroke-width="2"/><circle cx="63" cy="34" r="5.5" fill="#E8B6C2" stroke="#9A968A" stroke-width="1.4"/><circle cx="73" cy="46" r="2.6" fill="#3A3632"/><path d="M18 60q-10 2-8 12" fill="none" stroke="#E8B6C2" stroke-width="3" stroke-linecap="round"/>`,
  dish:`<ellipse cx="50" cy="56" rx="34" ry="14" fill="#CFE0EE" stroke="#7C9CC0" stroke-width="2"/><ellipse cx="50" cy="50" rx="34" ry="14" fill="#E8F0F8" stroke="#7C9CC0" stroke-width="2"/>`+dots([[40,48],[56,52],[50,46],[60,50]],"#4FBEB2",3),
  incubator:`<rect x="20" y="16" width="60" height="68" rx="5" fill="#E4E0D4" stroke="#A8A496" stroke-width="2"/><rect x="28" y="24" width="44" height="44" rx="3" fill="#CFE0EE" stroke="#9AB0C0" stroke-width="1.6"/><circle cx="36" cy="76" r="3" fill="#3E9C5E"/><rect x="46" y="73" width="26" height="6" rx="3" fill="#A8A496"/>`,
  vial:`<rect x="38" y="14" width="24" height="10" rx="2" fill="#5A6B7A"/><path d="M40 24h20v52a10 10 0 01-20 0z" fill="#E8F0F8" stroke="#7C9CC0" stroke-width="2"/><path d="M40 54v22a10 10 0 0020 0V54z" fill="#D97757" opacity=".7"/>`,
  scale:`<path d="M50 16v8M30 24h40" stroke="#5A6B7A" stroke-width="3" stroke-linecap="round"/><path d="M30 24l-10 22h20zM70 24l-10 22h20z" fill="#CFE0EE" stroke="#7C9CC0" stroke-width="1.8"/><path d="M44 80h12V46h-12z" fill="#A8A496"/><path d="M34 84h32" stroke="#5A6B7A" stroke-width="3" stroke-linecap="round"/>`,
  freezer:`<rect x="22" y="14" width="56" height="72" rx="5" fill="#DDE6EC" stroke="#9AB0C0" stroke-width="2"/><path d="M22 44h56" stroke="#9AB0C0" stroke-width="2"/><rect x="60" y="24" width="4" height="12" rx="2" fill="#7C9CC0"/><rect x="60" y="54" width="4" height="12" rx="2" fill="#7C9CC0"/>`,
  computer:`<rect x="16" y="20" width="68" height="44" rx="4" fill="#3A4654" stroke="#222C36" stroke-width="2"/><rect x="22" y="26" width="56" height="32" rx="2" fill="#5BA8E0"/><path d="M40 64h20v8H40z" fill="#5A6B7A"/><rect x="30" y="72" width="40" height="6" rx="3" fill="#5A6B7A"/>`,
  database:lgrad("d__ID__","#6CA8D8","#3A6CA8",true)+`<ellipse cx="50" cy="26" rx="28" ry="10" fill="url(#d__ID__)"/><path d="M22 26v48c0 5.5 12.5 10 28 10s28-4.5 28-10V26" fill="url(#d__ID__)" opacity=".55"/><ellipse cx="50" cy="26" rx="28" ry="10" fill="none" stroke="#2E548A" stroke-width="2.4"/><path d="M22 50c0 5.5 12.5 10 28 10s28-4.5 28-10M22 26v48c0 5.5 12.5 10 28 10s28-4.5 28-10V26" fill="none" stroke="#2E548A" stroke-width="2.4"/>`,
  pill:`<defs><clipPath id="pc__ID__"><rect x="20" y="40" width="60" height="22" rx="11" transform="rotate(-32 50 51)"/></clipPath></defs><g clip-path="url(#pc__ID__)"><rect x="20" y="40" width="30" height="22" transform="rotate(-32 50 51)" fill="#E0604A"/><rect x="50" y="40" width="30" height="22" transform="rotate(-32 50 51)" fill="#F2EDE4"/></g><rect x="20" y="40" width="60" height="22" rx="11" transform="rotate(-32 50 51)" fill="none" stroke="#9E3A2C" stroke-width="1.8"/>`,
  target:`<circle cx="50" cy="50" r="32" fill="#fff" stroke="#D0402E" stroke-width="4"/><circle cx="50" cy="50" r="20" fill="#F6D4CE" stroke="#D0402E" stroke-width="4"/><circle cx="50" cy="50" r="7" fill="#D0402E"/>`,
  /* ===== Human pictograms (solid silhouettes, recolorable via currentColor) ===== */
  person:`<g fill="currentColor"><circle cx="50" cy="19" r="12"/><path d="M50 33c-9 0-15 6-17 15l-4 17a3.6 3.6 0 007 1.6L40 53v5l-3 33a4 4 0 008 .5L48 65h4l3 26.5a4 4 0 008-.5l-3-33v-5l4 14.6a3.6 3.6 0 007-1.6l-4-17c-2-9-8-15-17-15z"/></g>`,
  personF:`<g fill="currentColor"><circle cx="50" cy="19" r="12"/><path d="M50 33c-8 0-13 5-15 12l-9 27h11l-1 11a4 4 0 008 .4L50 67l1 16.4a4 4 0 008-.4l-1-11h11l-9-27c-2-7-7-12-15-12z"/></g>`,
  patient:`<g fill="currentColor"><circle cx="50" cy="19" r="12"/><path d="M50 33c-9 0-15 6-17 15l-4 17a3.6 3.6 0 007 1.6L40 53v5l-3 33a4 4 0 008 .5L48 65h4l3 26.5a4 4 0 008-.5l-3-33v-5l4 14.6a3.6 3.6 0 007-1.6l-4-17c-2-9-8-15-17-15z"/></g><path d="M50 44v13M43.5 50.5h13" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>`,
  doctor:`<g fill="currentColor"><circle cx="50" cy="19" r="12"/><path d="M50 33c-9 0-15 6-17 15l-4 17a3.6 3.6 0 007 1.6L40 53v5l-3 33a4 4 0 008 .5L48 65h4l3 26.5a4 4 0 008-.5l-3-33v-5l4 14.6a3.6 3.6 0 007-1.6l-4-17c-2-9-8-15-17-15z"/></g><path d="M43 34l7 9 7-9" fill="none" stroke="#fff" stroke-width="2.6"/><circle cx="50" cy="73" r="4" fill="#fff"/>`,
  dna_person:`<g fill="currentColor"><circle cx="50" cy="19" r="12"/><path d="M50 33c-9 0-15 6-17 15l-4 17a3.6 3.6 0 007 1.6L40 53v5l-3 33a4 4 0 008 .5L48 65h4l3 26.5a4 4 0 008-.5l-3-33v-5l4 14.6a3.6 3.6 0 007-1.6l-4-17c-2-9-8-15-17-15z"/></g><path d="M42 49q8 5 16 0M42 60q8 5 16 0" stroke="#fff" stroke-width="2.4" fill="none"/>`,
  /* ===== Organs (matte, schematic anatomy) ===== */
  organ_brain:`<defs><linearGradient id="b__ID__" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EE5C86"/><stop offset="1" stop-color="#D2356A"/></linearGradient></defs><path d="M24 58c-7-3-8-13-1-17-3-9 6-16 13-13 2-9 13-11 19-4 8-4 18 2 17 11 8 2 10 12 3 17 2 8-7 14-14 11-3 6-13 7-18 1-7 3-16-2-17-9-1 1-1 2 0 3z" fill="url(#b__ID__)" stroke="#A82A55" stroke-width="2.5" stroke-linejoin="round"/><g stroke="#FBD9E4" stroke-width="2" fill="none" opacity=".5" stroke-linecap="round"><path d="M40 30q5 6 0 12t5 11"/><path d="M55 28q-5 7 1 13t-3 10"/><path d="M30 46q8 2 8 10"/><path d="M66 44q-8 3-7 11"/><path d="M48 56v9"/></g><path d="M58 64c9 0 15 6 14 12 0 5-6 8-13 7-5-1-8-5-7-10 1-6 3-9 6-9z" fill="#E0497C" stroke="#A82A55" stroke-width="2"/><g stroke="#FBD9E4" stroke-width="1.3" opacity=".5"><path d="M57 68q7 2 13 0M56 74q8 2 14 0M58 80q6 2 11 0"/></g><path d="M48 72q-2 9 2 17" fill="none" stroke="#C23A66" stroke-width="6" stroke-linecap="round"/>`,
  organ_heart:`<path d="M35 32c-11 1-17 11-15 23 3 16 18 26 32 33 12-7 24-17 26-33 2-12-4-22-15-23-6-1-11 1-14 5-3-4-8-6-14-5z" fill="#CE5248" stroke="#9E2C24" stroke-width="2.5" stroke-linejoin="round"/><g fill="none" stroke="#B23A2E" stroke-width="4.5" stroke-linecap="round"><path d="M41 33q-2-9 0-15"/><path d="M50 32q0-9 8-13t9 8q0 4-3 6"/><path d="M60 34q4-6 10-4"/></g><path d="M49 40q-4 22-8 42" fill="none" stroke="#E58478" stroke-width="2.6" stroke-linecap="round" opacity=".55"/><path d="M34 52q16 8 33 0" fill="none" stroke="#9E2C24" stroke-width="1.6" opacity=".4"/>`,
  organ_lung:`<path d="M50 14v13" stroke="#B49A9A" stroke-width="5" stroke-linecap="round"/><path d="M50 27c-4 0-7 3-11 7M50 27c4 0 7 3 11 7" fill="none" stroke="#B49A9A" stroke-width="4.5" stroke-linecap="round"/><path d="M45 33c-1 19-9 30-19 34-6 3-11-2-11-12 0-18 9-31 20-33 6-1 10 4 10 11z" fill="#D88E9A" stroke="#A85E6A" stroke-width="2.2" stroke-linejoin="round"/><path d="M55 33c1 19 9 30 19 34 6 3 11-2 11-12 0-18-9-31-20-33-6-1-10 4-10 11z" fill="#D88E9A" stroke="#A85E6A" stroke-width="2.2" stroke-linejoin="round"/><g fill="none" stroke="#A85E6A" stroke-width="1.5" opacity=".5"><path d="M35 42q-6 9-6 20M65 42q6 9 6 20M31 56q-8 3-11 11M69 56q8 3 11 11"/></g>`,
  organ_stomach:`<path d="M40 15c-4 11-2 18 5 22" fill="none" stroke="#B0584A" stroke-width="6" stroke-linecap="round"/><path d="M40 20c-9 9-9 25 3 33 9 6 14 9 14 17 0 9-8 15-18 13-6-1-10-6-10-10 0-4 3-6 6-5 3 1 3 4 7 5 4 1 8-2 8-6 0-5-6-9-13-13-12-8-13-24-3-34 2-2 4-3 6-4z" fill="#E89A8A" stroke="#B0584A" stroke-width="2.4" stroke-linejoin="round"/><g fill="none" stroke="#C06A5A" stroke-width="1.5" opacity=".5"><path d="M39 30q7 5 13 3M37 41q9 5 16 2M41 52q8 4 14 1"/></g><path d="M50 66q10 3 17-3" fill="none" stroke="#B0584A" stroke-width="5" stroke-linecap="round"/>`,
  organ_liver:`<path d="M14 40c18-11 52-13 72-5 8 3 6 15-3 20-8 4-16 6-24 6-3 4-8 6-13 5-16-3-30-6-34-14-2-4-1-9 2-12z" fill="#A65A4A" stroke="#7A3A2E" stroke-width="2.5" stroke-linejoin="round"/><path d="M50 33c-2 10-3 20-2 32" fill="none" stroke="#7A3A2E" stroke-width="2.2"/><path d="M28 56q6 4 12 2" fill="none" stroke="#7A3A2E" stroke-width="1.8" opacity=".6"/><path d="M52 60c3 0 7 2 7 7s-4 8-7 6-3-13 0-13z" fill="#6FA85A" stroke="#4E7A3A" stroke-width="1.8" stroke-linejoin="round"/>`,
  organ_pancreas:`<path d="M16 44c14-9 40-12 58-6 6 2 10 3 14 8 3 4 1 10-4 10-4 0-6-3-9-5-4-3-9-4-14-3-14 3-28 0-40 6-6 3-15-4-5-10z" fill="#E0B06A" stroke="#B08A3A" stroke-width="2.3" stroke-linejoin="round"/><path d="M24 46q28-6 56 4" fill="none" stroke="#B08A3A" stroke-width="1.5" opacity=".55"/><g fill="none" stroke="#B08A3A" stroke-width="1.2" opacity=".45"><path d="M34 42v8M46 41v9M58 42v9M70 46v6"/></g>`,
  organ_kidney:`<path d="M60 20c14 0 24 13 24 30s-10 30-24 30c-10 0-16-7-16-14 0-6 5-9 5-16s-5-10-5-16c0-8 6-14 16-14z" fill="#9A5A6E" stroke="#6E3A4E" stroke-width="2.5" stroke-linejoin="round"/><path d="M44 50h8" stroke="#6E3A4E" stroke-width="3.5" stroke-linecap="round"/><path d="M52 50c6-1 6-9 12-13M52 50c6 1 6 9 12 13" fill="none" stroke="#6E3A4E" stroke-width="2" stroke-linecap="round"/><path d="M46 52c-6 3-11 12-11 24" fill="none" stroke="#E0C86A" stroke-width="4" stroke-linecap="round"/><path d="M64 34c-6 4-9 10-9 16s3 12 9 16" fill="none" stroke="#C07A8E" stroke-width="2" opacity=".45"/>`,
  organ_spleen:`<path d="M40 22c14-4 28 6 32 22s-4 32-18 34c-10 1-18-6-20-18-1-6 2-10 1-18-1-9-4-8-4-14 0-4 3-6 9-6z" fill="#8A4A6E" stroke="#5E2E4E" stroke-width="2.5" stroke-linejoin="round"/><path d="M44 30q10 18 20 26" fill="none" stroke="#5E2E4E" stroke-width="1.6" opacity=".45"/><path d="M40 44l-6-2M42 52l-7-1" stroke="#5E2E4E" stroke-width="2" stroke-linecap="round"/>`,
  organ_intestine:`<path d="M27 90V46a16 16 0 0116-16h14a16 16 0 0116 16v44" fill="none" stroke="#D2877A" stroke-width="13" stroke-linecap="round"/><path d="M73 90a10 10 0 01-3 15" fill="none" stroke="#D2877A" stroke-width="13" stroke-linecap="round"/><path d="M27 90q-9 1-9 13" fill="none" stroke="#D2877A" stroke-width="13" stroke-linecap="round"/><g stroke="#B5685B" stroke-width="1.2" opacity=".45"><path d="M27 52h13M27 66h13M27 80h13M60 52h13M60 66h13M60 80h13M40 30h17"/></g><g fill="none" stroke="#E89CB0" stroke-width="6" stroke-linecap="round"><path d="M44 48c11 0 11 6 0 6s-11 6 0 6 11 6 0 6-11 6 0 6 11 6 0 6"/></g><g fill="none" stroke="#F0B4C2" stroke-width="5" stroke-linecap="round" opacity=".85"><path d="M56 48c-11 0-11 6 0 6s11 6 0 6-11 6 0 6 11 6 0 6-11 6 0 6"/></g>`,
  /* ===== Organoids ===== */
  organoid:grad("o__ID__","#F0BCCC","#CE869A")+`<g fill="url(#o__ID__)" stroke="#B0667A" stroke-width="2">`+[[31,38],[69,38],[27,62],[73,60],[50,25]].map(function(p){return `<circle cx="${p[0]}" cy="${p[1]}" r="12"/>`;}).join("")+`<circle cx="50" cy="52" r="24"/></g><circle cx="50" cy="52" r="13" fill="#FCEFF3"/>`+dots([[50,30],[36,40],[64,40],[33,60],[67,58],[42,70],[58,70]],"#B0667A",2),
  organoid_dome:`<path d="M10 72h80" stroke="#8FB8CC" stroke-width="3" stroke-linecap="round"/><path d="M16 72a34 30 0 0168 0z" fill="#CFE6F0" fill-opacity=".5" stroke="#8FB8CC" stroke-width="2"/>`+[[36,58],[58,62],[48,46]].map(function(p,i){var r=[9,8,7][i];return `<g fill="#E8A0B2" stroke="#C07088" stroke-width="1.4"><circle cx="${p[0]-r*0.5}" cy="${p[1]-r*0.4}" r="${r*0.5}"/><circle cx="${p[0]+r*0.5}" cy="${p[1]-r*0.3}" r="${r*0.5}"/><circle cx="${p[0]}" cy="${p[1]+r*0.4}" r="${r*0.55}"/><circle cx="${p[0]}" cy="${p[1]}" r="${r}"/></g><circle cx="${p[0]}" cy="${p[1]}" r="${r*0.45}" fill="#FBEFF3"/>`;}).join(""),
  organoid_plate:`<circle cx="50" cy="50" r="35" fill="#EAF2F6" stroke="#9AB6C4" stroke-width="2.5"/><circle cx="50" cy="50" r="35" fill="none" stroke="#9AB6C4" stroke-width="1" opacity=".5"/>`+[[38,40],[62,42],[40,64],[64,62]].map(function(p){return `<circle cx="${p[0]}" cy="${p[1]}" r="11" fill="#CFE6F0" fill-opacity=".55" stroke="#9FC2D2" stroke-width="1.2"/><g fill="#E8A0B2" stroke="#C07088" stroke-width="1.2"><circle cx="${p[0]-3}" cy="${p[1]-2}" r="3.4"/><circle cx="${p[0]+3}" cy="${p[1]-1}" r="3.4"/><circle cx="${p[0]}" cy="${p[1]+3}" r="3.6"/></g>`;}).join(""),
  organ_uterus:`<path d="M35 28c0 16 6 26 15 26s15-10 15-26c0-5-6-8-15-8s-15 3-15 8z" fill="#D88EA0" stroke="#A85E72" stroke-width="2.5" stroke-linejoin="round"/><path d="M35 30c-6-4-12-2-16 4-2 3-5 4-8 3M65 30c6-4 12-2 16 4 2 3 5 4 8 3" fill="none" stroke="#C67A8E" stroke-width="4" stroke-linecap="round"/><ellipse cx="14" cy="40" rx="6" ry="4.5" fill="#E8B0BE" stroke="#A85E72" stroke-width="2"/><ellipse cx="86" cy="40" rx="6" ry="4.5" fill="#E8B0BE" stroke="#A85E72" stroke-width="2"/><path d="M50 54v20" stroke="#A85E72" stroke-width="8" stroke-linecap="round"/><path d="M45 73h10" stroke="#7A3E52" stroke-width="3" stroke-linecap="round"/>`,
  organ_bladder:`<path d="M28 46c0-13 9-21 22-21s22 8 22 21c0 15-9 25-22 25s-22-10-22-25z" fill="#E6CE76" stroke="#B0982E" stroke-width="2.5" stroke-linejoin="round"/><path d="M38 28c-2-6-4-10-8-13M62 28c2-6 4-10 8-13" fill="none" stroke="#C8AA3E" stroke-width="3.4" stroke-linecap="round"/><path d="M50 70v10" stroke="#B0982E" stroke-width="5" stroke-linecap="round"/><path d="M36 40q14 8 28 0" fill="none" stroke="#B0982E" stroke-width="1.6" opacity=".4"/>`
};
var RECOLOR_ICONS=["person","personF","patient","doctor","dna_person"];

/* image-only icons (no gradient namespace needed) all share substitution; helper substitutes __ID__ */
function iconSVG(kind,uniq){ return (ICONS[kind]||"").replace(/__ID__/g, uniq); }

/* default non-square sizes (epithelial cells are tall columns) */
var ICON_SIZES = {
  enterocyte:[70,138],goblet:[70,138],paneth:[70,128],endocrine:[70,134],tuft:[70,138],iecstem:[64,126],mcell:[72,128],
  muscle:[150,84],heatmap:[140,130],facs:[130,130],westernblot:[120,128],
  person:[62,118],personF:[62,118],patient:[62,118],doctor:[62,118],dna_person:[62,118],
  organ_brain:[120,118],organ_heart:[116,120],organ_lung:[126,118],organ_stomach:[118,124],organ_liver:[136,98],organ_pancreas:[140,86],organ_kidney:[110,124],organ_spleen:[112,128],organ_intestine:[124,128],organ_uterus:[128,108],organ_bladder:[112,116]
};

/* ===================== CATEGORY / LIBRARY STRUCTURE ===================== */
/* Biology groups (icons + presets) */
var BIO_GROUPS = [
  {title:"Presets", items:[["preset:animalcell","Animal cell"],["preset:bacterium","Bacterial cell"],["preset:synapse","Synapse"],["preset:pca","PCA plot"],["preset:umap","UMAP plot"],["preset:linegraph","Line graph"],["preset:barpreset","Bar chart"]]},
  {title:"Stem · Progenitors", items:[["pluripotent","Pluripotent stem"],["bloodstem","Blood stem cell"],["lymphoidprog","Lymphoid progenitor"],["myeloidprog","Myeloid progenitor"],["tprecursor","T-cell precursor"],["bprecursor","B-cell precursor"]]},
  {title:"Lymphocytes · Immune", items:[["nkcell","NK cell"],["tcell","T cell"],["bcell","B cell"],["plasma","Plasma cell"],["memory","Memory cell"],["immune","Immune cell"],["macrophage","Macrophage"],["dendritic","Dendritic cell"],["mast","Mast cell"]]},
  {title:"Myeloid · Blood", items:[["neutrophil","Neutrophil"],["eosinophil","Eosinophil"],["basophil","Basophil"],["monocyte","Monocyte"],["erythrocyte","Erythrocyte"],["megakaryocyte","Megakaryocyte"],["platelets","Platelets"]]},
  {title:"Gut epithelium", items:[["enterocyte","Enterocyte"],["goblet","Goblet cell"],["paneth","Paneth cell"],["endocrine","Endocrine cell"],["tuft","Tuft cell"],["transitamp","Transit-amplifying"],["iecstem","Stem cell"],["mcell","M cell"]]},
  {title:"Organoids", items:[["organoid","Organoid"],["organoid_dome","Organoid in Matrigel"],["organoid_plate","Organoids on plate"]]},
  {title:"Tissue · Stromal", items:[["muscle","Muscle cell"],["nerve","Nerve cell"],["cardiac","Cardiac cell"],["liver","Liver cells"],["fibroblast","Fibroblast"],["stromal","Stromal cell"],["adipocyte","Adipocyte"]]},
  {title:"Molecular", items:[["cell","Cell"],["nucleus","Nucleus"],["mitochondria","Mitochondrion"],["er","ER"],["golgi","Golgi"],["vesicle","Vesicle"],["dna","DNA"],["rna","RNA"],["protein","Protein"],["antibody","Antibody"],["virus","Virus"],["bacterium","Bacterium"]]},
  {title:"Data · Plots", items:[["umap","UMAP"],["volcano","Volcano"],["heatmap","Heatmap"],["barplot","Bar plot"],["boxplot","Box plot"],["violin","Violin"],["scatter","Scatter"],["lineplot","Line plot"],["piechart","Donut"],["facs","Flow cytometry"],["survival","Survival"],["network","Network"],["dendrogram","Dendrogram"],["westernblot","Western blot"]]},
  {title:"Lab", items:[["sequencer","Sequencer"],["microscope","Microscope"],["flask","Flask"],["testtube","Test tube"],["petri","Petri dish"],["dish","Cell dish"],["microplate","96-well plate"],["pipette","Pipette"],["pcrtube","PCR tubes"],["centrifuge","Centrifuge"],["syringe","Syringe"],["vial","Vial"],["incubator","Incubator"],["freezer","-80 freezer"],["scale","Balance"],["computer","Workstation"],["database","Database"],["mouse","Mouse model"],["target","Target"],["pill","Drug"]]}
];
var HUMAN_GROUPS = [
  {title:"People", items:[["person","Person"],["personF","Person (f)"],["patient","Patient"],["doctor","Clinician"],["dna_person","Genomic subject"]]},
  {title:"Cohort presets", items:[["preset:cohort","Cohort (10)"],["preset:casecontrol","Case / control"],["preset:trial","Trial arms"]]},
  {title:"Organs", items:[["organ_brain","Brain"],["organ_heart","Heart"],["organ_lung","Lungs"],["organ_stomach","Stomach"],["organ_liver","Liver"],["organ_pancreas","Pancreas"],["organ_kidney","Kidney"],["organ_spleen","Spleen"],["organ_intestine","Intestine"],["organ_uterus","Uterus"],["organ_bladder","Bladder"]]}
];

/* ===================== SHAPES (expanded) ===================== */
var SHAPES = [
  ["rect","Rectangle"],["round","Rounded"],["ellipse","Ellipse"],["circle","Circle"],["diamond","Diamond"],
  ["triangle","Triangle"],["rtriangle","Right triangle"],["pillshape","Pill"],["hexagon","Hexagon"],["pentagon","Pentagon"],
  ["octagon","Octagon"],["parallelogram","Parallelogram"],["trapezoid","Trapezoid"],["cylinder","Cylinder"],["arrowblock","Arrow block"],
  ["chevron","Chevron"],["callout","Callout"],["document","Document"],["star","Star"],["star6","6-star"],
  ["burst","Burst"],["cloud","Cloud"],["plus","Plus"],["heart","Heart"],["crescent","Crescent"],
  ["ring","Ring"],["semicircle","Semicircle"],["quarter","Quarter"],["bracket","Bracket"],["brace","Brace"]
];
/* arrow head styles */
var ARROW_HEADS = ["none","triangle","openV","barbed","circle","diamond","square","line"];
var ARROW_PRESETS = [
  ["arrow:straight","Arrow"],["arrow:double","Double arrow"],["arrow:dashed","Dashed"],["arrow:dotted","Dotted"],
  ["arrow:block","Block arrow"],["arrow:curved","Curved"],["arrow:elbow","Elbow"],["arrow:tee","Inhibit (⊣)"]
];

/* ===================== NETWORK ARCHITECTURE PRESETS ===================== */
/* Each preset returns objects (nodes as shapes/text, edges as connectors) in a local box; instantiated centered. */
var NETWORK_PRESETS = [
  ["net:rnn","RNN / LSTM"],["net:unet","U-Net"],
  ["net:mlp","MLP (3-4-4-2)"],["net:cnn","CNN pipeline"],["net:autoencoder","Autoencoder"],
  ["net:transformer","Transformer block"],["net:gnn","Graph NN"],["net:pathway","Signaling pathway"],["net:grn","Gene reg. network"]
];

/* ===================== FONTS ===================== */
var FONTS = [
  ["-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif","Sans (system)"],
  ["'Helvetica Neue',Helvetica,Arial,sans-serif","Helvetica"],
  ["Arial,sans-serif","Arial"],
  ["'Segoe UI',Roboto,sans-serif","Segoe UI"],
  ["Georgia,'Times New Roman',serif","Georgia (serif)"],
  ["'Times New Roman',Times,serif","Times"],
  ["'Courier New',ui-monospace,monospace","Courier (mono)"],
  ["ui-monospace,Menlo,Consolas,monospace","Menlo (mono)"],
  ["'Trebuchet MS',sans-serif","Trebuchet"],
  ["'Palatino Linotype',Palatino,serif","Palatino"],
  ["Verdana,Geneva,sans-serif","Verdana"],
  ["'Comic Sans MS','Comic Sans',cursive","Comic Sans"],
  ["Impact,Haettenschweiler,sans-serif","Impact"],
  ["'Brush Script MT',cursive","Brush Script"]
];

/* ===================== ARTBOARD / POSTER SIZES (pt @72dpi-ish px) ===================== */
var ARTBOARDS = {
  slide:   {w:1600,h:1000,label:"Slide 16:10"},
  square:  {w:1200,h:1200,label:"Square"},
  letter:  {w:1632,h:1056,label:"Letter (landscape)"},
  a4:      {w:1123,h:1587,label:"A4 (portrait)"},
  posterA2:{w:1654,h:2339,label:"Poster A2 (portrait)"}
};

/* ===================== i18n ===================== */
var I18N = {
  en:{
    tagline:"Crafted by Lee", newProject:"New project", recent:"Your projects", noProjects:"No projects yet. Create one to begin.",
    open:"Open", delete:"Delete", rename:"Rename", settings:"Settings", language:"Language", theme:"Theme",
    autosave:"Autosave", autosaveEvery:"Autosave every 5 min", home:"Home", save:"Save", saved:"Saved",
    appearance:"Appearance", light:"Light", dark:"Dark", autosaveOn:"Autosave on", autosaveOff:"Autosave off",
    export:"Export", unsaved:"You have unsaved changes. Save before leaving?", saveLeave:"Save & go home",
    discard:"Discard", cancel:"Cancel", untitled:"Untitled", confirmDelete:"Delete this project? This cannot be undone.",
    library:"Library", shapes:"Shapes", network:"Network", biology:"Biology", human:"Human", ai:"AI", uploads:"Uploads",
    search:"Search assets…", properties:"Properties", emptyProp:"Select an object to edit it. Double-click empty canvas for text. Drag to multi-select.",
    artboard:"Artboard", general:"General", done:"Done", aiHint:"Type a prompt; an image is generated on demand. Needs internet.",
    generate:"Generate", uploadHere:"Drop images / SVG here, or click Upload", thisProject:"This project",
    exportTitle:"Export", format:"Format", resolution:"Resolution", scale:"Scale", exportNow:"Export",
    cut:"Cut",copy:"Copy",paste:"Paste",duplicate:"Duplicate",front:"Bring to front",forward:"Forward",backward:"Backward",back:"Send to back",
    editColor:"Edit color",addArrow:"Add arrow from here",lock:"Lock",group:"Group",ungroup:"Ungroup",
    welcome:"Welcome to Fable Figures", startHint:"Start a new project or open a recent one.",
    saveProjTitle:"Save project", projectName:"Project name",
    projectFolder:"Project folder", appStorage:"App storage", change:"Change…", folderSet:"Projects now saved to that folder", desktopOnly:"Available in the desktop app",
    noSavedNet:"No saved project named “Preset-Network %n%”. Build it, save a project with that name, then use this preset.",
    projCopied:"Project copied",
    templates:"Templates", templatesHint:"Move saved templates to another Mac", import:"Import",
    templatesExported:"Templates exported:", templatesImported:"template(s) imported",
    importBad:"Invalid or empty templates file", noTemplatesExport:"No templates to export yet"
  },
  ko:{
    tagline:"Crafted by Lee", newProject:"새 프로젝트", recent:"내 프로젝트", noProjects:"프로젝트가 없습니다. 새로 시작하세요.",
    open:"열기", delete:"삭제", rename:"이름 변경", settings:"설정", language:"언어", theme:"테마",
    autosave:"자동 저장", autosaveEvery:"5분마다 자동 저장", home:"홈", save:"저장", saved:"저장됨",
    appearance:"화면 모드", light:"라이트", dark:"다크", autosaveOn:"자동저장 켜짐", autosaveOff:"자동저장 꺼짐",
    export:"내보내기", unsaved:"저장하지 않은 변경사항이 있습니다. 저장할까요?", saveLeave:"저장 후 홈으로",
    discard:"저장 안 함", cancel:"취소", untitled:"제목없음", confirmDelete:"이 프로젝트를 삭제할까요? 되돌릴 수 없습니다.",
    library:"라이브러리", shapes:"도형", network:"네트워크", biology:"생물학", human:"인체", ai:"AI", uploads:"업로드",
    search:"자산 검색…", properties:"속성", emptyProp:"오브젝트를 선택해 편집하세요. 빈 캔버스를 더블클릭하면 텍스트, 드래그하면 다중 선택.",
    artboard:"아트보드", general:"일반", done:"완료", aiHint:"프롬프트를 입력하면 이미지를 생성합니다. 인터넷 필요.",
    generate:"생성", uploadHere:"이미지/SVG를 끌어다 놓거나 업로드를 누르세요", thisProject:"현재 프로젝트",
    exportTitle:"내보내기", format:"형식", resolution:"해상도", scale:"배율", exportNow:"내보내기",
    cut:"오리기",copy:"복사",paste:"붙여넣기",duplicate:"복제",front:"맨 앞으로",forward:"앞으로",backward:"뒤로",back:"맨 뒤로",
    editColor:"색 편집",addArrow:"여기서 화살표 연결",lock:"잠금",group:"그룹",ungroup:"그룹 해제",
    welcome:"Fable Figures에 오신 것을 환영합니다", startHint:"새 프로젝트를 시작하거나 최근 항목을 여세요.",
    saveProjTitle:"프로젝트 저장", projectName:"프로젝트 이름",
    projectFolder:"프로젝트 저장 위치", appStorage:"앱 내부 저장", change:"변경…", folderSet:"이제 해당 폴더에 저장됩니다", desktopOnly:"데스크탑 앱에서만 가능",
    noSavedNet:"“Preset-Network %n%” 이름의 저장된 프로젝트가 없습니다. 해당 이름으로 프로젝트를 저장한 뒤 이 프리셋을 사용하세요.",
    projCopied:"프로젝트가 복사되었습니다",
    templates:"템플릿", templatesHint:"저장한 템플릿을 다른 Mac으로 이동", import:"불러오기",
    templatesExported:"템플릿 내보냄:", templatesImported:"개 템플릿 불러옴",
    importBad:"잘못되었거나 비어있는 템플릿 파일", noTemplatesExport:"내보낼 템플릿이 없습니다"
  }
};

global.CAM = { ICONS, iconSVG, ICON_SIZES, BIO_GROUPS, HUMAN_GROUPS, SHAPES, ARROW_HEADS, ARROW_PRESETS, NETWORK_PRESETS, FONTS, ARTBOARDS, I18N, RECOLOR_ICONS, helpers:{cell,nuc,dots,grad,lgrad,trap,grid} };
})(window);
