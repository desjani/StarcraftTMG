param(
    [string]$Host = '192.168.68.54',
    [string]$User = 'root',
    [int]$Port = 22,
    [string]$RemotePath = '/mnt/user/appdata/StarcraftTMG',
    [switch]$SkipCommandDeploy
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command ssh.exe -ErrorAction SilentlyContinue)) {
    Write-Error 'ssh.exe was not found. Install the Windows OpenSSH Client feature first.'
}

$remoteCommand = "cd $RemotePath && git pull && ./update.sh"
if (-not $SkipCommandDeploy) {
    $remoteCommand += " && docker exec starcraft-tmg node bot/deploy-commands.js"
}

Write-Host "Connecting to $User@$Host:$Port ..."
Write-Host "Running remote update pipeline..."
Write-Host ""

& ssh.exe -p $Port "$User@$Host" $remoteCommand
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
    Write-Error "Remote update failed with exit code $exitCode"
}

Write-Host ""
Write-Host 'Update completed successfully.'
