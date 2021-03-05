Param(
  [string] $Hostname = "sentry.myfiosgateway.com"
)

scp -r * "scp://pi@$Hostname/sentry"
ssh "pi@$Hostname" "pushd sentry; ./ksnp; ./ksrv; ./snp; ./srv; popd"