[CmdletBinding()]
param(
  [ValidateSet("up", "migrate", "status", "logs", "stop", "down", "reset")]
  [string]$Action = "up"
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $RootDir

function Invoke-Compose {
  param([string[]]$Arguments)
  & docker compose @Arguments
  if ($LASTEXITCODE -ne 0) { throw "docker compose falhou com código $LASTEXITCODE" }
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
    if ($answer -eq "y" -or $answer -eq "Y") { Invoke-Compose @("down", "-v") }
    else { Write-Host "Cancelado." }
  }
}
