// EletriPro: exportação PDF local, sem serviços externos nem janela de impressão.
export type ReportSection={title:string;headers:string[];rows:(string|number|null|undefined)[][];kind?:'materials'|'normal'};
export type ReportDocument={company:string;logo?:string;client:string;phone?:string;email?:string;sections:ReportSection[];total?:string};
const txt=(v:unknown)=>v===null||v===undefined||v===''?'—':String(v);
const bytes=(s:string)=>new TextEncoder().encode(s);
const concat=(parts:Uint8Array[])=>{const size=parts.reduce((n,p)=>n+p.length,0);const result=new Uint8Array(size);let at=0;for(const p of parts){result.set(p,at);at+=p.length}return result};
async function imageFrom(url:string):Promise<HTMLImageElement|null>{return new Promise(resolve=>{if(!url){resolve(null);return}const im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=url})}
const a4={w:1190,h:1684}; // A4, 144 dpi aprox.
export async function downloadTechnicalPdf(doc:ReportDocument,filename:string){
 const canvases:HTMLCanvasElement[]=[];let canvas:HTMLCanvasElement;let ctx:CanvasRenderingContext2D;let y=0;
 const left=68,right=68,top=76,bottom=82,contentW=a4.w-left-right;
 const start=()=>{canvas=document.createElement('canvas');canvas.width=a4.w;canvas.height=a4.h;ctx=canvas.getContext('2d')!;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,a4.w,a4.h);ctx.fillStyle='#17212e';y=top;canvases.push(canvas)};
 const font=(size=17,bold=false)=>{ctx.font=`${bold?'700':'400'} ${size}px Arial, sans-serif`};
 const ensure=(height:number)=>{if(y+height>a4.h-bottom)start()};
 const line=(x1:number,y1:number,x2:number,y2:number)=>{ctx.strokeStyle='#ccd2d8';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()};
 const text=(s:unknown,x:number,baseline:number,size=17,bold=false,align:CanvasTextAlign='left')=>{font(size,bold);ctx.fillStyle='#17212e';ctx.textAlign=align;ctx.fillText(txt(s),x,baseline)};
 const wrap=(value:unknown,maxWidth:number,size:number)=>{const s=txt(value);font(size);const lines:string[]=[];for(const paragraph of s.split('\n')){let line='';for(const word of paragraph.split(/\s+/)){const test=line?line+' '+word:word;if(ctx.measureText(test).width<=maxWidth||!line)line=test;else{lines.push(line);line=word}}lines.push(line||' ')}return lines};
 start();
 const logo=await imageFrom(doc.logo||'');
 if(logo){const maxW=112,maxH=92,ratio=Math.min(maxW/logo.width,maxH/logo.height);try{ctx.drawImage(logo,left,top,logo.width*ratio,logo.height*ratio)}catch{/* logo inacessível por CORS */}}
 const headingX=left+(logo?130:0);
 text(doc.company||'EletriPro',headingX,top+34,28,true);text('Relatório técnico de instalação elétrica',headingX,top+65,20);
 y=top+115;line(left,y,left+contentW,y);y+=36;
 text('Cliente: '+doc.client,left,y,19,true);y+=29;
 text('Telefone: '+txt(doc.phone)+'   |   E-mail: '+txt(doc.email),left,y,16);y+=28;
 text('Emissão: '+new Date().toLocaleDateString('pt-BR'),left,y,16);y+=24;
 for(const section of doc.sections){
  ensure(100);y+=24;text(section.title,left,y,23,true);y+=16;ctx.strokeStyle='#344e65';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(left+contentW,y);ctx.stroke();y+=22;
  const material=section.kind==='materials';const cols=section.headers.length;
  let widths:number[];
  if(material){widths=cols===6?[112,490,105,80,132,135]:[130,690,120,114]}else if(cols===2)widths=[330,contentW-330];else widths=Array(cols).fill(contentW/cols);
  const sum=widths.reduce((a,b)=>a+b,0);widths=widths.map(w=>w*contentW/sum);
  const header=()=>{ensure(42);ctx.fillStyle='#eef1f5';ctx.fillRect(left,y,contentW,39);let x=left;section.headers.forEach((h,i)=>{text(h,x+widths[i]/2,y+26,15,true,'center');x+=widths[i]});line(left,y+39,left+contentW,y+39);y+=39};
  header();
  if(!section.rows.length){text('Nenhum registro cadastrado',left+14,y+26,16);y+=42;continue}
  for(const row of section.rows){
   const values=row.map(txt);let fontSize=material?15:16;const descriptions=material?values[1]:'';
   if(material){font(15);while(fontSize>12&&ctx.measureText(descriptions).width>widths[1]-12){fontSize-=0.5;font(fontSize)}}
   const lines=values.map((v,i)=>material&&i===1?[v]:wrap(v,widths[i]-18,material?15:16));
   const h=material?39:Math.max(39,...lines.map(l=>l.length*21+15));
   if(y+h>a4.h-bottom){start();text(section.title+' (continuação)',left,y+12,18,true);y+=26;header()}
   let x=left;
   for(let i=0;i<cols;i++){
    ctx.strokeStyle='#cbd2da';ctx.strokeRect(x,y,widths[i],h);
    const sz=material&&i===1?fontSize:material?15:16;
    if(material){font(sz);ctx.fillStyle='#17212e';ctx.textAlign='center';ctx.fillText(values[i],x+widths[i]/2,y+Math.min(h-10,25),widths[i]-12)}
    else lines[i].forEach((ln,j)=>text(ln,x+10,y+25+j*21,sz));
    x+=widths[i];
   }
   y+=h;
  }
 }
 if(doc.total){ensure(52);y+=29;text('Total: '+doc.total,left+contentW,y,21,true,'right')}
 ensure(115);y+=42;line(left,y,left+contentW,y);y+=23;
 for(const l of wrap('Documento gerado com base nos dados cadastrados na EletriPro. Confira os cálculos e as condições reais de instalação. Não substitui projeto assinado ou ART.',contentW,14)){text(l,left,y,14);y+=19}
 canvases.forEach((c,i)=>{const cctx=c.getContext('2d')!;cctx.fillStyle='#64748b';cctx.font='14px Arial';cctx.textAlign='right';cctx.fillText(`${i+1} / ${canvases.length}`,a4.w-right,a4.h-35)});
 const images=await Promise.all(canvases.map(async c=>new Uint8Array(await (await fetch(c.toDataURL('image/jpeg',0.88))).arrayBuffer())));
 const objects:Uint8Array[]=[];const add=(s:string|Uint8Array)=>{objects.push(typeof s==='string'?bytes(s):s);return objects.length};
 const catalog=add('');const pages=add('');const pageIds:number[]=[];
 images.forEach(img=>{const imId=add(concat([bytes(`<< /Type /XObject /Subtype /Image /Width ${a4.w} /Height ${a4.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>\nstream\n`),img,bytes('\nendstream')]));const commands=`q 595 0 0 842 0 0 cm /Im0 Do Q`;
 const stream=add(`<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`);const page=add(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 ${imId} 0 R >> >> /Contents ${stream} 0 R >>`);pageIds.push(page)});
 objects[catalog-1]=bytes(`<< /Type /Catalog /Pages ${pages} 0 R >>`);objects[pages-1]=bytes(`<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
 const pieces:Uint8Array[]=[bytes('%PDF-1.4\n')];const offsets=[0];let position=pieces[0].length;
 objects.forEach((o,i)=>{offsets.push(position);const chunk=concat([bytes(`${i+1} 0 obj\n`),o,bytes('\nendobj\n')]);pieces.push(chunk);position+=chunk.length});
 const xref=position;let trailer=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(let i=1;i<offsets.length;i++)trailer+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
 trailer+=`trailer\n<< /Size ${objects.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
 pieces.push(bytes(trailer));const pdf=new Blob([concat(pieces) as BlobPart],{type:'application/pdf'});
 const url=URL.createObjectURL(pdf),a=document.createElement('a');a.href=url;a.download=filename;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
