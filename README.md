# Backend · Sistema de Recomendação de Imóveis

API REST em **Node.js (JavaScript, ESM) + Express 5 + Prisma 7 + PostgreSQL (Neon)** que substitui o `localStorage` do front-end (`Elizabeth Front/sistema-recomendacao-imoveis`).

Perfis: **cliente** (busca com % de compatibilidade e conversa com o corretor), **corretor** (gerencia imóveis e responde) e **adm** (gerencia contas; login vem do `.env`).

Documentação interativa (Swagger): `http://localhost:3333/docs`

## Como rodar

Requisitos: Node 20.19+ (testado no 24) e um banco no [Neon](https://neon.tech).

```bash
npm install
cp .env.example .env     # preencha DATABASE_URL, ADMIN_EMAIL e ADMIN_PASSWORD
npm run db:setup         # gera o client do Prisma e aplica as migrações no Neon
npm run dev              # ou: npm start
```

O `.env` precisa **apenas** de três variáveis: `DATABASE_URL`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`. As demais são opcionais (ver `.env.example`).

> **Neon:** para rodar as migrações use a URL de conexão **direta** (sem `-pooler` no host). Com a URL do pooler o `migrate deploy` pode travar no lock do Postgres. Depois da migração, a URL pooled funciona normalmente para o servidor.

### Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | servidor com reinício automático (`node --watch`) |
| `npm start` | servidor em produção |
| `npm run db:generate` | gera o client do Prisma |
| `npm run db:migrate` | aplica as migrações (`prisma migrate deploy`) |
| `npm run db:setup` | os dois acima em sequência |

## Arquitetura em camadas

```
src/
├── server.js            boot, timeouts, desligamento limpo
├── app.js               monta o Express e a ordem dos middlewares de segurança
├── config/              ambiente (validado com zod), constantes/limites, CORS
├── rotas/               URLs + corrente de middlewares de cada rota (a segurança fica visível aqui)
├── middlewares/         autenticar, exigirPapel, validar, limitadores, corpoJson, tratadorErros
├── validadores/         esquemas zod (entrada)            ┐
├── controladores/       HTTP ⇄ serviço (finos)            │ requisição
├── servicos/            regras de negócio e autorização   │ desce por
├── repositorios/        único lugar que fala com Prisma   │ estas camadas
├── serializadores/      o que sai para o cliente (DTO)    ┘
├── banco/               pool pg + PrismaClient
├── utilitarios/         senha, token, imagem, cpf, compatibilidade, logger...
└── docs/                especificação OpenAPI (Swagger)
prisma/                  schema.prisma + migrações
```

Banco (tudo em português): `usuarios`, `imoveis`, `imovel_fotos`, `conversas`, `mensagens`.

## Segurança implementada

**Autenticação e sessão**
- Senhas com **bcrypt (custo 12)**; máximo de 72 bytes (limite do bcrypt, sem truncar em silêncio).
- **JWT HS256** com algoritmo fixado na verificação (bloqueia `alg: none`), `iss`/`aud`/`exp` conferidos.
- A cada requisição o servidor confere no banco que o usuário **ainda existe** e que o token **não foi revogado** (`usuarios.versao_token`). Logout, troca de senha e redefinição pelo admin derrubam todas as sessões na hora; excluir a conta também.
- Login sem enumeração de e-mails: mesma mensagem e **mesmo custo de CPU** para e-mail inexistente.
- Trocar **e-mail ou senha exige a senha atual**; tentativas erradas têm limite próprio (um token roubado não basta para tomar a conta).
- Admin (credenciais no `.env`) com token de 2 h. Sem `JWT_SECRET` definido, trocar `ADMIN_PASSWORD` invalida também os tokens já emitidos (ver abaixo).

**Autorização**
- Perfil por rota (`exigirPapel`) **e** posse do recurso no serviço: corretor só mexe nos próprios imóveis, só os participantes enxergam uma conversa. Recurso alheio responde **404** (não revela que existe), prevenindo IDOR.
- `.strict()` em todos os esquemas: campo desconhecido (`papel`, `corretorId`, `id`...) é recusado, sem *mass assignment*.

**Entrada**
- Validação zod de corpo, query e parâmetros; CPF com dígito verificador; caractere NUL barrado (Postgres o recusaria com erro 500).
- Corpo JSON de **32 KB** por padrão; só as rotas de foto aceitam 3 MB / 22 MB, sempre depois de autenticar e limitar taxa. Só `application/json`.
- Imagens: apenas JPEG/PNG/WebP, **conferidas pelos bytes iniciais** (não pelo que o cliente declara), até 1,5 MB cada, 10 por imóvel. **SVG é recusado** (pode conter script).
- Prisma parametriza todas as consultas (sem SQL concatenado) e `CHECK`s no banco repetem as regras principais.

**Rede e cabeçalhos**
- **Helmet** (CSP `default-src 'none'` na API, HSTS, nosniff, etc.), `X-Powered-By` removido, `Cache-Control: no-store` nas respostas da API.
- **CORS por allowlist** (`CORS_ORIGINS`); origem não autorizada recebe 403.
- **Rate limit** (`express-rate-limit`): global por IP, login por IP **e** por conta (só falhas contam), cadastro, escrita e mensagens por usuário.
- Timeouts de cabeçalho/requisição contra conexões lentas; desligamento limpo (SIGTERM).

**Dados e logs**
- `senha_hash` e os bytes das fotos são **omitidos globalmente** nas consultas do Prisma (só saem quando pedidos explicitamente).
- Resposta de usuário nunca traz hash; CPF/e-mail só vão para o próprio usuário e o admin (o cliente vê do corretor apenas nome, telefone, CRECI e foto).
- Log estruturado sem corpo, query string, token ou dados pessoais; erros 500 não vazam detalhes (só um `idRequisicao`).

## Segredo do JWT sem variável extra

Como o `.env` só tem 3 variáveis, se `JWT_SECRET` não for definido o segredo é **derivado por HKDF-SHA256** de `DATABASE_URL` + `ADMIN_EMAIL` + `ADMIN_PASSWORD`. É estável entre reinícios, diferente entre ambientes e a entropia vem da senha aleatória do Neon na URL. Consequência: trocar qualquer um dos três invalida os tokens. Para produção, o ideal é definir `JWT_SECRET` próprio (`openssl rand -hex 48`).

## Endpoints (prefixo `/api/v1`)

| Método e rota | Perfil | Descrição |
|---|---|---|
| `POST /autenticacao/cadastro/cliente` · `/corretor` | público | cria a conta e já devolve a sessão |
| `POST /autenticacao/entrar` | público | `{ papel, email, senha }` com `papel` = `cliente`/`corretor`/`adm` |
| `POST /autenticacao/sair` | logado | encerra **todas** as sessões da conta |
| `GET` · `PUT /perfil` | logado | ver / editar o próprio perfil |
| `GET /imoveis` | cliente · adm | busca com filtros e `compatibilidade` (0–100), paginada |
| `GET /imoveis/meus` | corretor | imóveis do corretor (ativos e inativos) |
| `GET /imoveis/:id` | cliente (só ativos) · corretor (só seus) · adm | detalhe |
| `POST /imoveis` · `PUT /imoveis/:id` | corretor | criar / editar (com fotos) |
| `PATCH /imoveis/:id/status` | corretor | ativar / desativar |
| `DELETE /imoveis/:id` | corretor dono · adm | excluir |
| `POST /imoveis/:id/mensagens` | cliente | escreve ao corretor (abre a conversa) |
| `GET /conversas` · `GET /conversas/nao-lidas` | cliente · corretor | conversas e contador do sininho |
| `POST /conversas/:id/mensagens` | cliente · corretor | responder |
| `POST /conversas/lidas` · `/:id/lidas` | cliente · corretor | marcar como lidas |
| `GET /midia/imoveis/:uuid` · `/midia/corretores/:id` | público | imagens (URL com UUID, cache longo) |
| `GET /admin/resumo` | adm | totais do dashboard |
| `GET/POST /admin/clientes`, `GET/PUT/DELETE /admin/clientes/:id` | adm | CRUD de clientes (idem `/admin/corretores`) |
| `GET /saude` | público | liveness + banco |

Erros seguem sempre `{ "erro": { "codigo", "mensagem", "detalhes?", "idRequisicao" } }`.

## Ajustes necessários no front-end ao integrar

O contrato mantém o vocabulário do front (`papel`, `ativo/inativo`, `areaM2`, `dataNascimento`, CPF/telefone formatados), mas há diferenças:

1. **Tudo vira assíncrono:** `storage.js`/`auth.js` passam a chamar a API com `Authorization: Bearer <token>`. A sessão guarda `token` (e `expiraEm`).
2. **Senha mínima de 8 caracteres** (o front validava 6).
3. **Login envia o `papel`** da tela usada. A tela do admin não edita e-mail/senha (vêm do `.env`).
4. **Perfil:** para trocar e-mail ou senha, enviar também `senhaAtual` (campo novo na tela). Ao trocar a senha a resposta traz um `token` novo: substitua o guardado.
5. **Fotos:** a API devolve **URLs relativas** (`/api/v1/midia/imoveis/<uuid>`): prefixe com a URL do backend no `<img src>`. No envio continue mandando a data URL do `FileReader`; ao editar um imóvel, reenvie as URLs das fotos que quer manter (na ordem) e data URLs das novas.
6. **Foto de até 1,5 MB:** fotos de celular costumam ser maiores; redimensione no navegador (canvas) antes de enviar.
7. **IDs** agora são únicos entre clientes e corretores (mesma tabela). Mensagens chegam agrupadas em `conversas`, não mais soltas por `imovelId-clienteId`.
8. **Compatibilidade** vem pronta no campo `compatibilidade` de cada imóvel (a lógica saiu do `dashboard.js`).
9. **CPF** passa a ser validado de verdade (dígitos verificadores) e é único por perfil.

## Decisões e limites (para saber antes de ir a produção)

- **Fotos ficam no Postgres** (não há storage no escopo). Funciona, mas o plano gratuito do Neon tem 0,5 GB: com ~1 MB por foto, ~10 fotos por imóvel enchem rápido. Se crescer, migrar para um bucket (S3/R2/Cloudinary) e guardar só a URL.
- **Rate limit em memória:** vale para 1 instância. Com várias, trocar o `store` por Redis.
- **Atrás de proxy** (Render etc.) defina `TRUST_PROXY=1`; sem isso todos os usuários parecem ter o mesmo IP.
- **Busca:** os filtros numéricos rodam no banco; a compatibilidade é calculada em memória sobre até 1.000 imóveis ativos por consulta. Suficiente para uma cidade; acima disso, mover o cálculo para SQL.
- **Token em `localStorage`** (como o front faz hoje) fica exposto a XSS: mantenha o `escapeHtml` em tudo que vem da API (nomes, mensagens, bairros).
- Excluir um **corretor** apaga também os imóveis dele; excluir um **cliente** apaga as conversas. Excluir um **imóvel** preserva o histórico da conversa (com `imovel: null`).
- Sem refresh token: o usuário reloga quando o JWT expira (8 h por padrão).

## Deploy (ex.: Render)

- Build: `npm install && npm run db:setup`
- Start: `npm start`
- Variáveis: `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NODE_ENV=production`, `TRUST_PROXY=1`, `CORS_ORIGINS=https://seu-front`
