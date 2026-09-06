[CmdletBinding()]
param(
  [ValidateSet("up", "migrate", "status", "logs", "stop", "down", "reset")]
  [string]$Action = "up",

  # When omitted, an existing .env.docker is loaded automatically. If the file
  # does not exist, docker compose uses the defaults from docker-compose.yml.
  [string]$EnvFile = ".env.docker"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $RootDir

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker não foi encontrado. Instale o Docker Desktop e inicie-o antes de executar este script."
}

$ComposePrefix = @()
if ($EnvFile) {
  $EnvFilePath = if ([System.IO.Path]::IsPathRooted($EnvFile)) {
    $EnvFile
  } else {
    Join-Path $RootDir $EnvFile
  }

  if (Test-Path -LiteralPath $EnvFilePath -PathType Leaf) {
    $ComposePrefix = @("--env-file", (Resolve-Path -LiteralPath $EnvFilePath).Path)
    Write-Verbose "Usando arquivo de ambiente Docker: $EnvFilePath"
  } elseif ($EnvFile -ne ".env.docker") {
    throw "Arquivo de ambiente Docker não encontrado: $EnvFilePath"
  }
}

function Invoke-Compose {
  param([Parameter(Mandatory = $true)][string[]]$Arguments)

  & docker compose @ComposePrefix @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "docker compose falhou com código $LASTEXITCODE"
  }
}

switch ($Action) {
  "up" {
    Invoke-Compose @("up", "-d", "db")
    Invoke-Compose @("run", "--rm", "migrate")
  }
  "migrate" { Invoke-Compose @("run", "--rm", "migrate") }
  "status" { Invoke-Compose @("ps") }
  "logs" { Invoke-Compose @("logs", "-f", "db") }
  "stop" { Invoke-Compose @("stop", "db") }
  "down" { Invoke-Compose @("down") }
  "reset" {
    Write-Host "Isto vai apagar o volume local do MariaDB e todos os dados de desenvolvimento."
    $answer = Read-Host "Continuar? [y/N]"
    if ($answer -eq "y" -or $answer -eq "Y") {
      Invoke-Compose @("down", "-v")
    } else {
      Write-Host "Cancelado."
    }
  }
}
