# Painel da transmissão ao vivo (`/admin/`)

Sem servidor e sem banco de dados. O link da live fica gravado no próprio código,
no arquivo [`data/live.json`](data/live.json). O painel altera esse arquivo pelo
GitHub e o GitHub Pages republica o site sozinho, em cerca de 1 minuto.

- Painel: <https://weiriborgescerimonial.topsitebr.com.br/admin/>
- O banner lê `data/live.json`. Sem transmissão ativa, link inválido ou arquivo
  indisponível, o bloco "Ao vivo" simplesmente não aparece.

## Como funciona a senha

Para gravar no GitHub, o painel precisa de uma **chave de acesso do GitHub**
(token). Essa chave fica em [`admin/acesso.json`](admin/acesso.json)
**criptografada com a senha do painel** (AES-256-GCM, chave derivada por PBKDF2
com 600 mil iterações). Quem abrir o código vê apenas texto embaralhado. Ao digitar
a senha, o navegador destrava a chave só durante aquele acesso; nada fica salvo
no navegador.

- A senha não está escrita em lugar nenhum do código.
- Use uma senha **longa** (mínimo de 10 caracteres; de preferência uma frase).
  Como o arquivo cifrado é público, uma senha curta pode ser descoberta por tentativa.
- A chave do GitHub só consegue alterar **este** repositório (ver abaixo). No pior
  caso, alguém que descubra a senha poderia alterar o site — não outros projetos.

## 1. Configurar (uma vez, por quem mantém o site)

**Criar a chave no GitHub** (conta dona do repositório):

1. GitHub → foto de perfil → **Settings** → **Developer settings** →
   **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. *Token name*: `Painel Weiri Borges`.
3. *Expiration*: o maior prazo disponível (anotar a data; ao vencer, refazer este passo).
4. *Repository access*: **Only select repositories** → `weiriborgescerimonial`.
5. *Permissions* → *Repository permissions* → **Contents: Read and write**.
   Nenhuma outra permissão.
6. **Generate token** e copiar (começa com `github_pat_`).

**Configurar o painel:**

1. Abrir <https://weiriborgescerimonial.topsitebr.com.br/admin/>. Aparece
   **Configurar o painel**.
2. Colar a chave, definir a senha da cliente, confirmar e salvar.
3. Pronto. A chave não precisa ser guardada: ela já está cifrada no site.
   Passar a senha para a cliente.

Para trocar a senha: dentro do painel, **Trocar a senha do painel**.
Para trocar a chave (venceu ou foi revogada): na tela de login, **Reconfigurar acesso**.

## 2. Publicar uma live (para a cliente)

1. Abrir **weiriborgescerimonial.topsitebr.com.br/admin/** e digitar a senha.
2. Preencher:
   - **Título** — ex.: *Cerimônia de casamento*
   - **Descrição curta** — ex.: *Acompanhe esse momento especial ao vivo.*
   - **Link da transmissão** — copiar o link do YouTube/Instagram e colar.
   - **Texto do botão** — ex.: *Assistir à cerimônia*
3. Tocar em **Publicar agora**.
4. Aparece *"Salvo! Publicando no site…"* e, cerca de 1 minuto depois,
   *"Pronto: o destaque já aparece no site."*

**Quando a cerimônia terminar:** entrar no painel e tocar em **Retirar do ar agora**.
Os dados ficam guardados para a próxima vez — basta trocar o link e publicar.

## Para quem mantém o código

- Cada ação do painel vira um commit na `main` ("Painel: transmissão no ar — …").
  Antes de enviar alterações feitas no computador, rodar `git pull` para trazer
  esses commits.
- Não editar `admin/acesso.json` à mão.
- Imagens: `node scripts/optimize-images.mjs` gera `assets/images/web/`
  (requer `npm install --no-save sharp@0.35.5`) e `node scripts/check-images.mjs`
  confere nomes exatos e dimensões. As fotos originais ficam fora do repositório.
