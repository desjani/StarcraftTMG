$nodeDir = Join-Path $PSScriptRoot '.tools\node-v24.14.1-win-x64'
if (-not (Test-Path $nodeDir)) {
    Write-Error "Portable Node.js not found at $nodeDir"
    exit 1
}
$env:Path = "$nodeDir;$nodeDir\node_modules\npm\bin;$env:Path"
Write-Host "Node enabled for this shell:"
node --version
npm --version
