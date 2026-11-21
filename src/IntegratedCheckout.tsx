import React,{useEffect,useRef,useState} from 'react';
import {supabase} from './supabase';
import {CreditCard, ShieldCheck, LockKeyhole} from 'lucide-react';

type Plan={id:string;name:string;price_cents:number;billing_months:number};
type Result={intent_id?:string;order_id?:string;payment_id?:string;status?:string;order_status?:string;payment_status?:string;applied?:boolean;subscription_expires_at?:string;pix?:{qr_code?:string;qr_code_base64?:string;ticket_url?:string};error?:string;retryable?:boolean};
type Props={plan:Plan;userId:string;isAdmin:boolean;onClose:()=>void;onActivated:()=>Promise<void>};
const money=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const publicKey=import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY as string|undefined;
function PixSymbol(){return <svg className="ep-pay-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M11.5 5.5 6 11c-2.8 2.8-2.8 7.2 0 10l5.5 5.5M20.5 5.5 26 11c2.8 2.8 2.8 7.2 0 10l-5.5 5.5" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round"/><path d="m10 13 3.5 3.5a3.55 3.55 0 0 0 5 0L22 13M10 19l3.5-3.5a3.55 3.55 0 0 1 5 0L22 19" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round"/></svg>}
// A chave de idempotência pertence a uma tentativa com preço e prazo definidos.
// Alterar o preço do plano nunca deve reutilizar a chave de uma cobrança anterior.
function keyFor(userId:string,planId:string,method:string,priceCents:number,billingMonths:number){return `eletripro-orders-checkout-v3:${userId}:${planId}:${method}:${priceCents}:${billingMonths}`}
function getKey(storageKey:string){let key=sessionStorage.getItem(storageKey);if(!key){key=crypto.randomUUID();sessionStorage.setItem(storageKey,key)}return key}
function clearKey(storageKey:string){sessionStorage.removeItem(storageKey)}
async function invoke(name:string,body:Record<string,unknown>):Promise<Result>{
 if(!supabase)throw new Error('Supabase indisponível');
 const {data,error}=await supabase.functions.invoke(name,{body});
 if(error){const response=(error as any).context as Response|undefined;let details:any=null;try{details=await response?.json()}catch{};throw new Error(details?.error||error.message||'Falha na comunicação')}
 if(data?.error)throw new Error(data.error);
 return data as Result;
}
let mpScript:Promise<void>|null=null;
function loadMpScript(){if(mpScript)return mpScript;mpScript=new Promise<void>((resolve,reject)=>{if((window as any).MercadoPago){resolve();return}const script=document.createElement('script');script.src='https://sdk.mercadopago.com/js/v2';script.onload=()=>resolve();script.onerror=()=>{mpScript=null;reject(new Error('Não foi possível carregar o SDK do Mercado Pago'))};document.head.appendChild(script)});return mpScript}
export default function IntegratedCheckout({plan,userId,isAdmin,onClose,onActivated}:Props){
 const[method,setMethod]=useState<'pix'|'credit_card'>('pix');
 const[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[result,setResult]=useState<Result|null>(null);
 const[cardReady,setCardReady]=useState(false);const formRef=useRef<any>(null);const activeRef=useRef(true);
 const storageKey=keyFor(userId,plan.id,method,plan.price_cents,plan.billing_months);
 useEffect(()=>{activeRef.current=true;return()=>{activeRef.current=false}},[]);
 useEffect(()=>{setResult(null);setMessage('');setCardReady(false);let cancelled=false;
  if(method!=='credit_card')return;
  if(!publicKey){setMessage('A chave pública do Mercado Pago ainda não foi configurada.');return}
  void loadMpScript().then(()=>{
   if(cancelled)return;
   const MP=(window as any).MercadoPago;
   const mp=new MP(publicKey,{locale:'pt-BR'});
   formRef.current=mp.cardForm({amount:(plan.price_cents/100).toFixed(2),iframe:true,form:{id:'ep-card-form',cardNumber:{id:'ep-card-number',placeholder:'Número do cartão'},expirationDate:{id:'ep-card-expiry',placeholder:'MM/AA'},securityCode:{id:'ep-card-cvv',placeholder:'Código de segurança'},cardholderName:{id:'ep-card-holder',placeholder:'Nome impresso no cartão'},issuer:{id:'ep-card-issuer',placeholder:'Banco emissor'},installments:{id:'ep-card-installments',placeholder:'Parcelas'},identificationType:{id:'ep-card-id-type',placeholder:'Tipo de documento'},identificationNumber:{id:'ep-card-id-number',placeholder:'Número do documento'},cardholderEmail:{id:'ep-card-email',placeholder:'E-mail'}} ,callbacks:{onFormMounted:(error:any)=>{if(error){setMessage('Erro ao carregar campos seguros do cartão.');return}setCardReady(true)},onSubmit:()=>{}}});
  }).catch(e=>{if(!cancelled)setMessage(e.message)});
  return()=>{cancelled=true;try{formRef.current?.unmount?.()}catch{}formRef.current=null};
 },[method,plan.id,plan.price_cents]);
 async function checkStatus(intentId:string){try{const status=await invoke(method==='pix'?'eletripro-payment-status-orders-test':'eletripro-payment-status',{intent_id:intentId});if(!activeRef.current)return;setResult(old=>({...old,...status,pix:old?.pix}));if(status.applied){clearKey(storageKey);sessionStorage.removeItem(`${storageKey}:intent`);setMessage('Pagamento confirmado! Assinatura Pro ativada.');await onActivated()}else setMessage(status.status==='rejected'?'Pagamento recusado. Verifique os dados antes de tentar novamente.':'Aguardando confirmação do Mercado Pago.')}catch(e){setMessage(e instanceof Error?e.message:String(e))}}
  useEffect(()=>{if(method==='pix'&&isAdmin){const id=sessionStorage.getItem(`${storageKey}:intent`);if(id)setResult({intent_id:id,status:'pending'});}},[storageKey,isAdmin,method]);
 useEffect(()=>{if(!result?.intent_id||result.applied||!['pending','in_process'].includes(result.status||''))return;const id=result.intent_id;const timer=window.setInterval(()=>{void checkStatus(id)},10000);return()=>clearInterval(timer)},[result?.intent_id,result?.status,result?.applied,method]);
 async function createPix(){
  if(!isAdmin){setMessage('PIX Orders API ainda em homologação: disponível somente para administrador.');return}
  if(result?.intent_id){await checkStatus(result.intent_id);return}
  setBusy(true);setMessage('Gerando PIX de homologação com o valor atual do plano...');
  try{
   const r=await invoke('eletripro-payment-orders-test',{plan_id:plan.id,payment_method:'pix',request_key:getKey(storageKey)});
   setResult(r);
   if(r.intent_id)sessionStorage.setItem(`${storageKey}:intent`,r.intent_id);
   if(r.applied){clearKey(storageKey);await onActivated();setMessage('Assinatura já ativada.')}else setMessage(r.pix?.qr_code?'PIX de teste gerado. Não pague com dinheiro real.':'Order registrada. Consulte o status; se não houver QR Code, confira a resposta da função.');
  }catch(e){setMessage((e instanceof Error?e.message:String(e))+' A tentativa foi preservada para evitar duplicidade. Não tente novamente até verificar o registro no Supabase.');}
  finally{setBusy(false)}
 }
 async function createCard(event:React.FormEvent){event.preventDefault();if(!formRef.current||!cardReady){setMessage('Aguarde os campos seguros do cartão.');return}setBusy(true);setMessage('Processando cartão...');try{const values=formRef.current.getCardFormData();if(!values.token)throw new Error('Não foi possível tokenizar o cartão. Verifique os dados.');const r=await invoke('eletripro-payment',{plan_id:plan.id,payment_method:'credit_card',request_key:getKey(storageKey),card:{token:values.token,payment_method_id:values.paymentMethodId,issuer_id:values.issuerId,installments:Number(values.installments),identification:{type:values.identificationType,number:values.identificationNumber}}});setResult(r);if(r.applied){clearKey(storageKey);await onActivated();setMessage('Pagamento aprovado! Assinatura ativada.')}else setMessage('Pagamento enviado. Aguardando confirmação.')}catch(e){setMessage((e instanceof Error?e.message:String(e))+' Se houve falha de rede, consulte o pagamento antes de tentar novamente.')}finally{setBusy(false)}}
 return <div className="ep-checkout-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="ep-checkout-modal" role="dialog" aria-modal="true" aria-label="Pagamento da assinatura"><header className="ep-checkout-head"><div><h2>Assinar {plan.name}</h2><p>{money(plan.price_cents/100)} · {plan.billing_months} {plan.billing_months===1?'mês':'meses'}</p></div><button type="button" className="outline" onClick={onClose}>Fechar</button></header><div className="ep-checkout-tabs"><button type="button" className={method==='pix'?'selected':''} onClick={()=>setMethod('pix')}><PixSymbol/> <span>PIX</span></button><button type="button" className={method==='credit_card'?'selected':''} onClick={()=>setMethod('credit_card')}><CreditCard size={19} strokeWidth={2}/> <span>Cartão de crédito</span></button></div>
 {method==='pix'?<div className="ep-checkout-content"><p className="ep-checkout-explainer"><ShieldCheck size={17}/> O acesso Pro será ativado após a confirmação do pagamento.</p>{result?.pix?.qr_code_base64&&<img className="ep-pix-image" alt="QR Code PIX" src={`data:image/png;base64,${result.pix.qr_code_base64}`}/>} {result?.pix?.qr_code&&<><label htmlFor="ep-pix-copy">PIX copia e cola</label><textarea id="ep-pix-copy" readOnly rows={3} value={result.pix.qr_code}/><button type="button" className="outline" onClick={()=>void navigator.clipboard.writeText(result.pix!.qr_code!)}>Copiar código PIX</button></>}{!result?.applied&&<button type="button" className="primary" disabled={busy||!isAdmin} onClick={()=>void createPix()}>{busy?'Aguarde...':result?.intent_id?'Consultar PIX existente':'Gerar PIX de teste'}</button>}{!isAdmin&&<p className="ep-checkout-message">PIX indisponível para usuários durante a homologação.</p>}</div>:<form id="ep-card-form" className="ep-checkout-content" onSubmit={e=>void createCard(e)}><label>Número do cartão<div id="ep-card-number" className="ep-mp-field"/></label><div className="ep-checkout-two"><label>Validade<div id="ep-card-expiry" className="ep-mp-field"/></label><label>CVV<div id="ep-card-cvv" className="ep-mp-field"/></label></div><label>Nome no cartão<input id="ep-card-holder" required/></label><label>E-mail<input id="ep-card-email" type="email" required/></label><div className="ep-checkout-two"><label>Documento<select id="ep-card-id-type"/></label><label>Número<input id="ep-card-id-number" required/></label></div><div className="ep-checkout-two"><label>Banco emissor<select id="ep-card-issuer"/></label><label>Parcelas<select id="ep-card-installments"/></label></div><button type="submit" className="primary" disabled={busy||!cardReady||Boolean(result?.applied)}>{busy?'Processando...':'Pagar com cartão'}</button></form>}
 {result?.intent_id&&<div className="ep-checkout-status">{result.order_id&&<p>Order ID: <code>{result.order_id}</code></p>}<p>Intent ID: <code>{result.intent_id}</code></p><strong>Status: {result.applied?'Aprovado':result.status||'Em processamento'}</strong><button type="button" className="outline" disabled={busy} onClick={()=>void checkStatus(result.intent_id!)}>Verificar pagamento</button></div>}{message&&<p className="ep-checkout-message" role="status">{message}</p>}<small className="ep-checkout-footnote"><LockKeyhole size={14}/> Pagamento processado pelo Mercado Pago. Ambiente de testes: não utilize cartões reais.</small></section></div>
}
