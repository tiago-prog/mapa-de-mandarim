[CmdletBinding()]
param(
    [string]$DbName = $(if ($env:DB_NAME) { $env:DB_NAME } else { 'mapa_mandarim_dev' }),
    [string]$DbUser = $(if ($env:DB_USER) { $env:DB_USER } else { 'mapa_dev' }),
    [string]$DbPassword = $(if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { 'mapa_dev_local' }),
    [string]$DbHost = $(if ($env:DB_HOST) { $env:DB_HOST } else { '127.0.0.1' }),
    [int]$DbPort = $(if ($env:DB_PORT) { [int]$env:DB_PORT } else { 3306 }),
    [string]$RootUser = $(if ($env:MYSQL_ROOT_USER) { $env:MYSQL_ROOT_USER } else { 'root' }),
    [string]$RootPassword = $(if ($env:MYSQL_ROOT_PASSWORD) { $env:MYSQL_ROOT_PASSWORD } else { '' })
)

$ErrorActionPreference = 'Stop'
$RootDir = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $RootDir '.env.local'

function Write-Log([string]$Message) {
    Write-Host "[mapa-db] $Message"
}

function Fail([string]$Message) {
    throw "[mapa-db] erro: $Message"
}

function Get-Executable([string]$Name) {
    return Get-Command $Name -ErrorAction SilentlyContinue
}

$mysql = Get-Executable 'mysql.exe'
if (-not $mysql) {
    $winget = Get-Executable 'winget.exe'
    if (-not $winget) {
        Fail 'mysql.exe não foi encontrado. Instale o MariaDB Server ou o winget antes de executar este script.'
    }
    Write-Log 'MariaDB não encontrado; instalando pelo winget.'
    & $winget.Source install --id MariaDB.Server --exact --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        Fail 'a instalação do MariaDB pelo winget falhou.'
    }
    $mysql = Get-Executable 'mysql.exe'
    if (-not $mysql) {
        Fail 'MariaDB foi instalado, mas mysql.exe não está no PATH atual. Abra um novo PowerShell e execute novamente.'
    }
}

$service = Get-Service -Name 'MariaDB', 'MySQL', 'mariadb' -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $service) {
    Fail 'nenhum serviço MariaDB/MySQL foi encontrado após a instalação.'
}
if ($service.Status -ne 'Running') {
    Write-Log "Iniciando o serviço $($service.Name)."
    Start-Service -Name $service.Name
}

function Invoke-MySql([string[]]$Arguments) {
    $previousPassword = $env:MYSQL_PWD
    try {
        if ($RootPassword) { $env:MYSQL_PWD = $RootPassword }
        & $mysql.Source --protocol=tcp --host=$DbHost --port=$DbPort --user=$RootUser @Arguments
        if ($LASTEXITCODE -ne 0) { Fail "o cliente MySQL falhou com código $LASTEXITCODE." }
    }
    finally {
        $env:MYSQL_PWD = $previousPassword
    }
}

function Invoke-MySqlInput([string]$Sql) {
    $previousPassword = $env:MYSQL_PWD
    try {
        $env:MYSQL_PWD = $DbPassword
        $Sql | & $mysql.Source --protocol=tcp --host=$DbHost --port=$DbPort --user=$DbUser $DbName
        if ($LASTEXITCODE -ne 0) { Fail "a execução SQL falhou com código $LASTEXITCODE." }
    }
    finally {
        $env:MYSQL_PWD = $previousPassword
    }
}

Write-Log 'Criando banco e usuário local (se necessário).'
$bootstrapSql = @"
CREATE DATABASE IF NOT EXISTS ``$DbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DbUser'@'localhost' IDENTIFIED BY '$DbPassword';
ALTER USER '$DbUser'@'localhost' IDENTIFIED BY '$DbPassword';
GRANT ALL PRIVILEGES ON ``$DbName``.* TO '$DbUser'@'localhost';
FLUSH PRIVILEGES;
"@
Invoke-MySql @('-e', $bootstrapSql)

Invoke-MySqlInput 'CREATE TABLE IF NOT EXISTS `_mapa_local_migrations` (`name` varchar(255) NOT NULL PRIMARY KEY, `appliedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP);'

$migrations = Get-ChildItem -Path (Join-Path $RootDir 'drizzle') -Filter '*.sql' | Sort-Object Name
foreach ($migration in $migrations) {
    $name = $migration.Name
    $checkSql = "SELECT COUNT(*) FROM _mapa_local_migrations WHERE name = '$name';"
    $previousPassword = $env:MYSQL_PWD
    try {
        $env:MYSQL_PWD = $DbPassword
        $applied = (& $mysql.Source --batch --skip-column-names --protocol=tcp --host=$DbHost --port=$DbPort --user=$DbUser $DbName -e $checkSql).Trim()
        if ($LASTEXITCODE -ne 0) { Fail "não foi possível consultar o controle da migração $name." }
    }
    finally {
        $env:MYSQL_PWD = $previousPassword
    }

    if ($applied -eq '1') {
        Write-Log "Migração já aplicada: $name"
        continue
    }

    Write-Log "Aplicando $name"
    Invoke-MySqlInput (Get-Content -LiteralPath $migration.FullName -Raw -Encoding UTF8)
    Invoke-MySqlInput "INSERT INTO _mapa_local_migrations (name) VALUES ('$name');"
}

$validationSql = 'SELECT COUNT(*) AS lesson_activities FROM lesson_activities; SELECT COUNT(*) AS srs_cards FROM srs_cards;'
Invoke-MySqlInput $validationSql

$connection = "mysql://${DbUser}:${DbPassword}@${DbHost}:${DbPort}/${DbName}"
Set-Content -LiteralPath $EnvFile -Value "DATABASE_URL=$connection" -Encoding UTF8
Write-Log "Banco local pronto. Configuração salva em $EnvFile."
Write-Log 'A URL não deve ser commitada; use o arquivo somente no ambiente local.'
