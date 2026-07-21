# Negócios à Mesa — landing page

Landing page do evento **"Negócios à Mesa: Os Desafios da Gestão Eficiente no Food Service"** (29/07/2026, 19h, Cabaña Del Primo), com inscrição gratuita e controle de vagas em tempo real por cupom de apoiador (10 vagas por cupom: `HASHTAG10`, `LIBERDATA10`, `SUPPRI10`).

O código do cupom **não aparece em nenhum lugar da página pública** — quem se inscreve precisa digitar o código que recebeu de um dos apoiadores. Tem também uma área `/admin.html` protegida por senha para ver e exportar os inscritos, e resetar cupons durante testes.

## Estrutura

- `index.html`, `style.css`, `script.js` — a página pública.
- `admin.html`, `admin.js` — área restrita para ver inscritos, exportar CSV e resetar cupons.
- `assets/` — logos dos apoiadores e fotos dos palestrantes.
- `netlify/functions/register.mjs` — recebe a inscrição, valida o cupom e bloqueia quando bate 10.
- `netlify/functions/status.mjs` — retorna quantas vagas já foram usadas por cupom (usado para os contadores ao vivo na página).
- `netlify/functions/admin-list.mjs` — retorna nome/empresa/cupom de todos os inscritos (exige a chave de admin).
- `netlify/functions/admin-reset.mjs` — zera vagas e inscritos de um cupom (ou de todos), para testes (exige a chave de admin).
- Todas as funções usam **Netlify Blobs** (armazenamento embutido do Netlify) para guardar a contagem e a lista de inscritos — não precisa de banco de dados externo.

## Como subir no Netlify

**Opção recomendada — conectando ao Git (Github/Gitlab/Bitbucket):**

1. Suba esta pasta para um repositório novo.
2. No Netlify: **Add new site → Import an existing project** e aponte para o repositório.
3. Build settings: pode deixar em branco (não há build step) — o `netlify.toml` já define `publish = "."` e `functions = "netlify/functions"`.
4. Deploy. Pronto — as funções e o site sobem juntos automaticamente.

**Opção alternativa — Netlify CLI (sem Git):**

```bash
npm install -g netlify-cli
netlify deploy --prod
```

Rode o comando dentro desta pasta. O `netlify deploy` empacota `netlify/functions` corretamente (o drag-and-drop manual pelo site do Netlify **não** publica funções).

## Testando localmente antes de subir

```bash
npm install -g netlify-cli
netlify dev
```

Isso sobe o site e as functions juntos em `http://localhost:8888`, com contagem de vagas funcionando de verdade.

## Área de admin — ver quem se inscreveu

1. No painel do Netlify: **Site configuration → Environment variables → Add a variable**.
   - Nome: `ADMIN_KEY`
   - Valor: uma senha forte à sua escolha (essa é a chave de acesso da área admin — guarde em local seguro, não fica visível no código).
2. Faça um novo deploy (ou **Deploys → Trigger deploy** ) para a variável entrar em vigor.
3. Acesse `https://seu-site.netlify.app/admin.html`, digite a chave e pronto: lista de nome + empresa + apoiador + data de cada inscrito, com botão de **Exportar CSV**.
4. Para testes, cada card de apoiador no admin tem um botão **Resetar**, e há um **Resetar tudo** no topo — isso zera as vagas e apaga os inscritos daquele cupom (ou de todos). Ação irreversível, sempre pede confirmação antes.

O `/admin.html` está bloqueado para buscadores via `robots.txt`, mas quem realmente impede acesso é a chave `ADMIN_KEY` — sem ela (ou com ela errada), a function responde 401 e nenhum dado é exposto.

Sem configurar o `ADMIN_KEY`, o `/admin.html` sempre nega o acesso (por segurança, nunca libera se a variável não existir no ambiente).

## Ajustando depois

- **Trocar os cupons ou o limite de 10 vagas**: edite o objeto/lista `COUPONS` em `netlify/functions/register.mjs`, `status.mjs` e `admin-*.mjs`, e o mapa `COUPON_LABELS` em `admin.js`.
- **Trocar textos, data, local**: tudo está direto no `index.html` (sem CMS).
- **Cores e fontes**: variáveis no topo do `style.css` (`:root`) e os links de fonte no `<head>` do `index.html` (Baloo 2 + Nunito, Google Fonts).
