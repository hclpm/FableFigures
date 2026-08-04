#!/usr/bin/env node
"use strict";

/* Rebuild Human > People as matte, publication-oriented vector figures. */
const fs=require("fs"),path=require("path"),vm=require("vm");
const root=path.resolve(__dirname,"..");
const outDir=path.join(root,"app","assets","human","people");
const backupDir=path.join(root,"backups","2026-08-04-before-human-people-redesign");
const registryFile=path.join(root,"app","human-assets.js");
const ids=["person","personF","patient","doctor","dna_person"];
const sizes={person:[74,126],personF:[74,126],patient:[78,126],doctor:[82,126],dna_person:[78,126]};
const metadata={
  person:{label:"Person",description:"Adult human in a neutral anterior stance with restrained facial detail, relaxed arms, separated legs, and publication-weight outlines.",designBasis:"Near-anatomical proportions and a neutral pose make the figure suitable for cohorts, interventions, and clinical study diagrams without implying emotion or diagnosis."},
  personF:{label:"Person (f)",description:"Adult female human in a neutral anterior stance, wearing trousers rather than a symbolic skirt, with subtle shoulder, waist, and pelvic proportions.",designBasis:"Sex presentation is conveyed through restrained proportional and hair cues instead of restroom-sign conventions, keeping the figure appropriate for scientific graphics."},
  patient:{label:"Patient",description:"Neutral standing patient wearing a hospital gown, identification wristband, socks, and open-back seam details.",designBasis:"A gown and wristband communicate clinical-patient context without using a large medical cross or depicting illness severity."},
  doctor:{label:"Clinician",description:"Front-facing clinician wearing scrubs and a white coat with stethoscope, identification badge, pockets, and closed shoes.",designBasis:"Recognizable clinical garments and equipment distinguish the role while a neutral pose avoids caricature or specialty-specific assumptions."},
  dna_person:{label:"Genomic subject",description:"Neutral research participant with a restrained DNA double-helix overlay contained within the torso.",designBasis:"The participant remains visually primary while the internal helix denotes genomic sampling or stratification without implying that DNA is anatomically visible."}
};

const head=(hair="#57443C",variant="short")=>`<g stroke="#5A4841" stroke-width="1.15" stroke-linejoin="round"><path d="M44 12q0-6 6-7 6 1 6 7v3q0 5-6 7-6-2-6-7z" fill="#D9A782"/><path d="M44 12q0-6 6-7 6 1 6 7-3-3-6-3t-6 3z" fill="${hair}" stroke="none"/>${variant==="pulled"?`<path d="M56 9q5 3 2 8" fill="none" stroke="${hair}" stroke-width="3.2" stroke-linecap="round"/>`:variant==="clinical"?`<path d="M44 11q2-6 6-6 5 1 6 6-6-3-12 0z" fill="${hair}" stroke="none"/>`:``}<path d="M48 16q2 1.5 4 0M50 13v3" fill="none" stroke="#8C6655" stroke-width=".75" stroke-linecap="round"/></g><path d="M47 21v11h6V21" fill="#D9A782" stroke="#5A4841" stroke-width="1.1"/>`;

const icons={
person:`${head()}<path d="M38 32q-6 2-8 9l-5 19q-1 4 3 5 3 1 4-3l5-16 2 18h22l2-18 5 16q1 4 4 3 4-1 3-5l-5-19q-2-7-8-9z" fill="currentColor" fill-opacity=".78" stroke="#4F5558" stroke-width="1.5" stroke-linejoin="round"/><path d="M39 64l-2 26q0 5 5 5 4 0 5-4l3-18 3 18q1 4 5 4 5 0 5-5l-2-26z" fill="currentColor" stroke="#4F5558" stroke-width="1.5" stroke-linejoin="round"/><path d="M31 61q0 5-4 5t-3-5" fill="#D9A782" stroke="#5A4841" stroke-width="1.2"/><path d="M69 61q0 5 4 5t3-5" fill="#D9A782" stroke="#5A4841" stroke-width="1.2"/><path d="M36 94h12v3H34q-2-2 2-3zm16 0h12q4 1 2 3H52z" fill="#454C50"/><path d="M43 33l7 7 7-7M50 40v24" fill="none" stroke="#F4F1EB" stroke-width="1.25" opacity=".9"/>`,

personF:`${head("#5A4039","pulled")}<path d="M40 32q-6 2-8 9l-6 20q-1 4 3 5 3 1 4-3l5-16 1 11q1 5-2 9h26q-3-4-2-9l1-11 5 16q1 4 4 3 4-1 3-5l-6-20q-2-7-8-9z" fill="currentColor" fill-opacity=".78" stroke="#4F5558" stroke-width="1.5" stroke-linejoin="round"/><path d="M39 66l-2 24q0 5 5 5 4 0 5-4l3-17 3 17q1 4 5 4 5 0 5-5l-2-24z" fill="currentColor" stroke="#4F5558" stroke-width="1.5" stroke-linejoin="round"/><path d="M32 62q0 5-4 5t-3-5M68 62q0 5 4 5t3-5" fill="#D9A782" stroke="#5A4841" stroke-width="1.2"/><path d="M36 94h12v3H34q-2-2 2-3zm16 0h12q4 1 2 3H52z" fill="#454C50"/><path d="M44 33l6 6 6-6M41 56q9 4 18 0" fill="none" stroke="#F4F1EB" stroke-width="1.2" opacity=".9"/>`,

patient:`${head("#6A5046")}<path d="M37 32q-6 2-8 10l-5 20q-1 4 3 5 3 1 4-3l5-16 2 22h24l2-22 5 16q1 4 4 3 4-1 3-5l-5-20q-2-8-8-10z" fill="currentColor" fill-opacity=".42" stroke="#557783" stroke-width="1.5" stroke-linejoin="round"/><path d="M43 32l7 9 7-9M50 41v29M38 60h24" fill="none" stroke="#557783" stroke-width="1.25"/><path d="M40 70l-2 20q0 5 5 5 4 0 5-4l2-14 2 14q1 4 5 4 5 0 5-5l-2-20z" fill="#D9A782" stroke="#5A4841" stroke-width="1.35"/><path d="M31 62q0 5-4 5t-3-5M69 62q0 5 4 5t3-5" fill="#D9A782" stroke="#5A4841" stroke-width="1.2"/><path d="M68 57h7v4h-7z" fill="#DDECF2" stroke="#557783" stroke-width="1"/><path d="M36 94h12v3H34q-2-2 2-3zm16 0h12q4 1 2 3H52z" fill="#7693A0"/>`,

doctor:`${head("#59453D","clinical")}<path d="M39 33h22l3 30H36z" fill="currentColor" fill-opacity=".82" stroke="#42555A" stroke-width="1.4"/><path d="M39 63l-2 27q0 5 5 5 4 0 5-4l3-19 3 19q1 4 5 4 5 0 5-5l-2-27z" fill="currentColor" stroke="#42555A" stroke-width="1.5"/><path d="M37 33q-6 2-8 9l-5 20q-1 4 3 5 3 1 4-3l5-17v22h12l2-27-11-10zm26 0q6 2 8 9l5 20q1 4-3 5-3 1-4-3l-5-17v22H52l-2-27 11-10z" fill="#F8F7F2" stroke="#657074" stroke-width="1.5" stroke-linejoin="round"/><path d="M41 34l9 8 9-8M50 42v27M37 58h9v7h-9M54 58h9v7h-9" fill="none" stroke="#657074" stroke-width="1.15"/><path d="M43 35v7q0 7 7 7t7-7v-7" fill="none" stroke="#4E6570" stroke-width="1.5"/><circle cx="43" cy="35" r="1.8" fill="#4E6570"/><circle cx="57" cy="35" r="1.8" fill="#4E6570"/><circle cx="50" cy="50" r="3.4" fill="#DCE8EB" stroke="#4E6570" stroke-width="1.2"/><rect x="57" y="39" width="8" height="11" rx="1" fill="#DDECF2" stroke="#657074" stroke-width=".9"/><path d="M58.5 42h5" stroke="#5A90A2" stroke-width="1"/><path d="M30 62q0 5-4 5t-3-5M70 62q0 5 4 5t3-5" fill="#D9A782" stroke="#5A4841" stroke-width="1.2"/><path d="M36 94h12v3H34q-2-2 2-3zm16 0h12q4 1 2 3H52z" fill="#3F4B50"/>`,

dna_person:`${head("#5A4740")}<path d="M38 32q-6 2-8 9l-5 20q-1 4 3 5 3 1 4-3l5-16 2 18h22l2-18 5 16q1 4 4 3 4-1 3-5l-5-20q-2-7-8-9z" fill="currentColor" fill-opacity=".26" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M39 65l-2 25q0 5 5 5 4 0 5-4l3-17 3 17q1 4 5 4 5 0 5-5l-2-25z" fill="currentColor" fill-opacity=".52" stroke="currentColor" stroke-width="1.5"/><path d="M31 62q0 5-4 5t-3-5M69 62q0 5 4 5t3-5" fill="#D9A782" stroke="#5A4841" stroke-width="1.2"/><g fill="none" stroke-linecap="round"><path d="M43 37c14 8 0 18 14 26M57 37c-14 8 0 18-14 26" stroke="#735B94" stroke-width="2"/><path d="M44 41h12M42 47h16M42 54h16M44 60h12" stroke="#D18A63" stroke-width="1.4"/></g><circle cx="43" cy="37" r="1.8" fill="#735B94"/><circle cx="57" cy="37" r="1.8" fill="#735B94"/><path d="M36 94h12v3H34q-2-2 2-3zm16 0h12q4 1 2 3H52z" fill="#454C50"/>`
};

const esc=s=>String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
fs.mkdirSync(outDir,{recursive:true});
fs.mkdirSync(path.join(backupDir,"people-svg"),{recursive:true});

/* Snapshot the legacy pictograms once; assets.js remains an additional in-code fallback. */
const ctx={window:{}};ctx.window.window=ctx.window;vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,"app","assets.js"),"utf8"),ctx,{filename:"assets.js"});
const backupManifest=path.join(backupDir,"legacy-people.json");
if(!fs.existsSync(backupManifest)){
  const legacy={created:"2026-08-04",icons:{},sizes:{}};
  for(const id of ids){
    legacy.icons[id]=ctx.window.CAM.ICONS[id];legacy.sizes[id]=ctx.window.CAM.ICON_SIZES[id];
    fs.writeFileSync(path.join(backupDir,"people-svg",id+".svg"),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="color:#3A3F45">${legacy.icons[id]}</svg>\n`);
  }
  fs.writeFileSync(backupManifest,JSON.stringify(legacy,null,2)+"\n");
}

const manifest={version:1,style:"matte scientific human figures",icons:[]};
for(const id of ids){
  const m=metadata[id];
  const svg=`<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-labelledby="title desc" style="color:#536F78">\n  <title id="title">${esc(m.label)}</title>\n  <desc id="desc">${esc(m.description)} Design basis: ${esc(m.designBasis)}</desc>\n  <metadata>${esc(JSON.stringify({id,label:m.label,description:m.description,designBasis:m.designBasis}))}</metadata>\n  ${icons[id]}\n</svg>\n`;
  fs.writeFileSync(path.join(outDir,id+".svg"),svg);
  manifest.icons.push({id,label:m.label,file:id+".svg",size:sizes[id],description:m.description,designBasis:m.designBasis});
}
fs.writeFileSync(path.join(outDir,"manifest.json"),JSON.stringify(manifest,null,2)+"\n");
fs.writeFileSync(path.join(outDir,"README.md"),"# Human · People assets\n\nFive matte, publication-oriented SVG figures generated by `scripts/rebuild-human-people-assets.js`. Legacy pictograms are preserved under `backups/2026-08-04-before-human-people-redesign`.\n");

const registry=`/* Generated by scripts/rebuild-human-people-assets.js. */\n(function(global){\n\"use strict\";\nvar PEOPLE_ICONS=${JSON.stringify(icons,null,2)};\nvar PEOPLE_SIZES=${JSON.stringify(sizes,null,2)};\nvar PEOPLE_METADATA=${JSON.stringify(metadata,null,2)};\nObject.keys(PEOPLE_ICONS).forEach(function(id){global.CAM.ICONS[id]=PEOPLE_ICONS[id];global.CAM.ICON_SIZES[id]=PEOPLE_SIZES[id];});\nglobal.CAM.HUMAN_PEOPLE_METADATA=PEOPLE_METADATA;\nglobal.CAM.HUMAN_PEOPLE_ICON_SOURCE=\"app/assets/human/people\";\n})(window);\n`;
fs.writeFileSync(registryFile,registry);
console.log(`Generated ${ids.length} Human > People SVGs in ${outDir}`);
