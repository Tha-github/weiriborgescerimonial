# Transmissão ao vivo — configuração e uso

O site continua 100% estático no GitHub Pages. O Supabase guarda **uma**
transmissão em destaque e faz o login do painel. Nada precisa de novo commit ou
deploy para publicar ou retirar uma live.

```
Visitante ──► index.html ──► js/live.js ──(leitura pública, só se ativa)──► Supabase
Administradora ──► /admin/ ──► login (Supabase Auth) ──► salvar (RLS: só admin) ──► Supabase
```

- **Site público** (`js/live.js`): uma requisição de leitura. Sem transmissão ativa,
  sem configuração, sem internet ou com o Supabase fora do ar, o bloco não aparece
  e o banner fica como sempre. Títulos e descrições são inseridos como texto; links
  que não sejam `https://` são ignorados.
- **Painel** (`admin/`): login por e-mail e senha, edição, prévia, ativar/desativar.
- **Segurança** (`supabase/schema.sql`): Row Level Security. Visitantes só leem a
  transmissão ativa; somente contas listadas em `admin_users` gravam; ninguém
  exclui pela API; o banco recusa links que não sejam HTTPS.

## 1. Configurar o Supabase (uma vez)

1. Criar uma conta e um projeto em <https://supabase.com> (o plano gratuito basta).
2. **SQL Editor → New query**: colar todo o conteúdo de `supabase/schema.sql` e
   clicar em **Run**. Pode ser executado de novo sem problemas.
3. **Authentication → Sign In / Providers**: manter **Allow new users to sign up**
   **ligado** (é o que permite o primeiro cadastro). Não há risco: o banco aceita
   **somente o primeiro cadastro**, que vira administradora; qualquer cadastro
   posterior é recusado pelo gatilho `claim_first_admin`.
4. **Confirmação de e-mail** (Authentication → Sign In / Providers → Email →
   *Confirm email*):
   - **Ligada** (padrão, recomendado): após o cadastro, a cliente recebe um e-mail e
     toca no link para entrar. Configurar em **Authentication → URL Configuration**
     o *Site URL* como `https://weiriborgescerimonial.topsitebr.com.br/admin/`.
   - **Desligada**: o cadastro entra direto no painel.
5. **Fazer o primeiro acesso logo após configurar** (ver seção 3): a primeira conta
   criada é a administradora. Conferir no SQL Editor:
   `select u.email from public.admin_users a join auth.users u on u.id = a.user_id;`
6. **Project Settings → API Keys / Data API**: copiar
   - a **Project URL** (ex.: `https://abcdefghijkl.supabase.co`);
   - a chave **publishable** (`sb_publishable_...`) ou, em projetos antigos, a **anon**.

   **Nunca** usar a chave `secret` / `service_role` no site.
7. Preencher `js/config.js`:

   ```js
   supabaseUrl: 'https://abcdefghijkl.supabase.co',
   supabaseKey: 'sb_publishable_...',
   ```

   Essas duas informações são públicas por natureza (ficam visíveis no navegador);
   a proteção está nas políticas RLS do passo 2.

Opcional: restringir o CSP ao projeto. Em `scripts/security-policy.mjs`, trocar
`SUPABASE_ORIGIN` por `https://abcdefghijkl.supabase.co` e executar
`node scripts/security-policy.mjs --sync`. No `admin/index.html`, ajustar o
`connect-src` da meta CSP da mesma forma.

### Trocar a senha ou a administradora

- Em **Authentication → Users**, excluir a conta atual. A tela **Criar cadastro**
  volta a aparecer em `/admin/` e o próximo cadastro vira a nova administradora.
  (Fazer o novo cadastro logo em seguida.)

### Plano gratuito

Projetos gratuitos do Supabase podem ser **pausados após um período sem uso**. Se
isso acontecer, o site continua normal (apenas sem o destaque) e o painel não
consegue entrar. Basta reativar o projeto no painel do Supabase.

## 2. Publicar no GitHub Pages

O GitHub Pages publica a branch `main`, pasta raiz. Depois de preencher
`js/config.js`, fazer commit e push dos arquivos do site. Não há etapa de build.

- Site: <https://weiriborgescerimonial.topsitebr.com.br/>
- Painel: <https://weiriborgescerimonial.topsitebr.com.br/admin/>

O painel não aparece em menus e tem `noindex`, mas **não depende de ser secreto**:
sem uma conta autorizada não é possível alterar nada.

## 3. Como publicar uma live (para a cliente)

**Primeiro acesso (uma única vez):** abrir **weiriborgescerimonial.topsitebr.com.br/admin/**. Aparece
**Criar cadastro**: informar e-mail, senha (mínimo de 8 caracteres) e confirmar a
senha. Se a confirmação de e-mail estiver ligada, abrir o e-mail recebido e tocar no
link. Daí em diante o painel sempre pede apenas o login.

1. Abrir **weiriborgescerimonial.topsitebr.com.br/admin/** no celular ou computador e entrar com
   e-mail e senha.
2. Preencher:
   - **Título** — ex.: *Cerimônia de casamento*
   - **Descrição curta** — ex.: *Acompanhe esse momento especial ao vivo.*
   - **Link da transmissão** — copiar o link do YouTube/Instagram e colar.
   - **Texto do botão** — ex.: *Assistir à cerimônia*
3. Tocar em **Publicar agora** (ou ligar **Exibir no site** e tocar em **Salvar
   alterações**).
4. Aparece *"No ar — aparecendo no site"*. Quem abrir ou atualizar o site já vê.

**Quando a cerimônia terminar:** entrar no painel e tocar em **Retirar do ar agora**.
Os dados ficam guardados para a próxima vez — basta trocar o link e publicar.

Dica: o link precisa começar com `https://`. Se colar sem isso
(ex.: `youtube.com/live/...`), o painel completa sozinho.

## 4. Imagens

As fotos originais ficam onde foram enviadas (`assets/images/`, `assets/images/galeria/`,
`assets/logo/`). O site usa versões otimizadas em `assets/images/web/` (WebP + JPEG/PNG),
geradas por:

```sh
npm install --no-save sharp@0.35.5   # uma vez por máquina
node scripts/optimize-images.mjs     # gera assets/images/web/
node scripts/check-images.mjs        # confere nomes exatos e dimensões no HTML
```

Galeria "Muito mais do que organizar um casamento": 9 fotos (`galeria/01`–`09`).
"Histórias que merecem ser lembradas": 6 fotos (`portfolio/10`–`16`, sem a 14).
Para trocar uma foto: substituir o arquivo, ajustar a lista `SOURCES` em
`scripts/optimize-images.mjs` se o nome mudar, gerar e conferir.

As fotos originais somam dezenas de MB e não são carregadas pelo site. Avaliar se
devem ser versionadas no repositório (ficam acessíveis publicamente pelo GitHub Pages).
