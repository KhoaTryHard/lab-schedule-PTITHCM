param(
  [string]$MysqlPath = "",
  [string]$HostName = "localhost",
  [int]$Port = 3306,
  [string]$RootUser = "root",
  [string]$RootPassword = $env:MYSQL_PWD,
  [string]$Database = "lab_schedule_ptit_v2"
)

$ErrorActionPreference = "Stop"

function Resolve-MysqlPath {
  param([string]$ConfiguredPath)

  if ($ConfiguredPath -and (Test-Path -LiteralPath $ConfiguredPath)) {
    return (Resolve-Path -LiteralPath $ConfiguredPath).Path
  }

  $command = Get-Command mysql -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $commonPaths = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Workbench 8.0\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\laragon\bin\mysql\mysql-8.0\bin\mysql.exe"
  )

  foreach ($path in $commonPaths) {
    if (Test-Path -LiteralPath $path) {
      return $path
    }
  }

  throw "mysql client not found. Pass -MysqlPath or add mysql.exe to PATH."
}

function Invoke-Mysql {
  param([string[]]$ExtraArgs)

  $baseArgs = @(
    "--default-character-set=utf8mb4",
    "-h", $HostName,
    "-P", [string]$Port,
    "-u", $RootUser
  )

  if (-not $RootPassword) {
    $baseArgs += "-p"
  }

  & $script:ResolvedMysqlPath @baseArgs @ExtraArgs
  if ($LASTEXITCODE -ne 0) {
    throw "mysql command failed with exit code $LASTEXITCODE"
  }
}

$script:ResolvedMysqlPath = Resolve-MysqlPath $MysqlPath
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$dumpPath = (Resolve-Path (Join-Path $repoRoot "database\Dump20260428.sql")).Path.Replace("\", "/")
$seedPath = (Resolve-Path (Join-Path $repoRoot "database\seed_demo_final.sql")).Path.Replace("\", "/")

$oldMysqlPwd = $env:MYSQL_PWD
if ($RootPassword) {
  $env:MYSQL_PWD = $RootPassword
}

try {
  Invoke-Mysql @(
    "-e",
    "DROP DATABASE IF EXISTS ``$Database``; CREATE DATABASE ``$Database`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  )

  Invoke-Mysql @(
    $Database,
    "-e",
    "SOURCE $dumpPath"
  )

  Invoke-Mysql @(
    $Database,
    "-e",
    "SOURCE $seedPath"
  )

  $baselineQuery = @"
SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'rooms', COUNT(*) FROM rooms
UNION ALL SELECT 'devices', COUNT(*) FROM devices
UNION ALL SELECT 'software_packages', COUNT(*) FROM software_packages
UNION ALL SELECT 'academic_weeks', COUNT(*) FROM academic_weeks
UNION ALL SELECT 'schedule_requests', COUNT(*) FROM lab_schedule_requests
UNION ALL SELECT 'schedule_entries', COUNT(*) FROM lab_schedule_entries
UNION ALL SELECT 'change_requests', COUNT(*) FROM lab_schedule_change_requests
UNION ALL SELECT 'room_issues', COUNT(*) FROM room_issue_reports
UNION ALL SELECT 'room_blocks', COUNT(*) FROM room_block_requests
UNION ALL SELECT 'feedback', COUNT(*) FROM student_feedback
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'audit_logs', COUNT(*) FROM workflow_audit_logs;
"@

  Invoke-Mysql @(
    "-N",
    $Database,
    "-e",
    $baselineQuery
  )

  $badNameCount = & $script:ResolvedMysqlPath `
    --default-character-set=utf8mb4 `
    -h $HostName `
    -P $Port `
    -u $RootUser `
    -N `
    $Database `
    -e "SELECT COUNT(*) FROM users WHERE full_name LIKE '%?%';"

  if ($LASTEXITCODE -ne 0) {
    throw "mysql verification failed with exit code $LASTEXITCODE"
  }

  if ([int]$badNameCount -ne 0) {
    throw "UTF-8 verification failed: users.full_name still contains question marks."
  }

  Write-Host "Demo database reset completed with UTF-8 seed intact."
} finally {
  if ($null -eq $oldMysqlPwd) {
    Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
  } else {
    $env:MYSQL_PWD = $oldMysqlPwd
  }
}
