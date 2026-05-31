param(
  [string]$ApiBase = "http://localhost:4000/api",
  [string]$FrontendBase = "http://localhost:3000",
  [string]$OutputDir = "docs/postman"
)

$ErrorActionPreference = "Stop"

$results = New-Object System.Collections.Generic.List[object]
$created = [ordered]@{}

function Add-Result {
  param(
    [string]$Name,
    [string]$Status,
    [string]$Details = ""
  )

  $script:results.Add([pscustomobject]@{
    Name = $Name
    Status = $Status
    Details = $Details
  }) | Out-Null

  Write-Host "[$Status] $Name $Details"
}

function Assert-True {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if (-not $Condition) {
    throw $Message
  }
}

function Invoke-Api {
  param(
    [string]$Method,
    [string]$Path,
    [string]$Token = $null,
    [object]$Body = $null,
    [int[]]$Expected = @(200)
  )

  $headers = @{}
  if ($Token) {
    $headers.Authorization = "Bearer $Token"
  }

  $json = $null
  if ($null -ne $Body) {
    $json = $Body | ConvertTo-Json -Depth 12
  }

  try {
    $response = Invoke-WebRequest `
      -UseBasicParsing `
      -Method $Method `
      -Uri "$ApiBase$Path" `
      -Headers $headers `
      -ContentType "application/json" `
      -Body $json `
      -TimeoutSec 30

    $status = [int]$response.StatusCode
    $content = if ($response.Content) { $response.Content | ConvertFrom-Json } else { $null }
  } catch {
    if (-not $_.Exception.Response) {
      throw
    }

    $status = [int]$_.Exception.Response.StatusCode
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $raw = $reader.ReadToEnd()
    $content = if ($raw) { $raw | ConvertFrom-Json } else { $null }
  }

  if ($Expected -notcontains $status) {
    $compactContent = $content | ConvertTo-Json -Compress -Depth 6
    throw "Expected $($Expected -join '/') for $Method $Path, got ${status}: $compactContent"
  }

  return [pscustomobject]@{
    Status = $status
    Body = $content
  }
}

function Invoke-FrontendRoute {
  param([string]$Path)

  $response = Invoke-WebRequest `
    -UseBasicParsing `
    -Method GET `
    -Uri "$FrontendBase$Path" `
    -TimeoutSec 30

  if ([int]$response.StatusCode -ne 200) {
    throw "Expected HTTP 200 for frontend route $Path, got $($response.StatusCode)"
  }
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$health = Invoke-Api GET "/health"
Assert-True $health.Body.success "Health check returned success=false"
Add-Result "Health check" "PASS" "GET /api/health HTTP 200"

$tokens = @{}
$users = @{}
foreach ($username in @("admin", "cbdt1", "gv_phthy", "ktv1", "sv1")) {
  $login = Invoke-Api POST "/auth/login" $null @{
    username = $username
    password = "123456"
  }

  Assert-True ([bool]$login.Body.data.token) "Missing token for $username"
  $tokens[$username] = $login.Body.data.token
  $users[$username] = $login.Body.data.user
  Add-Result "Login $username" "PASS" "role=$($login.Body.data.user.role_code)"
}

Invoke-Api POST "/auth/login" $null @{
  username = "admin"
  password = "wrong-password"
} @(401) | Out-Null
Add-Result "Login wrong password" "PASS" "HTTP 401"

$roomScope = Invoke-Api GET "/rooms/scope" $tokens["cbdt1"]
Assert-True (($roomScope.Body.data | Measure-Object).Count -eq 3) "Room scope should include 3 MVP rooms"
Add-Result "Room scope" "PASS" "rooms=$($roomScope.Body.data -join ',')"

$suffix = "$(Get-Date -Format 'HHmmss')$((Get-Random -Minimum 100 -Maximum 999))"

$account = Invoke-Api POST "/admin/accounts" $tokens["admin"] @{
  username = "smoke_user_$suffix"
  full_name = "Smoke User $suffix"
  email = "smoke_user_$suffix@example.test"
  role_code = "SV"
  account_status = "active"
  password = "123456"
} @(201)
$created.account_id = $account.Body.data.id
Invoke-Api PATCH "/admin/accounts/$($created.account_id)" $tokens["admin"] @{
  full_name = "Smoke User Updated $suffix"
} | Out-Null
Invoke-Api PATCH "/admin/accounts/$($created.account_id)/disable" $tokens["admin"] | Out-Null
Add-Result "Admin account CRUD" "PASS" "created/updated/disabled id=$($created.account_id)"

$software = Invoke-Api POST "/admin/software-packages" $tokens["admin"] @{
  software_name = "Smoke Software $suffix"
  software_version = "1.0"
} @(201)
$created.software_id = $software.Body.data.id
Invoke-Api PATCH "/admin/software-packages/$($created.software_id)" $tokens["admin"] @{
  software_version = "1.1"
} | Out-Null
Add-Result "Admin software CRUD" "PASS" "created/updated id=$($created.software_id)"

$device = Invoke-Api POST "/admin/devices" $tokens["admin"] @{
  room_id = 1
  device_code = "SMOKE-$suffix"
  device_name = "Smoke device $suffix"
  device_type = "other"
  device_status = "working"
  notes = "final workflow smoke"
} @(201)
$created.device_id = $device.Body.data.id
Invoke-Api PATCH "/admin/devices/$($created.device_id)" $tokens["admin"] @{
  device_status = "under_repair"
  notes = "updated by final workflow smoke"
} | Out-Null
Add-Result "Admin device CRUD" "PASS" "created/updated id=$($created.device_id)"

$semester = Invoke-Api POST "/admin/master-data/semesters" $tokens["admin"] @{
  academic_year = "2026-2027-$suffix"
  semester_no = 1
  semester_name = "Smoke semester $suffix"
  start_date = "2026-09-01"
  end_date = "2027-01-15"
  is_active = $false
} @(201)
$created.semester_id = $semester.Body.data.id
Invoke-Api PATCH "/admin/master-data/semesters/$($created.semester_id)" $tokens["admin"] @{
  semester_name = "Smoke semester updated $suffix"
} | Out-Null

$course = Invoke-Api POST "/admin/master-data/courses" $tokens["admin"] @{
  course_code = "SMK$suffix"
  course_name = "Smoke course $suffix"
  credits = 3
  lecture_periods = 30
  lab_periods = 15
  course_status = "active"
} @(201)
$created.course_id = $course.Body.data.id
Invoke-Api PATCH "/admin/master-data/courses/$($created.course_id)" $tokens["admin"] @{
  course_name = "Smoke course updated $suffix"
} | Out-Null

$section = Invoke-Api POST "/admin/master-data/course-sections" $tokens["admin"] @{
  course_id = $created.course_id
  semester_id = $created.semester_id
  group_no = "01"
  registered_enrollment = 25
  planned_enrollment = 25
  class_start_date = "2026-09-10"
  class_end_date = "2026-12-10"
  section_status = "draft"
  notes = "final workflow smoke"
} @(201)
$created.course_section_id = $section.Body.data.id
Invoke-Api PATCH "/admin/master-data/course-sections/$($created.course_section_id)" $tokens["admin"] @{
  section_status = "open"
  notes = "updated by final workflow smoke"
} | Out-Null
Add-Result "Academic master CRUD" "PASS" "semester=$($created.semester_id), course=$($created.course_id), section=$($created.course_section_id)"

$audit = Invoke-Api GET "/admin/audit-logs?entity_type=course_sections&entity_id=$($created.course_section_id)" $tokens["admin"]
$auditRows = @($audit.Body.data)
Assert-True ($auditRows.Count -ge 2) "Audit logs for course section CRUD are missing"
Add-Result "Audit log" "PASS" "course_section_logs=$($auditRows.Count)"

$scheduleRequest = Invoke-Api POST "/schedule-requests" $tokens["cbdt1"] @{
  course_section_id = 1
  requested_team_count = 1
  total_required_sessions = 1
  preferred_day_of_week = 2
  preferred_time_slot_id = 1
  max_students_per_team = 29
  notes = "final workflow smoke schedule request"
} @(201)
$created.schedule_request_id = $scheduleRequest.Body.data.id
Assert-True ([bool]$created.schedule_request_id) "Created schedule request id is missing"
Add-Result "Create schedule request" "PASS" "id=$($created.schedule_request_id)"

$listRequests = Invoke-Api GET "/schedule-requests" $tokens["cbdt1"]
Assert-True ((@($listRequests.Body.data | Where-Object id -eq $created.schedule_request_id)).Count -eq 1) "Created schedule request is not listed"
Add-Result "List schedule requests" "PASS" "created request visible to CBDT"

$validConstraintPayload = @{
  room_code = "2B11"
  lecturer_user_id = 3
  practice_team_id = 5
  day_of_week = 2
  time_slot = "1-4"
  start_date = "2026-07-06"
  end_date = "2026-07-06"
  required_software_ids = @(1)
}

$constraintsPass = Invoke-Api POST "/schedules/check-constraints" $tokens["cbdt1"] $validConstraintPayload
Assert-True $constraintsPass.Body.data.passed "Valid constraints should pass"
Add-Result "Constraint pass" "PASS" "valid slot passed all rules"

$autoArrange = Invoke-Api POST "/schedules/auto-arrange" $tokens["cbdt1"] @{
  lecturer_user_id = 3
  practice_team_id = 5
  start_date = "2026-07-06"
  end_date = "2026-07-06"
  preferred_day_of_week = 2
  required_software_ids = @(1)
}
$rankedOptions = @($autoArrange.Body.data.ranked_options)
Assert-True ($rankedOptions.Count -gt 0) "Auto-arrange returned no ranked options"
Add-Result "Auto-arrange success" "PASS" "ranked_options=$($rankedOptions.Count)"

$draft = Invoke-Api POST "/schedules" $tokens["cbdt1"] @{
  lab_schedule_request_id = $created.schedule_request_id
  practice_team_id = 5
  room_code = "2B11"
  lecturer_user_id = 3
  day_of_week = 2
  time_slot = "1-4"
  start_date = "2026-07-06"
  end_date = "2026-07-06"
  required_software_ids = @(1)
  notes = "final workflow smoke draft"
} @(201)
$created.schedule_entry_id = $draft.Body.data.schedule.id
Assert-True ([bool]$created.schedule_entry_id) "Draft schedule id is missing"
Add-Result "Create draft schedule" "PASS" "id=$($created.schedule_entry_id)"

$conflict = Invoke-Api POST "/schedules/check-constraints" $tokens["cbdt1"] $validConstraintPayload
$failedCodes = @($conflict.Body.data.results | Where-Object { -not $_.passed } | ForEach-Object code)
Assert-True ($failedCodes -contains "ROOM_CONFLICT") "ROOM_CONFLICT was not detected"
Assert-True ($failedCodes -contains "LECTURER_CONFLICT") "LECTURER_CONFLICT was not detected"
Add-Result "Room/Lecturer conflict" "PASS" ($failedCodes -join ",")

$capacityFail = Invoke-Api POST "/schedules/check-constraints" $tokens["cbdt1"] @{
  room_code = "2B11"
  lecturer_user_id = 3
  practice_team_id = 999
  day_of_week = 2
  time_slot = "1-4"
  start_date = "2026-07-13"
  end_date = "2026-07-13"
  required_software_ids = @()
}
Assert-True (-not (($capacityFail.Body.data.results | Where-Object code -eq "CAPACITY_OK").passed)) "Capacity failure was not detected"
Add-Result "Capacity constraint fail" "PASS" "CAPACITY_OK=false for team 999"

$softwareFail = Invoke-Api POST "/schedules/check-constraints" $tokens["cbdt1"] @{
  room_code = "2B31"
  lecturer_user_id = 3
  practice_team_id = 5
  day_of_week = 2
  time_slot = "1-4"
  start_date = "2026-07-13"
  end_date = "2026-07-13"
  required_software_ids = @(1)
}
Assert-True (-not (($softwareFail.Body.data.results | Where-Object code -eq "SOFTWARE_OK").passed)) "Software failure was not detected"
Add-Result "Software constraint fail" "PASS" "SOFTWARE_OK=false for room 2B31 + software 1"

$derivedSoftware = Invoke-Api POST "/schedules/check-constraints" $tokens["cbdt1"] @{
  room_code = "2B31"
  lecturer_user_id = 3
  practice_team_id = 5
  day_of_week = 2
  time_slot = "1-4"
  start_date = "2026-07-13"
  end_date = "2026-07-13"
}
$derivedSoftwareRule = $derivedSoftware.Body.data.results | Where-Object code -eq "SOFTWARE_OK"
Assert-True $derivedSoftwareRule.passed "Software requirements were not derived from the course mapping"
Assert-True ($derivedSoftwareRule.message -match "1 required software") "Derived software rule did not verify the mapped package"
Add-Result "Software DB-derived requirements" "PASS" "SOFTWARE_OK derived from course mapping when client field is omitted"

$holidayFail = Invoke-Api POST "/schedules/check-constraints" $tokens["cbdt1"] @{
  room_code = "2B11"
  lecturer_user_id = 3
  practice_team_id = 5
  day_of_week = 6
  time_slot = "1-4"
  start_date = "2026-05-01"
  end_date = "2026-05-01"
  required_software_ids = @()
}
Assert-True (-not (($holidayFail.Body.data.results | Where-Object code -eq "HOLIDAY_BLOCKED").passed)) "Holiday failure was not detected"
Add-Result "Holiday constraint fail" "PASS" "HOLIDAY_BLOCKED=false on 2026-05-01"

$approve = Invoke-Api PATCH "/schedules/$($created.schedule_entry_id)/approve" $tokens["cbdt1"]
Assert-True (($approve.Body.data.entry_status -eq "approved") -or ($approve.Body.data.status -eq "approved")) "Schedule was not approved"
$publish = Invoke-Api PATCH "/schedules/$($created.schedule_entry_id)/publish" $tokens["cbdt1"]
Assert-True (($publish.Body.data.entry_status -eq "published") -or ($publish.Body.data.status -eq "published")) "Schedule was not published"
Add-Result "Approve/publish lifecycle" "PASS" "schedule=$($created.schedule_entry_id)"

$svSchedules = Invoke-Api GET "/schedules?status=published&student_user_id=$($users['sv1'].id)" $tokens["sv1"]
Assert-True ((@($svSchedules.Body.data.schedules | Where-Object id -eq $created.schedule_entry_id)).Count -eq 1) "SV cannot see published smoke schedule"
$gvSchedules = Invoke-Api GET "/schedules/published?lecturer_user_id=$($users['gv_phthy'].id)" $tokens["gv_phthy"]
Assert-True ((@($gvSchedules.Body.data | Where-Object id -eq $created.schedule_entry_id)).Count -eq 1) "GV cannot see published smoke schedule"
Add-Result "SV/GV published lookup" "PASS" "created published schedule visible"

$svUnscopedSchedules = Invoke-Api GET "/schedules" $tokens["sv1"]
$svUnscopedRows = @($svUnscopedSchedules.Body.data.schedules)
Assert-True (($svUnscopedRows | Where-Object entry_status -ne "published" | Measure-Object).Count -eq 0) "SV unscoped lookup leaked non-published schedules"
Assert-True ((@($svUnscopedRows | Where-Object id -eq $created.schedule_entry_id)).Count -eq 1) "SV unscoped lookup lost the user's published schedule"
Add-Result "SV forced schedule scope" "PASS" "unscoped lookup returned published schedules for the current student only"

foreach ($filter in @("semester_id", "course_section_id", "week_no")) {
  $filteredSchedules = Invoke-Api GET "/schedules?${filter}=999999" $tokens["admin"]
  Assert-True ((@($filteredSchedules.Body.data.schedules)).Count -eq 0) "Schedule filter $filter did not apply"
}
Add-Result "Schedule filters" "PASS" "semester_id/course_section_id/week_no reject non-matching values"

$change = Invoke-Api POST "/schedule-change-requests" $tokens["gv_phthy"] @{
  lab_schedule_entry_id = 1
  change_type = "cancel"
  reason_text = "final workflow smoke cancel request"
} @(201)
$created.change_request_id = $change.Body.data.id
Invoke-Api PATCH "/schedule-change-requests/$($created.change_request_id)/review" $tokens["cbdt1"] @{
  request_status = "rejected"
  review_notes = "final workflow smoke rejection"
} | Out-Null
Add-Result "Schedule change request flow" "PASS" "created/rejected id=$($created.change_request_id)"

Invoke-Api GET "/schedule-change-requests" $tokens["sv1"] $null @(403) | Out-Null
Add-Result "Schedule change RBAC" "PASS" "SV forbidden HTTP 403"

$issue = Invoke-Api POST "/room-issues" $tokens["gv_phthy"] @{
  lab_schedule_entry_id = 1
  issue_type = "computer"
  severity = "medium"
  issue_title = "final workflow smoke issue"
  issue_description = "temporary issue for final workflow test"
} @(201)
$created.room_issue_id = $issue.Body.data.id
Invoke-Api PATCH "/room-issues/$($created.room_issue_id)" $tokens["ktv1"] @{
  issue_status = "resolved"
  assigned_to_user_id = 9
  resolution_notes = "resolved by final workflow smoke"
} | Out-Null
Add-Result "Room issue flow" "PASS" "created/resolved id=$($created.room_issue_id)"

$block = Invoke-Api POST "/room-block-requests" $tokens["ktv1"] @{
  room_code = "2B11"
  block_type = "maintenance"
  block_title = "final workflow smoke block"
  block_reason = "temporary maintenance smoke"
  day_of_week = 2
  time_slot_id = 1
  start_date = "2026-07-20"
  end_date = "2026-07-20"
} @(201)
$created.room_block_id = $block.Body.data.id
Invoke-Api PATCH "/room-block-requests/$($created.room_block_id)/review" $tokens["cbdt1"] @{
  block_status = "approved"
  review_notes = "approved by final workflow smoke"
} | Out-Null
$blockedCheck = Invoke-Api POST "/schedules/check-constraints" $tokens["cbdt1"] @{
  room_code = "2B11"
  lecturer_user_id = 3
  practice_team_id = 5
  day_of_week = 2
  time_slot = "1-4"
  start_date = "2026-07-20"
  end_date = "2026-07-20"
  required_software_ids = @()
}
Assert-True (-not (($blockedCheck.Body.data.results | Where-Object code -eq "ROOM_BLOCKED").passed)) "Room block was not detected"
Add-Result "Room block flow" "PASS" "created/approved id=$($created.room_block_id), ROOM_BLOCKED detected"

Invoke-Api GET "/room-block-requests" $tokens["sv1"] $null @(403) | Out-Null
Add-Result "Room block RBAC" "PASS" "SV forbidden HTTP 403"

$feedback = Invoke-Api POST "/student-feedback" $tokens["sv1"] @{
  lab_schedule_entry_id = 5
  feedback_type = "room_error"
  content = "final workflow smoke feedback"
  contact_info = "sv1@example.test"
} @(201)
$created.feedback_id = $feedback.Body.data.id

Invoke-Api GET "/student-feedback" $tokens["ktv1"] $null @(403) | Out-Null
$cbdtFeedbackList = Invoke-Api GET "/student-feedback?status=submitted" $tokens["cbdt1"]
Assert-True ((@($cbdtFeedbackList.Body.data.items | Where-Object id -eq $created.feedback_id)).Count -eq 1) "CBDT cannot see submitted feedback"

$cbdtNotifications = Invoke-Api GET "/notifications?status=unread" $tokens["cbdt1"]
$cbdtNotification = @($cbdtNotifications.Body.data.items | Where-Object {
  $_.related_entity_type -eq "student_feedback" -and $_.related_entity_id -eq $created.feedback_id
})[0]
Assert-True ([bool]$cbdtNotification) "CBDT feedback notification is missing"
Invoke-Api PATCH "/notifications/$($cbdtNotification.id)/read" $tokens["cbdt1"] | Out-Null

Invoke-Api PATCH "/student-feedback/$($created.feedback_id)" $tokens["cbdt1"] @{
  feedback_status = "responded"
  response_text = "final workflow response"
} | Out-Null

$svNotifications = Invoke-Api GET "/notifications?status=unread" $tokens["sv1"]
$svNotification = @($svNotifications.Body.data.items | Where-Object {
  $_.related_entity_type -eq "student_feedback" -and $_.related_entity_id -eq $created.feedback_id
})[0]
Assert-True ([bool]$svNotification) "SV feedback response notification is missing"
Invoke-Api PATCH "/notifications/$($svNotification.id)/acknowledge" $tokens["sv1"] | Out-Null
Invoke-Api PATCH "/notifications/read-all" $tokens["sv1"] | Out-Null

Add-Result "Feedback/notification flow" "PASS" "feedback=$($created.feedback_id), cbdt_notification=$($cbdtNotification.id), sv_notification=$($svNotification.id)"
Add-Result "Feedback RBAC" "PASS" "KTV forbidden HTTP 403"

$reportCbdt = Invoke-Api GET "/reports/basic" $tokens["cbdt1"]
Invoke-Api GET "/reports/basic" $tokens["admin"] | Out-Null
Invoke-Api GET "/reports/basic" $tokens["sv1"] $null @(403) | Out-Null
Assert-True ([bool]$reportCbdt.Body.data.schedule_summary) "Report summary is missing"
Assert-True ([bool]$reportCbdt.Body.data.device_summary) "Device report summary is missing"
Add-Result "Basic reports API" "PASS" "CBDT/QTV HTTP 200, SV HTTP 403, device summary present"

foreach ($route in @(
  "/login",
  "/academic/schedule-requests",
  "/academic/auto-arrange",
  "/academic/schedules",
  "/academic/change-requests",
  "/academic/reports",
  "/lecturer/my-schedule",
  "/lecturer/change-requests",
  "/lecturer/room-issues",
  "/student/my-schedule",
  "/student/feedback",
  "/student/notifications",
  "/technician/issues",
  "/technician/notifications",
  "/admin/accounts",
  "/admin/trainingData",
  "/admin/devices",
  "/admin/software",
  "/admin/audit-logs",
  "/admin/reports"
)) {
  Invoke-FrontendRoute $route
  Add-Result "Frontend route $route" "PASS" "HTTP 200"
}

$resultsPath = Join-Path $OutputDir "final_demo_api_smoke_results.json"
$createdPath = Join-Path $OutputDir "final_demo_created_ids.json"
$results | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 $resultsPath
$created | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 $createdPath

Write-Host "Smoke results: $resultsPath"
Write-Host "Created IDs: $createdPath"
