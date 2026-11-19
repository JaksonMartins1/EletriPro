import React,{useEffect,useState} from 'react';
import{createRoot}from'react-dom/client';
import{LayoutDashboard,Users,Calculator,Ruler,ClipboardList,FileText,Crown,LogOut,Zap,Palette,Menu,X,Plus,ArrowRight,Upload,ShieldCheck,FolderOpen,Mail,LockKeyhole,Building2,ChevronDown}from'lucide-react';
import{ supabase }from './supabase';import{downloadTechnicalPdf, type ReportSection}from './reportPdf';import './style.css';
type Client={id:string;name:string;email:string|null;phone:string|null;edit_count:number};
type WorkStatus='awaiting'|'approved'|'finished';
type WorkflowRow={client_id:string;status:WorkStatus;budget_id:string|null;completed_at:string|null;amount:number};
type BudgetChoice={id:string;title:string;amount:number};
const statusNames:Record<WorkStatus,string>={awaiting:'Aguardando aprovação',approved:'Em execução / Aprovado',finished:'Executado / Finalizado'};
const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const monthLabel=(date:string)=>new Date(date+'T12:00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
const sections=[['Painel',LayoutDashboard],['Clientes',Users],['Tipo de instalação',Building2],['Dimensionamento',Calculator],['Ambientes',Ruler],['Quadro de distribuição',ClipboardList],['Alimentador geral',Zap],['Materiais/Orçamentos',ClipboardList],['Personalização',Palette],['Meu Perfil',Users],['Assinatura',Crown]] as const;
const statesBR=['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const formatMobile=(v:string)=>{const d=v.replace(/\D/g,'').slice(0,11);return d.length>7?`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`:d.length>2?`(${d.slice(0,2)}) ${d.slice(2)}`:d;};
const colors=['#a3a3a3','#eab308','#3b82f6','#22c55e','#a855f7'];


// Dados extraídos das tabelas 36 e 37 da ABNT NBR 5410:2004 fornecida pelo usuário.
// Aplicação restrita aos métodos B1/B2/C, 2 ou 3 condutores carregados, até 300 mm².
const ampacity5410:Record<string,Record<string,Record<string,Record<string,Record<string,number>>>>>= {"PVC 70 °C":{"copper":{"B1":{"2":{"0.5":9.0,"0.75":11.0,"1":14.0,"1.5":17.5,"2.5":24.0,"4":32.0,"6":41.0,"10":57.0,"16":76.0,"25":101.0,"35":125.0,"50":151.0,"70":192.0,"95":232.0,"120":269.0,"150":309.0,"185":353.0,"240":415.0,"300":477.0},"3":{"0.5":8.0,"0.75":10.0,"1":12.0,"1.5":15.5,"2.5":21.0,"4":28.0,"6":36.0,"10":50.0,"16":68.0,"25":89.0,"35":110.0,"50":134.0,"70":171.0,"95":207.0,"120":239.0,"150":275.0,"185":314.0,"240":370.0,"300":426.0}},"B2":{"2":{"0.5":9.0,"0.75":11.0,"1":13.0,"1.5":16.5,"2.5":23.0,"4":30.0,"6":38.0,"10":52.0,"16":69.0,"25":90.0,"35":111.0,"50":133.0,"70":168.0,"95":201.0,"120":232.0,"150":265.0,"185":300.0,"240":351.0,"300":401.0},"3":{"0.5":8.0,"0.75":10.0,"1":12.0,"1.5":15.0,"2.5":20.0,"4":27.0,"6":34.0,"10":46.0,"16":62.0,"25":80.0,"35":99.0,"50":118.0,"70":149.0,"95":179.0,"120":206.0,"150":236.0,"185":268.0,"240":313.0,"300":358.0}},"C":{"2":{"0.5":10.0,"0.75":13.0,"1":15.0,"1.5":19.5,"2.5":27.0,"4":36.0,"6":46.0,"10":63.0,"16":85.0,"25":112.0,"35":138.0,"50":168.0,"70":213.0,"95":258.0,"120":299.0,"150":344.0,"185":392.0,"240":461.0,"300":530.0},"3":{"0.5":9.0,"0.75":11.0,"1":14.0,"1.5":17.5,"2.5":24.0,"4":32.0,"6":41.0,"10":57.0,"16":76.0,"25":96.0,"35":119.0,"50":144.0,"70":184.0,"95":223.0,"120":259.0,"150":299.0,"185":341.0,"240":403.0,"300":464.0}}},"aluminum":{"B1":{"2":{"16":60.0,"25":79.0,"35":97.0,"50":118.0,"70":150.0,"95":181.0,"120":210.0,"150":241.0,"185":275.0,"240":324.0,"300":372.0},"3":{"16":53.0,"25":70.0,"35":86.0,"50":104.0,"70":133.0,"95":161.0,"120":186.0,"150":214.0,"185":245.0,"240":288.0,"300":331.0}},"B2":{"2":{"16":54.0,"25":71.0,"35":86.0,"50":104.0,"70":131.0,"95":157.0,"120":181.0,"150":206.0,"185":234.0,"240":274.0,"300":313.0},"3":{"16":48.0,"25":62.0,"35":77.0,"50":92.0,"70":116.0,"95":139.0,"120":160.0,"150":183.0,"185":208.0,"240":243.0,"300":278.0}},"C":{"2":{"16":66.0,"25":83.0,"35":103.0,"50":125.0,"70":160.0,"95":195.0,"120":226.0,"150":261.0,"185":298.0,"240":352.0,"300":406.0},"3":{"16":59.0,"25":73.0,"35":90.0,"50":110.0,"70":140.0,"95":170.0,"120":197.0,"150":227.0,"185":259.0,"240":305.0,"300":351.0}}}},"EPR / XLPE 90 °C":{"copper":{"B1":{"2":{"0.5":12.0,"0.75":15.0,"1":18.0,"1.5":23.0,"2.5":31.0,"4":42.0,"6":54.0,"10":75.0,"16":100.0,"25":133.0,"35":164.0,"50":198.0,"70":253.0,"95":306.0,"120":354.0,"150":407.0,"185":464.0,"240":546.0,"300":628.0},"3":{"0.5":10.0,"0.75":13.0,"1":16.0,"1.5":20.0,"2.5":28.0,"4":37.0,"6":48.0,"10":66.0,"16":88.0,"25":117.0,"35":144.0,"50":175.0,"70":222.0,"95":269.0,"120":312.0,"150":358.0,"185":408.0,"240":481.0,"300":553.0}},"B2":{"2":{"0.5":11.0,"0.75":15.0,"1":17.0,"1.5":22.0,"2.5":30.0,"4":40.0,"6":51.0,"10":69.0,"16":91.0,"25":119.0,"35":146.0,"50":175.0,"70":221.0,"95":265.0,"120":305.0,"150":349.0,"185":395.0,"240":462.0,"300":529.0},"3":{"0.5":10.0,"0.75":13.0,"1":15.0,"1.5":19.5,"2.5":26.0,"4":35.0,"6":44.0,"10":60.0,"16":80.0,"25":105.0,"35":128.0,"50":154.0,"70":194.0,"95":233.0,"120":268.0,"150":307.0,"185":348.0,"240":407.0,"300":465.0}},"C":{"2":{"0.5":12.0,"0.75":16.0,"1":19.0,"1.5":24.0,"2.5":33.0,"4":45.0,"6":58.0,"10":80.0,"16":107.0,"25":138.0,"35":171.0,"50":209.0,"70":269.0,"95":328.0,"120":382.0,"150":441.0,"185":506.0,"240":599.0,"300":693.0},"3":{"0.5":11.0,"0.75":14.0,"1":17.0,"1.5":22.0,"2.5":30.0,"4":40.0,"6":52.0,"10":71.0,"16":96.0,"25":119.0,"35":147.0,"50":179.0,"70":229.0,"95":278.0,"120":322.0,"150":371.0,"185":424.0,"240":500.0,"300":576.0}}},"aluminum":{"B1":{"2":{"16":79.0,"25":105.0,"35":130.0,"50":157.0,"70":200.0,"95":242.0,"120":281.0,"150":323.0,"185":368.0,"240":433.0,"300":499.0},"3":{"16":71.0,"25":93.0,"35":116.0,"50":140.0,"70":179.0,"95":217.0,"120":251.0,"150":289.0,"185":330.0,"240":389.0,"300":447.0}},"B2":{"2":{"16":72.0,"25":94.0,"35":115.0,"50":138.0,"70":175.0,"95":210.0,"120":242.0,"150":277.0,"185":314.0,"240":368.0,"300":421.0},"3":{"16":64.0,"25":84.0,"35":103.0,"50":124.0,"70":156.0,"95":188.0,"120":216.0,"150":248.0,"185":281.0,"240":329.0,"300":377.0}},"C":{"2":{"16":84.0,"25":101.0,"35":126.0,"50":154.0,"70":198.0,"95":241.0,"120":280.0,"150":324.0,"185":371.0,"240":439.0,"300":508.0},"3":{"16":76.0,"25":90.0,"35":112.0,"50":136.0,"70":174.0,"95":211.0,"120":245.0,"150":283.0,"185":323.0,"240":382.0,"300":440.0}}}}};
// Tabela 40: temperatura ambiente no ar (referência 30 °C).
const temperature5410:Record<string,Record<string,number>>={
 'PVC 70 °C':{'10':1.22,'15':1.17,'20':1.12,'25':1.06,'30':1,'35':0.94,'40':0.87,'45':0.79,'50':0.71,'55':0.61,'60':0.50},
 'EPR / XLPE 90 °C':{'10':1.15,'15':1.12,'20':1.08,'25':1.04,'30':1,'35':0.96,'40':0.91,'45':0.87,'50':0.82,'55':0.76,'60':0.71,'65':0.65,'70':0.58,'75':0.50,'80':0.41}
};
// Tabela 42, linhas 1 e 2. Não cobre outras disposições de cabos.
const grouping5410:Record<string,Record<string,number>>={
 'bundle':{'1':1,'2':0.8,'3':0.7,'4':0.65,'5':0.6,'6':0.57,'7':0.54,'8':0.52,'9':0.5},
 'singleLayer':{'1':1,'2':0.85,'3':0.79,'4':0.75,'5':0.73,'6':0.72,'7':0.72,'8':0.71,'9':0.7}
};

type InstallationSettings={application:string;supply:string;voltage:string;voltageFN?:string;voltageFF?:string;method:string;temperature:string;groupMode:string;powerFactor:string;conductorMaterial:string;conductorInsulation:string;groupCount:string;wiring:string};
const defaultInstallation:InstallationSettings={application:'residential',supply:'single',voltage:'220',voltageFN:'',voltageFF:'',method:'B1',temperature:'30',groupMode:'bundle',powerFactor:'1',conductorMaterial:'copper',conductorInsulation:'PVC 70 °C',groupCount:'1',wiring:'phase-neutral'};
const installationStorageKey='ep_installation_v0716';
function readInstallation():InstallationSettings{try{const saved=JSON.parse(localStorage.getItem(installationStorageKey)||'null');return saved?{...defaultInstallation,...saved}:defaultInstallation}catch{return defaultInstallation}}
function InstallationSetup({settings,onChange,onSave,saving}:{settings:InstallationSettings;onChange:(s:InstallationSettings)=>void;onSave:()=>void;saving:boolean}){
 const update=(key:keyof InstallationSettings,value:string)=>onChange({...settings,[key]:value,...(key==='method'?{groupMode:'bundle'}:{})});
 return <section className="panel sizing-form"><h2>Tipo de instalação</h2>
 <div className="two"><label>Tipo de instalação<select value={settings.application} onChange={e=>update('application',e.target.value)}><option value="residential">Residencial</option><option value="commercial">Comercial</option><option value="industrial">Industrial (baixa tensão)</option></select></label><label>Fornecimento da concessionária<select value={settings.supply} onChange={e=>update('supply',e.target.value)}><option value="single">Monofásico</option><option value="two">Bifásico</option><option value="three">Trifásico</option></select></label></div>
 <div className="two"><label>Tensão do circuito (V)<input type="number" min="1" value={settings.voltage} onChange={e=>update('voltage',e.target.value)} placeholder="Ex.: 220"/></label><label>Método de referência<select value={settings.method} onChange={e=>update('method',e.target.value)}>{['A1','A2','B1','B2','C','D','E','F','G'].map(x=><option key={x}>{x}</option>)}</select></label></div>
 {settings.supply!=='single'&&<div className="two"><label>Tensão fase-neutro — VFN (V)<input type="number" min="1" value={settings.voltageFN||''} onChange={e=>update('voltageFN',e.target.value)} placeholder="Ex.: 220"/></label><label>Tensão fase-fase — VFF (V)<input type="number" min="1" value={settings.voltageFF||''} onChange={e=>update('voltageFF',e.target.value)} placeholder="Ex.: 380"/></label></div>}
 <p className="hint">A tensão do circuito permanece independente. Para alimentadores com mais de uma fase, informe VFN e VFF conforme o fornecimento real; não convertemos automaticamente circuitos existentes.</p>
 <div className="two"><label>Temperatura ambiente (°C)<select value={settings.temperature} onChange={e=>update('temperature',e.target.value)}><option value="">Selecione</option>{['10','15','20','25','30','35','40','45','50','55','60','65','70','75','80'].map(t=><option key={t} value={t}>{t} °C</option>)}</select></label><label>Disposição do agrupamento<select value={settings.groupMode} onChange={e=>update('groupMode',e.target.value)}><option value="bundle">Feixe ou conduto fechado (tabela 42, linha 1)</option>{settings.method==='C'&&<option value="singleLayer">Camada única sobre parede/piso (linha 2)</option>}</select></label></div>
 <h3>Parâmetros gerais dos circuitos</h3>
 <div className="two"><label>Fator de potência padrão<input type="number" min="0.01" max="1" step="0.01" value={settings.powerFactor} onChange={e=>update('powerFactor',e.target.value)}/></label><label>Material dos condutores<select value={settings.conductorMaterial} onChange={e=>update('conductorMaterial',e.target.value)}><option value="copper">Cobre</option><option value="aluminum">Alumínio</option></select></label></div>
 <div className="two"><label>Isolação<select value={settings.conductorInsulation} onChange={e=>update('conductorInsulation',e.target.value)}><option>PVC 70 °C</option><option>EPR / XLPE 90 °C</option><option>Outra — verificar tabela</option></select></label></div>
 {settings.supply==='two'&&<label>Composição dos condutores<select value={settings.wiring} onChange={e=>update('wiring',e.target.value)}><option value="phase-neutral">Fase + neutro</option><option value="phase-phase">Duas fases (sem neutro)</option></select></label>}
 
 <div className="ep-form-footer"><button type="button" className="primary" disabled={saving} onClick={onSave}>{saving?"Salvando...":"Salvar"}</button></div></section>
}
type BudgetItem={id:string;description:string;unit:string;quantity:number;unitPrice:number};
// Seção preliminar de PE pelo critério simplificado para mesmo material da fase.
// O projeto deve confirmar condições de instalação e eventual cálculo adiabático.
const standardPeSections=[1.5,2.5,4,6,10,16,25,35,50,70,95,120,150,185,240,300];
const peSection=(phase:number)=>{const required=phase<=16?phase:phase<=35?16:phase/2;return standardPeSections.find(v=>v>=required)||required;};
const budgetCableItems=(params:{length:number;size:number;material:string;insulation:string;circuit:string;wiring:string;breaker:number;curve:string;poles:number}):BudgetItem[]=>{
 const {length,size,material,insulation,circuit,wiring,breaker,curve,poles}=params;
 const base=`Cabo flexível de ${material==='copper'?'cobre':'alumínio'} ${insulation}`;
 const fmtSize=(n:number)=>n.toLocaleString('pt-BR',{maximumFractionDigits:2,minimumFractionDigits:1});
 const specs:{functionName:string;color:string;section:number}[]=[];
 if(wiring==='three'){
   specs.push({functionName:'Fase A',color:'preto',section:size},{functionName:'Fase B',color:'branco',section:size},{functionName:'Fase C',color:'vermelho',section:size});
 }else if(wiring==='phase-phase'){
   specs.push({functionName:'Fase A',color:'preto',section:size},{functionName:'Fase B',color:'branco',section:size});
 }else{
   specs.push({functionName:'Fase',color:'preto',section:size},{functionName:'Neutro',color:'azul-claro',section:size});
 }
 if(circuit==='lighting')specs.push({functionName:'Retorno',color:'amarelo',section:size});
 if(circuit!=='lighting')specs.push({functionName:'Proteção (PE)',color:'verde',section:peSection(size)});
 const stamp=Date.now().toString(36);
 const items=specs.map((spec,i)=>({id:`cabo-${stamp}-${i}`,description:`${base} ${fmtSize(spec.section)} mm² — ${spec.color} (${spec.functionName})`,unit:'m',quantity:Math.round(length*100)/100,unitPrice:0}));
 items.push({id:`dj-${stamp}`,description:`Disjuntor ${breaker} A · curva ${curve||'a confirmar'} (${poles} ${poles===1?'polo':'polos'})`,unit:'un',quantity:1,unitPrice:0});
 return items;
};
const moneyBR=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

// v0.7.20 — Ambientes persistidos por projeto; area geometrica, sem dimensionamento automatico de cargas.
type SavedEnvironment={id:string;title:string;data:Record<string,unknown>};
const environmentTypes=['Sala','Quarto','Cozinha','Banheiro','Lavanderia','Corredor','Garagem','Área externa','Escritório','Outro'];
type RoomLoadKind='lighting'|'tug';
function estimateRoom(room:SavedEnvironment){
 const d=room.data||{},w=Number(d.width),l=Number(d.length),kind=String(d.kind||'Outro');
 if(!(w>0&&l>0))return null;
 const area=w*l,perimeter=2*(w+l);
 // Valores de previsão em VA, sujeitos à revisão das condições particulares da NBR 5410.
 const lighting=area<=6?100:100+60*Math.floor((area-6)/4+1e-9);
 let outlets:number|null=null;
 if(['Sala','Quarto','Escritório'].includes(kind))outlets=Math.ceil((perimeter-1e-9)/5);
 else if(['Cozinha','Lavanderia'].includes(kind))outlets=Math.ceil((perimeter-1e-9)/3.5);
 else if(kind==='Banheiro')outlets=1;
 // Não inventar critérios automáticos para garagens, corredores e outras áreas.
 const tug=outlets===null?null:['Cozinha','Lavanderia'].includes(kind)?Math.min(outlets,3)*600+Math.max(0,outlets-3)*100:kind==='Banheiro'?600:outlets*100;
 return {area,perimeter,lighting,tug,outlets};
}
type CircuitLoadLink={environmentId:string;kind:RoomLoadKind};
function linkedLoads(links:CircuitLoadLink[],rooms:SavedEnvironment[]){
 const missing:string[]=[];let va=0;
 for(const link of links){const room=rooms.find(r=>r.id===link.environmentId);if(!room){missing.push(link.environmentId);continue}
 const result=estimateRoom(room);const value=result?.[link.kind];if(value===null||value===undefined){missing.push(room.title);continue}va+=value;}
 return {va,missing};
}
function Environments({clientId,userId}:{clientId:string;userId:string}){
 const [rows,setRows]=useState<SavedEnvironment[]>([]);
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [editorOpen,setEditorOpen]=useState(false);
 const [viewMode,setViewMode]=useState(false);
 const [title,setTitle]=useState('');
 const [kind,setKind]=useState('Sala');
 const [width,setWidth]=useState('');
 const [length,setLength]=useState('');
 const [notes,setNotes]=useState('');
 const [projectId,setProjectId]=useState<string|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState('');
 const request=React.useRef(0);
 useEffect(()=>{if(!selectedId)return;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!busy)reset()};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[selectedId,busy]);
 const parseDimension=(value:string)=>Number(value.trim().replace(',','.'));
 const w=width.trim()?parseDimension(width):NaN;
 const l=length.trim()?parseDimension(length):NaN;
 const dimensionsValid=Number.isFinite(w)&&w>0&&Number.isFinite(l)&&l>0;
 const area=dimensionsValid?w*l:null;
 const reset=()=>{setViewMode(false);setEditorOpen(false);setSelectedId(null);setTitle('');setKind('Sala');setWidth('');setLength('');setNotes('');setStatus('Novo ambiente.');};
 const selectRow=(row:SavedEnvironment)=>{
  const d=row.data||{};
  setEditorOpen(true);setViewMode(true);setSelectedId(row.id);setTitle(row.title);
  setKind(typeof d.kind==='string'?d.kind:'Outro');
  setWidth(d.width===undefined?'':String(d.width));setLength(d.length===undefined?'':String(d.length));
  setNotes(typeof d.notes==='string'?d.notes:'');setStatus('Ambiente carregado.');
 };
 useEffect(()=>{
  const id=++request.current;
  setLoading(true);setRows([]);setProjectId(null);setSelectedId(null);setTitle('');setKind('Sala');setWidth('');setLength('');setNotes('');setStatus('');
  void (async()=>{
   if(!supabase)return;
   const {data:project,error:pe}=await supabase.from('eletripro_projects').select('id').eq('client_id',clientId).maybeSingle();
   if(id!==request.current)return;
   if(pe){setStatus('Erro ao localizar projeto: '+pe.message);setLoading(false);return;}
   if(!project){setStatus('Salve primeiro o Tipo de instalação para criar o projeto.');setLoading(false);return;}
   setProjectId(project.id);
   const {data,error}=await supabase.from('eletripro_environments').select('id,title,data').eq('project_id',project.id).order('created_at',{ascending:true});
   if(id!==request.current)return;
   if(error)setStatus('Erro ao carregar ambientes: '+error.message);
   else setRows((data||[]) as SavedEnvironment[]);
   setLoading(false);
  })();
  return()=>{request.current++};
 },[clientId,userId]);
 async function save(){
  if(!supabase||!projectId||busy||loading)return;
  if(!title.trim()){setStatus('Informe o nome do ambiente.');return;}
  if(!dimensionsValid){setStatus('Informe comprimento e largura maiores que zero.');return;}
  setBusy(true);setStatus('');
  const data={kind,width:w,length:l,notes:notes.trim(),area:Math.round(w*l*100)/100};
  const result=selectedId
   ?await supabase.from('eletripro_environments').update({title:title.trim(),data,updated_at:new Date().toISOString()}).eq('id',selectedId).eq('project_id',projectId).select('id,title,data').single()
   :await supabase.from('eletripro_environments').insert({project_id:projectId,title:title.trim(),data}).select('id,title,data').single();
  if(result.error)setStatus('Erro ao salvar ambiente: '+result.error.message);
  else if(result.data){const saved=result.data as SavedEnvironment;setRows(old=>selectedId?old.map(x=>x.id===saved.id?saved:x):[...old,saved]);setSelectedId(saved.id);setEditorOpen(false);setViewMode(false);setStatus('✓ Ambiente salvo com sucesso.');}
  setBusy(false);
 }
 async function remove(){
  if(!supabase||!selectedId||!projectId||busy||!window.confirm('Excluir este ambiente salvo?'))return;
  setBusy(true);const id=selectedId;
  const {error}=await supabase.from('eletripro_environments').delete().eq('id',id).eq('project_id',projectId);
  if(error)setStatus('Erro ao excluir ambiente: '+error.message);
  else{setRows(old=>old.filter(x=>x.id!==id));reset();setStatus('Ambiente excluído do Supabase.');}
  setBusy(false);
 }
 const totalArea=rows.reduce((sum,row)=>{const d=row.data||{};const a=Number(d.area);return sum+(Number.isFinite(a)&&a>0?a:0)},0);
 return <div style={{display:'grid',gap:16}}>
  <section className="panel"><div className="panel-heading"><div><h2>Ambientes do projeto</h2></div><button type="button" className="outline" onClick={()=>{reset();setViewMode(false);setEditorOpen(true)}} disabled={busy||loading}><Plus size={16}/> Novo ambiente</button></div>
   {loading?<p className="hint">Carregando ambientes...</p>:rows.length===0?<p className="hint">Nenhum ambiente cadastrado.</p>:<div className="ep-record-list">{rows.map((row,index)=><button key={row.id} type="button" className="ep-record" onClick={()=>selectRow(row)} disabled={busy}><span className="ep-record-number">{String(index+1).padStart(2,'0')}</span><span className="ep-record-name">{row.title}</span><span aria-hidden="true">›</span></button>)}</div>}
   {rows.length>0&&<p className="hint">{rows.length} ambiente(s) · Soma das áreas cadastradas: {totalArea.toLocaleString('pt-BR',{maximumFractionDigits:2})} m² (não desconta sobreposições).</p>}
   {status&&<p role="status" className="hint" style={{marginTop:12}}>{status}</p>}
  </section>
  {editorOpen&&<div className="ep-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)reset()}}><section className="panel sizing-form ep-editor-card" role="dialog" aria-modal={true} aria-label={selectedId?'Editar ambiente':'Novo ambiente'}><div className="ep-editor-heading"><h2>{selectedId?(viewMode?title:'Editar ambiente'):'Novo ambiente'}</h2>{<button type="button" className="ep-close" aria-label="Fechar" onClick={reset} disabled={busy}><X size={20}/></button>}</div>
   {viewMode&&selectedId?<div className="ep-summary">
    {(()=>{const perimeter=dimensionsValid?2*(w+l):null;const points=perimeter===null?null:kind==='Banheiro'?1:kind==='Corredor'?1:Math.max(1,Math.ceil((perimeter-1e-9)/(kind==='Cozinha'||kind==='Lavanderia'?3.5:5)));const kitchen=['Cozinha','Lavanderia'].includes(kind);const tugVA=points===null?null:kitchen?Math.min(3,points)*600+Math.max(0,points-3)*100:kind==='Banheiro'?600:points*100;const lightingVA=area===null?null:area<=6?100:100+60*Math.floor((area-6)/4+1e-9);return <>
      <div className="ep-summary-grid"><div><span>Área</span><strong>{area===null?'—':`${area.toLocaleString('pt-BR',{maximumFractionDigits:2})} m²`}</strong></div><div><span>Perímetro</span><strong>{perimeter===null?'—':`${perimeter.toLocaleString('pt-BR',{maximumFractionDigits:2})} m`}</strong></div><div><span>Quantidade mínima de TUG</span><strong>{points??'—'}</strong></div><div><span>Potência mínima de TUG</span><strong>{tugVA===null?'—':`${tugVA} VA`}</strong></div><div><span>Quantidade mínima de pontos de luz</span><strong>1</strong></div><div><span>Potência mínima de iluminação</span><strong>{lightingVA===null?'—':`${lightingVA} VA`}</strong></div></div>
      <p className="hint"></p>
     </>})()}
    <div className="ep-summary-actions"><button type="button" className="primary" onClick={()=>setViewMode(false)}>Editar</button><button type="button" className="outline" disabled={busy} onClick={()=>void remove()}>Excluir</button><button type="button" className="outline" onClick={reset}>Fechar</button></div>
   </div>:<div className="ep-edit-body">
   <label>Nome do ambiente<input maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex.: Sala de estar"/></label>
   <label>Tipo de ambiente<select value={kind} onChange={e=>setKind(e.target.value)}>{environmentTypes.map(t=><option key={t} value={t}>{t}</option>)}</select></label>
   <div className="two"><label>Largura (m)<input type="number" min="0.01" step="any" value={width} onChange={e=>setWidth(e.target.value)} placeholder="Ex.: 3,5"/></label><label>Comprimento (m)<input type="number" min="0.01" step="any" value={length} onChange={e=>setLength(e.target.value)} placeholder="Ex.: 4"/></label></div>
   <div className="sizing-metric"><span>Área calculada</span><strong>{area===null?'—':area.toLocaleString('pt-BR',{maximumFractionDigits:2})+' m²'}</strong></div>
   <label>Observações (opcional)<textarea rows={3} maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Informações do ambiente"/></label>
   <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button type="button" className="primary" disabled={loading||busy||!projectId||!title.trim()||!dimensionsValid} onClick={()=>void save()}>{busy?'Aguarde...':selectedId?'Atualizar ambiente':'Salvar ambiente'}</button>{selectedId&&<button type="button" className="outline" disabled={busy} onClick={()=>void remove()}>Excluir ambiente</button>}</div>
   
  <button type="button" className="outline" onClick={reset} disabled={busy}>Fechar</button></div>}</section></div>}
 </div>;
}
type SavedCircuit={id:string;title:string;data:Record<string,unknown>};
function CircuitSizing({settings,clientId,userId}:{settings:InstallationSettings;clientId:string;userId:string}){
 const [editorOpen,setEditorOpen]=useState(false);
 const [viewMode,setViewMode]=useState(false);
 const [environmentId,setEnvironmentId]=useState(''),[loadLinks,setLoadLinks]=useState<CircuitLoadLink[]>([]),[loadMode,setLoadMode]=useState<'manual'|'rooms'>('manual'),[environmentOptions,setEnvironmentOptions]=useState<SavedEnvironment[]>([]),[materialSending,setMaterialSending]=useState(false);
 const [circuit,setCircuit]=useState('tug'),[power,setPower]=useState(''),[pf,setPf]=useState('1'),[length,setLength]=useState(''),[material,setMaterial]=useState('copper');
 const [wiring,setWiring]=useState('phase-neutral');
 const [insulation,setInsulation]=useState('PVC 70 °C'),[groupCount,setGroupCount]=useState('1');
  const [savedCircuits,setSavedCircuits]=useState<SavedCircuit[]>([]);
  const [selectedCircuitId,setSelectedCircuitId]=useState<string|null>(null);
  const [circuitTitle,setCircuitTitle]=useState('');
  const [circuitStatus,setCircuitStatus]=useState('');
  const [circuitBusy,setCircuitBusy]=useState(false);
  const [circuitLoading,setCircuitLoading]=useState(true);
  const circuitRequest=React.useRef(0);
  useEffect(()=>{if(!selectedCircuitId)return;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!circuitBusy)clearCircuit()};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[selectedCircuitId,circuitBusy]);
  const clearCircuit=()=>{setViewMode(false);setEditorOpen(false);setSelectedCircuitId(null);setCircuitTitle('');setCircuit('tug');setPower('');setPf(settings.powerFactor);setLength('');setMaterial('copper');setWiring('phase-neutral');setInsulation('PVC 70 °C');setGroupCount(settings.groupCount);setEnvironmentId('');setLoadLinks([]);setLoadMode('manual');setCircuitStatus('Novo circuito: preencha os dados e clique em Salvar circuito.');};
  const selectSavedCircuit=(row:SavedCircuit)=>{
    const d=row.data||{};
    const val=(key:string,fallback:string)=>typeof d[key]==='string'?String(d[key]):fallback;
    setEditorOpen(true);setViewMode(true);setEnvironmentId(val('environmentId',''));setLoadLinks(Array.isArray(d.loadLinks)?(d.loadLinks as CircuitLoadLink[]):[]);setLoadMode(d.loadMode==='rooms'?'rooms':'manual');setSelectedCircuitId(row.id);setCircuitTitle(row.title);setCircuit(val('circuit',Array.isArray(d.loadLinks)&&d.loadLinks.some((x:CircuitLoadLink)=>x.kind==='lighting')?'lighting':'tug'));setPower(val('power',''));setPf(settings.powerFactor);setLength(val('length',''));setMaterial(settings.conductorMaterial);setWiring(settings.wiring);setInsulation(settings.conductorInsulation);setGroupCount(val('groupCount',settings.groupCount));setCircuitStatus('Circuito carregado.');
  };
  useEffect(()=>{
    const request=++circuitRequest.current;
    setCircuitLoading(true);setSavedCircuits([]);setSelectedCircuitId(null);setCircuitStatus('');
    void (async()=>{
      if(!supabase)return;
      const {data:project,error:pe}=await supabase.from('eletripro_projects').select('id').eq('client_id',clientId).maybeSingle();
      if(request!==circuitRequest.current)return;
      if(pe){setCircuitStatus('Erro ao localizar projeto: '+pe.message);setCircuitLoading(false);return}
      if(!project){setCircuitStatus('Salve primeiro o Tipo de instalação para criar o projeto.');setCircuitLoading(false);return}
      const rooms=await supabase.from('eletripro_environments').select('id,title,data').eq('project_id',project.id).order('created_at',{ascending:true});
      if(request!==circuitRequest.current)return;
      if(rooms.error)setCircuitStatus('Erro ao carregar ambientes: '+rooms.error.message);
      else setEnvironmentOptions((rooms.data||[]) as SavedEnvironment[]);
      const {data,error}=await supabase.from('eletripro_circuits').select('id,title,data').eq('project_id',project.id).order('created_at',{ascending:true});
      if(request!==circuitRequest.current)return;
      if(error)setCircuitStatus('Erro ao carregar circuitos: '+error.message);
      else setSavedCircuits((data||[]) as SavedCircuit[]);
      setCircuitLoading(false);
    })();
    return()=>{circuitRequest.current++};
  },[clientId,userId]);
  async function saveCircuit(){
    if(!supabase||circuitBusy||circuitLoading)return;
    const title=circuitTitle.trim();
    if(!title){setCircuitStatus('Informe o nome do circuito.');return}
    if(!(loadMode==='rooms'?loadLinks.length>0&&roomCalculation.missing.length===0&&roomCalculation.va>0&&Number(settings.powerFactor)>0:Number.isFinite(Number(power))&&Number(power)>0)||!Number.isFinite(Number(length))||Number(length)<0){setCircuitStatus('Informe potência positiva e comprimento válido.');return}
    if(loadMode==='rooms'){
      const conflicts=savedCircuits.filter(x=>x.id!==selectedCircuitId&&x.data?.loadMode==='rooms'&&Array.isArray(x.data.loadLinks)).flatMap(x=>(x.data.loadLinks as CircuitLoadLink[]).filter(y=>loadLinks.some(z=>z.environmentId===y.environmentId&&z.kind===y.kind)).map(y=>x.title));
      if(conflicts.length){setCircuitStatus('Carga já vinculada a outro circuito: '+[...new Set(conflicts)].join(', '));return}
      if((circuit==='lighting'&&loadLinks.some(x=>x.kind!=='lighting'))||(circuit==='tug'&&loadLinks.some(x=>x.kind!=='tug'))||(circuit!=='lighting'&&circuit!=='tug')){setCircuitStatus('O tipo de carga deve corresponder ao tipo do circuito.');return}
    }
    setCircuitBusy(true);setCircuitStatus('');
    const {data:project,error:pe}=await supabase.from('eletripro_projects').select('id').eq('client_id',clientId).maybeSingle();
    if(pe||!project){setCircuitStatus(pe?'Erro: '+pe.message:'Salve primeiro o Tipo de instalação.');setCircuitBusy(false);return}
    const data={circuit,environmentId:environmentId||null,loadMode,loadLinks,power:powerForSizing,manualPower:power,powerVA:loadMode==='rooms'?roomCalculation.va:null,pf:settings.powerFactor,length,material:settings.conductorMaterial,wiring:settings.wiring,insulation:settings.conductorInsulation,groupCount,panelPhase:selectedCircuitId?(savedCircuits.find(x=>x.id===selectedCircuitId)?.data.panelPhase||'A'):'A',panelConnection:selectedCircuitId?(savedCircuits.find(x=>x.id===selectedCircuitId)?.data.panelConnection||null):null,results:{current,selectedSection,corrected,drop,pct,breaker:breakerCandidate,curve:tripCurve},installationSnapshot:settings};
    const result=selectedCircuitId
      ?await supabase.from('eletripro_circuits').update({title,data,updated_at:new Date().toISOString()}).eq('id',selectedCircuitId).eq('project_id',project.id).select('id,title,data').single()
      :await supabase.from('eletripro_circuits').insert({project_id:project.id,title,data}).select('id,title,data').single();
    if(result.error)setCircuitStatus('Erro ao salvar circuito: '+result.error.message);
    else if(result.data){const saved=result.data as SavedCircuit;setSavedCircuits(old=>selectedCircuitId?old.map(x=>x.id===saved.id?saved:x):[...old,saved]);setSelectedCircuitId(saved.id);setEditorOpen(false);setViewMode(false);try{await syncCircuitMaterials(project.id,saved);await syncUnifiedBudget(project.id);setCircuitStatus('Circuito e materiais atualizados automaticamente.')}catch(e){setCircuitStatus('Circuito salvo, mas a atualização dos materiais falhou: '+(e instanceof Error?e.message:String(e)))}}
    setCircuitBusy(false);
  }
  async function deleteCircuit(){
    if(!supabase||!selectedCircuitId||circuitBusy||!window.confirm('Excluir este circuito salvo?'))return;
    setCircuitBusy(true);
    const id=selectedCircuitId;
    const {error}=await supabase.from('eletripro_circuits').delete().eq('id',id);
    if(error)setCircuitStatus('Erro ao excluir: '+error.message);
    else{setSavedCircuits(old=>old.filter(x=>x.id!==id));clearCircuit();try{const projectId=await ensureEletriProject(clientId,userId);await syncCircuitMaterials(projectId,null,id);await syncUnifiedBudget(projectId);setCircuitStatus('Circuito excluído e materiais vinculados removidos.')}catch(e){setCircuitStatus('Circuito excluído; confira materiais: '+(e instanceof Error?e.message:String(e)))}}
    setCircuitBusy(false);
  }

 async function sendSizingMaterials(items:BudgetItem[]){
   if(!supabase||materialSending||!selectedCircuitId)return;
   if(!window.confirm('Atualizar a lista de materiais deste circuito? Preços já cadastrados serão preservados.'))return;
   setMaterialSending(true);setCircuitStatus('Consolidando materiais...');
   try{
     const projectId=await ensureEletriProject(clientId,userId);
     const found=await supabase.from('eletripro_materials').select('id,source_key,description,quantity,unit,unit_price').eq('project_id',projectId).not('source_key','is',null);
     if(found.error)throw found.error;
     const existing=(found.data||[]) as GeneratedMaterial[];
     const circuitRows=existing.filter(x=>x.source_key?.startsWith(selectedCircuitId+':'));
     const desired=items.map((item,i)=>({...item,source_key:`${selectedCircuitId}:${item.description.includes('Disjuntor')?'breaker':item.description.includes('(Fase)')?'phase':item.description.includes('(Neutro)')?'neutral':item.description.includes('(Retorno)')?'return':item.description.includes('(Proteção (PE))')?'pe':i}`}));
     for(const item of desired){
       const old=existing.find(x=>x.source_key===item.source_key);
       const payload={description:item.description,quantity:item.quantity,unit:item.unit};
       const result=old?await supabase.from('eletripro_materials').update(payload).eq('id',old.id).eq('project_id',projectId):await supabase.from('eletripro_materials').insert({project_id:projectId,...payload,unit_price:0,source_key:item.source_key});
       if(result.error)throw result.error;
     }
     const stale=circuitRows.filter(x=>!desired.some(d=>d.source_key===x.source_key));
     if(stale.length){const result=await supabase.from('eletripro_materials').delete().in('id',stale.map(x=>x.id)).eq('project_id',projectId);if(result.error)throw result.error;}
     setCircuitStatus(`${desired.length} materiais consolidados. Quantidades atualizadas sem alterar preços existentes.`);
   }catch(e){setCircuitStatus('Erro ao consolidar: '+(e instanceof Error?e.message:String(e)))}
   finally{setMaterialSending(false)}
 }
 const roomCalculation=linkedLoads(loadLinks,environmentOptions);
 const roomPowerW=roomCalculation.va*Number(settings.powerFactor);
 const powerForSizing=loadMode==='rooms'?(loadLinks.length>0&&roomCalculation.missing.length===0?String(roomPowerW):''):power;
 const {method,temperature,groupMode}=settings;
 const effectiveMaterial=settings.conductorMaterial;
 const effectiveInsulation=settings.conductorInsulation;
 const effectiveGroupCount=groupCount;
 const effectivePf=settings.powerFactor;
 const phases=settings.supply==='three'?'three':'single';
 const loaded=settings.supply==='three'?'3':'2';
 const voltage=settings.voltage;
 const effectiveWiring=settings.supply==='single'?'phase-neutral':settings.supply==='three'?'three':settings.wiring;
 const num=(x:string)=>x.trim()===''?NaN:Number(x.replace(',','.'));
 const p=num(powerForSizing),v=num(voltage),f=num(effectivePf),l=num(length);
 const ft=temperature5410[effectiveInsulation]?.[temperature];
 const fg=grouping5410[groupMode]?.[effectiveGroupCount];
 const valid=Number.isFinite(p)&&p>0&&Number.isFinite(l)&&l>0&&Number.isFinite(v)&&v>0&&Number.isFinite(f)&&f>0&&f<=1;
 const current=valid?p/(v*f*(phases==='three'?Math.sqrt(3):1)):null;
 const rho=effectiveMaterial==='copper'?0.0175:0.0282;
 const alpha=effectiveMaterial==='copper'?0.00393:0.00403;
 const conductorTemp=effectiveInsulation==='PVC 70 °C'?70:90;
 const rhoOperating=rho*(1+alpha*(conductorTemp-20));
 const minSection=effectiveMaterial==='aluminum'?16:(circuit==='lighting'?1.5:2.5);
 const supported=Boolean(ampacity5410[effectiveInsulation]?.[effectiveMaterial]?.[method]?.[loaded])&&ft!==undefined&&fg!==undefined&&
   (groupMode==='bundle'||(method==='C'&&groupMode==='singleLayer'))&&
   circuit!=='motor'&&circuit!=='feeder'&&circuit!=='other'&&phases!=='three';
 // Limite de 4% adotado automaticamente como critério provisório de estudo.
 // A aplicabilidade normativa e a queda acumulada precisam ser verificadas no projeto.
 const dropLimitNum=4;
 const lengthValid=Number.isFinite(l)&&l>=0;
 const evaluate=(size:number,iz0:number)=>{
   const iz=iz0*ft!*fg!;
   // Modelo puramente resistivo na temperatura nominal do condutor, sem reatância.
   const delta=current===null?NaN:2*rhoOperating*l*current*f/size;
   const percent=delta/v*100;
   return {size,iz0,iz,delta,percent,ampacityOk:current!==null&&iz>=current,dropOk:percent<=dropLimitNum};
 };
 const candidates=supported&&current!==null&&lengthValid
   ?Object.entries(ampacity5410[effectiveInsulation]?.[effectiveMaterial]?.[method]?.[loaded]||{})
      .map(([size,iz0])=>evaluate(Number(size),iz0))
      .sort((a,b)=>a.size-b.size)
      .filter(x=>x.size>=minSection)
   :[];
 const currentOnly=candidates.find(x=>x.ampacityOk)||null;
 const electricalCandidate=candidates.find(x=>x.ampacityOk&&x.dropOk)||null;
 // Lista de correntes nominais para o estudo; não garante disponibilidade comercial.
 const breakerRatings=[6,10,16,20,25,32,40,50,63,80,100,125];
 const kitchenLaundry=environmentOptions.some(r=>loadLinks.some(l=>l.environmentId===r.id)&&/cozinha|lavanderia|área de serviço/i.test(r.title+' '+String(r.data.kind||'')))||/cozinha|lavanderia|área de serviço/i.test(circuitTitle);
 const minBreaker=(size:number)=>circuit==='lighting'?10:circuit==='tug'&&size===2.5&&kitchenLaundry?20:(circuit==='tug'||circuit==='tue')&&size===2.5?16:circuit==='tug'?16:6;
 // Integração: testar cada seção comercial em ordem crescente, exigindo capacidade,
 // queda de tensão e um In que satisfaça Ib ≤ In ≤ Iz.
 const coordinated=candidates.map(x=>({
   ...x,
   breaker:x.ampacityOk&&x.dropOk&&current!==null
     ?(breakerRatings.find(inom=>inom>=minBreaker(x.size)&&inom>=current-1e-9&&inom<=x.iz+1e-9)??null)
     :null
 })).find(x=>x.breaker!==null)??null;
 const decisionSteps=candidates.filter(x=>coordinated?x.size<=coordinated.size:(electricalCandidate?x.size<=electricalCandidate.size: false)).map(x=>{
   const inRating=x.ampacityOk&&x.dropOk&&current!==null
     ?(breakerRatings.find(inom=>inom>=minBreaker(x.size)&&inom>=current-1e-9&&inom<=x.iz+1e-9)??null):null;
   const reason=!x.ampacityOk?'Capacidade de corrente insuficiente':!x.dropOk?'Queda de tensão acima de 4%':inRating===null?'Sem disjuntor compatível na lista':'Atende aos três critérios';
   return {...x,inRating,reason};
 });
 const candidate=coordinated;
 const selectedSection=candidate?.size??null;
 const base=candidate?.iz0??null;
 const corrected=candidate?.iz??null;
 const drop=candidate?.delta??null;
 const pct=candidate?.percent??null;
 // Avaliação preliminar para disjuntor conforme ABNT NBR NM 60898-1 / IEC 60898-1.
 // I2 = 1,45 In somente para a hipótese adotada; a curva é apenas pré-indicada.
 const breakerCandidate=candidate?.breaker??null;
 const breakerI2=breakerCandidate===null?null:1.45*breakerCandidate;
 const breakerBasicOk=breakerCandidate!==null&&current!==null&&corrected!==null&&current<=breakerCandidate&&breakerCandidate<=corrected;
 const breakerConventionalOk=breakerI2!==null&&corrected!==null&&breakerI2<=1.45*corrected;
 // A curva é apenas uma hipótese preliminar por categoria; cargas reais podem ter picos de partida.
 // O módulo não calcula curto-circuito nem verifica capacidade de interrupção.
 const tripCurve=(circuit==='lighting'||circuit==='tug')?'C':(circuit==='tue'&&/chuveiro|torneira el[eé]trica|aquecedor resistivo|resist[eê]ncia/i.test(circuitTitle))?'B':null;
 const raisedForBreaker=electricalCandidate!==null&&candidate!==null&&candidate.size>electricalCandidate.size;
 const noBreakerSolution=electricalCandidate!==null&&candidate===null;
 const noCompliantCandidate=supported&&current!==null&&lengthValid&&!electricalCandidate;
 const fmt=(n:number,d=2)=>n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
 const reset=()=>{setPower('');setPf(settings.powerFactor);setLength('');setGroupCount(settings.groupCount)};
 return <><section className="panel" style={{marginBottom:16}}><div className="panel-heading"><div><h2>Circuitos do projeto</h2></div><button type="button" className="outline" disabled={circuitBusy} onClick={()=>{clearCircuit();setViewMode(false);setEditorOpen(true)}}><Plus size={16}/> Novo circuito</button></div>
  {circuitLoading?<p className="hint">Carregando circuitos...</p>:savedCircuits.length===0?<p className="hint">Nenhum circuito salvo neste projeto.</p>:<div className="ep-circuit-list">{savedCircuits.map((x,i)=><button type="button" key={x.id} className="ep-circuit-list-item" onClick={()=>selectSavedCircuit(x)}><span className="ep-circuit-index">{String(i+1).padStart(2,'0')}</span><span>{x.title}</span><span className="ep-circuit-arrow">›</span></button>)}</div>}
  </section>{editorOpen&&<div className="ep-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!circuitBusy)clearCircuit()}}><div className="ep-circuit-editor" role="dialog" aria-modal={true} aria-label={selectedCircuitId?'Editar circuito':'Novo circuito'}><div className="ep-editor-heading"><h2>{selectedCircuitId?(viewMode?circuitTitle:'Editar circuito'):'Novo circuito'}</h2>{<button type="button" className="ep-close" aria-label="Fechar" disabled={circuitBusy} onClick={clearCircuit}><X size={20}/></button>}</div>{viewMode&&selectedCircuitId?<section className="panel ep-circuit-details"><div className="ep-summary">
 <div className="ep-summary-grid"><div><span>Seção do condutor</span><strong>{selectedSection===null?'—':`${fmt(selectedSection)} mm²`}</strong></div><div><span>Disjuntor</span><strong>{breakerCandidate===null?'—':`${breakerCandidate} A`}</strong></div></div>
 <p className="hint">{circuit==='tug'&&/ilumina/i.test(circuitTitle)?'Atenção: este circuito está cadastrado como TUG, apesar do nome indicar iluminação. Clique em Editar e corrija o tipo para aplicar seção mínima de 1,5 mm². ':''}</p>
 <div className="ep-summary-actions"><button type="button" className="primary" onClick={()=>setViewMode(false)}>Editar</button><button type="button" className="outline" disabled={circuitBusy} onClick={()=>void deleteCircuit()}>Excluir</button><button type="button" className="outline" onClick={clearCircuit}>Fechar</button></div>
 </div></section>:<><section className="panel ep-circuit-details"><label>Ambiente associado (opcional)<select value={environmentId} onChange={e=>setEnvironmentId(e.target.value)}><option value="">Sem ambiente associado</option>{environmentOptions.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label>
  <label>Nome do circuito<input value={circuitTitle} onChange={e=>setCircuitTitle(e.target.value)} placeholder="Ex.: C1 - Iluminação da sala"/></label>

  {circuitStatus&&<p className="hint" role="status">{circuitStatus}</p>}
  </section><div className="sizing-layout"><section className="panel sizing-form"><h2>Dados do circuito</h2>
 <label>Tipo de circuito<select value={circuit} onChange={e=>{const next=e.target.value;setCircuit(next);setLoadLinks(old=>old.filter(link=>link.kind===next));if(loadMode==='rooms'&&next!=='lighting'&&next!=='tug')setLoadMode('manual')}}><option value="lighting">Iluminação</option><option value="tug">Tomadas de uso geral</option><option value="tue">Circuito dedicado / TUE</option><option value="motor">Motor / máquina</option><option value="feeder">Alimentador</option><option value="other">Outro</option></select></label>
 <div className="ep-load-links"><h3>Origem da carga</h3><label>Potência do circuito<select value={loadMode} onChange={e=>{setLoadMode(e.target.value as 'manual'|'rooms');setLoadLinks(old=>old.filter(link=>link.kind===circuit))}}><option value="manual">Informar potência manualmente</option><option value="rooms" disabled={circuit!=='lighting'&&circuit!=='tug'}>Somar cargas dos ambientes</option></select></label>
 {loadMode==='rooms'&&<><p className="hint">{circuit==='lighting'?'Selecione somente cargas de iluminação.':'Selecione somente cargas de tomadas (TUG).'} Cada carga pode pertencer a apenas um circuito.</p>
 {environmentOptions.map(room=>{const estimate=estimateRoom(room);return <div className="ep-room-pick" key={room.id}><strong>{room.title}</strong>{([circuit] as RoomLoadKind[]).filter(kind=>kind==='lighting'||kind==='tug').map(kind=>{const va=estimate?.[kind];const selected=loadLinks.some(x=>x.environmentId===room.id&&x.kind===kind);return <label key={kind}><input type="checkbox" disabled={va===null||va===undefined||savedCircuits.some(x=>x.id!==selectedCircuitId&&x.data?.loadMode==='rooms'&&Array.isArray(x.data.loadLinks)&&(x.data.loadLinks as CircuitLoadLink[]).some(y=>y.environmentId===room.id&&y.kind===kind))} checked={selected} onChange={e=>setLoadLinks(old=>e.target.checked?[...old,{environmentId:room.id,kind}]:old.filter(x=>!(x.environmentId===room.id&&x.kind===kind)))}/>{kind==='lighting'?'Iluminação':'Tomadas'} — {va===null||va===undefined?'Revisão manual':`${va} VA`}{savedCircuits.some(x=>x.id!==selectedCircuitId&&x.data?.loadMode==='rooms'&&Array.isArray(x.data.loadLinks)&&(x.data.loadLinks as CircuitLoadLink[]).some(y=>y.environmentId===room.id&&y.kind===kind))?' · Já vinculada a outro circuito':''}</label>})}</div>})}
 <div className="sizing-metric"><span>Carga total associada</span><strong>{loadLinks.length?`${roomCalculation.va.toLocaleString('pt-BR')} VA`:'—'}</strong></div>
 {roomCalculation.missing.length>0&&<p role="alert" className="sizing-warning">Existem ambientes removidos ou cargas sem estimativa. Revise as associações antes de salvar.</p>}
 <p className="hint">Para o dimensionamento preliminar, P = S × fator de potência geral. As cargas mínimas em VA não são tratadas diretamente como W.</p></>}
 </div>
 <h3>Dados elétricos</h3><label>Quantidade de circuitos agrupados<select value={groupCount} onChange={e=>setGroupCount(e.target.value)}>{Object.keys(grouping5410[settings.groupMode]||grouping5410.bundle).map(n=><option key={n} value={n}>{n}</option>)}</select></label><div className="two">{loadMode==='manual'&&<label>Potência ativa (W)<input type="number" min="0" step="any" value={power} onChange={e=>setPower(e.target.value)} placeholder="Ex.: 5400"/></label>}<label>Comprimento de ida (m)<input type="number" min="0" step="any" value={length} onChange={e=>setLength(e.target.value)} placeholder="Ex.: 15"/></label></div>
 <details className="ep-details"><summary>Parâmetros gerais utilizados</summary><p className="hint">Tensão: {voltage} V · Método: {method} · Temperatura: {temperature} °C · Material: {effectiveMaterial==='copper'?'cobre':'alumínio'}. Altere os padrões em Tipo de instalação.</p></details></section>
 <section className="panel sizing-results"><h2>Seção do condutor</h2><div className="sizing-metric"><span>Corrente de projeto (Ib)</span><strong>{current===null?'—':`${fmt(current)} A`}</strong></div><div className="sizing-metric"><span>Seção do condutor/Bitola</span><strong>{selectedSection===null?'—':`${String(selectedSection).replace('.',',')} mm²`}</strong></div>
 {noCompliantCandidate&&<div className="sizing-warning"><strong>Nenhuma seção aprovada no modelo experimental</strong><p>Não foi encontrada seção que atenda simultaneamente à corrente e ao limite provisório de 4% dentro da base provisória. Não use esse resultado para especificação.</p></div>}
 {current!==null&&!supported&&<div className="sizing-warning"><strong>Condição não contemplada</strong><p>Esta condição não está coberta pelas tabelas e hipóteses implementadas. Não é possível pré-selecionar a seção automaticamente.</p></div>}
 {noBreakerSolution&&<div className="sizing-warning"><strong>Sem combinação preliminar de cabo e disjuntor</strong><p>Há seção que atende à corrente e à queda estimada, mas nenhuma das seções disponíveis permite um disjuntor da lista com Ib ≤ In ≤ Iz. Não selecione um disjuntor acima da capacidade corrigida do condutor.</p></div>}
 {selectedCircuitId&&candidate!==null&&breakerCandidate!==null&&Number.isFinite(l)&&l>0&&<div className="sizing-formula"><strong>Enviar materiais ao cadastro do projeto</strong><p className="hint">Cabos separados por função e cor, com metragem inicial igual ao comprimento de ida para cada condutor. Ajuste cada quantidade e preço em Materiais. Em iluminação, o retorno é estimado com o mesmo comprimento; confirme o percurso real. A seção do PE é preliminar. Não inclui perdas nem reserva técnica.</p><button type="button" className="primary" disabled={materialSending} onClick={()=>void sendSizingMaterials(budgetCableItems({length:l,size:candidate.size,material:effectiveMaterial,insulation:effectiveInsulation,circuit,wiring:effectiveWiring,breaker:breakerCandidate,curve:tripCurve||'a confirmar',poles:effectiveWiring==='phase-neutral'?1:effectiveWiring==='phase-phase'?2:3}))}>{materialSending?'Salvando...':'Consolidar materiais deste circuito'}</button></div>}
 {candidate!==null&&current!==null&&<details className="sizing-formula"><summary>Ver memória de seleção automática</summary>
 <p>1. Corrente de projeto: Ib = {fmt(current)} A. Seção mínima considerada: {String(minSection).replace('.',',')} mm².</p>
 <p>2. Capacidade corrigida: Iz = Iz₀ × Ft × Fg, com Ft = {fmt(ft!)} e Fg = {fmt(fg!)}.</p>
 <p>3. Para cada seção comercial, verificar Iz ≥ Ib, queda resistiva estimada ≤ 4% e existência de In na lista com Ib ≤ In ≤ Iz.</p>
 <div style={{overflowX:'auto'}}><table style={{width:'100%',fontSize:'0.85em',borderCollapse:'collapse'}}><thead><tr><th style={{textAlign:'left',padding:'6px'}}>Seção</th><th style={{textAlign:'left',padding:'6px'}}>Iz</th><th style={{textAlign:'left',padding:'6px'}}>Queda</th><th style={{textAlign:'left',padding:'6px'}}>Decisão</th></tr></thead><tbody>
 {decisionSteps.map(x=><tr key={x.size} style={{borderTop:'1px solid #444'}}><td style={{padding:'6px',whiteSpace:'nowrap'}}>{String(x.size).replace('.',',')} mm²</td><td style={{padding:'6px'}}>{fmt(x.iz)} A</td><td style={{padding:'6px'}}>{fmt(x.percent)}%</td><td style={{padding:'6px'}}>{x.reason}{x.inRating!==null?` (In ${x.inRating} A)`:''}</td></tr>)}
 </tbody></table></div>
 <p><strong>Resultado:</strong> {String(candidate.size).replace('.',',')} mm² e disjuntor {breakerCandidate} A. {raisedForBreaker?'A seção aumentou para viabilizar a coordenação com disjuntor.':electricalCandidate&&currentOnly&&electricalCandidate.size>currentOnly.size?'A seção aumentou por queda de tensão.':'A primeira seção aprovada também permite a coordenação.'}</p>
 <small>Memória demonstrativa do modelo preliminar. Não substitui verificações normativas e características reais dos dispositivos.</small></details>}
 <div className="ep-breaker-section"><h2>Disjuntor</h2>
 <div className="sizing-metric"><span>Corrente nominal (In)</span><strong>{breakerCandidate===null?'—':`${breakerCandidate.toLocaleString('pt-BR',{maximumFractionDigits:0})} A`}</strong></div>
 <div className="sizing-metric"><span>Curva de disparo</span><strong>{breakerCandidate!==null&&tripCurve?`Curva ${tripCurve}`:'—'}</strong></div>
 </div>
 
  <span className="plan-chip">v0.7.29 · circuitos no Supabase</span></section></div>
 <div className="ep-modal-actions"><button type="button" className="primary" disabled={circuitBusy||circuitLoading||!circuitTitle.trim()||!Number.isFinite(p)||p<=0||!Number.isFinite(l)||l<=0} onClick={()=>void saveCircuit()}>{circuitBusy?'Salvando...':selectedCircuitId?'Atualizar circuito':'Salvar circuito'}</button>{selectedCircuitId&&<button type="button" className="outline" disabled={circuitBusy} onClick={()=>void deleteCircuit()}>Excluir circuito</button>}</div></>}<button type="button" className="outline ep-modal-close-bottom" onClick={clearCircuit} disabled={circuitBusy}>Fechar</button></div></div>}</>
}

type PanelConnection='A'|'B'|'C'|'AB'|'BC'|'CA'|'ABC';
// Fatores de demanda só podem reduzir cargas quando existe critério explícito no projeto.
type DemandCategory='lighting'|'tug'|'tue'|'other';
const demandCategory=(row:SavedCircuit):DemandCategory=>{
 const kind=String(row.data.circuit||'').toLowerCase();
 return kind==='lighting'?'lighting':kind==='tug'?'tug':kind==='tue'?'tue':'other';
};
const defaultDemandFactors:Record<DemandCategory,number>={lighting:1,tug:1,tue:1,other:1};
const demandLabels:Record<DemandCategory,string>={lighting:'Iluminação',tug:'TUG',tue:'TUE',other:'Outras cargas'};
const demandCategories:DemandCategory[]=['lighting','tug','tue','other'];
const normalizeDemandFactors=(input:unknown):Record<DemandCategory,number>=>{
 const raw=(input&&typeof input==='object'?input:{}) as Record<string,unknown>;
 return Object.fromEntries(demandCategories.map(k=>{const v=Number(raw[k]);return [k,Number.isFinite(v)&&v>0&&v<=1?v:1]})) as Record<DemandCategory,number>;
};

// Subclassificação informativa dos equipamentos. Não atribui fatores de simultaneidade sem metodologia aprovada.
type DemandGroup='lighting'|'tug_wet'|'tug_other'|'shower'|'electric_tap'|'cooking'|'air_conditioning'|'other_tue'|'other';
const demandGroupLabels:Record<DemandGroup,string>={lighting:'Iluminação',tug_wet:'TUG — cozinha/serviço',tug_other:'TUG — demais ambientes',shower:'Chuveiros elétricos',electric_tap:'Torneiras elétricas',cooking:'Cocção elétrica',air_conditioning:'Ar-condicionado',other_tue:'Outras TUE',other:'Outras cargas'};
const demandGroupOrder:DemandGroup[]=['lighting','tug_wet','tug_other','shower','electric_tap','cooking','air_conditioning','other_tue','other'];
const defaultGroupFactors=Object.fromEntries(demandGroupOrder.map(k=>[k,1])) as Record<DemandGroup,number>;
const normalizeGroupFactors=(raw:unknown)=>{const data=(raw&&typeof raw==='object'?raw:{}) as Record<string,unknown>;return Object.fromEntries(demandGroupOrder.map(k=>{const v=Number(data[k]);return [k,Number.isFinite(v)&&v>0&&v<=1?v:1]})) as Record<DemandGroup,number>};
const groupDemandFactor=(row:SavedCircuit,factors:Record<DemandGroup,number>)=>factors[demandGroup(row)];
const demandGroup=(row:SavedCircuit):DemandGroup=>{
 const kind=demandCategory(row),name=String(row.title||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(kind==='lighting')return 'lighting';
 if(kind==='tug')return /cozinha|lavanderia|area de servico|servico|copa/.test(name)?'tug_wet':'tug_other';
 if(kind==='tue'){
  if(/chuveiro|ducha/.test(name))return 'shower';
  if(/torneira/.test(name))return 'electric_tap';
  if(/fogao|cooktop|forno|inducao/.test(name))return 'cooking';
  if(/ar condicionado|ar-condicionado|split|climatiz/.test(name))return 'air_conditioning';
  return 'other_tue';
 }
 return 'other';
};
// Auditoria de demanda: classificação e potência aparente por circuito, sem inventar coeficientes normativos.
const demandCircuitVA=(row:SavedCircuit,defaultPf:number)=>{
 const va=Number(row.data.powerVA);
 if(Number.isFinite(va)&&va>0)return va;
 const w=Number(row.data.power),pf=Number(row.data.pf||defaultPf);
 return Number.isFinite(w)&&w>0&&Number.isFinite(pf)&&pf>0&&pf<=1?w/pf:0;
};
const demandCircuitSource=(row:SavedCircuit)=>Number(row.data.powerVA)>0?'Carga em VA registrada no circuito':'Potência W convertida usando fator de potência cadastrado';
const demandCircuitIssues=(row:SavedCircuit,defaultPf:number)=>{
 const issues:string[]=[];
 if(!['lighting','tug','tue'].includes(String(row.data.circuit||'').toLowerCase()))issues.push('Tipo de circuito não classificado');
 if(demandCircuitVA(row,defaultPf)<=0)issues.push('Potência aparente não disponível');
 if(row.data.loadMode==='rooms'&&!Array.isArray(row.data.loadLinks))issues.push('Vínculo com ambientes incompleto');
 return issues;
};
const circuitDemandFactor=(row:SavedCircuit,factors:Record<DemandCategory,number>)=>factors[demandCategory(row)];
const circuitDemandCurrent=(row:SavedCircuit,factors:Record<DemandCategory,number>)=>panelCurrent(row)*circuitDemandFactor(row,factors);
const panelCurrent=(row:SavedCircuit)=>{const results=(row.data.results||{}) as Record<string,unknown>;const n=Number(results.current);return Number.isFinite(n)&&n>0?n:0};
// v0.7.49: corrente de cada ligação calculada a partir da potência aparente e tensão efetiva.
// Não substitui silenciosamente os resultados persistidos dos circuitos terminais.
const feederCircuitElectrical=(row:SavedCircuit,settings:InstallationSettings)=>{
 const poles=panelPoles(row,settings);
 const va=demandCircuitVA(row,Number(settings.powerFactor));
 const vfn=Number(settings.voltageFN)||Number(settings.voltage);
 const vff=Number(settings.voltageFF);
 const voltage=poles===1?vfn:vff;
 const divisor=poles===3?Math.sqrt(3)*voltage:voltage;
 const current=va>0&&divisor>0?va/divisor:NaN;
 const saved=panelCurrent(row);
 const relativeDifference=Number.isFinite(current)&&current>0?Math.abs(saved-current)/current:Infinity;
 return {poles,va,voltage,current,saved,relativeDifference};
};
const panelPoles=(row:SavedCircuit,settings:InstallationSettings)=>{
 const wiring=String(row.data.wiring||settings.wiring);
 return wiring==='three'?3:wiring==='phase-phase'?2:1;
};
// Soma fasorial das correntes dos condutores: cargas FN, FF e trifásicas equilibradas.
// Atribui-se a cada circuito seu próprio fator de potência quando cadastrado.
// Em falta de FP individual, utiliza-se o FP geral. Correntes harmônicas não são modeladas.
type ComplexCurrent={re:number;im:number};
const phaseVectors=(rows:SavedCircuit[],settings:InstallationSettings,factor:(c:SavedCircuit)=>number)=>{
 const phases=settings.supply==='three'?['A','B','C']:settings.supply==='two'?['A','B']:['A'];
 const angles:Record<string,number>={A:0,B:-2*Math.PI/3,C:2*Math.PI/3};
 // Em sistema bifásico de duas fases da rede trifásica, A/B têm 120° entre si.
 const vectors:Record<string,ComplexCurrent>=Object.fromEntries(phases.map(p=>[p,{re:0,im:0}]));
 const add=(p:string,amp:number,angle:number)=>{if(!vectors[p])return;vectors[p].re+=amp*Math.cos(angle);vectors[p].im+=amp*Math.sin(angle)};
 for(const row of rows){
  const choices=panelChoices(settings,panelPoles(row,settings));
  const stored=String(row.data.panelConnection||row.data.panelPhase||'');
  const connection=choices.includes(stored as PanelConnection)?stored:choices[0];
  const current=feederCircuitElectrical(row,settings).current*factor(row);
  const pfRaw=Number(row.data.pf||settings.powerFactor);
  const pf=Number.isFinite(pfRaw)&&pfRaw>0&&pfRaw<=1?pfRaw:1;
  const lag=Math.acos(pf);
  if(connection.length===1){add(connection,current,angles[connection]-lag);continue}
  if(connection.length===3){for(const phase of connection)add(phase,current,angles[phase]-lag);continue}
  const [first,second]=connection.split('');
  // Tensão entre fases Vfirst-Vsecond; corrente entra pela primeira e retorna pela segunda.
  const va={re:Math.cos(angles[first]),im:Math.sin(angles[first])};
  const vb={re:Math.cos(angles[second]),im:Math.sin(angles[second])};
  const angle=Math.atan2(va.im-vb.im,va.re-vb.re)-lag;
  add(first,current,angle);add(second,current,angle+Math.PI);
 }
 return vectors;
};
const phaseCurrents=(rows:SavedCircuit[],settings:InstallationSettings,factor:(c:SavedCircuit)=>number)=>{
 const vectors=phaseVectors(rows,settings,factor);
 return Object.fromEntries(Object.entries(vectors).map(([p,v])=>[p,Math.hypot(v.re,v.im)])) as Record<string,number>;
};
// Limite superior conservador: soma dos módulos das correntes em cada condutor.
// Evita reduzir a seção do alimentador apenas por cancelamentos fasoriais presumidos.
const phaseCurrentUpperBounds=(rows:SavedCircuit[],settings:InstallationSettings,factor:(c:SavedCircuit)=>number)=>{
 const phases=settings.supply==='three'?['A','B','C']:settings.supply==='two'?['A','B']:['A'];
 const totals:Record<string,number>=Object.fromEntries(phases.map(p=>[p,0]));
 for(const row of rows){
  const choices=panelChoices(settings,panelPoles(row,settings));
  const stored=String(row.data.panelConnection||row.data.panelPhase||'');
  const connection=choices.includes(stored as PanelConnection)?stored:choices[0];
  const current=feederCircuitElectrical(row,settings).current*factor(row);
  for(const p of connection){if(p in totals)totals[p]+=current;}
 }
 return totals;
};
const neutralCurrent=(rows:SavedCircuit[],settings:InstallationSettings,factor:(c:SavedCircuit)=>number)=>{
 const vectors=phaseVectors(rows,settings,factor);
 const sum=Object.values(vectors).reduce((v,c)=>({re:v.re+c.re,im:v.im+c.im}),{re:0,im:0});
 return Math.hypot(sum.re,sum.im);
};
const panelChoices=(settings:InstallationSettings,poles:number):PanelConnection[]=>{
 if(settings.supply==='single')return ['A'];
 if(settings.supply==='two')return poles===2?['AB']:['A','B'];
 return poles===3?['ABC']:poles===2?['AB','BC','CA']:['A','B','C'];
};
function DistributionPanel({clientId,userId,settings}:{clientId:string;userId:string;settings:InstallationSettings}){
 const [rows,setRows]=useState<SavedCircuit[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [projectId,setProjectId]=useState('');
 const [groupFactors,setGroupFactors]=useState<Record<DemandGroup,number>>(defaultGroupFactors);
 const [demandMode,setDemandMode]=useState<'conservative'|'documented'>('conservative');
 useEffect(()=>{let live=true;void(async()=>{try{const id=await ensureEletriProject(clientId,userId);if(!supabase)return;const [r,pr]=await Promise.all([supabase.from('eletripro_circuits').select('id,title,data').eq('project_id',id).order('created_at',{ascending:true}),supabase.from('eletripro_projects').select('installation').eq('id',id).single()]);if(r.error)throw r.error;if(pr.error)throw pr.error;if(live){setRows((r.data||[]) as SavedCircuit[]);setProjectId(id);setGroupFactors(normalizeGroupFactors(pr.data?.installation?.demandGroupFactors));setDemandMode(pr.data?.installation?.demandMode==='documented'?'documented':'conservative')}}catch(e){if(live)setMessage('Erro ao carregar quadro: '+String(e))}finally{if(live)setLoading(false)}})();return()=>{live=false}},[clientId,userId]);
 const phases=settings.supply==='three'?['A','B','C']:settings.supply==='two'?['A','B']:['A'];
 const optionsFor=(row:SavedCircuit)=>panelChoices(settings,panelPoles(row,settings));
 const connectionFor=(row:SavedCircuit):PanelConnection=>{
  const options=optionsFor(row);const saved=String(row.data.panelConnection||row.data.panelPhase||'A') as PanelConnection;
  return options.includes(saved)?saved:options[0];
 };
 async function persistChanges(changes:{id:string;connection:PanelConnection}[]){
  if(!supabase||!projectId||busy||changes.length===0)return;
  setBusy(true);setMessage('');
  let next=[...rows];let updated=0;
  for(const change of changes){
   const row=next.find(x=>x.id===change.id);if(!row)continue;
   const data={...row.data,panelConnection:change.connection,panelPhase:change.connection};
   const result=await supabase.from('eletripro_circuits').update({data,updated_at:new Date().toISOString()}).eq('id',row.id).eq('project_id',projectId);
   if(result.error){setMessage(`Foram salvos ${updated} de ${changes.length} circuitos. Erro em ${row.title}: ${result.error.message}`);break}
   next=next.map(x=>x.id===row.id?{...x,data}:x);updated++;
  }
  setRows(next);if(updated===changes.length)setMessage(updated===1?'Circuito atualizado.':`${updated} circuitos atualizados.`);setBusy(false);
 }
 const sums=Object.fromEntries(phases.map(p=>[p,rows.reduce((n,row)=>n+(connectionFor(row).includes(p)?panelCurrent(row):0),0)])) as Record<string,number>;
 const factorFor=(row:SavedCircuit)=>demandMode==='documented'?groupDemandFactor(row,groupFactors):1;
 const demandSums=phaseCurrents(rows,settings,factorFor);
 const balance=()=>{
  if(busy||!rows.length)return;
  const loads=Object.fromEntries(phases.map(p=>[p,0])) as Record<string,number>;
  const assigned=new Map<string,PanelConnection>();
  // Cargas multipolares são mantidas na ligação válida e entram em cada fase envolvida.
  rows.filter(row=>optionsFor(row).length===1).forEach(row=>{const conn=connectionFor(row);assigned.set(row.id,conn);for(const p of phases)if(conn.includes(p))loads[p]+=panelCurrent(row)*factorFor(row)});
  rows.filter(row=>optionsFor(row).length>1).sort((a,b)=>panelCurrent(b)*factorFor(b)-panelCurrent(a)*factorFor(a)).forEach(row=>{
   const choices=optionsFor(row);const choice=[...choices].sort((a,b)=>{
    const loadA=Math.max(...phases.filter(p=>a.includes(p)).map(p=>loads[p]+panelCurrent(row)*factorFor(row)));
    const loadB=Math.max(...phases.filter(p=>b.includes(p)).map(p=>loads[p]+panelCurrent(row)*factorFor(row)));
    return loadA-loadB;
   })[0];assigned.set(row.id,choice);for(const p of phases)if(choice.includes(p))loads[p]+=panelCurrent(row)*factorFor(row);
  });
  const changes=rows.filter(row=>assigned.get(row.id)!==connectionFor(row)).map(row=>({id:row.id,connection:assigned.get(row.id)!}));
  if(!changes.length){setMessage('Nenhuma alteração necessária para a distribuição automática.');return}
  if(window.confirm(`Distribuir automaticamente ${changes.length} circuito(s) pelas fases? As atribuições atuais desses circuitos serão substituídas.`))void persistChanges(changes);
 };
 const numberBR=(n:number)=>n.toLocaleString('pt-BR',{maximumFractionDigits:1});
 return <section className="panel"><div className="panel-heading"><h2>Quadro de distribuição</h2>{phases.length>1&&<button type="button" className="outline" disabled={busy||loading||!rows.length} onClick={balance}>Distribuir fases automaticamente</button>}</div>
 <p className="hint">Confira a distribuição por fase. O balanceamento automático depende de confirmação para não alterar ligações físicas já definidas.</p>
 {loading?<p>Carregando...</p>:rows.length===0?<p>Nenhum circuito cadastrado.</p>:<div className="ep-distribution-list">{rows.map((row,i)=>{const result=(row.data.results||{}) as Record<string,unknown>;const poles=panelPoles(row,settings);const choices=optionsFor(row);return <div className="ep-distribution-item ep-panel-circuit" key={row.id}><span className="ep-record-number">{String(i+1).padStart(2,'0')}</span><div className="ep-panel-circuit-info"><strong>{row.title}</strong><small>Disjuntor: {result.breaker?`${result.breaker} A`:'—'} · {poles} {poles===1?'polo':'polos'} · Bitola: {result.selectedSection?`${result.selectedSection} mm²`:'—'} · Ib: {panelCurrent(row)?`${numberBR(panelCurrent(row))} A`:'—'}</small></div><label>Fase(s)<select value={connectionFor(row)} disabled={busy||choices.length===1} onChange={e=>void persistChanges([{id:row.id,connection:e.target.value as PanelConnection}])}>{choices.map(p=><option key={p} value={p}>{p}</option>)}</select></label></div>})}</div>}
 <h3 className="ep-panel-subtitle">Resumo por fase</h3><div className="ep-summary-grid">{phases.map(p=><div key={p}><span>Corrente instalada — fase {p}</span><strong>{numberBR(sums[p])} A</strong><small>Corrente demandada: {numberBR(demandSums[p])} A</small></div>)}</div>
 <p className="hint">Corrente demandada considera os fatores técnicos registrados no Alimentador geral. Sem justificativa de redução, todos os fatores permanecem em 100%. Circuitos bipolares contribuem com correntes de retorno opostas e circuitos tripolares são considerados equilibrados. A soma fasorial considera o FP cadastrado. A quantidade de polos é estimada pela configuração da instalação e não substitui a verificação da ligação real. Não dimensiona barramentos, DR, DPS ou curto-circuito.</p>{message&&<p role="status">{message}</p>}</section>;
}


type FeederForm={demandFactor:string;length:string;voltage:string;powerFactor:string;maxDrop:string;groupCount:string;neutralSection:string;breaker:string;notes:string};
const feederDefault:FeederForm={demandFactor:'1',length:'15',voltage:'',powerFactor:'',maxDrop:'4',groupCount:'1',neutralSection:'',breaker:'',notes:''};
const feederBreakers=[10,16,20,25,32,40,50,63,80,100,125,160,200,225,250,315,400,500,630];
const feederFormat=(n:number)=>n.toLocaleString('pt-BR',{maximumFractionDigits:2});
function FeederPanel({clientId,userId,settings}:{clientId:string;userId:string;settings:InstallationSettings}){
 const [circuits,setCircuits]=useState<SavedCircuit[]>([]);
 const [length,setLength]=useState('15');
 const [projectId,setProjectId]=useState('');
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[message,setMessage]=useState('');
 const [details,setDetails]=useState(false);
 const [demandJustification,setDemandJustification]=useState('');
 const [groupFactors,setGroupFactors]=useState<Record<DemandGroup,number>>(defaultGroupFactors);
 const [demandMode,setDemandMode]=useState<'conservative'|'documented'>('conservative');
 useEffect(()=>{let live=true;void(async()=>{try{
  const id=await ensureEletriProject(clientId,userId);
  const [pr,cr]=await Promise.all([supabase.from('eletripro_projects').select('installation').eq('id',id).single(),supabase.from('eletripro_circuits').select('id,title,data').eq('project_id',id)]);
  if(pr.error)throw pr.error;if(cr.error)throw cr.error;
  if(live){setProjectId(id);setCircuits((cr.data||[]) as SavedCircuit[]);const previous=pr.data?.installation?.feeder;if(previous?.length)setLength(String(previous.length));setGroupFactors(normalizeGroupFactors(pr.data?.installation?.demandGroupFactors));setDemandMode(pr.data?.installation?.demandMode==='documented'?'documented':'conservative');setDemandJustification(String(pr.data?.installation?.demandJustification||''))}
 }catch(e){if(live)setMessage('Falha ao carregar alimentador: '+String(e))}finally{if(live)setLoading(false)}})();return()=>{live=false}},[clientId,userId]);
 const len=Number(length),voltage=Number(settings.voltage),pf=Number(settings.powerFactor);
 const voltageFN=Number(settings.voltageFN),voltageFF=Number(settings.voltageFF);
 const voltageConfirmed=settings.supply==='single'||(voltageFN>0&&voltageFF>0&&voltageFF>voltageFN);
 const sumPower=circuits.reduce((a,c)=>a+(Number(c.data.power)||0),0);
 const sumVA=circuits.reduce((a,c)=>a+demandCircuitVA(c,pf),0);
 const effectiveFactor=(c:SavedCircuit)=>demandMode==='documented'?groupDemandFactor(c,groupFactors):1;
 const demandedVA=circuits.reduce((a,c)=>a+demandCircuitVA(c,pf)*effectiveFactor(c),0);
 const demandAudit=circuits.map(c=>({c,category:demandCategory(c),group:demandGroup(c),va:demandCircuitVA(c,pf),issues:demandCircuitIssues(c,pf)}));
 const groupTotals=demandGroupOrder.map(group=>({group,items:demandAudit.filter(x=>x.group===group)})).filter(x=>x.items.length>0);
 const demandTotals=Object.fromEntries(demandCategories.map(k=>[k,demandAudit.filter(x=>x.category===k).reduce((a,x)=>a+x.va,0)])) as Record<DemandCategory,number>;
 const auditIssues=demandAudit.flatMap(x=>x.issues.map(issue=>`${x.c.title}: ${issue}`));
 const demand=sumVA>0?demandedVA/sumVA:1; // Sem base de demanda validada, 100% da carga. Não inventar fator redutor.
 // Alimentador bifásico L1+L2+N: adota conservadoramente três condutores carregados.
 const three=settings.supply==='three',loaded=settings.supply==='single'?'2':'3';
 const phaseDemand=phaseCurrents(circuits,settings,effectiveFactor);
 const phaseUpperBounds=phaseCurrentUpperBounds(circuits,settings,effectiveFactor);
 // A demanda documentada permanece informativa até que a aplicabilidade da norma seja verificada.
 // O dimensionamento automático NÃO pode ser reduzido por fatores manuais não validados.
 const phaseSizingBounds=phaseCurrentUpperBounds(circuits,settings,()=>1);
 const ib=Math.max(0,...Object.values(phaseSizingBounds));
 const neutralFundamental=neutralCurrent(circuits,settings,()=>1);
 // Critério preliminar conservador para a seção do neutro; não é a corrente fasorial prevista.
 const neutralIb=Math.max(neutralFundamental,...Object.values(phaseSizingBounds));
 const feederTopology=settings.supply==='three'?'L1 + L2 + L3 + N + PE':settings.supply==='two'?'L1 + L2 + N + PE':'L1 + N + PE';
 const method=settings.method,material=settings.conductorMaterial,insulation=settings.conductorInsulation;
 const table=ampacity5410[insulation]?.[material]?.[method]?.[loaded];
 const ft=temperature5410[insulation]?.[settings.temperature],fg=grouping5410[settings.groupMode]?.[settings.groupCount];
 const errors:string[]=[];
 if(!voltageConfirmed)errors.push('Informe VFN e VFF válidas no Tipo de instalação para validar o alimentador multifásico.');
 if(settings.supply!=='single'&&voltageConfirmed&&Math.abs(voltageFF/voltageFN-Math.sqrt(3))>0.08)errors.push('Relação VFF/VFN incompatível com o modelo de fases defasadas de 120°. Revise o fornecimento.');
 if(circuits.some(c=>!(feederCircuitElectrical(c,settings).current>0)))errors.push('Existem circuitos sem corrente de projeto válida; revise o dimensionamento dos circuitos.');
 // Circuitos terminais não são recalculados/salvos automaticamente: divergência bloqueia a aprovação do alimentador.
 for(const c of circuits){
  const e=feederCircuitElectrical(c,settings);
  if(!(e.voltage>0&&Number.isFinite(e.current)&&e.current>0))errors.push(`${c.title}: tensão ou potência incompatível com a ligação elétrica; confirme VFN/VFF.`);
  else if(e.relativeDifference>0.05)errors.push(`${c.title}: corrente terminal salva (${feederFormat(e.saved)} A) diverge da corrente calculada em ${feederFormat(e.voltage)} V (${feederFormat(e.current)} A). Redimensione o circuito antes de salvar o alimentador.`);
 }
 const reducedDemand=demandMode==='documented'&&demandGroupOrder.some(k=>groupFactors[k]<1);
 if(demandMode==='documented'&&demandGroupOrder.some(k=>!(groupFactors[k]>0&&groupFactors[k]<=1)))errors.push('Os fatores por grupo devem estar entre 0 e 1.');
 if(reducedDemand&&demandJustification.trim().length<12)errors.push('Informe a referência técnica dos fatores de demanda reduzidos na memória de cálculo.');
 if(!circuits.length)errors.push('Cadastre os circuitos terminais antes de dimensionar o alimentador.');
 if(auditIssues.length)errors.push('Existem pendências na auditoria de cargas. Consulte a memória de cálculo.');
 if(circuits.some(c=>!(Number(c.data.power)>0)))errors.push('Há circuitos sem potência válida.');
 if(!(voltage>0&&pf>0&&pf<=1))errors.push('Revise tensão e fator de potência em Tipo de instalação.');
 if(!(len>0&&Number.isFinite(len)))errors.push('Informe uma distância positiva em metros.');
 if(!table||ft===undefined||fg===undefined)errors.push('Revise método de instalação, temperatura e agrupamento em Tipo de instalação.');
 if(material==='aluminum')errors.push('Dimensionamento automático de alumínio indisponível; requer validação técnica.');
 if(settings.supply!=='three'&&circuits.some(c=>panelPoles(c,settings)===3))errors.push('Existem circuitos tripolares em alimentação não trifásica; revise as ligações.');
 if(settings.supply==='single'&&circuits.some(c=>panelPoles(c,settings)===2))errors.push('Existem circuitos bipolares em alimentação monofásica; revise as ligações.');
 // Etapa G: auditoria de conexões e proteções antes de autorizar o salvamento.
 // A seleção visual de uma fase não substitui o registro de uma ligação elétrica válida.
 for(const c of circuits){
  const poles=panelPoles(c,settings);
  const choices=panelChoices(settings,poles);
  const stored=String(c.data.panelConnection||c.data.panelPhase||'');
  if(!stored)errors.push(`${c.title}: ligação de fase não confirmada no quadro de distribuição; atribua a ligação antes de dimensionar o alimentador.`);
  if(stored&&!choices.includes(stored as PanelConnection))errors.push(`${c.title}: ligação ${stored} incompatível com o fornecimento; revise o quadro de distribuição.`);
  const result=(c.data.results||{}) as Record<string,unknown>;
  const circuitBreaker=Number(result.breaker);
  if(!Number.isFinite(circuitBreaker)||circuitBreaker<=0)errors.push(`${c.title}: disjuntor terminal não dimensionado.`);
  else if(feederCircuitElectrical(c,settings).current>circuitBreaker+1e-6)errors.push(`${c.title}: corrente de projeto recalculada supera o disjuntor terminal.`);
  const circuitSection=Number(result.selectedSection);
  if(!Number.isFinite(circuitSection)||circuitSection<=0)errors.push(`${c.title}: seção do circuito terminal não dimensionada.`);
 }
 if(reducedDemand){
  // A indicação genérica de uma norma não documenta um fator de demanda.
  // A referência é declarada pelo responsável técnico e não validada automaticamente.
  const reference=demandJustification.trim();
  if(!/(celesc|nbr|norma|manual|projeto)/i.test(reference)||!/(tabela|item|seção|secao|anexo|memória|memoria)/i.test(reference)||!/(19|20)\d{2}/.test(reference))
   errors.push('Para utilizar demanda reduzida, registre documento, ano/edição e tabela/item aplicável. A referência declarada não é verificada automaticamente.');
 }

 // Reserva conservadora de queda para circuitos terminais: 2% no alimentador,
 // sem alegar conformidade da queda total (ainda requer cálculo específico).
 const feederDropBudget=2;
 const rho=0.0225;
 const candidates=Object.entries(table||{}).map(([section,base])=>{
  const size=Number(section),iz=base*(ft||0)*(fg||0);
  const drop=2*ib*rho*len/size; // Limite resistivo conservador para percurso de ida e retorno; requer validação do esquema real.
  const dropPercent=100*drop/(voltageFN>0?voltageFN:voltage);
  const breaker=feederBreakers.find(n=>n>=ib-1e-9&&n<=iz+1e-9);
  return {size,iz,dropPercent,breaker};
 }).filter(x=>x.size>=6).sort((a,b)=>a.size-b.size);
 // O orçamento preliminar de 2% é apenas deste trecho; a queda total precisa ser verificada.
 // Em sistemas desequilibrados, adota-se a maior corrente fasorial por fase para a ampacidade.
 // A queda estimada é resistiva e simplificada; reatância e impedância do neutro exigem revisão.
 const chosen=errors.length?undefined:candidates.find(x=>x.iz>=ib&&x.iz>=neutralIb&&x.dropPercent<=feederDropBudget&&x.breaker);
 const neutral=chosen?.size||0,pe=chosen?peSection(chosen.size):0; // Neutro integral, sujeito a verificação de harmônicas.
 const fmt=(n:number)=>Number.isFinite(n)?feederFormat(n):'—';
 async function save(){
  if(!projectId||saving||!chosen||errors.length)return;
  setSaving(true);setMessage('');
  try{
   const pr=await supabase.from('eletripro_projects').select('installation').eq('id',projectId).eq('owner_id',userId).single();
   if(pr.error)throw pr.error;
   const installation={...(pr.data?.installation||{}),demandJustification,demandGroupFactors:groupFactors,demandMode,feeder:{length,demandFactor:String(demand),voltage:String(voltage),powerFactor:String(pf),maxDrop:String(feederDropBudget),groupCount:settings.groupCount,breaker:String(chosen.breaker),neutralSection:String(neutral),notes:demandJustification||'Demanda conservadora de 100%; verificar concessionária e demais critérios.',calculation:{power:sumPower,demand,demandedVA,phaseDemand,phaseUpperBounds,phaseSizingBounds,neutralIb,neutralFundamental,feederTopology,supply:settings.supply,voltageFN,voltageFF,ib,section:chosen.size,iz:chosen.iz,dropPercent:chosen.dropPercent,pe,neutral,breaker:chosen.breaker,loaded,method,material,insulation,temperature:settings.temperature,groupMode:settings.groupMode,groupCount:Number(settings.groupCount),updatedAt:new Date().toISOString()}}};
   const res=await supabase.from('eletripro_projects').update({installation,updated_at:new Date().toISOString()}).eq('id',projectId).eq('owner_id',userId);
   if(res.error)throw res.error;setMessage('✓ Pré-dimensionamento salvo. Não liberado para execução sem validação técnica da queda total, curto-circuito e proteção.');
  }catch(e){setMessage('Erro ao salvar: '+String(e))}finally{setSaving(false)}
 }
 return <section className="panel sizing-form"><h2>Alimentador geral do quadro de distribuição</h2>
 <p className="hint">A EletriPro utiliza automaticamente os circuitos e os parâmetros de Tipo de instalação. O disjuntor indicado é o do quadro de distribuição, não o da caixa de medição.</p>
 <p className="hint"><strong>Composição do alimentador (fornecimento da concessionária): {feederTopology}.</strong> O campo ‘Composição dos condutores’ do cadastro de instalação se aplica aos circuitos internos e não altera a topologia do alimentador. A presença do neutro deve ser confirmada no padrão de fornecimento real.</p>
 <p className="hint" role="note">Tensão dos circuitos cadastrada: {fmt(voltage)} V. Alimentação: VFN {voltageFN>0?fmt(voltageFN):"não informada"} V; VFF {voltageFF>0?fmt(voltageFF):"não informada"} V. Os circuitos existentes não são convertidos automaticamente. Confira a tensão e a ligação de cada circuito antes do projeto executivo.</p>
 {loading?<p>Carregando circuitos...</p>:<>
 <div className="two"><label>Distância da caixa de medição até o QD (m)<input type="number" min="0.1" step="0.1" value={length} onChange={e=>{setLength(e.target.value);setMessage('')}}/></label></div>
 <div className="ep-summary-grid">
 <div><span>Condutor de fase</span><strong>{chosen?fmt(chosen.size)+' mm²':'—'}</strong></div>
 <div><span>Disjuntor geral do QD</span><strong>{chosen?fmt(chosen.breaker||0)+' A':'—'}</strong></div>
 <div><span>Condutor neutro (preliminar)</span><strong>{chosen?fmt(neutral)+' mm²':'—'}</strong></div>
 <div><span>Condutor de proteção PE (preliminar)</span><strong>{chosen?fmt(pe)+' mm²':'—'}</strong></div>
 </div>
 <button type="button" className="secondary" onClick={()=>setDetails(v=>!v)}>{details?'Ocultar memória de cálculo':'Mostrar memória de cálculo'}</button>
 {details&&<div className="panel"><h3>Auditoria automática das cargas</h3><p className="hint">A EletriPro identifica o tipo e a potência aparente de cada circuito. Os ambientes vinculados alimentam os circuitos, mas não são somados novamente, evitando dupla contagem. A demanda por grupo é exibida para auditoria. O alimentador permanece dimensionado com 100% das cargas até a validação normativa dos fatores redutores.</p>
 <div className="ep-summary-grid">{demandCategories.map(k=><div key={k}><span>{demandLabels[k]}</span><strong>{fmt(demandTotals[k])} VA</strong><small>{demandAudit.filter(x=>x.category===k).length} circuito(s)</small></div>)}</div>
 <h4>Equipamentos identificados automaticamente</h4><div style={{overflowX:'auto'}}><table><thead><tr><th>Grupo de carga</th><th>Circuitos</th><th>Potência (VA)</th><th>Demanda considerada (VA)</th></tr></thead><tbody>{groupTotals.map(({group,items})=><tr key={group}><td>{demandGroupLabels[group]}</td><td>{items.length}</td><td>{fmt(items.reduce((a,x)=>a+x.va,0))}</td><td>{fmt(items.reduce((a,x)=>a+x.va*effectiveFactor(x.c),0))}</td></tr>)}</tbody></table></div><p className="hint">A identificação dos equipamentos usa o nome e o tipo dos circuitos. Confira as classificações abaixo; títulos genéricos podem exigir revisão. Os fatores documentados alteram somente a demanda informativa; não reduzem automaticamente o alimentador.</p><div style={{overflowX:'auto'}}><table><thead><tr><th>Circuito</th><th>Categoria</th><th>Equipamento identificado</th><th>Potência (VA)</th><th>Fator</th><th>Demanda (VA)</th><th>Origem</th></tr></thead><tbody>{demandAudit.map(({c,category,group,va})=><tr key={c.id}><td>{c.title}</td><td>{demandLabels[category]}</td><td>{demandGroupLabels[group]}</td><td>{fmt(va)}</td><td>{fmt(effectiveFactor(c))}</td><td>{fmt(va*effectiveFactor(c))}</td><td>{demandCircuitSource(c)}</td></tr>)}</tbody></table></div>
 {auditIssues.length>0?<div><strong>Pendências de cadastro</strong>{auditIssues.map((issue,i)=><p className="hint" key={i}>{issue}</p>)}</div>:<p className="hint">Todos os circuitos possuem categoria reconhecida e potência aparente disponível.</p>}
 </div>}
 {details&&<div className="panel"><h3>Auditoria de tensão e corrente por circuito</h3><p className="hint">Comparação informativa entre a corrente terminal salva e a corrente derivada da potência aparente e da tensão da ligação. Divergências superiores a 5% bloqueiam o salvamento; o circuito terminal precisa ser redimensionado individualmente.</p><div style={{overflowX:'auto'}}><table><thead><tr><th>Circuito</th><th>Ligação</th><th>Tensão (V)</th><th>VA</th><th>Ib salvo (A)</th><th>Ib por ligação (A)</th><th>Estado</th></tr></thead><tbody>{circuits.map(c=>{const e=feederCircuitElectrical(c,settings);return <tr key={c.id}><td>{c.title}</td><td>{String(c.data.panelConnection||c.data.panelPhase||'não atribuída')}</td><td>{fmt(e.voltage)}</td><td>{fmt(e.va)}</td><td>{fmt(e.saved)}</td><td>{fmt(e.current)}</td><td>{e.relativeDifference<=0.05?'Conferido':'Revisar circuito'}</td></tr>})}</tbody></table></div></div>}
 {details&&<div className="panel"><h3>Critérios de demanda por grupo</h3><p className="hint">Sem uma tabela de demanda aplicável e documentada, o modo conservador considera 100% das cargas. A EletriPro não inventa fatores normativos.</p>
 <label>Metodologia<select value={demandMode} onChange={e=>setDemandMode(e.target.value as 'conservative'|'documented')}><option value="conservative">Conservadora — 100% das cargas</option><option value="documented">Fatores por grupo — critérios documentados pelo responsável técnico</option></select></label>
 {demandMode==='documented'&&<><div className="two">{demandGroupOrder.map(k=><label key={k}>{demandGroupLabels[k]} — fator (0 a 1)<input type="number" min="0.01" max="1" step="0.01" value={groupFactors[k]} onChange={e=>setGroupFactors(o=>({...o,[k]:Number(e.target.value)}))}/></label>)}</div><label>Referência técnica, tabela e justificativa<input value={demandJustification} onChange={e=>setDemandJustification(e.target.value)} placeholder="Ex.: documento, edição/ano, tabela/item e condições de aplicação"/></label></>}
 </div>}
 {details&&<div className="panel"><h3>Rastreabilidade da seleção do alimentador</h3><p className="hint">As alternativas são avaliadas pela corrente conservadora por fase, capacidade corrigida e queda resistiva estimada exclusivamente neste trecho. A coluna decisão indica por que uma seção foi descartada. A aprovação é preliminar: reserva 2% de queda para este trecho, mas não contempla curto-circuito, seletividade nem queda total.</p><div style={{overflowX:'auto'}}><table><thead><tr><th>Seção (mm²)</th><th>Iz corrigida (A)</th><th>Queda (%)</th><th>Disjuntor (A)</th><th>Decisão</th></tr></thead><tbody>{candidates.map(x=><tr key={x.size}><td>{fmt(x.size)}</td><td>{fmt(x.iz)}</td><td>{fmt(x.dropPercent)}</td><td>{x.breaker?fmt(x.breaker):'—'}</td><td>{x.iz<ib?'Iz inferior à corrente de projeto':x.iz<neutralIb?'Neutro exige revisão':x.dropPercent>feederDropBudget?'Queda do trecho superior a '+feederDropBudget+'%':!x.breaker?'Sem disjuntor compatível':chosen?.size===x.size?'Primeira alternativa preliminar':'Alternativa possível'}</td></tr>)}</tbody></table></div></div>}
 {details&&<div className="ep-summary-grid">
 {([['Potência ativa dos circuitos',fmt(sumPower)+' W'],['Potência aparente considerada',fmt(sumVA)+' VA'],['Demanda adotada',fmt(demand*100)+' % (média ponderada)'],['Potência aparente demandada',fmt(demandedVA)+' VA'],['Corrente de projeto conservadora (Ib, 100% das cargas)',fmt(ib)+' A'],['Corrente estimada no neutro (fundamental)',fmt(neutralFundamental)+' A'],['Critério conservador para seção do neutro',fmt(neutralIb)+' A'],['Composição do alimentador',feederTopology],['Origem da composição','Fornecimento da concessionária (independente dos circuitos internos)'],...Object.entries(phaseDemand).map(([phase,current])=>['Fase '+phase+' — fasorial',fmt(current)+' A'] as [string,string]),...Object.entries(phaseUpperBounds).map(([phase,current])=>['Fase '+phase+' — limite conservador',fmt(current)+' A'] as [string,string]),...Object.entries(phaseSizingBounds).map(([phase,current])=>['Fase '+phase+' — limite para dimensionamento (100%)',fmt(current)+' A'] as [string,string][]),['Tensão dos circuitos',fmt(voltage)+' V'],['Tensão fase-neutro (VFN)',voltageFN>0?fmt(voltageFN)+' V':'não informada'],['Tensão fase-fase (VFF)',voltageFF>0?fmt(voltageFF)+' V':'não informada'],['Correntes recalculadas por ligação','FN: VFN; FF: VFF; trifásico: √3 × VFF'],['Método de instalação',method],['Condutores carregados (conservador)',loaded],['Temperatura',settings.temperature+' °C'],['Fator de temperatura',fmt(ft||0)],['Fator de agrupamento',fmt(fg||0)],['Capacidade corrigida (Iz)',chosen?fmt(chosen.iz)+' A':'—'],['Queda resistiva estimada',chosen?fmt(chosen.dropPercent)+' %':'—'],['Auditoria de conexões e proteções',errors.length?`${errors.length} pendência(s)`:'Sem pendências cadastrais'] ] as [string,string][]).map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}
 </div>}
 {errors.map((e,i)=><p key={i} className="hint" role="alert">{e}</p>)}
 {!errors.length&&!chosen&&<p className="hint" role="alert">Nenhuma combinação válida de condutor e disjuntor foi encontrada nas tabelas disponíveis.</p>}
 <p className="hint">Referência inicial de fornecimento: CELESC. A EletriPro não aplica automaticamente fatores de demanda da concessionária sem validação da edição, tabela e campo de aplicação. O cálculo do alimentador interno do QD não deve ser confundido com o dimensionamento do padrão de entrada.</p><p className="hint">Resultado preliminar: demanda conservadora de 100% por padrão. O dimensionamento utiliza a maior soma conservadora de correntes por fase, evitando subdimensionamento por cancelamento fasorial presumido. Fatores reduzidos são apenas informativos e não diminuem o alimentador automaticamente; a referência declarada não é verificada pelo sistema; após salvar, reabra o Quadro de distribuição para atualizar o resumo por fase. A queda de tensão calculada usa orçamento conservador de 2% apenas para o alimentador, não inclui reatância nem os circuitos terminais e NÃO comprova o limite total. Antes da execução, o responsável técnico deve validar demanda, queda total, curto-circuito, capacidade de interrupção, proteção contra choques, seletividade, neutro, PE e requisitos da concessionária.</p>
 <div className="ep-form-footer"><button className="primary" disabled={saving||!chosen||errors.length>0} onClick={()=>void save()}>{saving?'Salvando...':'Salvar dimensionamento do QD'}</button></div>
 {message&&<p role="status">{message}</p>}
 </>}</section>;
}

type MaterialRow={id:string;description:string;quantity:number;unit:string;unit_price:number;item_type?:'material'|'labor'};
type GeneratedMaterial=MaterialRow & {source_key:string|null};

async function ensureEletriProject(clientId:string,userId:string){
 if(!supabase)throw new Error('Supabase indisponível');
 const found=await supabase.from('eletripro_projects').select('id').eq('client_id',clientId).maybeSingle();
 if(found.error)throw found.error;
 if(found.data?.id)return String(found.data.id);
 const created=await supabase.from('eletripro_projects').insert({client_id:clientId,owner_id:userId}).select('id').single();
 if(created.error){
  // Outra aba/dispositivo pode ter criado o projeto simultaneamente.
  const retry=await supabase.from('eletripro_projects').select('id').eq('client_id',clientId).maybeSingle();
  if(retry.data?.id)return String(retry.data.id);
  throw created.error;
 }
 return String(created.data.id);
}
// v0.7.39: sincronização automática por circuito; preserva preços e itens manuais.
function generatedCircuitItems(c:SavedCircuit){
 const d=c.data||{},r=(d.results||{}) as Record<string,unknown>;
 const section=Number(r.selectedSection),breaker=Number(r.breaker),length=Number(d.length);
 if(!(section>0&&breaker>0&&length>0))return null;
 const cfg=(d.installationSnapshot||defaultInstallation) as InstallationSettings;
 const wiring=String(d.wiring||cfg.wiring||'phase-neutral');
 const list=budgetCableItems({length,size:section,material:String(d.material||cfg.conductorMaterial||'copper'),insulation:String(d.insulation||cfg.conductorInsulation||'PVC 70 °C'),circuit:String(d.circuit||'tug'),wiring,breaker,curve:String(r.curve||'a confirmar'),poles:wiring==='phase-neutral'?1:wiring==='phase-phase'?2:3});
 return list.map((item,i)=>({description:item.description,quantity:item.quantity,unit:item.unit,source_key:`${c.id}:${item.description.includes('Disjuntor')?'breaker':item.description.includes('(Fase)')?'phase':item.description.includes('(Neutro)')?'neutral':item.description.includes('(Retorno)')?'return':item.description.includes('(Proteção (PE))')?'pe':i}`}));
}
async function syncCircuitMaterials(projectId:string,circuit:SavedCircuit|null,removedId?:string){
 if(!supabase)throw new Error('Supabase indisponível');
 const id=removedId||circuit?.id;
 if(!id)return;
 const found=await supabase.from('eletripro_materials').select('id,source_key,description,quantity,unit,unit_price').eq('project_id',projectId).not('source_key','is',null);
 if(found.error)throw found.error;
 const existing=((found.data||[]) as GeneratedMaterial[]).filter(x=>x.source_key?.startsWith(id+':'));
 const desired=circuit?generatedCircuitItems(circuit):[];
 // Sem dimensionamento válido, não apaga materiais existentes: exige revisão.
 if(desired===null)throw new Error('Circuito sem dimensionamento completo. Materiais anteriores preservados para revisão.');
 for(const item of desired||[]){
  const old=existing.find(x=>x.source_key===item.source_key);
  const r=old?await supabase.from('eletripro_materials').update({description:item.description,quantity:item.quantity,unit:item.unit}).eq('id',old.id).eq('project_id',projectId):await supabase.from('eletripro_materials').insert({project_id:projectId,...item,unit_price:0,item_type:'material'});
  if(r.error)throw r.error;
 }
 const stale=existing.filter(x=>!(desired||[]).some(y=>y.source_key===x.source_key));
 if(stale.length){const r=await supabase.from('eletripro_materials').delete().eq('project_id',projectId).in('id',stale.map(x=>x.id));if(r.error)throw r.error;}
}
// Orçamento operacional único, separado dos orçamentos históricos.
const UNIFIED_BUDGET_TITLE='Lista unificada — Materiais e mão de obra';
async function syncUnifiedBudget(projectId:string){
 if(!supabase)throw new Error('Supabase indisponível');
 const m=await supabase.from('eletripro_materials').select('description,quantity,unit,unit_price,item_type').eq('project_id',projectId);
 if(m.error)throw m.error;
 const b=await supabase.from('eletripro_budgets').select('id').eq('project_id',projectId).eq('title',UNIFIED_BUDGET_TITLE).maybeSingle();
 if(b.error)throw b.error;
 let budgetId=b.data?.id as string|undefined;
 if(!budgetId){const created=await supabase.from('eletripro_budgets').insert({project_id:projectId,title:UNIFIED_BUDGET_TITLE,status:'rascunho'}).select('id').single();if(created.error)throw created.error;budgetId=created.data.id;}
 // Nunca reescrever itens de orçamento histórico: apenas o orçamento operacional.
 const existing=await supabase.from('eletripro_budget_items').select('id').eq('budget_id',budgetId);
 if(existing.error)throw existing.error;
 if(existing.data?.length){const del=await supabase.from('eletripro_budget_items').delete().eq('budget_id',budgetId);if(del.error)throw del.error;}
 const items=(m.data||[]).map(x=>({budget_id:budgetId,description:x.description,quantity:x.quantity,unit:x.unit,unit_price:x.unit_price,item_type:x.item_type==='labor'?'labor':'material'}));
 if(items.length){const ins=await supabase.from('eletripro_budget_items').insert(items);if(ins.error)throw ins.error;}
}
function consolidateMaterialRows(items:MaterialRow[]):MaterialRow[]{
 const grouped=new Map<string,MaterialRow>();
 for(const item of items){
  const key=[(item.item_type||'material'),String(item.description||'').trim().normalize('NFC').toLocaleLowerCase('pt-BR'),String(item.unit||'').trim().toLocaleLowerCase('pt-BR'),Number(item.unit_price||0)].join('\u0001');
  const old=grouped.get(key);
  if(old)grouped.set(key,{...old,quantity:Number(old.quantity||0)+Number(item.quantity||0)});
  else grouped.set(key,{...item,quantity:Number(item.quantity||0)});
 }
 return [...grouped.values()].sort((a,b)=>a.description.localeCompare(b.description,'pt-BR',{sensitivity:'base',numeric:true}));
}
function MaterialsPanel({clientId,userId,localBudget,client,professional,logo,accent}:{clientId:string;userId:string;localBudget:BudgetItem[];client:Client;professional:string;logo:string;accent:string}){
 const [rows,setRows]=useState<MaterialRow[]>([]),[projectId,setProjectId]=useState(''),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
 const [description,setDescription]=useState(''),[quantity,setQuantity]=useState('1'),[unit,setUnit]=useState('un'),[unitPrice,setUnitPrice]=useState('0');
 const [editingId,setEditingId]=useState<string|null>(null);
 const [selectedGroup,setSelectedGroup]=useState<MaterialRow[]|null>(null);
 const [editorOpen,setEditorOpen]=useState(false);
 const [refreshCount,setRefreshCount]=useState(0);
 const [itemType,setItemType]=useState<'material'|'labor'>('material');
 const [exportMaterials,setExportMaterials]=useState(true),[exportValues,setExportValues]=useState(true),[exportLabor,setExportLabor]=useState(true);
 useEffect(()=>{
  let live=true;setRows([]);setProjectId('');setStatus('Carregando materiais...');
  void (async()=>{try{
   if(!supabase)throw new Error('Supabase indisponível');
   const id=await ensureEletriProject(clientId,userId);
   const result=await supabase.from('eletripro_materials').select('id,description,quantity,unit,unit_price,item_type').eq('project_id',id).order('created_at',{ascending:true});
   if(result.error)throw result.error;
   if(live){setProjectId(id);setRows((result.data||[]) as MaterialRow[]);setStatus('');}
  }catch(e){if(live)setStatus('Erro ao carregar materiais: '+(e instanceof Error?e.message:String(e)))}})();
  return()=>{live=false};
 },[clientId,userId,refreshCount]);
 const reset=()=>{setEditorOpen(false);setEditingId(null);setDescription('');setQuantity('1');setUnit('un');setUnitPrice('0');setItemType('material')};
 async function save(){
  if(!supabase||!projectId||busy)return;
  const q=Number(quantity),price=Number(unitPrice),desc=description.trim();
  if(!desc||!Number.isFinite(q)||q<0||!Number.isFinite(price)||price<0){setStatus('Informe descrição, quantidade e preço válidos.');return}
  setBusy(true);setStatus('Salvando...');
  const payload={description:desc,quantity:q,unit,unit_price:price,item_type:itemType,updated_at:new Date().toISOString()};
  const result=editingId
   ?await supabase.from('eletripro_materials').update(payload).eq('id',editingId).eq('project_id',projectId)
   :await supabase.from('eletripro_materials').insert({project_id:projectId,...payload});
  setBusy(false);
  if(result.error){setStatus('Erro ao salvar: '+result.error.message);return}
  try{await syncUnifiedBudget(projectId)}catch(e){setStatus('Material salvo, mas orçamento não sincronizado: '+String(e))}reset();setStatus('✓ Material salvo com sucesso.');setRefreshCount(x=>x+1);
 }
 const sameGroup=(a:MaterialRow,b:MaterialRow)=>
  (a.item_type||'material')===(b.item_type||'material')&&
  String(a.description||'').trim().normalize('NFC').toLocaleLowerCase('pt-BR')===String(b.description||'').trim().normalize('NFC').toLocaleLowerCase('pt-BR')&&
  String(a.unit||'').trim().toLocaleLowerCase('pt-BR')===String(b.unit||'').trim().toLocaleLowerCase('pt-BR')&&
  Number(a.unit_price||0)===Number(b.unit_price||0);
 const openEditor=(r:MaterialRow)=>{setSelectedGroup(null);setEditorOpen(true);setEditingId(r.id);setDescription(r.description);setQuantity(String(r.quantity));setUnit(r.unit);setUnitPrice(String(r.unit_price));setItemType(r.item_type||'material')};
 async function removeGroup(group:MaterialRow[]){
  if(!supabase||!projectId||busy||!group.length||!window.confirm(`Excluir ${group.length} registro(s) de \"${group[0].description}\"? Esta ação remove todos os registros que compõem a linha agrupada.`))return;
  setBusy(true);setStatus('Excluindo grupo...');
  try{
   const ids=group.map(r=>r.id);
   const result=await supabase.from('eletripro_materials').delete().eq('project_id',projectId).in('id',ids);
   if(result.error)throw result.error;
   await syncUnifiedBudget(projectId);
   setSelectedGroup(null);setStatus('✓ Grupo excluído com sucesso.');setRefreshCount(x=>x+1);
  }catch(e){setStatus('Erro ao excluir grupo: '+String(e))}finally{setBusy(false)}
 }
 async function remove(row:MaterialRow){
  if(!supabase||!projectId||busy||!window.confirm('Excluir o material '+row.description+'?'))return;
  setBusy(true);const result=await supabase.from('eletripro_materials').delete().eq('id',row.id).eq('project_id',projectId);
  setBusy(false);if(result.error){setStatus('Erro ao excluir: '+result.error.message);return}
  if(editingId===row.id)reset();try{await syncUnifiedBudget(projectId)}catch(e){setStatus('Exclusão salva, mas orçamento não sincronizado: '+String(e))}setRefreshCount(x=>x+1);
 }
 async function consolidateAll(){
  if(!supabase||!projectId||busy)return;
  setBusy(true);setStatus('Conferindo todos os circuitos...');
  try{
   const cr=await supabase.from('eletripro_circuits').select('id,title,data').eq('project_id',projectId);
   if(cr.error)throw cr.error;
   const skipped:string[]=[];
   for(const c of (cr.data||[]) as SavedCircuit[]){try{await syncCircuitMaterials(projectId,c)}catch(e){skipped.push(c.title+': '+String(e))}}
   await syncUnifiedBudget(projectId);
   setStatus(skipped.length?'Revisar circuitos: '+skipped.join('; '):'Materiais e orçamento operacional sincronizados.');setRefreshCount(x=>x+1);
  }catch(e){setStatus('Erro na consolidação: '+String(e))}finally{setBusy(false)}
 }
 async function importBudget(){
  if(!supabase||!projectId||busy||!localBudget.length)return;
  if(!window.confirm(`Importar ${localBudget.length} itens do orçamento local para Materiais? Itens já existentes não serão substituídos e poderão ficar duplicados.`))return;
  setBusy(true);setStatus('Importando itens...');
  const result=await supabase.from('eletripro_materials').insert(localBudget.map(item=>({project_id:projectId,description:item.description,quantity:item.quantity,unit:item.unit,unit_price:item.unitPrice})));
  setBusy(false);if(result.error){setStatus('Erro na importação: '+result.error.message);return}
  try{await syncUnifiedBudget(projectId)}catch(e){setStatus('Importação salva, mas orçamento não sincronizado: '+String(e))}setRefreshCount(x=>x+1);
 }
 return <section className="panel"><div className="panel-heading"><div><h2>Materiais e mão de obra</h2></div><button type="button" className="primary" onClick={()=>{reset();setEditorOpen(true)}} disabled={busy}><Plus size={16}/> Incluir item</button></div>
 {status&&<p className="hint" role="status" style={status.startsWith('✓')?{color:'#22c55e'}:undefined}>{status}</p>}
 <div className="ep-record-list">{consolidateMaterialRows(rows).map((r,index)=>{
  const group=rows.filter(item=>sameGroup(item,r));
  return <div className="ep-material-record" key={group.map(item=>item.id).join('-')}>
   <span className="ep-record-number">{String(index+1).padStart(2,'0')}</span>
   <div className="ep-material-info"><strong>{r.item_type==='labor'?'Mão de obra · ':''}{r.description}</strong>
    <span>{Number(r.quantity).toLocaleString('pt-BR',{maximumFractionDigits:3})} {r.unit} × {moneyBR(Number(r.unit_price))} · <b>{moneyBR(Number(r.quantity)*Number(r.unit_price))}</b></span>
   </div>
   <div className="ep-material-actions"><button className="outline" disabled={busy} onClick={()=>group.length===1?openEditor(group[0]):setSelectedGroup(group)}>Editar</button>
    <button className="outline" disabled={busy} onClick={()=>void removeGroup(group)}>Excluir</button></div>
  </div>})}</div>
 {selectedGroup&&<div className="ep-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedGroup(null)}}><div className="panel sizing-form ep-editor-card" role="dialog" aria-modal={true} aria-label="Editar itens agrupados">
  <div className="ep-editor-heading"><h3>Editar itens do grupo</h3><button type="button" className="ep-close" aria-label="Fechar" onClick={()=>setSelectedGroup(null)}><X size={20}/></button></div>
  <p className="hint">Este grupo reúne {selectedGroup.length} registros. Selecione um registro para editar sem alterar os demais.</p>
  <div className="ep-record-list">{selectedGroup.map((r,index)=><div className="ep-material-record" key={r.id}><span className="ep-record-number">{String(index+1).padStart(2,'0')}</span><div className="ep-material-info"><strong>{r.description}</strong><span>{reportNum(r.quantity)} {r.unit} × {moneyBR(Number(r.unit_price))} · <b>{moneyBR(Number(r.quantity)*Number(r.unit_price))}</b></span></div><div className="ep-material-actions"><button className="outline" onClick={()=>openEditor(r)}>Editar</button><button className="outline" onClick={()=>{setSelectedGroup(null);void remove(r)}}>Excluir</button></div></div>)}</div>
 </div></div>}

 {rows.length===0&&<p className="hint">Nenhum material salvo neste projeto.</p>}
 <div className="ep-total-highlight"><span>Total de materiais e mão de obra</span><strong>{moneyBR(rows.reduce((sum,r)=>sum+Number(r.quantity)*Number(r.unit_price),0))}</strong></div>
 {editorOpen&&<div className="ep-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)reset()}}><div className="panel sizing-form ep-editor-card" role="dialog" aria-modal={true} aria-label={editingId?'Editar material':'Cadastrar material'}><div className="ep-editor-heading"><h3>{editingId?'Editar material':'Cadastrar material'}</h3><button type="button" className="ep-close" aria-label="Fechar" onClick={reset} disabled={busy}><X size={20}/></button></div>
 <label>Categoria<select value={itemType} onChange={e=>setItemType(e.target.value as 'material'|'labor')}><option value="material">Material</option><option value="labor">Mão de obra / serviço</option></select></label>
 <label>Descrição<input value={description} onChange={e=>setDescription(e.target.value)}/></label>
 <div className="two"><label>Quantidade<input type="number" min="0" step="0.001" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label><label>Unidade<select value={unit} onChange={e=>setUnit(e.target.value)}><option value="un">un</option><option value="m">m</option><option value="m²">m²</option><option value="h">h</option><option value="kg">kg</option></select></label></div>
 <label>Preço unitário (R$)<input type="number" min="0" step="0.01" value={unitPrice} onChange={e=>setUnitPrice(e.target.value)}/></label>
 <button className="primary" disabled={busy||!projectId||!description.trim()} onClick={()=>void save()}>{editingId?'Atualizar material':'Salvar material'}</button> <button type="button" className="outline" onClick={reset} disabled={busy}>Fechar</button></div></div>}
 <div className="ep-export-panel" style={{marginTop:20,padding:16,border:'1px solid var(--border, #454954)',borderRadius:12}}>
 <h3>Exportar lista</h3>
 <p className="hint">Descrição, quantidade e unidade são campos fixos em todas as exportações. Escolha os grupos e se deseja mostrar valores.</p>
 <div style={{display:'flex',gap:18,flexWrap:'wrap',marginBottom:12}}>
 <label style={{display:'flex',alignItems:'center',gap:7}}><input type="checkbox" checked={exportMaterials} onChange={e=>setExportMaterials(e.target.checked)}/> Lista de materiais</label>
 <label style={{display:'flex',alignItems:'center',gap:7}}><input type="checkbox" checked={exportLabor} onChange={e=>setExportLabor(e.target.checked)}/> Mão de obra</label>
 <label style={{display:'flex',alignItems:'center',gap:7}}><input type="checkbox" checked={exportValues} onChange={e=>setExportValues(e.target.checked)}/> Valores</label>
 </div>
 <button type="button" className="primary" disabled={busy||(!exportMaterials&&!exportLabor)} onClick={()=>void (async()=>{
  const selected=consolidateMaterialRows(rows.filter(r=>r.item_type==='labor'?exportLabor:exportMaterials)).sort((a,b)=>String(a.description||'').localeCompare(String(b.description||''),'pt-BR',{sensitivity:'base',numeric:true}));
  if(!selected.length){setStatus('Não há itens das categorias selecionadas para exportar.');return;}
  setBusy(true);setStatus('Gerando PDF...');
  try{
   const headers=['Categoria','Descrição','Quantidade','Unidade',...(exportValues?['Preço unitário','Subtotal']:[])];
   const data=selected.map(r=>[r.item_type==='labor'?'Mão de obra':'Material',r.description,reportNum(r.quantity),r.unit,...(exportValues?[moneyBR(Number(r.unit_price)||0),moneyBR((Number(r.quantity)||0)*(Number(r.unit_price)||0))]:[])]);
   const total=exportValues?moneyBR(selected.reduce((a,r)=>a+(Number(r.quantity)||0)*(Number(r.unit_price)||0),0)):undefined;
   await downloadTechnicalPdf({company:professional||'EletriPro',logo,accent,client:client.name,phone:client.phone||'',email:client.email||'',sections:[{title:'Materiais e mão de obra',headers,rows:data,kind:'materials'}],total},`EletriPro-Materiais-${client.name.replace(/[^a-zA-Z0-9À-ÿ_-]+/g,'-')}.pdf`);
   setStatus('PDF gerado com sucesso.');
  }catch(e){setStatus('Erro ao gerar PDF: '+(e instanceof Error?e.message:String(e)))}finally{setBusy(false)}
 })()}>Exportar PDF</button>
 </div>
 {localBudget.length>0&&<div style={{marginTop:16}}><button className="outline" disabled={busy||!projectId} onClick={()=>void importBudget()}>Importar {localBudget.length} itens do orçamento local</button><p className="hint">Importação opcional. Confira duplicidades antes de importar novamente. O orçamento local não será apagado.</p></div>}
 </section>
}


// v0.7.22 — Orçamentos por projeto no Supabase. Rascunho local preservado até importação explícita.
type CloudBudget={id:string;title:string;status:string};
type CloudBudgetItem={id:string;description:string;quantity:number;unit:string;unit_price:number;item_type:'material'|'labor'};
type BudgetEditItem=BudgetItem & {cloudId?:string;itemType:'material'|'labor'};
function BudgetsPanel({clientId,userId,localBudget}:{clientId:string;userId:string;localBudget:BudgetItem[]}){
 const [projectId,setProjectId]=useState('');
 const [budgets,setBudgets]=useState<CloudBudget[]>([]);
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [title,setTitle]=useState('Novo orçamento');
 const [editorOpen,setEditorOpen]=useState(false);
 const [viewMode,setViewMode]=useState(false);
 const [items,setItems]=useState<BudgetEditItem[]>([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false);
 const [status,setStatus]=useState('');
 const [materials,setMaterials]=useState<MaterialRow[]>([]),[selectedMaterials,setSelectedMaterials]=useState<string[]>([]),[manualType,setManualType]=useState<'material'|'labor'>('material');
 const [manualDescription,setManualDescription]=useState(''),[manualUnit,setManualUnit]=useState('un'),[manualQty,setManualQty]=useState('1'),[manualPrice,setManualPrice]=useState('0');
 const request=React.useRef(0);
 const selectedRef=React.useRef<string|null>(null);
 useEffect(()=>{if(!selectedId)return;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!busy)newBudget()};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[selectedId,busy]);
 const dirtyRef=React.useRef(false);
 const updateDirty=(value:boolean)=>{dirtyRef.current=value;setDirty(value)};
 const setSelection=(id:string|null)=>{selectedRef.current=id;setSelectedId(id)};
 const uuid=()=>typeof crypto!=='undefined'&&'randomUUID'in crypto?crypto.randomUUID():`tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
 const confirmDiscard=()=>!dirtyRef.current||window.confirm('Existem alterações não salvas. Deseja descartá-las?');
 const setRowsDirty=(fn:(old:BudgetEditItem[])=>BudgetEditItem[])=>{setItems(fn);updateDirty(true)};
 const loadItems=async(id:string,req:number)=>{
  if(!supabase)return;
  const result=await supabase.from('eletripro_budget_items').select('id,description,quantity,unit,unit_price,item_type').eq('budget_id',id).order('created_at',{ascending:true});
  if(req!==request.current)return;
  if(result.error){setStatus('Erro ao carregar itens: '+result.error.message);return}
  setItems(((result.data||[]) as CloudBudgetItem[]).map(x=>({id:x.id,cloudId:x.id,description:x.description,quantity:Number(x.quantity),unit:x.unit,unitPrice:Number(x.unit_price),itemType:x.item_type||'material'})));
  updateDirty(false);
 };
 useEffect(()=>{
  const req=++request.current;
  setEditorOpen(false);setProjectId('');setBudgets([]);setSelection(null);setTitle('Novo orçamento');setItems([]);updateDirty(false);setLoading(true);setStatus('Carregando orçamentos...');
  void (async()=>{try{
   if(!supabase)throw new Error('Supabase indisponível');
   const id=await ensureEletriProject(clientId,userId);
   const [br,mr]=await Promise.all([
    supabase.from('eletripro_budgets').select('id,title,status').eq('project_id',id).order('created_at',{ascending:true}),
    supabase.from('eletripro_materials').select('id,description,quantity,unit,unit_price').eq('project_id',id).order('created_at',{ascending:true})
   ]);
   if(req!==request.current)return;
   if(br.error)throw br.error;
   setProjectId(id);setBudgets((br.data||[]) as CloudBudget[]);
   if(mr.error)setStatus('Orçamentos carregados; materiais indisponíveis: '+mr.error.message);
   else{setMaterials((mr.data||[]) as MaterialRow[]);setStatus('Orçamentos carregados do Supabase.');}
  }catch(e){if(req===request.current)setStatus('Erro ao carregar: '+(e instanceof Error?e.message:String(e)))}
  finally{if(req===request.current)setLoading(false)}
  })();
  return()=>{request.current++};
 },[clientId,userId]);
 async function selectBudget(row:CloudBudget){
  if(busy||loading||!confirmDiscard())return;
  const req=++request.current;setViewMode(true);setEditorOpen(true);setLoading(true);setSelection(row.id);setTitle(row.title);setItems([]);updateDirty(false);setStatus('Carregando itens...');
  await loadItems(row.id,req);
  if(req===request.current)setLoading(false);
 }
 function closeBudget(){if(busy||loading||!confirmDiscard())return;setViewMode(false);setEditorOpen(false);setItems([]);setSelection(null);setTitle('Novo orçamento');updateDirty(false)}
 function newBudget(){
  if(busy||loading||!confirmDiscard())return;
  if(supabase&&projectId)void supabase.from('eletripro_materials').select('id,description,quantity,unit,unit_price').eq('project_id',projectId).order('created_at',{ascending:true}).then(r=>{if(!r.error)setMaterials((r.data||[]) as MaterialRow[])});
  setViewMode(false);setEditorOpen(true);setSelection(null);setTitle('Novo orçamento');setItems([]);updateDirty(false);setStatus('Novo orçamento. Preencha os dados e clique em Salvar orçamento.');
 }
 async function save(){
  if(!supabase||!projectId||busy||loading)return;
  if(!title.trim()){setStatus('Informe o nome do orçamento.');return}
  if(items.some(x=>!x.description.trim()||!Number.isFinite(x.quantity)||x.quantity<0||!Number.isFinite(x.unitPrice)||x.unitPrice<0)){setStatus('Revise as descrições, quantidades e preços.');return}
  setBusy(true);setStatus('Salvando orçamento...');
  let budgetId=selectedRef.current;
  try{
   if(budgetId){
    const r=await supabase.from('eletripro_budgets').update({title:title.trim(),updated_at:new Date().toISOString()}).eq('id',budgetId).eq('project_id',projectId).select('id').single();
    if(r.error)throw r.error;
   }else{
    const r=await supabase.from('eletripro_budgets').insert({project_id:projectId,title:title.trim(),status:'rascunho'}).select('id').single();
    if(r.error)throw r.error;
    budgetId=r.data.id;setSelection(budgetId);
    setBudgets(old=>[...old,{id:budgetId!,title:title.trim(),status:'rascunho'}]);
   }
   // Atualizar/adicionar antes de excluir; se houver falha, os itens anteriores permanecem.
   const persisted:BudgetEditItem[]=[];
   for(const item of items){
    const payload={description:item.description.trim(),quantity:item.quantity,unit:item.unit,unit_price:item.unitPrice,item_type:item.itemType};
    const r=item.cloudId
     ?await supabase.from('eletripro_budget_items').update(payload).eq('id',item.cloudId).eq('budget_id',budgetId).select('id').single()
     :await supabase.from('eletripro_budget_items').insert({budget_id:budgetId,...payload}).select('id').single();
    if(r.error)throw r.error;
    persisted.push({...item,id:r.data.id,cloudId:r.data.id});
   }
   const existing=await supabase.from('eletripro_budget_items').select('id').eq('budget_id',budgetId);
   if(existing.error)throw existing.error;
   const keep=new Set(persisted.map(x=>x.cloudId));
   for(const old of existing.data||[]){
    if(!keep.has(old.id)){
     const del=await supabase.from('eletripro_budget_items').delete().eq('id',old.id).eq('budget_id',budgetId);
     if(del.error)throw del.error;
    }
   }
   setItems(persisted);setBudgets(old=>old.map(x=>x.id===budgetId?{...x,title:title.trim()}:x));
   updateDirty(false);setStatus('Orçamento salvo no Supabase.');
  }catch(e){setStatus('Falha ao salvar: '+(e instanceof Error?e.message:String(e))+'. Confira o orçamento antes de tentar novamente.')}
  finally{setBusy(false)}
 }
 async function removeBudget(){
  if(!supabase||!selectedId||!projectId||busy||!window.confirm('Excluir este orçamento e TODOS os seus itens do Supabase?'))return;
  setBusy(true);const id=selectedId;
  const r=await supabase.from('eletripro_budgets').delete().eq('id',id).eq('project_id',projectId);
  setBusy(false);
  if(r.error){setStatus('Erro ao excluir: '+r.error.message);return}
  setBudgets(old=>old.filter(x=>x.id!==id));setEditorOpen(false);setSelection(null);setTitle('Novo orçamento');setItems([]);updateDirty(false);setStatus('Orçamento excluído.');
 }
 function importLocal(){
  if(!localBudget.length)return;
  if(!window.confirm(`Adicionar ${localBudget.length} itens do rascunho local a este orçamento? Os itens locais serão preservados; importar novamente poderá duplicá-los.`))return;
  setRowsDirty(old=>[...old,...localBudget.map(x=>({...x,id:uuid(),itemType:'material' as const}))]);setStatus('Itens locais adicionados. Clique em Salvar orçamento para sincronizar. O rascunho local não foi apagado.');
 }
 function importMaterials(){
  if(!selectedMaterials.length)return;
  const chosen=materials.filter(x=>selectedMaterials.includes(x.id));
  if(!window.confirm(`Adicionar ${chosen.length} material(is) selecionado(s) a este orçamento? Itens repetidos poderão ser duplicados.`))return;
  setRowsDirty(old=>[...old,...chosen.map(x=>({id:uuid(),description:x.description,quantity:Number(x.quantity),unit:x.unit,unitPrice:Number(x.unit_price),itemType:'material' as const}))]);
  setSelectedMaterials([]);setStatus('Materiais selecionados adicionados. Clique em Salvar orçamento.');
 }
 function addManual(){
  const q=Number(manualQty),price=Number(manualPrice);
  if(!manualDescription.trim()||!Number.isFinite(q)||q<=0||!Number.isFinite(price)||price<0)return;
  setRowsDirty(old=>[...old,{id:uuid(),description:manualDescription.trim(),quantity:q,unit:manualUnit,unitPrice:price,itemType:manualType}]);
  setManualDescription('');setManualQty('1');setManualPrice('0');
 }
 const materialTotal=items.filter(x=>x.itemType!=='labor').reduce((sum,x)=>sum+x.quantity*x.unitPrice,0);
 const laborTotal=items.filter(x=>x.itemType==='labor').reduce((sum,x)=>sum+x.quantity*x.unitPrice,0);
 const total=materialTotal+laborTotal;
 return <div style={{display:'grid',gap:16}}>
 <section className="panel"><div className="panel-heading"><div><h2>Orçamentos e mão de obra</h2></div><button className="outline" type="button" disabled={busy||loading} onClick={newBudget}><Plus size={16}/> Novo orçamento</button></div>
 {loading?<p className="hint">Carregando...</p>:budgets.length===0?<p className="hint">Nenhum orçamento salvo neste projeto.</p>:<div className="ep-record-list">{budgets.map((b,index)=><button key={b.id} type="button" disabled={busy} className="ep-record" onClick={()=>void selectBudget(b)}><span className="ep-record-number">{String(index+1).padStart(2,'0')}</span><span className="ep-record-name">{b.title}</span><span aria-hidden="true">›</span></button>)}</div>}
 {status&&/erro|falha/i.test(status)&&<p className="hint" role="alert">{status}</p>}
 </section>
 {editorOpen&&<div className="ep-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)closeBudget()}}><section className="panel ep-editor-card" role="dialog" aria-modal={true} aria-label={selectedId?'Editar orçamento':'Novo orçamento'}><div className="ep-editor-heading"><h2>{selectedId?(viewMode?title:'Editar orçamento'):'Novo orçamento'}</h2>{<button type="button" className="ep-close" aria-label="Fechar" disabled={busy||loading} onClick={closeBudget}><X size={20}/></button>}</div>
 {viewMode&&selectedId?<div className="ep-summary">
 <div className="ep-summary-table"><table><thead><tr><th>Item</th><th>Qtd.</th><th>Un.</th><th>Valor un.</th><th>Subtotal</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td>{x.description}{x.itemType==='labor'?' (Mão de obra)':''}</td><td>{x.quantity.toLocaleString('pt-BR',{maximumFractionDigits:3})}</td><td>{x.unit}</td><td>{moneyBR(x.unitPrice)}</td><td>{moneyBR(x.quantity*x.unitPrice)}</td></tr>)}</tbody></table></div>
 <div className="ep-total-highlight"><span>Total do orçamento</span><strong>{moneyBR(total)}</strong></div>
 <p className="hint">Materiais: {moneyBR(materialTotal)} · Mão de obra: {moneyBR(laborTotal)}</p>
 <div className="ep-summary-actions"><button type="button" className="primary" disabled={busy||loading} onClick={()=>setViewMode(false)}>Editar / Incluir mão de obra</button><button type="button" className="outline" disabled={busy||loading} onClick={()=>void removeBudget()}>Excluir</button><button type="button" className="outline" onClick={closeBudget}>Fechar</button></div>
 </div>:<div className="ep-edit-body"><label>Nome do orçamento<input maxLength={160} value={title} disabled={busy||loading} onChange={e=>{setTitle(e.target.value);updateDirty(true)}} placeholder="Ex.: Instalação elétrica - residência"/></label>
 <div style={{display:'flex',gap:8,flexWrap:'wrap',margin:'12px 0'}}>
 <button type="button" className="outline" disabled={busy||loading||!localBudget.length} onClick={importLocal}>Importar rascunho local ({localBudget.length})</button>
 <button type="button" className="outline" disabled={busy||loading||!selectedMaterials.length} onClick={importMaterials}>Adicionar selecionados ({selectedMaterials.length})</button>
 </div>
 <div style={{maxHeight:190,overflowY:'auto',border:'1px solid #444',borderRadius:8,padding:10}}>
 <div className="ep-select-all"><strong>Selecionar materiais do projeto</strong><label><input type="checkbox" aria-label="Selecionar todos os materiais" disabled={busy||loading||materials.length===0} checked={materials.length>0&&materials.every(x=>selectedMaterials.includes(x.id))} onChange={e=>setSelectedMaterials(e.target.checked?materials.map(x=>x.id):[])}/><span>Selecionar todos</span></label></div>
 {materials.length===0?<p className="hint">Nenhum material cadastrado.</p>:materials.map(x=><label key={x.id} style={{display:'flex',alignItems:'center',gap:8,marginTop:8}}><input type="checkbox" style={{width:18}} checked={selectedMaterials.includes(x.id)} disabled={busy||loading} onChange={e=>setSelectedMaterials(old=>e.target.checked?[...old,x.id]:old.filter(id=>id!==x.id))}/><span>{x.description} · {x.quantity} {x.unit} · {moneyBR(Number(x.unit_price))}/un.</span></label>)}
 </div>
 <p className="hint">As importações são opcionais e não apagam a origem. Revise os itens antes de salvar para evitar duplicidades.</p>
 <div style={{overflowX:'auto',marginTop:16}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:690}}><thead><tr><th style={{textAlign:'left',padding:8}}>Descrição</th><th style={{textAlign:'left',padding:8}}>Tipo</th><th style={{textAlign:'left',padding:8,width:90}}>Quantidade</th><th style={{textAlign:'left',padding:8,width:75}}>Un.</th><th style={{textAlign:'left',padding:8,width:125}}>Preço un. (R$)</th><th style={{textAlign:'right',padding:8,width:120}}>Subtotal</th><th style={{width:48}}/></tr></thead><tbody>{items.map(x=><tr key={x.id} style={{borderTop:'1px solid #36393f'}}><td style={{padding:8}}><input aria-label="Descrição" style={{minWidth:180}} disabled={busy||loading} value={x.description} onChange={e=>setRowsDirty(old=>old.map(y=>y.id===x.id?{...y,description:e.target.value}:y))}/></td><td style={{padding:8}}><select aria-label={'Tipo '+x.description} disabled={busy||loading} value={x.itemType} onChange={e=>setRowsDirty(old=>old.map(y=>y.id===x.id?{...y,itemType:e.target.value as 'material'|'labor'}:y))}><option value="material">Material</option><option value="labor">Mão de obra</option></select></td><td style={{padding:8}}><input aria-label={'Quantidade '+x.description} style={{minWidth:65}} type="number" min="0" step="0.001" disabled={busy||loading} value={x.quantity} onChange={e=>setRowsDirty(old=>old.map(y=>y.id===x.id?{...y,quantity:Number(e.target.value)}:y))}/></td><td style={{padding:8}}><input aria-label={'Unidade '+x.description} style={{minWidth:55}} disabled={busy||loading} value={x.unit} onChange={e=>setRowsDirty(old=>old.map(y=>y.id===x.id?{...y,unit:e.target.value}:y))}/></td><td style={{padding:8}}><input aria-label={'Preço '+x.description} style={{minWidth:95}} type="number" min="0" step="0.01" disabled={busy||loading} value={x.unitPrice} onChange={e=>setRowsDirty(old=>old.map(y=>y.id===x.id?{...y,unitPrice:Number(e.target.value)}:y))}/></td><td style={{textAlign:'right',whiteSpace:'nowrap',padding:8}}>{moneyBR(x.quantity*x.unitPrice)}</td><td><button type="button" className="outline" disabled={busy||loading} title="Remover item" onClick={()=>setRowsDirty(old=>old.filter(y=>y.id!==x.id))}><X size={16}/></button></td></tr>)}</tbody></table></div>
 {items.length===0&&<p className="hint">Nenhum item incluído. Importe materiais ou adicione um item manualmente.</p>}
 <div style={{marginTop:18}}><p><strong>Materiais:</strong> {moneyBR(materialTotal)}</p><p><strong>Mão de obra:</strong> {moneyBR(laborTotal)}</p></div>
 <div style={{display:'flex',justifyContent:'space-between',gap:12,margin:'18px 0',flexWrap:'wrap'}}><strong>Total do orçamento</strong><strong style={{fontSize:22}}>{moneyBR(total)}</strong></div>
 <div className="sizing-metric" style={{padding:16}}><h3>Adicionar item manualmente</h3><label>Categoria<select value={manualType} onChange={e=>setManualType(e.target.value as 'material'|'labor')}><option value="material">Material</option><option value="labor">Mão de obra / serviço</option></select></label>
 <label>Descrição<input value={manualDescription} disabled={busy||loading} onChange={e=>setManualDescription(e.target.value)}/></label>
 <div className="two"><label>Unidade<select value={manualUnit} disabled={busy||loading} onChange={e=>setManualUnit(e.target.value)}><option value="un">un</option><option value="m">m</option><option value="m²">m²</option><option value="h">h</option><option value="kg">kg</option></select></label><label>Quantidade<input type="number" min="0.001" step="0.001" value={manualQty} disabled={busy||loading} onChange={e=>setManualQty(e.target.value)}/></label></div>
 <label>Preço unitário (R$)<input type="number" min="0" step="0.01" value={manualPrice} disabled={busy||loading} onChange={e=>setManualPrice(e.target.value)}/></label>
 <button type="button" className="outline" disabled={busy||loading||!manualDescription.trim()||!(Number(manualQty)>0)||!(Number(manualPrice)>=0)} onClick={addManual}><Plus size={16}/> Adicionar item</button>
 </div>
 <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:16}}>
 <button type="button" className="primary" disabled={busy||loading||!projectId||!title.trim()} onClick={()=>void save()}>{busy?'Salvando...':selectedId?'Atualizar orçamento':'Salvar orçamento'}</button>
 {selectedId&&<button type="button" className="outline" disabled={busy||loading} onClick={()=>void removeBudget()}>Excluir orçamento</button>}
 </div>
 {dirty&&<p className="hint">Há alterações não salvas no Supabase.</p>}
 <p className="hint">O rascunho local continua disponível no navegador e não é excluído automaticamente. Os orçamentos salvos podem ser abertos em outro dispositivo.</p>
 <button type="button" className="outline" disabled={busy||loading} onClick={closeBudget}>Fechar</button></div>}</section></div>} </div>;
}


type ReportOptions={installation:boolean;environments:boolean;circuits:boolean;distribution:boolean;feeder:boolean;materials:boolean;labor:boolean;values:boolean};
const reportDefaults:ReportOptions={installation:true,environments:true,circuits:true,distribution:true,feeder:true,materials:true,labor:true,values:true};
const reportLabels:Record<string,string>={residential:'Residencial',commercial:'Comercial',industrial:'Industrial (baixa tensão)',single:'Monofásico',two:'Bifásico',three:'Trifásico',copper:'Cobre',aluminum:'Alumínio',bundle:'Feixe ou conduto fechado',singleLayer:'Camada única', 'phase-neutral':'Fase + neutro','phase-phase':'Duas fases','lighting':'Iluminação','tug':'Tomadas de uso geral (TUG)','tue':'Tomadas de uso específico (TUE)'};
const reportText=(v:unknown)=>v===null||v===undefined||v===''?'Não informado':String(v);
const translated=(v:unknown)=>reportLabels[String(v)]||reportText(v);
const reportNum=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{maximumFractionDigits:2}):reportText(v)};
function TechnicalReport({client,userId,professional,logo,accent,settings}:{client:Client;userId:string;professional:string;logo:string;accent:string;settings:InstallationSettings}){
 const [options,setOptions]=useState<ReportOptions>(reportDefaults);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const change=(k:keyof ReportOptions,v:boolean)=>setOptions(o=>({...o,[k]:v}));
 const generate=async()=>{
  if(busy)return;setBusy(true);setError('');
  try{
   const pr=await supabase.from('eletripro_projects').select('id,installation').eq('client_id',client.id).eq('owner_id',userId).maybeSingle();
   if(pr.error)throw pr.error;
   const project=pr.data,id=project?.id;
   const [cr,er,mr]=await Promise.all([
    id&&(options.circuits||options.distribution)?supabase.from('eletripro_circuits').select('id,title,data').eq('project_id',id).order('created_at',{ascending:true}):Promise.resolve({data:[],error:null}),
    id&&options.environments?supabase.from('eletripro_environments').select('id,title,data').eq('project_id',id).order('created_at',{ascending:true}):Promise.resolve({data:[],error:null}),
    id&&(options.materials||options.labor)?supabase.from('eletripro_materials').select('*').eq('project_id',id):Promise.resolve({data:[],error:null})
   ]);
   for(const r of [cr,er,mr])if(r.error)throw r.error;
   const circuits=(cr.data||[]) as SavedCircuit[],rooms=(er.data||[]) as SavedEnvironment[],materials=(mr.data||[]) as MaterialRow[];
   const sections:ReportSection[]=[];
   const add=(title:string,headers:string[],rows:(string|number|null|undefined)[][],kind?:'materials')=>sections.push({title,headers,rows,kind});
   const d={...defaultInstallation,...settings,...(project?.installation||{})};
   if(options.installation)add('Parâmetros da instalação',['Parâmetro','Valor'],[
    ['Aplicação',translated(d.application)],['Fornecimento',translated(d.supply)],['Tensão (V)',d.voltage],['Método de referência',d.method],['Temperatura (°C)',d.temperature],['Fator de potência',d.powerFactor],['Material condutor',translated(d.conductorMaterial)],['Isolação',d.conductorInsulation],['Agrupamento',d.groupCount],['Disposição do agrupamento',translated(d.groupMode)],['Modo de instalação',translated(d.wiring)]
   ]);
   if(options.environments)add('Ambientes',['Ambiente','Características'],rooms.map(r=>{const a=r.data||{},estimate=estimateRoom(r);return [r.title,`Tipo: ${reportText(a.kind)} | Área: ${reportNum(estimate?.area??a.area)} m² | Dimensões: ${reportNum(a.width)} × ${reportNum(a.length)} m | Perímetro: ${estimate?reportNum(estimate.perimeter)+' m':'Não informado'} | Iluminação: ${estimate?reportNum(estimate.lighting)+' VA':'Não informado'} | TUG: ${estimate?.outlets??'Não informado'} ponto(s), ${estimate?.tug===null?'A definir':reportNum(estimate?.tug)+' VA'}${a.notes?' | Observações: '+a.notes:''}`]}));
   const result=(c:SavedCircuit)=>(c.data.results||{}) as Record<string,unknown>;
   if(options.circuits)add('Circuitos dimensionados',['Circuito','Tipo','Potência (W)','Disjuntor (A)','Condutor (mm²)'],circuits.map(c=>[c.title,translated(c.data.circuit||c.data.type||( /iluminaç[aã]o|lighting/i.test(c.title)?'lighting':undefined)),reportNum(c.data.power),reportText(result(c).breaker),reportText(result(c).selectedSection)]));
   if(options.distribution)add('Quadro de distribuição',['Circuito','Fase(s)','Disjuntor','Seção (mm²)','Corrente de Projeto (A)'],[...circuits].sort((a,b)=>(Number(result(b).breaker)||0)-(Number(result(a).breaker)||0)).map(c=>{const poles=panelPoles(c,d),valid=panelChoices(d,poles);const stored=String(c.data.panelConnection||c.data.panelPhase||'');const connection=valid.includes(stored as PanelConnection)?stored:valid[0];return [c.title,connection,result(c).breaker?`${result(c).breaker} A / ${poles} polo(s)`:'Não informado',reportText(result(c).selectedSection),reportNum(result(c).current)]}));
   if(options.feeder){
    const feeder=project?.installation?.feeder as (FeederForm&{calculation?:Record<string,unknown>})|undefined;
    const f=feeder?.calculation;
    add('Alimentador geral',['Parâmetro','Valor'],f?[
     ['Potência demandada (W)',reportNum(f.power)],['Fator de demanda',reportText(f.demand)],
     ['Corrente de projeto (A)',reportNum(f.ib)],['Condutor de fase (mm²)',reportNum(f.section)],
     ['Capacidade corrigida Iz (A)',reportNum(f.iz)],['Disjuntor geral (A)',reportNum(f.breaker)],
     ['Neutro (mm²)',reportNum(f.neutral)],['PE preliminar (mm²)',reportNum(f.pe)],
     ['Queda resistiva estimada (%)',reportNum(f.dropPercent)],
     ['Critério de demanda / observações',reportText(feeder?.notes)]
    ]:[['Situação','Dimensionamento do alimentador ainda não cadastrado']]);
   }
   const chosen=consolidateMaterialRows(materials.filter(m=>(m.item_type==='labor'?options.labor:options.materials))).sort((a,b)=>String(a.description||'').localeCompare(String(b.description||''),'pt-BR',{sensitivity:'base',numeric:true}));
   if(options.materials||options.labor){
    add('Materiais e mão de obra',['Categoria','Descrição','Quantidade','Unidade',...(options.values?['Preço unitário','Subtotal']:[])],chosen.map(m=>[m.item_type==='labor'?'Mão de obra':'Material',m.description,reportNum(m.quantity),m.unit,...(options.values?[moneyBR(Number(m.unit_price)||0),moneyBR((Number(m.quantity)||0)*(Number(m.unit_price)||0))]:[])]),'materials');
   }
   const total=options.values&&(options.materials||options.labor)?moneyBR(chosen.reduce((sum,m)=>sum+(Number(m.quantity)||0)*(Number(m.unit_price)||0),0)):undefined;
   await downloadTechnicalPdf({company:professional||'EletriPro',logo,accent,client:client.name,phone:client.phone||'',email:client.email||'',sections,total},`EletriPro-Relatorio-${client.name.replace(/[^a-zA-Z0-9À-ÿ_-]+/g,'-')}.pdf`);
  }catch(e:any){setError(e?.message||'Falha ao gerar o PDF. Confira os dados e tente novamente.')}finally{setBusy(false)}
 };
 return <section className="panel"><h2>Relatório técnico em PDF</h2><p>Selecione as seções desejadas. Descrição e quantidade aparecem em todas as listas exportadas. O arquivo PDF será baixado diretamente.</p><div className="ep-report-options">{([
 ['installation','Tipo de instalação'],['environments','Ambientes'],['circuits','Dimensionamento dos circuitos'],['distribution','Quadro de distribuição'],['feeder','Alimentador geral'],['materials','Lista de materiais'],['labor','Mão de obra'],['values','Valores e totais']
 ] as [keyof ReportOptions,string][]).map(([key,label])=><label key={key}><input type="checkbox" checked={options[key]} onChange={e=>change(key,e.target.checked)}/> {label}</label>)}</div><button className="primary" type="button" disabled={busy} onClick={()=>void generate()}>{busy?'Gerando PDF...':'Gerar relatório / PDF'}</button>{error&&<p role="alert" className="hint">{error}</p>}<p className="hint">A geração ocorre no navegador, usando os dados do Supabase. Nenhum registro é alterado.</p></section>
}

function App(){const[session,setSession]=useState<any>(null),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[mode,setMode]=useState<'login'|'signup'>('login'),[msg,setMsg]=useState(''),[tab,setTab]=useState('Painel'),[menu,setMenu]=useState(false),[clients,setClients]=useState<Client[]>([]),[plan,setPlan]=useState('free'),[name,setName]=useState(''),[phone,setPhone]=useState(''),[clientEmail,setClientEmail]=useState(''),[editing,setEditing]=useState<string|null>(null),[loading,setLoading]=useState(false),[professional,setProfessional]=useState(localStorage.getItem('ep_professional')||''),[accent,setAccent]=useState(localStorage.getItem('ep_accent')||'#a3a3a3'),[logo,setLogo]=useState(localStorage.getItem('ep_logo')||''),[fullName,setFullName]=useState(''),[mobile,setMobile]=useState(''),[cpf,setCpf]=useState(''),[birth,setBirth]=useState(''),[street,setStreet]=useState(''),[number,setNumber]=useState(''),[complement,setComplement]=useState(''),[neighborhood,setNeighborhood]=useState(''),[city,setCity]=useState(''),[state,setState]=useState(''),[document,setDocument]=useState<File|null>(null),[logoFile,setLogoFile]=useState<File|null>(null),[logoPath,setLogoPath]=useState(''),[accountMenu,setAccountMenu]=useState(false),[profileLoaded,setProfileLoaded]=useState(false);
 const [workflows,setWorkflows]=useState<WorkflowRow[]>([]);
 const [workflowClient,setWorkflowClient]=useState<Client|null>(null);
 const [workflowStatus,setWorkflowStatus]=useState<WorkStatus>('awaiting');
 const [workflowBudget,setWorkflowBudget]=useState('');
 const [workflowChoices,setWorkflowChoices]=useState<BudgetChoice[]>([]);
 const [workflowBusy,setWorkflowBusy]=useState(false);
 const [workflowLoading,setWorkflowLoading]=useState(false);
 const [showEarnings,setShowEarnings]=useState(false);
 const [budgetItems,setBudgetItems]=useState<BudgetItem[]>([]);
 const [activeClientId,setActiveClientId]=useState<string|null>(null);
 const [clientAreaTab,setClientAreaTab]=useState('Tipo de instalação');
 const budgetLoadedFor=React.useRef<string|null>(null);
 const clientAreaTabs=['Tipo de instalação','Dimensionamento','Ambientes','Quadro de distribuição','Alimentador geral','Materiais/Orçamentos','Relatórios'];
 const clientAreaOpen=clientAreaTabs.includes(tab);
 const activeClient=clients.find(c=>c.id===activeClientId);
 const clientStorageKey=(suffix:string)=>`eletripro-client-${session?.user?.id||'anon'}-${activeClientId||'none'}-${suffix}`;
 const openClient=(id:string)=>{setActiveClientId(id);setClientAreaTab('Tipo de instalação');setTab('Tipo de instalação');setMenu(false);setAccountMenu(false);setMsg('')};
 const [manualDescription,setManualDescription]=useState(''),[manualUnit,setManualUnit]=useState('un'),[manualQty,setManualQty]=useState('1'),[manualPrice,setManualPrice]=useState('0');
 const addManualBudgetItem=()=>{const desc=manualDescription.trim();const qty=Number(manualQty),price=Number(manualPrice);if(!desc||!Number.isFinite(qty)||qty<=0||!Number.isFinite(price)||price<0)return;setBudgetItems(old=>[...old,{id:'manual-'+Date.now()+'-'+Math.random().toString(36).slice(2),description:desc,unit:manualUnit,quantity:qty,unitPrice:price}]);setManualDescription('');setManualQty('1');setManualPrice('0')};
 const [installationSettings,setInstallationSettings]=useState<InstallationSettings>(readInstallation);
  const [installationLoading,setInstallationLoading]=useState(false);
  const [installationSaving,setInstallationSaving]=useState(false);
  const [installationStatus,setInstallationStatus]=useState('');
  const installationRequest=React.useRef(0);
 const updateInstallation=(next:InstallationSettings)=>{setInstallationSettings(next);setInstallationStatus('Alterações não salvas no Supabase.');if(activeClientId)localStorage.setItem(clientStorageKey('installation'),JSON.stringify(next))};
  async function saveInstallation(){
    if(!supabase||!session?.user?.id||!activeClientId||installationLoading)return;
    const clientId=activeClientId;
    setInstallationSaving(true);setInstallationStatus('');
    const existing=await supabase.from('eletripro_projects').select('installation').eq('client_id',clientId).eq('owner_id',session.user.id).maybeSingle();
    if(existing.error){setInstallationStatus('Erro ao carregar parâmetros anteriores: '+existing.error.message);setInstallationSaving(false);return}
    const {error}=await supabase.from('eletripro_projects').upsert({client_id:clientId,owner_id:session.user.id,installation:{...(existing.data?.installation||{}),...installationSettings},updated_at:new Date().toISOString()},{onConflict:'client_id'});
    if(activeClientId===clientId)setInstallationStatus(error?'Erro ao salvar: '+error.message:'Tipo de instalação salvo no Supabase.');
    setInstallationSaving(false);
  }
 const addSizingToBudget=(items:BudgetItem[])=>{setBudgetItems(prev=>[...prev,...items]);navigate('Materiais/Orçamentos');setMsg('Itens adicionados ao rascunho local. Para sincronizá-los, use Importar itens do orçamento local em Materiais/Orçamentos.');};
 useEffect(()=>{
    const request=++installationRequest.current;
    if(!activeClientId||!session?.user?.id||!supabase){setInstallationLoading(false);return}
    const clientId=activeClientId;
    setInstallationLoading(true);setInstallationStatus('');
    // Usar rascunho local somente enquanto não houver projeto salvo no banco.
    const localKey=`eletripro-client-${session.user.id}-${clientId}-installation`;
    let fallback=defaultInstallation;
    try{const raw=localStorage.getItem(localKey);if(raw)fallback={...defaultInstallation,...JSON.parse(raw)}}catch{}
    setInstallationSettings(fallback);
    void (async()=>{
      const {data,error}=await supabase.from('eletripro_projects').select('installation').eq('client_id',clientId).maybeSingle();
      if(request!==installationRequest.current)return;
      if(error){setInstallationStatus('Não foi possível carregar o projeto: '+error.message)}
      else if(data){const loaded={...defaultInstallation,...(data.installation||{})};setInstallationSettings(loaded);localStorage.setItem(localKey,JSON.stringify(loaded));setInstallationStatus('')}
      else setInstallationStatus('Projeto ainda não salvo. Clique em Salvar.');
      setInstallationLoading(false);
    })();
    return()=>{installationRequest.current++};
  },[activeClientId,session?.user?.id]);
  useEffect(()=>{if(!activeClientId||!session?.user?.id)return;budgetLoadedFor.current=null;try{const raw=localStorage.getItem(clientStorageKey('installation'));const saved=localStorage.getItem(clientStorageKey('budget'));setBudgetItems(saved?JSON.parse(saved):[])}catch{setBudgetItems([])}},[activeClientId,session?.user?.id]);
 useEffect(()=>{if(!activeClientId||!session?.user?.id)return;if(budgetLoadedFor.current!==activeClientId){budgetLoadedFor.current=activeClientId;return}localStorage.setItem(clientStorageKey('budget'),JSON.stringify(budgetItems))},[budgetItems,activeClientId,session?.user?.id]);
useEffect(()=>{if(!supabase)return;supabase.auth.getSession().then(({data})=>setSession(data.session));const{data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>subscription.unsubscribe()},[]);
useEffect(()=>{if(session&&supabase)void refresh();else {setProfileLoaded(false);setLogo('');setLogoPath('');setProfessional('');setAccent('#a3a3a3')}},[session?.user?.id]);
async function loadWorkflows(){
 if(!supabase||!session?.user?.id)return;
 const r=await supabase.from('eletripro_client_workflow').select('client_id,status,budget_id,completed_at,amount').eq('owner_id',session.user.id);
 if(r.error){setMsg('Indicadores indisponíveis: '+r.error.message+'. Execute o SQL da versão 0.7.30.');return}
 setWorkflows((r.data||[]).map(x=>({...x,amount:Number(x.amount||0)})) as WorkflowRow[]);
}
async function openWorkflow(client:Client){
 if(!supabase)return;
 const saved=workflows.find(x=>x.client_id===client.id);
 setWorkflowClient(client);setWorkflowStatus(saved?.status||'awaiting');setWorkflowBudget(saved?.budget_id||'');
 setWorkflowChoices([]);setWorkflowLoading(true);
 try{
  const project=await supabase.from('eletripro_projects').select('id').eq('client_id',client.id).maybeSingle();
  if(project.error)throw project.error;
  if(project.data?.id){
   await syncUnifiedBudget(project.data.id);
   const budgets=await supabase.from('eletripro_budgets').select('id,title').eq('project_id',project.data.id);
   if(budgets.error)throw budgets.error;
   const choices:BudgetChoice[]=[];
   for(const b of budgets.data||[]){
    const items=await supabase.from('eletripro_budget_items').select('quantity,unit_price').eq('budget_id',b.id);
    if(items.error)throw items.error;
    choices.push({id:b.id,title:b.title,amount:(items.data||[]).reduce((sum,x)=>sum+Number(x.quantity)*Number(x.unit_price),0)});
   }
   setWorkflowChoices(choices);
  }
 }catch(e){setMsg('Não foi possível consultar os orçamentos: '+(e instanceof Error?e.message:String(e)))}
 finally{setWorkflowLoading(false)}
}
async function saveWorkflow(){
 if(!supabase||!session?.user?.id||!workflowClient||workflowBusy)return;
 const prev=workflows.find(x=>x.client_id===workflowClient.id);
 const budget=workflowChoices.find(x=>x.id===workflowBudget);
 if(workflowStatus==='finished'&&!budget){setMsg('Selecione um orçamento para registrar o ganho da execução.');return}
 if(workflowStatus==='finished'&&prev?.status==='finished'&&prev.budget_id!==workflowBudget&&!window.confirm('Alterar o orçamento de um serviço já finalizado atualizará o valor financeiro registrado. Continuar?'))return;
 if(prev?.status==='finished'&&workflowStatus!=='finished'&&!window.confirm('Retirar o status Finalizado removerá esse ganho dos indicadores. Continuar?'))return;
 setWorkflowBusy(true);
 const completedAt=workflowStatus==='finished'?(prev?.status==='finished'&&prev.completed_at?prev.completed_at:new Date().toISOString()):null;
 const payload={client_id:workflowClient.id,owner_id:session.user.id,status:workflowStatus,budget_id:workflowStatus==='finished'?budget!.id:null,amount:workflowStatus==='finished'?budget!.amount:0,completed_at:completedAt};
 const r=await supabase.from('eletripro_client_workflow').upsert(payload,{onConflict:'client_id'});
 setWorkflowBusy(false);
 if(r.error){setMsg('Erro ao salvar andamento: '+r.error.message);return}
 setWorkflowClient(null);await loadWorkflows();setMsg('Situação do cliente atualizada.');
}
async function refresh(){if(!supabase)return;const[{data:cs,error:ce},{data:profile}]=await Promise.all([supabase.from('clients').select('id,name,email,phone,edit_count').order('created_at',{ascending:false}),supabase.from('profiles').select('plan,pro_expires_at').single()]);if(ce)setMsg(ce.message);setClients(cs||[]);setPlan(profile?.plan==='pro'&&profile?.pro_expires_at&&new Date(profile.pro_expires_at)>new Date()?'pro':'free');await loadAccount();await loadWorkflows()}
async function auth(){if(!supabase)return;setLoading(true);setMsg('');if(mode==='signup'&&(!fullName.trim()||!cpf.trim()||!birth||mobile.replace(/\D/g,'').length!==11||!street.trim()||!number.trim()||!neighborhood.trim()||!city.trim()||!state||!email.trim()||!password)){setMsg('Preencha os campos obrigatórios e informe um celular com DDD e 11 dígitos. Complemento e documento são opcionais.');setLoading(false);return}const{error}=mode==='login'?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password,options:{data:{full_name:fullName,phone_contact:mobile.replace(/\D/g,'')}}});setLoading(false);setMsg(error?.message||(mode==='signup'?'Conta solicitada. Confirme seu e-mail. O telefone será registrado no perfil; os demais dados adicionais e o documento ainda não são armazenados.':''))}

async function loadAccount(){if(!supabase||!session?.user?.id)return;const uid=session.user.id;
 const [{data:b,error:be},{data:d,error:de}]=await Promise.all([supabase.from('branding').select('professional_name,accent_color,logo_path').eq('user_id',uid).maybeSingle(),supabase.from('electrician_details').select('full_name,cpf,birth_date,phone,street,street_number,address_complement,neighborhood,city,state_code').eq('user_id',uid).maybeSingle()]);
 if(be||de){setMsg(be?.message||de?.message||'Erro ao carregar perfil');return}
 setProfessional(b?.professional_name||'');setAccent(b?.accent_color||'#a3a3a3');setLogoPath(b?.logo_path||'');
 if(b?.logo_path){const {data,error}=await supabase.storage.from('eletripro-logos').createSignedUrl(b.logo_path,3600);if(!error&&data)setLogo(data.signedUrl)}else setLogo('');
 setFullName(d?.full_name||session.user.user_metadata?.full_name||'');setCpf(d?.cpf||'');setBirth(d?.birth_date||'');setMobile(formatMobile(d?.phone||''));setStreet(d?.street||'');setNumber(d?.street_number||'');setComplement(d?.address_complement||'');setNeighborhood(d?.neighborhood||'');setCity(d?.city||'');setState(d?.state_code||'');setProfileLoaded(true)
}
async function saveProfile(e:React.FormEvent){e.preventDefault();if(!supabase||!session)return;const digits=mobile.replace(/\D/g,'');if(digits&&digits.length!==11){setMsg('Telefone deve conter DDD e 9 dígitos.');return}if(cpf&&cpf.replace(/\D/g,'').length!==11){setMsg('CPF deve conter 11 dígitos.');return}setLoading(true);setMsg('');const {error}=await supabase.from('electrician_details').upsert({user_id:session.user.id,full_name:fullName.trim()||null,cpf:cpf.replace(/\D/g,'')||null,birth_date:birth||null,phone:digits||null,street:street||null,street_number:number||null,address_complement:complement||null,neighborhood:neighborhood||null,city:city||null,state_code:state||null},{onConflict:'user_id'});setLoading(false);setMsg(error?error.message:'Dados pessoais salvos no Supabase.')}

 async function google(){if(!supabase)return;setMsg('');const{error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin}});if(error)setMsg(error.message)}
 async function saveClient(e:React.FormEvent){e.preventDefault();if(!supabase)return;setLoading(true);setMsg('');const payload={name:name.trim(),email:clientEmail.trim()||null,phone:phone.trim()||null};const result=editing?await supabase.from('clients').update(payload).eq('id',editing):await supabase.from('clients').insert(payload);setLoading(false);if(result.error){setMsg(result.error.message);return}setName('');setPhone('');setClientEmail('');setEditing(null);setMsg('Cliente salvo com sucesso.');await refresh()}
 function edit(c:Client){setEditing(c.id);setName(c.name);setPhone(c.phone||'');setClientEmail(c.email||'');document.getElementById('client-form')?.scrollIntoView({behavior:'smooth'})}
 function navigate(t:string){if(clientAreaTabs.includes(t)){if(!activeClientId){setTab('Clientes');setMsg('Abra um cliente para acessar suas abas.');return}setClientAreaTab(t)}setTab(t);setMenu(false);setAccountMenu(false);setMsg('')}
 async function saveBrand(){if(!supabase||!session)return;setLoading(true);setMsg('');let nextPath=logoPath;try{if(logoFile){const ext=logoFile.type==='image/png'?'png':logoFile.type==='image/webp'?'webp':'jpg';const path=`${session.user.id}/empresa-${Date.now()}.${ext}`;const {error:uploadError}=await supabase.storage.from('eletripro-logos').upload(path,logoFile,{contentType:logoFile.type,upsert:false});if(uploadError)throw uploadError;nextPath=path}const{error}=await supabase.from('branding').upsert({user_id:session.user.id,professional_name:professional.trim(),accent_color:accent,logo_path:nextPath||null},{onConflict:'user_id'});if(error)throw error;setLogoPath(nextPath);setLogoFile(null);if(nextPath){const{data}=await supabase.storage.from('eletripro-logos').createSignedUrl(nextPath,3600);if(data)setLogo(data.signedUrl)}setMsg('Identidade profissional salva no Supabase.')}catch(err){setMsg(err instanceof Error?err.message:'Não foi possível salvar a identidade profissional.')}finally{setLoading(false)}}
async function pickLogo(file?:File){if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2097152){setMsg('Use PNG, JPG ou WebP de até 2 MB.');return}setLogoFile(file);const r=new FileReader();r.onload=()=>setLogo(String(r.result));r.readAsDataURL(file)}
const countStatus=(status:WorkStatus)=>clients.filter(c=>(workflows.find(w=>w.client_id===c.id)?.status||'awaiting')===status).length;
const currentMonth=new Date().toISOString().slice(0,7);
const finishedRows=workflows.filter(w=>w.status==='finished'&&w.completed_at);
const earningsMonth=finishedRows.filter(w=>w.completed_at!.slice(0,7)===currentMonth).reduce((n,w)=>n+w.amount,0);
const earningsTotal=finishedRows.reduce((n,w)=>n+w.amount,0);
const monthlyEarnings=Object.entries(finishedRows.reduce((acc,w)=>{const key=w.completed_at!.slice(0,7);acc[key]=(acc[key]||0)+w.amount;return acc},{} as Record<string,number>)).sort((a,b)=>b[0].localeCompare(a[0]));
const isPro=plan==='pro',canCreate=isPro||clients.length===0,selected=clients.find(c=>c.id===editing),canEdit=isPro||!selected||selected.edit_count<1;
const title=(t:string)=>sections.find(s=>s[0]===t)?.[1]||Zap;
const nav=sections.filter(([t])=>!clientAreaTabs.includes(t)).map(([t,Icon])=><button key={t} className={'nav-item '+(tab===t?'active':'')} onClick={()=>navigate(t)}><Icon size={19}/><span>{t}</span></button>);
if(!supabase)return <div className="center"><section className="auth-card"><div className="brand"><Zap/> EletriPro</div><h1>Configuração necessária</h1><p>Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para conectar o Supabase.</p></section></div>;
if(!session)return <div className="center"><section className="auth-card"><div className="brand"><Zap/> EletriPro</div><span className="eyebrow">PLATAFORMA PARA ELETRICISTAS</span><h1>{mode==='login'?'Bem-vindo de volta.':'Crie sua conta.'}</h1><p>Projetos, clientes e orçamentos em um só lugar.</p><button className="google" onClick={google}>Continuar com Google</button><div className="or">ou use seu e-mail</div>{mode==='signup'&&<><label>Nome completo<input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Seu nome"/></label><div className="two"><label>CPF<input value={cpf} onChange={e=>setCpf(e.target.value)} placeholder="000.000.000-00" inputMode="numeric"/></label><label>Nascimento<input type="date" value={birth} onChange={e=>setBirth(e.target.value)}/></label></div><label>Telefone celular (DDD + número)<input type="tel" inputMode="tel" autoComplete="tel-national" maxLength={15} value={mobile} onChange={e=>setMobile(formatMobile(e.target.value))} placeholder="(48) 99999-9999"/></label><label>Endereço<input autoComplete="address-line1" value={street} onChange={e=>setStreet(e.target.value)} placeholder="Rua, avenida ou servidão"/></label><div className="address-pair"><label>Número<input autoComplete="address-line2" value={number} onChange={e=>setNumber(e.target.value)} placeholder="Nº ou S/N"/></label><label>Complemento (opcional)<input value={complement} onChange={e=>setComplement(e.target.value)} placeholder="Apto, bloco, casa..."/></label></div><label>Bairro<input autoComplete="address-level3" value={neighborhood} onChange={e=>setNeighborhood(e.target.value)} placeholder="Seu bairro"/></label><div className="address-city-state"><label>Cidade<input autoComplete="address-level2" value={city} onChange={e=>setCity(e.target.value)} placeholder="Cidade"/></label><label>Estado (UF)<select autoComplete="address-level1" value={state} onChange={e=>setState(e.target.value)}><option value="">Selecione</option>{statesBR.map(uf=><option key={uf} value={uf}>{uf}</option>)}</select></label></div><label className="upload"><Upload size={17}/> {document?document.name:'Selecionar documento com foto'}<input type="file" accept="image/png,image/jpeg,application/pdf" onChange={e=>setDocument(e.target.files?.[0]||null)}/></label><p className="hint">Protótipo: o documento não será enviado nem armazenado. A validação de identidade será implementada com armazenamento privado e consentimento.</p></> }<label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com"/></label><label>Senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Sua senha"/></label><button disabled={loading} onClick={auth} className="primary">{mode==='login'?'Entrar':'Criar conta'} <ArrowRight size={17}/></button><button className="link-button" onClick={()=>{setMode(mode==='login'?'signup':'login');setMsg('')}}>{mode==='login'?'Ainda não tem conta? Cadastre-se':'Já tem conta? Entrar'}</button>{msg&&<div className="notice">{msg}</div>}</section></div>;
return <div className="app" style={{'--accent':accent} as React.CSSProperties}><aside className={menu?'open':''}><div className="sidebar-head"><div className="brand"><Zap/> EletriPro</div><button className="icon-button close-menu" onClick={()=>setMenu(false)} aria-label="Fechar menu"><X/></button></div><span className="eyebrow">ÁREA PROFISSIONAL</span><nav>{nav}</nav><div className="sidebar-bottom"><span className="plan-chip">Plano {isPro?'PRO':'FREE'}</span><button className="nav-item" onClick={()=>supabase.auth.signOut()}><LogOut size={19}/> Sair</button></div></aside>{menu&&<div className="scrim" onClick={()=>setMenu(false)}/>}<div className="main-wrap"><header className="topbar"><button className="icon-button mobile-menu" onClick={()=>setMenu(true)} aria-label="Abrir menu"><Menu/></button><div className="top-brand"><Zap size={20}/> EletriPro</div><div className="account-wrap"><button className="account-trigger" onClick={()=>setAccountMenu(!accountMenu)} aria-expanded={accountMenu} aria-label="Abrir menu da empresa"><span className="company-avatar">{logo?<img src={logo} alt="Logomarca da empresa"/>:<Building2 size={18}/>}</span><span className="company-name">{professional||'Configurar minha empresa'}</span><ChevronDown size={15}/></button>{accountMenu&&<div className="account-dropdown"><button onClick={()=>{navigate('Meu Perfil');setAccountMenu(false)}}>Meu Perfil</button><button onClick={()=>{navigate('Personalização');setAccountMenu(false)}}>Personalização</button><button onClick={()=>{navigate('Assinatura');setAccountMenu(false)}}>Assinatura</button><button onClick={()=>{setAccountMenu(false);void supabase.auth.signOut()}}>Sair</button></div>}</div></header><main className="content"><div className="page-heading"><div><span className="eyebrow">SUA ÁREA DE TRABALHO</span><h1>{tab==='Painel'?'Visão geral':tab}</h1></div><span className="plan-chip">{isPro?'Pro anual':'Free'}</span></div>{msg&&<div className="notice">{msg}</div>}
{tab==='Painel'&&<div className="ep-dashboard-stats ep-dashboard-clean">
 <button type="button" className="ep-client-card" onClick={()=>navigate('Clientes')} aria-label="Ver clientes"><span>Clientes</span><strong>{clients.length}</strong><small>Ver clientes →</small></button>
 <article className="ep-status-card"><span>Situação dos serviços</span><div className="ep-status-rows"><div><span>Aguardando aprovação</span><strong>{countStatus('awaiting')}</strong></div><div><span>Em execução / Aprovado</span><strong>{countStatus('approved')}</strong></div><div><span>Executado / Finalizado</span><strong>{countStatus('finished')}</strong></div></div></article>
 <article><span>Ganhos no mês corrente</span><strong>{brl(earningsMonth)}</strong></article>
 <button type="button" className="ep-earnings-card" onClick={()=>setShowEarnings(true)}><span>Ganhos acumulados</span><strong>{brl(earningsTotal)}</strong><small>Ver ganhos por mês →</small></button>
 </div>}
{tab==='Clientes'&&<><section className="panel"><div className="panel-heading"><div><h2>Meus clientes</h2><p>{isPro?'Cadastros sem limite':`${clients.length} de 1 cliente permitido no Free`}</p></div>{canCreate&&<button className="primary" onClick={()=>{setEditing(null);setName('');setPhone('');setClientEmail('');document.getElementById('client-form')?.scrollIntoView({behavior:'smooth'})}}><Plus size={17}/> Novo</button>}</div>{clients.length===0?<div className="empty"><Users size={28}/><h3>Nenhum cliente cadastrado</h3><p>Cadastre seu primeiro cliente para começar.</p></div>:clients.map(c=><div className="client" key={c.id}><div><strong>{c.name}</strong><p>{c.phone||'Sem telefone'} · {c.email||'Sem e-mail'}</p><small>{isPro?'Plano Pro':`${c.edit_count} de 1 edição utilizada`}</small></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="outline" onClick={()=>void openWorkflow(c)}>{statusNames[workflows.find(w=>w.client_id===c.id)?.status||'awaiting']}</button><button className="primary" onClick={()=>openClient(c.id)}>Abrir projeto</button><button className="outline" disabled={!isPro&&c.edit_count>=1} onClick={()=>edit(c)}>Editar</button></div></div>)}</section>{(canCreate||editing)&&<form id="client-form" className="panel form" onSubmit={saveClient}><h2>{editing?'Editar cliente':'Novo cliente'}</h2><label>Nome completo<input required value={name} onChange={e=>setName(e.target.value)}/></label><label>Telefone<input value={phone} onChange={e=>setPhone(e.target.value)}/></label><label>E-mail<input type="email" value={clientEmail} onChange={e=>setClientEmail(e.target.value)}/></label><button type="submit" className="primary" disabled={loading||!canEdit}>Salvar cliente</button>{editing&&<button type="button" className="outline" onClick={()=>setEditing(null)}>Cancelar</button>}</form>}{!canCreate&&!editing&&<section className="panel"><p>Você atingiu o limite de clientes do plano Free.</p><button className="primary" onClick={()=>navigate('Assinatura')}>Conhecer Pro</button></section>}</>}
{tab==='Personalização'&&<div className="brand-grid"><section className="panel form"><h2>Identidade profissional</h2><p>Defina como sua marca aparecerá nos documentos.</p><label>Nome profissional ou empresa<input value={professional} onChange={e=>setProfessional(e.target.value)} placeholder="Ex.: Minha Elétrica"/></label><label>Logomarca (PNG, JPG ou WebP)<span className="upload"><Upload size={18}/> Selecionar imagem<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>pickLogo(e.target.files?.[0])}/></span></label><label>Cor de destaque</label><div className="swatches">{colors.map(c=><button type="button" key={c} onClick={()=>setAccent(c)} aria-label={'Selecionar '+c} className={accent===c?'selected':''} style={{background:c}}/>)}</div><button className="primary" disabled={loading} onClick={saveBrand}>Salvar personalização</button><p className="hint">Nome, cores e logomarca são sincronizados com sua conta no Supabase. A geração de PDF será implementada depois.</p></section><section className="panel"><h2>Prévia do documento</h2><div className="paper"><div className="paper-head">{logo?<img src={logo} alt="Logomarca"/>:<div className="paper-logo" style={{background:accent}}><Zap/></div>}<div><strong>{professional||'Sua empresa elétrica'}</strong><small>Orçamento de serviços</small></div></div><div className="paper-line" style={{background:accent}}/><p>CLIENTE: Nome do cliente</p><div className="paper-row"><span>Descrição dos serviços</span><span>Valor</span></div><div className="paper-row"><span>Instalação elétrica residencial</span><span>R$ 1.500,00</span></div><div className="paper-total">Total: R$ 1.500,00</div></div><p className="hint">Apenas visualização. Nenhum PDF é gerado nesta versão.</p></section></div>}
{tab==='Meu Perfil'&&<form className="panel form profile-form" onSubmit={saveProfile}><h2>Meus dados</h2><p>Dados pessoais vinculados à sua conta. A confirmação do e-mail é gerenciada pelo Supabase.</p><label>E-mail<input type="email" value={session.user.email||''} disabled/></label><label>Nome completo<input value={fullName} onChange={e=>setFullName(e.target.value)}/></label><div className="two"><label>CPF<input inputMode="numeric" value={cpf} onChange={e=>setCpf(e.target.value.replace(/\D/g,'').slice(0,11))}/></label><label>Nascimento<input type="date" value={birth} onChange={e=>setBirth(e.target.value)}/></label></div><label>Telefone celular<input type="tel" inputMode="tel" placeholder="(48) 99999-9999" value={mobile} onChange={e=>setMobile(formatMobile(e.target.value))}/></label><h2>Endereço</h2><label>Rua / avenida<input value={street} onChange={e=>setStreet(e.target.value)}/></label><div className="two"><label>Número<input value={number} onChange={e=>setNumber(e.target.value)}/></label><label>Complemento<input value={complement} onChange={e=>setComplement(e.target.value)}/></label></div><label>Bairro<input value={neighborhood} onChange={e=>setNeighborhood(e.target.value)}/></label><div className="two"><label>Cidade<input value={city} onChange={e=>setCity(e.target.value)}/></label><label>Estado<select value={state} onChange={e=>setState(e.target.value)}><option value="">Selecione</option>{statesBR.map(st=><option key={st} value={st}>{st}</option>)}</select></label></div><p className="hint">Envio de documento com foto e troca de senha serão disponibilizados após a validação do fluxo de segurança.</p><button className="primary" type="submit" disabled={loading||!profileLoaded}>Salvar meus dados</button></form>}
{tab==='Assinatura'&&<section className="panel subscription"><Crown size={32}/><h2>EletriPro Pro</h2><p>Assinatura anual com clientes ilimitados e recursos profissionais.</p><strong>Valor a definir</strong><button className="primary" disabled>Pagamento Pix em preparação</button><small>O acesso Pro só será ativado após confirmação segura do pagamento pelo Mercado Pago.</small></section>}
{clientAreaOpen&&activeClient&&<section className="panel" style={{marginBottom:16}}><div className="panel-heading"><div><span className="eyebrow">ÁREA DO CLIENTE</span><h2>{activeClient.name}</h2><p>{activeClient.phone||'Sem telefone'} · {activeClient.email||'Sem e-mail'}</p></div><button className="outline" onClick={()=>navigate('Clientes')}>Voltar aos clientes</button></div><div style={{display:'flex',flexWrap:'wrap',gap:8}}>{clientAreaTabs.map(t=><button key={t} className={tab===t?'primary':'outline'} onClick={()=>navigate(t)}>{t}</button>)}</div></section>}
{tab==='Tipo de instalação'&&activeClient&&<><InstallationSetup settings={installationSettings} onChange={updateInstallation} onSave={()=>void saveInstallation()} saving={installationLoading||installationSaving}/>{installationStatus&&installationStatus.startsWith("Erro")&&<p className="hint" role="alert">{installationStatus}</p>}</>}
{tab==='Dimensionamento'&&activeClient&&<CircuitSizing key={activeClientId} clientId={activeClientId} userId={session.user.id} settings={installationSettings}/>}
{tab==='Alimentador geral'&&activeClient&&<FeederPanel key={'feeder-'+activeClientId} clientId={activeClientId!} userId={session.user.id} settings={installationSettings}/>}
{tab==='Quadro de distribuição'&&activeClient&&<DistributionPanel key={activeClientId} clientId={activeClientId!} userId={session.user.id} settings={installationSettings}/>}
{tab==='Ambientes'&&activeClient&&<Environments key={activeClientId} clientId={activeClientId!} userId={session.user.id}/>}
{tab==='Relatórios'&&activeClient&&<TechnicalReport key={'report-'+activeClientId} client={activeClient} userId={session.user.id} professional={professional} logo={logo} accent={accent} settings={installationSettings}/>}
{tab==='Materiais/Orçamentos'&&activeClient&&<div className="ep-material-budget-layout"><MaterialsPanel key={'materials-'+activeClientId} clientId={activeClientId!} userId={session.user.id} localBudget={budgetItems} client={activeClient} professional={professional} logo={logo} accent={accent}/></div>}
{workflowClient&&<div className="ep-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!workflowBusy)setWorkflowClient(null)}}>
 <section className="ep-workflow-dialog" role="dialog" aria-modal="true" aria-label="Situação do cliente">
 <div className="ep-workflow-head"><div><h2>Situação do cliente</h2><p>{workflowClient.name}</p></div><button className="outline" onClick={()=>setWorkflowClient(null)} disabled={workflowBusy} aria-label="Fechar"><X size={18}/></button></div>
 <label>Andamento<select value={workflowStatus} disabled={workflowBusy} onChange={e=>setWorkflowStatus(e.target.value as WorkStatus)}><option value="awaiting">Aguardando aprovação</option><option value="approved">Em execução / Aprovado</option><option value="finished">Executado / Finalizado</option></select></label>
 {workflowStatus==='finished'&&<><label>Orçamento executado<select value={workflowBudget} disabled={workflowBusy||workflowLoading} onChange={e=>setWorkflowBudget(e.target.value)}><option value="">Selecione o orçamento</option>{workflowChoices.map(b=><option key={b.id} value={b.id}>{b.title} — {brl(b.amount)}</option>)}</select></label><p className="hint">O valor do orçamento escolhido será registrado como ganho na data da finalização. O valor registrado na finalização permanece como histórico, mesmo que a lista seja alterada depois.</p></>}
 <div className="ep-summary-actions"><button className="primary" disabled={workflowBusy||workflowLoading} onClick={()=>void saveWorkflow()}>{workflowBusy?'Salvando...':'Salvar'}</button><button className="outline" disabled={workflowBusy} onClick={()=>setWorkflowClient(null)}>Fechar</button></div>
 </section></div>}
 {showEarnings&&<div className="ep-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setShowEarnings(false)}}>
 <section className="ep-workflow-dialog" role="dialog" aria-modal="true" aria-label="Ganhos por mês"><div className="ep-workflow-head"><h2>Ganhos por mês</h2><button className="outline" onClick={()=>setShowEarnings(false)} aria-label="Fechar"><X size={18}/></button></div>
 {monthlyEarnings.length?monthlyEarnings.map(([month,total])=><div className="ep-month-row" key={month}><span>{monthLabel(month+'-01')}</span><strong>{brl(total)}</strong></div>):<p>Nenhum serviço finalizado com orçamento registrado.</p>}
 <div className="ep-total-highlight"><span>Total acumulado</span><strong>{brl(earningsTotal)}</strong></div><button className="outline" onClick={()=>setShowEarnings(false)}>Fechar</button></section></div>}
 {!['Painel','Clientes','Personalização','Meu Perfil','Assinatura','Tipo de instalação','Dimensionamento','Ambientes','Quadro de distribuição','Alimentador geral','Materiais/Orçamentos','Relatórios'].includes(tab)&&<section className="panel empty"><div className="feature-icon">{React.createElement(title(tab),{size:30})}</div><h2>{tab}</h2><p>Módulo em desenvolvimento. Os cálculos elétricos serão liberados somente após validação técnica dos critérios aplicáveis da NBR 5410.</p>{tab==='Dimensionamento'&&<span className="plan-chip">Acesso Free limitado</span>}</section>}
</main><footer>EletriPro · Interface v0.7.37 · Dados de demonstração identificados</footer></div></div>}
createRoot(document.getElementById('root')!).render(<App/>);
