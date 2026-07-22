# Negócios à Mesa — landing page

Site do evento **"Negócios à Mesa: Os Desafios da Gestão Eficiente no Food Service"** (29/07/2026, 19h, Cabaña Del Primo), com inscrição gratuita e vagas exclusivas por apoiador.

Cada apoiador tem sua **própria página** com limite de **10 vagas**:

| Apoiador | Página | Cupom interno | Email do responsável |
|---|---|---|---|
| #hashtag entrega | `/hashtag.html` | `HASHTAG10` | `davi.duarte@hashtagentrega.com` |
| Liberdata | `/liberdata.html` | `LIBERDATA10` | `setormarketing.liber@gmail.com` |
| Suppri | `/suppri.html` | `SUPPRI10` | `pedro.maranhao@usesuppri.com.br` |

A página principal (`index.html`) funciona como um hub: só mostra a logo de cada apoiador e um botão que leva para a página certa. Cada apoiador divulga só o link da sua própria página — não precisa mais de código.

**Nenhuma página pública mostra quantas vagas restam** — isso é só pro admin acompanhar. Se as 10 vagas de um apoiador já encheram, a pessoa só descobre ao tentar se inscrever (aparece a mensagem "as vagas esgotaram" depois de clicar em confirmar) — o limite continua sendo garantido de verdade no servidor, só não é mostrado antes.

A cada inscrição feita numa página, um **email automático** é enviado para o responsável daquele apoiador (nome + empresa da pessoa). O `/admin.html` mostra todas as inscrições juntas, de todos os apoiadores, quantas vagas já foram usadas de cada um, e se o email foi enviado com sucesso.

## Estrutura

- `index.html`, `style.css` — página hub (logo + botão de cada apoiador, sem nenhuma contagem de vagas visível).
- `hashtag.html`, `liberdata.html`, `suppri.html` + `sponsor.js` — página de inscrição dedicada de cada apoiador (mesmo conteúdo do evento, formulário só com Nome e Empresa).
- `admin.html`, `admin.js` — área restrita pra ver todos os inscritos, quantas vagas restam por apoiador, status do email e exportar CSV.
- `assets/` — logos dos apoiadores e fotos dos palestrantes.
- `netlify/functions/register.mjs` — recebe a inscrição, valida o cupom, bloqueia quando bate 10, e envia o email de notificação pro responsável.
- `netlify/functions/admin-list.mjs` — retorna nome/empresa/apoiador/status do email de todos os inscritos (exige a chave de admin — as contagens por apoiador são calculadas a partir dessa lista).
- `netlify/functions/admin-reset.mjs` — zera vagas e inscritos de um apoiador (ou de todos), para testes (exige a chave de admin).
- Todas as funções usam **Netlify Blobs** (armazenamento embutido do Netlify) para guardar a contagem e a lista de inscritos — não precisa de banco de dados externo.

## Variáveis de ambiente necessárias no Netlify

No painel do Netlify: **Site configuration → Environment variables → Add a variable**. Depois de cadastrar, sempre dispare um novo deploy (**Deploys → Trigger deploy**) para as variáveis entrarem em vigor.

| Variável | Valor | Pra que serve |
|---|---|---|
| `ADMIN_KEY` | senha à sua escolha | acesso ao `/admin.html` |
| `EMAIL` | o email do Gmail que envia os avisos | remetente das notificações |
| `SENHA` | a **senha de app** desse Gmail (não é a senha normal da conta) | autenticação SMTP |

**Importante sobre `EMAIL`/`SENHA`:** o Gmail não aceita mais login de app com a senha normal da conta — precisa gerar uma [senha de app](https://myaccount.google.com/apppasswords) (só disponível com verificação em duas etapas ativada). O arquivo `.env` local (se você tiver um pra testar com `netlify dev`) **nunca deve ser commitado** — já está no `.gitignore`. Sem essas duas variáveis configuradas no Netlify, a inscrição continua funcionando normalmente, só o email não é enviado (fica marcado como "Falhou" no admin).

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

Isso sobe o site e as functions juntos em `http://localhost:8888`, lendo automaticamente o `.env` local (se existir) para `EMAIL`/`SENHA`/`ADMIN_KEY`.

## Área de admin — ver quem se inscreveu

1. Configure a variável `ADMIN_KEY` (veja a tabela acima).
2. Acesse `https://seu-site.netlify.app/admin.html`, digite a chave e pronto: lista de nome + empresa + apoiador + data + status do email de cada inscrito, com botão de **Exportar CSV**.
3. Para testes, cada card de apoiador no admin tem um botão **Resetar**, e há um **Resetar tudo** no topo — isso zera as vagas e apaga os inscritos daquele apoiador (ou de todos). Ação irreversível, sempre pede confirmação antes.

O `/admin.html` está bloqueado para buscadores via `robots.txt`, mas quem realmente impede acesso é a chave `ADMIN_KEY` — sem ela (ou com ela errada), a function responde 401 e nenhum dado é exposto. Sem configurar o `ADMIN_KEY`, o `/admin.html` sempre nega o acesso (por segurança, nunca libera se a variável não existir no ambiente).

## Ajustando depois

- **Trocar o email de algum apoiador**: edite `COUPON_CONTACTS` em `netlify/functions/register.mjs`.
- **Trocar os cupons ou o limite de 10 vagas**: edite o objeto/lista `COUPONS` em `netlify/functions/register.mjs` e `admin-*.mjs`, o mapa `COUPON_LABELS` em `admin.js`, e o `data-coupon` no `<body>` da página do apoiador correspondente.
- **Trocar textos, data, local**: está direto em cada `.html` (sem CMS) — repita a mudança em `index.html` e nas 3 páginas de apoiador.
- **Cores e fontes**: variáveis no topo do `style.css` (`:root`) e os links de fonte no `<head>` de cada página (Baloo 2 + Nunito, Google Fonts).
