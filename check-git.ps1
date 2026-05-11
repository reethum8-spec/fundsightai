if (Test-Path .git) { Write-Output "has-git" } else { Write-Output "no-git" }
