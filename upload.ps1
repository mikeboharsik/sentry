[CmdletBinding()]
Param(
  [string] $Hostname = "sentry.myfiosgateway.com",
  [int]    $SshPort = 22,
  [switch] $SkipBuild,
  [switch] $SkipUpload,
  [switch] $KeepStagingFolder
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
    yarn
    yarn build
    Pop-Location
  }
  
  Copy-Item -Path "$PSScriptRoot\client\build\**" -Recurse -Destination "$stagingFolder\client"
  Copy-Item -Path "$PSScriptRoot\server\*" -Recurse -Exclude 'node_modules','.gitignore','config.json' -Destination "$stagingFolder\server"
  Copy-Item -Path "$PSScriptRoot\snapshot_gen" -Recurse -Container:$false "$stagingFolder\snapshot_gen"
  Copy-Item -Path "$PSScriptRoot\util\**" -Recurse -Destination "$stagingFolder"

  if (!$SkipUpload) {
    Push-Location $stagingFolder

    Get-ChildItem

    ssh "pi@$Hostname" -p $SshPort "mkdir sentry"
    scp -r -P $SshPort * "scp://pi@$Hostname/sentry"
    ssh "pi@$Hostname" -p $SshPort "cd sentry; chmod +x ./init.sh;"
    
    Pop-Location
  } else {
    Write-Host ((tree /f $stagingFolder) -Join "`n")
  }
  
  if (!$KeepStagingFolder) {
    Remove-Item -Recurse -Force $stagingFolder
  }
} finally {
  Set-Location $initialDir
}
