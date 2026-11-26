import React,{useEffect,useState} from 'react';
import {supabase} from './supabase';
export function useReferralQuote(userId:string|undefined,enabled:boolean){
 const [quote,setQuote]=useState<{userId:string;percent:number}|null>(null);
 useEffect(()=>{let active=true;setQuote(null);if(!enabled||!userId||!supabase)return;void supabase.rpc('eletripro_referral_mine').then(({data,error})=>{const n=Number(data?.available_percent);if(active&&!error&&data?.available_percent!=null&&Number.isFinite(n))setQuote({userId,percent:Math.max(0,Math.min(100,n))});});return()=>{active=false}},[userId,enabled]);
 return enabled&&quote?.userId===userId?quote.percent:null;
}
export const referralPreviewEnabled=import.meta.env.VITE_ELETRIPRO_REFERRAL_PREVIEW==='true';
export function previewAmount(cents:number,percent:number){return Math.round(cents*(100-percent)/100)}
export function installmentLimit(cents:number){return cents>=10000?10:1}
export function ReferralQuote({cents,percent}:{cents:number;percent:number}){const money=(v:number)=>(v/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});return <div className="ep-referral-quote"><small>Simulação de benefício · homologação</small><span>Desconto disponível: {percent.toLocaleString('pt-BR')}%</span><strong>Valor estimado: {money(previewAmount(cents,percent))}</strong><small>{percent===100?'Renovação gratuita prevista.':'Parcelamento previsto: até '+installmentLimit(previewAmount(cents,percent))+'x.'} Não aplicado ao pagamento comercial.</small></div>}
