[CmdletBinding()]
Param(
  [string] $Hostname = "sentry.myfiosgateway.com",
  [switch] $SkipBuild,
  [switch] $SkipUpload
)

$initialDir = Get-Location

try {
  if (Test-Path '.\upload') {
    Remove-Item -Recurse -Force '.\upload'
  }

  $uploadDir = "$PSScriptRoot\upload"
  New-Item -ItemType "directory" "$uploadDir" | Out-Null
  New-Item -ItemType "directory" "$uploadDir\client" | Out-Null
  New-Item -ItemType "directory" "$uploadDir\server" | Out-Null

  if (!$SkipBuild) {
    Push-Location "$PSScriptRoot\client"
    yarn build
    Pop-Location
  }
  
  Copy-Item -Path "$PSScriptRoot\client\gulp-build\index.html" -Recurse -Destination "$uploadDir\client"

  Copy-Item -Path "$PSScriptRoot\server\*.js*" -Recurse -Container:$false -Destination "$uploadDir\server"
  Copy-Item -Path "$PSScriptRoot\server\.env*" -Recurse -Container:$false -Destination "$uploadDir\server"

  Copy-Item -Path "$PSScriptRoot\snapshot_gen" -Recurse -Container:$false "$uploadDir\snapshot_gen"

  $utilFiles = 'config.json', 'init.sh', 'ksnp', 'ksrv', 'snp', 'srv'
  Copy-Item -Path $utilFiles -Destination "$uploadDir"

  if (!$SkipUpload) {
    Push-Location $uploadDir

    Get-ChildItem

    ssh "pi@$Hostname" "mkdir sentry"
    scp -r * "scp://pi@$Hostname/sentry"
    ssh "pi@$Hostname" "cd sentry; chmod +x ./init.sh;"
  } else {
    Write-Host ((tree /f $uploadDir) -Join "`n")
  }
} finally {
  Set-Location $initialDir
}