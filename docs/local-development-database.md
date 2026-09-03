# Banco local de desenvolvimento

## Objetivo

O Mapa de Mandarim usa MySQL/TiDB pelo Drizzle e pode ser desenvolvido com MariaDB local. Um banco compartilhado de staging não é necessário para o desenvolvimento individual; ele só será útil quando o aplicativo for publicado, quando houver colaboração entre máquinas ou quando for preciso validar um ambiente remoto.

Este documento descreve os instaladores oficiais para Ubuntu/Linux e Windows PowerShell.

## Ubuntu/Linux

Na raiz do projeto, execute:

```bash
chmod +x scripts/setup-local-db-ubuntu.sh
./scripts/setup-local-db-ubuntu.sh
```

O script instala `mariadb-server` e `mariadb-client` caso não estejam disponíveis, inicia o serviço, cria o banco `mapa_mandarim_dev`, cria um usuário local restrito, aplica as migrações SQL em ordem e grava uma URL de conexão em `.env.local`.

É possível personalizar a instalação sem editar o script:

```bash
DB_NAME=mapa_mandarim_dev \
DB_USER=mapa_dev \
DB_PASSWORD=uma-senha-local \
./scripts/setup-local-db-ubuntu.sh
```

## Windows PowerShell

Abra o PowerShell na raiz do projeto e execute:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\setup-local-db-windows.ps1
```

O script usa o `mysql.exe` se o MariaDB já estiver instalado. Caso contrário, tenta instalar o MariaDB Server pelo `winget`, inicia o serviço do Windows, cria o banco e o usuário local, aplica as migrações em ordem e grava `.env.local`.

Parâmetros podem ser fornecidos diretamente:

```powershell
.\scripts\setup-local-db-windows.ps1 `
  -DbName mapa_mandarim_dev `
  -DbUser mapa_dev `
  -DbPassword uma-senha-local
```

O script é destinado ao **PowerShell nativo do Windows**. Usuários que executam Ubuntu dentro do WSL devem usar o script Bash de Ubuntu dentro do próprio WSL.

## Execução da API

Depois de instalar o banco, inicie a API com a variável disponível no ambiente. O instalador cria `.env.local`, que é ignorado pelo Git; a forma exata de carregar o arquivo depende do shell e do comando de desenvolvimento do projeto.

No Bash:

```bash
set -a
. ./.env.local
set +a
pnpm dev:server
```

No PowerShell:

```powershell
Get-Content .env.local | ForEach-Object {
  if ($_ -match '^([^#=]+)=(.*)$') { Set-Item -Path "Env:$($matches[1])" -Value $matches[2] }
}
pnpm dev:server
```

## Segurança e escopo

A URL real não deve ser gravada no repositório, na documentação ou em commits. O `.gitignore` bloqueia `.env`, `.env.*` e `.env*.local`, enquanto `.env.example` contém apenas valores fictícios. O banco local não é staging nem produção e não deve receber dados reais de usuários.

## Migrações

Os instaladores aplicam todos os arquivos `drizzle/*.sql` em ordem lexicográfica e registram o que já foi executado na tabela local `_mapa_local_migrations`. A execução é idempotente quando o banco foi criado pelo próprio instalador.

A migração `0007_lesson_activity_step_order.sql` corrige o índice das atividades para permitir que etapas diferentes do mesmo nó usem o mesmo `orderIndex`. Em uma instalação nova, as migrações devem ser aplicadas de `0000` até a mais recente.

## Validação realizada

O banco local foi validado com o seed do MVP e contém uma trilha, cinco nós, onze entradas lexicais e onze atividades. Também foi executado o ciclo persistido: uma atividade criou estados `learning`, cartões SRS e progresso do nó; uma avaliação `easy` atualizou o cartão para a caixa 2 e registrou um evento em `srs_reviews`.

O banco criado no sandbox atual é temporário. Em uma máquina local persistente, o MariaDB continuará disponível entre sessões; em produção, deve ser criado outro banco separado e configurado por segredo de ambiente.
