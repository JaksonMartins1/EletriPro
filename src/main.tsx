import React,{useEffect,useState} from 'react';
import{createRoot}from'react-dom/client';
import{LayoutDashboard,Users,Calculator,Ruler,ClipboardList,FileText,Crown,LogOut,Zap,Palette,Menu,X,Plus,ArrowRight,Upload,ShieldCheck,FolderOpen,Mail,LockKeyhole,Building2,ChevronDown}from'lucide-react';
import{ supabase }from './supabase';import './style.css';
type Client={id:string;name:string;email:string|null;phone:string|null;edit_count:number};
const sections=[['Painel',LayoutDashboard],['Clientes',Users],['Tipo de instalação',Building2],['Dimensionamento',Calculator],['Ambientes',Ruler],['Materiais',ClipboardList],['Orçamentos',FileText],['Personalização',Palette],['Meu Perfil',Users],['Assinatura',Crown]] as const;
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

type InstallationSettings={application:string;supply:string;voltage:string;method:string;temperature:string;groupMode:string;powerFactor:string;conductorMaterial:string;conductorInsulation:string;groupCount:string;wiring:string};
const defaultInstallation:InstallationSettings={application:'residential',supply:'single',voltage:'220',method:'B1',temperature:'30',groupMode:'bundle',powerFactor:'1',conductorMaterial:'copper',conductorInsulation:'PVC 70 °C',groupCount:'1',wiring:'phase-neutral'};
const installationStorageKey='ep_installation_v0716';
function readInstallation():InstallationSettings{try{const saved=JSON.parse(localStorage.getItem(installationStorageKey)||'null');return saved?{...defaultInstallation,...saved}:defaultInstallation}catch{return defaultInstallation}}
function InstallationSetup({settings,onChange}:{settings:InstallationSettings;onChange:(s:InstallationSettings)=>void}){
 const update=(key:keyof InstallationSettings,value:string)=>onChange({...settings,[key]:value,...(key==='method'?{groupMode:'bundle'}:{})});
 return <section className="panel sizing-form"><h2>Tipo de instalação</h2><p>Configure os dados gerais da instalação alimentada em baixa tensão pela concessionária. Os valores serão reutilizados no Dimensionamento.</p>
 <div className="two"><label>Tipo de instalação<select value={settings.application} onChange={e=>update('application',e.target.value)}><option value="residential">Residencial</option><option value="commercial">Comercial</option><option value="industrial">Industrial (baixa tensão)</option></select></label><label>Fornecimento da concessionária<select value={settings.supply} onChange={e=>update('supply',e.target.value)}><option value="single">Monofásico</option><option value="two">Bifásico</option><option value="three">Trifásico</option></select></label></div>
 <div className="two"><label>Tensão do circuito (V)<input type="number" min="1" value={settings.voltage} onChange={e=>update('voltage',e.target.value)} placeholder="Ex.: 220"/></label><label>Método de referência<select value={settings.method} onChange={e=>update('method',e.target.value)}>{['A1','A2','B1','B2','C','D','E','F','G'].map(x=><option key={x}>{x}</option>)}</select></label></div>
 <div className="two"><label>Temperatura ambiente (°C)<select value={settings.temperature} onChange={e=>update('temperature',e.target.value)}><option value="">Selecione</option>{['10','15','20','25','30','35','40','45','50','55','60','65','70','75','80'].map(t=><option key={t} value={t}>{t} °C</option>)}</select></label><label>Disposição do agrupamento<select value={settings.groupMode} onChange={e=>update('groupMode',e.target.value)}><option value="bundle">Feixe ou conduto fechado (tabela 42, linha 1)</option>{settings.method==='C'&&<option value="singleLayer">Camada única sobre parede/piso (linha 2)</option>}</select></label></div>
 <h3>Parâmetros gerais dos circuitos</h3>
 <div className="two"><label>Fator de potência padrão<input type="number" min="0.01" max="1" step="0.01" value={settings.powerFactor} onChange={e=>update('powerFactor',e.target.value)}/></label><label>Material dos condutores<select value={settings.conductorMaterial} onChange={e=>update('conductorMaterial',e.target.value)}><option value="copper">Cobre</option><option value="aluminum">Alumínio</option></select></label></div>
 <div className="two"><label>Isolação<select value={settings.conductorInsulation} onChange={e=>update('conductorInsulation',e.target.value)}><option>PVC 70 °C</option><option>EPR / XLPE 90 °C</option><option>Outra — verificar tabela</option></select></label></div>
 {settings.supply==='two'&&<label>Composição dos condutores<select value={settings.wiring} onChange={e=>update('wiring',e.target.value)}><option value="phase-neutral">Fase + neutro</option><option value="phase-phase">Duas fases (sem neutro)</option></select></label>}
 <p className="hint">Estes valores são padrões do projeto para o cálculo preliminar. Em instalações reais, o fator de potência, o agrupamento e a composição podem variar entre circuitos e devem ser verificados individualmente.</p>
 <p className="hint">Os parâmetros são salvos neste navegador. A tensão informada é a tensão do circuito a dimensionar; confirme a tensão fase-neutro ou fase-fase conforme a ligação. Circuitos trifásicos ainda não possuem pré-seleção automática validada.</p></section>
}
type BudgetItem={id:string;description:string;unit:string;quantity:number;unitPrice:number};
// Seção preliminar de PE pelo critério simplificado para mesmo material da fase.
// O projeto deve confirmar condições de instalação e eventual cálculo adiabático.
const peSection=(phase:number)=>phase<=16?phase:phase<=35?16:phase/2;
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
  else if(result.data){const saved=result.data as SavedEnvironment;setRows(old=>selectedId?old.map(x=>x.id===saved.id?saved:x):[...old,saved]);setSelectedId(saved.id);setStatus('Ambiente salvo no Supabase.');}
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
  <section className="panel"><div className="panel-heading"><div><h2>Ambientes do projeto</h2><p>Cadastre cômodos e recupere suas medidas em qualquer dispositivo.</p></div><button type="button" className="outline" onClick={()=>{reset();setViewMode(false);setEditorOpen(true)}} disabled={busy||loading}><Plus size={16}/> Novo ambiente</button></div>
   {loading?<p className="hint">Carregando ambientes...</p>:rows.length===0?<p className="hint">Nenhum ambiente cadastrado.</p>:<div style={{display:'flex',flexWrap:'wrap',gap:8}}>{rows.map(row=><button key={row.id} type="button" className={selectedId===row.id?'primary':'outline'} onClick={()=>selectRow(row)} disabled={busy}>{row.title}</button>)}</div>}
   {rows.length>0&&<p className="hint">{rows.length} ambiente(s) · Soma das áreas cadastradas: {totalArea.toLocaleString('pt-BR',{maximumFractionDigits:2})} m² (não desconta sobreposições).</p>}
   {status&&<p role="status" className="hint" style={{marginTop:12}}>{status}</p>}
  </section>
  {editorOpen&&<div className="ep-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)reset()}}><section className="panel sizing-form ep-editor-card" role="dialog" aria-modal={true} aria-label={selectedId?'Editar ambiente':'Novo ambiente'}><div className="ep-editor-heading"><h2>{selectedId?(viewMode?title:'Editar ambiente'):'Novo ambiente'}</h2>{<button type="button" className="ep-close" aria-label="Fechar" onClick={reset} disabled={busy}><X size={20}/></button>}</div>
   {viewMode&&selectedId?<div className="ep-summary">
    {(()=>{const perimeter=dimensionsValid?2*(w+l):null;const points=perimeter===null?null:kind==='Banheiro'?1:kind==='Corredor'?1:Math.max(1,Math.ceil((perimeter-1e-9)/(kind==='Cozinha'||kind==='Lavanderia'?3.5:5)));const kitchen=['Cozinha','Lavanderia'].includes(kind);const tugVA=points===null?null:kitchen?Math.min(3,points)*600+Math.max(0,points-3)*100:kind==='Banheiro'?600:points*100;const lightingVA=area===null?null:area<=6?100:100+60*Math.floor((area-6)/4+1e-9);return <>
      <div className="ep-summary-grid"><div><span>Área</span><strong>{area===null?'—':`${area.toLocaleString('pt-BR',{maximumFractionDigits:2})} m²`}</strong></div><div><span>Perímetro</span><strong>{perimeter===null?'—':`${perimeter.toLocaleString('pt-BR',{maximumFractionDigits:2})} m`}</strong></div><div><span>Quantidade mínima de TUG</span><strong>{points??'—'}</strong></div><div><span>Potência mínima de TUG</span><strong>{tugVA===null?'—':`${tugVA} VA`}</strong></div><div><span>Quantidade mínima de pontos de luz</span><strong>1</strong></div><div><span>Potência mínima de iluminação</span><strong>{lightingVA===null?'—':`${lightingVA} VA`}</strong></div></div>
      <p className="hint">Critérios mínimos de previsão de carga da ABNT NBR 5410 para habitações. TUG: sala/quarto, 1 a cada 5 m ou fração do perímetro; cozinha/área de serviço, 1 a cada 3,5 m ou fração; iluminação: 100 VA até 6 m², mais 60 VA por cada 4 m² inteiros adicionais. Valores em VA, não em W. Outras condições e tipos de ambiente exigem análise específica.</p>
     </>})()}
    <div className="ep-summary-actions"><button type="button" className="primary" onClick={()=>setViewMode(false)}>Editar</button><button type="button" className="outline" disabled={busy} onClick={()=>void remove()}>Excluir</button><button type="button" className="outline" onClick={reset}>Fechar</button></div>
   </div>:<div className="ep-edit-body">
   <label>Nome do ambiente<input maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex.: Sala de estar"/></label>
   <label>Tipo de ambiente<select value={kind} onChange={e=>setKind(e.target.value)}>{environmentTypes.map(t=><option key={t} value={t}>{t}</option>)}</select></label>
   <div className="two"><label>Largura (m)<input type="number" min="0.01" step="any" value={width} onChange={e=>setWidth(e.target.value)} placeholder="Ex.: 3,5"/></label><label>Comprimento (m)<input type="number" min="0.01" step="any" value={length} onChange={e=>setLength(e.target.value)} placeholder="Ex.: 4"/></label></div>
   <div className="sizing-metric"><span>Área calculada</span><strong>{area===null?'—':area.toLocaleString('pt-BR',{maximumFractionDigits:2})+' m²'}</strong></div>
   <label>Observações (opcional)<textarea rows={3} maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Informações do ambiente"/></label>
   <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button type="button" className="primary" disabled={loading||busy||!projectId||!title.trim()||!dimensionsValid} onClick={()=>void save()}>{busy?'Aguarde...':selectedId?'Atualizar ambiente':'Salvar ambiente'}</button>{selectedId&&<button type="button" className="outline" disabled={busy} onClick={()=>void remove()}>Excluir ambiente</button>}</div>
   <p className="hint">Área geométrica (largura × comprimento). As previsões mínimas são exibidas ao abrir o ambiente salvo.</p>
  <button type="button" className="outline" onClick={reset} disabled={busy}>Fechar</button></div>}</section></div>}
 </div>;
}
type SavedCircuit={id:string;title:string;data:Record<string,unknown>};
function CircuitSizing({settings,clientId,userId}:{settings:InstallationSettings;clientId:string;userId:string}){
 const [editorOpen,setEditorOpen]=useState(false);
 const [viewMode,setViewMode]=useState(false);
 const [environmentId,setEnvironmentId]=useState(''),[environmentOptions,setEnvironmentOptions]=useState<SavedEnvironment[]>([]),[materialSending,setMaterialSending]=useState(false);
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
  const clearCircuit=()=>{setViewMode(false);setEditorOpen(false);setSelectedCircuitId(null);setCircuitTitle('');setCircuit('tug');setPower('');setPf(settings.powerFactor);setLength('');setMaterial('copper');setWiring('phase-neutral');setInsulation('PVC 70 °C');setGroupCount(settings.groupCount);setEnvironmentId('');setCircuitStatus('Novo circuito: preencha os dados e clique em Salvar circuito.');};
  const selectSavedCircuit=(row:SavedCircuit)=>{
    const d=row.data||{};
    const val=(key:string,fallback:string)=>typeof d[key]==='string'?String(d[key]):fallback;
    setEditorOpen(true);setViewMode(true);setEnvironmentId(val('environmentId',''));setSelectedCircuitId(row.id);setCircuitTitle(row.title);setCircuit(val('circuit','tug'));setPower(val('power',''));setPf(settings.powerFactor);setLength(val('length',''));setMaterial(settings.conductorMaterial);setWiring(settings.wiring);setInsulation(settings.conductorInsulation);setGroupCount(val('groupCount',settings.groupCount));setCircuitStatus('Circuito carregado.');
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
    if(!Number.isFinite(Number(power))||Number(power)<=0||!Number.isFinite(Number(length))||Number(length)<0){setCircuitStatus('Informe potência positiva e comprimento válido.');return}
    setCircuitBusy(true);setCircuitStatus('');
    const {data:project,error:pe}=await supabase.from('eletripro_projects').select('id').eq('client_id',clientId).maybeSingle();
    if(pe||!project){setCircuitStatus(pe?'Erro: '+pe.message:'Salve primeiro o Tipo de instalação.');setCircuitBusy(false);return}
    const data={environmentId:environmentId||null,circuit,power,pf:settings.powerFactor,length,material:settings.conductorMaterial,wiring:settings.wiring,insulation:settings.conductorInsulation,groupCount,results:{current,selectedSection,corrected,drop,pct,breaker:breakerCandidate,curve:tripCurve},installationSnapshot:settings};
    const result=selectedCircuitId
      ?await supabase.from('eletripro_circuits').update({title,data,updated_at:new Date().toISOString()}).eq('id',selectedCircuitId).eq('project_id',project.id).select('id,title,data').single()
      :await supabase.from('eletripro_circuits').insert({project_id:project.id,title,data}).select('id,title,data').single();
    if(result.error)setCircuitStatus('Erro ao salvar circuito: '+result.error.message);
    else if(result.data){const saved=result.data as SavedCircuit;setSavedCircuits(old=>selectedCircuitId?old.map(x=>x.id===saved.id?saved:x):[...old,saved]);setSelectedCircuitId(saved.id);setCircuitStatus('Circuito salvo no Supabase.');}
    setCircuitBusy(false);
  }
  async function deleteCircuit(){
    if(!supabase||!selectedCircuitId||circuitBusy||!window.confirm('Excluir este circuito salvo?'))return;
    setCircuitBusy(true);
    const id=selectedCircuitId;
    const {error}=await supabase.from('eletripro_circuits').delete().eq('id',id);
    if(error)setCircuitStatus('Erro ao excluir: '+error.message);
    else{setSavedCircuits(old=>old.filter(x=>x.id!==id));clearCircuit();setCircuitStatus('Circuito excluído do Supabase.');}
    setCircuitBusy(false);
  }

  async function sendSizingMaterials(items:BudgetItem[]){
    if(!supabase||materialSending)return;
    if(!window.confirm(`Salvar ${items.length} itens do dimensionamento diretamente em Materiais? Revise duplicidades e quantidades depois.`))return;
    setMaterialSending(true);setCircuitStatus('Salvando materiais no Supabase...');
    try{
      const projectId=await ensureEletriProject(clientId,userId);
      const result=await supabase.from('eletripro_materials').insert(items.map(x=>({project_id:projectId,description:x.description,quantity:x.quantity,unit:x.unit,unit_price:x.unitPrice})));
      if(result.error)throw result.error;
      setCircuitStatus(`${items.length} itens adicionados a Materiais no Supabase. Abra a aba Materiais para revisar quantidades e preços.`);
    }catch(e){setCircuitStatus('Erro ao enviar materiais: '+(e instanceof Error?e.message:String(e)));}
    finally{setMaterialSending(false)}
  }
 async function sendSizingMaterials(items:BudgetItem[]){
   if(!supabase||materialSending)return;
   if(!window.confirm(`Salvar ${items.length} itens do dimensionamento diretamente em Materiais? Confira duplicidades e quantidades depois.`))return;
   setMaterialSending(true);setCircuitStatus('Salvando materiais...');
   try{
     const projectId=await ensureEletriProject(clientId,userId);
     const r=await supabase.from('eletripro_materials').insert(items.map(x=>({project_id:projectId,description:x.description,quantity:x.quantity,unit:x.unit,unit_price:x.unitPrice})));
     if(r.error)throw r.error;
     setCircuitStatus(`${items.length} itens adicionados a Materiais no Supabase. Revise os preços e quantidades na aba Materiais.`);
   }catch(e){setCircuitStatus('Erro ao salvar materiais: '+(e instanceof Error?e.message:String(e)))}
   finally{setMaterialSending(false)}
 }
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
 const p=num(power),v=num(voltage),f=num(effectivePf),l=num(length);
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
 // Integração: testar cada seção comercial em ordem crescente, exigindo capacidade,
 // queda de tensão e um In que satisfaça Ib ≤ In ≤ Iz.
 const coordinated=candidates.map(x=>({
   ...x,
   breaker:x.ampacityOk&&x.dropOk&&current!==null
     ?(breakerRatings.find(inom=>inom>=(circuit==='lighting'?10: circuit==='tug'?16:6)&&inom>=current-1e-9&&inom<=x.iz+1e-9)??null)
     :null
 })).find(x=>x.breaker!==null)??null;
 const decisionSteps=candidates.filter(x=>coordinated?x.size<=coordinated.size:(electricalCandidate?x.size<=electricalCandidate.size: false)).map(x=>{
   const inRating=x.ampacityOk&&x.dropOk&&current!==null
     ?(breakerRatings.find(inom=>inom>=(circuit==='lighting'?10: circuit==='tug'?16:6)&&inom>=current-1e-9&&inom<=x.iz+1e-9)??null):null;
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
 return <><section className="panel" style={{marginBottom:16}}><div className="panel-heading"><div><h2>Circuitos do projeto</h2><p>Cadastre vários circuitos e recupere seus dados em qualquer dispositivo.</p></div><button type="button" className="outline" disabled={circuitBusy} onClick={()=>{clearCircuit();setViewMode(false);setEditorOpen(true)}}><Plus size={16}/> Novo circuito</button></div>
  {circuitLoading?<p className="hint">Carregando circuitos...</p>:savedCircuits.length===0?<p className="hint">Nenhum circuito salvo neste projeto.</p>:<div className="ep-circuit-list">{savedCircuits.map((x,i)=><button type="button" key={x.id} className="ep-circuit-list-item" onClick={()=>selectSavedCircuit(x)}><span className="ep-circuit-index">{String(i+1).padStart(2,'0')}</span><span>{x.title}</span><span className="ep-circuit-arrow">›</span></button>)}</div>}
  </section>{editorOpen&&<div className="ep-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!circuitBusy)clearCircuit()}}><div className="ep-circuit-editor" role="dialog" aria-modal={true} aria-label={selectedCircuitId?'Editar circuito':'Novo circuito'}><div className="ep-editor-heading"><h2>{selectedCircuitId?(viewMode?circuitTitle:'Editar circuito'):'Novo circuito'}</h2>{<button type="button" className="ep-close" aria-label="Fechar" disabled={circuitBusy} onClick={clearCircuit}><X size={20}/></button>}</div>{viewMode&&selectedCircuitId?<section className="panel ep-circuit-details"><div className="ep-summary">
 <div className="ep-summary-grid"><div><span>Seção do condutor</span><strong>{selectedSection===null?'—':`${fmt(selectedSection)} mm²`}</strong></div><div><span>Disjuntor</span><strong>{breakerCandidate===null?'—':`${breakerCandidate} A`}</strong></div></div>
 <p className="hint">{circuit==='tug'&&/ilumina/i.test(circuitTitle)?'Atenção: este circuito está cadastrado como TUG, apesar do nome indicar iluminação. Clique em Editar e corrija o tipo para aplicar seção mínima de 1,5 mm². ':''}Cálculo preliminar. Confirmar a coordenação Ib ≤ In ≤ Iz e as condições de proteção antes da especificação.</p>
 <div className="ep-summary-actions"><button type="button" className="primary" onClick={()=>setViewMode(false)}>Editar</button><button type="button" className="outline" disabled={circuitBusy} onClick={()=>void deleteCircuit()}>Excluir</button><button type="button" className="outline" onClick={clearCircuit}>Fechar</button></div>
 </div></section>:<><section className="panel ep-circuit-details"><label>Ambiente associado (opcional)<select value={environmentId} onChange={e=>setEnvironmentId(e.target.value)}><option value="">Sem ambiente associado</option>{environmentOptions.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label>
  <label>Nome do circuito<input value={circuitTitle} onChange={e=>setCircuitTitle(e.target.value)} placeholder="Ex.: C1 - Iluminação da sala"/></label>

  {circuitStatus&&<p className="hint" role="status">{circuitStatus}</p>}
  </section><div className="sizing-layout"><section className="panel sizing-form"><h2>Dados do circuito</h2>
 <label>Tipo de circuito<select value={circuit} onChange={e=>setCircuit(e.target.value)}><option value="lighting">Iluminação</option><option value="tug">Tomadas de uso geral</option><option value="tue">Circuito dedicado / TUE</option><option value="motor">Motor / máquina</option><option value="feeder">Alimentador</option><option value="other">Outro</option></select></label>
 <h3>Dados elétricos</h3><label>Quantidade de circuitos agrupados<select value={groupCount} onChange={e=>setGroupCount(e.target.value)}>{Object.keys(grouping5410[settings.groupMode]||grouping5410.bundle).map(n=><option key={n} value={n}>{n}</option>)}</select></label><div className="two"><label>Potência ativa (W)<input type="number" min="0" step="any" value={power} onChange={e=>setPower(e.target.value)} placeholder="Ex.: 5400"/></label><label>Comprimento de ida (m)<input type="number" min="0" step="any" value={length} onChange={e=>setLength(e.target.value)} placeholder="Ex.: 15"/></label></div>
 <details className="ep-details"><summary>Parâmetros gerais utilizados</summary><p className="hint">Tensão: {voltage} V · Método: {method} · Temperatura: {temperature} °C · Material: {effectiveMaterial==='copper'?'cobre':'alumínio'}. Altere os padrões em Tipo de instalação.</p></details></section>
 <section className="panel sizing-results"><h2>Seção do condutor</h2><div className="sizing-metric"><span>Corrente de projeto (Ib)</span><strong>{current===null?'—':`${fmt(current)} A`}</strong></div><div className="sizing-metric"><span>Seção do condutor/Bitola</span><strong>{selectedSection===null?'—':`${String(selectedSection).replace('.',',')} mm²`}</strong></div>
 {noCompliantCandidate&&<div className="sizing-warning"><strong>Nenhuma seção aprovada no modelo experimental</strong><p>Não foi encontrada seção que atenda simultaneamente à corrente e ao limite provisório de 4% dentro da base provisória. Não use esse resultado para especificação.</p></div>}
 {current!==null&&!supported&&<div className="sizing-warning"><strong>Condição não contemplada</strong><p>Esta condição não está coberta pelas tabelas e hipóteses implementadas. Não é possível pré-selecionar a seção automaticamente.</p></div>}
 {noBreakerSolution&&<div className="sizing-warning"><strong>Sem combinação preliminar de cabo e disjuntor</strong><p>Há seção que atende à corrente e à queda estimada, mas nenhuma das seções disponíveis permite um disjuntor da lista com Ib ≤ In ≤ Iz. Não selecione um disjuntor acima da capacidade corrigida do condutor.</p></div>}
 {candidate!==null&&breakerCandidate!==null&&Number.isFinite(l)&&l>0&&<div className="sizing-formula"><strong>Enviar materiais ao cadastro do projeto</strong><p className="hint">Cabos separados por função e cor, com metragem inicial igual ao comprimento de ida para cada condutor. Ajuste cada quantidade e preço em Materiais. Em iluminação, o retorno é estimado com o mesmo comprimento; confirme o percurso real. A seção do PE é preliminar. Não inclui perdas nem reserva técnica.</p><button type="button" className="primary" disabled={materialSending} onClick={()=>void sendSizingMaterials(budgetCableItems({length:l,size:candidate.size,material:effectiveMaterial,insulation:effectiveInsulation,circuit,wiring:effectiveWiring,breaker:breakerCandidate,curve:tripCurve||'a confirmar',poles:effectiveWiring==='phase-neutral'?1:effectiveWiring==='phase-phase'?2:3}))}>{materialSending?'Salvando...':'Adicionar cabos e disjuntor a Materiais'}</button></div>}
 {candidate!==null&&current!==null&&<details className="sizing-formula"><summary>Ver memória de seleção automática</summary>
 <p>1. Corrente de projeto: Ib = {fmt(current)} A. Seção mínima considerada: {String(minSection).replace('.',',')} mm².</p>
 <p>2. Capacidade corrigida: Iz = Iz₀ × Ft × Fg, com Ft = {fmt(ft!)} e Fg = {fmt(fg!)}.</p>
 <p>3. Para cada seção comercial, verificar Iz ≥ Ib, queda resistiva estimada ≤ 4% e existência de In na lista com Ib ≤ In ≤ Iz.</p>
 <div style={{overflowX:'auto'}}><table style={{width:'100%',fontSize:'0.85em',borderCollapse:'collapse'}}><thead><tr><th style={{textAlign:'left',padding:'6px'}}>Seção</th><th style={{textAlign:'left',padding:'6px'}}>Iz</th><th style={{textAlign:'left',padding:'6px'}}>Queda</th><th style={{textAlign:'left',padding:'6px'}}>Decisão</th></tr></thead><tbody>
 {decisionSteps.map(x=><tr key={x.size} style={{borderTop:'1px solid #444'}}><td style={{padding:'6px',whiteSpace:'nowrap'}}>{String(x.size).replace('.',',')} mm²</td><td style={{padding:'6px'}}>{fmt(x.iz)} A</td><td style={{padding:'6px'}}>{fmt(x.percent)}%</td><td style={{padding:'6px'}}>{x.reason}{x.inRating!==null?` (In ${x.inRating} A)`:''}</td></tr>)}
 </tbody></table></div>
 <p><strong>Resultado:</strong> {String(candidate.size).replace('.',',')} mm² e disjuntor {breakerCandidate} A. {raisedForBreaker?'A seção aumentou para viabilizar a coordenação com disjuntor.':electricalCandidate&&currentOnly&&electricalCandidate.size>currentOnly.size?'A seção aumentou por queda de tensão.':'A primeira seção aprovada também permite a coordenação.'}</p>
 <small>Memória demonstrativa do modelo preliminar. Não substitui verificações normativas e características reais dos dispositivos.</small></details>}
 <div className="sizing-formula"><strong>Disjuntor</strong>
 <div className="sizing-metric"><span>Corrente nominal (In)</span><strong>{breakerCandidate===null?'—':`${breakerCandidate.toLocaleString('pt-BR',{maximumFractionDigits:0})} A`}</strong></div>
 <div className="sizing-metric"><span>Curva de disparo</span><strong>{breakerCandidate!==null&&tripCurve?`Curva ${tripCurve}`:'—'}</strong></div>
 </div>
 
  <span className="plan-chip">v0.7.28 · circuitos no Supabase</span></section></div>
 <div className="ep-modal-actions"><button type="button" className="primary" disabled={circuitBusy||circuitLoading||!circuitTitle.trim()||!Number.isFinite(p)||p<=0||!Number.isFinite(l)||l<=0} onClick={()=>void saveCircuit()}>{circuitBusy?'Salvando...':selectedCircuitId?'Atualizar circuito':'Salvar circuito'}</button>{selectedCircuitId&&<button type="button" className="outline" disabled={circuitBusy} onClick={()=>void deleteCircuit()}>Excluir circuito</button>}</div></>}<button type="button" className="outline ep-modal-close-bottom" onClick={clearCircuit} disabled={circuitBusy}>Fechar</button></div></div>}</>
}

type MaterialRow={id:string;description:string;quantity:number;unit:string;unit_price:number};
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
function MaterialsPanel({clientId,userId,localBudget}:{clientId:string;userId:string;localBudget:BudgetItem[]}){
 const [rows,setRows]=useState<MaterialRow[]>([]),[projectId,setProjectId]=useState(''),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
 const [description,setDescription]=useState(''),[quantity,setQuantity]=useState('1'),[unit,setUnit]=useState('un'),[unitPrice,setUnitPrice]=useState('0');
 const [editingId,setEditingId]=useState<string|null>(null);
 const [editorOpen,setEditorOpen]=useState(false);
 const [refreshCount,setRefreshCount]=useState(0);
 useEffect(()=>{
  let live=true;setRows([]);setProjectId('');setStatus('Carregando materiais...');
  void (async()=>{try{
   if(!supabase)throw new Error('Supabase indisponível');
   const id=await ensureEletriProject(clientId,userId);
   const result=await supabase.from('eletripro_materials').select('id,description,quantity,unit,unit_price').eq('project_id',id).order('created_at',{ascending:true});
   if(result.error)throw result.error;
   if(live){setProjectId(id);setRows((result.data||[]) as MaterialRow[]);setStatus('Materiais carregados do Supabase.');}
  }catch(e){if(live)setStatus('Erro ao carregar materiais: '+(e instanceof Error?e.message:String(e)))}})();
  return()=>{live=false};
 },[clientId,userId,refreshCount]);
 const reset=()=>{setEditorOpen(false);setEditingId(null);setDescription('');setQuantity('1');setUnit('un');setUnitPrice('0')};
 async function save(){
  if(!supabase||!projectId||busy)return;
  const q=Number(quantity),price=Number(unitPrice),desc=description.trim();
  if(!desc||!Number.isFinite(q)||q<0||!Number.isFinite(price)||price<0){setStatus('Informe descrição, quantidade e preço válidos.');return}
  setBusy(true);setStatus('Salvando...');
  const payload={description:desc,quantity:q,unit,unit_price:price,updated_at:new Date().toISOString()};
  const result=editingId
   ?await supabase.from('eletripro_materials').update(payload).eq('id',editingId).eq('project_id',projectId)
   :await supabase.from('eletripro_materials').insert({project_id:projectId,...payload});
  setBusy(false);
  if(result.error){setStatus('Erro ao salvar: '+result.error.message);return}
  reset();setRefreshCount(x=>x+1);
 }
 async function remove(row:MaterialRow){
  if(!supabase||!projectId||busy||!window.confirm('Excluir o material '+row.description+'?'))return;
  setBusy(true);const result=await supabase.from('eletripro_materials').delete().eq('id',row.id).eq('project_id',projectId);
  setBusy(false);if(result.error){setStatus('Erro ao excluir: '+result.error.message);return}
  if(editingId===row.id)reset();setRefreshCount(x=>x+1);
 }
 async function importBudget(){
  if(!supabase||!projectId||busy||!localBudget.length)return;
  if(!window.confirm(`Importar ${localBudget.length} itens do orçamento local para Materiais? Itens já existentes não serão substituídos e poderão ficar duplicados.`))return;
  setBusy(true);setStatus('Importando itens...');
  const result=await supabase.from('eletripro_materials').insert(localBudget.map(item=>({project_id:projectId,description:item.description,quantity:item.quantity,unit:item.unit,unit_price:item.unitPrice})));
  setBusy(false);if(result.error){setStatus('Erro na importação: '+result.error.message);return}
  setRefreshCount(x=>x+1);
 }
 return <section className="panel"><div className="panel-heading"><div><h2>Materiais do projeto</h2><p>Materiais vinculados ao cliente, sincronizados pelo Supabase.</p></div><button type="button" className="primary" onClick={()=>{reset();setEditorOpen(true)}} disabled={busy}><Plus size={16}/> Cadastrar material</button></div>
 <p className="hint" role="status">{status}</p>
 <div style={{overflowX:'auto'}}><table style={{width:'100%',minWidth:590}}><thead><tr><th>Descrição</th><th>Quantidade</th><th>Un.</th><th>Preço un.</th><th>Ações</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.description}</td><td>{Number(r.quantity).toLocaleString('pt-BR')}</td><td>{r.unit}</td><td>{moneyBR(Number(r.unit_price))}</td><td><button className="outline" disabled={busy} onClick={()=>{setEditorOpen(true);setEditingId(r.id);setDescription(r.description);setQuantity(String(r.quantity));setUnit(r.unit);setUnitPrice(String(r.unit_price))}}>Editar</button> <button className="outline" disabled={busy} onClick={()=>void remove(r)}>Excluir</button></td></tr>)}</tbody></table></div>
 {rows.length===0&&<p className="hint">Nenhum material salvo neste projeto.</p>}
 <div className="ep-total-highlight"><span>Valor total dos materiais</span><strong>{moneyBR(rows.reduce((sum,r)=>sum+Number(r.quantity)*Number(r.unit_price),0))}</strong></div>
 {editorOpen&&<div className="ep-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)reset()}}><div className="panel sizing-form ep-editor-card" role="dialog" aria-modal={true} aria-label={editingId?'Editar material':'Cadastrar material'}><div className="ep-editor-heading"><h3>{editingId?'Editar material':'Cadastrar material'}</h3><button type="button" className="ep-close" aria-label="Fechar" onClick={reset} disabled={busy}><X size={20}/></button></div>
 <label>Descrição<input value={description} onChange={e=>setDescription(e.target.value)}/></label>
 <div className="two"><label>Quantidade<input type="number" min="0" step="0.001" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label><label>Unidade<select value={unit} onChange={e=>setUnit(e.target.value)}><option value="un">un</option><option value="m">m</option><option value="m²">m²</option><option value="h">h</option><option value="kg">kg</option></select></label></div>
 <label>Preço unitário (R$)<input type="number" min="0" step="0.01" value={unitPrice} onChange={e=>setUnitPrice(e.target.value)}/></label>
 <button className="primary" disabled={busy||!projectId||!description.trim()} onClick={()=>void save()}>{editingId?'Atualizar material':'Salvar material'}</button> <button type="button" className="outline" onClick={reset} disabled={busy}>Fechar</button></div></div>}
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
 <section className="panel"><div className="panel-heading"><div><h2>Orçamentos do projeto · Supabase</h2><p>Crie e edite vários orçamentos para este cliente. Os dados são sincronizados após clicar em Salvar orçamento.</p></div><button className="outline" type="button" disabled={busy||loading} onClick={newBudget}><Plus size={16}/> Novo orçamento</button></div>
 {loading?<p className="hint">Carregando...</p>:budgets.length===0?<p className="hint">Nenhum orçamento salvo neste projeto.</p>:<div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{budgets.map(b=><button key={b.id} type="button" disabled={busy} className={selectedId===b.id?'primary':'outline'} onClick={()=>void selectBudget(b)}>{b.title}</button>)}</div>}
 <p className="hint" role="status">{status}</p>
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

function App(){const[session,setSession]=useState<any>(null),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[mode,setMode]=useState<'login'|'signup'>('login'),[msg,setMsg]=useState(''),[tab,setTab]=useState('Painel'),[menu,setMenu]=useState(false),[clients,setClients]=useState<Client[]>([]),[plan,setPlan]=useState('free'),[name,setName]=useState(''),[phone,setPhone]=useState(''),[clientEmail,setClientEmail]=useState(''),[editing,setEditing]=useState<string|null>(null),[loading,setLoading]=useState(false),[professional,setProfessional]=useState(localStorage.getItem('ep_professional')||''),[accent,setAccent]=useState(localStorage.getItem('ep_accent')||'#a3a3a3'),[logo,setLogo]=useState(localStorage.getItem('ep_logo')||''),[fullName,setFullName]=useState(''),[mobile,setMobile]=useState(''),[cpf,setCpf]=useState(''),[birth,setBirth]=useState(''),[street,setStreet]=useState(''),[number,setNumber]=useState(''),[complement,setComplement]=useState(''),[neighborhood,setNeighborhood]=useState(''),[city,setCity]=useState(''),[state,setState]=useState(''),[document,setDocument]=useState<File|null>(null),[logoFile,setLogoFile]=useState<File|null>(null),[logoPath,setLogoPath]=useState(''),[accountMenu,setAccountMenu]=useState(false),[profileLoaded,setProfileLoaded]=useState(false);
 const [budgetItems,setBudgetItems]=useState<BudgetItem[]>([]);
 const [activeClientId,setActiveClientId]=useState<string|null>(null);
 const [clientAreaTab,setClientAreaTab]=useState('Tipo de instalação');
 const budgetLoadedFor=React.useRef<string|null>(null);
 const clientAreaTabs=['Tipo de instalação','Dimensionamento','Ambientes','Materiais','Orçamentos'];
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
    const {error}=await supabase.from('eletripro_projects').upsert({client_id:clientId,owner_id:session.user.id,installation:installationSettings,updated_at:new Date().toISOString()},{onConflict:'client_id'});
    if(activeClientId===clientId)setInstallationStatus(error?'Erro ao salvar: '+error.message:'Tipo de instalação salvo no Supabase.');
    setInstallationSaving(false);
  }
 const addSizingToBudget=(items:BudgetItem[])=>{setBudgetItems(prev=>[...prev,...items]);navigate('Orçamentos');setMsg('Itens adicionados ao orçamento local. Para sincronizá-los no Supabase, abra Materiais e use Importar itens do orçamento local.');};
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
      else if(data){const loaded={...defaultInstallation,...(data.installation||{})};setInstallationSettings(loaded);localStorage.setItem(localKey,JSON.stringify(loaded));setInstallationStatus('Configurações carregadas do Supabase.')}
      else setInstallationStatus('Projeto ainda não salvo no Supabase. Confira os dados e clique em Salvar tipo de instalação.');
      setInstallationLoading(false);
    })();
    return()=>{installationRequest.current++};
  },[activeClientId,session?.user?.id]);
  useEffect(()=>{if(!activeClientId||!session?.user?.id)return;budgetLoadedFor.current=null;try{const raw=localStorage.getItem(clientStorageKey('installation'));const saved=localStorage.getItem(clientStorageKey('budget'));setBudgetItems(saved?JSON.parse(saved):[])}catch{setBudgetItems([])}},[activeClientId,session?.user?.id]);
 useEffect(()=>{if(!activeClientId||!session?.user?.id)return;if(budgetLoadedFor.current!==activeClientId){budgetLoadedFor.current=activeClientId;return}localStorage.setItem(clientStorageKey('budget'),JSON.stringify(budgetItems))},[budgetItems,activeClientId,session?.user?.id]);
useEffect(()=>{if(!supabase)return;supabase.auth.getSession().then(({data})=>setSession(data.session));const{data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>subscription.unsubscribe()},[]);
useEffect(()=>{if(session&&supabase)void refresh();else {setProfileLoaded(false);setLogo('');setLogoPath('');setProfessional('');setAccent('#a3a3a3')}},[session?.user?.id]);
async function refresh(){if(!supabase)return;const[{data:cs,error:ce},{data:profile}]=await Promise.all([supabase.from('clients').select('id,name,email,phone,edit_count').order('created_at',{ascending:false}),supabase.from('profiles').select('plan,pro_expires_at').single()]);if(ce)setMsg(ce.message);setClients(cs||[]);setPlan(profile?.plan==='pro'&&profile?.pro_expires_at&&new Date(profile.pro_expires_at)>new Date()?'pro':'free');await loadAccount()}
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
const isPro=plan==='pro',canCreate=isPro||clients.length===0,selected=clients.find(c=>c.id===editing),canEdit=isPro||!selected||selected.edit_count<1;
const title=(t:string)=>sections.find(s=>s[0]===t)?.[1]||Zap;
const nav=sections.filter(([t])=>!clientAreaTabs.includes(t)).map(([t,Icon])=><button key={t} className={'nav-item '+(tab===t?'active':'')} onClick={()=>navigate(t)}><Icon size={19}/><span>{t}</span></button>);
if(!supabase)return <div className="center"><section className="auth-card"><div className="brand"><Zap/> EletriPro</div><h1>Configuração necessária</h1><p>Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para conectar o Supabase.</p></section></div>;
if(!session)return <div className="center"><section className="auth-card"><div className="brand"><Zap/> EletriPro</div><span className="eyebrow">PLATAFORMA PARA ELETRICISTAS</span><h1>{mode==='login'?'Bem-vindo de volta.':'Crie sua conta.'}</h1><p>Projetos, clientes e orçamentos em um só lugar.</p><button className="google" onClick={google}>Continuar com Google</button><div className="or">ou use seu e-mail</div>{mode==='signup'&&<><label>Nome completo<input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Seu nome"/></label><div className="two"><label>CPF<input value={cpf} onChange={e=>setCpf(e.target.value)} placeholder="000.000.000-00" inputMode="numeric"/></label><label>Nascimento<input type="date" value={birth} onChange={e=>setBirth(e.target.value)}/></label></div><label>Telefone celular (DDD + número)<input type="tel" inputMode="tel" autoComplete="tel-national" maxLength={15} value={mobile} onChange={e=>setMobile(formatMobile(e.target.value))} placeholder="(48) 99999-9999"/></label><label>Endereço<input autoComplete="address-line1" value={street} onChange={e=>setStreet(e.target.value)} placeholder="Rua, avenida ou servidão"/></label><div className="address-pair"><label>Número<input autoComplete="address-line2" value={number} onChange={e=>setNumber(e.target.value)} placeholder="Nº ou S/N"/></label><label>Complemento (opcional)<input value={complement} onChange={e=>setComplement(e.target.value)} placeholder="Apto, bloco, casa..."/></label></div><label>Bairro<input autoComplete="address-level3" value={neighborhood} onChange={e=>setNeighborhood(e.target.value)} placeholder="Seu bairro"/></label><div className="address-city-state"><label>Cidade<input autoComplete="address-level2" value={city} onChange={e=>setCity(e.target.value)} placeholder="Cidade"/></label><label>Estado (UF)<select autoComplete="address-level1" value={state} onChange={e=>setState(e.target.value)}><option value="">Selecione</option>{statesBR.map(uf=><option key={uf} value={uf}>{uf}</option>)}</select></label></div><label className="upload"><Upload size={17}/> {document?document.name:'Selecionar documento com foto'}<input type="file" accept="image/png,image/jpeg,application/pdf" onChange={e=>setDocument(e.target.files?.[0]||null)}/></label><p className="hint">Protótipo: o documento não será enviado nem armazenado. A validação de identidade será implementada com armazenamento privado e consentimento.</p></> }<label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com"/></label><label>Senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Sua senha"/></label><button disabled={loading} onClick={auth} className="primary">{mode==='login'?'Entrar':'Criar conta'} <ArrowRight size={17}/></button><button className="link-button" onClick={()=>{setMode(mode==='login'?'signup':'login');setMsg('')}}>{mode==='login'?'Ainda não tem conta? Cadastre-se':'Já tem conta? Entrar'}</button>{msg&&<div className="notice">{msg}</div>}</section></div>;
return <div className="app" style={{'--accent':accent} as React.CSSProperties}><aside className={menu?'open':''}><div className="sidebar-head"><div className="brand"><Zap/> EletriPro</div><button className="icon-button close-menu" onClick={()=>setMenu(false)} aria-label="Fechar menu"><X/></button></div><span className="eyebrow">ÁREA PROFISSIONAL</span><nav>{nav}</nav><div className="sidebar-bottom"><span className="plan-chip">Plano {isPro?'PRO':'FREE'}</span><button className="nav-item" onClick={()=>supabase.auth.signOut()}><LogOut size={19}/> Sair</button></div></aside>{menu&&<div className="scrim" onClick={()=>setMenu(false)}/>}<div className="main-wrap"><header className="topbar"><button className="icon-button mobile-menu" onClick={()=>setMenu(true)} aria-label="Abrir menu"><Menu/></button><div className="top-brand"><Zap size={20}/> EletriPro</div><div className="account-wrap"><button className="account-trigger" onClick={()=>setAccountMenu(!accountMenu)} aria-expanded={accountMenu} aria-label="Abrir menu da empresa"><span className="company-avatar">{logo?<img src={logo} alt="Logomarca da empresa"/>:<Building2 size={18}/>}</span><span className="company-name">{professional||'Configurar minha empresa'}</span><ChevronDown size={15}/></button>{accountMenu&&<div className="account-dropdown"><button onClick={()=>{navigate('Meu Perfil');setAccountMenu(false)}}>Meu Perfil</button><button onClick={()=>{navigate('Personalização');setAccountMenu(false)}}>Personalização</button><button onClick={()=>{navigate('Assinatura');setAccountMenu(false)}}>Assinatura</button><button onClick={()=>{setAccountMenu(false);void supabase.auth.signOut()}}>Sair</button></div>}</div></header><main className="content"><div className="page-heading"><div><span className="eyebrow">SUA ÁREA DE TRABALHO</span><h1>{tab==='Painel'?'Visão geral':tab}</h1></div><span className="plan-chip">{isPro?'Pro anual':'Free'}</span></div>{msg&&<div className="notice">{msg}</div>}
{tab==='Painel'&&<><section className="welcome"><div><span className="eyebrow">ELETRIPRO</span><h2>Seu trabalho, mais simples.</h2><p>Organize seus clientes e prepare cada etapa do seu serviço.</p><button className="primary" onClick={()=>navigate('Clientes')}>Ver clientes <ArrowRight size={17}/></button></div><Zap className="welcome-mark" size={96}/></section><div className="stats"><article><Users/><span>Clientes</span><strong>{clients.length}</strong></article><article><FolderOpen/><span>Projetos</span><strong>—</strong></article><article><FileText/><span>Orçamentos</span><strong>—</strong></article></div><h3 className="section-title">Acesso rápido</h3><div className="quick-grid">{sections.filter(s=>['Clientes','Personalização'].includes(s[0])).map(([t,Icon])=><button className="quick-card" key={t} onClick={()=>navigate(t)}><Icon size={23}/><span>{t}</span><ArrowRight size={15}/></button>)}</div></>}
{tab==='Clientes'&&<><section className="panel"><div className="panel-heading"><div><h2>Meus clientes</h2><p>{isPro?'Cadastros sem limite':`${clients.length} de 1 cliente permitido no Free`}</p></div>{canCreate&&<button className="primary" onClick={()=>{setEditing(null);setName('');setPhone('');setClientEmail('');document.getElementById('client-form')?.scrollIntoView({behavior:'smooth'})}}><Plus size={17}/> Novo</button>}</div>{clients.length===0?<div className="empty"><Users size={28}/><h3>Nenhum cliente cadastrado</h3><p>Cadastre seu primeiro cliente para começar.</p></div>:clients.map(c=><div className="client" key={c.id}><div><strong>{c.name}</strong><p>{c.phone||'Sem telefone'} · {c.email||'Sem e-mail'}</p><small>{isPro?'Plano Pro':`${c.edit_count} de 1 edição utilizada`}</small></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="primary" onClick={()=>openClient(c.id)}>Abrir projeto</button><button className="outline" disabled={!isPro&&c.edit_count>=1} onClick={()=>edit(c)}>Editar</button></div></div>)}</section>{(canCreate||editing)&&<form id="client-form" className="panel form" onSubmit={saveClient}><h2>{editing?'Editar cliente':'Novo cliente'}</h2><label>Nome completo<input required value={name} onChange={e=>setName(e.target.value)}/></label><label>Telefone<input value={phone} onChange={e=>setPhone(e.target.value)}/></label><label>E-mail<input type="email" value={clientEmail} onChange={e=>setClientEmail(e.target.value)}/></label><button type="submit" className="primary" disabled={loading||!canEdit}>Salvar cliente</button>{editing&&<button type="button" className="outline" onClick={()=>setEditing(null)}>Cancelar</button>}</form>}{!canCreate&&!editing&&<section className="panel"><p>Você atingiu o limite de clientes do plano Free.</p><button className="primary" onClick={()=>navigate('Assinatura')}>Conhecer Pro</button></section>}</>}
{tab==='Personalização'&&<div className="brand-grid"><section className="panel form"><h2>Identidade profissional</h2><p>Defina como sua marca aparecerá nos documentos.</p><label>Nome profissional ou empresa<input value={professional} onChange={e=>setProfessional(e.target.value)} placeholder="Ex.: Minha Elétrica"/></label><label>Logomarca (PNG, JPG ou WebP)<span className="upload"><Upload size={18}/> Selecionar imagem<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>pickLogo(e.target.files?.[0])}/></span></label><label>Cor de destaque</label><div className="swatches">{colors.map(c=><button type="button" key={c} onClick={()=>setAccent(c)} aria-label={'Selecionar '+c} className={accent===c?'selected':''} style={{background:c}}/>)}</div><button className="primary" disabled={loading} onClick={saveBrand}>Salvar personalização</button><p className="hint">Nome, cores e logomarca são sincronizados com sua conta no Supabase. A geração de PDF será implementada depois.</p></section><section className="panel"><h2>Prévia do documento</h2><div className="paper"><div className="paper-head">{logo?<img src={logo} alt="Logomarca"/>:<div className="paper-logo" style={{background:accent}}><Zap/></div>}<div><strong>{professional||'Sua empresa elétrica'}</strong><small>Orçamento de serviços</small></div></div><div className="paper-line" style={{background:accent}}/><p>CLIENTE: Nome do cliente</p><div className="paper-row"><span>Descrição dos serviços</span><span>Valor</span></div><div className="paper-row"><span>Instalação elétrica residencial</span><span>R$ 1.500,00</span></div><div className="paper-total">Total: R$ 1.500,00</div></div><p className="hint">Apenas visualização. Nenhum PDF é gerado nesta versão.</p></section></div>}
{tab==='Meu Perfil'&&<form className="panel form profile-form" onSubmit={saveProfile}><h2>Meus dados</h2><p>Dados pessoais vinculados à sua conta. A confirmação do e-mail é gerenciada pelo Supabase.</p><label>E-mail<input type="email" value={session.user.email||''} disabled/></label><label>Nome completo<input value={fullName} onChange={e=>setFullName(e.target.value)}/></label><div className="two"><label>CPF<input inputMode="numeric" value={cpf} onChange={e=>setCpf(e.target.value.replace(/\D/g,'').slice(0,11))}/></label><label>Nascimento<input type="date" value={birth} onChange={e=>setBirth(e.target.value)}/></label></div><label>Telefone celular<input type="tel" inputMode="tel" placeholder="(48) 99999-9999" value={mobile} onChange={e=>setMobile(formatMobile(e.target.value))}/></label><h2>Endereço</h2><label>Rua / avenida<input value={street} onChange={e=>setStreet(e.target.value)}/></label><div className="two"><label>Número<input value={number} onChange={e=>setNumber(e.target.value)}/></label><label>Complemento<input value={complement} onChange={e=>setComplement(e.target.value)}/></label></div><label>Bairro<input value={neighborhood} onChange={e=>setNeighborhood(e.target.value)}/></label><div className="two"><label>Cidade<input value={city} onChange={e=>setCity(e.target.value)}/></label><label>Estado<select value={state} onChange={e=>setState(e.target.value)}><option value="">Selecione</option>{statesBR.map(st=><option key={st} value={st}>{st}</option>)}</select></label></div><p className="hint">Envio de documento com foto e troca de senha serão disponibilizados após a validação do fluxo de segurança.</p><button className="primary" type="submit" disabled={loading||!profileLoaded}>Salvar meus dados</button></form>}
{tab==='Assinatura'&&<section className="panel subscription"><Crown size={32}/><h2>EletriPro Pro</h2><p>Assinatura anual com clientes ilimitados e recursos profissionais.</p><strong>Valor a definir</strong><button className="primary" disabled>Pagamento Pix em preparação</button><small>O acesso Pro só será ativado após confirmação segura do pagamento pelo Mercado Pago.</small></section>}
{clientAreaOpen&&activeClient&&<section className="panel" style={{marginBottom:16}}><div className="panel-heading"><div><span className="eyebrow">ÁREA DO CLIENTE</span><h2>{activeClient.name}</h2><p>{activeClient.phone||'Sem telefone'} · {activeClient.email||'Sem e-mail'}</p></div><button className="outline" onClick={()=>navigate('Clientes')}>Voltar aos clientes</button></div><div style={{display:'flex',flexWrap:'wrap',gap:8}}>{clientAreaTabs.map(t=><button key={t} className={tab===t?'primary':'outline'} onClick={()=>navigate(t)}>{t}</button>)}</div><p className="hint">Tipo de instalação pode ser salvo no Supabase. Orçamentos salvos são sincronizados no Supabase; o rascunho local é preservado até importação manual.</p></section>}
{tab==='Tipo de instalação'&&activeClient&&<><InstallationSetup settings={installationSettings} onChange={updateInstallation}/><section className="panel" style={{marginTop:12}}><button type="button" className="primary" disabled={installationLoading||installationSaving} onClick={saveInstallation}>{installationLoading?'Carregando projeto...':installationSaving?'Salvando...':'Salvar tipo de instalação'}</button>{installationStatus&&<p className="hint" role="status">{installationStatus}</p>}</section></>}
{tab==='Dimensionamento'&&activeClient&&<CircuitSizing key={activeClientId} clientId={activeClientId} userId={session.user.id} settings={installationSettings}/>}
{tab==='Ambientes'&&activeClient&&<Environments key={activeClientId} clientId={activeClientId!} userId={session.user.id}/>}
{tab==='Materiais'&&activeClient&&<MaterialsPanel key={activeClientId} clientId={activeClientId!} userId={session.user.id} localBudget={budgetItems}/> }
{tab==='Orçamentos'&&activeClient&&<BudgetsPanel key={activeClientId} clientId={activeClientId!} userId={session.user.id} localBudget={budgetItems}/> }
{!['Painel','Clientes','Personalização','Meu Perfil','Assinatura','Tipo de instalação','Dimensionamento','Ambientes','Materiais','Orçamentos'].includes(tab)&&<section className="panel empty"><div className="feature-icon">{React.createElement(title(tab),{size:30})}</div><h2>{tab}</h2><p>Módulo em desenvolvimento. Os cálculos elétricos serão liberados somente após validação técnica dos critérios aplicáveis da NBR 5410.</p>{tab==='Dimensionamento'&&<span className="plan-chip">Acesso Free limitado</span>}</section>}
</main><footer>EletriPro · Interface v0.7.25.1 · Dados de demonstração identificados</footer></div></div>}
createRoot(document.getElementById('root')!).render(<App/>);
