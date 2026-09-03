# Banco local de desenvolvimento

## Estado atual

Foi provisionado no sandbox um MariaDB local compatível com o driver `mysql2` e com o dialeto MySQL usado pelo Drizzle. O banco se chama `mapa_mandarim_dev`, escuta apenas localmente e recebeu as migrações `0000` a `0007`.

Este banco é **temporário e específico do sandbox atual**. Ele não é staging, não é compartilhado com outros desenvolvedores e não deve ser tratado como ambiente de produção. A ausência de uma `DATABASE_URL` externa continua registrada no backlog como bloqueio de staging.

## Uso local

A variável de conexão deve existir somente no ambiente de execução:

```bash
export DATABASE_URL='mysql://<usuario>:<senha>@127.0.0.1:3306/mapa_mandarim_dev'
```

Não gravar a URL no repositório, em documentação com credenciais reais ou em commits. O arquivo `.gitignore` também bloqueia arquivos locais de ambiente.

Para iniciar a API conectada ao banco:

```bash
DATABASE_URL="$DATABASE_URL" pnpm dev:server
```

Para validar o schema em uma instalação local nova, aplique os arquivos SQL em ordem, de `drizzle/0000_*.sql` até a migração mais recente. A migração `0007_lesson_activity_step_order.sql` corrige o índice das atividades para permitir que etapas diferentes do mesmo nó usem o mesmo `orderIndex`.

## Validação realizada

O banco local foi validado com o seed do MVP e contém uma trilha, cinco nós, onze entradas lexicais e onze atividades. Também foi executado o ciclo persistido: uma atividade criou estados `learning`, cartões SRS e progresso do nó; uma avaliação `easy` atualizou o cartão para a caixa 2 e registrou um evento em `srs_reviews`.

A validação de staging real ainda depende de provisionar um banco MySQL/TiDB externo e disponibilizar a respectiva `DATABASE_URL` no ambiente de execução.
