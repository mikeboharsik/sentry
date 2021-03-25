[CmdletBinding()]
Param(
  [string] $Hostname = "sentry.myfiosgateway.com",
  [switch] $SkipBuild,
  [switch] $SkipUpload
)

$stagingFolder = "$PSScriptRoot\staging"

$initialDir = Get-Location

try {
  if (Test-Path $stagingFolder) {
    Remove-Item -Recurse -Force $stagingFolder
  }

  $uploadDir = "$PSScriptRoot\upload"
  New-Item -ItemType "directory" "$stagingFolder" | Out-Null
  New-Item -ItemType "directory" "$stagingFolder\client" | Out-Null
  New-Item -ItemType "directory" "$stagingFolder\server" | Out-Null

  if (!$SkipBuild) {
    Push-Location "$PSScriptRoot\client"
    yarn build
    Pop-Location
  }
  
  Copy-Item -Path "$PSScriptRoot\client\gulp-build\index.html" -Recurse -Destination "$stagingFolder\client"

  Copy-Item -Path "$PSScriptRoot\server\*.js*" -Recurse -Container:$false -Destination "$stagingFolder\server"
  Copy-Item -Path "$PSScriptRoot\server\.env*" -Recurse -Container:$false -Destination "$stagingFolder\server"

  Copy-Item -Path "$PSScriptRoot\snapshot_gen" -Recurse -Container:$false "$stagingFolder\snapshot_gen"

  $utilFiles = 'init.sh', 'ksnp', 'ksrv', 'snp', 'srv'
  Copy-Item -Path $utilFiles -Destination "$stagingFolder"

  if (!$SkipUpload) {
    Push-Location $stagingFolder

    Get-ChildItem

    ssh "pi@$Hostname" "mkdir sentry"
    scp -r * "scp://pi@$Hostname/sentry"
    ssh "pi@$Hostname" "cd sentry; chmod +x ./init.sh;"
  } else {
    Write-Host ((tree /f $stagingFolder) -Join "`n")
  }
} finally {
  Set-Location $initialDir
}