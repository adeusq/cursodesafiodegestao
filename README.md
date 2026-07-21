# Negócios à Mesa — landing page

Landing page do evento **"Negócios à Mesa: Os Desafios da Gestão Eficiente no Food Service"** (29/07/2026, 19h, Cabaña Del Primo), com inscrição gratuita e controle de vagas em tempo real por cupom de apoiador (10 vagas por cupom: `HASHTAG10`, `LIBERDATA10`, `SUPPRI10`).

## Estrutura

- `index.html`, `style.css`, `script.js` — a página em si.
- `assets/` — logos dos apoiadores e fotos dos palestrantes.
- `netlify/functions/register.mjs` — recebe a inscrição, valida o cupom e bloqueia quando bate 10.
- `netlify/functions/status.mjs` — retorna quantas vagas já foram usadas por cupom (usado para os contadores ao vivo na página).
- As duas funções usam **Netlify Blobs** (armazenamento embutido do Netlify) para guardar a contagem e a lista de inscritos — não precisa de banco de dados externo.

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

## Onde ver os inscritos

Os dados ficam guardados no Netlify Blobs (armazém `inscricoes-food-service`, chaves `count-<CUPOM>` e `list-<CUPOM>`). Para exportar a lista de inscritos, dá pra criar uma function extra de leitura, ou consultar via `netlify blobs` na CLI:

```bash
netlify blobs:get inscricoes-food-service list-HASHTAG10
```

## Ajustando depois

- **Trocar os cupons ou o limite de 10 vagas**: edite o objeto `COUPONS` em `netlify/functions/register.mjs` e a constante `LIMIT`/lista em `netlify/functions/status.mjs`, além dos `value` dos radios em `index.html`.
- **Trocar textos, data, local**: tudo está direto no `index.html` (sem CMS).
- **Cores e fontes**: variáveis no topo do `style.css` (`:root`) e os links de fonte no `<head>` do `index.html` (Baloo 2 + Nunito, Google Fonts).
