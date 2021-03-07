[CmdletBinding()]
Param(
  [string] $Hostname = "sentry.myfiosgateway.com"
)

ssh "pi@$Hostname" "mkdir sentry"

scp -r * "scp://pi@$Hostname/sentry"

ssh "pi@$Hostname" "cd sentry; chmod +x ./init.sh"