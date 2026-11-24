// EletriPro: exportação PDF local, sem serviços externos nem janela de impressão.
export type ReportSection={title:string;headers:string[];rows:(string|number|null|undefined)[][];kind?:'materials'|'normal'};
export type ReportDocument={title?:string;company:string;logo?:string;accent?:string;client:string;phone?:string;email?:string;sections:ReportSection[];total?:string};
const txt=(v:unknown)=>v===null||v===undefined||v===''?'—':String(v);
const bytes=(s:string)=>new TextEncoder().encode(s);
const concat=(parts:Uint8Array[])=>{const size=parts.reduce((n,p)=>n+p.length,0);const result=new Uint8Array(size);let at=0;for(const p of parts){result.set(p,at);at+=p.length}return result};
async function imageFrom(url:string):Promise<HTMLImageElement|null>{return new Promise(resolve=>{if(!url){resolve(null);return}const im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=url})}
const a4={w:1190,h:1684}; // A4, 144 dpi aprox.
export async function downloadTechnicalPdf(doc:ReportDocument,filename:string){
 const canvases:HTMLCanvasElement[]=[];let canvas:HTMLCanvasElement;let ctx:CanvasRenderingContext2D;let y=0;
 const left=68,right=68,top=76,bottom=82,contentW=a4.w-left-right;
 const accent=/^#[0-9a-fA-F]{6}$/.test(doc.accent||'')?doc.accent!:'#344e65';
 const start=()=>{canvas=document.createElement('canvas');canvas.width=a4.w;canvas.height=a4.h;ctx=canvas.getContext('2d')!;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,a4.w,a4.h);ctx.fillStyle='#17212e';y=top;canvases.push(canvas)};
 const font=(size=17,bold=false)=>{ctx.font=`${bold?'700':'400'} ${size}px Arial, sans-serif`};
 const ensure=(height:number)=>{if(y+height>a4.h-bottom)start()};
 const line=(x1:number,y1:number,x2:number,y2:number)=>{ctx.strokeStyle='#ccd2d8';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()};
 const text=(s:unknown,x:number,baseline:number,size=17,bold=false,align:CanvasTextAlign='left')=>{font(size,bold);ctx.fillStyle='#17212e';ctx.textAlign=align;ctx.fillText(txt(s),x,baseline)};
 const wrap=(value:unknown,maxWidth:number,size:number)=>{
  const s=txt(value);font(size);const lines:string[]=[];
  const splitWord=(word:string)=>{const parts:string[]=[];let part='';for(const char of word){if(part&&ctx.measureText(part+char).width>maxWidth){parts.push(part);part=char}else part+=char}if(part)parts.push(part);return parts};
  for(const paragraph of s.split('\n')){let current='';for(const word of paragraph.split(/\s+/)){
    for(const piece of splitWord(word)){const candidate=current?current+' '+piece:piece;if(current&&ctx.measureText(candidate).width>maxWidth){lines.push(current);current=piece}else current=candidate}
  }lines.push(current||' ')}return lines;
 };
 start();
 const logo=await imageFrom(doc.logo||'');
 if(logo){const maxW=112,maxH=92,ratio=Math.min(maxW/logo.width,maxH/logo.height);try{ctx.drawImage(logo,left,top,logo.width*ratio,logo.height*ratio)}catch{/* logo inacessível por CORS */}}
 const headingX=left+(logo?130:0);
 // Títulos e nomes comerciais extensos devem permanecer dentro da página.
 const headingWidth=left+contentW-headingX;
 const companyLines=wrap(doc.company||'EletriPro',headingWidth,28);
 const titleLines=wrap(doc.title||'Relatório técnico de instalação elétrica',headingWidth,20);
 let headingY=top+34;
 for(const item of companyLines){text(item,headingX,headingY,28,true);headingY+=34}
 headingY+=3;
 for(const item of titleLines){text(item,headingX,headingY,20);headingY+=26}
 y=Math.max(top+115,headingY+18);ctx.strokeStyle=accent;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(left+contentW,y);ctx.stroke();y+=36;
 // Dados do cliente podem ser extensos; nunca desenhar além da margem direita.
 const detail=(value:string,size:number,bold=false)=>{for(const item of wrap(value,contentW,size)){ensure(size+12);text(item,left,y,size,bold);y+=size+10}};
 detail('Cliente: '+doc.client,19,true);
 detail('Telefone: '+txt(doc.phone)+'   |   E-mail: '+txt(doc.email),16);
 detail('Emissão: '+new Date().toLocaleDateString('pt-BR'),16);
 for(const section of doc.sections){
  const sectionTitleLines=wrap(section.title,contentW,23);
  ensure(46+sectionTitleLines.length*29+40);y+=42;
  for(const sectionTitleLine of sectionTitleLines){text(sectionTitleLine,left,y,23,true);y+=29}
  ctx.strokeStyle=accent;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(left+contentW,y);ctx.stroke();y+=22;
  const material=section.kind==='materials';const cols=section.headers.length;
  let widths:number[];
  if(material){widths=cols===5?[540,110,90,155,159]:cols===3?[780,150,124]:cols===6?[112,490,105,80,132,135]:[130,690,120,114]}else if(section.title==='Circuitos dimensionados'){widths=[230,260,170,190,204]}else if(section.title==='Quadro de distribuição'){widths=[235,125,180,175,339]}else if(section.title==='Circuitos da instalação existente'&&cols===8)widths=[160,90,120,125,120,105,110,224];else if(section.title==='Proposta preliminar de adequação'&&cols===3)widths=[200,270,contentW-470];else if(cols===2)widths=[330,contentW-330];else widths=Array(cols).fill(contentW/cols);
  const sum=widths.reduce((a,b)=>a+b,0);widths=widths.map(w=>w*contentW/sum);
  const header=()=>{
   const headerLines=section.headers.map((h,i)=>wrap(h,widths[i]-12,14));
   const hh=Math.max(40,...headerLines.map(l=>l.length*18+12));ensure(hh);
   ctx.fillStyle=accent;ctx.globalAlpha=0.13;ctx.fillRect(left,y,contentW,hh);ctx.globalAlpha=1;
   let x=left;headerLines.forEach((ls,i)=>{ls.forEach((ln,j)=>text(ln,x+widths[i]/2,y+19+j*18,14,true,'center'));x+=widths[i]});
   line(left,y+hh,left+contentW,y+hh);y+=hh;
  };
  header();
  if(!section.rows.length){text('Nenhum registro cadastrado',left+14,y+26,16);y+=42;continue}
  for(const row of section.rows){
   const values=row.map(txt);
   const fontSize=section.headers.length>=7?13:15;
   const lines=values.map((v,i)=>wrap(v,widths[i]-18,fontSize));
   let offset=0;
   const maxLines=Math.max(1,...lines.map(l=>l.length));
   while(offset<maxLines){
    if(y+40>a4.h-bottom){start();const continuationLines=wrap(section.title+' (continuação)',contentW,18);
     for(const continuationLine of continuationLines){text(continuationLine,left,y+12,18,true);y+=24}
     y+=8;header()}
    const available=Math.max(1,Math.floor((a4.h-bottom-y-16)/19));
    const count=Math.min(maxLines-offset,available);
    const h=Math.max(40,count*19+16);
    let x=left;
    for(let i=0;i<cols;i++){
     ctx.strokeStyle='#cbd2da';ctx.strokeRect(x,y,widths[i],h);
     const recommendation=section.headers[i]?.trim().toLowerCase()==='recomendação técnica';
     lines[i].slice(offset,offset+count).forEach((ln,j)=>text(ln,recommendation?x+9:x+widths[i]/2,y+24+j*19,fontSize,false,recommendation?'left':'center'));
     x+=widths[i];
    }
    y+=h;offset+=count;
   }
  }
 }
 if(doc.total){ensure(66);y+=18;ctx.fillStyle=accent;ctx.globalAlpha=.09;ctx.fillRect(left,y,contentW,53);ctx.globalAlpha=1;text('TOTAL DO ORÇAMENTO',left+16,y+33,15,true);text(doc.total,left+contentW-16,y+35,23,true,'right');y+=55}
 const disclaimer=wrap('Documento gerado com base nos dados cadastrados na EletriPro. Confira os cálculos e as condições reais de instalação. Não substitui projeto assinado ou ART.',contentW,14);
 ensure(42+23+disclaimer.length*19);y+=42;line(left,y,left+contentW,y);y+=23;
 for(const l of disclaimer){text(l,left,y,14);y+=19}
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
