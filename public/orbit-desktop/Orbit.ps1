# Orbit Computer Use — see screen (OCR + UI tree), act, look again, until done.
# Double-click Start-Orbit.bat. Runs on the real Windows desktop.

Set-StrictMode -Version Latest
$ErrorActionPreference = "SilentlyContinue"
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Speech
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Runtime.WindowsRuntime

Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class OrbitInput {
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, UIntPtr extra);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);
  public const uint LEFTDOWN = 0x0002;
  public const uint LEFTUP   = 0x0004;
  public const uint WHEEL    = 0x0800;
}
"@

$DataDir = Join-Path $env:APPDATA "Orbit"
New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
$PermFile = Join-Path $DataDir "permissions.json"
$ScreenFile = Join-Path $DataDir "last-screen.png"
$MaxSteps = 14

function Get-Perms {
  if (Test-Path $PermFile) {
    try { return Get-Content $PermFile -Raw | ConvertFrom-Json } catch {}
  }
  return [pscustomobject]@{ system = $false; mic = $false }
}
function Save-Perms($p) { ($p | ConvertTo-Json) | Set-Content -Path $PermFile -Encoding UTF8 }

function Move-CursorSmooth([int]$x, [int]$y) {
  $cur = [System.Windows.Forms.Cursor]::Position
  for ($i = 1; $i -le 12; $i++) {
    [OrbitInput]::SetCursorPos(
      [int]($cur.X + ($x - $cur.X) * $i / 12),
      [int]($cur.Y + ($y - $cur.Y) * $i / 12)
    ) | Out-Null
    Start-Sleep -Milliseconds 8
  }
}
function Click-At([int]$x, [int]$y) {
  Move-CursorSmooth $x $y
  Start-Sleep -Milliseconds 40
  [OrbitInput]::mouse_event(0x0002, 0, 0, 0, [UIntPtr]::Zero)
  Start-Sleep -Milliseconds 25
  [OrbitInput]::mouse_event(0x0004, 0, 0, 0, [UIntPtr]::Zero)
}
function Type-Text([string]$text) {
  $esc = $text.Replace('{','{{}').Replace('}','{}}').Replace('+','{+}').Replace('^','{^}').Replace('%','{%}')
  [System.Windows.Forms.SendKeys]::SendWait($esc)
}
function Send-Enter { [System.Windows.Forms.SendKeys]::SendWait("{ENTER}") }
function Win-Search([string]$q) {
  [System.Windows.Forms.SendKeys]::SendWait("^{ESC}")
  Start-Sleep -Milliseconds 400
  Type-Text $q
  Start-Sleep -Milliseconds 450
  Send-Enter
}

function Capture-Screen {
  $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
  $bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size)
  $bmp.Save($ScreenFile, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

function Get-FgTitle {
  $sb = New-Object System.Text.StringBuilder 512
  [OrbitInput]::GetWindowText([OrbitInput]::GetForegroundWindow(), $sb, $sb.Capacity) | Out-Null
  return $sb.ToString()
}

function Find-Browser {
  foreach ($c in @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
  )) { if (Test-Path $c) { return $c } }
  $null
}

function Open-BrowserUrl([string]$url) {
  $browser = Find-Browser
  if ($browser) {
    $p = Start-Process -FilePath $browser -ArgumentList @("--new-window", $url) -PassThru
    Start-Sleep -Milliseconds 1200
    if ($p -and $p.MainWindowHandle -ne [IntPtr]::Zero) {
      [OrbitInput]::ShowWindow($p.MainWindowHandle, 9) | Out-Null
      [OrbitInput]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
    }
  } else { Start-Process $url | Out-Null; Start-Sleep -Milliseconds 1000 }
}

# --- WinRT OCR ---
$script:ocrReady = $false
try {
  [void][Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]
  [void][Windows.Foundation.IAsyncOperation`1,Windows.Foundation,ContentType=WindowsRuntime]
  [void][Windows.Graphics.Imaging.BitmapDecoder,Windows.Graphics.Imaging,ContentType=WindowsRuntime]
  [void][Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
  [void][Windows.Storage.Streams.RandomAccessStream,Windows.Storage.Streams,ContentType=WindowsRuntime]
  $script:ocrReady = $true
} catch { $script:ocrReady = $false }

function Await-WinRT($op) {
  $m = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1
  } | Select-Object -First 1)
  if ($m.IsGenericMethod) {
    $resultType = $op.GetType().GenericTypeArguments[0]
    $m = $m.MakeGenericMethod($resultType)
  }
  $task = $m.Invoke($null, @($op))
  $task.Wait() | Out-Null
  if ($task.PSObject.Properties.Name -contains 'Result') { return $task.Result }
  return $null
}

function Read-Ocr {
  $hits = @()
  if (-not $script:ocrReady) { return $hits }
  if (-not (Test-Path $ScreenFile)) { return $hits }
  try {
    $fileOp = [Windows.Storage.StorageFile]::GetFileFromPathAsync($ScreenFile)
    $file = Await-WinRT $fileOp
    $streamOp = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read)
    $stream = Await-WinRT $streamOp
    $decOp = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)
    $dec = Await-WinRT $decOp
    $bmpOp = $dec.GetSoftwareBitmapAsync()
    $sbmp = Await-WinRT $bmpOp
    $eng = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
    if (-not $eng) { $eng = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage((New-Object Windows.Globalization.Language "en")) }
    $ocrOp = $eng.RecognizeAsync($sbmp)
    $res = Await-WinRT $ocrOp
    $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $sx = $b.Width / [double]$dec.PixelWidth
    $sy = $b.Height / [double]$dec.PixelHeight
    foreach ($line in $res.Lines) {
      foreach ($w in $line.Words) {
        $r = $w.BoundingRect
        $hits += [pscustomobject]@{
          text = [string]$w.Text
          x = [int]($b.Left + ($r.X + $r.Width/2) * $sx)
          y = [int]($b.Top + ($r.Y + $r.Height/2) * $sy)
        }
      }
    }
    try { $stream.Dispose() } catch {}
  } catch {}
  return $hits
}

function Read-Uia {
  $hits = @()
  $hwnd = [OrbitInput]::GetForegroundWindow()
  if ($hwnd -eq [IntPtr]::Zero) { return $hits }
  try {
    $root = [System.Windows.Automation.AutomationElement]::FromHandle($hwnd)
    if (-not $root) { return $hits }
    $els = $root.FindAll(
      [System.Windows.Automation.TreeScope]::Descendants,
      [System.Windows.Automation.Condition]::TrueCondition
    )
    $n = 0
    foreach ($el in $els) {
      $n++
      if ($n -gt 1800) { break }
      try {
        if ($el.Current.IsOffscreen) { continue }
        $name = $el.Current.Name
        if (-not $name) { continue }
        $rect = $el.Current.BoundingRectangle
        if ($rect.Width -lt 2 -or $rect.Height -lt 2) { continue }
        $hits += [pscustomobject]@{
          text = [string]$name
          x = [int]($rect.X + $rect.Width/2)
          y = [int]($rect.Y + $rect.Height/2)
          el = $el
        }
      } catch {}
    }
  } catch {}
  return $hits
}

function Perceive {
  Capture-Screen
  $ocr = @(Read-Ocr)
  $uia = @(Read-Uia)
  $title = Get-FgTitle
  $blob = (($ocr + $uia | ForEach-Object { $_.text }) -join " ")
  [pscustomobject]@{
    title = $title
    blob  = ($title + " " + $blob).ToLowerInvariant()
    ocr   = $ocr
    uia   = $uia
  }
}

function Score-Hit($hit, [string]$needle) {
  $a = $hit.text.ToLowerInvariant()
  $b = $needle.ToLowerInvariant()
  if ($a -eq $b) { return 100 }
  if ($a.Contains($b) -or $b.Contains($a)) { return 80 }
  $aw = $a -split '\W+' | Where-Object { $_.Length -gt 1 }
  $bw = $b -split '\W+' | Where-Object { $_.Length -gt 1 }
  $inter = @($aw | Where-Object { $bw -contains $_ }).Count
  if ($inter -gt 0) { return 40 + (10 * $inter) }
  return 0
}

function Find-Best($view, [string]$needle) {
  $best = $null; $score = 0
  foreach ($h in @($view.ocr + $view.uia)) {
    $s = Score-Hit $h $needle
    if ($s -gt $score) { $score = $s; $best = $h }
  }
  if ($score -ge 40) { return $best }
  return $null
}

function Click-Hit($hit) {
  if ($null -eq $hit) { return $false }
  if ($hit.PSObject.Properties.Name -contains 'el' -and $hit.el) {
    try {
      $inv = $hit.el.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
      if ($inv) { $inv.Invoke(); return $true }
    } catch {}
  }
  Click-At ([int]$hit.x) ([int]$hit.y)
  return $true
}

function Extract-After([string]$text, [string]$pattern) {
  if ($text -match $pattern) { return $Matches[1].Trim().Trim('"').Trim("'") }
  return $null
}

function Goal-Met([string]$goal, $view) {
  $g = $goal.ToLowerInvariant()
  $b = $view.blob
  $title = $view.title.ToLowerInvariant()
  if ($g -match 'youtube' -and $g -match 'search|play') {
    return ($title -match 'youtube' -and ($b -match 'result' -or $title -match 'search' -or $b.Length -gt 40))
  }
  if ($g -match 'canva' -and $g -match 'new|create|project') {
    return ($title -match 'canva' -and ($b -match 'create|untitled|editor|file' -or $title -match 'design'))
  }
  if ($g -match 'canva') { return ($title -match 'canva') }
  if ($g -match 'chrome' -and $g -notmatch 'youtube|canva|google.com') {
    return ($title -match 'chrome|google')
  }
  return $false
}

function Decide([string]$goal, $view, [int]$step) {
  $g = $goal.ToLowerInvariant()
  $title = $view.title.ToLowerInvariant()

  $clickT = Extract-After $goal '(?i)(?:click|press|tap|select|hit)\s+(?:on\s+)?["'']?(.+?)["'']?$'
  if ($clickT) {
    $h = Find-Best $view $clickT
    if ($h) { return @{ op='click'; hit=$h; note="Click $($h.text)" } }
  }

  $typeT = Extract-After $goal '(?i)(?:type|write|enter|put)\s+["'']?(.+?)["'']?$'
  if ($typeT -and $step -ge 0) { return @{ op='type'; text=$typeT; note="Type $typeT" } }

  if ($g -match 'youtube') {
    if ($title -notmatch 'youtube') {
      $q = $goal
      if ($goal -match '[""''""](.+?)[""''""]') { $q = $Matches[1] }
      elseif ($goal -match '(?i)(?:search(?:\s+for)?|play)\s+(.+)$') { $q = $Matches[1] }
      foreach ($w in @('open','chrome','google','browser','go','to','for','and','then','youtube','search','a','song','named','please')) {
        $q = [regex]::Replace($q, "(?i)\b$([regex]::Escape($w))\b", ' ')
      }
      $q = ($q -replace '\s+',' ').Trim()
      if ($q.Length -lt 1) { $q = 'music' }
      return @{ op='url'; url=("https://www.youtube.com/results?search_query=" + [Uri]::EscapeDataString($q)); note="Open YouTube search: $q" }
    }
    $h = Find-Best $view 'search'
    if ($h) { return @{ op='click'; hit=$h; note='Click search' } }
  }

  if ($g -match 'canva') {
    if ($title -notmatch 'canva') {
      if ($g -match 'new|create|project|design') {
        return @{ op='url'; url='https://www.canva.com/design?create'; note='Open Canva new design' }
      }
      return @{ op='url'; url='https://www.canva.com'; note='Open Canva' }
    }
    foreach ($label in @('Create a design','Create','New design','Blank','Custom size','Poster')) {
      $h = Find-Best $view $label
      if ($h) { return @{ op='click'; hit=$h; note="Click $label" } }
    }
  }

  if ($g -match 'chrome|browser' -and $title -notmatch 'chrome|edge|google|youtube|canva') {
    return @{ op='url'; url='https://www.google.com'; note='Open Chrome' }
  }

  if ($g -match 'https?://\S+') {
    return @{ op='url'; url=$Matches[0]; note="Open $($Matches[0])" }
  }

  if ($g -match '(?:go to|visit|open)\s+(\S+\.\S+)') {
    $u = $Matches[1]
    if ($u -notmatch '^https?://') { $u = "https://$u" }
    if ($title -notmatch [regex]::Escape(($Matches[1] -split '\.')[0])) {
      return @{ op='url'; url=$u; note="Open $u" }
    }
  }

  if ($g -match '^(open|launch|start)\s+(.+)$' -and $title -notmatch [regex]::Escape($Matches[2].Split(' ')[0])) {
    return @{ op='search'; text=$Matches[2]; note="Open $($Matches[2])" }
  }

  $words = $g -split '\W+' | Where-Object { $_.Length -gt 3 } | Select-Object -Unique
  $skip = @('open','chrome','google','please','then','with','from','this','that','want','make','create','project')
  foreach ($w in $words) {
    if ($skip -contains $w) { continue }
    $h = Find-Best $view $w
    if ($h) { return @{ op='click'; hit=$h; note="Click visible $($h.text)" } }
  }

  if ($g -match 'search (?:for )?(.+)$') {
    $q = $Matches[1]
    return @{ op='url'; url=("https://www.google.com/search?q=" + [Uri]::EscapeDataString($q)); note="Search $q" }
  }

  return @{ op='search'; text=$goal; note='Windows search fallback' }
}

function Do-Op($a, $say) {
  $say.Invoke([string]$a.note)
  switch ($a.op) {
    'click' { Click-Hit $a.hit | Out-Null; Start-Sleep -Milliseconds 600 }
    'type'  { Type-Text ([string]$a.text); Start-Sleep -Milliseconds 200; Send-Enter }
    'url'   { Open-BrowserUrl ([string]$a.url) }
    'search'{ Win-Search ([string]$a.text); Start-Sleep -Milliseconds 700 }
  }
}

function Run-ComputerUse([string]$goal, $say) {
  $say.Invoke("Watching the screen and working the task.")
  $lastNote = ""
  for ($i = 0; $i -lt $MaxSteps; $i++) {
    [System.Windows.Forms.Application]::DoEvents()
    $view = Perceive
    if ($i -gt 0 -and (Goal-Met $goal $view)) {
      $say.Invoke("The screen shows the task is done.")
      return
    }
    $a = Decide $goal $view $i
    if ($null -eq $a) { break }
    if ($a.note -eq $lastNote -and $a.op -ne 'click') {
      $say.Invoke("Trying another path.")
      Win-Search $goal
      Start-Sleep -Milliseconds 800
      $lastNote = ""
      continue
    }
    $lastNote = $a.note
    Do-Op $a $say
  }
}

# --- UI ---
$script:busy = $false
$wa = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$orb = New-Object System.Windows.Forms.Form
$orb.Text = "Orbit"; $orb.FormBorderStyle = "None"; $orb.TopMost = $true
$orb.ShowInTaskbar = $false; $orb.StartPosition = "Manual"
$orb.Width = 76; $orb.Height = 76
$orb.Left = $wa.Right - 96; $orb.Top = $wa.Bottom - 160
$orb.BackColor = [System.Drawing.Color]::FromArgb(200, 204, 212)
$gp = New-Object System.Drawing.Drawing2D.GraphicsPath
$gp.AddEllipse(0, 0, 75, 75)
$orb.Region = New-Object System.Drawing.Region($gp)
$orb.Cursor = [System.Windows.Forms.Cursors]::Hand
$label = New-Object System.Windows.Forms.Label
$label.Text = "O"
$label.Font = New-Object System.Drawing.Font("Segoe UI", 22, [System.Drawing.FontStyle]::Bold)
$label.ForeColor = [System.Drawing.Color]::FromArgb(20, 20, 24)
$label.Dock = "Fill"; $label.TextAlign = "MiddleCenter"
$label.BackColor = [System.Drawing.Color]::Transparent
$orb.Controls.Add($label)

$menu = New-Object System.Windows.Forms.Form
$menu.FormBorderStyle = "None"; $menu.TopMost = $true; $menu.ShowInTaskbar = $false
$menu.BackColor = [System.Drawing.Color]::FromArgb(18, 18, 22)
$menu.Width = 168; $menu.Height = 96; $menu.StartPosition = "Manual"; $menu.Visible = $false
function Style-Btn($b, $text, $y) {
  $b.Text = $text; $b.Width = 148; $b.Height = 36; $b.Left = 10; $b.Top = $y
  $b.FlatStyle = "Flat"; $b.ForeColor = [System.Drawing.Color]::White
  $b.BackColor = [System.Drawing.Color]::FromArgb(36, 36, 42)
  $b.Font = New-Object System.Drawing.Font("Segoe UI", 10)
  $menu.Controls.Add($b)
}
$btnTalk = New-Object System.Windows.Forms.Button
$btnText = New-Object System.Windows.Forms.Button
Style-Btn $btnTalk "Talk" 10
Style-Btn $btnText "Text" 50

$panel = New-Object System.Windows.Forms.Form
$panel.FormBorderStyle = "None"; $panel.TopMost = $true; $panel.ShowInTaskbar = $false
$panel.BackColor = [System.Drawing.Color]::FromArgb(18, 18, 22)
$panel.Width = 400; $panel.Height = 236; $panel.StartPosition = "Manual"; $panel.Visible = $false
$log = New-Object System.Windows.Forms.Label
$log.ForeColor = [System.Drawing.Color]::FromArgb(220, 220, 224)
$log.Font = New-Object System.Drawing.Font("Segoe UI", 10)
$log.Left = 16; $log.Top = 12; $log.Width = 368; $log.Height = 92
$panel.Controls.Add($log)
$box = New-Object System.Windows.Forms.TextBox
$box.Left = 16; $box.Top = 110; $box.Width = 368; $box.Height = 50
$box.Multiline = $true
$box.BackColor = [System.Drawing.Color]::FromArgb(32, 32, 38)
$box.ForeColor = [System.Drawing.Color]::White
$box.BorderStyle = "FixedSingle"
$panel.Controls.Add($box)
$go = New-Object System.Windows.Forms.Button
$go.Text = "Start"; $go.Left = 16; $go.Top = 172; $go.Width = 110; $go.Height = 36
$go.FlatStyle = "Flat"
$go.BackColor = [System.Drawing.Color]::FromArgb(200, 204, 212)
$go.ForeColor = [System.Drawing.Color]::Black
$panel.Controls.Add($go)

function Place-Beside($form) {
  $form.Left = [Math]::Max(12, $orb.Left - $form.Width - 12)
  $form.Top = [Math]::Max(12, $orb.Top - 40)
}
function Show-Menu { Place-Beside $menu; $menu.Show(); $menu.BringToFront() }
function Hide-Menu { $menu.Hide() }

function Ask-Perms([bool]$needMic) {
  $p = Get-Perms
  $needSys = -not $p.system
  $needM = $needMic -and -not $p.mic
  if (-not $needSys -and -not $needM) { return $true }
  $msg = "Orbit will watch this screen (screenshots + on-screen text), move the cursor, click, type, and open apps until the task is done."
  if ($needM) { $msg += " Talk also needs the microphone." }
  $msg += "`n`nAllow once. Orbit will not ask again for the same access."
  $r = [System.Windows.Forms.MessageBox]::Show($msg, "Orbit access", "OKCancel", "Question")
  if ($r -ne "OK") { return $false }
  if ($needSys) { $p.system = $true }
  if ($needM) { $p.mic = $true }
  Save-Perms $p
  return $true
}

function Say([string]$text) {
  $log.Text = $text
  $panel.Refresh()
  [System.Windows.Forms.Application]::DoEvents()
}

function Start-JobFrom([string]$text) {
  if ($script:busy) { return }
  if (-not (Ask-Perms $false)) { return }
  $script:busy = $true
  Place-Beside $panel
  $box.Visible = $false; $go.Visible = $false
  $panel.Height = 140
  $panel.Show()
  $say = { param($x) Say $x; Start-Sleep -Milliseconds 200 }
  try { Run-ComputerUse $text $say } catch { $say.Invoke("Retrying via Windows search."); Win-Search $text }
  Say "Task completed"
  [System.Windows.Forms.Application]::DoEvents()
  Start-Sleep -Milliseconds 1400
  $panel.Hide()
  $panel.Height = 236
  $box.Visible = $true; $go.Visible = $true
  $script:busy = $false
}

$script:drag = $false; $script:dx = 0; $script:dy = 0; $script:moved = $false
$orb.Add_MouseDown({
  if ($_.Button -eq "Left") { $script:drag = $true; $script:moved = $false; $script:dx = $_.X; $script:dy = $_.Y }
})
$orb.Add_MouseMove({
  if ($script:drag) {
    $script:moved = $true
    $orb.Left += $_.X - $script:dx
    $orb.Top  += $_.Y - $script:dy
  }
})
$orb.Add_MouseUp({ $script:drag = $false; if (-not $script:moved) { Show-Menu } })
$label.Add_Click({ if (-not $script:moved) { Show-Menu } })

$btnText.Add_Click({
  Hide-Menu
  if (-not (Ask-Perms $false)) { return }
  Place-Beside $panel
  $log.Text = "Tell Orbit the task. It will watch the screen and keep clicking until it is done."
  $box.Text = ""; $box.Visible = $true; $go.Visible = $true
  $panel.Height = 236; $panel.Show(); $box.Focus()
})

$btnTalk.Add_Click({
  Hide-Menu
  if (-not (Ask-Perms $true)) { return }
  Place-Beside $panel
  $box.Visible = $false; $go.Visible = $false
  $panel.Height = 140
  $log.Text = "Listening..."
  $panel.Show()
  [System.Windows.Forms.Application]::DoEvents()
  try {
    $engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine
    $engine.SetInputToDefaultAudioDevice()
    $engine.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
    $res = $engine.Recognize([TimeSpan]::FromSeconds(12))
    $engine.Dispose()
    if ($res -and $res.Text) { Start-JobFrom $res.Text }
    else { $log.Text = "Heard nothing. Try Text."; Start-Sleep 2; $panel.Hide() }
  } catch { $log.Text = "Use Text."; Start-Sleep 2; $panel.Hide() }
})

$go.Add_Click({ if ($box.Text.Trim().Length -gt 0) { Start-JobFrom $box.Text.Trim() } })

$tray = New-Object System.Windows.Forms.NotifyIcon
$tray.Text = "Orbit"; $tray.Visible = $true
$tray.Icon = [System.Drawing.SystemIcons]::Information
$ctx = New-Object System.Windows.Forms.ContextMenuStrip
$exit = $ctx.Items.Add("Quit Orbit")
$exit.Add_Click({ $tray.Visible = $false; [System.Windows.Forms.Application]::Exit() })
$tray.ContextMenuStrip = $ctx
$orb.Add_FormClosed({ $tray.Visible = $false })
[System.Windows.Forms.Application]::EnableVisualStyles()
[System.Windows.Forms.Application]::Run($orb)
