# theciae notes auto-sync
# Commits and pushes anything added under courses\ to GitHub.
# Scheduled via Windows Task Scheduler (task name: theciae-notes-sync).
$repo = "E:\theciae"
$log  = "$env:TEMP\theciae-sync.log"
function Log($m) { Add-Content -Path $log -Value "$(Get-Date -Format s)  $m" }

Set-Location $repo
$branch = (git rev-parse --abbrev-ref HEAD 2>$null)
if ($branch -ne "main") { Log "skipped: repo is on branch '$branch', not main"; exit 0 }

git pull --rebase origin main 2>&1 | Out-Null
git add -- courses/ 2>&1 | Out-Null
$staged = git diff --cached --name-only -- courses/
if ($staged) {
  $n = ($staged | Measure-Object).Count
  git commit -m "Add notes via folder auto-sync ($n file(s))" 2>&1 | Out-Null
  git push origin main 2>&1 | Out-Null
  Log "pushed $n file(s): $($staged -join ', ')"
} else {
  Log "nothing new"
}
