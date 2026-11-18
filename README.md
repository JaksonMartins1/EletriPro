# EletriPro v0.2 — layout mobile-first

Protótipo funcional em React + TypeScript + Vite, preparado para GitHub, Netlify e Supabase.

## Iniciar

1. `npm install`
2. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. No Supabase, execute `supabase/schema.sql` em projeto novo (revise antes de aplicar em produção).
4. `npm run dev` para testar e `npm run build` para compilar.
5. Envie o projeto ao GitHub e conecte o repositório à Netlify. Configure as mesmas variáveis de ambiente na Netlify.
6. No Supabase Auth, configure Site URL e URLs de redirecionamento para o domínio Netlify; habilite Google OAuth no provedor e configure as credenciais do Google Cloud se desejar o login Google.

## Implementado

- Layout preto/cinza responsivo, navegação mobile por menu lateral, cards e acessos rápidos.
- Login por e-mail e opção Google OAuth (exige configuração no Supabase).
- Cadastro de clientes com limites Free aplicados por trigger SQL (1 cliente, 1 edição).
- Tela de cadastro de conta com nome, CPF, data de nascimento, endereço e seletor de documento **apenas visual**: os dados extras/documento não são enviados nem persistidos. A autenticação salva apenas e-mail, senha (gerenciada pelo Auth) e nome nos metadados do usuário.
- Personalização com nome, cor e logo salvos **somente no localStorage deste navegador**. Prévia visual de orçamento, **sem exportação PDF**.
- Telas reservadas para dimensionamento, ambientes, materiais, orçamentos e plano anual Pro.

## Não implementado

- Verificação de CPF, idade, endereço e identidade; upload seguro e armazenamento privado de documentos. Implementar somente com consentimento, política de retenção e acesso restrito.
- Persistência da identidade profissional por usuário no Supabase; no protótipo, preferências no navegador podem ser compartilhadas por pessoas que usam o mesmo dispositivo.
- Dimensionamento conforme NBR 5410: exige validação de tabelas e critérios normativos antes de produzir recomendações técnicas.
- Exportação de PDFs, precificação, pagamento Pix e webhook Mercado Pago. Nenhuma cobrança é realizada.

## Segurança

Não coloque chaves `service_role` nem token do Mercado Pago no código do navegador. Revise as políticas RLS e os triggers antes de disponibilizar a terceiros. Para produção, preferências e documentos precisam ser isolados por usuário.
