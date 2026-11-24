import React,{useEffect,useState} from 'react';
import{createRoot}from'react-dom/client';
import{LayoutDashboard,Users,Calculator,Ruler,ClipboardList,FileText,Crown,LogOut,Zap,Palette,Menu,X,Plus,ArrowRight,Upload,ShieldCheck,FolderOpen,Mail,LockKeyhole,Building2,ChevronDown,Search,CalendarDays,Wallet,ChevronRight}from'lucide-react';
import IntegratedCheckout from './IntegratedCheckout';import{ supabase }from './supabase';import{downloadTechnicalPdf, type ReportSection}from './reportPdf';import './style.css';
type Client={id:string;name:string;email:string|null;phone:string|null;location?:string|null;edit_count:number};
type WorkStatus='awaiting'|'approved'|'in_progress'|'finished'|'cancelled';
type WorkflowRow={client_id:string;status:WorkStatus;budget_id:string|null;completed_at:string|null;amount:number;planned_start_date?:string|null};
type BudgetChoice={id:string;title:string;amount:number};
const statusNames:Record<WorkStatus,string>={awaiting:'Aguardando aprovação',approved:'Aprovado',in_progress:'Em execução',finished:'Finalizado',cancelled:'Cancelado'};
const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const monthLabel=(date:string)=>new Date(date+'T12:00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
const sections=[['Painel',LayoutDashboard],['Clientes',Users],['Tipo de instalação',Building2],['Dimensionamento',Calculator],['Ambientes',Ruler],['Quadro de distribuição',ClipboardList],['Materiais',ClipboardList],['Orçamento',FileText],['Personalização',Palette],['Meu Perfil',Users],['Assinatura',Crown]] as const;
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
 <div className="two"><label>Tipo de instalação<select value={settings.application} onChange={e=>update('application',e.target.value)}><option value="residential">Residencial</option><option value="commercial">Comercial</option><option value="industrial">Industrial (baixa tensão)</option></select></label></div>
 <p className="hint" role="note"><strong>Projeto novo:</strong> cadastre primeiro os ambientes e os circuitos. A configuração de fornecimento utilizada nos cálculos do quadro e alimentador é provisória até o enquadramento pela concessionária. Para a rede CELESC 220/380 V, a proposta de fornecimento é calculada após o cadastro das cargas. Verifique as condições da rede e os equipamentos especiais.</p>
 <div className="two"><label>Tensão padrão dos circuitos (V)<input type="number" min="1" value={settings.voltage} onChange={e=>update('voltage',e.target.value)} placeholder="Ex.: 220"/></label></div>
 <div className="two"><label>Tensão fase-neutro — VFN (V)<input type="number" min="1" value={settings.voltageFN||''} onChange={e=>update('voltageFN',e.target.value)} placeholder="Ex.: 220"/></label><label>Tensão fase-fase — VFF (V)<input type="number" min="1" value={settings.voltageFF||''} onChange={e=>update('voltageFF',e.target.value)} placeholder="Ex.: 380"/></label></div>
 <p className="hint">A tensão do circuito permanece independente. Para alimentadores com mais de uma fase, informe VFN e VFF conforme o fornecimento real; não convertemos automaticamente circuitos existentes.</p>
 <p className="hint" role="note"><strong>Premissa residencial automática:</strong> condutores isolados de cobre em eletrodutos embutidos em alvenaria — método de referência B1, PVC 70 °C, ambiente de 30 °C e agrupamento conforme cadastro. A tensão não permite identificar a instalação física; confirme a premissa antes da execução. Configurações técnicas estão disponíveis abaixo.</p>
 <details className="ep-details"><summary>Configurações técnicas avançadas</summary>
 <p className="hint" role="alert">O fornecimento será proposto automaticamente após cadastrar os circuitos. A alteração de fases exige revisar ligações do QD e redimensionar o alimentador.</p>
 <p className="hint">O fornecimento é calculado a partir dos circuitos cadastrados; não precisa ser selecionado nesta etapa.</p>
 {!['B1','B2','C'].includes(settings.method)&&<p className="hint" role="alert">Método anteriormente cadastrado ({settings.method}) não possui tabela de dimensionamento implementada. Selecione um método suportado após verificar a instalação física.</p>}
 <label>Método de referência<select value={settings.method} onChange={e=>update('method',e.target.value)}>{['B1','B2','C'].map(x=><option key={x}>{x}</option>)}</select></label>
 <div className="two"><label>Temperatura ambiente (°C)<select value={settings.temperature} onChange={e=>update('temperature',e.target.value)}><option value="">Selecione</option>{['10','15','20','25','30','35','40','45','50','55','60','65','70','75','80'].map(t=><option key={t} value={t}>{t} °C</option>)}</select></label><label>Disposição do agrupamento<select value={settings.groupMode} onChange={e=>update('groupMode',e.target.value)}><option value="bundle">Feixe ou conduto fechado (tabela 42, linha 1)</option>{settings.method==='C'&&<option value="singleLayer">Camada única sobre parede/piso (linha 2)</option>}</select></label></div>
 <h3>Parâmetros gerais dos circuitos</h3>
 <div className="two"><label>Fator de potência padrão<input type="number" min="0.01" max="1" step="0.01" value={settings.powerFactor} onChange={e=>update('powerFactor',e.target.value)}/></label><label>Material dos condutores<select value={settings.conductorMaterial} onChange={e=>update('conductorMaterial',e.target.value)}><option value="copper">Cobre</option><option value="aluminum">Alumínio</option></select></label></div>
 <div className="two"><label>Isolação<select value={settings.conductorInsulation} onChange={e=>update('conductorInsulation',e.target.value)}><option>PVC 70 °C</option><option>EPR / XLPE 90 °C</option><option>Outra — verificar tabela</option></select></label></div>
 {settings.supply==='two'&&<label>Composição dos condutores<select value={settings.wiring} onChange={e=>update('wiring',e.target.value)}><option value="phase-neutral">Fase + neutro</option><option value="phase-phase">Duas fases (sem neutro)</option></select></label>}
 
 </details>
 <div className="ep-form-footer"><button type="button" className="primary" disabled={saving} onClick={onSave}>{saving?"Salvando...":"Salvar"}</button></div></section>
}
type BudgetItem={id:string;description:string;unit:string;quantity:number;unitPrice:number;itemType?:'material'|'labor';sourceRole?:string};
// Seção preliminar de PE pelo critério simplificado para mesmo material da fase.
// O projeto deve confirmar condições de instalação e eventual cálculo adiabático.
const standardPeSections=[1.5,2.5,4,6,10,16,25,35,50,70,95,120,150,185,240,300];
const peSection=(phase:number)=>{const required=phase<=16?phase:phase<=35?16:phase/2;return standardPeSections.find(v=>v>=required)||required;};
type CatalogDescription={category:string;name:string;section_mm2:number|null;nominal_a:number|null;poles:number|null;curve:string|null;material:string|null;insulation:string|null;active:boolean};
const catalogKey=(v:unknown)=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'');
const catalogCableDescription=(catalog:CatalogDescription[],section:number,material:string,insulation:string,color?:string)=>{
 const aliases:Record<string,string[]>={'azul-claro':['azul','azul claro'],verde:['verde'],amarelo:['amarelo'],preto:['preto'],branco:['branco'],vermelho:['vermelho']};
 const words=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 if(!color)return null; // sem cor conhecida, não selecionar um cabo arbitrário
 const matches=catalog.filter(x=>x.category==='cabo'&&x.active&&x.section_mm2!==null&&Math.abs(Number(x.section_mm2)-section)<0.001&&[catalogKey(material),catalogKey(material==='copper'?'cobre':material==='aluminum'?'alumínio':material)].includes(catalogKey(x.material))&&catalogKey(x.insulation)===catalogKey(insulation)&& (aliases[color]||[color]).some(v=>(' '+words(x.name)+' ').includes(' '+words(v)+' ')));
 return matches.length===1?matches[0].name:null;
};
const catalogBreakerDescription=(catalog:CatalogDescription[],breaker:number,poles:number,curve:string)=>{
 const matches=catalog.filter(x=>x.category==='disjuntor'&&x.active&&x.nominal_a!==null&&Math.abs(Number(x.nominal_a)-breaker)<0.001);
 const exact=matches.find(x=>(x.poles===null||Number(x.poles)===poles)&&(!x.curve||catalogKey(x.curve)===catalogKey(curve)));
 return exact?.name||null;
};
const loadActiveElectricalCatalog=async():Promise<CatalogDescription[]>=>{
 if(!supabase)return [];
 const {data,error}=await supabase.from('eletripro_electrical_catalog').select('category,name,section_mm2,nominal_a,poles,curve,material,insulation,active').eq('active',true);
 // Catálogo não instalado ou inacessível: manter as descrições originais.
 if(error)return [];
 return (data||[]) as CatalogDescription[];
};
const budgetCableItems=(params:{length:number;size:number;material:string;insulation:string;circuit:string;wiring:string;breaker:number;curve:string;poles:number;catalog?:CatalogDescription[];connection?:string}):BudgetItem[]=>{
 const {length,size,material,insulation,circuit,wiring,breaker,curve,poles}=params;
 const catalog=params.catalog||[];
 const base=`Cabo flexível de ${material==='copper'?'cobre':'alumínio'} ${insulation}`;
 const fmtSize=(n:number)=>n.toLocaleString('pt-BR',{maximumFractionDigits:2,minimumFractionDigits:1});
 const specs:{functionName:string;color:string;section:number}[]=[];
 const phaseColors:Record<string,string>={A:'preto',B:'branco',C:'vermelho'};
 const count=wiring==='three'?3:wiring==='phase-phase'?2:1;
 const connection=params.connection||('ABC'.slice(0,count));
 for(const phase of connection)if(phaseColors[phase])specs.push({functionName:'Fase '+phase,color:phaseColors[phase],section:size});
 if(wiring==='phase-neutral')specs.push({functionName:'Neutro',color:'azul-claro',section:size});
 if(circuit==='lighting')specs.push({functionName:'Retorno',color:'amarelo',section:size});
 else specs.push({functionName:'Proteção (PE)',color:'verde',section:peSection(size)});
 const stamp=Date.now().toString(36);
 const items:BudgetItem[]=specs.map((spec,i)=>({id:`cabo-${stamp}-${i}`,sourceRole:spec.functionName.startsWith('Fase')?(i===0?'phase':`phase-${i}`):spec.functionName==='Neutro'?'neutral':spec.functionName==='Retorno'?'return':'pe',description:catalogCableDescription(catalog,spec.section,material,insulation,spec.color)||`${base} ${fmtSize(spec.section)} mm² — ${spec.color}`,unit:'m',quantity:Math.round(length*100)/100,unitPrice:0}));
 items.push({id:`dj-${stamp}`,description:catalogBreakerDescription(catalog,breaker,poles,curve)||`Disjuntor ${breaker} A · curva ${curve||'a confirmar'} (${poles} ${poles===1?'polo':'polos'})`,unit:'un',quantity:1,unitPrice:0});
 return items;
};
const moneyBR=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
// Busca tolerante a acentos e pontuação (especialmente telefone).
const normalizeClientSearch=(value:unknown)=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const matchesClientSearch=(client:{name?:string|null;phone?:string|null;location?:string|null;email?:string|null},query:string)=>{const normalized=normalizeClientSearch(query.trim());if(!normalized)return true;const fields=[client.name,client.phone,client.location,client.email];if(fields.some(value=>normalizeClientSearch(value).includes(normalized)))return true;const digits=query.replace(/\D/g,'');return digits.length>=3&&fields.some(value=>String(value??'').replace(/\D/g,'').includes(digits));};

// v0.7.20 — Ambientes persistidos por projeto; area geometrica, sem dimensionamento automatico de cargas.
type SavedEnvironment={id:string;title:string;data:Record<string,unknown>};
const environmentTypes=['Sala','Quarto','Cozinha','Banheiro','Lavanderia','Corredor','Garagem','Área externa','Escritório','Outro'];
type RoomLoadKind='lighting'|'tug'|'tue';
function estimateRoom(room:SavedEnvironment){
 const d=room.data||{},w=Number(d.width),l=Number(d.length),kind=String(d.kind||'Outro');
 if(d.surveyMode==='existing'){
 const count=Number(d.outletCount);const outlets=Number.isInteger(count)&&count>=0?count:0;
 const tug=['Cozinha','Lavanderia'].includes(kind)?Math.min(outlets,3)*600+Math.max(0,outlets-3)*100:kind==='Banheiro'?outlets*600:outlets*100;
 return {area:0,perimeter:0,lighting:null,tug,outlets};
 }
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
type SpecialCircuit={name:string;power:string};
const roomSpecials=(d:Record<string,unknown>):SpecialCircuit[]=>Array.isArray(d.specialCircuits)?(d.specialCircuits as unknown[]).filter(x=>x&&typeof x==='object').map(x=>({name:String((x as Record<string,unknown>).name||''),power:String((x as Record<string,unknown>).power??'')})):(String(d.specialName||'').trim()?[{name:String(d.specialName),power:String(d.specialPower??'')}]:[]);
type CircuitLoadLink={environmentId:string;kind:RoomLoadKind;specialIndex?:number;part?:number;allocatedVA?:number};
const loadKey=(link:CircuitLoadLink)=>`${link.environmentId}:${link.kind}${link.kind==='tue'?':'+(link.specialIndex??0):''}${link.kind==='tug'&&link.part!==undefined?':part'+link.part:''}`;
const roomLoadPower=(room:SavedEnvironment,link:CircuitLoadLink)=>link.kind==='tug'&&link.allocatedVA!==undefined?Number(link.allocatedVA):link.kind==='tue'?Number(roomSpecials(room.data||{})[link.specialIndex??0]?.power):estimateRoom(room)?.[link.kind];
function linkedLoads(links:CircuitLoadLink[],rooms:SavedEnvironment[]){
 const missing:string[]=[];let va=0;
 for(const link of links){const room=rooms.find(r=>r.id===link.environmentId);if(!room){missing.push(link.environmentId);continue}
 const value=roomLoadPower(room,link);if(value===null||value===undefined){missing.push(room.title);continue}va+=value;}
 return {va,missing};
}
function Environments({clientId,userId}:{clientId:string;userId:string}){
 const [surveyMode,setSurveyMode]=useState<'unset'|'design'|'existing'>(()=>{const v=localStorage.getItem('ep_room_mode_'+clientId);return v==='design'||v==='existing'?v:'unset'});
 const [outletCount,setOutletCount]=useState('');
 const [hasSpecial,setHasSpecial]=useState(false);
 const [specialCircuits,setSpecialCircuits]=useState<SpecialCircuit[]>([]);
 const existingMode=surveyMode==='existing';
 const chooseMode=(v:'design'|'existing')=>{setSurveyMode(v);localStorage.setItem('ep_room_mode_'+clientId,v);};
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
 const reset=()=>{setViewMode(false);setEditorOpen(false);setSelectedId(null);setTitle('');setKind('Sala');setWidth('');setLength('');setNotes('');setOutletCount('');setHasSpecial(false);setSpecialCircuits([]);setStatus('Novo ambiente.');};
 const selectRow=(row:SavedEnvironment)=>{
  const d=row.data||{};
  setEditorOpen(true);setViewMode(true);setSelectedId(row.id);setTitle(row.title);
  setKind(typeof d.kind==='string'?d.kind:'Outro');
  setWidth(d.width===undefined?'':String(d.width));setLength(d.length===undefined?'':String(d.length));
  setNotes(typeof d.notes==='string'?d.notes:'');setOutletCount(d.outletCount===undefined?'':String(d.outletCount));const specials=roomSpecials(d);setHasSpecial(specials.length>0);setSpecialCircuits(specials);setStatus('Ambiente carregado.');
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
  if(!existingMode&&!dimensionsValid){setStatus('Informe comprimento e largura maiores que zero.');return;}
  if(existingMode&&(!Number.isInteger(Number(outletCount))||Number(outletCount)<0||outletCount.trim()==='')){setStatus('Informe a quantidade de tomadas de uso geral.');return;}
  if(hasSpecial&&(!specialCircuits.length||specialCircuits.some(c=>!c.name.trim()||!(Number(c.power)>0)))){setStatus('Preencha o nome e a potência positiva de todos os circuitos específicos.');return;}
  setBusy(true);setStatus('');
  const data={kind,width:existingMode?null:w,length:existingMode?null:l,notes:notes.trim(),area:existingMode?null:Math.round(w*l*100)/100,surveyMode,outletCount:existingMode?Number(outletCount):null,specialCircuits:hasSpecial?specialCircuits.map(c=>({name:c.name.trim(),power:Number(c.power)})):[],specialName:hasSpecial?specialCircuits[0]?.name.trim()||'':'',specialPower:hasSpecial?Number(specialCircuits[0]?.power)||null:null};
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
  <section className="panel"><div className="panel-heading"><div><h2>Ambientes do projeto</h2></div><button type="button" className="outline" onClick={()=>{reset();setViewMode(false);setEditorOpen(true)}} disabled={busy||loading||surveyMode==='unset'}><Plus size={16}/> Novo ambiente</button></div>
   <div className="ep-survey-choice"><strong>Tipo de levantamento</strong><div className="two"><button type="button" className={surveyMode==='design'?'primary':'outline'} onClick={()=>chooseMode('design')}>Projeto elétrico</button><button type="button" className={surveyMode==='existing'?'primary':'outline'} onClick={()=>chooseMode('existing')}>Casa construída</button></div><p className="hint">{surveyMode==='unset'?'Selecione uma opção para habilitar o formulário.':existingMode?'Informe a quantidade real de TUG e os circuitos de uso específico.':'Informe as dimensões para previsão de iluminação e TUG.'}</p></div>
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
   {!existingMode&&<div className="two"><label>Largura (m)<input type="number" min="0.01" step="any" value={width} onChange={e=>setWidth(e.target.value)} placeholder="Ex.: 3,5"/></label><label>Comprimento (m)<input type="number" min="0.01" step="any" value={length} onChange={e=>setLength(e.target.value)} placeholder="Ex.: 4"/></label></div>}
   {existingMode&&<label>Quantidade de tomadas de uso geral (TUG)<input type="number" min="0" step="1" value={outletCount} onChange={e=>setOutletCount(e.target.value)}/></label>}
   <div className="ep-special-entry"><strong>Este ambiente possui circuito de uso específico (TUE)?</strong><div className="ep-special-buttons"><button type="button" className={hasSpecial?'primary':'outline'} aria-pressed={hasSpecial} onClick={()=>{setHasSpecial(true);setSpecialCircuits(old=>old.length?old:[{name:'',power:''}])}}>Sim</button><button type="button" className={!hasSpecial?'primary':'outline'} aria-pressed={!hasSpecial} onClick={()=>setHasSpecial(false)}>Não</button></div>
   {hasSpecial&&<><strong>Quantos circuitos específicos existem?</strong><div className="ep-special-count"><button type="button" className="outline" aria-label="Diminuir quantidade de circuitos específicos" disabled={specialCircuits.length<=1} onClick={()=>setSpecialCircuits(old=>old.slice(0,-1))}>−</button><output aria-live="polite">{specialCircuits.length}</output><button type="button" className="outline" aria-label="Aumentar quantidade de circuitos específicos" disabled={specialCircuits.length>=30} onClick={()=>setSpecialCircuits(old=>[...old,{name:'',power:''}])}>+</button></div>
   {specialCircuits.map((item,index)=><div className="ep-special-item" key={index}><strong>Circuito específico {index+1}</strong><div className="two"><label>Equipamento / nome<input value={item.name} onChange={e=>setSpecialCircuits(old=>old.map((x,i)=>i===index?{...x,name:e.target.value}:x))} placeholder="Ex.: Chuveiro"/></label><label>Potência aparente (VA)<input type="number" min="0" step="any" value={item.power} onChange={e=>setSpecialCircuits(old=>old.map((x,i)=>i===index?{...x,power:e.target.value}:x))} placeholder="Ex.: 5500"/></label></div></div>)}</>}
   </div>
   {!existingMode&&<div className="sizing-metric"><span>Área calculada</span><strong>{area===null?'—':area.toLocaleString('pt-BR',{maximumFractionDigits:2})+' m²'}</strong></div>}
   <label>Observações (opcional)<textarea rows={3} maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Informações do ambiente"/></label>
   <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button type="button" className="primary" disabled={loading||busy||!projectId||!title.trim()||(!existingMode&&!dimensionsValid)||(existingMode&&outletCount.trim()==='')} onClick={()=>void save()}>{busy?'Aguarde...':selectedId?'Atualizar ambiente':'Salvar ambiente'}</button>{selectedId&&<button type="button" className="outline" disabled={busy} onClick={()=>void remove()}>Excluir ambiente</button>}</div>
   
  <button type="button" className="outline" onClick={reset} disabled={busy}>Fechar</button></div>}</section></div>}
 </div>;
}
// Estimativa geométrica de percurso, NÃO uma medição do trajeto desde o QD.
// Hipótese transparente: 5 m de alimentação presumida + maior dimensão de cada ambiente atendido.
function estimateCircuitRoute(links:CircuitLoadLink[],rooms:SavedEnvironment[]){
 const unique=[...new Set(links.map(x=>x.environmentId))];
 if(!unique.length)return null;
 let sum=5;
 for(const id of unique){const room=rooms.find(x=>x.id===id);if(!room)return null;const w=Number(room.data?.width),l=Number(room.data?.length);if(!(w>0&&l>0))return null;sum+=Math.max(w,l)}
 return Math.ceil(sum*10)/10;
}
function previewRoomSizing(kind:string,va:number,length:number,settings:InstallationSettings,title:string){
 const voltage=Number(settings.voltage),pf=Number(settings.powerFactor),group=grouping5410[settings.groupMode]?.[settings.groupCount],temp=temperature5410[settings.conductorInsulation]?.[settings.temperature];
 const supported=Boolean(ampacity5410[settings.conductorInsulation]?.[settings.conductorMaterial]?.[settings.method]?.['2'])&&group!==undefined&&temp!==undefined&&(settings.groupMode==='bundle'||(settings.method==='C'&&settings.groupMode==='singleLayer'));
 if(!supported||!(va>0&&voltage>0&&pf>0&&pf<=1))return null;
 const current=va/voltage;const minSize=settings.conductorMaterial==='aluminum'?16:kind==='lighting'?1.5:2.5;
 const rho=settings.conductorMaterial==='copper'?0.0175:0.0282,alpha=settings.conductorMaterial==='copper'?0.00393:0.00403,conductorTemp=settings.conductorInsulation==='PVC 70 °C'?70:90;
 const rhoOperating=rho*(1+alpha*(conductorTemp-20));const breakerRatings=[6,10,16,20,25,32,40,50,63,80,100,125];
 const kitchen=/cozinha|lavanderia|área de serviço/i.test(title);
 for(const [sizeStr,iz0] of Object.entries(ampacity5410[settings.conductorInsulation][settings.conductorMaterial][settings.method]['2']).sort(([a],[b])=>Number(a)-Number(b))){
  const size=Number(sizeStr);if(size<minSize)continue;
  const iz=Number(iz0)*group*temp;const drop=2*rhoOperating*length*current*pf/size/voltage*100;
  const minBreaker=kind==='lighting'?10:kind==='tug'&&kitchen?20:(kind==='tug'||kind==='tue')?16:6;
  const breaker=breakerRatings.find(x=>x>=minBreaker&&x>=current-1e-9&&x<=iz+1e-9);
  if(iz>=current&&breaker!==undefined)return {current,selectedSection:size,corrected:iz,drop:drop*voltage/100,pct:drop,breaker,curve:kind==='lighting'||kind==='tug'?'C':/chuveiro|torneira el[eé]trica|aquecedor resistivo|resist[eê]ncia/i.test(title)?'B':null};
 }
 return null;
}
type SavedCircuit={id:string;title:string;data:Record<string,unknown>};
// Fonte única de dimensionamento dos circuitos terminais do projeto.
// Nunca utiliza data.results como origem de seção ou disjuntor: resultados antigos
// são somente histórico. O mesmo cálculo alimenta Dimensionamento e Quadro.
function liveCircuitSizing(row:SavedCircuit,settings:InstallationSettings,rooms?:SavedEnvironment[]){
 const d=row.data||{};
 const kind=String(d.circuit||(/ilumina/i.test(row.title)?'lighting':'tug'));
 // Resolve a carga a partir dos ambientes atuais, quando disponíveis.
 // Nunca reutiliza o valor persistido como se fosse um cálculo atualizado.
 const linked=d.loadMode==='rooms'&&Array.isArray(d.loadLinks)&&rooms?linkedLoads(d.loadLinks as CircuitLoadLink[],rooms):null;
 if(linked&&linked.missing.length>0)return null;
 const va=linked?linked.va:Number(d.powerVA)>0?Number(d.powerVA):Number(d.power)>0?Number(d.power)/(Number(d.pf)||Number(settings.powerFactor)):NaN;
 // Dimensionar na tensão e com os condutores do circuito, não com a ligação geral.
 const wiring=String(d.wiring||settings.wiring||'phase-neutral');
 const voltage=wiring==='phase-neutral'
  ? (settings.supply==='single'?Number(settings.voltage):Number(settings.voltageFN))
  : Number(settings.voltageFF);
 if(!Number.isFinite(voltage)||voltage<=0)return null;
 const localSettings={...settings,voltage:String(voltage),conductorMaterial:String(d.material||settings.conductorMaterial),conductorInsulation:String(d.insulation||settings.conductorInsulation),groupCount:String(d.groupCount||settings.groupCount)};
 // A rotina preliminar usa dois condutores carregados. Circuitos trifásicos
 // exigem tabela de três condutores e não podem receber uma seleção incorreta.
 if(wiring==='three')return null;
 return previewRoomSizing(kind,va,0,localSettings,row.title);
}

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
  const [lengthEstimated,setLengthEstimated]=useState(false);
  const [technicalValidated,setTechnicalValidated]=useState(false);
  const [circuitStatus,setCircuitStatus]=useState('');
  const [circuitBusy,setCircuitBusy]=useState(false);
  const [circuitLoading,setCircuitLoading]=useState(true);
  const circuitRequest=React.useRef(0);
  useEffect(()=>{if(!selectedCircuitId)return;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!circuitBusy)clearCircuit()};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[selectedCircuitId,circuitBusy]);
  const clearCircuit=()=>{setViewMode(false);setEditorOpen(false);setSelectedCircuitId(null);setCircuitTitle('');setCircuit('tug');setPower('');setPf(settings.powerFactor);setLength('');setLengthEstimated(false);setTechnicalValidated(false);setMaterial('copper');setWiring('phase-neutral');setInsulation('PVC 70 °C');setGroupCount(settings.groupCount);setEnvironmentId('');setLoadLinks([]);setLoadMode('manual');setCircuitStatus('Novo circuito: preencha os dados e clique em Salvar circuito.');};
  // A lista e a janela de detalhes usam o dimensionamento calculado com os
  // mesmos parâmetros atuais da aba Tipo de instalação, não resultados antigos
  // persistidos em data.results. A edição utiliza esses mesmos parâmetros.
  const displayedSizing=(row:SavedCircuit)=>{
    const live=liveCircuitSizing(row,settings,environmentOptions);
    return live?{section:live.selectedSection,breaker:live.breaker}:null;
  };
  const selectSavedCircuit=(row:SavedCircuit)=>{
    const d=row.data||{};
    const val=(key:string,fallback:string)=>typeof d[key]==='string'?String(d[key]):fallback;
    setEditorOpen(true);setViewMode(true);setEnvironmentId(val('environmentId',''));setLoadLinks(Array.isArray(d.loadLinks)?(d.loadLinks as CircuitLoadLink[]):[]);setLoadMode(d.loadMode==='rooms'?'rooms':'manual');setSelectedCircuitId(row.id);setCircuitTitle(row.title);setCircuit(val('circuit',Array.isArray(d.loadLinks)&&d.loadLinks.some((x:CircuitLoadLink)=>x.kind==='lighting')?'lighting':'tug'));setPower(val('power',''));setPf(settings.powerFactor);setLength(val('length',''));setLengthEstimated(d.lengthEstimated===true);setTechnicalValidated(d.requiresTechnicalReview!==true);setMaterial(settings.conductorMaterial);setWiring(settings.wiring);setInsulation(settings.conductorInsulation);setGroupCount(settings.groupCount);setCircuitStatus('Circuito carregado.');
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
  async function generateRoomCircuitDrafts(){
    if(!supabase||circuitBusy||circuitLoading)return;
    const existing=new Set(savedCircuits.flatMap(row=>row.data?.loadMode==='rooms'&&Array.isArray(row.data.loadLinks)?(row.data.loadLinks as CircuitLoadLink[]).map(loadKey):[]));
    const drafts:{title:string;data:Record<string,unknown>}[]=[];
    const missing:string[]=[];
    // Iluminação geral: consolidar todos os ambientes em um único circuito.
    // Não gerar outro circuito se já existir um circuito de iluminação no projeto.
    const lightingAlreadyExists=savedCircuits.some(row=>row.data?.circuit==='lighting'||row.title.toLocaleLowerCase('pt-BR').startsWith('iluminação'));
    if(!lightingAlreadyExists){
      const lightingLinks:CircuitLoadLink[]=[];
      let lightingVA=0;
      for(const room of environmentOptions){
        const value=estimateRoom(room)?.lighting;
        if(typeof value==='number'&&Number.isFinite(value)&&value>0){
          lightingLinks.push({environmentId:room.id,kind:'lighting'});
          lightingVA+=value;
        }
      }
      if(lightingLinks.length){
        const estimatedLength=null;const preliminary=previewRoomSizing('lighting',lightingVA,0,settings,'Iluminação Geral');
        drafts.push({title:'Iluminação Geral',data:{circuit:'lighting',environmentId:lightingLinks[0].environmentId,loadMode:'rooms',loadLinks:lightingLinks,power:'',manualPower:'',powerVA:lightingVA,pf:settings.powerFactor,length:estimatedLength?String(estimatedLength):'',lengthEstimated:estimatedLength!==null,material:settings.conductorMaterial,wiring:settings.wiring,insulation:settings.conductorInsulation,groupCount:settings.groupCount,panelPhase:null,panelConnection:null,results:preliminary||{current:null,selectedSection:null,corrected:null,drop:null,pct:null,breaker:null,curve:null},installationSnapshot:settings,requiresTechnicalReview:true}});
      }
    }
    // TUG: cozinha e lavanderia em grupos independentes; demais ambientes em TUG Geral.
    // Cada grupo é dividido em circuitos de até 2.200 VA, preservando a origem das cargas.
    const tugGroups=new Map<string,{name:string;links:CircuitLoadLink[];va:number}>();
    for(const room of environmentOptions){
      const estimate=estimateRoom(room);const va=estimate?.tug;
      if(!(typeof va==='number'&&Number.isFinite(va)&&va>0))continue;
      const normalized=(String(room.data?.kind||'')+' '+room.title).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
      const category=/cozinha/.test(normalized)?'Cozinha':/lavanderia|area de servico/.test(normalized)?'Lavanderia':'Geral';
      const key=category==='Geral'?'geral':category+':'+room.id;
      if(!tugGroups.has(key))tugGroups.set(key,{name:category==='Geral'?'TUG Geral':`TUG — ${room.title}`,links:[],va:0});
      const group=tugGroups.get(key)!;
      // A divisão é feita por potências previstas de tomadas, sem fracionar uma tomada.
      const count=Number(estimate?.outlets)||0;
      const points=Array.from({length:count},(_,i)=>category==='Geral'&&String(room.data?.kind||'')==='Banheiro'?600:(category!=='Geral'&&i<3?600:100));
      // Dados de levantamento existente podem divergir do modelo de pontos; manter o total informado.
      const totalPoints=points.reduce((a,b)=>a+b,0);
      if(Math.abs(totalPoints-va)>0.01){points.length=0;let remaining=va;while(remaining>0){const piece=Math.min(remaining,2200);points.push(piece);remaining-=piece;}}
      // Armazenar a distribuição de pontos por ambiente para não duplicar cargas.
      (group as typeof group & {points?:{room:SavedEnvironment;power:number;part:number}[]}).points??=[];
      points.forEach((power,i)=>(group as typeof group & {points:{room:SavedEnvironment;power:number;part:number}[]}).points.push({room,power,part:i}));
    }
    for(const group of tugGroups.values()){
      const points=(group as typeof group & {points?:{room:SavedEnvironment;power:number;part:number}[]}).points||[];
      let batches:{links:CircuitLoadLink[];va:number}[]=[];
      for(const point of points){
        let batch=batches[batches.length-1];
        if(!batch||batch.va+point.power>2200+1e-9){batch={links:[],va:0};batches.push(batch)}
        batch.va+=point.power;
        batch.links.push({environmentId:point.room.id,kind:'tug',part:point.part,allocatedVA:point.power});
      }
      for(const [i,batch] of batches.entries()){
        if(!batch.links.length||batch.links.every(link=>existing.has(loadKey(link))||existing.has(`${link.environmentId}:tug`)))continue;
        if(batch.links.some(link=>existing.has(loadKey(link))||existing.has(`${link.environmentId}:tug`))){missing.push(group.name+' (cargas já vinculadas; revise antes de gerar novamente)');continue}
        const title=group.name+(batches.length>1?` — Circuito ${i+1}`:'');
        const preliminary=previewRoomSizing('tug',batch.va,0,settings,title);
        drafts.push({title,data:{circuit:'tug',environmentId:batch.links[0].environmentId,loadMode:'rooms',loadLinks:batch.links,power:'',manualPower:'',powerVA:batch.va,pf:settings.powerFactor,length:'',lengthEstimated:false,material:settings.conductorMaterial,wiring:settings.wiring,insulation:settings.conductorInsulation,groupCount:settings.groupCount,panelPhase:null,panelConnection:null,results:preliminary||{current:null,selectedSection:null,corrected:null,drop:null,pct:null,breaker:null,curve:null},installationSnapshot:settings,requiresTechnicalReview:true}});
      }
    }
    for(const room of environmentOptions){
      for(const [index,special] of roomSpecials(room.data||{}).entries()){
        const link:CircuitLoadLink={environmentId:room.id,kind:'tue',specialIndex:index};
        if(existing.has(loadKey(link)))continue;
        const va=Number(special.power);
        if(!(Number.isFinite(va)&&va>0)){missing.push(room.title+' ('+(special.name||'TUE')+' sem potência válida)');continue}
        const title=`${special.name||'TUE'} — ${room.title}`;
        const preliminary=previewRoomSizing('tue',va,0,settings,title);
        drafts.push({title,data:{circuit:'tue',environmentId:room.id,loadMode:'rooms',loadLinks:[link],power:'',manualPower:'',powerVA:va,pf:settings.powerFactor,length:'',lengthEstimated:false,material:settings.conductorMaterial,wiring:settings.wiring,insulation:settings.conductorInsulation,groupCount:settings.groupCount,panelPhase:null,panelConnection:null,results:preliminary||{current:null,selectedSection:null,corrected:null,drop:null,pct:null,breaker:null,curve:null},installationSnapshot:settings,requiresTechnicalReview:true}});
      }
    }
    if(!drafts.length){setCircuitStatus(missing.length?'Revise as cargas: '+missing.join(', '):'Nenhuma carga nova disponível.');return}
    if(!window.confirm(`Criar ${drafts.length} circuitos? TUG por cozinha, lavanderia e demais ambientes, limitados a 2.200 VA por circuito. Comprimento não será utilizado no dimensionamento preliminar.`))return;
    setCircuitBusy(true);
    try{
      const {data:project,error:pe}=await supabase.from('eletripro_projects').select('id').eq('client_id',clientId).maybeSingle();
      if(pe||!project)throw new Error(pe?.message||'Projeto não encontrado.');
      const {data,error}=await supabase.from('eletripro_circuits').insert(drafts.map(d=>({...d,project_id:project.id}))).select('id,title,data');
      if(error)throw error;
      setSavedCircuits(old=>[...old,...(data||[]) as SavedCircuit[]]);
      setCircuitStatus(`${(data||[]).length} circuitos criados com cálculo automático quando possível.${missing.length?' Pendências: '+missing.join(', '):''}`);
    }catch(error){setCircuitStatus('Erro ao gerar circuitos: '+(error instanceof Error?error.message:String(error)))}
    finally{setCircuitBusy(false)}
  }
  async function saveCircuit(){
    if(!supabase||circuitBusy||circuitLoading)return;
    const title=circuitTitle.trim();
    if(!title){setCircuitStatus('Informe o nome do circuito.');return}
    if(!(loadMode==='rooms'?loadLinks.length>0&&roomCalculation.missing.length===0&&roomCalculation.va>0&&Number(settings.powerFactor)>0:Number.isFinite(Number(power))&&Number(power)>0)||(length.trim()!==''&&(!Number.isFinite(Number(length))||Number(length)<0))){setCircuitStatus('Informe uma potência positiva. O comprimento é opcional para este pré-dimensionamento.');return}
    if(loadMode==='rooms'){
      const conflicts=savedCircuits.filter(x=>x.id!==selectedCircuitId&&x.data?.loadMode==='rooms'&&Array.isArray(x.data.loadLinks)).flatMap(x=>(x.data.loadLinks as CircuitLoadLink[]).filter(y=>loadLinks.some(z=>loadKey(z)===loadKey(y))).map(y=>x.title));
      if(conflicts.length){setCircuitStatus('Carga já vinculada a outro circuito: '+[...new Set(conflicts)].join(', '));return}
      if(loadLinks.some(x=>x.kind!==circuit)||!['lighting','tug','tue'].includes(circuit)){setCircuitStatus('O tipo de carga deve corresponder ao tipo do circuito.');return}
    }
    setCircuitBusy(true);setCircuitStatus('');
    const {data:project,error:pe}=await supabase.from('eletripro_projects').select('id').eq('client_id',clientId).maybeSingle();
    if(pe||!project){setCircuitStatus(pe?'Erro: '+pe.message:'Salve primeiro o Tipo de instalação.');setCircuitBusy(false);return}
    const data={circuit,environmentId:environmentId||null,loadMode,loadLinks,power:powerForSizing,manualPower:power,powerVA:loadMode==='rooms'?roomCalculation.va:null,pf:settings.powerFactor,length,material:settings.conductorMaterial,wiring:settings.wiring,insulation:settings.conductorInsulation,groupCount:settings.groupCount,lengthEstimated, panelPhase:selectedCircuitId?(savedCircuits.find(x=>x.id===selectedCircuitId)?.data.panelPhase||'A'):'A',panelConnection:selectedCircuitId?(savedCircuits.find(x=>x.id===selectedCircuitId)?.data.panelConnection||null):null,results:{current,selectedSection,corrected,drop,pct,breaker:breakerCandidate,curve:tripCurve},installationSnapshot:settings,requiresTechnicalReview:!Boolean(coordinated)};
    const result=selectedCircuitId
      ?await supabase.from('eletripro_circuits').update({title,data,updated_at:new Date().toISOString()}).eq('id',selectedCircuitId).eq('project_id',project.id).select('id,title,data').single()
      :await supabase.from('eletripro_circuits').insert({project_id:project.id,title,data}).select('id,title,data').single();
    if(result.error)setCircuitStatus('Erro ao salvar circuito: '+result.error.message);
    else if(result.data){const saved=result.data as SavedCircuit;setSavedCircuits(old=>selectedCircuitId?old.map(x=>x.id===saved.id?saved:x):[...old,saved]);setSelectedCircuitId(saved.id);setEditorOpen(false);setViewMode(false);try{await syncCircuitMaterials(project.id,saved,undefined,settings,environmentOptions);await syncUnifiedBudget(project.id);setCircuitStatus('Circuito e materiais atualizados automaticamente.')}catch(e){setCircuitStatus('Circuito salvo, mas a atualização dos materiais falhou: '+(e instanceof Error?e.message:String(e)))}}
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
     const desired=items.map((item,i)=>({...item,source_key:`${selectedCircuitId}:${item.id.startsWith('dj-')?'breaker':item.sourceRole||i}`}));
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
 const effectiveGroupCount=settings.groupCount;
 const effectivePf=settings.powerFactor;
 const effectiveWiring=settings.wiring==='three'?'phase-neutral':settings.wiring;
 const phases=effectiveWiring==='three'?'three':'single';
 const loaded=effectiveWiring==='three'?'3':'2';
 const voltage=settings.voltage;
 const num=(x:string)=>x.trim()===''?NaN:Number(x.replace(',','.'));
 const p=num(powerForSizing),v=num(voltage),f=num(effectivePf),l=num(length);
 const ft=temperature5410[effectiveInsulation]?.[temperature];
 const fg=grouping5410[groupMode]?.[effectiveGroupCount];
 const valid=Number.isFinite(p)&&p>0&&Number.isFinite(v)&&v>0&&Number.isFinite(f)&&f>0&&f<=1;
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
 const lengthValid=true;
 const evaluate=(size:number,iz0:number)=>{
   const iz=iz0*ft!*fg!;
   // Modelo puramente resistivo na temperatura nominal do condutor, sem reatância.
   const delta=current===null||!(l>0)?NaN:2*rhoOperating*l*current*f/size;
   const percent=delta/v*100;
   return {size,iz0,iz,delta,percent,ampacityOk:current!==null&&iz>=current,dropOk:true};
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
 const minBreaker=(_size:number)=>circuit==='lighting'?10:circuit==='tug'&&kitchenLaundry?20:(circuit==='tug'||circuit==='tue')?16:6;
 // Integração: testar cada seção comercial em ordem crescente, exigindo capacidade,
 // queda de tensão e um In que satisfaça Ib ≤ In ≤ Iz.
 const sharedSizing=valid?previewRoomSizing(circuit,Number(p)/Number(f),0,settings,circuitTitle):null;
 const coordinated=candidates.map(x=>({
   ...x,
   breaker:x.ampacityOk&&x.dropOk&&current!==null
     ?(breakerRatings.find(inom=>inom>=minBreaker(x.size)&&inom>=current-1e-9&&inom<=x.iz+1e-9)??null)
     :null
 })).find(x=>x.breaker!==null)??null;
 const decisionSteps=candidates.filter(x=>coordinated?x.size<=coordinated.size:(electricalCandidate?x.size<=electricalCandidate.size: false)).map(x=>{
   const inRating=x.ampacityOk&&x.dropOk&&current!==null
     ?(breakerRatings.find(inom=>inom>=minBreaker(x.size)&&inom>=current-1e-9&&inom<=x.iz+1e-9)??null):null;
   const reason=!x.ampacityOk?'Capacidade de corrente insuficiente':inRating===null?'Sem disjuntor compatível na lista':'Atende à capacidade de corrente e coordenação preliminar';
   return {...x,inRating,reason};
 });
 const candidate=sharedSizing?candidates.map(x=>({...x,breaker:sharedSizing.breaker})).find(x=>x.size===sharedSizing.selectedSection)??null:null;
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
 const noCompliantCandidate=supported&&current!==null&&!electricalCandidate;
 const fmt=(n:number,d=2)=>n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
 const reset=()=>{setPower('');setPf(settings.powerFactor);setLength('');setGroupCount(settings.groupCount)};
 return <><section className="panel" style={{marginBottom:16}}><div className="panel-heading"><div><h2>Circuitos do projeto</h2></div><div className="ep-circuit-heading-actions"><button type="button" className="outline" disabled={circuitBusy||circuitLoading||!environmentOptions.length} onClick={()=>void generateRoomCircuitDrafts()}>Gerar circuitos dos ambientes</button><button type="button" className="outline" disabled={circuitBusy} onClick={()=>{clearCircuit();setViewMode(false);setEditorOpen(true)}}><Plus size={16}/> Novo circuito</button></div></div>
  {circuitLoading?<p className="hint">Carregando circuitos...</p>:savedCircuits.length===0?<p className="hint">Nenhum circuito salvo neste projeto.</p>:<div className="ep-circuit-list">{savedCircuits.map((x,i)=>{const sizing=displayedSizing(x);return <button type="button" key={x.id} className="ep-circuit-list-item" onClick={()=>selectSavedCircuit(x)}><span className="ep-circuit-index">{String(i+1).padStart(2,'0')}</span><span>{x.title}<small className="ep-review-label">{sizing?` · Cabo ${String(sizing.section).replace('.',',')} mm² · Disjuntor ${sizing.breaker} A`:' · Dimensionamento indisponível'}</small></span><span className="ep-circuit-arrow">›</span></button>})}</div>}
  </section>{editorOpen&&<div className="ep-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!circuitBusy)clearCircuit()}}><div className="ep-circuit-editor" role="dialog" aria-modal={true} aria-label={selectedCircuitId?'Editar circuito':'Novo circuito'}><div className="ep-editor-heading"><h2>{selectedCircuitId?(viewMode?circuitTitle:'Editar circuito'):'Novo circuito'}</h2>{<button type="button" className="ep-close" aria-label="Fechar" disabled={circuitBusy} onClick={clearCircuit}><X size={20}/></button>}</div>{viewMode&&selectedCircuitId?<section className="panel ep-circuit-details"><div className="ep-summary">
 <div className="ep-summary-grid"><div><span>Seção do condutor</span><strong>{(()=>{const row=savedCircuits.find(x=>x.id===selectedCircuitId);const n=row?displayedSizing(row)?.section:null;return n?`${fmt(n)} mm²`:'—'})()}</strong></div><div><span>Disjuntor</span><strong>{(()=>{const row=savedCircuits.find(x=>x.id===selectedCircuitId);const n=row?displayedSizing(row)?.breaker:null;return n?`${n} A`:'—'})()}</strong></div></div>
 <p className="hint">{circuit==='tug'&&/ilumina/i.test(circuitTitle)?'Atenção: este circuito está cadastrado como TUG, apesar do nome indicar iluminação. Clique em Editar e corrija o tipo para aplicar seção mínima de 1,5 mm². ':''}</p>
 <div className="ep-summary-actions"><button type="button" className="primary" onClick={()=>setViewMode(false)}>Editar</button><button type="button" className="outline" disabled={circuitBusy} onClick={()=>void deleteCircuit()}>Excluir</button><button type="button" className="outline" onClick={clearCircuit}>Fechar</button></div>
 </div></section>:<><section className="panel ep-circuit-details"><label>Ambiente associado (opcional)<select value={environmentId} onChange={e=>setEnvironmentId(e.target.value)}><option value="">Sem ambiente associado</option>{environmentOptions.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label>
  <label>Nome do circuito<input value={circuitTitle} onChange={e=>setCircuitTitle(e.target.value)} placeholder="Ex.: C1 - Iluminação da sala"/></label>

  {circuitStatus&&<p className="hint" role="status">{circuitStatus}</p>}
  </section><div className="sizing-layout"><section className="panel sizing-form"><h2>Dados do circuito</h2>
 <label>Tipo de circuito<select value={circuit} onChange={e=>{const next=e.target.value;setCircuit(next);setLoadLinks(old=>old.filter(link=>link.kind===next));if(loadMode==='rooms'&&!['lighting','tug','tue'].includes(next))setLoadMode('manual')}}><option value="lighting">Iluminação</option><option value="tug">Tomadas de uso geral</option><option value="tue">Circuito dedicado / TUE</option><option value="motor">Motor / máquina</option><option value="feeder">Alimentador</option><option value="other">Outro</option></select></label>
 <div className="ep-load-links"><h3>Origem da carga</h3><label>Potência do circuito<select value={loadMode} onChange={e=>{setLoadMode(e.target.value as 'manual'|'rooms');setLoadLinks(old=>old.filter(link=>link.kind===circuit))}}><option value="manual">Informar potência manualmente</option><option value="rooms" disabled={!['lighting','tug','tue'].includes(circuit)}>Somar cargas dos ambientes</option></select></label>
 {loadMode==='rooms'&&<><p className="hint">{circuit==='lighting'?'Selecione somente cargas de iluminação.':'Selecione somente as cargas do tipo escolhido.'} Cada carga pode pertencer a apenas um circuito.</p>
 {environmentOptions.map(room=>{const estimate=estimateRoom(room);const specials=circuit==='tue'?roomSpecials(room.data||{}):[null];return <div className="ep-room-pick" key={room.id}><strong>{room.title}</strong>{specials.map((special,index)=>{const kind=circuit as RoomLoadKind;const link:CircuitLoadLink={environmentId:room.id,kind,...(kind==='tue'?{specialIndex:index}:{})};const va=kind==='tue'?Number(special?.power):estimate?.[kind];const valid=Number.isFinite(va)&&va>0;const selected=loadLinks.some(x=>loadKey(x)===loadKey(link));const alreadyLinked=savedCircuits.some(x=>x.id!==selectedCircuitId&&x.data?.loadMode==='rooms'&&Array.isArray(x.data.loadLinks)&&(x.data.loadLinks as CircuitLoadLink[]).some(y=>loadKey(y)===loadKey(link)||kind==='tug'&&y.environmentId===room.id&&y.kind==='tug'));return <label key={loadKey(link)}><input type="checkbox" disabled={!valid||alreadyLinked} checked={selected} onChange={e=>setLoadLinks(old=>e.target.checked?[...old,link]:old.filter(x=>loadKey(x)!==loadKey(link)))}/>{kind==='lighting'?'Iluminação':kind==='tue'?special?.name||'Uso específico':'Tomadas'} — {!valid?'Revisão manual':`${va} VA`}{alreadyLinked?' · Já vinculada a outro circuito':''}</label>})}</div>})}
 {loadLinks.some(link=>link.kind==='tug'&&link.part!==undefined)&&<p className="hint" role="note">Distribuição automática de tomadas: {loadLinks.filter(link=>link.kind==='tug').length} ponto(s), com potência individual vinculada. Para redistribuir os pontos, revise os ambientes e gere novamente os circuitos após excluir os anteriores.</p>}<div className="sizing-metric"><span>Carga total associada</span><strong>{loadLinks.length?`${roomCalculation.va.toLocaleString('pt-BR')} VA`:'—'}</strong></div>
 {roomCalculation.missing.length>0&&<p role="alert" className="sizing-warning">Existem ambientes removidos ou cargas sem estimativa. Revise as associações antes de salvar.</p>}
 <p className="hint">Para o dimensionamento preliminar, P = S × fator de potência geral. As cargas mínimas em VA não são tratadas diretamente como W.</p></>}
 </div>
 <h3>Dados elétricos</h3><p className="hint" role="note">Agrupamento: {settings.groupCount} circuito(s) · Temperatura: {settings.temperature} °C · Método: {settings.method}. Para alterar estes fatores, utilize a aba Tipo de instalação.</p><div className="two">{loadMode==='manual'&&<label>Potência ativa (W)<input type="number" min="0" step="any" value={power} onChange={e=>setPower(e.target.value)} placeholder="Ex.: 5400"/></label>}<label>Comprimento de ida (m) — opcional, somente para materiais<input type="number" min="0" step="any" value={length} onChange={e=>{setLength(e.target.value);setLengthEstimated(false);setTechnicalValidated(false)}} placeholder="Ex.: 15"/></label></div>
 {lengthEstimated&&<p className="hint" role="note">Percurso estimado: 5 m de alimentação presumida + maior dimensão de cada ambiente atendido. Não representa distância real do quadro. Ajuste o comprimento após verificar o trajeto.</p>}{loadMode==='rooms'&&<button type="button" className="outline" onClick={()=>{const n=estimateCircuitRoute(loadLinks,environmentOptions);if(n!==null){setLength(String(n));setLengthEstimated(true);setTechnicalValidated(false)}}}>Recalcular comprimento estimado</button>}<details className="ep-details"><summary>Parâmetros gerais utilizados</summary><p className="hint">Tensão: {voltage} V · Método: {method} · Temperatura: {temperature} °C · Material: {effectiveMaterial==='copper'?'cobre':'alumínio'}. Altere os padrões em Tipo de instalação.</p></details></section>
 <section className="panel sizing-results"><h2>Seção do condutor</h2><p className="hint">Dimensionamento automático por corrente e capacidade corrigida, conforme Tipo de instalação. O comprimento não participa desta seleção; verifique a queda de tensão no projeto executivo.</p><div className="sizing-metric"><span>Corrente de projeto (Ib)</span><strong>{current===null?'—':`${fmt(current)} A`}</strong></div><div className="sizing-metric"><span>Seção do condutor/Bitola</span><strong>{selectedSection===null?'—':`${String(selectedSection).replace('.',',')} mm²`}</strong></div>
 {noCompliantCandidate&&<div className="sizing-warning"><strong>Nenhuma seção aprovada no modelo experimental</strong><p>Não foi encontrada seção que atenda simultaneamente à corrente e ao limite provisório de 4% dentro da base provisória. Não use esse resultado para especificação.</p></div>}
 {current!==null&&!supported&&<div className="sizing-warning"><strong>Condição não contemplada</strong><p>Esta condição não está coberta pelas tabelas e hipóteses implementadas. Não é possível pré-selecionar a seção automaticamente.</p></div>}
 {noBreakerSolution&&<div className="sizing-warning"><strong>Sem combinação preliminar de cabo e disjuntor</strong><p>Há seção que atende à corrente e à queda estimada, mas nenhuma das seções disponíveis permite um disjuntor da lista com Ib ≤ In ≤ Iz. Não selecione um disjuntor acima da capacidade corrigida do condutor.</p></div>}
 {selectedCircuitId&&candidate!==null&&breakerCandidate!==null&&Number.isFinite(l)&&l>0&&<div className="sizing-formula"><strong>Enviar materiais ao cadastro do projeto</strong><p className="hint">Cabos separados por função e cor, com metragem inicial igual ao comprimento de ida para cada condutor. Ajuste cada quantidade e preço em Materiais. Em iluminação, o retorno é estimado com o mesmo comprimento; confirme o percurso real. A seção do PE é preliminar. Não inclui perdas nem reserva técnica.</p><button type="button" className="primary" disabled={materialSending} onClick={()=>void (async()=>{const catalog=await loadActiveElectricalCatalog();await sendSizingMaterials(budgetCableItems({length:l,size:candidate.size,material:effectiveMaterial,insulation:effectiveInsulation,circuit,wiring:effectiveWiring,breaker:breakerCandidate,curve:tripCurve||'a confirmar',connection:(()=>{const row=savedCircuits.find(x=>x.id===selectedCircuitId);const choices=panelChoices(settings,effectiveWiring==='phase-neutral'?1:effectiveWiring==='phase-phase'?2:3);const stored=String(row?.data.panelConnection||row?.data.panelPhase||'A') as PanelConnection;return choices.includes(stored)?stored:choices[0]})(),poles:effectiveWiring==='phase-neutral'?1:effectiveWiring==='phase-phase'?2:3,catalog}));})()}>{materialSending?'Salvando...':'Consolidar materiais deste circuito'}</button></div>}
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
// Perfil demonstrativo de fonte externa: CEDRAP NTC-D-04, revisão 02 (12/06/2025),
// tabelas 12 (iluminação + TUG por potência ativa instalada) e 13 (aquecimento por número de aparelhos).
// NÃO é tabela da CELESC nem aprovação automática para projetos em sua área de concessão.
const externalResidentialReference='CEDRAP NTC-D-04, revisão 02, 12/06/2025, tabelas 12–16 e item 9.5.6; uso como metodologia externa sujeito à validação de aplicabilidade pelo responsável técnico.';
const residentialLightingTugFactor=(installedKW:number)=>{
 const bands=[0.86,0.75,0.66,0.59,0.52,0.45,0.40,0.35,0.31,0.27];
 if(!(installedKW>0))return 1;
 return installedKW>10?0.24:bands[Math.min(9,Math.max(0,Math.ceil(installedKW)-1))];
};
const residentialHeatingFactor=(count:number)=>{
 const values=[1,1,0.84,0.76,0.70,0.65,0.60,0.57,0.54,0.52,0.49,0.48,0.46,0.45,0.44,0.43,0.42,0.41,0.40,0.40,0.39,0.39,0.39,0.38,0.38];
 if(count<=0)return 1;
 return values[Math.min(count,25)-1]??0.38;
};
// A CEDRAP separa fogões/cooktops (tabela 16) de fornos/secadoras/micro-ondas/lava-louças (tabela 15).
// Ar-condicionado residencial: FD = 1,00, item 9.5.6 (a tabela 18 é comercial).
const automaticApplianceClass=(row:SavedCircuit)=>{
 const name=String(row.title||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(demandGroup(row)==='air_conditioning')return 'residential_ac';
 if(demandGroup(row)==='cooking')return /fogao|cooktop|inducao/.test(name)?'stove':/forno|micro.?ondas/.test(name)?'oven':'unclassified';
 if(demandGroup(row)==='other_tue'&&/secadora|lava.?loucas|maquina de lavar loucas/.test(name))return 'oven';
 return 'unclassified';
};
type ApplianceKind='unclassified'|'heating'|'stove'|'oven'|'residential_ac'|'other';
type ApplianceEntry={kind:ApplianceKind;quantity:number};
const applianceKinds:ApplianceKind[]=['unclassified','heating','stove','oven','residential_ac','other'];
const applianceKindLabels:Record<ApplianceKind,string>={unclassified:'Não classificado (100%)',heating:'Chuveiro / torneira elétrica',stove:'Fogão / cooktop',oven:'Forno / micro-ondas / secadora / lava-louças',residential_ac:'Ar-condicionado residencial (100%)',other:'Outro equipamento (100%)'};
const normalizeApplianceEntries=(input:unknown):Record<string,ApplianceEntry>=>{
 const raw=input&&typeof input==='object'?input as Record<string,unknown>:{};
 const entries:Record<string,ApplianceEntry>={};
 for(const [id,value] of Object.entries(raw)){
  if(!value||typeof value!=='object')continue;
  const v=value as Record<string,unknown>,quantity=Number(v.quantity),kind=String(v.kind);
  if(applianceKinds.includes(kind as ApplianceKind)&&Number.isInteger(quantity)&&quantity>=1&&quantity<=100)
   entries[id]={kind:kind as ApplianceKind,quantity};
 }
 return entries;
};
const automaticOvenFactor=(count:number)=>count<=1?1:count<=4?0.70:count<=6?0.60:0.50;
const automaticStoveFactor=(count:number)=>{
 if(count<=1)return 1;
 const f=[1,0.60,0.48,0.40,0.37,0.35,0.33,0.32,0.31];
 return count<=9?f[count-1]:count<=11?0.30:count<=15?0.28:0.26;
};
const automaticResidentialFactors=(circuits:SavedCircuit[],entries:Record<string,ApplianceEntry>={})=>{
 // Um circuito corresponde a um aparelho somente mediante confirmação do responsável técnico.
 const lightingTug=circuits.filter(c=>['lighting','tug_wet','tug_other'].includes(demandGroup(c)));
 const installedKW=lightingTug.reduce((sum,c)=>sum+Number(c.data.power||0),0)/1000;
 const kindFor=(c:SavedCircuit):ApplianceKind=>entries[c.id]?.kind||'unclassified';
 const countFor=(kind:ApplianceKind)=>circuits.reduce((n,c)=>n+(kindFor(c)===kind?(Number.isInteger(entries[c.id]?.quantity)&&entries[c.id].quantity>=1&&entries[c.id].quantity<=100?entries[c.id].quantity:0):0),0);
 const heatingCount=countFor('heating');
 const stoveCount=countFor('stove');
 const ovenCount=countFor('oven');
 const airCount=countFor('residential_ac');
 const lt=residentialLightingTugFactor(installedKW),heat=residentialHeatingFactor(heatingCount);
 const stove=automaticStoveFactor(stoveCount),oven=automaticOvenFactor(ovenCount);
 const factors={...defaultGroupFactors,lighting:lt,tug_wet:lt,tug_other:lt,shower:heat,electric_tap:heat};
 const factorForCircuit=(c:SavedCircuit)=>{
  const kind=kindFor(c);
  if(kind==='heating')return heat;
  if(kind==='stove')return stove;
  if(kind==='oven')return oven;
  if(kind==='residential_ac')return 1;
  if(demandCategory(c)==='tue')return 1;
  return groupDemandFactor(c,factors);
 };
 return {factors,installedKW,heatingCount,stoveCount,ovenCount,airCount,stove,oven,factorForCircuit,kindFor};
};

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
const demandCircuitIssues=(row:SavedCircuit,defaultPf:number,rooms?:SavedEnvironment[])=>{
 const issues:string[]=[];
 if(!['lighting','tug','tue'].includes(String(row.data.circuit||'').toLowerCase()))issues.push('Tipo de circuito não classificado');
 if(!(row.data.loadMode==='rooms'&&rooms?linkedLoads((row.data.loadLinks||[]) as CircuitLoadLink[],rooms).va>0:demandCircuitVA(row,defaultPf)>0))issues.push('Potência aparente não disponível');
 if(row.data.loadMode==='rooms'&&rooms&&linkedLoads((row.data.loadLinks||[]) as CircuitLoadLink[],rooms).missing.length)issues.push('Ambiente ou potência vinculada indisponível');
 if(row.data.loadMode==='rooms'&&!Array.isArray(row.data.loadLinks))issues.push('Vínculo com ambientes incompleto');
 return issues;
};
const circuitDemandFactor=(row:SavedCircuit,factors:Record<DemandCategory,number>)=>factors[demandCategory(row)];
const circuitDemandCurrent=(row:SavedCircuit,factors:Record<DemandCategory,number>)=>panelCurrent(row)*circuitDemandFactor(row,factors);
const panelCurrent=(row:SavedCircuit)=>{const results=(row.data.results||{}) as Record<string,unknown>;const n=Number(results.current);return Number.isFinite(n)&&n>0?n:0};
// v0.7.49: corrente de cada ligação calculada a partir da potência aparente e tensão efetiva.
// Não substitui silenciosamente os resultados persistidos dos circuitos terminais.
const feederCircuitElectrical=(row:SavedCircuit,settings:InstallationSettings,rooms?:SavedEnvironment[])=>{
 const linked=row.data.loadMode==='rooms'&&Array.isArray(row.data.loadLinks)&&rooms?linkedLoads(row.data.loadLinks as CircuitLoadLink[],rooms):null;
 const linkedMissing=Boolean(linked?.missing.length)||Boolean(row.data.loadMode==='rooms'&&(!rooms||!Array.isArray(row.data.loadLinks)));
 const poles=panelPoles(row,settings);
 const va=linkedMissing?NaN:linked?linked.va:demandCircuitVA(row,Number(settings.powerFactor));
 const vfn=settings.supply==='single'?Number(settings.voltage):(Number(settings.voltageFN)||Number(settings.voltage));
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
const phaseVectors=(rows:SavedCircuit[],settings:InstallationSettings,factor:(c:SavedCircuit)=>number,rooms?:SavedEnvironment[])=>{
 const phases=settings.supply==='three'?['A','B','C']:settings.supply==='two'?['A','B']:['A'];
 const angles:Record<string,number>={A:0,B:-2*Math.PI/3,C:2*Math.PI/3};
 // Em sistema bifásico de duas fases da rede trifásica, A/B têm 120° entre si.
 const vectors:Record<string,ComplexCurrent>=Object.fromEntries(phases.map(p=>[p,{re:0,im:0}]));
 const add=(p:string,amp:number,angle:number)=>{if(!vectors[p])return;vectors[p].re+=amp*Math.cos(angle);vectors[p].im+=amp*Math.sin(angle)};
 for(const row of rows){
  const choices=panelChoices(settings,panelPoles(row,settings));
  const stored=String(row.data.panelConnection||row.data.panelPhase||'');
  const connection=choices.includes(stored as PanelConnection)?stored:choices[0];
  const current=feederCircuitElectrical(row,settings,rooms).current*factor(row);
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
const phaseCurrents=(rows:SavedCircuit[],settings:InstallationSettings,factor:(c:SavedCircuit)=>number,rooms?:SavedEnvironment[])=>{
 const vectors=phaseVectors(rows,settings,factor,rooms);
 return Object.fromEntries(Object.entries(vectors).map(([p,v])=>[p,Math.hypot(v.re,v.im)])) as Record<string,number>;
};
// Limite superior conservador: soma dos módulos das correntes em cada condutor.
// Evita reduzir a seção do alimentador apenas por cancelamentos fasoriais presumidos.
const phaseCurrentUpperBounds=(rows:SavedCircuit[],settings:InstallationSettings,factor:(c:SavedCircuit)=>number,rooms?:SavedEnvironment[])=>{
 const phases=settings.supply==='three'?['A','B','C']:settings.supply==='two'?['A','B']:['A'];
 const totals:Record<string,number>=Object.fromEntries(phases.map(p=>[p,0]));
 for(const row of rows){
  const choices=panelChoices(settings,panelPoles(row,settings));
  const stored=String(row.data.panelConnection||row.data.panelPhase||'');
  const connection=choices.includes(stored as PanelConnection)?stored:choices[0];
  const current=feederCircuitElectrical(row,settings,rooms).current*factor(row);
  for(const p of connection){if(p in totals)totals[p]+=current;}
 }
 return totals;
};
const neutralCurrent=(rows:SavedCircuit[],settings:InstallationSettings,factor:(c:SavedCircuit)=>number,rooms?:SavedEnvironment[])=>{
 const vectors=phaseVectors(rows,settings,factor,rooms);
 const sum=Object.values(vectors).reduce((v,c)=>({re:v.re+c.re,im:v.im+c.im}),{re:0,im:0});
 return Math.hypot(sum.re,sum.im);
};
const panelChoices=(settings:InstallationSettings,poles:number):PanelConnection[]=>{
 if(settings.supply==='single')return ['A'];
 if(settings.supply==='two')return poles===2?['AB']:['A','B'];
 return poles===3?['ABC']:poles===2?['AB','BC','CA']:['A','B','C'];
};
function DistributionPanel({clientId,userId,settings}:{clientId:string;userId:string;settings:InstallationSettings}){
 const [rows,setRows]=useState<SavedCircuit[]>([]),[rooms,setRooms]=useState<SavedEnvironment[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [projectId,setProjectId]=useState('');
 const [distributionVisible,setDistributionVisible]=useState(true);
 useEffect(()=>{setDistributionVisible(true)},[clientId]);
 const [groupFactors,setGroupFactors]=useState<Record<DemandGroup,number>>(defaultGroupFactors);
 const [demandMode,setDemandMode]=useState<'conservative'|'documented'|'external_table'>('conservative');
 useEffect(()=>{let live=true;void(async()=>{try{const id=await ensureEletriProject(clientId,userId);if(!supabase)return;const [r,pr,er]=await Promise.all([supabase.from('eletripro_circuits').select('id,title,data').eq('project_id',id).order('created_at',{ascending:true}),supabase.from('eletripro_projects').select('installation').eq('id',id).single(),supabase.from('eletripro_environments').select('id,title,data').eq('project_id',id)]);if(r.error)throw r.error;if(pr.error)throw pr.error;if(er.error)throw er.error;if(live){const freshRooms=(er.data||[]) as SavedEnvironment[];
 setRooms(freshRooms);
 setRows(((r.data||[]) as SavedCircuit[]).map(c=>{
  const d=c.data;
  if(d.loadMode!=='rooms'||!Array.isArray(d.loadLinks))return c;
  const linked=linkedLoads(d.loadLinks as CircuitLoadLink[],freshRooms);
  return {...c,data:{...d,powerVA:linked.missing.length?NaN:linked.va,power:linked.missing.length?NaN:linked.va*(Number(d.pf)||Number(settings.powerFactor))}};
 }));setProjectId(id);setGroupFactors(normalizeGroupFactors(pr.data?.installation?.demandGroupFactors));setDemandMode(pr.data?.installation?.demandMode==='external_table'?'external_table':pr.data?.installation?.demandMode==='documented'?'documented':'conservative')}}catch(e){if(live)setMessage('Erro ao carregar quadro: '+String(e))}finally{if(live)setLoading(false)}})();return()=>{live=false}},[clientId,userId]);
 const phases=settings.supply==='three'?['A','B','C']:settings.supply==='two'?['A','B']:['A'];
 const optionsFor=(row:SavedCircuit)=>panelChoices(settings,panelPoles(row,settings));
 const circuitAmps=(row:SavedCircuit)=>feederCircuitElectrical(row,settings,rooms).current;
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
  setRows(next);setDistributionVisible(true);if(updated===changes.length)setMessage(updated===1?'Circuito atualizado.':`${updated} circuitos atualizados.`);setBusy(false);
 }
 const sums=Object.fromEntries(phases.map(p=>[p,rows.reduce((n,row)=>n+(connectionFor(row).includes(p)?circuitAmps(row):0),0)])) as Record<string,number>;
 const factorFor=(row:SavedCircuit)=>demandMode==='documented'?groupDemandFactor(row,groupFactors):1;
 const demandSums=phaseCurrents(rows,settings,factorFor,rooms);
 const incompleteForDistribution=rows.filter(row=>{
  const e=feederCircuitElectrical(row,settings,rooms);
  return !Number.isFinite(e.va)||e.va<=0||!Number.isFinite(circuitAmps(row))||circuitAmps(row)<=0||panelPoles(row,settings)>(settings.supply==='three'?3:settings.supply==='two'?2:1);
 });
 const calculateBalance=()=>{
  const loads=Object.fromEntries(phases.map(p=>[p,0])) as Record<string,number>;
  const assigned=new Map<string,PanelConnection>();
  const ordered=[...rows].sort((a,b)=>circuitAmps(b)*factorFor(b)-circuitAmps(a)*factorFor(a));
  for(const row of ordered){
   const amps=circuitAmps(row)*factorFor(row);
   const choices=optionsFor(row);
   const choice=[...choices].sort((a,b)=>{
    const maxA=Math.max(...phases.map(p=>loads[p]+(a.includes(p)?amps:0)));
    const maxB=Math.max(...phases.map(p=>loads[p]+(b.includes(p)?amps:0)));
    return maxA-maxB||a.localeCompare(b);
   })[0];
   assigned.set(row.id,choice);
   for(const p of phases)if(choice.includes(p))loads[p]+=amps;
  }
  return rows.filter(row=>assigned.get(row.id)!==connectionFor(row)).map(row=>({id:row.id,connection:assigned.get(row.id)!}));
 };
 const balance=()=>{
  if(busy||loading||!rows.length||incompleteForDistribution.length)return;
  void persistChanges(calculateBalance());
 };
 // Reequilibra automaticamente ao abrir o quadro ou mudar a modalidade/cargas.
 // Persistência só ocorre quando a atribuição calculada é diferente da salva.
 useEffect(()=>{
  if(loading||busy||!projectId||!rows.length||incompleteForDistribution.length)return;
  const changes=calculateBalance();
  if(changes.length)void persistChanges(changes);
 },[loading,projectId,settings.supply,rows.length]);
 const numberBR=(n:number)=>Number.isFinite(n)?n.toLocaleString('pt-BR',{maximumFractionDigits:1}):'—';
 const maximumDemandCurrent=Math.max(0,...phases.map(phase=>Number(demandSums[phase])||0));
 // Circuitos criados automaticamente ainda não possuem corrente, seção ou proteção calculadas.
 // Não permitir que esses registros sejam interpretados como carga nula ao pré-selecionar o DG.
 const incompleteCircuits=incompleteForDistribution;
 const generalBreakerCandidate=incompleteCircuits.length===0&&maximumDemandCurrent>0
  ?[10,16,20,25,32,40,50,63,80,100,125,160,200,225,250,315,400,500,630].find(rating=>rating>=maximumDemandCurrent)
  :undefined;
 return <section className="panel"><div className="panel-heading"><h2>Quadro de distribuição</h2>{<button type="button" className="outline" disabled={busy||loading||!rows.length||incompleteForDistribution.length>0} onClick={balance}>Reequilibrar fases</button>}</div>
 {incompleteForDistribution.length>0&&<p role="alert" className="sizing-warning">Distribuição automática pendente: confira a potência, a tensão ou a compatibilidade de fases dos circuitos: {incompleteForDistribution.map(c=>c.title).join(', ')}.</p>}
 <p className="hint">As fases são distribuídas automaticamente conforme a modalidade sugerida e as correntes calculadas pelas cargas. Confira a tensão real dos equipamentos antes da execução.</p>
 {loading?<p>Carregando...</p>:rows.length===0?<p>Nenhum circuito cadastrado.</p>:!distributionVisible?<p className="hint">Os circuitos cadastrados serão apresentados automaticamente.</p>:<div className="ep-distribution-list">{[...rows].sort((a,b)=>(Number(liveCircuitSizing(b,settings,rooms)?.breaker)||0)-(Number(liveCircuitSizing(a,settings,rooms)?.breaker)||0)||(Number(b.data.powerVA||b.data.power)||0)-(Number(a.data.powerVA||a.data.power)||0)).map((row,i)=>{const live=liveCircuitSizing(row,settings,rooms);const result={breaker:live?.breaker,selectedSection:live?.selectedSection};const poles=panelPoles(row,settings);const choices=optionsFor(row);return <div className="ep-distribution-item ep-panel-circuit" key={row.id}><span className="ep-record-number">{String(i+1).padStart(2,'0')}</span><div className="ep-panel-circuit-info"><strong>{row.title}</strong><small>Fase(s): {connectionFor(row)} · Disjuntor: {result.breaker?`${result.breaker} A`:'—'} · {poles} {poles===1?'polo':'polos'} · Bitola: {result.selectedSection?`${result.selectedSection} mm²`:'—'} · Ib: {circuitAmps(row)?`${numberBR(circuitAmps(row))} A`:'—'}</small></div><label>Fase(s)<select value={connectionFor(row)} disabled={busy||choices.length===1} onChange={e=>void persistChanges([{id:row.id,connection:e.target.value as PanelConnection}])}>{choices.map(p=><option key={p} value={p}>{p}</option>)}</select></label></div>})}</div>}
 {distributionVisible&&<><h3 className="ep-panel-subtitle">Resumo por fase</h3><div className="ep-summary-grid">{phases.map(p=><div key={p}><span>Corrente instalada — fase {p}</span><strong>{numberBR(sums[p])} A</strong><small>Corrente demandada: {numberBR(demandSums[p])} A</small></div>)}</div>
 <div className="ep-general-breaker"><strong>Disjuntor geral — pré-seleção por demanda</strong><p>{incompleteCircuits.length>0?'Pré-seleção bloqueada: existem circuitos sem dimensionamento validado':generalBreakerCandidate?`${generalBreakerCandidate} A`:'Demanda acima da faixa de pré-seleção'} · Corrente de demanda máxima por fase: {numberBR(maximumDemandCurrent)} A</p>{incompleteCircuits.length>0&&<p role="status" className="hint">Dimensione os circuitos pendentes antes de avaliar o disjuntor geral: {incompleteCircuits.map(c=>c.title).join(', ')}. A corrente mostrada acima é parcial e não representa a demanda total.</p>}<small>Valor preliminar. A escolha definitiva depende da capacidade de condução do alimentador, curto-circuito, método de instalação, coordenação e exigências da concessionária.</small></div>
 <p className="hint">Corrente demandada considera os fatores técnicos registrados no projeto. Sem justificativa de redução, todos os fatores permanecem em 100%. Circuitos bipolares contribuem com correntes de retorno opostas e circuitos tripolares são considerados equilibrados. A soma fasorial considera o FP cadastrado. A quantidade de polos é estimada pela configuração da instalação e não substitui a verificação da ligação real. Não dimensiona barramentos, DR, DPS ou curto-circuito.</p></>}{message&&<p role="status">{message}</p>}</section>;
}


type FeederForm={demandFactor:string;length:string;voltage:string;powerFactor:string;maxDrop:string;groupCount:string;neutralSection:string;breaker:string;notes:string};
const feederDefault:FeederForm={demandFactor:'1',length:'15',voltage:'',powerFactor:'',maxDrop:'4',groupCount:'1',neutralSection:'',breaker:'',notes:''};
const feederBreakers=[10,16,20,25,32,40,50,63,80,100,125,160,200,225,250,315,400,500,630];
const feederFormat=(n:number)=>n.toLocaleString('pt-BR',{maximumFractionDigits:2});
// CELESC N-321.0001, edição dezembro/2025, seção 5.3.2 e Tabela 01.
// Classificação preliminar por carga instalada para rede 220/380 V.
// Não inferir o padrão construtivo, demanda, disponibilidade de rede ou atendimento aprovado.
const celescEntryReference='CELESC N-321.0001 — dezembro/2025, item 5.3.2 e Tabela 01 (confirmar notas e condições locais)';
type CelescEntry={category:string;breakerIEC:number|null;entryPVC:number|null;entryXLPE:number|null;range:string;supply:string;notes:string};
function celescEntryClassification(installedKW:number,voltageFN:number,voltageFF:number):CelescEntry|null{
 if(!(installedKW>0&&installedKW<=75)||Math.abs(voltageFN-220)>5||Math.abs(voltageFF-380)>8)return null;
 const data:[number,string,string,number|null,string][]=[
  [11,'A1','single',50,'C ≤ 11 kW'],[13,'A2','single',63,'11 < C ≤ 13 kW'],
  [20,'B1','two',50,'13 < C ≤ 20 kW'],[25,'B2','two',63,'20 < C ≤ 25 kW'],
  [30,'C1','three',50,'25 < C ≤ 30 kW'],[42,'C2','three',63,'30 < C ≤ 42 kW'],
  [50,'C3','three',80,'42 < C ≤ 50 kW'],[65,'C4','three',100,'50 < C ≤ 65 kW'],
  [75,'C5','three',125,'65 < C ≤ 75 kW']];
 const row=data.find(([max])=>installedKW<=max+1e-9);
 if(!row)return null;
 const [,category,supply,breakerIEC,range]=row;
 // A Tabela 01 possui diferentes colunas para cada trecho e tipo de cabo.
 // Não apresentar bitola de ramal como PVC70 nem confundi-la com medição–QD.
 return {category,supply,breakerIEC,entryPVC:null,entryXLPE:null,range,notes:'Indicação por carga instalada. Conferir equipamentos bifásicos/trifásicos, demanda quando exigida, ramais e condições de rede.'};
}
type AutomaticSupplyResult={entry:CelescEntry|null;installedKW:number;supply:string|null;tripolar:boolean;requiresTechnicalReview:boolean;reason:string};
// CELESC: carga instalada é potência ATIVA (kW), não potência aparente (kVA).
// Iluminação/TUG dos ambientes são estimativas em VA; converter com FP explícito.
// TUE dos ambientes tem potência cadastrada em W, sem aplicar FP duas vezes.
// Nunca usar a carga antiga do circuito quando ele está vinculado a ambientes.
function circuitInstalledWatts(row:SavedCircuit,settings:InstallationSettings,rooms?:SavedEnvironment[]):number{
 const d=row.data||{};
 const pf=Number(d.pf??settings.powerFactor);
 if(!(pf>0&&pf<=1))return NaN;
 if(d.loadMode==='rooms'){
  if(!rooms||!Array.isArray(d.loadLinks))return NaN;
  let watts=0;
  for(const link of d.loadLinks as CircuitLoadLink[]){
   const room=rooms.find(r=>r.id===link.environmentId);
   if(!room)return NaN;
   const value=roomLoadPower(room,link);
   if(value==null||!Number.isFinite(Number(value))||Number(value)<0)return NaN;
   watts+=Number(value)*(link.kind==='tue'?1:pf);
  }
  return watts>0?watts:NaN;
 }
 const watts=Number(d.power),va=Number(d.powerVA);
 if(Number.isFinite(watts)&&watts>0)return watts;
 return Number.isFinite(va)&&va>0?va*pf:NaN;
}
function celescAutomaticSupply(circuits:SavedCircuit[],settings:InstallationSettings,rooms?:SavedEnvironment[]):AutomaticSupplyResult{
 const powers=circuits.map(c=>circuitInstalledWatts(c,settings,rooms));
 const kw=circuits.length&&powers.every(w=>Number.isFinite(w)&&w>0)?powers.reduce((a,b)=>a+b,0)/1000:NaN;
 const entry=celescEntryClassification(kw,Number(settings.voltageFN)||220,Number(settings.voltageFF)||380);
 const tripolar=circuits.some(c=>Number(c.data.panelPoles||c.data.poles||c.data.results?.poles)===3);
 // Um circuito tripolar exige três fases; a categoria por carga instalada não é alterada artificialmente.
 // A incompatibilidade deve permanecer explícita e bloquear a aprovação do alimentador.
 const requiresTechnicalReview=Boolean(tripolar&&entry&&entry.supply!=='three');
 return {entry,installedKW:kw,supply:entry?entry.supply:null,tripolar,requiresTechnicalReview,
  reason:requiresTechnicalReview?'Circuito tripolar requer fornecimento trifásico, mas a faixa de carga instalada indica '+entry?.category+'. Confirmar enquadramento e aprovação com a CELESC.':''};
}

// Uma revisão de dados impede tratar o cálculo do alimentador como atual após alterações.
function feederSourceRevision(circuits:SavedCircuit[],rooms:SavedEnvironment[],settings:InstallationSettings):string{
 const orderedCircuits=[...circuits].sort((a,b)=>a.id.localeCompare(b.id)).map(c=>[c.id,c.title,c.data]);
 const orderedRooms=[...rooms].sort((a,b)=>a.id.localeCompare(b.id)).map(r=>[r.id,r.title,r.data]);
 const {supply,voltage,voltageFN,voltageFF,powerFactor,method,temperature,groupMode,groupCount,conductorMaterial,conductorInsulation}=settings;
 return JSON.stringify({orderedCircuits,orderedRooms,supply,voltage,voltageFN,voltageFF,powerFactor,method,temperature,groupMode,groupCount,conductorMaterial,conductorInsulation});
}
function FeederPanel({clientId,userId,settings}:{clientId:string;userId:string;settings:InstallationSettings}){
 const [circuits,setCircuits]=useState<SavedCircuit[]>([]);
 const [feederRooms,setFeederRooms]=useState<SavedEnvironment[]>([]);
 const [length,setLength]=useState('15');
 const [projectId,setProjectId]=useState('');
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[message,setMessage]=useState('');
 const [details,setDetails]=useState(false);
 const [totalTerminalDrop,setTotalTerminalDrop]=useState('');
 const [shortCircuitChecked,setShortCircuitChecked]=useState(false);
 const [protectionChecked,setProtectionChecked]=useState(false);
 const [neutralChecked,setNeutralChecked]=useState(false);
 const [upstreamChecked,setUpstreamChecked]=useState(false);
 const [technicalReference,setTechnicalReference]=useState('');
 const [demandJustification,setDemandJustification]=useState('');
 const [groupFactors,setGroupFactors]=useState<Record<DemandGroup,number>>(defaultGroupFactors);
 const [demandMode,setDemandMode]=useState<'conservative'|'documented'|'external_table'>('conservative');
 const [applyDocumentedDemand,setApplyDocumentedDemand]=useState(false);
 const [applianceEntries,setApplianceEntries]=useState<Record<string,ApplianceEntry>>({});
 useEffect(()=>{let live=true;void(async()=>{try{
  const id=await ensureEletriProject(clientId,userId);
  const [pr,cr,er]=await Promise.all([supabase.from('eletripro_projects').select('installation').eq('id',id).single(),supabase.from('eletripro_circuits').select('id,title,data').eq('project_id',id),supabase.from('eletripro_environments').select('id,title,data').eq('project_id',id)]);
  if(pr.error)throw pr.error;if(cr.error)throw cr.error;if(er.error)throw er.error;
  if(live){setProjectId(id);setCircuits((cr.data||[]) as SavedCircuit[]);setFeederRooms((er.data||[]) as SavedEnvironment[]);const previous=pr.data?.installation?.feeder;if(previous?.length)setLength(String(previous.length));setGroupFactors(normalizeGroupFactors(pr.data?.installation?.demandGroupFactors));setDemandMode(pr.data?.installation?.demandMode==='external_table'?'external_table':pr.data?.installation?.demandMode==='documented'?'documented':'conservative');setDemandJustification(String(pr.data?.installation?.demandJustification||''));setApplyDocumentedDemand(pr.data?.installation?.applyDocumentedDemand===true);setApplianceEntries(normalizeApplianceEntries(pr.data?.installation?.demandAppliances));const validation=previous?.technicalValidation;setTotalTerminalDrop(validation?.terminalDropPercent!=null?String(validation.terminalDropPercent):'');setTechnicalReference(String(validation?.reference||''));/* Confirmações não são reaproveitadas automaticamente: cada nova sessão exige revisão. */}
 }catch(e){if(live)setMessage('Falha ao carregar alimentador: '+String(e))}finally{if(live)setLoading(false)}})();return()=>{live=false}},[clientId,userId]);
 const len=Number(length),voltage=Number(settings.voltage),pf=Number(settings.powerFactor);
 const voltageFN=Number(settings.voltageFN),voltageFF=Number(settings.voltageFF);
 const voltageConfirmed=settings.supply==='single'||(voltageFN>0&&voltageFF>0&&voltageFF>voltageFN);
 const sumPower=circuits.reduce((a,c)=>a+circuitInstalledWatts(c,settings,feederRooms),0);
 const sumVA=circuits.reduce((a,c)=>a+feederCircuitElectrical(c,settings,feederRooms).va,0);
 // A tabela CELESC usa carga instalada C em kW. Não usar a demanda reduzida do QD.
 // Potência do circuito é tratada pelo cadastro como W; verificar dados de placa/fator de potência.
 const automaticEntry=celescAutomaticSupply(circuits,settings,feederRooms);
 const installedKW=automaticEntry.installedKW;
 const celescEntry=automaticEntry.entry;

 const autoResidential=automaticResidentialFactors(circuits,applianceEntries);
 const selectedFactors=demandMode==='external_table'?autoResidential.factors:groupFactors;
 const effectiveFactor=(c:SavedCircuit)=>demandMode==='conservative'?1:demandMode==='external_table'?autoResidential.factorForCircuit(c):groupDemandFactor(c,selectedFactors);
 const demandedVA=circuits.reduce((a,c)=>a+feederCircuitElectrical(c,settings,feederRooms).va*effectiveFactor(c),0);
 const demandAudit=circuits.map(c=>({c,category:demandCategory(c),group:demandGroup(c),va:feederCircuitElectrical(c,settings,feederRooms).va,issues:demandCircuitIssues(c,pf,feederRooms)}));
 const groupTotals=demandGroupOrder.map(group=>({group,items:demandAudit.filter(x=>x.group===group)})).filter(x=>x.items.length>0);
 const demandTotals=Object.fromEntries(demandCategories.map(k=>[k,demandAudit.filter(x=>x.category===k).reduce((a,x)=>a+x.va,0)])) as Record<DemandCategory,number>;
 const auditIssues=demandAudit.flatMap(x=>x.issues.map(issue=>`${x.c.title}: ${issue}`));
 const demand=sumVA>0?demandedVA/sumVA:1; // Demanda proposta, não necessariamente aplicada.
 const demandApplied=demandMode!=='conservative'&&applyDocumentedDemand;
 const appliedDemandedVA=demandApplied?demandedVA:sumVA;
 const appliedDemandFactor=sumVA>0?appliedDemandedVA/sumVA:1;
 // NBR 5410, Tabela 46: FN = 2; duas fases + N = 3; três fases + N = 3 ou 4.
 // Para trifásico com neutro e conteúdo harmônico não informado, reserva conservadora
 // para 4 carregados por fator 0,86 sobre a tabela de 3 carregados (6.2.5.6.1).
 const loaded=settings.supply==='single'?'2':'3';
 const harmonicNeutralFactor=settings.supply==='three'?0.86:1;
 const loadedDescription=settings.supply==='three'?'4 (hipótese conservadora; tabela 3 × 0,86)':loaded;
 const phaseDemand=phaseCurrents(circuits,settings,effectiveFactor,feederRooms);
 const phaseUpperBounds=phaseCurrentUpperBounds(circuits,settings,effectiveFactor,feederRooms);
 // A demanda só passa ao pré-dimensionamento após confirmação expressa da referência técnica.
 // A aplicabilidade normativa permanece sob responsabilidade do projetista.
 const phaseSizingBounds=phaseCurrentUpperBounds(circuits,settings,demandApplied?effectiveFactor:()=>1,feederRooms);
 const ib=Math.max(0,...Object.values(phaseSizingBounds));
 const neutralFundamental=neutralCurrent(circuits,settings,demandApplied?effectiveFactor:()=>1,feederRooms);
 // Critério preliminar conservador para a seção do neutro; não é a corrente fasorial prevista.
 const neutralIb=Math.max(neutralFundamental,...Object.values(phaseSizingBounds));
 const feederTopology=settings.supply==='three'?'L1 + L2 + L3 + N + PE':settings.supply==='two'?'L1 + L2 + N + PE':'L1 + N + PE';
 const method=settings.method,material=settings.conductorMaterial,insulation=settings.conductorInsulation;
 const table=ampacity5410[insulation]?.[material]?.[method]?.[loaded];
 const ft=temperature5410[insulation]?.[settings.temperature],fg=grouping5410[settings.groupMode]?.[settings.groupCount];
 const errors:string[]=[];
 if(!celescEntry)errors.push('Enquadramento CELESC não determinado: confirme carga instalada e tensões antes de validar o alimentador.');
 if(automaticEntry.requiresTechnicalReview)errors.push(automaticEntry.reason);
 if(celescEntry&&settings.supply!==automaticEntry.supply)errors.push('Fornecimento diverge da proposta automática: revise as cargas e o quadro.');
 if(!voltageConfirmed)errors.push('Informe VFN e VFF válidas no Tipo de instalação para validar o alimentador multifásico.');
 if(settings.supply!=='single'&&voltageConfirmed&&Math.abs(voltageFF/voltageFN-Math.sqrt(3))>0.08)errors.push('Relação VFF/VFN incompatível com o modelo de fases defasadas de 120°. Revise o fornecimento.');
 if(circuits.some(c=>!(feederCircuitElectrical(c,settings,feederRooms).current>0)))errors.push('Existem circuitos sem corrente de projeto válida; revise o dimensionamento dos circuitos.');
 // Circuitos terminais não são recalculados/salvos automaticamente: divergência bloqueia a aprovação do alimentador.
 for(const c of circuits){
  const e=feederCircuitElectrical(c,settings,feederRooms);
  if(!(e.voltage>0&&Number.isFinite(e.current)&&e.current>0))errors.push(`${c.title}: tensão ou potência incompatível com a ligação elétrica; confirme VFN/VFF.`);
  else if(!liveCircuitSizing(c,settings,feederRooms))errors.push(`${c.title}: não foi possível determinar cabo e disjuntor com a ligação e os parâmetros atuais.`);
 }
 const reducedDemand=demandMode!=='conservative'&&circuits.some(c=>effectiveFactor(c)<1);
 if(demandMode==='documented'&&demandGroupOrder.some(k=>!Number.isFinite(groupFactors[k])||!(groupFactors[k]>0&&groupFactors[k]<=1)))errors.push('Os fatores por grupo devem estar entre 0 e 1.');
 if(reducedDemand&&demandMode==='documented'&&demandJustification.trim().length<12)errors.push('Informe a referência técnica dos fatores de demanda reduzidos na memória de cálculo.');
 if(!circuits.length)errors.push('Cadastre os circuitos terminais antes de dimensionar o alimentador.');
 if(auditIssues.length)errors.push('Existem pendências na auditoria de cargas. Consulte a memória de cálculo.');
 if(circuits.some(c=>!(feederCircuitElectrical(c,settings,feederRooms).va>0)))errors.push('Há circuitos sem potência aparente válida (VA) ou potência ativa conversível (W).');
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
  const result=liveCircuitSizing(c,settings,feederRooms);
  const circuitBreaker=Number(result?.breaker);
  if(!Number.isFinite(circuitBreaker)||circuitBreaker<=0)errors.push(`${c.title}: disjuntor terminal não dimensionado.`);
  else if(feederCircuitElectrical(c,settings,feederRooms).current>circuitBreaker+1e-6)errors.push(`${c.title}: corrente de projeto recalculada supera o disjuntor terminal.`);
  const circuitSection=Number(result?.selectedSection);
  if(!Number.isFinite(circuitSection)||circuitSection<=0)errors.push(`${c.title}: seção do circuito terminal não dimensionada.`);
 }
 if(demandApplied&&demandMode==='documented'&&circuits.some(c=>effectiveFactor(c)<1&&['other_tue','other'].includes(demandGroup(c))))errors.push('Redução em Outras TUE/Outras cargas exige classificação explícita do equipamento e critério individual; não é seguro aplicar fator genérico por título.');
 if(demandApplied&&demandMode==='external_table'&&circuits.some(c=>applianceEntries[c.id]?.kind==='heating'&&Number(c.data.power||0)<=0))errors.push('Verifique a potência dos aparelhos de aquecimento.');
 if(demandApplied&&!reducedDemand)errors.push('Para aplicar demanda ao alimentador, informe ao menos um fator de grupo inferior a 1.');
 if(demandApplied&&demandMode==='external_table'&&circuits.some(c=>demandCategory(c)==='tue'&&(!applianceEntries[c.id]||!Number.isInteger(applianceEntries[c.id].quantity)||applianceEntries[c.id].quantity<1||applianceEntries[c.id].quantity>100)))errors.push('Classifique todas as TUE e confirme quantidade inteira de 1 a 100 aparelhos por circuito antes de aplicar a demanda automática.');
 if(demandApplied&&demandMode==='documented'){
  // A indicação genérica de uma norma não documenta um fator de demanda.
  // A referência é declarada pelo responsável técnico e não validada automaticamente.
  const reference=demandJustification.trim();
  if(/(?:n[ -]?321[. -]?0001|321[. -]?0001)/i.test(reference)&&!/(?:outra fonte|metodologia complementar|estudo específico|estudo especifico)/i.test(reference))errors.push('A CELESC N-321.0001 (dezembro/2025) não fornece uma tabela geral de fatores residenciais para iluminação, TUG e TUE. Indique uma metodologia complementar específica e verificável; a norma de padrão de entrada, isoladamente, não justifica redução por grupo.');
  if(!/(celesc|nbr|norma|manual|projeto)/i.test(reference)||!/(tabela|item|seção|secao|anexo|memória|memoria)/i.test(reference)||!/(19|20)\d{2}/.test(reference))
   errors.push('Para utilizar demanda reduzida, registre documento, ano/edição e tabela/item aplicável. A referência declarada não é verificada automaticamente.');
 }

 // Reserva conservadora de queda para circuitos terminais: 2% no alimentador,
 // sem alegar conformidade da queda total (ainda requer cálculo específico).
 const feederDropBudget=2;
 const rho=0.0225;
 const candidates=Object.entries(table||{}).map(([section,base])=>{
  const size=Number(section),iz=base*(ft||0)*(fg||0)*harmonicNeutralFactor;
  const drop=2*ib*rho*len/size; // Estimativa resistiva superior simplificada; não substitui cálculo vetorial de queda.
  const dropPercent=100*drop/(voltageFN>0?voltageFN:voltage);
  const breaker=feederBreakers.find(n=>n>=ib-1e-9&&n<=iz+1e-9);
  return {size,iz,dropPercent,breaker};
 }).filter(x=>x.size>=6).sort((a,b)=>a.size-b.size);
 // O orçamento preliminar de 2% é apenas deste trecho; a queda total precisa ser verificada.
 // Em sistemas desequilibrados, adota-se a maior corrente fasorial por fase para a ampacidade.
 // A queda estimada é resistiva e simplificada; reatância e impedância do neutro exigem revisão.
 const chosen=errors.length?undefined:candidates.find(x=>x.iz>=ib&&x.iz>=neutralIb&&x.dropPercent<=feederDropBudget&&x.breaker);
 const terminalBreakers=circuits.map(c=>({id:c.id,title:c.title,breaker:Number(liveCircuitSizing(c,settings,feederRooms)?.breaker)})).filter(c=>Number.isFinite(c.breaker)&&c.breaker>0);
 const largestTerminalBreaker=terminalBreakers.length?Math.max(...terminalBreakers.map(c=>c.breaker)):null;
 const coordinationStatus=!chosen?'pendente':terminalBreakers.length!==circuits.length?'incompleto':largestTerminalBreaker!==null&&chosen.breaker===largestTerminalBreaker?'nominais iguais':largestTerminalBreaker!==null&&chosen.breaker<largestTerminalBreaker?'geral nominalmente menor':'sem seletividade demonstrada';
 const terminalDropValue=totalTerminalDrop.trim()===''?NaN:Number(totalTerminalDrop);
 const totalDrop=chosen&&Number.isFinite(terminalDropValue)?chosen.dropPercent+terminalDropValue:NaN;
 const overloadI2=chosen?1.45*chosen.breaker:NaN; // Somente para disjuntor IEC 60898-1; não presumir outras curvas/dispositivos.
 const overloadI2Limit=chosen?1.45*chosen.iz:NaN;
 // Hipótese explícita: I₂ = 1,45 × In apenas para disjuntores IEC 60898-1.
 // A conferência numérica não substitui a identificação do dispositivo instalado.
 const overloadNominalPass=Boolean(chosen&&ib<=chosen.breaker+1e-9&&chosen.breaker<=chosen.iz+1e-9);
 const overloadI2Pass=Boolean(chosen&&Number.isFinite(overloadI2)&&overloadI2<=overloadI2Limit+1e-9);
 const coordinationAudit={generalBreaker:chosen?.breaker??null,largestTerminalBreaker,terminalBreakers,status:coordinationStatus,overloadNominalPass:chosen?overloadNominalPass:null,overloadI2Pass:chosen?overloadI2Pass:null,overloadI2Model:"IEC 60898-1 (hipótese; verificar dispositivo)",selectivityVerified:false,reason:'Correntes nominais não comprovam seletividade. Exige curvas e dados de curto-circuito dos dispositivos.'};
 const upstreamNominal=celescEntry?.breakerIEC??null;
 const upstreamNominalCompatible=Boolean(chosen&&upstreamNominal!==null&&chosen.breaker<=upstreamNominal);
 const validationIssues=[
  ...(!Number.isFinite(terminalDropValue)||terminalDropValue<0?['Informe a maior queda de tensão terminal verificada.']:[]),
  ...(Number.isFinite(totalDrop)&&totalDrop>4?['Queda total estimada acima de 4%; confirmar o limite normativo aplicável.']:[]),
  ...(!overloadNominalPass||!overloadI2Pass?['Coordenação de sobrecarga preliminar não satisfeita: verificar Ib ≤ In ≤ Iz e I₂ ≤ 1,45 × Iz.']:[]),
  ...(!shortCircuitChecked?['Falta comprovação de curto-circuito (Icc, capacidade de interrupção e atuação).']:[]),
  ...(!protectionChecked?['Falta comprovação de proteção contra choques, sobrecarga e dispositivo adotado.']:[]),
  ...(!neutralChecked?['Falta análise do neutro e harmônicas conforme cargas reais.']:[]),
  ...(!upstreamChecked?['Falta conferência do padrão CELESC e coordenação a montante.']:[]),
  ...(!upstreamNominalCompatible?['Disjuntor do QD excede o nominal do padrão ou padrão não determinado.']:[]),
  ...(technicalReference.trim().length<12?['Registre a referência das verificações técnicas.']:[])
 ];
 const technicalValidated=Boolean(chosen&&!errors.length&&!validationIssues.length);
 const neutral=chosen?.size||0,pe=chosen?peSection(chosen.size):0; // Neutro integral, sujeito a verificação de harmônicas.
 const fmt=(n:number)=>Number.isFinite(n)?feederFormat(n):'—';
 async function save(){
  if(!projectId||saving||!chosen||errors.length)return;
  setSaving(true);setMessage('');
  try{
   const pr=await supabase.from('eletripro_projects').select('installation').eq('id',projectId).eq('owner_id',userId).single();
   if(pr.error)throw pr.error;
   const installation={...(pr.data?.installation||{}),demandJustification:demandMode==='external_table'?externalResidentialReference:demandJustification,demandGroupFactors:selectedFactors,demandMode,demandAppliances:applianceEntries,applyDocumentedDemand:demandApplied,feeder:{length,demandFactor:String(appliedDemandFactor),voltage:String(voltage),powerFactor:String(pf),maxDrop:String(feederDropBudget),groupCount:settings.groupCount,breaker:String(chosen.breaker),neutralSection:String(neutral),notes:(demandMode==='external_table'?externalResidentialReference:demandJustification)||'Demanda conservadora de 100%; verificar concessionária e demais critérios.',technicalValidation:{status:technicalValidated?'verificacoes_declaradas':'pendente',terminalDropPercent:Number.isFinite(terminalDropValue)?terminalDropValue:null,totalDropPercent:Number.isFinite(totalDrop)?totalDrop:null,shortCircuitChecked,protectionChecked,neutralChecked,upstreamChecked,reference:technicalReference.trim(),issues:validationIssues,validatedAt:technicalValidated?new Date().toISOString():null,automaticallyVerified:false},calculation:{sourceRevision:feederSourceRevision(circuits,feederRooms,settings),coordinationAudit,installationAssumption:{method,description:method==='B1'?'Condutores isolados em eletroduto embutido em alvenaria (premissa residencial)':'Método informado em configurações avançadas; verificar instalação física',confirmedBySystem:false},celescEntry:celescEntry?{...celescEntry,installedKW,source:celescEntryReference}:null,power:sumPower,demand:appliedDemandFactor,demandedVA:appliedDemandedVA,proposedDemandFactor:demand,proposedDemandVA:demandedVA,phaseDemand,phaseUpperBounds,phaseSizingBounds,demandApplied,demandJustification:demandMode==='external_table'?externalResidentialReference:demandJustification,groupFactors:selectedFactors,automaticResidentialCircuitFactors:demandMode==='external_table'?circuits.map(c=>({id:c.id,title:c.title,category:autoResidential.kindFor(c),quantity:applianceEntries[c.id]?.quantity||0,factor:autoResidential.factorForCircuit(c)})):null,automaticResidentialAudit:demandMode==='external_table'?{installedKW:autoResidential.installedKW,heatingCount:autoResidential.heatingCount,stoveCount:autoResidential.stoveCount,ovenCount:autoResidential.ovenCount,airCount:autoResidential.airCount,stoveFactor:autoResidential.stove,ovenFactor:autoResidential.oven,source:externalResidentialReference,method:'fator específico por circuito, não fator único de TUE'}:null,neutralIb,neutralFundamental,feederTopology,supply:settings.supply,voltageFN,voltageFF,ib,section:chosen.size,iz:chosen.iz,dropPercent:chosen.dropPercent,pe,neutral,breaker:chosen.breaker,loaded:loadedDescription,harmonicNeutralFactor,method,material,insulation,temperature:settings.temperature,groupMode:settings.groupMode,groupCount:Number(settings.groupCount),updatedAt:new Date().toISOString()}}};
   const res=await supabase.from('eletripro_projects').update({installation,updated_at:new Date().toISOString()}).eq('id',projectId).eq('owner_id',userId);
   if(res.error)throw res.error;setMessage(technicalValidated?'✓ Dimensionamento salvo com verificações técnicas declaradas. A aprovação executiva permanece sob responsabilidade do profissional habilitado.':'✓ Pré-dimensionamento salvo com pendências técnicas identificadas. Não liberado para execução.');
  }catch(e){setMessage('Erro ao salvar: '+String(e))}finally{setSaving(false)}
 }
 return <section className="panel sizing-form"><h2>Alimentador geral do quadro de distribuição</h2>
 <p className="hint">A EletriPro utiliza automaticamente os circuitos e os parâmetros de Tipo de instalação. O disjuntor indicado é o do quadro de distribuição, não o da caixa de medição.</p>
 {!celescEntry&&<p className="hint" role="alert">Sem classificação automática CELESC para esta carga/tensão. Não valide o alimentador até confirmar o fornecimento.</p>}
 <p className="hint"><strong>Composição do alimentador (fornecimento da concessionária): {feederTopology}.</strong> O campo ‘Composição dos condutores’ do cadastro de instalação se aplica aos circuitos internos e não altera a topologia do alimentador. A presença do neutro deve ser confirmada no padrão de fornecimento real.</p>
 <p className="hint" role="note">Tensão dos circuitos cadastrada: {fmt(voltage)} V. Alimentação: VFN {voltageFN>0?fmt(voltageFN):"não informada"} V; VFF {voltageFF>0?fmt(voltageFF):"não informada"} V. Os circuitos existentes não são convertidos automaticamente. Confira a tensão e a ligação de cada circuito antes do projeto executivo.</p>
 {loading?<p>Carregando circuitos...</p>:<>
 <div className="two"><label>Distância da caixa de medição até o QD (m)<input type="number" min="0.1" step="0.1" value={length} onChange={e=>{setLength(e.target.value);setMessage('')}}/></label></div>
 <div className="panel" style={{marginBottom:16}}>
 <h3>Enquadramento do padrão de entrada — CELESC (indicativo)</h3>
 <p className="hint">Este quadro é independente do alimentador interno do QD. A categoria usa a carga instalada C, sem fatores de demanda. Fonte: {celescEntryReference}. A classificação não substitui a conferência da edição vigente, do trecho físico, das notas e da aprovação pela concessionária.</p>
 <div className="ep-summary-grid">
  <div><span>Carga instalada considerada</span><strong>{fmt(installedKW)} kW</strong></div>
  <div><span>Categoria CELESC</span><strong>{celescEntry?.category||'Não determinada'}</strong></div>
  <div><span>Disjuntor IEC/DIN do padrão</span><strong>{celescEntry?celescEntry.breakerIEC+' A':'—'}</strong></div>
  <div><span>Ramal de entrada</span><strong>Conferir Tabela 01</strong></div>
  <div><span>Fornecimento proposto</span><strong>{celescEntry?(celescEntry.supply==='single'?'Monofásico':celescEntry.supply==='two'?'Bifásico':'Trifásico'):'—'}</strong></div>
 </div>
 {celescEntry?<p className="hint">Faixa: {celescEntry.range}. A seção dos ramais deve ser conferida na coluna apropriada da Tabela 01; não é a seção do alimentador interno. Disjuntor do padrão: {celescEntry.breakerIEC} A; disjuntor do QD: {chosen?chosen.breaker+' A':'a dimensionar'}.</p>:<p className="hint" role="status">Classificação indisponível para as tensões/cargas informadas ou fora do limite de 75 kW. Confirme a rede e a norma aplicável.</p>}
 </div>
 <h3>Alimentador interno — medição até QD (NBR 5410)</h3>
 <div className="ep-summary-grid">
 <div><span>Condutor de fase</span><strong>{chosen?fmt(chosen.size)+' mm²':'—'}</strong></div>
 <div><span>Disjuntor geral do QD</span><strong>{chosen?fmt(chosen.breaker||0)+' A':'—'}</strong></div>
 <div><span>Condutor neutro (preliminar)</span><strong>{chosen?fmt(neutral)+' mm²':'—'}</strong></div>
 <div><span>Condutor de proteção PE (preliminar)</span><strong>{chosen?fmt(pe)+' mm²':'—'}</strong></div>
 </div>
 <div className="panel"><h3>Coordenação dos disjuntores — verificação preliminar</h3>
 <div className="ep-summary-grid"><div><span>Disjuntor geral do QD</span><strong>{chosen?fmt(chosen.breaker||0)+' A':'—'}</strong></div><div><span>Maior disjuntor terminal</span><strong>{largestTerminalBreaker!==null?fmt(largestTerminalBreaker)+' A':'—'}</strong></div><div><span>Comparação nominal</span><strong>{coordinationStatus}</strong></div></div>
 <p className="hint" role="status">Correntes nominais iguais são permitidas quando os critérios de proteção e dimensionamento são atendidos. A seletividade <strong>não está demonstrada</strong> pela comparação nominal, mesmo quando o disjuntor geral é maior. Verificar curvas tempo-corrente, corrente de curto-circuito, capacidade de interrupção e coordenação do fabricante.</p>
 {details&&<div style={{overflowX:'auto'}}><table><thead><tr><th>Circuito terminal</th><th>Disjuntor</th><th>Comparação com geral</th></tr></thead><tbody>{terminalBreakers.map(c=><tr key={c.id}><td>{c.title}</td><td>{fmt(c.breaker)} A</td><td>{chosen?(c.breaker===chosen.breaker?'Igual':c.breaker>chosen.breaker?'Maior':'Menor'):'Pendente'}</td></tr>)}</tbody></table></div>}
 </div>
 <button type="button" className="secondary" onClick={()=>setDetails(v=>!v)}>{details?'Ocultar memória de cálculo':'Mostrar memória de cálculo'}</button>
 {details&&<div className="panel"><h3>Auditoria automática das cargas</h3><p className="hint">A EletriPro identifica o tipo e a potência aparente de cada circuito. Os ambientes vinculados alimentam os circuitos, mas não são somados novamente, evitando dupla contagem. A demanda por grupo é exibida para auditoria. O alimentador usa 100% das cargas por padrão; fatores documentados só entram no pré-dimensionamento com confirmação explícita do responsável técnico.</p>
 <div className="ep-summary-grid">{demandCategories.map(k=><div key={k}><span>{demandLabels[k]}</span><strong>{fmt(demandTotals[k])} VA</strong><small>{demandAudit.filter(x=>x.category===k).length} circuito(s)</small></div>)}</div>
 <p className="hint" role="status"><strong>Critério efetivamente aplicado:</strong> {demandApplied?'Fatores documentados confirmados':'100% da potência instalada (fatores propostos ainda não aplicados)'}. Potência usada no dimensionamento: {fmt(appliedDemandedVA)} VA. Potência com fatores propostos: {fmt(demandedVA)} VA.</p><h4>Equipamentos identificados automaticamente</h4><div style={{overflowX:'auto'}}><table><thead><tr><th>Grupo de carga</th><th>Circuitos</th><th>Potência (VA)</th><th>Demanda considerada (VA)</th></tr></thead><tbody>{groupTotals.map(({group,items})=><tr key={group}><td>{demandGroupLabels[group]}</td><td>{items.length}</td><td>{fmt(items.reduce((a,x)=>a+x.va,0))}</td><td>{fmt(items.reduce((a,x)=>a+x.va*effectiveFactor(x.c),0))}</td></tr>)}</tbody></table></div><p className="hint">A coluna demanda desta auditoria é uma simulação proposta; não é aplicada até a confirmação técnica. Cargas classificadas como Outras TUE/Outras cargas não podem receber redução genérica sem identificação específica. A identificação dos equipamentos usa o nome e o tipo dos circuitos. Confira as classificações abaixo; títulos genéricos podem exigir revisão. Os fatores por grupo são informativos por padrão; podem entrar no pré-dimensionamento somente com confirmação expressa e referência técnica documentada.</p><div style={{overflowX:'auto'}}><table><thead><tr><th>Circuito</th><th>Categoria</th><th>Equipamento identificado</th><th>Potência (VA)</th><th>Fator</th><th>Demanda (VA)</th><th>Origem</th></tr></thead><tbody>{demandAudit.map(({c,category,group,va})=><tr key={c.id}><td>{c.title}</td><td>{demandLabels[category]}</td><td>{demandGroupLabels[group]}</td><td>{fmt(va)}</td><td>{fmt(effectiveFactor(c))}</td><td>{fmt(va*effectiveFactor(c))}</td><td>{demandCircuitSource(c)}</td></tr>)}</tbody></table></div>
 {auditIssues.length>0?<div><strong>Pendências de cadastro</strong>{auditIssues.map((issue,i)=><p className="hint" key={i}>{issue}</p>)}</div>:<p className="hint">Todos os circuitos possuem categoria reconhecida e potência aparente disponível.</p>}
 </div>}
 {details&&<div className="panel"><h3>Auditoria de tensão e corrente por circuito</h3><p className="hint">Comparação informativa entre a corrente terminal salva e a corrente derivada da potência aparente e da tensão da ligação. Divergências superiores a 5% bloqueiam o salvamento; o circuito terminal precisa ser redimensionado individualmente.</p><div style={{overflowX:'auto'}}><table><thead><tr><th>Circuito</th><th>Ligação</th><th>Tensão (V)</th><th>VA</th><th>Ib dimensionado (A)</th><th>Ib por ligação (A)</th><th>Estado</th></tr></thead><tbody>{circuits.map(c=>{const e=feederCircuitElectrical(c,settings,feederRooms);return <tr key={c.id}><td>{c.title}</td><td>{String(c.data.panelConnection||c.data.panelPhase||'não atribuída')}</td><td>{fmt(e.voltage)}</td><td>{fmt(e.va)}</td><td>{fmt(liveCircuitSizing(c,settings,feederRooms)?.current||NaN)}</td><td>{fmt(e.current)}</td><td>{liveCircuitSizing(c,settings,feederRooms)&&Math.abs(liveCircuitSizing(c,settings,feederRooms)!.current-e.current)<=0.05*e.current?'Conferido':'Revisar circuito'}</td></tr>})}</tbody></table></div></div>}
 {details&&<div className="panel"><h3>Critérios de demanda por grupo</h3><p className="hint">Sem uma tabela de demanda aplicável e documentada, o modo conservador considera 100% das cargas. A EletriPro não inventa fatores normativos.</p><p className="hint"><strong>Referência conferida:</strong> CELESC N-321.0001, dezembro/2025, estabelece critérios de fornecimento e dimensionamento do padrão de entrada, mas não apresenta tabela geral de fatores de demanda residenciais para iluminação, TUG e TUE. Portanto, citar somente essa norma não habilita redução automática do alimentador interno. A Tabela 04 trata especificamente de motores e não deve ser aplicada a chuveiros, tomadas ou iluminação.</p>
 <label>Metodologia<select value={demandMode} onChange={e=>{setDemandMode(e.target.value as 'conservative'|'documented'|'external_table');setApplyDocumentedDemand(false)}}><option value="conservative">Conservadora — 100% das cargas</option><option value="documented">Fatores por grupo — critérios documentados pelo responsável técnico</option><option value="external_table">Cálculo automático demonstrativo — tabelas externas CEDRAP (exige validação)</option></select></label>
 {demandMode==='external_table'&&<div className="panel"><h4>Cadastro estruturado de equipamentos</h4><p className="hint">Classifique cada TUE e informe quantos aparelhos efetivamente estão ligados ao circuito. A classificação sugerida pelo título é apenas uma indicação, não altera o cálculo até você selecioná-la. Quantidade é usada na tabela de simultaneidade; a potência do circuito continua sendo a soma registrada, sem multiplicação adicional. Selecione "Outro" quando a tabela não se aplicar.</p><div style={{overflowX:'auto'}}><table><thead><tr><th>Circuito TUE</th><th>Sugestão pelo nome</th><th>Classificação confirmada</th><th>Quantidade de aparelhos</th><th>Fator calculado</th></tr></thead><tbody>{circuits.filter(c=>demandCategory(c)==='tue').map(c=><tr key={c.id}><td>{c.title}</td><td>{applianceKindLabels[automaticApplianceClass(c)==='unclassified'?'unclassified':automaticApplianceClass(c)==='residential_ac'?'residential_ac':automaticApplianceClass(c)==='stove'?'stove':'oven']}</td><td><select aria-label={'Equipamento de '+c.title} value={applianceEntries[c.id]?.kind||'unclassified'} onChange={e=>{const kind=e.target.value as ApplianceKind;setApplianceEntries(old=>({...old,[c.id]:{kind,quantity:old[c.id]?.quantity||1}}));setApplyDocumentedDemand(false)}}>{applianceKinds.map(k=><option key={k} value={k}>{applianceKindLabels[k]}</option>)}</select></td><td><input aria-label={'Quantidade de '+c.title} type="number" min="1" max="100" step="1" value={applianceEntries[c.id]?.quantity||1} onChange={e=>{setApplianceEntries(old=>({...old,[c.id]:{kind:old[c.id]?.kind||'unclassified',quantity:Number(e.target.value)}}));setApplyDocumentedDemand(false)}}/></td><td>{fmt(autoResidential.factorForCircuit(c))}</td></tr>)}</tbody></table></div><p className="hint">Circuitos antigos não recebem classificação automática presumida. Revise cada TUE antes de confirmar a demanda. O cadastro é salvo no projeto junto com a memória de cálculo; não exige alteração no banco.</p></div>}
 {demandMode==='external_table'&&<div className="sizing-warning"><strong>Metodologia externa, não CELESC</strong><p>Fonte: {externalResidentialReference}</p><p>Iluminação + TUG: {fmt(autoResidential.installedKW)} kW de potência ativa, fator {fmt(autoResidential.factors.lighting)}. Chuveiros + torneiras: {autoResidential.heatingCount} aparelho(s) cadastrados, fator {fmt(autoResidential.factors.shower)}. Fogões/cooktops: {autoResidential.stoveCount} aparelho(s), fator {fmt(autoResidential.stove)} (Tabela 16). Fornos/micro-ondas/secadoras/lava-louças: {autoResidential.ovenCount} aparelho(s), fator {fmt(autoResidential.oven)} (Tabela 15). Ar-condicionado residencial: {autoResidential.airCount} aparelho(s), fator 1,00 (item 9.5.6). Outras TUE sem classificação específica: 100%.</p><p>Esta metodologia foi publicada por outra distribuidora e NÃO é presumida aplicável à CELESC. Confirme as quantidades e classificações cadastradas, a potência de placa, o escopo das tabelas e a aceitação técnica. Motores, boilers, hidromassagem e equipamentos especiais sem identificação inequívoca permanecem em 100%; não se aplica fator genérico.</p><label style={{display:'flex',gap:8,alignItems:'start'}}><input type="checkbox" checked={applyDocumentedDemand} onChange={e=>setApplyDocumentedDemand(e.target.checked)}/><span>Sou o responsável técnico e confirmo a aplicabilidade desta metodologia externa ao alimentador deste projeto, incluindo a contagem e a classificação estruturadas dos aparelhos e as potências de placa.</span></label></div>}
 {demandMode==='documented'&&<><div className="two">{demandGroupOrder.map(k=><label key={k}>{demandGroupLabels[k]} — fator (0 a 1)<input type="number" min="0.01" max="1" step="0.01" value={groupFactors[k]} onChange={e=>setGroupFactors(o=>({...o,[k]:Number(e.target.value)}))}/></label>)}</div><label>Referência técnica, tabela e justificativa<input value={demandJustification} onChange={e=>setDemandJustification(e.target.value)} placeholder="Documento, edição/ano, tabela/item e condições de aplicação"/></label><label style={{display:'flex',gap:8,alignItems:'start'}}><input type="checkbox" checked={applyDocumentedDemand} onChange={e=>setApplyDocumentedDemand(e.target.checked)}/><span>Aplicar os fatores documentados no pré-dimensionamento do alimentador. Confirmo que verifiquei a fonte, a edição, as condições de aplicação e a simultaneidade dos equipamentos. A EletriPro não valida automaticamente esses fatores.</span></label></>}
 </div>}
 {details&&<div className="panel"><h3>Rastreabilidade da seleção do alimentador</h3><p className="hint">As alternativas são avaliadas pela corrente por fase da metodologia selecionada (100% por padrão; fatores documentados somente quando confirmados), capacidade corrigida e queda resistiva estimada exclusivamente neste trecho. A coluna decisão indica por que uma seção foi descartada. A aprovação é preliminar: reserva 2% de queda para este trecho, mas não contempla curto-circuito, seletividade nem queda total.</p><div style={{overflowX:'auto'}}><table><thead><tr><th>Seção (mm²)</th><th>Iz corrigida (A)</th><th>Queda (%)</th><th>Disjuntor (A)</th><th>Decisão</th></tr></thead><tbody>{candidates.map(x=><tr key={x.size}><td>{fmt(x.size)}</td><td>{fmt(x.iz)}</td><td>{fmt(x.dropPercent)}</td><td>{x.breaker?fmt(x.breaker):'—'}</td><td>{x.iz<ib?'Iz inferior à corrente de projeto':x.iz<neutralIb?'Neutro exige revisão':x.dropPercent>feederDropBudget?'Queda do trecho superior a '+feederDropBudget+'%':!x.breaker?'Sem disjuntor compatível':chosen?.size===x.size?'Primeira alternativa preliminar':'Alternativa possível'}</td></tr>)}</tbody></table></div></div>}
 {details&&<div className="ep-summary-grid">
 {([['Potência ativa dos circuitos',fmt(sumPower)+' W'],['Potência aparente considerada',fmt(sumVA)+' VA'],['Demanda proposta',fmt(demand*100)+' % (média ponderada)'],['Fator efetivamente aplicado',fmt(appliedDemandFactor*100)+' %'],['Demanda aplicada ao alimentador',demandApplied?'Sim — referência declarada pelo responsável técnico':'Não — 100% das cargas'],['Potência aparente usada no dimensionamento',fmt(appliedDemandedVA)+' VA'],['Potência aparente com fatores propostos',fmt(demandedVA)+' VA'],['Corrente de projeto para seleção (Ib — '+(demandApplied?'demanda documentada':'100% das cargas')+')',fmt(ib)+' A'],['Corrente estimada no neutro (fundamental)',fmt(neutralFundamental)+' A'],['Critério conservador para seção do neutro',fmt(neutralIb)+' A'],['Composição do alimentador',feederTopology],['Origem da composição','Fornecimento da concessionária (independente dos circuitos internos)'],...Object.entries(phaseDemand).map(([phase,current])=>['Fase '+phase+' — fasorial',fmt(current)+' A'] as [string,string]),...Object.entries(phaseUpperBounds).map(([phase,current])=>['Fase '+phase+' — limite conservador',fmt(current)+' A'] as [string,string]),...Object.entries(phaseSizingBounds).map(([phase,current])=>['Fase '+phase+' — limite para dimensionamento ('+(demandApplied?'documentado':'100%')+')',fmt(current)+' A'] as [string,string][]),['Tensão geral cadastrada dos circuitos',fmt(voltage)+' V'],['Tensão fase-neutro (VFN)',settings.supply==='single'?fmt(voltage)+' V':voltageFN>0?fmt(voltageFN)+' V':'não informada'],['Tensão fase-fase (VFF)',settings.supply==='single'?'não aplicável':voltageFF>0?fmt(voltageFF)+' V':'não informada'],['Correntes recalculadas por ligação','FN: VFN; FF: VFF; trifásico: √3 × VFF'],['Método de instalação',method],['Condutores carregados (NBR 5410, Tabela 46)',loadedDescription],['Fator conservador de neutro harmônico',fmt(harmonicNeutralFactor)],['Temperatura',settings.temperature+' °C'],['Fator de temperatura',fmt(ft||0)],['Fator de agrupamento',fmt(fg||0)],['Capacidade corrigida (Iz)',chosen?fmt(chosen.iz)+' A':'—'],['Queda resistiva estimada',chosen?fmt(chosen.dropPercent)+' %':'—'],['Auditoria de conexões e proteções',errors.length?`${errors.length} pendência(s)`:'Sem pendências cadastrais'] ] as [string,string][]).map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}
 </div>}
 <div className="panel"><h3>Verificação técnica do alimentador — responsável habilitado</h3>
 <p className="hint">O cálculo automático é preliminar. A confirmação abaixo registra verificações externas, sem alegar que o aplicativo calculou Icc, impedância de falta, seletividade, harmônicas ou queda dos circuitos terminais.</p>
 <div className="two"><label>Maior queda de tensão terminal verificada (%)<input type="number" min="0" max="100" step="0.01" value={totalTerminalDrop} onChange={e=>setTotalTerminalDrop(e.target.value)} placeholder="Ex.: 1,5"/></label><div><span>Queda total somada (estimativa)</span><strong>{Number.isFinite(totalDrop)?fmt(totalDrop)+' %':'Pendente'}</strong><p className="hint">Soma conservadora de estimativas; verificar o limite aplicável ao ponto de entrega e às cargas.</p></div></div>
 <p className="hint" role="status"><strong>Coordenação de sobrecarga (hipótese IEC 60898-1):</strong> {chosen?(overloadNominalPass&&overloadI2Pass?"I_b ≤ I_n ≤ I_z e I₂ ≤ 1,45 × I_z atendidos numericamente.":"Incompatibilidade numérica; revisar seção ou proteção."):"Pendente de dimensionamento."} A seletividade e a proteção em curto-circuito não são demonstradas por esta comparação.</p>
 <p className="hint">Disjuntor geral: {chosen?fmt(chosen.breaker)+' A':'—'}; Iz: {chosen?fmt(chosen.iz)+' A':'—'}; I₂ = 1,45 × In = {Number.isFinite(overloadI2)?fmt(overloadI2)+' A':'—'} (apenas hipótese IEC 60898-1); 1,45 × Iz = {Number.isFinite(overloadI2Limit)?fmt(overloadI2Limit)+' A':'—'}. Confirme a norma e o modelo do dispositivo.</p>
 <p className="hint">Padrão CELESC: {upstreamNominal!==null?fmt(upstreamNominal)+' A':'não determinado'}; QD: {chosen?fmt(chosen.breaker)+' A':'não determinado'}. {upstreamNominalCompatible?'Compatibilidade nominal preliminar; seletividade não demonstrada.':'Incompatibilidade nominal ou ausência de dados: revisar antes da aprovação.'}</p>
 <label style={{display:'flex',gap:8,alignItems:'start'}}><input type="checkbox" checked={shortCircuitChecked} onChange={e=>setShortCircuitChecked(e.target.checked)}/>Conferi Icc mínima/máxima, capacidade de interrupção, atuação em falta e suportabilidade térmica dos condutores.</label>
 <label style={{display:'flex',gap:8,alignItems:'start'}}><input type="checkbox" checked={protectionChecked} onChange={e=>setProtectionChecked(e.target.checked)}/>Conferi a proteção contra choques e sobrecorrentes, incluindo I₂ e as características reais do dispositivo.</label>
 <label style={{display:'flex',gap:8,alignItems:'start'}}><input type="checkbox" checked={neutralChecked} onChange={e=>setNeutralChecked(e.target.checked)}/>Conferi a seção do neutro, as cargas não lineares/harmônicas e o PE nas condições reais.</label>
 <label style={{display:'flex',gap:8,alignItems:'start'}}><input type="checkbox" checked={upstreamChecked} onChange={e=>setUpstreamChecked(e.target.checked)}/>Conferi padrão de entrada CELESC, proteção a montante e coordenação dos dispositivos.</label>
 <label>Referências das verificações (documento, edição, cálculos e responsável)<input value={technicalReference} onChange={e=>setTechnicalReference(e.target.value)} placeholder="Memória de cálculo / laudo, edição e responsável"/></label>
 <p role="status" className="hint"><strong>{technicalValidated?'Verificações declaradas — sujeitas à responsabilidade técnica':'Pré-dimensionamento — verificações pendentes'}</strong></p>
 {validationIssues.map((issue,i)=><p key={i} className="hint" role="alert">{issue}</p>)}
 </div>
 {errors.map((e,i)=><p key={i} className="hint" role="alert">{e}</p>)}
 {!errors.length&&!chosen&&<p className="hint" role="alert">Nenhuma combinação válida de condutor e disjuntor foi encontrada nas tabelas disponíveis.</p>}
 <p className="hint">Referência inicial de fornecimento: CELESC. A EletriPro não presume fatores de demanda da concessionária: a aplicação de reduções exige declaração expressa do projetista, sem validação normativa automática. O cálculo do alimentador interno do QD não deve ser confundido com o dimensionamento do padrão de entrada.</p><p className="hint">Resultado preliminar: demanda conservadora de 100% por padrão. O dimensionamento utiliza a maior soma conservadora de correntes por fase, evitando subdimensionamento por cancelamento fasorial presumido. Fatores reduzidos só afetam o pré-dimensionamento mediante confirmação explícita e justificativa técnica; a referência declarada não é verificada pelo sistema; após salvar, reabra o Quadro de distribuição para atualizar o resumo por fase. A queda de tensão calculada usa orçamento conservador de 2% apenas para o alimentador, não inclui reatância nem os circuitos terminais e NÃO comprova o limite total. Antes da execução, o responsável técnico deve validar demanda, queda total, curto-circuito, capacidade de interrupção, proteção contra choques, seletividade, neutro, PE e requisitos da concessionária.</p>
 <div className="ep-form-footer"><button className="primary" disabled={saving||!chosen||errors.length>0} onClick={()=>void save()}>{saving?'Salvando...':'Salvar dimensionamento do QD'}</button></div>
 {message&&<p role="status">{message}</p>}
 </>}</section>;
}

type MaterialRow={id:string;description:string;quantity:number;unit:string;unit_price:number;item_type?:'material'|'labor';source_key?:string|null};
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
function materialRouteLength(c:SavedCircuit,rooms?:SavedEnvironment[]):number{
 const d=c.data||{},saved=Number(d.length);
 if(saved>0&&Number.isFinite(saved)&&!d.lengthEstimated)return saved;
 const links=Array.isArray(d.loadLinks)?d.loadLinks as CircuitLoadLink[]:[];
 if(rooms&&links.length)return estimateCircuitRoute(links,rooms)??0;
 return saved>0&&Number.isFinite(saved)?saved:0;
}
function generatedCircuitItems(c:SavedCircuit,settings?:InstallationSettings,rooms?:SavedEnvironment[],catalog:CatalogDescription[]=[]){
 const d=c.data||{},r=(d.results||{}) as Record<string,unknown>;
 const live=settings?liveCircuitSizing(c,settings,rooms):null;
 const section=Number(settings?live?.selectedSection:r.selectedSection),breaker=Number(settings?live?.breaker:r.breaker),length=materialRouteLength(c,rooms);
 if(!(section>0&&breaker>0))return null;
 const cfg=(settings||d.installationSnapshot||defaultInstallation) as InstallationSettings;
 const wiring=String(d.wiring||cfg.wiring||'phase-neutral');
 const choices=panelChoices(cfg,panelPoles(c,cfg));
 const stored=String(d.panelConnection||d.panelPhase||'A') as PanelConnection;
 const connection=choices.includes(stored)?stored:choices[0];
 const list=budgetCableItems({connection,length:Number.isFinite(length)&&length>0?length:0,size:section,material:String(d.material||cfg.conductorMaterial||'copper'),insulation:String(d.insulation||cfg.conductorInsulation||'PVC 70 °C'),circuit:String(d.circuit||'tug'),wiring,breaker,curve:String(live?.curve||r.curve||'a confirmar'),poles:wiring==='phase-neutral'?1:wiring==='phase-phase'?2:3,catalog});
 return list.map((item,i)=>({description:item.description,quantity:item.quantity,unit:item.unit,source_key:`${c.id}:${item.id.startsWith('dj-')?'breaker':item.sourceRole||i}`}));
}
async function syncCircuitMaterials(projectId:string,circuit:SavedCircuit|null,removedId?:string,settings?:InstallationSettings,rooms?:SavedEnvironment[],preloaded?:{existing:GeneratedMaterial[];catalog:CatalogDescription[]}){
 if(!supabase)throw new Error('Supabase indisponível');
 const id=removedId||circuit?.id;
 if(!id)return;
 const found=preloaded?{data:preloaded.existing,error:null}:await supabase.from('eletripro_materials').select('id,source_key,description,quantity,unit,unit_price').eq('project_id',projectId).not('source_key','is',null);
 if(found.error)throw found.error;
 const existing=((found.data||[]) as GeneratedMaterial[]).filter(x=>x.source_key?.startsWith(id+':'));
 const catalog=circuit?(preloaded?.catalog??await loadActiveElectricalCatalog()):[];
 const desired=circuit?generatedCircuitItems(circuit,settings,rooms,catalog):[];
 // Sem dimensionamento válido, não apaga materiais existentes: exige revisão.
 if(desired===null)throw new Error('Circuito sem dimensionamento completo. Materiais anteriores preservados para revisão.');
 const inserts=(desired||[]).filter(item=>!existing.some(x=>x.source_key===item.source_key)).map(item=>({project_id:projectId,...item,unit_price:0,item_type:'material'}));
 const updates=(desired||[]).flatMap(item=>{const old=existing.find(x=>x.source_key===item.source_key);return old&&(old.description!==item.description||Number(old.quantity)!==Number(item.quantity)||old.unit!==item.unit)?[{old,item}]:[]});
 const results=await Promise.all([...updates.map(({old,item})=>supabase!.from('eletripro_materials').update({description:item.description,quantity:item.quantity,unit:item.unit}).eq('id',old.id).eq('project_id',projectId)),...(inserts.length?[supabase.from('eletripro_materials').insert(inserts)]:[])]);
 for(const r of results)if(r.error)throw r.error;
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
 // Orçamentos existentes são documentos editáveis, não devem ser recriados.
 if(b.data?.id)return;
 const items=consolidateMaterialRows((m.data||[]).map((x,i)=>({...x,id:String(i)})) as MaterialRow[]).map(x=>({budget_id:budgetId,description:x.description,quantity:x.quantity,unit:x.unit,unit_price:x.unit_price,item_type:x.item_type==='labor'?'labor':'material'}));
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
function MaterialsPanel({clientId,userId,localBudget,client,professional,logo,accent,settings}:{clientId:string;userId:string;localBudget:BudgetItem[];client:Client;professional:string;logo:string;accent:string;settings:InstallationSettings}){
 const [rows,setRows]=useState<MaterialRow[]>([]),[projectId,setProjectId]=useState(''),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
 const [description,setDescription]=useState(''),[quantity,setQuantity]=useState('1'),[unit,setUnit]=useState('un'),[unitPrice,setUnitPrice]=useState('0');
 const [editingId,setEditingId]=useState<string|null>(null);
 const [selectedGroup,setSelectedGroup]=useState<MaterialRow[]|null>(null);
 const [editorOpen,setEditorOpen]=useState(false);
 const [manualCatalog,setManualCatalog]=useState<CatalogDescription[]>([]),[catalogChoice,setCatalogChoice]=useState('');
 useEffect(()=>{let live=true;if(editorOpen)void loadActiveElectricalCatalog().then(items=>{if(live)setManualCatalog(items)});return()=>{live=false}},[editorOpen]);
 const [refreshCount,setRefreshCount]=useState(0);
 const [itemType,setItemType]=useState<'material'|'labor'>('material');
 const [exportMaterials,setExportMaterials]=useState(true),[exportValues,setExportValues]=useState(true),[exportLabor,setExportLabor]=useState(false);
 useEffect(()=>{
  let live=true;setRows([]);setProjectId('');setStatus('Carregando materiais...');
  void (async()=>{try{
   if(!supabase)throw new Error('Supabase indisponível');
   const id=await ensureEletriProject(clientId,userId);
   const warnings:string[]=[];
   if(refreshCount===0){
    setBusy(true);
    try{await refreshGenerated(id,warnings)}catch(e){warnings.push(String(e))}finally{if(live)setBusy(false)}
   }
   const result=await supabase.from('eletripro_materials').select('id,description,quantity,unit,unit_price,item_type').eq('project_id',id).order('created_at',{ascending:true});
   if(result.error)throw result.error;
   if(live){setProjectId(id);setRows((result.data||[]) as MaterialRow[]);setStatus(warnings.length?'Revisar: '+warnings.join('; '):'');}
  }catch(e){if(live)setStatus('Erro ao carregar materiais: '+(e instanceof Error?e.message:String(e)))}})();
  return()=>{live=false};
 },[clientId,userId,refreshCount]);
 const reset=()=>{setEditorOpen(false);setCatalogChoice('');setEditingId(null);setDescription('');setQuantity('1');setUnit('un');setUnitPrice('0');setItemType('material')};
 async function save(){
  if(!supabase||!projectId||busy)return;
  const q=Number(quantity),price=Number(unitPrice),desc=description.trim();
  if(itemType!=='material'){setStatus('Mão de obra deve ser cadastrada na aba Orçamento.');return}
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
 const openEditor=(r:MaterialRow)=>{setSelectedGroup(null);setCatalogChoice('');setEditorOpen(true);setEditingId(r.id);setDescription(r.description);setQuantity(String(r.quantity));setUnit(r.unit);setUnitPrice(String(r.unit_price));setItemType(r.item_type||'material')};
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
 async function refreshGenerated(id:string,skipped:string[]){
   if(!supabase)throw new Error('Supabase indisponível');
   const [cr,er,mr,catalog]=await Promise.all([supabase.from('eletripro_circuits').select('id,title,data').eq('project_id',id),supabase.from('eletripro_environments').select('id,title,data').eq('project_id',id),supabase.from('eletripro_materials').select('id,source_key,description,quantity,unit,unit_price').eq('project_id',id).not('source_key','is',null),loadActiveElectricalCatalog()]);
   if(cr.error)throw cr.error;if(er.error)throw er.error;if(mr.error)throw mr.error;
   const currentRooms=(er.data||[]) as SavedEnvironment[];
   const circuits=(cr.data||[]) as SavedCircuit[];
   for(let i=0;i<circuits.length;i+=4)await Promise.all(circuits.slice(i,i+4).map(async c=>{try{await syncCircuitMaterials(id,c,undefined,settings,currentRooms,{existing:(mr.data||[]) as GeneratedMaterial[],catalog});if(!(materialRouteLength(c,currentRooms)>0))skipped.push(c.title+': metragem pendente')}catch(e){skipped.push(c.title+': '+String(e))}}));
   await syncUnifiedBudget(id);
 }
 async function consolidateAll(){
  if(!projectId||busy)return;
  setBusy(true);setStatus('Conferindo todos os circuitos...');
  try{const skipped:string[]=[];await refreshGenerated(projectId,skipped);setStatus(skipped.length?'Revisar: '+skipped.join('; '):'Materiais e orçamento sincronizados.');setRefreshCount(x=>x+1)}catch(e){setStatus('Erro na consolidação: '+String(e))}finally{setBusy(false)}
 }
 async function importBudget(){
  if(!supabase||!projectId||busy||!localBudget.length)return;
  if(!window.confirm(`Importar ${localBudget.length} itens do orçamento local para Materiais? Itens já existentes não serão substituídos e poderão ficar duplicados.`))return;
  setBusy(true);setStatus('Importando itens...');
  const materialDraft=localBudget.filter(item=>item.itemType!=='labor');
  if(!materialDraft.length){setStatus('O rascunho não possui materiais para importar.');setBusy(false);return}
  const result=await supabase.from('eletripro_materials').insert(materialDraft.map(item=>({project_id:projectId,description:item.description,quantity:item.quantity,unit:item.unit,unit_price:item.unitPrice,item_type:'material'})));
  setBusy(false);if(result.error){setStatus('Erro na importação: '+result.error.message);return}
  try{await syncUnifiedBudget(projectId)}catch(e){setStatus('Importação salva, mas orçamento não sincronizado: '+String(e))}setRefreshCount(x=>x+1);
 }
 return <section className="panel"><div className="panel-heading"><div><h2>Lista de materiais</h2><p className="hint">Materiais dos circuitos atualizados ao abrir. Metragens estimadas: 5 m de alimentação presumida + maior dimensão de cada ambiente vinculado, uma vez por ambiente. Comprimentos medidos prevalecem. Confira trajetos antes da compra; PE da iluminação não incluído nesta estimativa.</p></div><button type="button" className="outline" disabled={busy||!projectId} onClick={()=>void consolidateAll()}>Atualizar materiais</button><button type="button" className="primary" onClick={()=>{reset();setEditorOpen(true)}} disabled={busy||!projectId}><Plus size={16}/> Adicionar material</button></div>
 {status&&<p className="hint" role="status" style={status.startsWith('✓')?{color:'#22c55e'}:undefined}>{status}</p>}
 <div className="ep-record-list">{consolidateMaterialRows(rows.filter(r=>r.item_type!=='labor')).map((r,index)=>{
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

 {rows.filter(r=>r.item_type!=='labor').length===0&&<p className="hint">Nenhum material salvo neste projeto.</p>}
 <div className="ep-total-highlight"><span>Total de materiais</span><strong>{moneyBR(rows.filter(r=>r.item_type!=='labor').reduce((sum,r)=>sum+Number(r.quantity)*Number(r.unit_price),0))}</strong></div>
 {editorOpen&&<div className="ep-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)reset()}}><div className="panel sizing-form ep-editor-card" role="dialog" aria-modal={true} aria-label={editingId?'Editar material':'Cadastrar material'}><div className="ep-editor-heading"><h3>{editingId?'Editar material':'Cadastrar material'}</h3><button type="button" className="ep-close" aria-label="Fechar" onClick={reset} disabled={busy}><X size={20}/></button></div>
 <p className="hint">Cadastre somente materiais nesta aba. Para serviços e mão de obra, utilize Orçamento.</p>
 <label>Banco de Dados Elétricos<select value={catalogChoice} onChange={e=>{const value=e.target.value;setCatalogChoice(value);if(value!==''){const item=manualCatalog[Number(value)];if(item){setDescription(item.name);setUnit(item.category==='cabo'?'m':'un')}}}}><option value="">Descrição personalizada</option>{manualCatalog.map((item,i)=><option key={i} value={String(i)}>{item.name}</option>)}</select></label>
 <label>Descrição<input value={description} readOnly={catalogChoice!==''} onChange={e=>setDescription(e.target.value)}/></label>
 <div className="two"><label>Quantidade<input type="number" min="0" step="0.001" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label><label>Unidade<select value={unit} onChange={e=>setUnit(e.target.value)}><option value="un">un</option><option value="m">m</option><option value="m²">m²</option><option value="h">h</option><option value="kg">kg</option></select></label></div>
 <label>Preço unitário (R$)<input type="number" min="0" step="0.01" value={unitPrice} onChange={e=>setUnitPrice(e.target.value)}/></label>
 <button className="primary" disabled={busy||!projectId||!description.trim()} onClick={()=>void save()}>{editingId?'Atualizar material':'Salvar material'}</button> <button type="button" className="outline" onClick={reset} disabled={busy}>Fechar</button></div></div>}
 <div className="ep-export-panel" style={{marginTop:20,padding:16,border:'1px solid var(--border, #454954)',borderRadius:12}}>
 <h3>Exportar lista</h3>
 <p className="hint">Descrição, quantidade e unidade são campos fixos em todas as exportações. Escolha os grupos e se deseja mostrar valores.</p>
 <div style={{display:'flex',gap:18,flexWrap:'wrap',marginBottom:12}}>
 <label style={{display:'flex',alignItems:'center',gap:7}}><input type="checkbox" checked={exportMaterials} onChange={e=>setExportMaterials(e.target.checked)}/> Lista de materiais</label>

 <label style={{display:'flex',alignItems:'center',gap:7}}><input type="checkbox" checked={exportValues} onChange={e=>setExportValues(e.target.checked)}/> Valores</label>
 </div>
 <button type="button" className="primary" disabled={busy||(!exportMaterials&&!exportLabor)} onClick={()=>void (async()=>{
  const selected=consolidateMaterialRows(rows.filter(r=>r.item_type!=='labor'&&exportMaterials)).filter(r=>Number(r.quantity)>0).sort((a,b)=>String(a.description||'').localeCompare(String(b.description||''),'pt-BR',{sensitivity:'base',numeric:true}));
  if(!selected.length){setStatus('Não há itens das categorias selecionadas para exportar.');return;}
  setBusy(true);setStatus('Gerando PDF...');
  try{
   const headers=['Categoria','Descrição','Quantidade','Unidade',...(exportValues?['Preço unitário','Subtotal']:[])];
   const data=selected.map(r=>[r.item_type==='labor'?'Mão de obra':'Material',r.description,reportNum(r.quantity),r.unit,...(exportValues?[moneyBR(Number(r.unit_price)||0),moneyBR((Number(r.quantity)||0)*(Number(r.unit_price)||0))]:[])]);
   const total=exportValues?moneyBR(selected.reduce((a,r)=>a+(Number(r.quantity)||0)*(Number(r.unit_price)||0),0)):undefined;
   await downloadTechnicalPdf({company:professional||'EletriPro',logo,accent,client:client.name,phone:client.phone||'',email:client.email||'',sections:[{title:'Lista de materiais',headers,rows:data,kind:'materials'}],total},`EletriPro-Materiais-${client.name.replace(/[^a-zA-Z0-9À-ÿ_-]+/g,'-')}.pdf`);
   setStatus('PDF gerado com sucesso.');
  }catch(e){setStatus('Erro ao gerar PDF: '+(e instanceof Error?e.message:String(e)))}finally{setBusy(false)}
 })()}>Exportar PDF</button>
 </div>
 {localBudget.length>0&&<div style={{marginTop:16}}><button className="outline" disabled={busy||!projectId} onClick={()=>void importBudget()}>Importar materiais do rascunho local</button><p className="hint">Importação opcional. Confira duplicidades antes de importar novamente. O orçamento local não será apagado.</p></div>}
 </section>
}


// v0.7.22 — Orçamentos por projeto no Supabase. Rascunho local preservado até importação explícita.
type BudgetOrigin={key:string;quantity:number;description:string;unit:string;itemType:'material'|'labor'};
type BudgetSyncState={origins:Record<string,BudgetOrigin>;excluded:string[]};
type CloudBudget={id:string;title:string;status:string;sync_state?:BudgetSyncState|null};
type CloudBudgetItem={id:string;description:string;quantity:number;unit:string;unit_price:number;item_type:'material'|'labor'};
type BudgetEditItem=BudgetItem & {cloudId?:string;itemType:'material'|'labor'};
function BudgetsPanel({clientId,userId,client,professional,logo,accent}:{clientId:string;userId:string;localBudget:BudgetItem[];client:Client;professional:string;logo:string;accent:string}){
 const [projectId,setProjectId]=useState('');
 const [serviceTemplates,setServiceTemplates]=useState<{description:string;quantity:number;key:string}[]>([]);
 const syncState=React.useRef<BudgetSyncState>({origins:{},excluded:[]});
 const syncReady=React.useRef(false);
 const [serviceWarning,setServiceWarning]=useState('');
 const [budgets,setBudgets]=useState<CloudBudget[]>([]);
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [title,setTitle]=useState('Novo orçamento');
 const [editorOpen,setEditorOpen]=useState(false);
 
 const [items,setItems]=useState<BudgetEditItem[]>([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false);
 const [status,setStatus]=useState('');
 const [materials,setMaterials]=useState<MaterialRow[]>([]);
 const [pdfOptions,setPdfOptions]=useState({labor:true,materials:true,quantity:true,unitPrice:true,total:true,client:true});
 const [pdfBusy,setPdfBusy]=useState(false);
 const [itemEditor,setItemEditor]=useState<BudgetEditItem|null>(null);
 const [addingItem,setAddingItem]=useState(false);

 const request=React.useRef(0);
 const selectedRef=React.useRef<string|null>(null);
 useEffect(()=>{if(!selectedId)return;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!busy)newBudget()};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[selectedId,busy]);
 const dirtyRef=React.useRef(false);
 const updateDirty=(value:boolean)=>{dirtyRef.current=value;setDirty(value)};
 const setSelection=(id:string|null)=>{selectedRef.current=id;setSelectedId(id)};
 const uuid=()=>typeof crypto!=='undefined'&&'randomUUID'in crypto?crypto.randomUUID():`tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
 const confirmDiscard=()=>!dirtyRef.current||window.confirm('Existem alterações não salvas. Deseja descartá-las?');
 const setRowsDirty=(fn:(old:BudgetEditItem[])=>BudgetEditItem[])=>{setItems(fn);updateDirty(true)};
 const sortBudgetRows=(rows:BudgetEditItem[])=>[...rows].sort((a,b)=>a.description.localeCompare(b.description,'pt-BR',{sensitivity:'base',numeric:true}));
 const sourceRows=()=>[...consolidateMaterialRows(materials).map(x=>({key:'material:'+JSON.stringify([x.description.trim().toLocaleLowerCase('pt-BR'),x.unit,Number(x.unit_price)]),description:x.description,quantity:Number(x.quantity),unit:x.unit,unitPrice:Number(x.unit_price),itemType:'material' as const})),...serviceTemplates.map(x=>({...x,unit:'un',unitPrice:0,itemType:'labor' as const}))];
 function reconcile(rows:BudgetEditItem[]){
  const state=syncState.current;const desired=sourceRows();const used=new Set<string>();const next=[...rows];
  for(const src of desired){
   if(state.excluded.includes(src.key))continue;
   let index=next.findIndex(x=>state.origins[x.id]?.key===src.key);
   if(index<0)index=next.findIndex(x=>!used.has(x.id)&&!state.origins[x.id]&&x.itemType===src.itemType&&x.description.trim().toLocaleLowerCase('pt-BR')===src.description.trim().toLocaleLowerCase('pt-BR')&&x.unit===src.unit);
   if(index<0){const id=uuid();next.push({id,description:src.description,quantity:src.quantity,unit:src.unit,unitPrice:src.unitPrice,itemType:src.itemType});index=next.length-1;}
   const item=next[index],prev=state.origins[item.id];used.add(item.id);
   if(prev){next[index]={...item,description:item.description===prev.description?src.description:item.description,quantity:item.quantity===prev.quantity?src.quantity:item.quantity,unit:item.unit===prev.unit?src.unit:item.unit};}
   state.origins[item.id]={key:src.key,description:src.description,quantity:src.quantity,unit:src.unit,itemType:src.itemType};
  }
  return next.filter(x=>{const prev=state.origins[x.id];if(!prev||used.has(x.id))return true;if(x.description!==prev.description||x.quantity!==prev.quantity||x.unit!==prev.unit||x.unitPrice!==0){delete state.origins[x.id];return true;}delete state.origins[x.id];return false;});
 }
 const loadItems=async(id:string,req:number)=>{
  if(!supabase)return;
  const result=await supabase.from('eletripro_budget_items').select('id,description,quantity,unit,unit_price,item_type').eq('budget_id',id).order('created_at',{ascending:true});
  if(req!==request.current)return;
  if(result.error){setStatus('Erro ao carregar itens: '+result.error.message);return}
  const raw=(result.data||[]) as CloudBudgetItem[];
  const row=budgets.find(x=>x.id===id);
  const grouped=row?.sync_state?raw:[...consolidateMaterialRows(raw.filter(x=>x.item_type!=='labor') as MaterialRow[]),...raw.filter(x=>x.item_type==='labor')];
  const loaded:BudgetEditItem[]=grouped.map(x=>({id:x.id,cloudId:x.id,description:x.description,quantity:Number(x.quantity),unit:x.unit,unitPrice:Number(x.unit_price),itemType:x.item_type||'material'}));
  syncState.current=row?.sync_state?JSON.parse(JSON.stringify(row.sync_state)):{origins:{},excluded:[]};
  const before=JSON.stringify(loaded);
  const next=row?.status==='rascunho'&&syncReady.current?reconcile(loaded):loaded;
  setItems(sortBudgetRows(next));
  updateDirty(JSON.stringify(next)!==before||grouped.length!==raw.length);

 };
 useEffect(()=>{
  const req=++request.current;
  setEditorOpen(false);setProjectId('');setBudgets([]);setSelection(null);setTitle('Novo orçamento');setItems([]);updateDirty(false);setLoading(true);setStatus('Carregando orçamentos...');
  void (async()=>{try{
   if(!supabase)throw new Error('Supabase indisponível');
   const id=await ensureEletriProject(clientId,userId);
   const [br,mr,er,cr]=await Promise.all([
    supabase.from('eletripro_budgets').select('id,title,status,sync_state').eq('project_id',id).order('created_at',{ascending:true}),
    supabase.from('eletripro_materials').select('id,description,quantity,unit,unit_price,item_type').eq('project_id',id).order('created_at',{ascending:true}),
    supabase.from('eletripro_environments').select('id,title,data').eq('project_id',id),
    supabase.from('eletripro_circuits').select('id,title,data').eq('project_id',id)
   ]);
   if(req!==request.current)return;
   if(br.error)throw br.error;
   const rooms=(er.data||[]) as SavedEnvironment[];
   const counts=rooms.map(r=>estimateRoom(r)?.outlets);
   const circuits=(cr.data||[]) as SavedCircuit[];
   syncReady.current=!er.error&&!cr.error&&!mr.error;
   setServiceWarning(er.error||cr.error?'Não foi possível consultar todas as cargas. Confira os serviços manualmente.':counts.some(n=>n==null)?'Há ambientes sem quantidade de tomadas definida. Confira a previsão.':'');
   setServiceTemplates([
    {key:'labor:outlets',description:'Instalação de tomadas',quantity:counts.reduce<number>((sum,n)=>sum+(n??0),0)},
    ...circuits.filter(c=>c.data.circuit==='tue').map(c=>({key:'labor:circuit:'+c.id,description:'Instalação de circuito — '+c.title,quantity:1})),
    ...['spot','luminária','lustre','plafon','pendente','arandela','interruptor'].map(name=>({key:'labor:fixture:'+name,description:'Instalação de '+name,quantity:0}))
   ]);
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
  const req=++request.current;setItemEditor(null);setEditorOpen(true);setLoading(true);setSelection(row.id);setTitle(row.title);setItems([]);updateDirty(false);setStatus('Carregando itens...');
  await loadItems(row.id,req);
  if(req===request.current)setLoading(false);
 }
 function closeBudget(){if(busy||loading||!confirmDiscard())return;setItemEditor(null);setEditorOpen(false);setItems([]);setSelection(null);setTitle('Novo orçamento');updateDirty(false)}
 function newBudget(){
  if(busy||loading||!confirmDiscard())return;
  syncState.current={origins:{},excluded:[]};
  setItemEditor(null);setEditorOpen(true);setSelection(null);setTitle('Novo orçamento');setItems(sortBudgetRows(reconcile([])));updateDirty(true);setStatus('Novo orçamento. Preencha os dados e clique em Salvar orçamento.');
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
   const existing=await supabase.from('eletripro_budget_items').select('id').eq('budget_id',budgetId);
   if(existing.error)throw existing.error;
   const state=syncState.current;
   const keepIds=new Set(items.map(x=>x.id));
   const excluded=[...new Set([...state.excluded,...Object.entries(state.origins).filter(([id])=>!keepIds.has(id)).map(([,o])=>o.key)])];
   const origins:Record<string,BudgetOrigin>={};
   const persisted=items.map(item=>{const id=item.cloudId||crypto.randomUUID();if(state.origins[item.id])origins[id]=state.origins[item.id];return {...item,id,cloudId:id};});
   const payload=persisted.map(item=>({id:item.id,budget_id:budgetId,description:item.description.trim(),quantity:item.quantity,unit:item.unit,unit_price:item.unitPrice,item_type:item.itemType}));
   if(payload.length){const r=await supabase.from('eletripro_budget_items').upsert(payload,{onConflict:'id'});if(r.error)throw r.error;}
   const keep=new Set(persisted.map(x=>x.id));const removed=(existing.data||[]).filter(x=>!keep.has(x.id)).map(x=>x.id);
   if(removed.length){const r=await supabase.from('eletripro_budget_items').delete().eq('budget_id',budgetId).in('id',removed);if(r.error)throw r.error;}
   const metadata={origins,excluded};
   const meta=await supabase.from('eletripro_budgets').update({sync_state:metadata}).eq('id',budgetId).eq('project_id',projectId);if(meta.error)throw meta.error;
   syncState.current=metadata;setItems(sortBudgetRows(persisted));setBudgets(old=>old.map(x=>x.id===budgetId?{...x,title:title.trim(),sync_state:metadata}:x));
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
 const materialTotal=items.filter(x=>x.itemType!=='labor').reduce((sum,x)=>sum+x.quantity*x.unitPrice,0);
 const laborTotal=items.filter(x=>x.itemType==='labor').reduce((sum,x)=>sum+x.quantity*x.unitPrice,0);
 const total=materialTotal+laborTotal;
 async function exportBudgetPdf(){
  if(pdfBusy||loading||busy)return;
  if(!items.length){setStatus('Inclua itens antes de gerar o PDF.');return}
  const included=items.filter(x=>x.quantity>0&&(x.itemType==='labor'?pdfOptions.labor:pdfOptions.materials)).sort((a,b)=>a.description.localeCompare(b.description,'pt-BR',{numeric:true,sensitivity:'base'}));
  if(!included.length){setStatus('Selecione ao menos uma categoria com itens para o PDF.');return}
  const headers=['Descrição',...(pdfOptions.quantity?['Quantidade','Unidade']:[]),...(pdfOptions.unitPrice?['Valor unitário']:[]),...(pdfOptions.total?['Subtotal']:[])];
  const rows=included.map(x=>[x.description,...(pdfOptions.quantity?[x.quantity.toLocaleString('pt-BR',{maximumFractionDigits:3}),x.unit]:[]),...(pdfOptions.unitPrice?[moneyBR(x.unitPrice)]:[]),...(pdfOptions.total?[moneyBR(x.quantity*x.unitPrice)]:[])]);
  setPdfBusy(true);
  try{
   await downloadTechnicalPdf({title:'Orçamento de serviços',company:professional||'EletriPro',logo,accent,client:pdfOptions.client?client.name:'Não informado',phone:pdfOptions.client?client.phone||undefined:undefined,email:pdfOptions.client?client.email||undefined:undefined,sections:(['material','labor'] as const).filter(kind=>included.some(x=>x.itemType===kind)).map(kind=>({title:(kind==='labor'?'Mão de obra':'Lista de materiais')+' — '+title,headers,rows:rows.filter((_,i)=>included[i].itemType===kind)})),total:pdfOptions.total?moneyBR(included.reduce((sum,x)=>sum+x.quantity*x.unitPrice,0)):undefined},'EletriPro-Orcamento-'+title.replace(/[^a-zA-Z0-9À-ÿ_-]/g,'-').slice(0,45)+'.pdf');
   setStatus('PDF do orçamento gerado.');
  }catch(e){setStatus('Erro ao gerar PDF: '+(e instanceof Error?e.message:String(e)))}finally{setPdfBusy(false)}
 }
 return <div style={{display:'grid',gap:16}}>
 <section className="panel"><div className="panel-heading"><div><h2>Orçamentos e mão de obra</h2></div><button className="outline" type="button" disabled={busy||loading} onClick={newBudget}><Plus size={16}/> Novo orçamento</button></div>
 {loading?<p className="hint">Carregando...</p>:budgets.length===0?<p className="hint">Nenhum orçamento salvo neste projeto.</p>:<div className="ep-record-list">{budgets.map((b,index)=><button key={b.id} type="button" disabled={busy} className="ep-record" onClick={()=>void selectBudget(b)}><span className="ep-record-number">{String(index+1).padStart(2,'0')}</span><span className="ep-record-name">{b.title}</span><span aria-hidden="true">›</span></button>)}</div>}
 {status&&/erro|falha/i.test(status)&&<p className="hint" role="alert">{status}</p>}
 </section>

 {editorOpen&&<div className="ep-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)closeBudget()}}><section className="panel ep-editor-card" role="dialog" aria-modal={true} aria-label={selectedId?'Editar orçamento':'Novo orçamento'}><div className="ep-editor-heading"><h2>{selectedId?'Editar orçamento':'Novo orçamento'}</h2>{<button type="button" className="ep-close" aria-label="Fechar" disabled={busy||loading} onClick={closeBudget}><X size={20}/></button>}</div>
 <div className="ep-budget-glance" aria-label="Conferência rápida dos valores"><div><span>Materiais</span><strong>{moneyBR(materialTotal)}</strong></div><div><span>Mão de obra</span><strong>{moneyBR(laborTotal)}</strong></div><div className="ep-budget-glance-total"><span>Total previsto</span><strong>{moneyBR(total)}</strong></div></div>{dirty&&<p className="hint" role="status">Alterações não salvas: confira os itens e salve antes de considerar este total definitivo.</p>}
 <div className="ep-edit-body">
 <label>Nome do orçamento<input maxLength={160} value={title} disabled={busy||loading} onChange={e=>{setTitle(e.target.value);updateDirty(true)}}/></label>
 <div className="panel-heading"><h3>Lista de itens</h3><button className="primary" type="button" disabled={busy||loading} onClick={()=>{setAddingItem(true);setItemEditor({id:uuid(),description:'',quantity:1,unit:'un',unitPrice:0,itemType:'labor'})}}><Plus size={16}/> Adicionar item</button></div>
 <p className="hint">Alterações nesta lista não modificam o dimensionamento nem a lista de materiais do projeto.</p>
 {serviceWarning&&<p className="hint">{serviceWarning}</p>}
 <div className="ep-record-list">{sortBudgetRows(items).map((x,index)=><div className="ep-material-record" key={x.id}><span className="ep-record-number">{String(index+1).padStart(2,'0')}</span><div className="ep-material-info"><strong>{x.description}</strong><span>{x.itemType==='labor'?'Mão de obra':'Material'} · {reportNum(x.quantity)} {x.unit}{x.quantity>0&&<> × {moneyBR(x.unitPrice)} · <b>{moneyBR(x.quantity*x.unitPrice)}</b></>}</span></div><div className="ep-material-actions"><button className="outline" disabled={busy||loading} onClick={()=>{setAddingItem(false);setItemEditor({...x})}}>Editar</button><button className="outline" disabled={busy||loading} onClick={()=>{if(window.confirm('Excluir '+x.description+' da lista?')){const origin=syncState.current.origins[x.id];if(origin)syncState.current.excluded=[...new Set([...syncState.current.excluded,origin.key])];setRowsDirty(old=>old.filter(y=>y.id!==x.id))}}}>Excluir</button></div></div>)}</div>
 {!items.length&&<p className="hint">Nenhum item na lista.</p>}
 {itemEditor&&<div className="panel sizing-form" style={{marginTop:12}}><div className="ep-editor-heading"><h3>{addingItem?'Adicionar item':'Editar item'}</h3><button className="outline" onClick={()=>setItemEditor(null)}>Fechar</button></div>
 <label>Descrição<input value={itemEditor.description} readOnly={!addingItem} onChange={e=>setItemEditor(old=>old?{...old,description:e.target.value}:old)}/></label>
 {addingItem&&<div className="two"><label>Tipo<select value={itemEditor.itemType} onChange={e=>setItemEditor(old=>old?{...old,itemType:e.target.value as 'material'|'labor'}:old)}><option value="labor">Mão de obra</option><option value="material">Material</option></select></label><label>Unidade<select value={itemEditor.unit} onChange={e=>setItemEditor(old=>old?{...old,unit:e.target.value}:old)}>{['un','m','m²','h','kg'].map(u=><option key={u}>{u}</option>)}</select></label></div>}
 <label>Quantidade</label><div style={{display:'flex',alignItems:'center',gap:8}}><button className="outline" disabled={itemEditor.quantity<=0} onClick={()=>setItemEditor(old=>old?{...old,quantity:Math.max(0,old.quantity-1)}:old)}>−</button>{itemEditor.itemType==='material'?<input type="number" min="0" step="0.001" value={itemEditor.quantity} onChange={e=>setItemEditor(old=>old?{...old,quantity:Math.max(0,Number(e.target.value))}:old)}/>:<strong>{itemEditor.quantity}</strong>}<button className="primary" onClick={()=>setItemEditor(old=>old?{...old,quantity:old.quantity+1}:old)}>+</button></div>
 {itemEditor.quantity>0&&<label>Valor unitário (R$)<input type="number" min="0" step="0.01" value={itemEditor.unitPrice} onChange={e=>setItemEditor(old=>old?{...old,unitPrice:Number(e.target.value)}:old)}/></label>}
 <strong>Total: {moneyBR(itemEditor.quantity*itemEditor.unitPrice)}</strong><button className="primary" disabled={!itemEditor.description.trim()||!Number.isFinite(itemEditor.quantity)||itemEditor.quantity<0||!Number.isFinite(itemEditor.unitPrice)||itemEditor.unitPrice<0} onClick={()=>{const item={...itemEditor,description:itemEditor.description.trim()};setRowsDirty(old=>sortBudgetRows(addingItem?[...old,item]:old.map(x=>x.id===item.id?item:x)));setItemEditor(null)}}>Confirmar item</button></div>}
 <div className="ep-total-highlight"><span>Total do orçamento</span><strong>{moneyBR(total)}</strong></div>
    <fieldset className="ep-budget-pdf-options"><legend>Personalizar PDF deste orçamento</legend>
 <div className="ep-budget-pdf-grid">{([['labor','Mão de obra / serviços'],['materials','Materiais'],['quantity','Quantidades e unidades'],['unitPrice','Valores unitários'],['total','Subtotais e total'],['client','Dados do cliente']] as const).map(([key,label])=><label key={key}><input type="checkbox" checked={pdfOptions[key]} onChange={e=>setPdfOptions(old=>({...old,[key]:e.target.checked}))}/>{label}</label>)}</div>
 <button type="button" className="outline" disabled={pdfBusy||busy||loading||!!itemEditor} onClick={()=>void exportBudgetPdf()}>{pdfBusy?'Gerando PDF...':'Gerar PDF do orçamento'}</button>
 </fieldset>
 <p className="hint" role="status">{status}</p>
 <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:16}}><button className="primary" disabled={busy||loading||!projectId||!title.trim()||!!itemEditor} onClick={()=>void save()}>{busy?'Salvando...':'Salvar orçamento'}</button>{selectedId&&<button className="outline" disabled={busy||loading} onClick={()=>void removeBudget()}>Excluir orçamento</button>}<button className="outline" disabled={busy||loading} onClick={closeBudget}>Fechar</button></div>
 </div></section></div>} </div>;
}


// Manutenção: registros separados dos parâmetros de projeto novo, armazenados no JSON do projeto.
type MaintenanceStatus='not_started'|'scheduled'|'in_progress'|'waiting'|'completed'|'cancelled';
type MaintenanceCircuit={id:string;name:string;phase:string;power:string;breaker:string;section:string;condition:string;notes:string;length?:string;newLoad?:boolean;newPower?:string;changeBreaker?:boolean;changeCables?:boolean;proposedBreaker?:string;proposedSection?:string;conductorCount?:string;materialUnitPrice?:string;breakerUnitPrice?:string;laborDescription?:string;laborPrice?:string;circuitVoltage?:string;referenceMethod?:string;loadedConductors?:string;ambientTemp?:string;groupedCircuits?:string;powerFactor?:string;phaseConductors?:string;neutralConductors?:string;earthConductors?:string;}
type MaintenanceCount={type:string;quantity:number;unitPrice?:number;powerVA?:number;lengthM?:number;voltageV?:number;coolingBTU?:number;consumptionW?:number;powerFactor?:number};
type MaintenanceData={outlets?:MaintenanceCount[];lightingFixtures?:MaintenanceCount[];dedicatedCircuits?:MaintenanceCount[];status:MaintenanceStatus;visitDate:string;existingSupply:string;existingVoltage:string;circuitConnection?:string;existingMainBreaker:string;existingFeederSection:string;existingDR:string;existingDPS:string;grounding:string;observations:string;missingGrounding?:boolean;extraServices?:string;generalLaborDescription?:string;generalLaborPrice?:string;circuits:MaintenanceCircuit[];updatedAt?:string};
const maintenanceStatusLabels:Record<MaintenanceStatus,string>={not_started:'Não iniciada',scheduled:'Agendada',in_progress:'Em andamento',waiting:'Aguardando materiais',completed:'Concluída',cancelled:'Cancelada'};
const maintenanceDefaults:MaintenanceData={outlets:[],lightingFixtures:[],dedicatedCircuits:[],status:'not_started',visitDate:'',existingSupply:'',existingVoltage:'',circuitConnection:'',existingMainBreaker:'',existingFeederSection:'',existingDR:'',existingDPS:'',grounding:'',observations:'',missingGrounding:false,extraServices:'',generalLaborDescription:'',generalLaborPrice:'',circuits:[]};
const validMaintenanceStatuses=Object.keys(maintenanceStatusLabels) as MaintenanceStatus[];
const safeMaintenance=(raw:unknown):MaintenanceData=>{const x=(raw&&typeof raw==='object'?raw:{}) as Partial<MaintenanceData>;return {...maintenanceDefaults,...x,status:validMaintenanceStatuses.includes(x.status as MaintenanceStatus)?x.status!:'not_started',circuits:Array.isArray(x.circuits)?x.circuits:[],outlets:Array.isArray(x.outlets)?x.outlets:[],lightingFixtures:Array.isArray(x.lightingFixtures)?x.lightingFixtures:[],dedicatedCircuits:Array.isArray(x.dedicatedCircuits)?x.dedicatedCircuits:[]}};
// Pré-dimensionamento condicionado aos parâmetros informados e às tabelas já implementadas.
const maintenanceBreakerRatings=[6,10,16,20,25,32,40,50,63,80,100,125];
function maintenanceCircuitSizing(c:MaintenanceCircuit,existingVoltage:string){
 const power=Number(c.newPower),voltage=Number(c.circuitVoltage||existingVoltage),pf=Number(c.powerFactor||1);
 const method=c.referenceMethod||'B1',loaded=c.loadedConductors||'2';
 const temp=String(c.ambientTemp||'30'),group=String(c.groupedCircuits||'1');
 const ft=temperature5410['PVC 70 °C']?.[temp],fg=grouping5410.bundle?.[group];
 if(!c.newLoad||!(power>0)||!(voltage>0)||!(pf>0&&pf<=1)||!ft||!fg||!['B1','B2','C'].includes(method)||!['2','3'].includes(loaded))return null;
 const ib=power/voltage; // potência aparente em VA; fator de potência não deve ser aplicado novamente
 const table=ampacity5410['PVC 70 °C']?.copper?.[method]?.[loaded]||{};
 const length=Number(c.length),dropLimit=4;
 const choices=Object.entries(table).map(([section,base])=>({section:Number(section),iz:base*ft*fg})).filter(x=>x.section>=1.5).sort((a,b)=>a.section-b.section);
 const valid=choices.map(x=>{
  const breaker=maintenanceBreakerRatings.find(n=>n>=ib-1e-9&&n<=x.iz+1e-9);
  // Estimativa resistiva, cobre 0,0225 ohm.mm²/m a quente, ida e volta monofásica.
  const drop=length>0?100*(2*length*ib*0.0225/x.section)/voltage:null;
  return {...x,breaker,drop,valid:breaker!==undefined&&(drop===null||drop<=dropLimit)};
 }).find(x=>x.valid);
 return {ib,voltage,method,loaded,ft,fg,choice:valid||null,dropPending:!(length>0),dropLimit};
}
const maintenanceDateBR=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)?`${v.slice(8,10)}/${v.slice(5,7)}/${v.slice(0,4)}`:(v||'Não informada');
function MaintenanceChoices({title,value,options,onChange}:{title:string;value:string;options:{value:string;label:string}[];onChange:(value:string)=>void}){
 return <div className="maintenance-field"><strong>{title}</strong><div className="maintenance-choices" role="group" aria-label={title}>{options.map(o=><button type="button" key={o.value} className={'maintenance-choice'+(value===o.value?' selected':'')} aria-pressed={value===o.value} onClick={()=>onChange(value===o.value?'':o.value)}>{o.label}</button>)}</div></div>;
}
const maintenanceOptions=(values:string[])=>values.map(value=>({value,label:value}));
function MaintenancePanel({client,userId,onReport}:{client:Client;userId:string;onReport:()=>void}){
 const [data,setData]=useState<MaintenanceData>(maintenanceDefaults),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{let live=true;setLoading(true);void(async()=>{const r=await supabase.from('eletripro_projects').select('installation').eq('client_id',client.id).eq('owner_id',userId).maybeSingle();if(live){setData(safeMaintenance(r.data?.installation?.maintenance));setMessage(r.error?'Erro ao carregar: '+r.error.message:'');setLoading(false)}})();return()=>{live=false}},[client.id,userId]);
 const update=(key:keyof MaintenanceData,value:string|boolean)=>setData(d=>({...d,[key]:value}));
 const changeCount=(key:'outlets'|'lightingFixtures'|'dedicatedCircuits',type:string,delta:number)=>setData(d=>{const current=d[key]||[];const old=current.find(x=>x.type===type);const quantity=Math.max(0,Math.min(9999,(old?.quantity||0)+delta));return {...d,[key]:[...current.filter(x=>x.type!==type),{...old,type,quantity,unitPrice:old?.unitPrice||0}]};});
 const changeUnitPrice=(key:'outlets'|'lightingFixtures'|'dedicatedCircuits',type:string,raw:string)=>setData(d=>{const current=d[key]||[];const old=current.find(x=>x.type===type);const parsed=Number(raw);const unitPrice=Number.isFinite(parsed)?Math.min(9999999,Math.max(0,parsed)):0;return {...d,[key]:[...current.filter(x=>x.type!==type),{...old,type,quantity:old?.quantity||0,unitPrice}]};});
 const changeDedicatedField=(type:string,key:'powerVA'|'lengthM'|'voltageV'|'coolingBTU'|'consumptionW'|'powerFactor',raw:string)=>setData(d=>{const old=(d.dedicatedCircuits||[]).find(x=>x.type===type);const value=raw===''?undefined:Number(raw);return {...d,dedicatedCircuits:[...(d.dedicatedCircuits||[]).filter(x=>x.type!==type),{...old,type,quantity:old?.quantity||0,unitPrice:old?.unitPrice||0,[key]:value===undefined?undefined:Number.isFinite(value)?Math.max(0,value):undefined}]};});
 const acEstimatedWatts=(item:MaintenanceCount)=>item.consumptionW&&item.consumptionW>0?item.consumptionW:(item.coolingBTU&&item.coolingBTU>0?item.coolingBTU*0.10:undefined);
 const acApparentPower=(item:MaintenanceCount)=>item.type==='Ar-condicionado'?(acEstimatedWatts(item)?acEstimatedWatts(item)!/(item.powerFactor&&item.powerFactor>0&&item.powerFactor<=1?item.powerFactor:0.9):undefined):item.powerVA;
 const dedicatedSizing=(item:MaintenanceCount)=>{if(!data.circuitConnection||!(item.quantity>0)||!(acApparentPower(item)&&acApparentPower(item)!>0))return null;const voltage=Number(data.existingVoltage);if(!(voltage>0))return null;return maintenanceCircuitSizing({id:'',name:item.type,phase:'',power:'',breaker:'',section:'',condition:'',notes:'',newLoad:true,newPower:String(item.quantity*acApparentPower(item)!),circuitVoltage:String(voltage),length:item.lengthM?String(item.lengthM):'',referenceMethod:'B1',loadedConductors:'2',ambientTemp:'30',groupedCircuits:'1'},String(voltage));};
 const moneyBR=(value:number)=>value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 const renderCounts=(title:string,key:'outlets'|'lightingFixtures'|'dedicatedCircuits',types:string[])=><div className="maintenance-field"><h3>{title}</h3><div className="maintenance-price-scroll"><table className="maintenance-price-table"><thead><tr><th>Item</th><th>Quantidade</th><th>Preço unitário (R$)</th><th>Total</th></tr></thead><tbody>{types.map(type=>{const item=(data[key]||[]).find(x=>x.type===type);const quantity=item?.quantity||0;const price=item?.unitPrice||0;return <tr key={type}><td>{type}</td><td><div className="maintenance-counter-actions"><button type="button" aria-label={'Diminuir '+type} disabled={!quantity} onClick={()=>changeCount(key,type,-1)}>−</button><output aria-label={'Quantidade de '+type}>{quantity}</output><button type="button" aria-label={'Aumentar '+type} onClick={()=>changeCount(key,type,1)}>+</button></div></td><td><input aria-label={'Preço unitário de '+type} type="number" min="0" max="9999999" step="0.01" value={item?.unitPrice??0} onChange={e=>changeUnitPrice(key,type,e.target.value)}/></td><td>{moneyBR(quantity*price)}</td></tr>})}</tbody><tfoot><tr><th colSpan={3}>Subtotal</th><th>{moneyBR((data[key]||[]).reduce((sum,item)=>sum+(item.quantity||0)*(item.unitPrice||0),0))}</th></tr></tfoot></table></div></div>;
 const renderDedicated=()=> <div className="maintenance-field"><h3>Circuitos específicos — equipamentos</h3><p className="hint">Informe potência aparente (VA) e comprimento. Para ar-condicionado, informe a capacidade em BTU/h: o sistema estima o consumo em W como 10% do valor numérico de BTU/h e adota FP 0,90. Se houver consumo real na etiqueta ou manual, informe-o para substituir a estimativa. BTU/h é capacidade térmica, não potência elétrica. A tensão e a ligação serão as selecionadas em Tensão do circuito, acima. Estimativa preliminar para circuito individual por tipo, considerando a quantidade total informada, cobre/PVC 70 °C, método B1, 2 condutores carregados, 30 °C e sem agrupamento. Confirme as condições reais no levantamento de circuitos; a sugestão não é aprovação técnica.</p><div className="maintenance-price-scroll"><table className="maintenance-price-table"><thead><tr><th>Equipamento</th><th>Quantidade</th><th>Potência / consumo do equipamento</th><th>Comprimento (m)</th><th>Disjuntor / cabo sugeridos</th><th>Preço unitário (R$)</th><th>Total</th></tr></thead><tbody>{['Chuveiro','Ar-condicionado','Torneira elétrica','Fogão de indução','Outros'].map(type=>{const item=(data.dedicatedCircuits||[]).find(x=>x.type===type)||{type,quantity:0,unitPrice:0};const result=dedicatedSizing(item);return <tr key={type}><td>{type}</td><td><div className="maintenance-counter-actions"><button type="button" disabled={!item.quantity} onClick={()=>changeCount('dedicatedCircuits',type,-1)}>−</button><output>{item.quantity}</output><button type="button" onClick={()=>changeCount('dedicatedCircuits',type,1)}>+</button></div></td><td>{type==='Ar-condicionado'?<div style={{display:'grid',gap:6,minWidth:150}}><label>Capacidade (BTU/h)<input aria-label="Capacidade do ar-condicionado em BTU/h" type="number" min="0" step="100" placeholder="Ex.: 12000" value={item.coolingBTU??''} onChange={e=>changeDedicatedField(type,'coolingBTU',e.target.value)}/></label><label>Consumo real (W) — opcional<input aria-label="Consumo elétrico do ar-condicionado em watts" type="number" min="0" step="1" placeholder="Opcional: etiqueta / manual" value={item.consumptionW??''} onChange={e=>changeDedicatedField(type,'consumptionW',e.target.value)}/></label><label>Fator de potência<input aria-label="Fator de potência do ar-condicionado" type="number" min="0.01" max="1" step="0.01" placeholder="0,90 (estimado)" value={item.powerFactor??''} onChange={e=>changeDedicatedField(type,'powerFactor',e.target.value)}/></label><small>Consumo utilizado: {acEstimatedWatts(item)?`${acEstimatedWatts(item)!.toFixed(0)} W ${item.consumptionW&&item.consumptionW>0?'(informado)':'(estimado: BTU/h × 0,10)'}`:'informe BTU/h ou consumo real'}. Potência aparente: {acApparentPower(item)?`${acApparentPower(item)!.toFixed(0)} VA`:'—'}. FP padrão 0,90 (estimado). Confirme a corrente de placa antes do dimensionamento definitivo.</small></div>:<input aria-label={'Potência de '+type} type="number" min="0" step="1" placeholder="VA" value={item.powerVA??''} onChange={e=>changeDedicatedField(type,'powerVA',e.target.value)}/>}</td><td><input aria-label={'Comprimento de '+type} type="number" min="0" step="0.1" placeholder="m" value={item.lengthM??''} onChange={e=>changeDedicatedField(type,'lengthM',e.target.value)}/></td><td>{!result?'Preencha quantidade, potência e tensão':!result.choice?'Revisão técnica necessária':<><strong>{result.choice.breaker} A / {result.choice.section} mm²</strong><small style={{display:'block'}}>{result.dropPending?'Queda de tensão pendente — informar comprimento':`Ib ${result.ib.toFixed(1)} A; queda estimada ${result.choice.drop?.toFixed(2)}%`}</small></>}</td><td><input aria-label={'Preço unitário de '+type} type="number" min="0" step="0.01" value={item.unitPrice??0} onChange={e=>changeUnitPrice('dedicatedCircuits',type,e.target.value)}/></td><td>{moneyBR(item.quantity*(item.unitPrice||0))}</td></tr>})}</tbody><tfoot><tr><th colSpan={6}>Subtotal</th><th>{moneyBR((data.dedicatedCircuits||[]).reduce((sum,x)=>sum+x.quantity*(x.unitPrice||0),0))}</th></tr></tfoot></table></div></div>;
 const [draft,setDraft]=useState<MaintenanceCircuit|null>(null);
 const editCircuit=(c:MaintenanceCircuit)=>setDraft({...c});
 const updateDraft=(key:keyof MaintenanceCircuit,value:string|boolean)=>setDraft(d=>d?{...d,[key]:value}:d);
 const commitDraft=()=>{if(!draft||!draft.name.trim())return;setData(d=>({...d,circuits:d.circuits.some(c=>c.id===draft.id)?d.circuits.map(c=>c.id===draft.id?draft:c):[...d.circuits,draft]}));setDraft(null);setMessage('Circuito atualizado na lista. Clique em Salvar manutenção para persistir no Supabase.');};
 const draftSizing=draft?maintenanceCircuitSizing(draft,data.existingVoltage):null;
 const save=async()=>{if(saving)return;setSaving(true);setMessage('');try{const r=await supabase.from('eletripro_projects').select('id,installation').eq('client_id',client.id).eq('owner_id',userId).maybeSingle();if(r.error)throw r.error;const maintenance={...data,updatedAt:new Date().toISOString()};const installation={...(r.data?.installation||{}),maintenance};const saved=r.data?.id?await supabase.from('eletripro_projects').update({installation,updated_at:new Date().toISOString()}).eq('id',r.data.id).eq('owner_id',userId):await supabase.from('eletripro_projects').insert({client_id:client.id,owner_id:userId,installation});if(saved.error)throw saved.error;setData(maintenance);setMessage('Manutenção salva no Supabase.')}catch(e:any){setMessage('Erro ao salvar: '+(e?.message||'Falha desconhecida'))}finally{setSaving(false)}};
 return <section className="panel sizing-form"><h2>Manutenção — instalação existente</h2><p className="hint">Registre as condições encontradas em campo. A proposta de adequação é incluída apenas no PDF, conforme as seções selecionadas. O cadastro não altera os circuitos do projeto novo.</p><nav className="ep-maint-nav" aria-label="Ir para etapa da manutenção">{[['ep-m-visit','Visita e rede'],['ep-m-items','Pontos e equipamentos'],['ep-m-circuits','Circuitos'],['ep-m-save','Salvar e relatório']].map(([id,label],index)=><button key={id} type="button" className="outline" onClick={()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'})}><span>{index+1}</span>{label}</button>)}</nav>{loading?<p>Carregando manutenção...</p>:<>
 <div id="ep-m-visit" className="ep-maint-anchor" aria-hidden="true"/><MaintenanceChoices title="Status da manutenção" value={data.status} options={validMaintenanceStatuses.map(value=>({value,label:maintenanceStatusLabels[value]}))} onChange={value=>update('status',value||'not_started')}/>
 <label>Data da visita<input type="date" value={data.visitDate} onChange={e=>update('visitDate',e.target.value)}/></label>
 <MaintenanceChoices title="Tipo da rede" value={data.existingSupply} options={[{value:'single',label:'Monofásico'},{value:'two',label:'Bifásico'},{value:'three',label:'Trifásico'}]} onChange={value=>update('existingSupply',value)}/>
 <MaintenanceChoices title="Tensão do circuito (V)" value={data.existingVoltage} options={maintenanceOptions(['127','220','380','440'])} onChange={value=>setData(d=>({...d,existingVoltage:value,circuitConnection:''}))}/>
 {data.existingVoltage&&<><MaintenanceChoices title="Ligação do circuito" value={data.circuitConnection||''} options={[{value:'F+N+T',label:'F+N+T'},{value:'F+F+T',label:'F+F+T'}]} onChange={value=>update('circuitConnection',value)}/><p className="hint">Selecione a ligação efetivamente disponível no local. F = fase, N = neutro, T = terra (PE). Confirme compatibilidade com a tensão e a rede. Não utilize F+F+T em circuito de 127 V sem verificação técnica.</p></>}

 <MaintenanceChoices title="Disjuntor geral existente (A)" value={['50','63'].includes(data.existingMainBreaker)?data.existingMainBreaker:data.existingMainBreaker?'other':''} options={[{value:'50',label:'50 A'},{value:'63',label:'63 A'},{value:'other',label:'Outro'}]} onChange={value=>update('existingMainBreaker',value==='other'?'other':value)}/>{!['','50','63'].includes(data.existingMainBreaker)&&<label>Outro disjuntor geral (A)<input type="number" min="1" value={data.existingMainBreaker==='other'?'':data.existingMainBreaker} onChange={e=>update('existingMainBreaker',e.target.value||'other')}/></label>}
 <MaintenanceChoices title="Seção do alimentador existente (mm²)" value={['10','16'].includes(data.existingFeederSection)?data.existingFeederSection:data.existingFeederSection?'other':''} options={[{value:'10',label:'10 mm²'},{value:'16',label:'16 mm²'},{value:'other',label:'Outro'}]} onChange={value=>update('existingFeederSection',value==='other'?'other':value)}/>{!['','10','16'].includes(data.existingFeederSection)&&<label>Outra seção do alimentador (mm²)<input type="number" min="0.1" step="any" value={data.existingFeederSection==='other'?'':data.existingFeederSection} onChange={e=>update('existingFeederSection',e.target.value||'other')}/></label>}
 <div className="two"><MaintenanceChoices title="Possui DR?" value={data.existingDR} options={[{value:'yes',label:'Sim'},{value:'no',label:'Não'},{value:'unknown',label:'Não verificado'}]} onChange={value=>update('existingDR',value)}/><MaintenanceChoices title="Possui DPS?" value={data.existingDPS} options={[{value:'yes',label:'Sim'},{value:'no',label:'Não'},{value:'unknown',label:'Não verificado'}]} onChange={value=>update('existingDPS',value)}/></div>
 <MaintenanceChoices title="Aterramento" value={data.missingGrounding?'inadequate':data.grounding==='Aterramento verificado'?'verified':data.grounding==='Aterramento não verificado'?'unknown':''} options={[{value:'verified',label:'Verificado'},{value:'inadequate',label:'Ausente / inadequado'},{value:'unknown',label:'Não verificado'}]} onChange={value=>setData(d=>({...d,missingGrounding:value==='inadequate',grounding:value==='verified'?'Aterramento verificado':value==='unknown'?'Aterramento não verificado':value==='inadequate'?'Aterramento ausente ou inadequado':''}))}/>
 <label>Medições e detalhes do aterramento<input value={data.grounding} onChange={e=>update('grounding',e.target.value)} placeholder="Informações complementares (opcional)"/></label>
 <div id="ep-m-items" className="ep-maint-anchor" aria-hidden="true"/>{renderCounts('Tomadas existentes','outlets',['Simples','Dupla','Tripla'])}
 {renderCounts('Iluminação existente','lightingFixtures',['Lâmpada','Luminária','Lustre','Spot','Plafon','Arandela','Fita LED','Refletor','Pendente'])}
 {renderDedicated()}
 <label>Serviços elétricos adicionais solicitados<textarea rows={3} value={data.extraServices||''} onChange={e=>update('extraServices',e.target.value)} placeholder="Ex.: instalar luminárias, revisar conexões, identificar circuitos"/></label>
 <div className="two"><label>Mão de obra geral (descrição)<input value={data.generalLaborDescription||''} onChange={e=>update('generalLaborDescription',e.target.value)} placeholder="Ex.: execução dos serviços de manutenção"/></label><label>Valor da mão de obra geral (R$)<input type="number" min="0" step="0.01" value={data.generalLaborPrice||''} onChange={e=>update('generalLaborPrice',e.target.value)}/></label></div>
 <label>Observações e não conformidades constatadas<textarea rows={3} value={data.observations} onChange={e=>update('observations',e.target.value)}/></label>
 <div id="ep-m-circuits" className="ep-maint-anchor" aria-hidden="true"/><h3>Levantamento dos circuitos existentes</h3><p className="hint">Informe os circuitos realmente encontrados. Se faltar algum dado, deixe em branco; o PDF indicará a necessidade de conferência.</p>
 <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th>Circuito</th><th>Potência atual</th><th>Nova potência</th><th>Comprimento</th><th>Adequação</th><th>Ações</th></tr></thead><tbody>{data.circuits.map(c=><tr key={c.id}><td>{c.name}</td><td>{c.power||'—'} VA</td><td>{c.newLoad?`${c.newPower||'—'} VA`:'Não'}</td><td>{c.length||'—'} m</td><td>{[c.changeBreaker?'Disjuntor':null,c.changeCables?'Cabos':null].filter(Boolean).join(' + ')||'Sem troca indicada'}</td><td><button type="button" className="outline" onClick={()=>editCircuit(c)}>Editar</button> <button type="button" className="outline" onClick={()=>setData(d=>({...d,circuits:d.circuits.filter(x=>x.id!==c.id)}))}>Excluir</button></td></tr>)}</tbody></table></div>
 {draft&&<div className="panel" style={{padding:14,marginTop:12}}><h3>{data.circuits.some(c=>c.id===draft.id)?'Editar circuito':'Adicionar circuito existente'}</h3><div className="two"><label>Identificação do circuito<input value={draft.name} onChange={e=>updateDraft('name',e.target.value)}/></label><label>Fase / ligação<input value={draft.phase} onChange={e=>updateDraft('phase',e.target.value)} placeholder="A, B, C, AB..."/></label><label>Potência existente (VA)<input type="number" min="0" value={draft.power} onChange={e=>updateDraft('power',e.target.value)}/></label><label>Comprimento do circuito (m)<input type="number" min="0" step="any" value={draft.length||''} onChange={e=>updateDraft('length',e.target.value)}/></label><label>Disjuntor existente (A)<input type="number" min="0" value={draft.breaker} onChange={e=>updateDraft('breaker',e.target.value)}/></label><label>Seção existente (mm²)<input type="number" min="0" step="any" value={draft.section} onChange={e=>updateDraft('section',e.target.value)}/></label><label>Situação<select value={draft.condition} onChange={e=>updateDraft('condition',e.target.value)}><option value="">Não verificada</option><option value="ok">Sem anomalia aparente</option><option value="review">Requer avaliação</option><option value="issue">Não conformidade constatada</option></select></label></div>
 <label><input type="checkbox" checked={!!draft.newLoad} onChange={e=>updateDraft('newLoad',e.target.checked)}/> Adicionar ou alterar carga neste circuito</label>{draft.newLoad&&<label>Potência total prevista após alteração (VA)<input type="number" min="0" value={draft.newPower||''} onChange={e=>updateDraft('newPower',e.target.value)}/></label>}
 {draft.newLoad&&<div className="panel" style={{padding:12}}><h4>Pré-dimensionamento automático para validação</h4><p className="hint">Informe as condições reais de instalação. Hipóteses: cobre, PVC 70 °C, agrupamento em feixe/conduto fechado. A proposta não substitui inspeção, curto-circuito, atuação da proteção nem queda de tensão total.</p><div className="two"><label>Tensão efetiva do circuito (V)<input type="number" min="1" value={draft.circuitVoltage||data.existingVoltage} onChange={e=>updateDraft('circuitVoltage',e.target.value)}/></label><label>Método de instalação<select value={draft.referenceMethod||'B1'} onChange={e=>updateDraft('referenceMethod',e.target.value)}>{['B1','B2','C'].map(v=><option key={v} value={v}>{v}</option>)}</select></label><label>Condutores carregados<select value={draft.loadedConductors||'2'} onChange={e=>updateDraft('loadedConductors',e.target.value)}><option value="2">2</option><option value="3">3</option></select></label><label>Temperatura ambiente (°C)<select value={draft.ambientTemp||'30'} onChange={e=>updateDraft('ambientTemp',e.target.value)}>{Object.keys(temperature5410['PVC 70 °C']).map(v=><option key={v}>{v}</option>)}</select></label><label>Circuitos agrupados<select value={draft.groupedCircuits||'1'} onChange={e=>updateDraft('groupedCircuits',e.target.value)}>{Object.keys(grouping5410.bundle).map(v=><option key={v}>{v}</option>)}</select></label></div>{draftSizing?<div className="hint" role="status"><strong>Corrente de projeto: {draftSizing.ib.toLocaleString('pt-BR',{maximumFractionDigits:2})} A.</strong> {draftSizing.choice?<>Proposta para validação: <strong>disjuntor {draftSizing.choice.breaker} A e condutor {draftSizing.choice.section} mm²</strong> (Iz corrigida {draftSizing.choice.iz.toLocaleString('pt-BR',{maximumFractionDigits:2})} A; queda resistiva {draftSizing.choice.drop===null?'não calculada: informar comprimento':draftSizing.choice.drop.toLocaleString('pt-BR',{maximumFractionDigits:2})+'%'}). {draftSizing.dropPending?'A seção depende da conferência da queda de tensão após informar o comprimento.':''}</>:'Nenhuma combinação de disjuntor e seção atende aos critérios implementados. Revisão técnica necessária.'} A inclusão na lista de materiais depende dos checkboxes de substituição abaixo.</div>:<p className="hint" role="alert">Informe nova potência, tensão válida e parâmetros de instalação para obter uma proposta.</p>}</div>}
 {draft.newLoad&&draftSizing?.choice&&<button type="button" className="outline" onClick={()=>setDraft(d=>d?{...d,proposedBreaker:String(draftSizing.choice!.breaker),proposedSection:String(draftSizing.choice!.section)}:d)}>Preencher disjuntor e cabo sugeridos para validação</button>}
 <p className="hint">Informe as substituições previstas. A proposta no PDF compara a situação existente e a nova carga, mas a adequação final depende de verificação de Iz, método de instalação, queda de tensão e proteção.</p>
 <label><input type="checkbox" checked={!!draft.changeBreaker} onChange={e=>updateDraft('changeBreaker',e.target.checked)}/> Prever substituição do disjuntor</label>{draft.changeBreaker&&<div className="two"><label>Disjuntor proposto (A)<input type="number" min="0" value={draft.proposedBreaker||''} onChange={e=>updateDraft('proposedBreaker',e.target.value)}/></label><label>Preço unitário do disjuntor (R$)<input type="number" min="0" step="0.01" value={draft.breakerUnitPrice||''} onChange={e=>updateDraft('breakerUnitPrice',e.target.value)}/></label></div>}
 <label><input type="checkbox" checked={!!draft.changeCables} onChange={e=>updateDraft('changeCables',e.target.checked)}/> Prever substituição dos cabos</label>{draft.changeCables&&<div className="two"><label>Nova seção dos condutores (mm²)<input type="number" min="0" step="any" value={draft.proposedSection||''} onChange={e=>updateDraft('proposedSection',e.target.value)}/></label><label>Condutores fase (quantidade)<input type="number" min="0" step="1" value={draft.phaseConductors??'1'} onChange={e=>updateDraft('phaseConductors',e.target.value)}/></label><label>Condutores neutro (quantidade)<input type="number" min="0" step="1" value={draft.neutralConductors??'1'} onChange={e=>updateDraft('neutralConductors',e.target.value)}/></label><label>Condutores PE (quantidade)<input type="number" min="0" step="1" value={draft.earthConductors??'1'} onChange={e=>updateDraft('earthConductors',e.target.value)}/></label><label>Preço do cabo por metro (R$)<input type="number" min="0" step="0.01" value={draft.materialUnitPrice||''} onChange={e=>updateDraft('materialUnitPrice',e.target.value)}/></label></div>}
 <div className="two"><label>Descrição da mão de obra<input value={draft.laborDescription||''} onChange={e=>updateDraft('laborDescription',e.target.value)} placeholder="Ex.: substituição do circuito"/></label><label>Valor da mão de obra (R$)<input type="number" min="0" step="0.01" value={draft.laborPrice||''} onChange={e=>updateDraft('laborPrice',e.target.value)}/></label></div>
 <label>Observações<input value={draft.notes} onChange={e=>updateDraft('notes',e.target.value)}/></label><div style={{display:'flex',gap:8}}><button type="button" className="primary" disabled={!draft.name.trim()} onClick={commitDraft}>Adicionar à lista</button><button type="button" className="outline" onClick={()=>setDraft(null)}>Cancelar</button></div></div>}
 <div id="ep-m-save" className="ep-maint-anchor" aria-hidden="true"/><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button type="button" className="outline" onClick={()=>setDraft({id:crypto.randomUUID(),name:'',phase:'',power:'',breaker:'',section:'',condition:'',notes:'',length:'',newLoad:false,newPower:'',changeBreaker:false,changeCables:false,conductorCount:''})}>Adicionar circuito existente</button><button type="button" className="primary" disabled={saving} onClick={()=>void save()}>{saving?'Salvando...':'Salvar manutenção'}</button><button type="button" className="outline" onClick={onReport}>Configurar PDF</button></div>{message&&<p className="hint" role="status">{message}</p>}</>}</section>;
}
function maintenanceReportSections(m:MaintenanceData,projectCircuits:SavedCircuit[],feederCalc:Record<string,unknown>|undefined):ReportSection[]{
 const sections:ReportSection[]=[];
 sections.push({title:'Levantamento da instalação existente',headers:['Parâmetro','Situação encontrada'],rows:[['Status',maintenanceStatusLabels[m.status]],['Data da visita',maintenanceDateBR(m.visitDate)],['Fornecimento',translated(m.existingSupply)],['Tensão do circuito (V)',m.existingVoltage||'Não informada'],['Ligação do circuito',m.circuitConnection||'Não informada'],['Disjuntor geral (A)',m.existingMainBreaker||'Não informado'],['Alimentador — seção (mm²)',m.existingFeederSection||'Não informada'],['DR',m.existingDR==='yes'?'Presente':m.existingDR==='no'?'Ausente':'Não verificado'],['DPS',m.existingDPS==='yes'?'Presente':m.existingDPS==='no'?'Ausente':'Não verificado'],['Aterramento / inspeção',m.grounding||'Não informado'],['Aterramento inadequado/ausente',m.missingGrounding?'Sim':'Não informado'],['Tomadas existentes',(m.outlets||[]).filter(x=>x.quantity>0).map(x=>`${x.type}: ${x.quantity} un. × R$ ${(x.unitPrice||0).toFixed(2).replace('.',',')} = R$ ${(x.quantity*(x.unitPrice||0)).toFixed(2).replace('.',',')}`).join('; ')||'Não informadas'],['Iluminação existente',(m.lightingFixtures||[]).filter(x=>x.quantity>0).map(x=>`${x.type}: ${x.quantity} un. × R$ ${(x.unitPrice||0).toFixed(2).replace('.',',')} = R$ ${(x.quantity*(x.unitPrice||0)).toFixed(2).replace('.',',')}`).join('; ')||'Não informada'],['Subtotal de tomadas (R$)',(m.outlets||[]).reduce((sum,x)=>sum+x.quantity*(x.unitPrice||0),0).toFixed(2).replace('.',',')],['Subtotal de iluminação (R$)',(m.lightingFixtures||[]).reduce((sum,x)=>sum+x.quantity*(x.unitPrice||0),0).toFixed(2).replace('.',',')],['Circuitos específicos — equipamentos',(m.dedicatedCircuits||[]).filter(x=>x.quantity>0).map(x=>`${x.type}: ${x.quantity} un. × R$ ${(x.unitPrice||0).toFixed(2).replace('.',',')} = R$ ${(x.quantity*(x.unitPrice||0)).toFixed(2).replace('.',',')}`).join('; ')||'Não informados'],['Potências e pré-dimensionamento dos equipamentos',(m.dedicatedCircuits||[]).filter(x=>x.quantity>0).map(x=>{const voltage=Number(m.existingVoltage);const apparent=x.type==='Ar-condicionado'?((x.consumptionW&&x.consumptionW>0?x.consumptionW:(x.coolingBTU&&x.coolingBTU>0?x.coolingBTU*0.10:0))/(x.powerFactor&&x.powerFactor>0&&x.powerFactor<=1?x.powerFactor:0.9)):x.powerVA;const result=apparent&&voltage?maintenanceCircuitSizing({id:'',name:x.type,phase:'',power:'',breaker:'',section:'',condition:'',notes:'',newLoad:true,newPower:String(x.quantity*apparent),circuitVoltage:String(voltage),length:x.lengthM?String(x.lengthM):'',referenceMethod:'B1',loadedConductors:'2',ambientTemp:'30',groupedCircuits:'1'},String(voltage)):null;return `${x.type}: ${x.type==='Ar-condicionado'?`${x.coolingBTU||'—'} BTU/h, consumo ${x.consumptionW&&x.consumptionW>0?x.consumptionW:(x.coolingBTU&&x.coolingBTU>0?(x.coolingBTU*0.10).toFixed(0):'—')} W/un. ${x.consumptionW&&x.consumptionW>0?'(informado)':'(estimado)'}, FP ${x.powerFactor||0.9} (estimado se não informado), ${apparent?apparent.toFixed(0):'—'} VA/un.`:`${x.powerVA||'—'} VA/un.`}, ${voltage||'—'} V, ${x.lengthM||'—'} m; ${result?.choice?`${result.choice.breaker} A / ${result.choice.section} mm² (pré-dimensionamento; validar)`:'dimensionamento pendente'}`}).join('; ')||'Não informado'],['Subtotal de circuitos específicos (R$)',(m.dedicatedCircuits||[]).reduce((sum,x)=>sum+x.quantity*(x.unitPrice||0),0).toFixed(2).replace('.',',')],['Serviços adicionais',m.extraServices||'Nenhum'],['Mão de obra geral',m.generalLaborDescription||'Não informada'],['Valor mão de obra geral (R$)',m.generalLaborPrice||'Não informado'],['Observações',m.observations||'Nenhuma registrada']]});
 sections.push({title:'Circuitos da instalação existente',headers:['Circuito','Ligação','Potência atual (VA)','Nova potência (VA)','Comprimento (m)','Disjuntor (A)','Seção (mm²)','Condição'],rows:m.circuits.map(c=>[c.name||'Sem identificação',c.phase||'—',c.power||'—',c.newLoad?(c.newPower||'Pendente'):'Sem alteração',c.length||'—',c.breaker||'—',c.section||'—',c.condition==='ok'?'Sem anomalia aparente':c.condition==='issue'?'Não conformidade':c.condition==='review'?'Requer avaliação':'Não verificada'])});
 return sections;
}
function maintenanceMaterialSections(m:MaintenanceData,catalog:CatalogDescription[]=[]):ReportSection[]{
 const rows:(string|number|null|undefined)[][]=[];
 const add=(item:string,unit:string,qty:number|string,source:string)=>{if(typeof qty==='number'&&!(qty>0))return;rows.push([item,unit,String(qty),source]);};
 const cableTotals=new Map<string,number>();
 const addCable=(section:string,kind:string,meters:number)=>{if(!(meters>0))return;const key=`${catalogCableDescription(catalog,Number(section),'copper','PVC 70 °C')||`Cabo cobre ${section} mm²`} — ${kind}`;cableTotals.set(key,(cableTotals.get(key)||0)+meters)};
 for(const c of m.circuits){
  if(c.changeCables){
   const length=Number(c.length),section=Number(c.proposedSection);
   if(length>0&&section>0){
    for(const [kind,count] of [['fase',c.phaseConductors??'1'],['neutro',c.neutralConductors??'1'],['PE (terra)',c.earthConductors??'1']] as [string,string][]){const n=Number(count);if(Number.isInteger(n)&&n>0)addCable(String(section),kind,length*n)}
   }else add(`Cabos do circuito ${c.name||'sem nome'}`,'m','A definir','Informar seção e comprimento para quantificar');
  }
  if(c.changeBreaker){const nominal=Number(c.proposedBreaker);const poles=m.circuitConnection==='F+F+T'?2:1;add((nominal>0?catalogBreakerDescription(catalog,nominal,poles,''):null)||`Disjuntor ${c.proposedBreaker||'a definir'} A`,'un.',1,`Substituição prevista — ${c.name||'circuito'}`);}
 }
 for(const [name,meters] of cableTotals)add(name,'m',Number(meters.toFixed(2)),'Substituições selecionadas nos circuitos existentes');
 for(const [items,category] of [[m.outlets||[],'Tomadas'],[m.lightingFixtures||[],'Iluminação'],[m.dedicatedCircuits||[],'Equipamentos específicos']] as [MaintenanceCount[],string][]){
  for(const x of items.filter(v=>v.quantity>0))add(x.type,'un.',x.quantity,`${category} — levantamento, confirmar fornecimento/substituição`);
 }
 // Equipamentos cadastrados geram referência de cabos e disjuntor; não são compras aprovadas automaticamente.
 for(const x of (m.dedicatedCircuits||[]).filter(v=>v.quantity>0&&(v.type==='Ar-condicionado'?v.consumptionW:v.powerVA)&&v.lengthM)){
  if(!m.circuitConnection||!m.existingVoltage)continue;
  const result=maintenanceCircuitSizing({id:'',name:x.type,phase:'',power:'',breaker:'',section:'',condition:'',notes:'',newLoad:true,newPower:String(x.quantity*(x.type==='Ar-condicionado'?(x.consumptionW||0)/(x.powerFactor&&x.powerFactor>0&&x.powerFactor<=1?x.powerFactor:0.9):(x.powerVA||0))),circuitVoltage:m.existingVoltage,length:String(x.lengthM),referenceMethod:'B1',loadedConductors:'2',ambientTemp:'30',groupedCircuits:'1'},m.existingVoltage);
  if(!result?.choice)continue;
  const phaseCount=m.circuitConnection==='F+F+T'?2:1,neutralCount=m.circuitConnection==='F+N+T'?1:0;
  const perConductor=Number(x.lengthM);
  add(`${catalogCableDescription(catalog,result.choice.section,'copper','PVC 70 °C')||`Cabo ${result.choice.section} mm²`} — fase (${x.type})`,'m',Number((perConductor*phaseCount).toFixed(2)),'Estimativa; validar antes da compra');
  if(neutralCount)add(`${catalogCableDescription(catalog,result.choice.section,'copper','PVC 70 °C')||`Cabo ${result.choice.section} mm²`} — neutro (${x.type})`,'m',Number((perConductor*neutralCount).toFixed(2)),'Estimativa; validar antes da compra');
  add(`Cabo PE (terra) — seção a validar (${x.type})`,'m',perConductor,'Estimativa; dimensionar PE conforme NBR 5410');
  add(`${catalogBreakerDescription(catalog,result.choice.breaker,phaseCount,'')||`Disjuntor ${result.choice.breaker} A`} — ${x.type}`,'un.',1,'Estimativa; confirmar polos, curva e proteção');
 }
 if(!rows.length)add('Nenhum material quantificado','—','—','Informar itens e circuitos a substituir');
 return [{title:'Lista de materiais e quantidades — manutenção',headers:['Material / item','Unidade','Quantidade','Observação'],rows}];
}
function maintenanceProposalSections(m:MaintenanceData,_projectCircuits:SavedCircuit[],_feederCalc:Record<string,unknown>|undefined):ReportSection[]{
 const rows:(string|number|null|undefined)[][]=[];
 const push=(item:string,current:string,recommended:string)=>rows.push([item,current,recommended]);
 for(const c of m.circuits){
  const sizing=maintenanceCircuitSizing(c,m.existingVoltage);
  const changes:string[]=[];
  if(c.newLoad)changes.push(`Carga: ${c.power||'?'} → ${c.newPower||'?'} VA`);
  if(c.changeBreaker)changes.push(`Trocar disjuntor ${c.breaker||'?'} A por ${c.proposedBreaker||'a definir'} A`);
  if(c.changeCables)changes.push(`Trocar cabos ${c.section||'?'} por ${c.proposedSection||'a definir'} mm² (${c.length||'?'} m/condutor)`);
  if(!changes.length)changes.push('Nenhuma intervenção selecionada');
  const proposal=sizing?.choice?`Referência calculada: ${sizing.choice.breaker} A e ${sizing.choice.section} mm²; Iz ${sizing.choice.iz.toFixed(1)} A. `:c.newLoad?'Dimensionamento não determinado; conferir parâmetros. ':'';
  push(c.name||'Circuito',`Disj. ${c.breaker||'?'} A; cabos ${c.section||'?'} mm²; ${c.power||'?'} VA`,`${changes.join('; ')}. ${proposal}Confirmar método, queda total, Icc e proteção.`);
 }
 if(m.existingDR!=='yes')push('DR',m.existingDR==='no'?'Ausente':'Não verificado','Verificar aplicação obrigatória, tipo e sensibilidade nos circuitos pertinentes.');
 if(m.existingDPS!=='yes')push('DPS',m.existingDPS==='no'?'Ausente':'Não verificado','Verificar necessidade e coordenação conforme instalação.');
 if(m.missingGrounding)push('Aterramento','Ausente ou inadequado','Executar adequação e verificar continuidade e condições de proteção.');else if(!m.grounding.trim())push('Aterramento','Não informado','Inspecionar e realizar verificações pertinentes.');
 if(m.extraServices?.trim())push('Serviços adicionais','Solicitados pelo cliente',m.extraServices.trim());
 if(!rows.length)push('Levantamento','Sem circuitos cadastrados','Cadastrar circuitos existentes para gerar a proposta.');
 return [{title:'Proposta preliminar de adequação',headers:['Circuito / item','Situação existente','Recomendação técnica'],rows}];
}

type ReportOptions={maintenanceSurvey:boolean;maintenanceProposal:boolean;installation:boolean;environments:boolean;circuits:boolean;distribution:boolean;feeder:boolean;materials:boolean;labor:boolean;values:boolean};
const reportDefaults:ReportOptions={maintenanceSurvey:false,maintenanceProposal:false,installation:true,environments:true,circuits:true,distribution:true,feeder:true,materials:true,labor:true,values:true};
const reportLabels:Record<string,string>={residential:'Residencial',commercial:'Comercial',industrial:'Industrial (baixa tensão)',single:'Monofásico',two:'Bifásico',three:'Trifásico',copper:'Cobre',aluminum:'Alumínio',bundle:'Feixe ou conduto fechado',singleLayer:'Camada única', 'phase-neutral':'Fase + neutro','phase-phase':'Duas fases','lighting':'Iluminação','tug':'Tomadas de uso geral (TUG)','tue':'Tomadas de uso específico (TUE)'};
const reportText=(v:unknown)=>v===null||v===undefined||v===''?'Não informado':String(v);
const translated=(v:unknown)=>reportLabels[String(v)]||reportText(v);
const reportNum=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{maximumFractionDigits:2}):reportText(v)};
function TechnicalReport({client,userId,professional,logo,accent,settings,maintenanceMode=false}:{client:Client;userId:string;professional:string;logo:string;accent:string;settings:InstallationSettings;maintenanceMode?:boolean}){
 const [options,setOptions]=useState<ReportOptions>(maintenanceMode?{maintenanceSurvey:true,maintenanceProposal:true,installation:false,environments:false,circuits:false,distribution:false,feeder:false,materials:true,labor:true,values:true}:{...reportDefaults});
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const [budgets,setBudgets]=useState<CloudBudget[]>([]),[budgetId,setBudgetId]=useState(''),[budgetLoading,setBudgetLoading]=useState(!maintenanceMode),[itemsLoading,setItemsLoading]=useState(false),[budgetError,setBudgetError]=useState('');
 useEffect(()=>{if(maintenanceMode)return;let active=true;setBudgetLoading(true);(async()=>{try{const pr=await supabase.from('eletripro_projects').select('id').eq('client_id',client.id).eq('owner_id',userId).maybeSingle();if(pr.error)throw pr.error;const r=pr.data?await supabase.from('eletripro_budgets').select('id,title,status').eq('project_id',pr.data.id).order('updated_at',{ascending:false}):{data:[],error:null};if(r.error)throw r.error;if(active){setBudgets(r.data||[]);setBudgetId(r.data?.length===1?r.data[0].id:'')}}catch(e:any){if(active)setBudgetError(e?.message||'Falha ao carregar orçamentos.')}finally{if(active)setBudgetLoading(false)}})();return()=>{active=false}},[client.id,userId,maintenanceMode]);
 useEffect(()=>{if(maintenanceMode)return;let active=true;setBudgetError('');if(!budgetId){setItemsLoading(false);return}setItemsLoading(true);(async()=>{try{const r=await supabase.from('eletripro_budget_items').select('id,description,quantity,unit,unit_price,item_type').eq('budget_id',budgetId).order('description');if(r.error)throw r.error;}catch(e:any){if(active)setBudgetError(e?.message||'Falha ao carregar itens.')}finally{if(active)setItemsLoading(false)}})();return()=>{active=false}},[budgetId,maintenanceMode]);
 const needsBudget=!maintenanceMode&&(options.materials||options.labor);
 const budgetBlocked=needsBudget&&(budgetLoading||itemsLoading||!budgetId||!!budgetError);
 const rowTotal=(m:MaterialRow)=>(Number(m.quantity)||0)*(Number(m.unit_price)||0);

 const change=(k:keyof ReportOptions,v:boolean)=>setOptions(o=>({...o,[k]:v}));
 const generate=async()=>{
  if(busy||budgetBlocked)return;setBusy(true);setError('');
  try{
   const pr=await supabase.from('eletripro_projects').select('id,installation').eq('client_id',client.id).eq('owner_id',userId).maybeSingle();
   if(pr.error)throw pr.error;
   const project=pr.data,id=project?.id;
   const catalog=await loadActiveElectricalCatalog();
   const [cr,er]=await Promise.all([
    id&&!maintenanceMode&&(options.circuits||options.distribution||options.feeder||options.maintenanceProposal||options.materials)?supabase.from('eletripro_circuits').select('id,title,data').eq('project_id',id).order('created_at',{ascending:true}):Promise.resolve({data:[],error:null}),
    id&&!maintenanceMode&&(options.environments||options.circuits||options.distribution||options.feeder||options.materials)?supabase.from('eletripro_environments').select('id,title,data').eq('project_id',id).order('created_at',{ascending:true}):Promise.resolve({data:[],error:null}),

   ]);
   for(const r of [cr,er])if(r.error)throw r.error;
   const circuits=(cr.data||[]) as SavedCircuit[],rooms=(er.data||[]) as SavedEnvironment[];
   const sections:ReportSection[]=[];
   const add=(title:string,headers:string[],rows:(string|number|null|undefined)[][],kind?:'materials')=>sections.push({title,headers,rows,kind});
   const d={...defaultInstallation,...settings,...(project?.installation||{})};
   if(options.installation)add('Parâmetros da instalação',['Parâmetro','Valor'],[
    ['Aplicação',translated(d.application)],['Fornecimento',translated(d.supply)],['Tensão (V)',d.voltage],['Método de referência',d.method],['Temperatura (°C)',d.temperature],['Fator de potência',d.powerFactor],['Material condutor',translated(d.conductorMaterial)],['Isolação',d.conductorInsulation],['Agrupamento',d.groupCount],['Disposição do agrupamento',translated(d.groupMode)],['Modo de instalação',translated(d.wiring)]
   ]);
   if(options.environments)add('Ambientes',['Ambiente','Características'],rooms.map(r=>{const a=r.data||{},estimate=estimateRoom(r);return [r.title,`Tipo: ${reportText(a.kind)} | Área: ${reportNum(estimate?.area??a.area)} m² | Dimensões: ${reportNum(a.width)} × ${reportNum(a.length)} m | Perímetro: ${estimate?reportNum(estimate.perimeter)+' m':'Não informado'} | Iluminação: ${estimate?reportNum(estimate.lighting)+' VA':'Não informado'} | TUG: ${estimate?.outlets??'Não informado'} ponto(s), ${estimate?.tug===null?'A definir':reportNum(estimate?.tug)+' VA'}${a.notes?' | Observações: '+a.notes:''}`]}));
   const result=(c:SavedCircuit)=>liveCircuitSizing(c,d,rooms);
   if(options.circuits)add('Circuitos dimensionados',['Circuito','Tipo','Potência aparente (VA)','Disjuntor (A)','Condutor (mm²)'],circuits.map(c=>[c.title,translated(c.data.circuit||c.data.type||( /iluminaç[aã]o|lighting/i.test(c.title)?'lighting':undefined)),reportNum(feederCircuitElectrical(c,d,rooms).va),reportText(result(c)?.breaker),reportText(result(c)?.selectedSection)]));
   if(options.distribution)add('Quadro de distribuição',['Circuito','Fase(s)','Disjuntor','Seção (mm²)','Corrente de Projeto (A)'],[...circuits].sort((a,b)=>(Number(result(b)?.breaker)||0)-(Number(result(a)?.breaker)||0)).map(c=>{const poles=panelPoles(c,d),valid=panelChoices(d,poles);const stored=String(c.data.panelConnection||c.data.panelPhase||'');const connection=valid.includes(stored as PanelConnection)?stored:valid[0];return [c.title,connection,result(c)?.breaker?`${result(c)?.breaker} A / ${poles} polo(s)`:'Não informado',reportText(result(c)?.selectedSection),reportNum(feederCircuitElectrical(c,d,rooms).current)]}));
   if(options.feeder){
    const feeder=project?.installation?.feeder as (FeederForm&{calculation?:Record<string,unknown>})|undefined;
    const f=feeder?.calculation;
    const currentCelesc=celescAutomaticSupply(circuits,d,rooms);
    const feederCurrent=Boolean(f&&typeof f.sourceRevision==='string'&&f.sourceRevision===feederSourceRevision(circuits,rooms,d));
    const savedFeederValue=(value:unknown)=>feederCurrent?reportNum(value):'Não exibido — recalcular alimentador';
    add('Alimentador geral',['Parâmetro','Valor'],f?[
     ['Situação do dimensionamento salvo',feederCurrent?'Referências de cargas e instalação inalteradas desde o salvamento (não substitui verificação técnica)':'DESATUALIZADO OU NÃO VERIFICÁVEL — recalcular alimentador antes de utilizar os valores salvos'],['CELESC — categoria atual (indicativa)',currentCelesc.entry?.category||'Não determinada — revisar parâmetros'],['CELESC — carga instalada atual (kW)',Number.isFinite(currentCelesc.installedKW)?reportNum(currentCelesc.installedKW):'Indisponível — conferir potências e ambientes'],['CELESC — disjuntor padrão IEC/DIN indicativo (A)',reportNum(currentCelesc.entry?.breakerIEC)],['CELESC — ramal entrada PVC 70 °C indicativo (mm²)',reportNum(currentCelesc.entry?.entryPVC)],['CELESC — ramal entrada XLPE/EPR 90 °C indicativo (mm²)',reportNum(currentCelesc.entry?.entryXLPE)],['CELESC — referência e limites',celescEntryReference],['Potência do alimentador salva (verificar unidade e atualização)',savedFeederValue(f.power)],['Fator de demanda',reportText(f.demand)],
     ['Aviso de atualização','Dados do alimentador salvos anteriormente; recalcular o alimentador após alterações de cargas, ambientes ou parâmetros da instalação.'],['Corrente de projeto salva (A)',savedFeederValue(f.ib)],['Condutor de fase salvo (mm²)',savedFeederValue(f.section)],
     ['Coordenação — maior disjuntor terminal (A)',savedFeederValue((f.coordinationAudit as Record<string,unknown>|null)?.largestTerminalBreaker)],['Coordenação — comparação nominal',feederCurrent?reportText((f.coordinationAudit as Record<string,unknown>|null)?.status):'Não exibido — recalcular alimentador'],['Seletividade comprovada','Não — verificar curvas e curto-circuito'],['Capacidade corrigida Iz (A)',savedFeederValue(f.iz)],['Disjuntor geral salvo (A)',savedFeederValue(f.breaker)],
     ['Neutro (mm²)',savedFeederValue(f.neutral)],['PE preliminar (mm²)',savedFeederValue(f.pe)],
     ['Queda resistiva estimada (%)',savedFeederValue(f.dropPercent)],
     ['Critério de demanda / observações',reportText(feeder?.notes)]
    ]:[['CELESC — carga instalada atual (kW)',Number.isFinite(currentCelesc.installedKW)?reportNum(currentCelesc.installedKW):'Indisponível — conferir dados'],['CELESC — categoria indicativa',currentCelesc.entry?.category||'Não determinada'],['Situação','Dimensionamento do alimentador ainda não cadastrado']]);
   }
   const maintenance=safeMaintenance(project?.installation?.maintenance);
   const feederCalc=(project?.installation?.feeder as {calculation?:Record<string,unknown>}|undefined)?.calculation;
   if(maintenanceMode&&options.maintenanceSurvey){sections.push(...maintenanceReportSections(maintenance,circuits,feederCalc));sections.push(...maintenanceMaterialSections(maintenance,catalog));}
   if(maintenanceMode&&options.maintenanceProposal)sections.push(...maintenanceProposalSections(maintenance,circuits,feederCalc));
   if(maintenanceMode&&options.labor&&(maintenance.generalLaborDescription?.trim()||Number(maintenance.generalLaborPrice)>0))sections.push({title:'Mão de obra geral',headers:['Descrição','Valor (R$)'],rows:[[maintenance.generalLaborDescription||'Serviços de manutenção',options.values?(Number(maintenance.generalLaborPrice)||0).toLocaleString('pt-BR',{minimumFractionDigits:2}):'Oculto']]});
   const maintenanceMaterials:MaterialRow[]=maintenanceMode?maintenance.circuits.flatMap(c=>{
    const rows:MaterialRow[]=[];const length=Number(c.length),section=Number(c.proposedSection),price=Number(c.materialUnitPrice)||0;
    if(c.changeCables&&section>0&&length>0){
     const counts:[string,number][]=[['fase',Number(c.phaseConductors??1)],['neutro',Number(c.neutralConductors??1)],['PE',Number(c.earthConductors??1)]];
     for(const [type,count] of counts)if(Number.isInteger(count)&&count>0)rows.push({id:`cabo-${type}-${c.id}`,item_type:'material',description:`${catalogCableDescription(catalog,section,'copper','PVC 70 °C')||`Cabo cobre PVC 70 °C ${section} mm²`} — ${type} — ${c.name}`,quantity:length*count,unit:'m',unit_price:price} as MaterialRow);
    }
    if(c.changeBreaker&&Number(c.proposedBreaker)>0)rows.push({id:`disj-${c.id}`,item_type:'material',description:`${catalogBreakerDescription(catalog,Number(c.proposedBreaker),maintenance.circuitConnection==='F+F+T'?2:1,'')||`Disjuntor ${c.proposedBreaker} A`} — ${c.name}`,quantity:1,unit:'un',unit_price:Number(c.breakerUnitPrice)||0} as MaterialRow);
    if(c.laborDescription?.trim())rows.push({id:`labor-${c.id}`,item_type:'labor',description:`${c.laborDescription} — ${c.name}`,quantity:1,unit:'serviço',unit_price:Number(c.laborPrice)||0} as MaterialRow);
    return rows;
   }):[];
   let savedRows:MaterialRow[]=[];
   if(needsBudget){if(!id)throw new Error('Projeto não encontrado.');const selected=await supabase.from('eletripro_budgets').select('id,title').eq('project_id',id).eq('id',budgetId).single();if(selected.error)throw selected.error;const r=await supabase.from('eletripro_budget_items').select('id,description,quantity,unit,unit_price,item_type').eq('budget_id',budgetId).order('description');if(r.error)throw r.error;savedRows=r.data||[];add('Orçamento de referência',['Parâmetro','Valor'],[['Orçamento',selected.data.title]]);}
   const chosen=(maintenanceMode?consolidateMaterialRows(maintenanceMaterials):savedRows).filter(m=>Number(m.quantity)>0&&(m.item_type==='labor'?options.labor:options.materials));
   for(const kind of ['material','labor'] as const){if(!(kind==='labor'?options.labor:options.materials))continue;const rows=chosen.filter(m=>kind==='labor'?m.item_type==='labor':m.item_type!=='labor');const data=rows.map(m=>[m.description,reportNum(m.quantity),m.unit,...(options.values?[moneyBR(Number(m.unit_price)||0),moneyBR(rowTotal(m))]:[])]);if(options.values&&rows.length)data.push(['Total', '', '', '',moneyBR(rows.reduce((sum,m)=>sum+rowTotal(m),0))]);add(kind==='labor'?'Mão de obra':'Lista de materiais',['Descrição','Quantidade','Unidade',...(options.values?['Preço unitário','Subtotal']:[])],data,'materials');}
   if(maintenanceMode&&options.materials){const pending=maintenance.circuits.filter(c=>c.changeCables&&(!(Number(c.length)>0)||!(Number(c.proposedSection)>0)||![c.phaseConductors??'1',c.neutralConductors??'1',c.earthConductors??'1'].some(v=>Number(v)>0)));if(pending.length)add('Pendências de quantitativos',['Circuito','Dados faltantes'],pending.map(c=>[c.name,'Informe comprimento, seção proposta e quantidade de condutores por tipo']));}
   const total=options.values&&(options.materials||options.labor)?moneyBR(chosen.reduce((sum,m)=>sum+(Number(m.quantity)||0)*(Number(m.unit_price)||0),0)):undefined;
   await downloadTechnicalPdf({company:professional||'EletriPro',logo,accent,client:client.name,phone:client.phone||'',email:client.email||'',sections,total},`EletriPro-Relatorio-${client.name.replace(/[^a-zA-Z0-9À-ÿ_-]+/g,'-')}.pdf`);
  }catch(e:any){setError(e?.message||'Falha ao gerar o PDF. Confira os dados e tente novamente.')}finally{setBusy(false)}
 };
 return <section className="panel"><h2>Relatório técnico em PDF</h2><p>Selecione as seções desejadas. Descrição e quantidade aparecem em todas as listas exportadas. O arquivo PDF será baixado diretamente.</p><div className="ep-report-options">{([
 ['maintenanceSurvey','Levantamento da instalação existente'],['maintenanceProposal','Proposta automática de adequação (preliminar)'],['installation','Tipo de instalação'],['environments','Ambientes'],['circuits','Dimensionamento dos circuitos'],['distribution','Quadro de distribuição'],['feeder','Alimentador geral'],['materials','Lista de materiais'],['labor','Mão de obra'],['values','Valores e totais']
 ] as [keyof ReportOptions,string][]).filter(([key])=>maintenanceMode?['maintenanceSurvey','maintenanceProposal','materials','labor','values'].includes(key):!['maintenanceSurvey','maintenanceProposal'].includes(key)).map(([key,label])=><label key={key}><input type="checkbox" checked={options[key]} onChange={e=>change(key,e.target.checked)}/> {label}</label>)}</div>{needsBudget&&<div><label>Orçamento de referência<select value={budgetId} disabled={budgetLoading||busy} onChange={e=>setBudgetId(e.target.value)}><option value="">Selecione um orçamento salvo</option>{budgets.map(b=><option key={b.id} value={b.id}>{b.title}</option>)}</select></label>{budgetLoading||itemsLoading?<p>Carregando orçamento...</p>:budgetError?<p role="alert">{budgetError}</p>:!budgets.length?<p>Salve um orçamento na aba Orçamento antes de exportar estas seções.</p>:null}</div>}<button className="primary" type="button" disabled={busy||budgetBlocked} onClick={()=>void generate()}>{busy?'Gerando PDF...':'Gerar relatório / PDF'}</button>{error&&<p role="alert" className="hint">{error}</p>}<p className="hint">A geração ocorre no navegador, usando os dados do Supabase. Nenhum registro é alterado.</p></section>
}


type PaymentHistoryItem={id:string;plan_name:string;amount_cents:number;payment_method:string;status:string;created_at:string;subscription_applied_at:string|null;subscription_expires_at:string|null;payment_provider:string;mercado_pago_order_id:string|null};
type AdminAccount={id:string;email:string;full_name:string;plan:string;pro_expires_at:string|null;account_enabled:boolean;created_at:string;admin_access_mode?:string|null;is_admin?:boolean};
type AdminPlan={id:string;name:string;price_cents:number;billing_months:number;active:boolean};
type AdminPayment={id:string;account_id:string;amount_cents:number;paid_at:string};
type SubscriptionRequest={id:string;account_id:string;plan_id:string;plan_name:string;amount_cents:number;status:string;requested_at:string;email?:string};
const adminDate=(v:string|null)=>v?new Date(v).toLocaleDateString('pt-BR'):'—';

type ElectricalCatalogItem={id:string;category:'cabo'|'disjuntor'|'dr'|'dps';name:string;description:string|null;section_mm2:number|null;nominal_a:number|null;poles:number|null;curve:string|null;material:string|null;insulation:string|null;active:boolean;updated_at:string};
const emptyElectricalItem={category:'cabo' as ElectricalCatalogItem['category'],name:'',description:'',section_mm2:'',nominal_a:'',poles:'',curve:'',material:'',insulation:'',active:true};
function ElectricalCatalogAdmin(){
 const [items,setItems]=useState<ElectricalCatalogItem[]>([]);
 const [filter,setFilter]=useState('todos');
 const [form,setForm]=useState({...emptyElectricalItem});
 const [editing,setEditing]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const load=async()=>{
  if(!supabase)return;
  const {data,error:loadError}=await supabase.from('eletripro_electrical_catalog').select('*').order('category').order('name');
  if(loadError)setError('Não foi possível carregar o catálogo. Execute o SQL da etapa 9 antes de publicar: '+loadError.message);
  else{setItems((data||[]) as ElectricalCatalogItem[]);setError('');}
 };
 useEffect(()=>{void load()},[]);
 const edit=(item:ElectricalCatalogItem)=>{
  setEditing(item.id);setForm({category:item.category,name:item.name,description:item.description||'',section_mm2:item.section_mm2==null?'':String(item.section_mm2),nominal_a:item.nominal_a==null?'':String(item.nominal_a),poles:item.poles==null?'':String(item.poles),curve:item.curve||'',material:item.material||'',insulation:item.insulation||'',active:item.active});
 };
 const save=async(e:React.FormEvent)=>{
  e.preventDefault();if(!supabase||busy)return;
  setError('');setNotice('');
  const payload={category:form.category,name:form.name.trim(),description:form.description.trim()||null,section_mm2:form.category==='cabo'&&form.section_mm2?Number(form.section_mm2):null,nominal_a:form.category!=='cabo'&&form.nominal_a?Number(form.nominal_a):null,poles:form.category!=='cabo'&&form.poles?Number(form.poles):null,curve:form.category==='disjuntor'?(form.curve.trim()||null):null,material:form.category==='cabo'?(form.material.trim()||null):null,insulation:form.category==='cabo'?(form.insulation.trim()||null):null,active:form.active};
  if(!payload.name){setError('Informe a descrição do dispositivo.');return;}
  if(form.category==='cabo'&&(!['1.5','2.5','4','6','10','16'].includes(form.section_mm2)||!['cobre','aluminio'].includes(catalogKey(form.material))||!['pvc70c','eprxlpe90c'].includes(catalogKey(form.insulation)))){setError('Selecione a seção, a isolação e o material do cabo.');return;}
  if(payload.section_mm2!==null&&(!Number.isFinite(payload.section_mm2)||payload.section_mm2<=0)){setError('Seção inválida.');return;}
  if(payload.nominal_a!==null&&(!Number.isFinite(payload.nominal_a)||payload.nominal_a<=0)){setError('Corrente nominal inválida.');return;}
  setBusy(true);
  const result=editing?await supabase.from('eletripro_electrical_catalog').update(payload).eq('id',editing):await supabase.from('eletripro_electrical_catalog').insert(payload);
  if(result.error)setError(result.error.message);
  else{setNotice(editing?'Registro atualizado.':'Registro cadastrado.');setEditing(null);setForm({...emptyElectricalItem});await load();}
  setBusy(false);
 };
 const toggle=async(item:ElectricalCatalogItem)=>{
  if(!supabase||busy)return;setBusy(true);setError('');
  const {error:saveError}=await supabase.from('eletripro_electrical_catalog').update({active:!item.active}).eq('id',item.id);
  if(saveError)setError(saveError.message);else await load();
  setBusy(false);
 };
 return <div className="ep-admin"><section className="panel">
  <h2>Banco de Dados Elétricos</h2>
  <p className="hint">Cadastro administrativo de cabos, disjuntores, dispositivos DR e DPS. Registros inativos são preservados. Os dados são armazenados no Supabase e protegidos por permissões administrativas.</p>
  <p className="hint"><strong>Importante:</strong> nesta etapa o cadastro é um inventário técnico. Alterações não modificam automaticamente as tabelas normativas de capacidade de corrente ou os critérios do motor de dimensionamento; essa integração exige validação técnica.</p>
  {error&&<p className="notice" role="alert">{error}</p>}{notice&&<p className="hint" role="status">{notice}</p>}
  <form className="form" onSubmit={save}>
   <h3>{editing?'Editar dispositivo':'Cadastrar dispositivo'}</h3>
   <div className="two"><label>Categoria<select value={form.category} onChange={e=>setForm({...form,category:e.target.value as ElectricalCatalogItem['category']})}><option value="cabo">Cabo</option><option value="disjuntor">Disjuntor</option><option value="dr">DR</option><option value="dps">DPS</option></select></label><label>Descrição / identificação<input required maxLength={180} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label></div>
   <label>Observações técnicas<textarea rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
   {form.category==='cabo'?<div className="ep-catalog-choices">{([
 ['section_mm2','Seção nominal (mm²)',[['1.5','1,5 mm²'],['2.5','2,5 mm²'],['4','4,0 mm²'],['6','6,0 mm²'],['10','10 mm²'],['16','16 mm²']]],
 ['insulation','Isolação',[['PVC 70 °C','PVC 70 ºC'],['EPR / XLPE 90 °C','EPR / XLPE 90 ºC']]],
 ['material','Material',[['Cobre','Cobre'],['Alumínio','Alumínio']]]
 ] as const).map(([field,label,options])=><fieldset key={field} className="ep-catalog-choice"><legend>{label}</legend><div className="ep-catalog-choice-buttons">{options.map(([value,caption])=><button key={value} type="button" aria-pressed={catalogKey(form[field])===catalogKey(value)} className="outline" onClick={()=>setForm(old=>({...old,[field]:value}))}>{caption}</button>)}</div></fieldset>)}</div>:<div className="two"><label>Corrente nominal (A)<input type="number" min="0.1" step="any" value={form.nominal_a} onChange={e=>setForm({...form,nominal_a:e.target.value})}/></label><label>Número de polos<input type="number" min="1" max="4" step="1" value={form.poles} onChange={e=>setForm({...form,poles:e.target.value})}/></label>{form.category==='disjuntor'&&<label>Curva<input value={form.curve} placeholder="Ex.: C" onChange={e=>setForm({...form,curve:e.target.value})}/></label>}</div>}
   <label><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/> Dispositivo ativo</label>
   <div className="actions"><button className="primary" disabled={busy} type="submit">{busy?'Salvando...':editing?'Salvar alterações':'Cadastrar'}</button>{editing&&<button type="button" className="outline" onClick={()=>{setEditing(null);setForm({...emptyElectricalItem})}}>Cancelar edição</button>}</div>
  </form>
 </section><section className="panel">
 <div className="two"><h3>Dispositivos cadastrados ({items.length})</h3><label>Filtrar categoria<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="todos">Todas</option><option value="cabo">Cabos</option><option value="disjuntor">Disjuntores</option><option value="dr">DR</option><option value="dps">DPS</option></select></label></div>
 <div className="ep-admin-table"><table><thead><tr><th>Categoria</th><th>Descrição</th><th>Características</th><th>Status</th><th>Ações</th></tr></thead><tbody>{items.filter(item=>filter==='todos'||item.category===filter).map(item=><tr key={item.id}><td>{item.category.toUpperCase()}</td><td><strong>{item.name}</strong><small style={{display:'block'}}>{item.description}</small></td><td>{item.category==='cabo'?[item.section_mm2!=null?item.section_mm2+' mm²':'',item.material,item.insulation].filter(Boolean).join(' · '):[item.nominal_a!=null?item.nominal_a+' A':'',item.poles!=null?item.poles+' polos':'',item.curve?'Curva '+item.curve:''].filter(Boolean).join(' · ')}</td><td>{item.active?'Ativo':'Inativo'}</td><td><button className="outline" type="button" disabled={busy} onClick={()=>edit(item)}>Editar</button> <button className="outline" type="button" disabled={busy} onClick={()=>void toggle(item)}>{item.active?'Desativar':'Ativar'}</button></td></tr>)}</tbody></table></div>
 {items.length===0&&!error&&<p className="hint">Nenhum dispositivo cadastrado. Use o formulário acima para começar.</p>}
 </section></div>;
}

function AdminPanel({section}:{section:string}){
 const[accounts,setAccounts]=useState<AdminAccount[]>([]),[plans,setPlans]=useState<AdminPlan[]>([]),[payments,setPayments]=useState<AdminPayment[]>([]),[requests,setRequests]=useState<SubscriptionRequest[]>([]);
 const[busy,setBusy]=useState(false),[error,setError]=useState(''),[search,setSearch]=useState('');
 const[planName,setPlanName]=useState(''),[price,setPrice]=useState(''),[months,setMonths]=useState('1');
 const[editingPlan,setEditingPlan]=useState<string|null>(null);
 async function load(){if(!supabase)return;setBusy(true);setError('');const r=await supabase.rpc('eletripro_admin_dashboard');if(r.error){setError(r.error.message)}else{const d=r.data||{};setAccounts(d.accounts||[]);setPlans(d.plans||[]);setPayments(d.payments||[]);setRequests(d.requests||[])}setBusy(false)}
 useEffect(()=>{void load()},[]);
 async function updateAccount(id:string,changes:Record<string,unknown>){if(!supabase)return;setBusy(true);const r=await supabase.rpc('eletripro_admin_update_account',{p_account_id:id,p_changes:changes});if(r.error)setError(r.error.message);else {await load();if(changes.admin_access_mode)window.dispatchEvent(new Event('eletripro-admin-mode-changed'));if(changes.plan!==undefined||changes.pro_expires_at!==undefined||changes.account_enabled!==undefined)window.dispatchEvent(new Event('eletripro-profile-changed'))}setBusy(false)}
 async function savePlan(e:React.FormEvent){e.preventDefault();if(!supabase)return;const value=Number(price.replace(',','.'));if(!planName.trim()||!Number.isFinite(value)||value<0)return setError('Informe nome e valor válido.');setBusy(true);const r=await supabase.rpc('eletripro_admin_save_plan',{p_id:editingPlan,p_name:planName.trim(),p_price_cents:Math.round(value*100),p_billing_months:Number(months),p_active:true});if(r.error)setError(r.error.message);else{setEditingPlan(null);setPlanName('');setPrice('');await load();window.dispatchEvent(new Event('eletripro-plans-changed'))}setBusy(false)}
 const now=new Date();const month=now.toISOString().slice(0,7);
 const monthRevenue=payments.filter(p=>p.paid_at?.slice(0,7)===month).reduce((n,p)=>n+p.amount_cents,0)/100;
 const active=accounts.filter(a=>a.account_enabled&&(!a.pro_expires_at||new Date(a.pro_expires_at)>now));
 const months6=Array.from({length:6},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);return d.toISOString().slice(0,7)});
 const chart=(values:number[],currency=false)=>{const max=Math.max(1,...values);return <div className="ep-admin-bars">{values.map((v,i)=><div className="ep-admin-bar-item" key={months6[i]}><span>{currency?brl(v):v}</span><div style={{height:Math.max(3,v/max*130)+'px'}}/><small>{months6[i].slice(5)}/{months6[i].slice(2,4)}</small></div>)}</div>};
 return <div className="ep-admin">
 {error&&<p className="notice" role="alert">{error}</p>}
 <div className="ep-admin-toolbar"><p>Gestão da plataforma · dados do Supabase</p><button className="outline" onClick={()=>void load()} disabled={busy}>Atualizar</button></div>
 {section==='Indicadores administrativos'&&<><div className="ep-admin-cards"><div className="panel"><small>Receita confirmada no mês</small><h2>{brl(monthRevenue)}</h2></div><div className="panel"><small>Contas ativas</small><h2>{active.length}</h2></div><div className="panel"><small>Contas desativadas</small><h2>{accounts.filter(a=>!a.account_enabled).length}</h2></div><div className="panel"><small>Contas cadastradas</small><h2>{accounts.length}</h2></div></div><div className="ep-admin-charts"><section className="panel"><h3>Evolução de contas cadastradas</h3>{chart(months6.map(m=>accounts.filter(a=>a.created_at?.slice(0,7)<=m).length))}</section><section className="panel"><h3>Evolução das receitas recebidas</h3>{chart(months6.map(m=>payments.filter(p=>p.paid_at?.slice(0,7)===m).reduce((n,p)=>n+p.amount_cents,0)/100),true)}</section></div><section className="panel"><h3>Quantidade de usuários por plano</h3>{Array.from(new Set([...plans.map(p=>p.name),'free','pro'])).map(name=><p key={name}>{name}: <strong>{accounts.filter(a=>a.plan===name).length}</strong></p>)}</section></>}
 {section==='Gestão de contas'&&<section className="panel"><h2>Contas cadastradas</h2><label>Pesquisar por nome ou e-mail<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar conta"/></label><div className="ep-admin-table"><table><thead><tr><th>Conta</th><th>Plano financeiro</th><th>Validade</th><th>Status</th><th>Ações</th></tr></thead><tbody>{accounts.filter(a=>(a.email+' '+a.full_name).toLowerCase().includes(search.toLowerCase())).map(a=><tr key={a.id}><td>{a.full_name||'Sem nome'}<small style={{display:'block'}}>{a.email}</small></td><td><select aria-label="Plano da conta" value={a.plan} disabled={busy} onChange={e=>void updateAccount(a.id,{plan:e.target.value})}><option value="free">Free</option><option value="pro">Pro (legado)</option>{plans.filter(p=>p.active||p.name===a.plan).map(p=><option key={p.id} value={p.name}>{p.name}</option>)}</select></td><td><input type="date" aria-label="Validade do plano" disabled={busy} value={a.pro_expires_at?.slice(0,10)||''} onChange={e=>void updateAccount(a.id,{pro_expires_at:e.target.value?new Date(e.target.value+'T23:59:59').toISOString():null})}/></td><td>{!a.account_enabled?'Desativada':a.pro_expires_at&&new Date(a.pro_expires_at)<=now?'Vencida':'Ativa'}</td><td><button className="outline" disabled={busy} onClick={()=>{if(window.confirm(a.account_enabled?'Desativar esta conta?':'Ativar esta conta?'))void updateAccount(a.id,{account_enabled:!a.account_enabled})}}>{a.account_enabled?'Desativar':'Ativar'}</button></td></tr>)}</tbody></table></div><p className="hint">Plano financeiro e modo de utilização do administrador são independentes. Para testar bloqueios, altere o modo em Configurações administrativas. Alterações financeiras são salvas imediatamente e não representam confirmação de pagamento.</p></section>}
 {section==='Gestão de contas'&&<section className="panel"><h2>Solicitações de assinatura</h2><p className="hint">Confirme somente pagamentos efetivamente recebidos. A confirmação ativa ou prorroga o acesso Pro a partir da data de pagamento.</p>{requests.filter(r=>r.status==='pending').length===0?<p>Nenhuma solicitação pendente.</p>:requests.filter(r=>r.status==='pending').map(r=><div className="ep-admin-plan" key={r.id}><span><strong>{r.email||r.account_id}</strong><small style={{display:'block'}}>{r.plan_name} · {brl(r.amount_cents/100)} · {adminDate(r.requested_at)}</small></span><div><button className="primary" disabled={busy} onClick={async()=>{if(!supabase||!window.confirm('O pagamento foi efetivamente recebido?'))return;setBusy(true);const result=await supabase.rpc('eletripro_admin_confirm_subscription',{p_request_id:r.id});if(result.error)setError(result.error.message);await load();setBusy(false)}}>Confirmar pagamento</button> <button className="outline" disabled={busy} onClick={async()=>{if(!supabase||!window.confirm('Rejeitar esta solicitação?'))return;setBusy(true);const result=await supabase.rpc('eletripro_admin_reject_subscription',{p_request_id:r.id});if(result.error)setError(result.error.message);await load();setBusy(false)}}>Rejeitar</button></div></div>)}</section>}
 {section==='Configurações administrativas'&&<><section className="panel"><h2>Modo de utilização dos administradores</h2><p className="hint">Somente administradores podem receber estes modos de teste. A alteração afeta a área profissional, mas não retira o acesso às abas administrativas.</p>{accounts.filter(a=>a.is_admin).map(a=><div className="ep-admin-plan" key={a.id}><span><strong>{a.full_name||a.email}</strong><small style={{display:'block'}}>{a.email}</small></span><label>Modo de acesso<select disabled={busy} value={a.admin_access_mode||'free'} onChange={e=>void updateAccount(a.id,{admin_access_mode:e.target.value})}><option value="free">Free — testar limites e bloqueios</option><option value="pro_isento">Pro Isento — todos os recursos, sem cobrança</option></select></label></div>)}</section><section className="panel"><h2>{editingPlan?'Editar plano':'Cadastrar plano'}</h2><form onSubmit={savePlan} className="form"><label>Nome do plano<input required value={planName} onChange={e=>setPlanName(e.target.value)}/></label><label>Valor (R$)<input required inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)} placeholder="49,90"/></label><label>Frequência de cobrança<select value={months} onChange={e=>setMonths(e.target.value)}><option value="1">Mensal</option><option value="3">Trimestral</option><option value="6">Semestral</option><option value="12">Anual</option></select></label><button className="primary" disabled={busy}>Salvar plano</button>{editingPlan&&<button type="button" className="outline" onClick={()=>{setEditingPlan(null);setPlanName('');setPrice('')}}>Cancelar edição</button>}</form></section><section className="panel"><h2>Planos cadastrados</h2>{plans.map(p=><div className="ep-admin-plan" key={p.id}><span><strong>{p.name}</strong> · {brl(p.price_cents/100)} / {({1:'mês',3:'trimestre',6:'semestre',12:'ano'} as Record<number,string>)[p.billing_months]} · {p.active?'Ativo':'Inativo'}</span><div><button className="outline" onClick={()=>{setEditingPlan(p.id);setPlanName(p.name);setPrice((p.price_cents/100).toFixed(2).replace('.',','));setMonths(String(p.billing_months))}}>Editar</button> <button className="outline" disabled={busy} onClick={async()=>{if(!supabase)return;setBusy(true);const r=await supabase.rpc('eletripro_admin_save_plan',{p_id:p.id,p_name:p.name,p_price_cents:p.price_cents,p_billing_months:p.billing_months,p_active:!p.active});if(r.error)setError(r.error.message);else{await load();window.dispatchEvent(new Event('eletripro-plans-changed'))}setBusy(false)}}>{p.active?'Desativar':'Ativar'}</button></div></div>)}</section></>}
 </div>
}
const ELETRIPRO_TERMS_VERSION='2026-11-23';
function EletriProTerms({onClose}:{onClose:()=>void}){
const sections=[
["1. Apresentação e objeto","O EletriPro é uma plataforma digital de apoio à gestão de serviços de eletricidade, incluindo cadastro de clientes, projetos, estimativas de dimensionamento, manutenção, listas de materiais, orçamentos, relatórios e ferramentas administrativas. As funcionalidades disponíveis variam conforme o plano contratado e podem ser aprimoradas ao longo do tempo."],
["2. Adesão, elegibilidade e cadastro","Ao criar uma conta, o usuário declara ter capacidade legal para contratar, fornecer informações verdadeiras, completas e atualizadas e aceitar estes termos. Os campos indicados como obrigatórios devem ser preenchidos, inclusive quando o acesso ocorrer por provedores externos, como o Google. O acesso inicial é concedido no plano Free, sujeito aos limites apresentados na plataforma."],
["3. Conta, autenticação e segurança","A conta é pessoal. O usuário deve proteger suas credenciais, não compartilhar acesso indevidamente e comunicar suspeitas de uso não autorizado. A autenticação por terceiros está sujeita também às regras desses provedores. O EletriPro poderá restringir acessos em caso de indícios de fraude, violação destes termos ou riscos à segurança, respeitada a legislação aplicável."],
["4. Uso técnico e responsabilidade profissional","Cálculos, sugestões de cabos, disjuntores, proteções, demanda, distribuição de fases e relatórios são ferramentas de apoio e dependem da qualidade e integridade dos dados informados. Não constituem laudo, aprovação automática de projeto, ART ou substituição de inspeção presencial. O usuário é responsável por verificar condições reais de instalação, normas técnicas aplicáveis, inclusive ABNT NBR 5410 quando pertinente, exigências da concessionária, legislação e necessidade de profissional legalmente habilitado. Nenhuma recomendação automática deve ser executada sem validação técnica."],
["5. Informações de clientes e terceiros","Ao inserir nomes, telefones, endereços, documentos ou informações técnicas de clientes e terceiros, o usuário declara possuir fundamento legal adequado para o tratamento desses dados e compromete-se a utilizá-los apenas para finalidades legítimas. É sua responsabilidade evitar inclusão excessiva de informações, controlar o acesso e respeitar direitos dos titulares."],
["6. Planos, preços e funcionalidades","O plano Free possui limites de utilização. Os planos pagos concedem acesso às funcionalidades descritas na oferta vigente no momento da contratação. Valores, duração, recursos e eventuais condições promocionais são informados antes da confirmação. Alterações de preço não modificam retroativamente períodos já pagos, ressalvadas hipóteses previstas em lei."],
["7. Pagamentos, ativação e renovação","Pagamentos podem ser processados por provedores externos, como o Mercado Pago, conforme os meios oferecidos no checkout. O acesso pago é liberado após confirmação efetiva do pagamento. Em regra, o período contratado começa na confirmação; se houver assinatura paga ainda vigente, a renovação antecipada acrescenta o novo período ao vencimento existente, conforme a oferta. Não há cobrança recorrente automática sem contratação e autorização expressas. Parcelamentos, taxas e disponibilidade de meios de pagamento dependem das condições apresentadas no checkout."],
["8. Cancelamento, arrependimento e reembolso","O usuário poderá deixar de renovar sua assinatura. Solicitações de cancelamento, arrependimento e reembolso serão analisadas conforme o Código de Defesa do Consumidor e demais normas aplicáveis, inclusive o direito de arrependimento nas contratações realizadas fora do estabelecimento comercial, quando cabível. O exercício de direitos legais não poderá ser afastado por estes termos. Os canais de atendimento deverão ser disponibilizados pelo responsável pela plataforma."],
["9. Privacidade e proteção de dados","Dados de identificação, contato, cadastro profissional, autenticação, uso da plataforma e registros de pagamentos são tratados para disponibilizar o serviço, administrar contas, cumprir obrigações legais, prevenir fraudes e atender solicitações. Serviços de infraestrutura e pagamento podem atuar como operadores ou controladores independentes conforme suas atividades. O tratamento deverá observar a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), incluindo segurança, transparência, necessidade e direitos dos titulares. Informações adicionais, prazos de retenção e canais para solicitações devem constar de aviso de privacidade próprio."],
["10. Documentos, conteúdo e propriedade intelectual","Os dados, projetos, orçamentos e relatórios inseridos ou produzidos pelo usuário permanecem sob sua responsabilidade, respeitados os direitos de terceiros. A plataforma, sua marca, código, interface e recursos são protegidos pela legislação aplicável. O usuário recebe autorização limitada de uso, sem transferência de propriedade intelectual."],
["11. Condutas proibidas","É proibido utilizar o EletriPro para fraude, violação de direitos de terceiros, acesso não autorizado, exploração de vulnerabilidades, distribuição de conteúdo malicioso ou manipulação de pagamentos e permissões. Também é vedado apresentar resultados automáticos como certificações técnicas sem a validação profissional exigida."],
["12. Disponibilidade, atualizações e limitações","O serviço poderá passar por manutenção, indisponibilidade temporária e atualizações de segurança ou funcionalidades. Serão adotadas medidas razoáveis para preservar a integridade do sistema e dos registros. A plataforma não garante funcionamento ininterrupto nem elimina a obrigação de conferência técnica das informações geradas. Nada nesta cláusula exclui responsabilidades que não possam ser afastadas por lei."],
["13. Alterações dos termos","Mudanças relevantes serão informadas por meios adequados. Quando exigido pela legislação ou quando houver alteração material das condições, poderá ser solicitado novo aceite. A versão e a data de vigência deverão ser identificáveis."],
["14. Atendimento e solução de controvérsias","Dúvidas, solicitações de privacidade, cancelamentos e reclamações deverão ser encaminhadas aos canais oficiais informados pelo responsável pelo EletriPro. Aplicam-se a legislação brasileira e as regras de proteção ao consumidor, inclusive quanto ao foro competente."],
["15. Declaração de aceite","Ao selecionar a caixa de concordância, o usuário confirma que teve oportunidade de ler este documento, compreendeu suas condições e aceita o Termo de Adesão e Uso identificado pela versão indicada abaixo. O aceite não substitui consentimentos específicos quando estes forem legalmente necessários."]
];
return <div className="ep-terms-backdrop" role="presentation"><section className="ep-terms-dialog" role="dialog" aria-modal="true" aria-labelledby="ep-terms-title"><div className="ep-terms-heading"><span className="ep-terms-kicker">ELETRIPRO • CONDIÇÕES DE UTILIZAÇÃO</span><h2 id="ep-terms-title">Termo de Adesão e Uso</h2><p>Leia atentamente as condições de acesso, utilização técnica, contratação e proteção de dados.</p><small>Versão {ELETRIPRO_TERMS_VERSION} • Legislação brasileira</small></div><div className="ep-terms-content">{sections.map(([heading,body])=><section className="ep-terms-section" key={heading}><h3>{heading}</h3><p>{body}</p></section>)}<p className="ep-terms-note"><strong>Informação importante:</strong> este termo deve ser acompanhado de identificação do responsável legal pela plataforma, canais de suporte e aviso de privacidade antes de sua adoção definitiva.</p></div><div className="ep-terms-actions"><button type="button" className="primary" onClick={onClose}>Fechar</button></div></section></div>}

function GoogleMark(){return <svg className="ep-google-mark" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.03 46.98 31.88 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.88 23.88 0 0 0 0 24c0 3.87.93 7.51 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.92-2.13 15.89-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z"/></svg>}
function App(){const[session,setSession]=useState<any>(null),[email,setEmail]=useState(()=>localStorage.getItem('ep_remember_email')||''),[password,setPassword]=useState(''),[mode,setMode]=useState<'login'|'signup'>('login'),[msg,setMsg]=useState(''),[tab,setTab]=useState(()=>sessionStorage.getItem('ep_active_tab')||'Painel'),[menu,setMenu]=useState(false),[clients,setClients]=useState<Client[]>([]),[plan,setPlan]=useState('free'),[financialPlan,setFinancialPlan]=useState('free'),[planLabel,setPlanLabel]=useState('Free'),[planExpires,setPlanExpires]=useState<string|null>(null),[name,setName]=useState(''),[phone,setPhone]=useState(''),[clientEmail,setClientEmail]=useState(''),[editing,setEditing]=useState<string|null>(null),[loading,setLoading]=useState(false),[professional,setProfessional]=useState(localStorage.getItem('ep_professional')||''),[accent,setAccent]=useState(localStorage.getItem('ep_accent')||'#a3a3a3'),[logo,setLogo]=useState(localStorage.getItem('ep_logo')||''),[fullName,setFullName]=useState(''),[mobile,setMobile]=useState(''),[cpf,setCpf]=useState(''),[birth,setBirth]=useState(''),[street,setStreet]=useState(''),[number,setNumber]=useState(''),[complement,setComplement]=useState(''),[neighborhood,setNeighborhood]=useState(''),[city,setCity]=useState(''),[state,setState]=useState(''),[document,setDocument]=useState<File|null>(null),[logoFile,setLogoFile]=useState<File|null>(null),[logoPath,setLogoPath]=useState(''),[accountMenu,setAccountMenu]=useState(false),[profileLoaded,setProfileLoaded]=useState(false),[profileError,setProfileError]=useState(''),[isAdmin,setIsAdmin]=useState(false),[adminAccessMode,setAdminAccessMode]=useState<'free'|'pro_isento'>('free'),[availablePlans,setAvailablePlans]=useState<AdminPlan[]>([]),[subscriptionRequests,setSubscriptionRequests]=useState<SubscriptionRequest[]>([]),[subscriptionBusy,setSubscriptionBusy]=useState(false);const[paymentHistory,setPaymentHistory]=useState<PaymentHistoryItem[]>([]),[paymentHistoryError,setPaymentHistoryError]=useState(''),[paymentStatusNotice,setPaymentStatusNotice]=useState(''),[paymentHistoryBusy,setPaymentHistoryBusy]=useState(false),[checkingPaymentId,setCheckingPaymentId]=useState<string|null>(null);const[freeCreatesUsed,setFreeCreatesUsed]=useState(0),[freeEditsUsed,setFreeEditsUsed]=useState(0),[clientFormOpen,setClientFormOpen]=useState(false);const[checkoutPlan,setCheckoutPlan]=useState<AdminPlan|null>(null);const[termsAccepted,setTermsAccepted]=useState(false),[termsOpen,setTermsOpen]=useState(false),[registrationComplete,setRegistrationComplete]=useState(false),[registrationBusy,setRegistrationBusy]=useState(false);
 useEffect(()=>{sessionStorage.setItem('ep_active_tab',tab)},[tab]);

 const [historyExpanded,setHistoryExpanded]=useState(false);
 const [rememberEmail,setRememberEmail]=useState(()=>Boolean(localStorage.getItem('ep_remember_email')));
 const [showPassword,setShowPassword]=useState(false);
 useEffect(()=>{if(rememberEmail&&email.trim())localStorage.setItem('ep_remember_email',email.trim());else if(!rememberEmail)localStorage.removeItem('ep_remember_email')},[rememberEmail,email]);
 const [workflows,setWorkflows]=useState<WorkflowRow[]>([]);
 const [workflowClient,setWorkflowClient]=useState<Client|null>(null);
 const [workflowStatus,setWorkflowStatus]=useState<WorkStatus>('awaiting');
 const [workflowBudget,setWorkflowBudget]=useState('');
 const [workflowStart,setWorkflowStart]=useState('');
 const [calendarMonth,setCalendarMonth]=useState(()=>new Date().toISOString().slice(0,7));
 const [clientLocation,setClientLocation]=useState('');
 const [clientSearch,setClientSearch]=useState('');
 const [nextClientAction,setNextClientAction]=useState<{id:string;name:string}|null>(null);
 const [workflowChoices,setWorkflowChoices]=useState<BudgetChoice[]>([]);
 const [workflowBusy,setWorkflowBusy]=useState(false);
 const [workflowLoading,setWorkflowLoading]=useState(false);
 const [showEarnings,setShowEarnings]=useState(false);
 const [budgetItems,setBudgetItems]=useState<BudgetItem[]>([]);
 const [activeClientId,setActiveClientId]=useState<string|null>(()=>sessionStorage.getItem('ep_active_client_id')||null);
 const [reportMaintenanceMode,setReportMaintenanceMode]=useState(()=>sessionStorage.getItem('ep_maintenance_mode')==='true');
 const [clientAreaTab,setClientAreaTab]=useState(()=>sessionStorage.getItem('ep_client_area_tab')||'Tipo de instalação');
 useEffect(()=>{if(activeClientId)sessionStorage.setItem('ep_active_client_id',activeClientId);else sessionStorage.removeItem('ep_active_client_id');sessionStorage.setItem('ep_maintenance_mode',String(reportMaintenanceMode));sessionStorage.setItem('ep_client_area_tab',clientAreaTab)},[activeClientId,reportMaintenanceMode,clientAreaTab]);
 const budgetLoadedFor=React.useRef<string|null>(null);
 const clientAreaTabs=['Manutenção','Tipo de instalação','Ambientes','Dimensionamento','Quadro de distribuição','Materiais','Orçamento','Relatórios'];
 const clientAreaOpen=clientAreaTabs.includes(tab);
 const activeClient=clients.find(c=>c.id===activeClientId);
 const clientStorageKey=(suffix:string)=>`eletripro-client-${session?.user?.id||'anon'}-${activeClientId||'none'}-${suffix}`;
 const openMaintenance=(id:string)=>{setReportMaintenanceMode(true);setActiveClientId(id);setClientAreaTab('Manutenção');setTab('Manutenção');setMenu(false);setAccountMenu(false);setMsg('')};
 const openClient=(id:string)=>{setReportMaintenanceMode(false);setActiveClientId(id);setClientAreaTab('Tipo de instalação');setTab('Tipo de instalação');setMenu(false);setAccountMenu(false);setMsg('')};
 const [manualDescription,setManualDescription]=useState(''),[manualUnit,setManualUnit]=useState('un'),[manualQty,setManualQty]=useState('1'),[manualPrice,setManualPrice]=useState('0');
 const addManualBudgetItem=()=>{const desc=manualDescription.trim();const qty=Number(manualQty),price=Number(manualPrice);if(!desc||!Number.isFinite(qty)||qty<=0||!Number.isFinite(price)||price<0)return;setBudgetItems(old=>[...old,{id:'manual-'+Date.now()+'-'+Math.random().toString(36).slice(2),description:desc,unit:manualUnit,quantity:qty,unitPrice:price}]);setManualDescription('');setManualQty('1');setManualPrice('0')};
 const [installationSettings,setInstallationSettings]=useState<InstallationSettings>(readInstallation);
 const [supplyCircuits,setSupplyCircuits]=useState<SavedCircuit[]>([]);
 const [supplyRooms,setSupplyRooms]=useState<SavedEnvironment[]>([]);
 const [supplyLoaded,setSupplyLoaded]=useState(false);
 const autoSupply=celescAutomaticSupply(supplyCircuits,installationSettings,supplyRooms);
 const effectiveInstallation:InstallationSettings=autoSupply.supply?{...installationSettings,supply:autoSupply.supply}:installationSettings;
 const supplyReady=supplyLoaded&&Boolean(autoSupply.supply)&&!autoSupply.requiresTechnicalReview;
 const supplyRevision=supplyCircuits.map(c=>[c.id,c.data.power,c.data.powerVA,c.data.pf,c.data.panelPoles,c.data.poles,c.data.results?.poles].join(':')).sort().join('|')+'-'+supplyRooms.map(r=>[r.id,JSON.stringify(r.data)].join(':')).sort().join('|')+'-'+autoSupply.supply;
 useEffect(()=>{let active=true;setSupplyLoaded(false);setSupplyCircuits([]);setSupplyRooms([]);
  if(!activeClientId||!session?.user?.id||!supabase)return;
  void(async()=>{try{const id=await ensureEletriProject(activeClientId,session.user.id);const [r,er]=await Promise.all([supabase.from('eletripro_circuits').select('id,title,data').eq('project_id',id),supabase.from('eletripro_environments').select('id,title,data').eq('project_id',id)]);if(active){if(r.error||er.error){setSupplyCircuits([]);setSupplyRooms([]);setMsg('Erro ao atualizar as cargas: '+(r.error||er.error)?.message)}else{setSupplyCircuits((r.data||[]) as SavedCircuit[]);setSupplyRooms((er.data||[]) as SavedEnvironment[])}}}finally{if(active)setSupplyLoaded(true)}})();
  return()=>{active=false};
 },[activeClientId,session?.user?.id,tab]);

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
 const addSizingToBudget=(items:BudgetItem[])=>{setBudgetItems(prev=>[...prev,...items]);navigate('Materiais');setMsg('Itens adicionados ao rascunho local. Para sincronizá-los, use Importar itens do orçamento local em Materiais/Orçamentos.');};
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
useEffect(()=>{let cancelled=false;if(!session?.user?.id||!supabase){setIsAdmin(false);setAdminAccessMode('free');return}supabase.rpc('eletripro_admin_my_access').then(({data,error})=>{if(!cancelled){setIsAdmin(!error&&data?.is_admin===true);setAdminAccessMode(!error&&data?.is_admin===true&&data?.access_mode==='pro_isento'?'pro_isento':'free')}});return()=>{cancelled=true}},[session?.user?.id]);
useEffect(()=>{if(!session?.user?.id||!supabase)return;let cancelled=false;const load=async()=>{const [p,r]=await Promise.all([supabase!.rpc('eletripro_public_plans'),supabase!.rpc('eletripro_my_subscription_requests')]);if(!cancelled){if(!p.error)setAvailablePlans(p.data||[]);else setMsg('Não foi possível carregar os planos cadastrados: '+p.error.message);if(!r.error)setSubscriptionRequests(r.data||[])}};void load();window.addEventListener('eletripro-plans-changed',load);window.addEventListener('focus',load);return()=>{cancelled=true;window.removeEventListener('eletripro-plans-changed',load);window.removeEventListener('focus',load)}},[session?.user?.id,tab]);
useEffect(()=>{if(!session?.user?.id||!supabase)return;const reload=()=>{supabase!.rpc('eletripro_admin_my_access').then(({data,error})=>{if(!error&&data?.is_admin){setAdminAccessMode(data.access_mode==='pro_isento'?'pro_isento':'free')}})};window.addEventListener('eletripro-admin-mode-changed',reload);return()=>window.removeEventListener('eletripro-admin-mode-changed',reload)},[session?.user?.id]);
useEffect(()=>{if(tab==='Assinatura'&&session?.user?.id)void loadPaymentHistory()},[tab,session?.user?.id]);
useEffect(()=>{if(!session?.user?.id)return;const reload=()=>{void refresh()};window.addEventListener('eletripro-profile-changed',reload);return()=>window.removeEventListener('eletripro-profile-changed',reload)},[session?.user?.id]);
useEffect(()=>{if(session&&supabase){setProfileLoaded(false);setProfileError('');void refresh().catch(e=>{setProfileError(e instanceof Error?e.message:String(e));setProfileLoaded(true)})}else {setProfileLoaded(false);setProfileError('');setLogo('');setLogoPath('');setProfessional('');setAccent('#a3a3a3')}},[session?.user?.id]);
async function loadWorkflows(){
 if(!supabase||!session?.user?.id)return;
 const r=await supabase.from('eletripro_client_workflow').select('client_id,status,budget_id,completed_at,amount,planned_start_date').eq('owner_id',session.user.id);
 if(r.error){setMsg('Indicadores indisponíveis: '+r.error.message+'. Execute o SQL da versão 0.7.30.');return}
 setWorkflows((r.data||[]).map(x=>({...x,amount:Number(x.amount||0)})) as WorkflowRow[]);
}
async function openWorkflow(client:Client){
 if(!supabase)return;
 const saved=workflows.find(x=>x.client_id===client.id);
 setWorkflowClient(client);setWorkflowStatus(saved?.status||'awaiting');setWorkflowBudget(saved?.budget_id||'');setWorkflowStart(saved?.planned_start_date||'');
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
 if(['approved','in_progress'].includes(workflowStatus)&&!workflowStart){setMsg('Informe a data prevista de início para serviços aprovados ou em execução.');return}
 if(workflowStatus==='finished'&&!budget){setMsg('Selecione um orçamento para registrar o ganho da execução.');return}
 if(workflowStatus==='finished'&&prev?.status==='finished'&&prev.budget_id!==workflowBudget&&!window.confirm('Alterar o orçamento de um serviço já finalizado atualizará o valor financeiro registrado. Continuar?'))return;
 if(prev?.status==='finished'&&workflowStatus!=='finished'&&!window.confirm('Retirar o status Finalizado removerá esse ganho dos indicadores. Continuar?'))return;
 setWorkflowBusy(true);
 const completedAt=workflowStatus==='finished'?(prev?.status==='finished'&&prev.completed_at?prev.completed_at:new Date().toISOString()):null;
 const payload={client_id:workflowClient.id,owner_id:session.user.id,status:workflowStatus,budget_id:workflowStatus==='finished'?budget!.id:null,amount:workflowStatus==='finished'?budget!.amount:0,completed_at:completedAt,planned_start_date:['approved','in_progress'].includes(workflowStatus)?workflowStart:null};
 const r=await supabase.from('eletripro_client_workflow').upsert(payload,{onConflict:'client_id'});
 setWorkflowBusy(false);
 if(r.error){setMsg('Erro ao salvar andamento: '+r.error.message);return}
 setWorkflowClient(null);await loadWorkflows();setMsg('Situação do cliente atualizada.');
}
async function loadPaymentHistory(){
 if(!supabase||!session?.user?.id)return;
 setPaymentHistoryBusy(true);
 const {data,error}=await supabase.from('eletripro_payment_intents')
  .select('id,plan_name,amount_cents,payment_method,status,created_at,subscription_applied_at,subscription_expires_at,payment_provider,mercado_pago_order_id')
  .eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(30);
 setPaymentHistoryBusy(false);
 if(error){setPaymentHistoryError('Não foi possível carregar o histórico: '+error.message);return}
 setPaymentHistoryError('');setPaymentHistory((data||[]) as PaymentHistoryItem[]);
}
async function checkPaymentStatus(intentId:string){
 if(!supabase||checkingPaymentId)return;
 const item=paymentHistory.find(h=>h.id===intentId);
 if(!item||item.payment_provider!=='orders_api'||!item.mercado_pago_order_id||/^ORDTST/i.test(item.mercado_pago_order_id)){
  setPaymentStatusNotice('Esta operação é um registro de teste antigo e não pode ser consultada na API de produção. Nenhuma cobrança foi gerada.');
  return;
 }
 setCheckingPaymentId(intentId);setPaymentStatusNotice('Consultando o Mercado Pago...');
 try{
  const {data,error}=await supabase.functions.invoke('eletripro-payment-status-orders',{body:{intent_id:intentId}});
  if(error){
   const status=error?.context?.status;
   setPaymentStatusNotice(status===503?'Consulta de produção temporariamente indisponível (HTTP 503). O pagamento e a assinatura não foram alterados.':`Não foi possível consultar o pagamento${status?' (HTTP '+status+')':''}: ${error.message}`);
  }else{
   const status=String(data?.status||'desconhecido');
   setPaymentStatusNotice(`Consulta concluída. Situação: ${({approved:'aprovado',pending:'pendente',in_process:'em processamento',expired:'expirado',rejected:'rejeitado',cancelled:'cancelado',refunded:'reembolsado'} as Record<string,string>)[status]||status}. ${data?.applied?'Assinatura já aplicada.':'Nenhuma nova ativação realizada.'}`);
  }
  await loadPaymentHistory();await refresh();
 }catch(e){setPaymentStatusNotice('Falha na consulta: '+(e instanceof Error?e.message:String(e)))}
 finally{setCheckingPaymentId(null)}
}
async function refresh(){if(!supabase)return;const[{data:cs,error:ce},{data:profile}]=await Promise.all([supabase.from('clients').select('id,name,email,phone,location,edit_count').order('created_at',{ascending:false}),supabase.from('profiles').select('plan,pro_expires_at,free_client_creates_used,free_client_edits_used').single()]);if(ce)setMsg(ce.message);setClients(cs||[]);if(activeClientId&&!(cs||[]).some(c=>c.id===activeClientId)){setActiveClientId(null);if(clientAreaTabs.includes(tab))setTab('Clientes')}setFreeCreatesUsed(Number(profile?.free_client_creates_used||0));setFreeEditsUsed(Number(profile?.free_client_edits_used||0));setPlan(profile?.plan&&profile.plan!=='free'&&profile?.pro_expires_at&&new Date(profile.pro_expires_at)>new Date()?'pro':'free');setFinancialPlan(profile?.plan||'free');setPlanLabel(profile?.plan||'Free');setPlanExpires(profile?.pro_expires_at||null);await loadAccount();await loadWorkflows()}
function startMercadoPagoCheckout(planId:string){
 const selected=availablePlans.find(p=>p.id===planId&&p.active);
 if(!selected){setMsg('Plano indisponível. Atualize a página.');return}
 if(!session?.user?.id){setMsg('Entre na sua conta para assinar.');return}
 setCheckoutPlan(selected);
}
async function auth(){if(!supabase)return;setLoading(true);setMsg('');if(mode==='signup'&&!termsAccepted){setMsg('Leia e aceite o Termo de Adesão para criar sua conta.');setLoading(false);return;}if(mode==='signup'&&(!fullName.trim()||cpf.replace(/\D/g,'').length!==11||!birth||mobile.replace(/\D/g,'').length!==11||!street.trim()||!number.trim()||!neighborhood.trim()||!city.trim()||!state||!email.trim()||!password)){setMsg('Preencha os campos obrigatórios e informe um celular com DDD e 11 dígitos. Complemento e documento são opcionais.');setLoading(false);return}const{error}=mode==='login'?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password,options:{data:{full_name:fullName,phone_contact:mobile.replace(/\D/g,''),cpf:cpf.replace(/\D/g,''),birth_date:birth,street,street_number:number,address_complement:complement,neighborhood,city,state_code:state,terms_accepted_at:new Date().toISOString(),terms_version:ELETRIPRO_TERMS_VERSION}}});setLoading(false);setMsg(error?.message||(mode==='signup'?'Conta solicitada. Confirme seu e-mail. Os dados serão validados ao primeiro acesso.':''))}

async function loadAccount(){if(!supabase||!session?.user?.id)return;const uid=session.user.id;
 const [{data:b,error:be},{data:d,error:de}]=await Promise.all([supabase.from('branding').select('professional_name,accent_color,logo_path').eq('user_id',uid).maybeSingle(),supabase.from('electrician_details').select('full_name,cpf,birth_date,phone,street,street_number,address_complement,neighborhood,city,state_code').eq('user_id',uid).maybeSingle()]);
 if(be||de){setProfileError(be?.message||de?.message||'Erro ao carregar perfil');setProfileLoaded(true);return}setProfileError('');
 setProfessional(b?.professional_name||'');setAccent(b?.accent_color||'#a3a3a3');setLogoPath(b?.logo_path||'');
 if(b?.logo_path){const {data,error}=await supabase.storage.from('eletripro-logos').createSignedUrl(b.logo_path,3600);if(!error&&data)setLogo(data.signedUrl)}else setLogo('');
 setFullName(d?.full_name||session.user.user_metadata?.full_name||'');setCpf(d?.cpf||session.user.user_metadata?.cpf||'');setBirth(d?.birth_date||session.user.user_metadata?.birth_date||'');setMobile(formatMobile(d?.phone||session.user.user_metadata?.phone_contact||''));setStreet(d?.street||session.user.user_metadata?.street||'');setNumber(d?.street_number||session.user.user_metadata?.street_number||'');setComplement(d?.address_complement||session.user.user_metadata?.address_complement||'');setNeighborhood(d?.neighborhood||session.user.user_metadata?.neighborhood||'');setCity(d?.city||session.user.user_metadata?.city||'');setState(d?.state_code||session.user.user_metadata?.state_code||'');setRegistrationComplete(Boolean(d?.full_name?.trim()&&/^\d{11}$/.test(d?.cpf||'')&&d?.birth_date&&/^\d{11}$/.test(d?.phone||'')&&d?.street?.trim()&&d?.street_number?.trim()&&d?.neighborhood?.trim()&&d?.city?.trim()&&d?.state_code));setProfileLoaded(true)
}
async function finishRegistration(e:React.FormEvent){
 e.preventDefault();if(!supabase||!session)return;
 const digits=mobile.replace(/\D/g,'');const cpfDigits=cpf.replace(/\D/g,'');
 if(!termsAccepted){setMsg('Leia e aceite o Termo de Adesão.');return}
 if(!fullName.trim()||cpfDigits.length!==11||!birth||digits.length!==11||!street.trim()||!number.trim()||!neighborhood.trim()||!city.trim()||!state){setMsg('Preencha todos os dados obrigatórios. Complemento e documento são opcionais.');return}
 setRegistrationBusy(true);setMsg('');
 const {error}=await supabase.rpc('eletripro_complete_registration',{p_full_name:fullName.trim(),p_cpf:cpfDigits,p_birth_date:birth,p_phone:digits,p_street:street.trim(),p_street_number:number.trim(),p_address_complement:complement.trim(),p_neighborhood:neighborhood.trim(),p_city:city.trim(),p_state_code:state,p_terms_version:ELETRIPRO_TERMS_VERSION});
 setRegistrationBusy(false);if(error){setMsg('Não foi possível concluir o cadastro: '+error.message);return}
 setRegistrationComplete(true);setMsg('Cadastro concluído. Bem-vindo ao EletriPro!');await refresh();
}
async function saveProfile(e:React.FormEvent){e.preventDefault();if(!supabase||!session)return;const digits=mobile.replace(/\D/g,'');if(digits&&digits.length!==11){setMsg('Telefone deve conter DDD e 9 dígitos.');return}if(cpf.replace(/\D/g,'').length!==11||!fullName.trim()||!birth||!street.trim()||!number.trim()||!neighborhood.trim()||!city.trim()||!state||digits.length!==11){setMsg('Preencha todos os campos obrigatórios do perfil.');return}setLoading(true);setMsg('');const {error}=await supabase.from('electrician_details').upsert({user_id:session.user.id,full_name:fullName.trim()||null,cpf:cpf.replace(/\D/g,'')||null,birth_date:birth||null,phone:digits||null,street:street||null,street_number:number||null,address_complement:complement||null,neighborhood:neighborhood||null,city:city||null,state_code:state||null},{onConflict:'user_id'});setLoading(false);setMsg(error?error.message:'Dados pessoais salvos no Supabase.')}

 async function google(){if(!supabase)return;setMsg('');if(!termsAccepted){setMsg('Para continuar com o Google, leia e aceite o Termo de Adesão.');return;}const{error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin,queryParams:{prompt:'select_account'}}});if(error)setMsg(error.message)}
 async function saveClient(e:React.FormEvent){e.preventDefault();if(!supabase)return;setMsg('');if(!name.trim()||!phone.trim()||!clientLocation.trim()){setMsg('Nome, telefone e local são obrigatórios.');return}setLoading(true);const payload={name:name.trim(),email:clientEmail.trim()||null,phone:phone.trim(),location:clientLocation.trim()};const result=editing?await supabase.from('clients').update(payload).eq('id',editing):await supabase.from('clients').insert(payload).select('id').single();setLoading(false);if(result.error){setMsg(result.error.message);return}if(!editing&&result.data?.id)setNextClientAction({id:result.data.id,name:payload.name});setName('');setPhone('');setClientEmail('');setClientLocation('');setEditing(null);setClientFormOpen(false);setMsg('Cliente salvo com sucesso.');await refresh()}
 function edit(c:Client){setClientFormOpen(true);setEditing(c.id);setName(c.name);setPhone(c.phone||'');setClientEmail(c.email||'');setClientLocation(c.location||'');document.getElementById('client-form')?.scrollIntoView({behavior:'smooth'})}
 async function deleteClient(c:Client){if(!supabase||!session?.user?.id||loading)return;if(!window.confirm(`Excluir definitivamente o cliente \"${c.name}\"? Os projetos, ambientes, circuitos, orçamentos e outros registros vinculados também poderão ser excluídos. Esta ação não pode ser desfeita.`))return;setLoading(true);setMsg('');try{const {data,error}=await supabase.from('clients').delete().eq('id',c.id).eq('owner_id',session.user.id).select('id');if(error)throw error;if(!data?.length)throw new Error('Cliente não excluído. Atualize a página e verifique se pertence à sua conta.');if(editing===c.id){setClientFormOpen(false);setEditing(null);setName('');setPhone('');setClientEmail('')}if(activeClientId===c.id){setActiveClientId(null);setTab('Clientes')}if(nextClientAction?.id===c.id)setNextClientAction(null);await refresh();setMsg('Cliente excluído com sucesso.')}catch(e){setMsg('Não foi possível excluir o cliente: '+(e instanceof Error?e.message:String(e)))}finally{setLoading(false)}}
 function navigate(t:string){if(clientAreaTabs.includes(t)&&activeClientId&&((reportMaintenanceMode&&!['Manutenção','Relatórios'].includes(t))||(!reportMaintenanceMode&&t==='Manutenção'))){return;}if(clientAreaTabs.includes(t)){if(!activeClientId){setTab('Clientes');setMsg('Abra um cliente para acessar suas abas.');return}setClientAreaTab(t)}setTab(t);setMenu(false);setAccountMenu(false);setMsg('')}
 async function saveBrand(){if(!supabase||!session)return;setLoading(true);setMsg('');let nextPath=logoPath;try{if(logoFile){const ext=logoFile.type==='image/png'?'png':logoFile.type==='image/webp'?'webp':'jpg';const path=`${session.user.id}/empresa-${Date.now()}.${ext}`;const {error:uploadError}=await supabase.storage.from('eletripro-logos').upload(path,logoFile,{contentType:logoFile.type,upsert:false});if(uploadError)throw uploadError;nextPath=path}const{error}=await supabase.from('branding').upsert({user_id:session.user.id,professional_name:professional.trim(),accent_color:accent,logo_path:nextPath||null},{onConflict:'user_id'});if(error)throw error;setLogoPath(nextPath);setLogoFile(null);if(nextPath){const{data}=await supabase.storage.from('eletripro-logos').createSignedUrl(nextPath,3600);if(data)setLogo(data.signedUrl)}setMsg('Identidade profissional salva no Supabase.')}catch(err){setMsg(err instanceof Error?err.message:'Não foi possível salvar a identidade profissional.')}finally{setLoading(false)}}
async function pickLogo(file?:File){if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2097152){setMsg('Use PNG, JPG ou WebP de até 2 MB.');return}setLogoFile(file);const r=new FileReader();r.onload=()=>setLogo(String(r.result));r.readAsDataURL(file)}
const countStatus=(status:WorkStatus)=>clients.filter(c=>(workflows.find(w=>w.client_id===c.id)?.status||'awaiting')===status).length;
const currentMonth=new Date().toISOString().slice(0,7);
const finishedRows=workflows.filter(w=>w.status==='finished'&&w.completed_at);
const earningsMonth=finishedRows.filter(w=>w.completed_at!.slice(0,7)===currentMonth).reduce((n,w)=>n+w.amount,0);
const earningsTotal=finishedRows.reduce((n,w)=>n+w.amount,0);
const monthlyEarnings=Object.entries(finishedRows.reduce((acc,w)=>{const key=w.completed_at!.slice(0,7);acc[key]=(acc[key]||0)+w.amount;return acc},{} as Record<string,number>)).sort((a,b)=>b[0].localeCompare(a[0]));
const isPro=isAdmin?adminAccessMode==='pro_isento':plan==='pro',canCreate=isPro||freeCreatesUsed<1,selected=clients.find(c=>c.id===editing),canEdit=isPro||freeEditsUsed<1;
const title=(t:string)=>sections.find(s=>s[0]===t)?.[1]||Zap;
const nav=sections.filter(([t])=>!clientAreaTabs.includes(t)).map(([t,Icon])=><button key={t} className={'nav-item '+(tab===t?'active':'')} onClick={()=>navigate(t)}><Icon size={19}/><span>{t}</span></button>);
if(!supabase)return <div className="center"><section className="auth-card"><div className="brand"><Zap/> EletriPro</div><h1>Configuração necessária</h1><p>Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para conectar o Supabase.</p></section></div>;
if(!session)return <div className="center"><section className="auth-card"><div className="brand"><Zap/> EletriPro</div><span className="eyebrow">PLATAFORMA PARA ELETRICISTAS</span><h1>{mode==='login'?'Bem-vindo de volta.':'Crie sua conta.'}</h1><p>Projetos, clientes e orçamentos em um só lugar.</p><button type="button" className="google ep-google-button" onClick={google}><GoogleMark/> Continuar com Google</button><div className="or">ou use seu e-mail</div>{mode==='signup'&&<><label>Nome completo<input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Seu nome"/></label><div className="two"><label>CPF<input value={cpf} onChange={e=>setCpf(e.target.value)} placeholder="000.000.000-00" inputMode="numeric"/></label><label>Nascimento<input type="date" value={birth} onChange={e=>setBirth(e.target.value)}/></label></div><label>Telefone celular (DDD + número)<input type="tel" inputMode="tel" autoComplete="tel-national" maxLength={15} value={mobile} onChange={e=>setMobile(formatMobile(e.target.value))} placeholder="(48) 99999-9999"/></label><label>Endereço<input autoComplete="address-line1" value={street} onChange={e=>setStreet(e.target.value)} placeholder="Rua, avenida ou servidão"/></label><div className="address-pair"><label>Número<input autoComplete="address-line2" value={number} onChange={e=>setNumber(e.target.value)} placeholder="Nº ou S/N"/></label><label>Complemento (opcional)<input value={complement} onChange={e=>setComplement(e.target.value)} placeholder="Apto, bloco, casa..."/></label></div><label>Bairro<input autoComplete="address-level3" value={neighborhood} onChange={e=>setNeighborhood(e.target.value)} placeholder="Seu bairro"/></label><div className="address-city-state"><label>Cidade<input autoComplete="address-level2" value={city} onChange={e=>setCity(e.target.value)} placeholder="Cidade"/></label><label>Estado (UF)<select autoComplete="address-level1" value={state} onChange={e=>setState(e.target.value)}><option value="">Selecione</option>{statesBR.map(uf=><option key={uf} value={uf}>{uf}</option>)}</select></label></div><label className="upload"><Upload size={17}/> {document?document.name:'Selecionar documento com foto'}<input type="file" accept="image/png,image/jpeg,application/pdf" onChange={e=>setDocument(e.target.files?.[0]||null)}/></label><p className="hint">Protótipo: o documento não será enviado nem armazenado. A validação de identidade será implementada com armazenamento privado e consentimento.</p></> }<div className="ep-terms-consent"><label className="ep-terms-check"><input type="checkbox" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)}/><span>Li e concordo com o <button type="button" className="ep-terms-link" onClick={()=>setTermsOpen(true)}>Termo de Adesão e Uso</button>.</span></label><small>Obrigatório para criar conta ou continuar com o Google.</small></div><label>E-mail<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com"/></label><label>Senha<input type={showPassword?"text":"password"} autoComplete={mode==='signup'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Sua senha"/></label><div className="ep-auth-options"><label><input type="checkbox" checked={rememberEmail} onChange={e=>setRememberEmail(e.target.checked)}/> Lembrar e-mail</label><button type="button" className="link-button" onClick={()=>setShowPassword(v=>!v)} aria-pressed={showPassword}>{showPassword?"Ocultar senha":"Mostrar senha"}</button></div><p className="hint">Para lembrar sua senha com segurança, use o gerenciador de senhas do navegador. A sessão permanece conectada até sair da conta.</p><button disabled={loading} onClick={auth} className="primary">{mode==='login'?'Entrar':'Criar conta'} <ArrowRight size={17}/></button><button className="link-button" onClick={()=>{setMode(mode==='login'?'signup':'login');setMsg('')}}>{mode==='login'?'Ainda não tem conta? Cadastre-se':'Já tem conta? Entrar'}</button>{msg&&<div className="notice">{msg}</div>}{termsOpen&&<EletriProTerms onClose={()=>setTermsOpen(false)}/>}</section></div>;
if(session && !profileLoaded)return <div className="ep-auth-wait" aria-label="Preparando sua área de trabalho"/>;
if(session && profileError)return <div className="center"><section className="auth-card"><h2>Não foi possível abrir sua conta</h2><p>{profileError}</p><button className="primary" onClick={()=>void refresh().catch(e=>setProfileError(String(e)))}>Tentar novamente</button></section></div>;
if(session && !registrationComplete)return <div className="center"><section className="auth-card ep-registration-card"><div className="brand"><Zap/> EletriPro</div><h1>Completar cadastro</h1><p>Para acessar sua conta Free, confirme os dados obrigatórios. Seus pagamentos e sua assinatura existente serão preservados.</p><form onSubmit={finishRegistration}>
<label>Nome completo<input required value={fullName} onChange={e=>setFullName(e.target.value)}/></label>
<div className="two"><label>CPF<input required inputMode="numeric" value={cpf} onChange={e=>setCpf(e.target.value)}/></label><label>Data de nascimento<input required type="date" value={birth} onChange={e=>setBirth(e.target.value)}/></label></div>
<label>Celular com DDD<input required type="tel" value={mobile} onChange={e=>setMobile(formatMobile(e.target.value))}/></label>
<label>Endereço<input required value={street} onChange={e=>setStreet(e.target.value)}/></label>
<div className="two"><label>Número<input required value={number} onChange={e=>setNumber(e.target.value)}/></label><label>Complemento (opcional)<input value={complement} onChange={e=>setComplement(e.target.value)}/></label></div>
<label>Bairro<input required value={neighborhood} onChange={e=>setNeighborhood(e.target.value)}/></label>
<div className="two"><label>Cidade<input required value={city} onChange={e=>setCity(e.target.value)}/></label><label>Estado (UF)<select required value={state} onChange={e=>setState(e.target.value)}><option value="">Selecione</option>{statesBR.map(uf=><option key={uf} value={uf}>{uf}</option>)}</select></label></div>
<div className="ep-terms-consent"><label className="ep-terms-check"><input type="checkbox" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)}/><span>Li e concordo com o <button type="button" className="ep-terms-link" onClick={()=>setTermsOpen(true)}>Termo de Adesão e Uso</button>.</span></label></div>
<button className="primary" type="submit" disabled={registrationBusy}>{registrationBusy?'Salvando...':'Concluir cadastro e acessar'}</button>
<button type="button" className="link-button" onClick={()=>supabase?.auth.signOut()}>Sair da conta</button>
{msg&&<div className="notice">{msg}</div>}{termsOpen&&<EletriProTerms onClose={()=>setTermsOpen(false)}/>}</form></section></div>;
return <div className="app" style={{'--accent':accent} as React.CSSProperties}><aside className={menu?'open':''}><div className="sidebar-head"><div className="brand"><Zap/> EletriPro</div><button className="icon-button close-menu" onClick={()=>setMenu(false)} aria-label="Fechar menu"><X/></button></div><span className="eyebrow">ÁREA PROFISSIONAL</span><nav>{nav}{isAdmin&&<><span className="eyebrow">ADMINISTRAÇÃO</span>{['Gestão de contas','Indicadores administrativos','Configurações administrativas','Banco de Dados Elétricos'].map(t=><button key={t} className={'nav-item '+(tab===t?'active':'')} onClick={()=>navigate(t)}><ShieldCheck size={19}/><span>{t}</span></button>)}</>}</nav><div className="sidebar-bottom"><span className="plan-chip">Plano {isAdmin&&adminAccessMode==='pro_isento'?'PRO ISENTO':isPro?'PRO':'FREE'}</span><button className="nav-item" onClick={()=>supabase.auth.signOut()}><LogOut size={19}/> Sair</button></div></aside>{menu&&<div className="scrim" onClick={()=>setMenu(false)}/>}<nav className="ep-mobile-bottom-nav" aria-label="Navegação rápida"><button type="button" className={tab==='Painel'?'active':''} onClick={()=>navigate('Painel')}><LayoutDashboard size={21}/><span>Início</span></button><button type="button" className={tab==='Clientes'?'active':''} onClick={()=>navigate('Clientes')}><Users size={21}/><span>Clientes</span></button><button type="button" className={tab==='Dimensionamento'?'active':''} onClick={()=>navigate('Dimensionamento')}><Calculator size={21}/><span>Cálculos</span></button><button type="button" className={menu?'active':''} onClick={()=>setMenu(true)}><Menu size={21}/><span>Menu</span></button></nav><div className="main-wrap"><header className="topbar"><button className="icon-button mobile-menu" onClick={()=>setMenu(true)} aria-label="Abrir menu"><Menu/></button><div className="top-brand"><Zap size={20}/> EletriPro</div><div className="account-wrap"><button className="account-trigger" onClick={()=>setAccountMenu(!accountMenu)} aria-expanded={accountMenu} aria-label="Abrir menu da empresa"><span className="company-avatar">{logo?<img src={logo} alt="Logomarca da empresa"/>:<Building2 size={18}/>}</span><span className="company-name">{professional||'Configurar minha empresa'}</span><ChevronDown size={15}/></button>{accountMenu&&<div className="account-dropdown"><button onClick={()=>{navigate('Meu Perfil');setAccountMenu(false)}}>Meu Perfil</button><button onClick={()=>{navigate('Personalização');setAccountMenu(false)}}>Personalização</button><button onClick={()=>{navigate('Assinatura');setAccountMenu(false)}}>Assinatura</button><button onClick={()=>{setAccountMenu(false);void supabase.auth.signOut()}}>Sair</button></div>}</div></header><main className="content"><div className="page-heading"><div><span className="eyebrow">SUA ÁREA DE TRABALHO</span><h1>{tab==='Painel'?'Visão geral':tab}</h1></div><span className="plan-chip">{isAdmin&&adminAccessMode==='pro_isento'?'Pro Isento':isPro?planLabel:'Free'}</span></div>{msg&&<div className="notice">{msg}</div>}
{tab==='Painel'&&<section className="ep-modern-home" aria-label="Acesso rápido aos serviços">
 <div className="ep-modern-hero"><div><span className="ep-modern-kicker"><Zap size={14}/> SEU DIA MAIS PRODUTIVO</span><h2>Seu trabalho, em um só lugar.</h2><p>Comece um atendimento, encontre um cliente ou consulte seus serviços com poucos toques.</p></div><button type="button" className="ep-modern-hero-action" onClick={()=>{navigate('Clientes');setClientFormOpen(true);setEditing(null);setName('');setPhone('');setClientEmail('');setClientLocation('')}}><Plus size={19}/> Novo cliente</button></div>
 <div className="ep-modern-section-title"><div><h2>Acesso rápido</h2><p>Escolha o que precisa fazer agora.</p></div></div>
 <div className="ep-modern-shortcuts">
 <button type="button" onClick={()=>{navigate('Clientes');setClientFormOpen(true);setEditing(null);setName('');setPhone('');setClientEmail('');setClientLocation('')}}><span className="ep-shortcut-icon"><Plus size={23}/></span><strong>Novo cliente</strong><small>Iniciar cadastro</small><ChevronRight className="ep-shortcut-arrow" size={17}/></button>
 <button type="button" onClick={()=>navigate('Clientes')}><span className="ep-shortcut-icon"><Users size={23}/></span><strong>Meus clientes</strong><small>Projetos e manutenção</small><ChevronRight className="ep-shortcut-arrow" size={17}/></button>
 <button type="button" onClick={()=>navigate('Dimensionamento')}><span className="ep-shortcut-icon"><Calculator size={23}/></span><strong>Dimensionar</strong><small>Cabos e disjuntores</small><ChevronRight className="ep-shortcut-arrow" size={17}/></button>
 <button type="button" onClick={()=>navigate('Assinatura')}><span className="ep-shortcut-icon"><Crown size={23}/></span><strong>Minha assinatura</strong><small>Plano e validade</small><ChevronRight className="ep-shortcut-arrow" size={17}/></button>
 </div>
 <div className="ep-modern-recent"><div className="ep-modern-section-title"><div><h2>Clientes recentes</h2><p>Acesse rapidamente seus atendimentos.</p></div><button type="button" onClick={()=>navigate('Clientes')}>Ver todos <ArrowRight size={15}/></button></div>{clients.length?<div className="ep-modern-recent-list">{clients.slice(0,4).map(c=><button type="button" key={c.id} onClick={()=>navigate('Clientes')}><span className="ep-modern-initial">{c.name.trim().charAt(0).toUpperCase()}</span><span><strong>{c.name}</strong><small>{c.location||c.phone||'Cliente cadastrado'}</small></span><ChevronRight size={18}/></button>)}</div>:<div className="ep-modern-empty"><Users size={24}/><div><strong>Seu primeiro atendimento começa aqui</strong><p>Cadastre um cliente para organizar projetos, serviços e orçamentos.</p></div><button type="button" onClick={()=>{navigate('Clientes');setClientFormOpen(true);setEditing(null);setName('');setPhone('');setClientEmail('');setClientLocation('')}}>Cadastrar cliente</button></div>}</div>
 </section>}
{tab==='Painel'&&<div className="ep-dashboard-stats ep-dashboard-clean">
 <button type="button" className="ep-client-card" onClick={()=>navigate('Clientes')} aria-label="Ver clientes"><span>Clientes</span><strong>{clients.length}</strong><small>Ver clientes →</small></button>
 <article className="ep-status-card"><span>Situação dos serviços</span><div className="ep-status-rows"><div><span>Aguardando aprovação</span><strong>{countStatus('awaiting')}</strong></div><div><span>Aprovado</span><strong>{countStatus('approved')}</strong></div><div><span>Em execução</span><strong>{countStatus('in_progress')}</strong></div><div><span>Finalizado</span><strong>{countStatus('finished')}</strong></div><div><span>Cancelado</span><strong>{countStatus('cancelled')}</strong></div></div></article>
 <article><span>Ganhos no mês corrente</span><strong>{brl(earningsMonth)}</strong></article>
 <button type="button" className="ep-earnings-card" onClick={()=>setShowEarnings(true)}><span>Ganhos acumulados</span><strong>{brl(earningsTotal)}</strong><small>Ver ganhos por mês →</small></button>
 </div>}
{tab==='Painel'&&<section className="panel ep-calendar-panel"><div className="panel-heading"><div><h2>Agenda de serviços</h2><p>Serviços aprovados e em execução por data prevista de início.</p></div><label>Mês<input type="month" value={calendarMonth} onChange={e=>setCalendarMonth(e.target.value)}/></label></div>
<div className="ep-calendar-grid" role="grid" aria-label="Agenda mensal de serviços">
{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(day=><div key={day} className="ep-calendar-weekday" role="columnheader">{day}</div>)}
{Array.from({length:(()=>{const [y,m]=calendarMonth.split('-').map(Number);return new Date(y,m-1,1).getDay()+new Date(y,m,0).getDate()})()},(_,index)=>{const [y,m]=calendarMonth.split('-').map(Number);const offset=new Date(y,m-1,1).getDay();const day=index-offset+1;if(day<1)return <div key={'empty-'+index} className="ep-calendar-empty" aria-hidden="true"/>;const dateKey=`${calendarMonth}-${String(day).padStart(2,'0')}`;const events=workflows.filter(w=>['approved','in_progress'].includes(w.status)&&w.planned_start_date===dateKey);return <div key={dateKey} className={'ep-calendar-day'+(events.length?' ep-calendar-has-events':'')} role="gridcell" aria-label={`${day} de ${calendarMonth}`}><strong className="ep-calendar-day-number">{day}</strong>{events.map(w=>{const c=clients.find(item=>item.id===w.client_id);return <button type="button" className="ep-calendar-event" key={w.client_id} onClick={()=>c&&void openWorkflow(c)} title={`${c?.name||'Cliente'} • ${c?.location||'Local não informado'} • ${c?.phone||'Telefone não informado'}`}><b>{c?.name||'Cliente'}</b><span>{c?.location||'Local não informado'}</span><span>{c?.phone||'Telefone não informado'}</span><small>{statusNames[w.status]}</small></button>})}</div>})}
</div>{!workflows.some(w=>['approved','in_progress'].includes(w.status)&&w.planned_start_date?.startsWith(calendarMonth))&&<p className="hint">Nenhum serviço previsto para este mês.</p>}</section>}
{tab==='Clientes'&&<>{nextClientAction&&<section className="panel ep-next-action" role="status"><div><span className="eyebrow">CLIENTE CADASTRADO</span><h2>{nextClientAction.name}</h2><p>Cadastro salvo. Escolha o próximo passo do atendimento.</p></div><div className="ep-next-action-buttons"><button type="button" className="primary" onClick={()=>{const id=nextClientAction.id;setNextClientAction(null);openClient(id)}}><FolderOpen size={17}/> Iniciar projeto</button><button type="button" className="outline" onClick={()=>{const id=nextClientAction.id;setNextClientAction(null);openMaintenance(id)}}><ClipboardList size={17}/> Registrar manutenção</button><button type="button" className="outline" onClick={()=>setNextClientAction(null)}>Agora não</button></div></section>}<section className="panel"><div className="panel-heading"><div><h2>Meus clientes</h2><p>{isPro?'Cadastros sem limite':`${freeCreatesUsed} de 1 cadastro gratuito utilizado`}</p></div>{canCreate&&<button className="primary" onClick={()=>{setClientFormOpen(true);setEditing(null);setName('');setPhone('');setClientEmail('');setClientLocation('');setTimeout(()=>document.getElementById('client-form')?.scrollIntoView({behavior:'smooth'}),0)}}><Plus size={17}/> Novo</button>}</div><div className="ep-client-search"><Search size={19}/><input type="search" aria-label="Pesquisar clientes" placeholder="Pesquisar por nome, telefone, endereço ou e-mail" value={clientSearch} onChange={e=>setClientSearch(e.target.value)}/>{clientSearch&&<button type="button" onClick={()=>setClientSearch('')} aria-label="Limpar pesquisa"><X size={17}/></button>}</div>{clients.length===0?<div className="empty"><Users size={28}/><h3>Nenhum cliente cadastrado</h3><p>Cadastre seu primeiro cliente para começar.</p></div>:clients.filter(c=>matchesClientSearch(c,clientSearch)).length===0?<div className="empty"><Search size={28}/><h3>Nenhum cliente encontrado</h3><p>Tente outro nome, telefone ou endereço.</p><button type="button" className="outline" onClick={()=>setClientSearch('')}>Limpar pesquisa</button></div>:clients.filter(c=>matchesClientSearch(c,clientSearch)).map(c=><div className="client" key={c.id}><div><strong>{c.name}</strong><p>{c.phone||'Sem telefone'} · {c.location||'Local não informado'} · {c.email||'Sem e-mail'}</p><small>{isPro?'Plano Pro':`${freeEditsUsed} de 1 edição gratuita utilizada na conta`}</small></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="outline" onClick={()=>void openWorkflow(c)}>{statusNames[workflows.find(w=>w.client_id===c.id)?.status||'awaiting']}</button><div style={{display:"flex",flexDirection:"column",gap:6}}><button className="primary" onClick={()=>openClient(c.id)}>Abrir projeto</button><button className="outline" onClick={()=>openMaintenance(c.id)}>Manutenção</button></div><button className="outline" disabled={loading||!canEdit} title={!canEdit?"Limite de 1 edição do plano Free atingido":"Editar cadastro"} onClick={()=>edit(c)}>Editar</button><button className="outline" disabled={loading} onClick={()=>void deleteClient(c)}>Excluir</button></div></div>)}</section>{clientFormOpen&&(editing?canEdit:canCreate)&&<form id="client-form" className="panel form" onSubmit={saveClient}><h2>{editing?'Editar cliente':'Novo cliente'}</h2><label>Nome completo<input required value={name} onChange={e=>setName(e.target.value)}/></label><label>Telefone<input required value={phone} onChange={e=>setPhone(e.target.value)}/></label><label>Local (endereço ou condomínio)<input required value={clientLocation} onChange={e=>setClientLocation(e.target.value)}/></label><label>E-mail<input type="email" value={clientEmail} onChange={e=>setClientEmail(e.target.value)}/></label><button type="submit" className="primary" disabled={loading||(editing?!canEdit:!canCreate)}>Salvar cliente</button>{!canEdit&&<p className="hint">Limite de edição gratuita da conta atingido. Para continuar, contrate um plano Pro.</p>}{<button type="button" className="outline" onClick={()=>{setEditing(null);setClientFormOpen(false)}}>Cancelar</button>}</form>}{!canCreate&&!editing&&<section className="panel"><p>Você já utilizou o cadastro gratuito do plano Free. Excluir um cliente não libera um novo cadastro.</p><button className="primary" onClick={()=>navigate('Assinatura')}>Conhecer Pro</button></section>}</>}
{tab==='Personalização'&&<div className="brand-grid"><section className="panel form"><h2>Identidade profissional</h2><p>Defina como sua marca aparecerá nos documentos.</p><label>Nome profissional ou empresa<input value={professional} onChange={e=>setProfessional(e.target.value)} placeholder="Ex.: Minha Elétrica"/></label><label>Logomarca (PNG, JPG ou WebP)<span className="upload"><Upload size={18}/> Selecionar imagem<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>pickLogo(e.target.files?.[0])}/></span></label><label>Cor de destaque</label><div className="swatches">{colors.map(c=><button type="button" key={c} onClick={()=>setAccent(c)} aria-label={'Selecionar '+c} className={accent===c?'selected':''} style={{background:c}}/>)}</div><button className="primary" disabled={loading} onClick={saveBrand}>Salvar personalização</button><p className="hint">Nome, cores e logomarca são sincronizados com sua conta no Supabase. A geração de PDF será implementada depois.</p></section><section className="panel"><h2>Prévia do documento</h2><div className="paper"><div className="paper-head">{logo?<img src={logo} alt="Logomarca"/>:<div className="paper-logo" style={{background:accent}}><Zap/></div>}<div><strong>{professional||'Sua empresa elétrica'}</strong><small>Orçamento de serviços</small></div></div><div className="paper-line" style={{background:accent}}/><p>CLIENTE: Nome do cliente</p><div className="paper-row"><span>Descrição dos serviços</span><span>Valor</span></div><div className="paper-row"><span>Instalação elétrica residencial</span><span>R$ 1.500,00</span></div><div className="paper-total">Total: R$ 1.500,00</div></div><p className="hint">Apenas visualização. Nenhum PDF é gerado nesta versão.</p></section></div>}
{tab==='Meu Perfil'&&<form className="panel form profile-form" onSubmit={saveProfile}><h2>Meus dados</h2><p>Dados pessoais vinculados à sua conta. A confirmação do e-mail é gerenciada pelo Supabase.</p><label>E-mail<input type="email" value={session.user.email||''} disabled/></label><label>Nome completo<input value={fullName} onChange={e=>setFullName(e.target.value)}/></label><div className="two"><label>CPF<input inputMode="numeric" value={cpf} onChange={e=>setCpf(e.target.value.replace(/\D/g,'').slice(0,11))}/></label><label>Nascimento<input type="date" value={birth} onChange={e=>setBirth(e.target.value)}/></label></div><label>Telefone celular<input type="tel" inputMode="tel" placeholder="(48) 99999-9999" value={mobile} onChange={e=>setMobile(formatMobile(e.target.value))}/></label><h2>Endereço</h2><label>Rua / avenida<input value={street} onChange={e=>setStreet(e.target.value)}/></label><div className="two"><label>Número<input value={number} onChange={e=>setNumber(e.target.value)}/></label><label>Complemento<input value={complement} onChange={e=>setComplement(e.target.value)}/></label></div><label>Bairro<input value={neighborhood} onChange={e=>setNeighborhood(e.target.value)}/></label><div className="two"><label>Cidade<input value={city} onChange={e=>setCity(e.target.value)}/></label><label>Estado<select value={state} onChange={e=>setState(e.target.value)}><option value="">Selecione</option>{statesBR.map(st=><option key={st} value={st}>{st}</option>)}</select></label></div><p className="hint">Envio de documento com foto e troca de senha serão disponibilizados após a validação do fluxo de segurança.</p><button className="primary" type="submit" disabled={loading||!profileLoaded}>Salvar meus dados</button></form>}
{isAdmin&&['Gestão de contas','Indicadores administrativos','Configurações administrativas'].includes(tab)&&<AdminPanel section={tab}/>}{isAdmin&&tab==='Banco de Dados Elétricos'&&<ElectricalCatalogAdmin/>}
{checkoutPlan&&session?.user?.id&&<IntegratedCheckout plan={checkoutPlan} userId={session.user.id} isAdmin={isAdmin} onClose={()=>setCheckoutPlan(null)} onActivated={async()=>{await refresh();await loadPaymentHistory()}}/>}{tab==='Assinatura'&&<section className="panel subscription"><div className="ep-sub-header"><Crown size={32}/><div><h2>Assinatura EletriPro</h2><p>Escolha um plano para ter acesso aos recursos Pro. A renovação é manual e a validade começa após a confirmação do pagamento.</p></div></div><div className="ep-sub-status"><span>Assinatura financeira registrada</span><strong>{financialPlan==='pro'?'Pro':financialPlan==='free'?'Free':financialPlan}</strong><p>{planExpires?`Validade registrada: ${adminDate(planExpires)}${new Date(planExpires)<=new Date()?' (vencida)':''}`:'Nenhuma validade registrada.'}</p>{isAdmin&&<p><strong>Modo de utilização do administrador:</strong> {adminAccessMode==='pro_isento'?'Pro Isento — recursos liberados sem cobrança':'Free — bloqueios de teste ativos'}. Este modo não altera o histórico de pagamentos.</p>}</div><div className="ep-sub-grid">{availablePlans.filter(p=>p.active).map(p=><article className="ep-sub-card" key={p.id}><div className="ep-sub-card-info"><h3>{p.name}</h3><strong className="ep-sub-price">{brl(p.price_cents/100)}</strong><p className="ep-sub-duration">{p.billing_months} {p.billing_months===1?'mês':'meses'}</p><div className="ep-sub-divider"/><p className="ep-sub-equivalent">{brl(p.price_cents/100/Math.max(1,p.billing_months))}/mês</p></div><button className="primary" disabled={subscriptionBusy} onClick={()=>void startMercadoPagoCheckout(p.id)}>{subscriptionBusy?'Aguarde...':'Pagar com PIX ou cartão'}</button></article>)}</div>{availablePlans.filter(p=>p.active).length===0&&<p>Nenhum plano disponível. Verifique a configuração do Supabase.</p>}{subscriptionRequests.some(r=>r.status==='pending')&&<p className="hint">Existe uma solicitação de assinatura antiga pendente de análise administrativa. Isso não altera pagamentos já aprovados nem a validade da assinatura.</p>}
<div className="ep-sub-history"><p className="hint">Registros históricos de teste e cobranças reais são apresentados separadamente. Consultas não geram novas cobranças.</p><div className="ep-sub-history-head"><h3>Histórico de pagamentos</h3><button type="button" className="outline" aria-expanded={historyExpanded} onClick={()=>setHistoryExpanded(v=>!v)}>{historyExpanded?"Minimizar":"Mostrar histórico"}</button><button className="outline" disabled={paymentHistoryBusy} onClick={()=>void (async()=>{await loadPaymentHistory();await refresh()})()}>{paymentHistoryBusy?'Atualizando...':'Atualizar histórico'}</button></div>
{paymentHistoryError&&<p role="alert">{paymentHistoryError}</p>}{paymentStatusNotice&&<p className="ep-payment-status-notice" role="status">{paymentStatusNotice}</p>}
{!paymentHistoryBusy&&!paymentHistoryError&&paymentHistory.length===0&&<p className="hint">Nenhum pagamento registrado.</p>}
{historyExpanded&&paymentHistory.length>0&&<div className="ep-sub-history-scroll"><table><thead><tr><th>Data</th><th>Plano</th><th>Valor</th><th>Forma de pagamento</th></tr></thead><tbody>{paymentHistory.map(h=><tr key={h.id}><td>{adminDate(h.created_at)}</td><td>{h.plan_name}</td><td>{brl(h.amount_cents/100)}</td><td>{h.payment_method==='pix'?'PIX':h.payment_method==='credit_card'?'Cartão':h.payment_method}</td></tr>)}</tbody></table></div>}</div><small>Pagamento processado pelo Mercado Pago. O plano Pro será liberado após confirmação do pagamento.</small></section>}
{clientAreaOpen&&activeClient&&<section className="panel" style={{marginBottom:16}}><div className="panel-heading"><div><span className="eyebrow">ÁREA DO CLIENTE</span><h2>{activeClient.name}</h2><p>{activeClient.phone||'Sem telefone'} · {activeClient.email||'Sem e-mail'}</p></div><button className="outline" onClick={()=>navigate('Clientes')}>Voltar aos clientes</button></div><div style={{display:'flex',flexWrap:'wrap',gap:8}}>{(reportMaintenanceMode?['Manutenção','Relatórios']:clientAreaTabs.filter(t=>t!=='Manutenção')).map(t=><button key={t} className={tab===t?'primary':'outline'} onClick={()=>navigate(t)}>{t}</button>)}</div></section>}
{tab==='Manutenção'&&activeClient&&<MaintenancePanel key={'maintenance-'+activeClientId} client={activeClient} userId={session.user.id} onReport={()=>{setReportMaintenanceMode(true);navigate('Relatórios')}}/>}
{tab==='Tipo de instalação'&&activeClient&&<><section className="panel"><h3>Fornecimento CELESC — proposta automática</h3><p>{!supplyLoaded?'Calculando após carregar circuitos...':!supplyCircuits.length?'Cadastre ambientes e circuitos para obter o fornecimento.':autoSupply.entry?`${autoSupply.installedKW.toLocaleString('pt-BR',{maximumFractionDigits:2})} kW instalados · ${autoSupply.entry.category} · ${autoSupply.supply==='three'?'Trifásico':autoSupply.supply==='two'?'Bifásico':'Monofásico'} (proposta)`: 'Sem enquadramento automático: confira potências ativas, fatores de potência, vínculos dos ambientes e tensão 220/380 V.'}</p>{autoSupply.requiresTechnicalReview&&<p role="alert" className="sizing-warning">{autoSupply.reason} O QD e o alimentador ficam bloqueados até a revisão.</p>}<p className="hint">A proposta não comprova disponibilidade da rede, ligação de equipamentos especiais nem aprovação da concessionária. A mudança de fornecimento exige revisar o QD.</p></section><InstallationSetup settings={installationSettings} onChange={updateInstallation} onSave={()=>void saveInstallation()} saving={installationLoading||installationSaving}/>{installationStatus&&installationStatus.startsWith("Erro")&&<p className="hint" role="alert">{installationStatus}</p>}</>}
{tab==='Dimensionamento'&&activeClient&&<CircuitSizing key={activeClientId} clientId={activeClientId} userId={session.user.id} settings={effectiveInstallation}/>}
{false&&tab==='Alimentador geral'&&activeClient&&(supplyReady?<FeederPanel key={'feeder-'+activeClientId+'-'+supplyRevision} clientId={activeClientId!} userId={session.user.id} settings={effectiveInstallation}/>:<section className="panel" role="alert"><h3>Alimentador aguardando enquadramento</h3><p>{!supplyLoaded?'Atualizando circuitos...':autoSupply.reason||'Não há fornecimento CELESC válido para os circuitos e tensões cadastrados. Revise as cargas e as tensões antes de dimensionar.'}</p></section>)}
{tab==='Quadro de distribuição'&&activeClient&&<><section className="panel ep-supply-overview" aria-label="Fornecimento automático"><h3>Fornecimento sugerido — CELESC</h3><div className="ep-supply-summary"><div><span>Carga instalada</span><strong>{supplyLoaded?autoSupply.installedKW.toLocaleString('pt-BR',{maximumFractionDigits:2})+' kW':'Calculando...'}</strong></div><div><span>Modalidade sugerida</span><strong>{!supplyLoaded?'Calculando...':autoSupply.supply==='single'?'Monofásico':autoSupply.supply==='two'?'Bifásico':autoSupply.supply==='three'?'Trifásico':'Não determinada'}</strong></div><div><span>Categoria indicativa</span><strong>{autoSupply.entry?.category||'—'}</strong></div><div><span>Disjuntor geral indicativo</span><strong>{autoSupply.entry?.breakerIEC?autoSupply.entry.breakerIEC+' A':'—'}</strong></div></div><p className="hint">Estimativa por carga instalada conforme referência CELESC N-321.0001 (dezembro/2025), para rede 220/380 V. Quando a tensão não foi informada, 220/380 V é uma hipótese de consulta, não confirmação da rede disponível. O enquadramento final depende da concessionária, das características das cargas e do padrão de entrada.</p>{autoSupply.requiresTechnicalReview&&<p role="alert" className="sizing-warning">{autoSupply.reason}</p>}</section>{supplyLoaded&&!supplyReady&&<section className="panel" role="status"><h3>Fornecimento pendente de enquadramento</h3><p>{autoSupply.reason||'O fornecimento automático não pôde ser confirmado. Confira as tensões e o enquadramento em Tipo de instalação. Os circuitos continuam disponíveis para consulta.'}</p></section>}<DistributionPanel key={activeClientId+'-'+supplyRevision} clientId={activeClientId!} userId={session.user.id} settings={effectiveInstallation}/></>}
{tab==='Ambientes'&&activeClient&&<Environments key={activeClientId} clientId={activeClientId!} userId={session.user.id}/>}
{tab==='Relatórios'&&activeClient&&((supplyReady||reportMaintenanceMode)?<TechnicalReport key={'report-'+activeClientId+'-'+supplyRevision+'-'+(reportMaintenanceMode?'maintenance':'project')} client={activeClient} userId={session.user.id} professional={professional} logo={logo} accent={accent} settings={effectiveInstallation} maintenanceMode={reportMaintenanceMode}/>:<section className="panel" role="alert">Relatório técnico bloqueado: fornecimento automático não validado. {autoSupply.reason}</section>)}
{tab==='Materiais'&&activeClient&&<div className="ep-material-budget-layout"><MaterialsPanel key={'materials-'+activeClientId} clientId={activeClientId!} userId={session.user.id} localBudget={budgetItems} client={activeClient} professional={professional} logo={logo} accent={accent} settings={effectiveInstallation}/></div>}
{tab==='Orçamento'&&activeClient&&<BudgetsPanel key={'budget-'+activeClientId} clientId={activeClientId!} userId={session.user.id} localBudget={budgetItems} client={activeClient} professional={professional} logo={logo} accent={accent}/>}
{workflowClient&&<div className="ep-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!workflowBusy)setWorkflowClient(null)}}>
 <section className="ep-workflow-dialog" role="dialog" aria-modal="true" aria-label="Situação do cliente">
 <div className="ep-workflow-head"><div><h2>Situação do cliente</h2><p>{workflowClient.name}</p></div><button className="outline" onClick={()=>setWorkflowClient(null)} disabled={workflowBusy} aria-label="Fechar"><X size={18}/></button></div>
 <label>Andamento<select value={workflowStatus} disabled={workflowBusy} onChange={e=>setWorkflowStatus(e.target.value as WorkStatus)}><option value="awaiting">Aguardando aprovação</option><option value="approved">Aprovado</option><option value="in_progress">Em execução</option><option value="finished">Finalizado</option><option value="cancelled">Cancelado</option></select></label>{["approved","in_progress"].includes(workflowStatus)&&<label>Data prevista de início<input type="date" required value={workflowStart} onChange={e=>setWorkflowStart(e.target.value)}/></label>}
 {workflowStatus==='finished'&&<><label>Orçamento executado<select value={workflowBudget} disabled={workflowBusy||workflowLoading} onChange={e=>setWorkflowBudget(e.target.value)}><option value="">Selecione o orçamento</option>{workflowChoices.map(b=><option key={b.id} value={b.id}>{b.title} — {brl(b.amount)}</option>)}</select></label><p className="hint">O valor do orçamento escolhido será registrado como ganho na data da finalização. O valor registrado na finalização permanece como histórico, mesmo que a lista seja alterada depois.</p></>}
 <div className="ep-summary-actions"><button className="primary" disabled={workflowBusy||workflowLoading} onClick={()=>void saveWorkflow()}>{workflowBusy?'Salvando...':'Salvar'}</button><button className="outline" disabled={workflowBusy} onClick={()=>setWorkflowClient(null)}>Fechar</button></div>
 </section></div>}
 {showEarnings&&<div className="ep-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setShowEarnings(false)}}>
 <section className="ep-workflow-dialog" role="dialog" aria-modal="true" aria-label="Ganhos por mês"><div className="ep-workflow-head"><h2>Ganhos por mês</h2><button className="outline" onClick={()=>setShowEarnings(false)} aria-label="Fechar"><X size={18}/></button></div>
 {monthlyEarnings.length?monthlyEarnings.map(([month,total])=><div className="ep-month-row" key={month}><span>{monthLabel(month+'-01')}</span><strong>{brl(total)}</strong></div>):<p>Nenhum serviço finalizado com orçamento registrado.</p>}
 <div className="ep-total-highlight"><span>Total acumulado</span><strong>{brl(earningsTotal)}</strong></div><button className="outline" onClick={()=>setShowEarnings(false)}>Fechar</button></section></div>}
 {!['Painel','Clientes','Personalização','Meu Perfil','Assinatura','Tipo de instalação','Dimensionamento','Ambientes','Quadro de distribuição','Materiais','Orçamento','Relatórios','Gestão de contas','Indicadores administrativos','Configurações administrativas','Banco de Dados Elétricos'].includes(tab)&&<section className="panel empty"><div className="feature-icon">{React.createElement(title(tab),{size:30})}</div><h2>{tab}</h2><p>Módulo em desenvolvimento. Os cálculos elétricos serão liberados somente após validação técnica dos critérios aplicáveis da NBR 5410.</p>{tab==='Dimensionamento'&&<span className="plan-chip">Acesso Free limitado</span>}</section>}
</main><footer>EletriPro · Interface v0.7.37 · Dados de demonstração identificados</footer></div></div>}
createRoot(document.getElementById('root')!).render(<App/>);
