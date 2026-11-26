import React,{useEffect,useState} from 'react';
import {RefreshCw,Save} from 'lucide-react';
import {supabase} from './supabase';
type Plan={id:string;name:string;price_cents:number;billing_months:number;active:boolean};
export default function ReferralAdmin(){
 const [plans,setPlans]=useState<Plan[]>([]),[rates,setRates]=useState<Record<string,string>>({}),[busy,setBusy]=useState(true),[ready,setReady]=useState(false),[message,setMessage]=useState('');
 async function load(){setBusy(true);setReady(false);setMessage('');try{if(!supabase)throw Error('Supabase indisponível');const [p,r]=await Promise.all([supabase.rpc('eletripro_admin_dashboard'),supabase.from('eletripro_referral_rates').select('plan_id,percent')]);if(p.error)throw p.error;if(r.error)throw r.error;const list:Plan[]=p.data?.plans||[];const values:Record<string,string>={};for(const plan of list){const saved=r.data.find(x=>x.plan_id===plan.id);values[plan.id]=String(saved?.percent??(plan.price_cents>0?({1:2,3:5,12:10} as Record<number,number>)[plan.billing_months]??0:0));}setPlans(list);setRates(values);setReady(true);}catch(e:any){setMessage(e.message||String(e));}finally{setBusy(false)}}
 useEffect(()=>{void load()},[]);
 async function save(e:React.FormEvent){e.preventDefault();if(!supabase||!ready||busy)return;const rows=plans.filter(p=>p.active).map(p=>({plan_id:p.id,percent:Number(rates[p.id])}));if(rows.some(r=>!rates[r.plan_id]?.trim()||!Number.isFinite(r.percent)||r.percent<0||r.percent>100)){setMessage('Informe percentuais entre 0 e 100.');return;}setBusy(true);setMessage('');try{if(rows.length){const r=await supabase.from('eletripro_referral_rates').upsert(rows,{onConflict:'plan_id'});if(r.error)throw r.error;}setMessage('Percentuais salvos.');}catch(e:any){setMessage(e.message||String(e));}finally{setBusy(false)}}
 const activePlans=plans.filter(p=>p.active);
 return <section className="panel ep-referral-admin" aria-label="Programa de indicação">
  <div className="ep-referral-toolbar"><h2>Percentuais por plano</h2><button type="button" className="outline ep-referral-refresh" aria-label="Atualizar planos" title="Atualizar planos" disabled={busy} onClick={()=>void load()}><RefreshCw size={17}/></button></div>
  {message&&<p role="status" className="notice">{message}</p>}
  {busy&&!ready&&<p role="status">Carregando...</p>}
  {ready&&<form onSubmit={save}>
   {activePlans.length===0?<p>Nenhum plano ativo.</p>:<div className="ep-referral-list">
    <div className="ep-referral-row ep-referral-head"><span>Plano</span><span>Desconto (%)</span></div>
    {activePlans.map(p=><div className="ep-referral-row" key={p.id}>
     <div className="ep-referral-plan"><strong>{p.name}</strong><small>{(p.price_cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</small></div>
     <div className="ep-referral-field"><input aria-label={`Desconto (%) — ${p.name}`} type="number" min="0" max="100" step="0.01" required disabled={busy} value={rates[p.id]??''} onChange={e=>setRates(old=>({...old,[p.id]:e.target.value}))}/><span aria-hidden="true">%</span></div>
    </div>)}
   </div>}
   <div className="ep-referral-actions"><button className="primary" disabled={busy||!activePlans.length} type="submit"><Save size={16}/>{busy?'Salvando...':'Salvar percentuais'}</button></div>
  </form>}
 </section>
}
