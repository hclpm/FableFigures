#!/usr/bin/env node
"use strict";
const fs=require("fs"), path=require("path");
const root=path.resolve(__dirname,"..");
const dir=path.join(root,"app","assets","biology");
const manifest=JSON.parse(fs.readFileSync(path.join(dir,"manifest.json"),"utf8"));
const cols=8, cellW=150, cellH=142, rows=Math.ceil(manifest.icons.length/cols);
const body=manifest.icons.map((item,i)=>{
  const x=(i%cols)*cellW, y=Math.floor(i/cols)*cellH;
  const data=fs.readFileSync(path.join(dir,item.file)).toString("base64");
  return `<g transform="translate(${x} ${y})"><rect x="4" y="4" width="142" height="134" rx="10" fill="#fff" stroke="#E5E0D8"/><image x="29" y="10" width="92" height="92" href="data:image/svg+xml;base64,${data}"/><text x="75" y="119" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#373A3D">${item.id}</text><text x="75" y="132" text-anchor="middle" font-family="Arial,sans-serif" font-size="8" fill="#7A7E82">${item.label.replace(/&/g,"&amp;")}</text></g>`;
}).join("");
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${cols*cellW}" height="${rows*cellH}" viewBox="0 0 ${cols*cellW} ${rows*cellH}"><rect width="100%" height="100%" fill="#F5F3EF"/>${body}</svg>`;
const out=path.join(root,"work"); fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,"biology-contact-sheet.svg"),svg);
console.log(path.join(out,"biology-contact-sheet.svg"));
