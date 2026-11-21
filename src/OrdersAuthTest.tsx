import React, { useState } from 'react';
import { supabase } from './supabase';

type TestResult = { status: number | null; body: unknown };

/** Teste negativo: o UUID de plano não existe; nenhuma cobrança deve ser criada. */
export default function OrdersAuthTest() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  async function runTest() {
    if (busy) return;
    setBusy(true);
    setResult(null);
    try {
      if (!supabase) throw new Error('Supabase não configurado no frontend.');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Faça login no EletriPro antes de testar.');
      }
      const { data, error } = await supabase.functions.invoke(
        'eletripro-payment-orders-test',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: {
            plan_id: '00000000-0000-4000-8000-000000000001',
            payment_method: 'pix',
            request_key: crypto.randomUUID(),
          },
        }
      );
      if (error) {
        const response = (error as { context?: Response }).context;
        let body: unknown = { error: error.message };
        let status: number | null = null;
        if (response && typeof response.status === 'number') {
          status = response.status;
          try { body = await response.clone().json(); }
          catch { body = { error: error.message }; }
        }
        setResult({ status, body });
      } else {
        setResult({ status: 200, body: data });
      }
    } catch (err) {
      setResult({ status: null, body: { error: err instanceof Error ? err.message : 'Erro desconhecido' } });
    } finally {
      setBusy(false);
    }
  }

  const message = result?.body && typeof result.body === 'object'
    ? JSON.stringify(result.body, null, 2)
    : String(result?.body ?? '');
  const expected = result?.status === 409 || result?.status === 404;
  return (
    <div style={{ border: '1px solid #94a3b8', borderRadius: 12, padding: 16, margin: '16px 0' }}>
      <strong>Homologação Orders API — teste sem cobrança</strong>
      <p style={{ margin: '8px 0' }}>
        Somente administrador. Envia um plano inexistente para validar a sessão e o backend.
        Não gera PIX e não altera assinaturas.
      </p>
      <button type="button" className="primary" onClick={runTest} disabled={busy}>
        {busy ? 'Testando...' : 'Testar autenticação Orders API'}
      </button>
      {result && (
        <div style={{ marginTop: 12 }} role="status">
          <strong>HTTP {result.status ?? 'sem resposta HTTP'}</strong>
          <p>{expected ? 'Resultado esperado: autenticação aceita; plano inexistente.' : 'Confira o retorno antes de prosseguir.'}</p>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 12 }}>{message}</pre>
        </div>
      )}
    </div>
  );
}
