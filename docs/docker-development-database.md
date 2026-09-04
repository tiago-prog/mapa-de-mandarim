# Banco de desenvolvimento com Docker Compose

O projeto inclui um `docker-compose.yml` para executar o MariaDB localmente e um serviço de ferramentas que aplica todas as migrações versionadas do diretório `drizzle/`. Os dados ficam num volume Docker persistente chamado `mapa-de-mandarim-mariadb`.

## Pré-requisitos

É necessário ter Docker Engine e o plugin Docker Compose disponíveis:

```bash
docker --version
docker compose version
```

## Windows com Docker Desktop

O ambiente principal recomendado para Windows é o **PowerShell com Docker Desktop em execução**. Não é necessário instalar MariaDB diretamente no Windows nem iniciar o serviço dentro do WSL.

Na raiz do projeto, execute:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\docker-db.ps1 -Action up
```

Para as restantes operações:

```powershell
.\scripts\docker-db.ps1 -Action status
.\scripts\docker-db.ps1 -Action migrate
.\scripts\docker-db.ps1 -Action logs
.\scripts\docker-db.ps1 -Action stop
.\scripts\docker-db.ps1 -Action down
.\scripts\docker-db.ps1 -Action reset
```

O PowerShell chama `docker compose` diretamente. O Docker Desktop fornece o motor Linux e o volume persistente, enquanto o código continua no filesystem do Windows.

Se preferires executar pelo WSL, ativa a integração da distribuição no Docker Desktop e usa o script Bash. Não executes os dois fluxos ao mesmo tempo:

```bash
./scripts/docker-db.sh up
```

## Primeiro arranque

Na raiz do projeto:

```bash
chmod +x scripts/docker-db.sh
./scripts/docker-db.sh up
```

O comando executa, em ordem:

```text
MariaDB 11.4
      ↓ healthcheck
runner de migrações
      ↓
0000 até à migração mais recente
```

O runner usa a tabela `_mapa_local_migrations` para que a operação seja idempotente. Executá-lo novamente apenas ignora as migrações que já foram aplicadas.

## Configuração

Os defaults estão no Compose e são adequados para desenvolvimento local. Para personalizar, copia o exemplo:

```bash
cp .env.docker.example .env.docker
```

Depois executa os comandos com:

```bash
docker compose --env-file .env.docker up -d db
docker compose --env-file .env.docker run --rm migrate
```

Não uses a mesma porta se já existir MariaDB ou MySQL local. Por exemplo:

```env
DB_PORT=3307
```

Nesse caso, o host conecta em `127.0.0.1:3307`, mas os containers comunicam internamente pela porta `3306`.

## Comandos úteis

```bash
./scripts/docker-db.sh up       # sobe o banco e aplica migrações
./scripts/docker-db.sh migrate  # aplica apenas migrações pendentes
./scripts/docker-db.sh status   # mostra estado dos containers
./scripts/docker-db.sh logs     # acompanha os logs do MariaDB
./scripts/docker-db.sh stop     # para o banco sem apagar dados
./scripts/docker-db.sh down     # remove os containers sem apagar o volume
./scripts/docker-db.sh reset    # remove containers e volume, apagando os dados
```

## Ligar a aplicação ao banco

O backend executado fora do Docker deve usar `127.0.0.1` e a porta publicada:

```env
DATABASE_URL=mysql://mapa_dev:mapa_dev_local@127.0.0.1:3306/mapa_mandarim_dev
MAPA_RUNTIME_MODE=persistent
```

Depois inicia:

```bash
pnpm dev
```

A API usa `localhost:3000` e o Expo web usa `localhost:8081`.

## Executar tudo dentro do Compose

Nesta primeira versão, o Compose automatiza o banco e as migrações. A API e o Metro continuam a ser executados com `pnpm dev`, porque o desenvolvimento mobile precisa de acesso ao servidor Expo, hot reload e ferramentas nativas do computador.

O container `migrate` é intencionalmente um serviço one-shot: constrói as dependências necessárias, espera pelo healthcheck do banco e termina depois de aplicar as migrações.

## Persistência e reset

`docker compose down` não apaga os dados. Para apagar completamente o banco de desenvolvimento:

```bash
./scripts/docker-db.sh reset
```

Esta operação é destrutiva apenas para o volume local do projeto. Não deve ser usada com dados de produção.
