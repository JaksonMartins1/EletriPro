import React, { useState } from 'react';
import { supabase } from './supabase';

type Plan = { id: string; name: string; price_cents: number; billing_months: number; active: boolean };
type TestResult = { status: number | null; body: any };
const fmt = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Ferramentas de homologação disponíveis somente no componente renderizado para administradores. */
export default function OrdersAuthTest({ plans, userId }: { plans: Plan[]; userId: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [pixResult, setPixResult] = useState<TestResult | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [confirm, setConfirm] = useState(false);
  const activePlans = plans.filter(p => p.active && Number.isInteger(p.price_cents) && p.price_cents > 0);
  const selected = activePlans.find(p => p.id === selectedPlan);

  async function invoke(body: Record<string, unknown>): Promise<TestResult> {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token || session.user.id !== userId) throw new Error('Faça login novamente.');
    const { data, error } = await supabase.functions.invoke('eletripro-payment-orders-test', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
      body,
    });
    if (error) {
      const response = (error as { context?: Response }).context;
      let payload: any = { error: error.message };
      let status: number | null = null;
      if (response && typeof response.status === 'number') {
        status = response.status;
        try { payload = await response.clone().json(); } catch { /* mantém mensagem */ }
      }
      return { status, body: payload };
    }
    return { status: 200, body: data };
  }

  async function runAuthTest() {
    if (busy) return;
    setBusy(true); setResult(null);
    try {
      setResult(await invoke({ plan_id: '00000000-0000-4000-8000-000000000001', payment_method: 'pix', request_key: crypto.randomUUID() }));
    } catch (e) { setResult({ status: null, body: { error: e instanceof Error ? e.message : 'Erro desconhecido' } }); }
    finally { setBusy(false); }
  }

  async function createPix() {
    if (busy || !selected || !confirm) return;
    setBusy(true); setPixResult(null);
    // Reutilizar a chave entre tentativas da mesma sessão, sem criar automaticamente nova cobrança.
    const keyName = `eletripro-orders-test:${userId}:${selected.id}`;
    let key = sessionStorage.getItem(keyName);
    if (!key) { key = crypto.randomUUID(); sessionStorage.setItem(keyName, key); }
    try {
      const r = await invoke({ plan_id: selected.id, payment_method: 'pix', request_key: key });
      setPixResult(r);
      if (r.status === 200 && r.body?.order_id) sessionStorage.setItem(`${keyName}:order`, String(r.body.order_id));
    } catch (e) { setPixResult({ status: null, body: { error: e instanceof Error ? e.message : 'Erro desconhecido' } }); }
    finally { setBusy(false); }
  }

  const pix = pixResult?.body?.pix;
  const hasPix = typeof pix?.qr_code === 'string' && pix.qr_code.length > 0;
  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); } catch { window.prompt('Copie o código:', value); } };
  return (
    <section style={{ border: '1px solid #94a3b8', borderRadius: 12, padding: 16, margin: '16px 0' }}>
      <h3>Homologação Orders API — somente administrador</h3>
      <p>Testes separados do checkout atual. Não use credenciais de produção.</p>
      <button type="button" className="primary" disabled={busy} onClick={runAuthTest}>{busy ? 'Aguarde...' : 'Testar autenticação Orders API'}</button>
      {result && <div role="status" style={{ marginTop: 10 }}><strong>HTTP {result.status ?? 'sem resposta'}</strong><p>{result.status === 409 && result.body?.error === 'Plano indisponível' ? 'Autenticação aceita; plano inexistente (esperado).' : 'Confira o resultado antes de continuar.'}</p><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(result.body, null, 2)}</pre></div>}
      <hr style={{ margin: '18px 0', opacity: .4 }}/>
      <h3>Gerar PIX de teste Orders API</h3>
      <p><strong>Aviso:</strong> a Order será criada no Mercado Pago. Um pagamento aprovado poderá ativar ou renovar o plano nesta conta do banco principal. Não escaneie nem pague o PIX sem planejar o teste.</p>
      <label style={{ display: 'block', marginBottom: 10 }}>Plano cadastrado
        <select style={{ display: 'block', width: '100%', marginTop: 6 }} value={selectedPlan} onChange={e => { setSelectedPlan(e.target.value); setConfirm(false); setPixResult(null); }}>
          <option value="">Selecione um plano</option>
          {activePlans.map(p => <option key={p.id} value={p.id}>{p.name} — {fmt(p.price_cents)} — {p.billing_months} mês(es)</option>)}
        </select>
      </label>
      {selected && <p>Valor da Order: <strong>{fmt(selected.price_cents)}</strong></p>}
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: '10px 0' }}>
        <input type="checkbox" checked={confirm} onChange={e => setConfirm(e.target.checked)} />
        <span>Confirmo que esta é uma cobrança de homologação e entendo que a aprovação pode alterar minha assinatura.</span>
      </label>
      <button type="button" className="primary" disabled={busy || !selected || !confirm} onClick={createPix}>{busy ? 'Gerando...' : 'Gerar PIX de teste Orders API'}</button>
      {pixResult && <div role="status" style={{ marginTop: 12 }}>
        <strong>HTTP {pixResult.status ?? 'sem resposta'}</strong>
        {pixResult.body?.order_id && <p>Order ID: <code>{String(pixResult.body.order_id)}</code></p>}
        {pixResult.body?.intent_id && <p>Intent ID: <code>{String(pixResult.body.intent_id)}</code></p>}
        {pixResult.body?.status && <p>Status: <strong>{String(pixResult.body.status)}</strong></p>}
        {hasPix && <><p>PIX copia e cola disponível:</p><button type="button" className="outline" onClick={() => void copy(pix.qr_code)}>Copiar código PIX de teste</button></>}
        {typeof pix?.qr_code_base64 === 'string' && /^[A-Za-z0-9+/=]+$/.test(pix.qr_code_base64) && <div style={{ marginTop: 12 }}><img src={`data:image/png;base64,${pix.qr_code_base64}`} alt="QR Code PIX de homologação" style={{ maxWidth: 240, width: '100%', background: 'white', padding: 8 }} /></div>}
        {pixResult.body?.error && <p style={{ color: '#fca5a5' }}>{String(pixResult.body.error)}</p>}
        {!hasPix && pixResult.status === 200 && <p>Order retornada sem código PIX. Verifique os detalhes no Mercado Pago e os logs da Edge Function.</p>}
        <small>Não gere outra tentativa para contornar erros. Preserve o Intent ID para conciliação.</small>
      </div>}
    </section>
  );
}
