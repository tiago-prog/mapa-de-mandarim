# Google OAuth no desenvolvimento local

A branch `feature/lesson-vocabulary-exposure` suporta login direto com Google através do backend Express. O fluxo utiliza OAuth 2.0 Authorization Code, consulta o perfil OpenID do Google, cria ou atualiza o utilizador local e assina uma sessão JWT própria.

O fluxo Google **não precisa de `VITE_APP_ID`, `EXPO_PUBLIC_APP_ID`, `OAUTH_SERVER_URL` ou `EXPO_PUBLIC_OAUTH_SERVER_URL`**. Esses valores pertenciam ao adaptador Manus antigo e não devem ser preenchidos para este login.

## Rotas

```text
GET /api/auth/google/start
GET /api/auth/google/callback
GET /api/auth/me
POST /api/auth/logout
```

O início do fluxo redireciona para o Google. O callback troca o `code` no servidor, portanto `GOOGLE_CLIENT_SECRET` nunca chega ao aplicativo Expo.

## Configuração mínima

Criar `.env.local` a partir de `.env.example` e preencher:

```env
JWT_SECRET=uma-chave-local-forte
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
EXPO_WEB_PREVIEW_URL=http://localhost:8081
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

No Google Cloud Console, adicionar exatamente este URI em **Authorized redirect URIs**:

```text
http://localhost:3000/api/auth/google/callback
```

Se a API for executada noutra porta, alterar simultaneamente `GOOGLE_REDIRECT_URI` e o URI autorizado no Google Cloud Console.

## Execução

```bash
pnpm install
./scripts/setup-local-db-ubuntu.sh
set -a && . ./.env.local && set +a
pnpm db:migrate
pnpm dev
```

Abrir `http://localhost:8081`. A função `getLoginUrl()` aponta diretamente para `/api/auth/google/start`.

## Identidade e sessão

O utilizador Google é associado por `google:<sub>`, onde `sub` é o identificador estável OpenID do Google. O e-mail é armazenado como atributo, não como chave primária. A sessão usa o cookie `app_session_id` no web e continua compatível com o contexto tRPC e com as procedures protegidas. O JWT da sessão não contém nem valida um App ID legado; contém apenas a identidade Google local e o nome da sessão.

## Mobile

O backend já aceita o parâmetro `returnTo` e o cliente mantém a rota `/oauth/callback`. Para produção mobile, configurar um fluxo com PKCE e callback nativo/deep link no Google Cloud Console; não transportar a sessão JWT numa query string. O caminho validado nesta etapa é o web local, que é o cenário necessário para subir e testar o projeto num computador.

## Segurança

Não commitar `.env.local`, `GOOGLE_CLIENT_SECRET` ou `JWT_SECRET`. O callback assina o `state`, limita os destinos permitidos e rejeita redirects externos não configurados.
