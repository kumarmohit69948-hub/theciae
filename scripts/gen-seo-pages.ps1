$ErrorActionPreference='Stop'
$root='E:\theciae'
$out=Join-Path $root 'course'
if(Test-Path $out){ Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Force $out | Out-Null

$DEPTS=@{FMPE='Farm Machinery & Power Engineering';ASPE='Agricultural Structures & Process Engineering';SWCE='Soil & Water Conservation Engineering';IDE='Irrigation & Drainage Engineering';PFE='Processing & Food Engineering';REE='Renewable Energy Engineering';CSE='Computer Science & Engineering';AS='Applied Sciences';CAE='Agricultural Engineering';SEC='Skill Enhancement';MDC='Multidisciplinary Course';AEC='Ability Enhancement Course';VAC='Value-Added Course';FC='Foundation Course'}
function Dept($code){ $p=($code -replace '[^A-Z].*$',''); if($DEPTS.ContainsKey($p)){$DEPTS[$p]}else{'Agricultural Engineering'} }
function Esc($s){ [System.Web.HttpUtility]::HtmlEncode($s) }
Add-Type -AssemblyName System.Web
function ShortSec($s){ ($s -split '—')[-1].Trim().Replace('Farm Machinery & Power','FMPE').Replace('Agricultural Structures & Process Engineering','ASPE') }

$bt = Get-Content (Join-Path $root 'courses.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$mt = Get-Content (Join-Path $root 'mtech.json') -Raw -Encoding UTF8 | ConvertFrom-Json

$all=@()
foreach($sec in $bt){ foreach($c in $sec.courses){ $all += [pscustomobject]@{code=$c.code;title=$c.title;section=$sec.section;prog='btech';lectures=$c.lectures} } }
foreach($sec in $mt){ foreach($c in $sec.courses){ $all += [pscustomobject]@{code=$c.code;title=$c.title;section=$sec.section;prog='mtech';lectures=$c.lectures} } }

function PageHtml($c){
  $code=$c.code; $title=$c.title; $dept=Dept $code
  $progLabel = if($c.prog -eq 'mtech'){'M.Tech / ICAR-NET'}else{'B.Tech. Agricultural Engineering'}
  $secLabel = if($c.prog -eq 'mtech'){ShortSec $c.section}else{$c.section}
  $word = if($c.prog -eq 'mtech'){'topic'}else{'lecture'}
  $topics = @($c.lectures)
  $topicText = ($topics | ForEach-Object { $_.t }) -join '; '
  $desc = "$code $title — syllabus $($word)s, notes and quick revision for $progLabel students. Topics: $topicText"
  if($desc.Length -gt 300){ $desc = $desc.Substring(0,297)+'...' }
  $descAttr = Esc($desc)
  $li = ($topics | ForEach-Object { "<li><span class=""cp-n"">$('{0:d2}' -f [int]$_.n)</span>$(Esc($_.t))</li>" }) -join "`n        "
  $topicsBlock = if($topics.Count -gt 0){ "<h2>Syllabus $word plan</h2>`n      <ol class=""cp-topics"">`n        $li`n      </ol>" } else { "<p class=""cp-note"">Detailed $word plan for this course is being added.</p>" }
  $itemList = ($topics | ForEach-Object { '{"@type":"ListItem","position":' + [int]$_.n + ',"name":' + (($_.t | ConvertTo-Json)) + '}' }) -join ','
  $ld = '{"@context":"https://schema.org","@type":"Course","name":' + (("$code $title" | ConvertTo-Json)) + ',"description":' + (($desc | ConvertTo-Json)) + ',"provider":{"@type":"Organization","name":"theciae.com","url":"https://theciae.com"},"about":' + (($dept | ConvertTo-Json)) + ',"hasCourseInstance":{"@type":"CourseInstance","courseMode":"online"}}'
@"
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>$(Esc($code)) $(Esc($title)) — Syllabus, Notes &amp; Revision | theciae</title>
<meta name="description" content="$descAttr" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://theciae.com/course/$code.html" />
<meta property="og:title" content="$(Esc($code)) $(Esc($title)) — theciae" />
<meta property="og:description" content="$descAttr" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://theciae.com/course/$code.html" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500;1,9..144,600&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="../styles.css" />
<script type="application/ld+json">$ld</script>
</head>
<body class="cp-body">
<header class="cp-header">
  <a class="brand" href="../index.html"><span class="brand-mark">✦</span> the<span>ciae</span>.com</a>
  <a class="cp-back" href="../syllabus.html">All courses →</a>
</header>
<main class="cp">
  <nav class="cp-crumb"><a href="../index.html">Home</a> › <a href="../syllabus.html">Syllabus</a> › <span>$(Esc($code))</span></nav>
  <p class="cp-eyebrow">$(Esc($progLabel)) · $(Esc($secLabel))</p>
  <h1>$(Esc($title))</h1>
  <p class="cp-meta"><span class="cp-code">$(Esc($code))</span> $(Esc($dept))</p>
  <div class="cp-actions">
    <a class="button button-primary" href="../index.html#course=$code">Open notes &amp; files in the library →</a>
    <a class="button button-plain" href="../reels.html?course=$code">▶ Study reels</a>
  </div>
  $topicsBlock
  <p class="cp-note">Part of the $(Esc($progLabel)) curriculum (ICAR recommendations). Upload or find notes, previous-year papers and quick-revision reels for each $word on <a href="../index.html#course=$code">theciae</a>.</p>
</main>
<footer class="cp-footer">
  <a href="../index.html">theciae.com</a> · <a href="../syllabus.html">Full syllabus</a> · <a href="../reels.html">Study reels</a> · <a href="../app.html">Study app</a>
  <p>© <span id="y"></span> The Concept in Agricultural Engineering — built for the agri-engineering community.</p>
</footer>
<script>document.getElementById('y').textContent=new Date().getFullYear()</script>
</body>
</html>
"@
}

$n=0
foreach($c in $all){
  $html = PageHtml $c
  [System.IO.File]::WriteAllText((Join-Path $out "$($c.code).html"), $html, (New-Object System.Text.UTF8Encoding($false)))
  $n++
}

# ---- syllabus.html directory hub ----
$groups = [ordered]@{}
foreach($c in $all){
  $key = if($c.prog -eq 'mtech'){ 'M.Tech / ICAR-NET — ' + (ShortSec $c.section) } else { $c.section }
  if(-not $groups.Contains($key)){ $groups[$key]=@() }
  $groups[$key] += $c
}
$sb = New-Object System.Text.StringBuilder
foreach($k in $groups.Keys){
  [void]$sb.Append("<section class=""cp-group""><h2>$(Esc($k))</h2><div class=""cp-dir"">")
  foreach($c in $groups[$k]){
    [void]$sb.Append("<a href=""course/$($c.code).html""><span class=""cp-code"">$(Esc($c.code))</span> $(Esc($c.title))</a>")
  }
  [void]$sb.Append("</div></section>")
}
$syl=@"
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Full Syllabus — B.Tech &amp; M.Tech / NET Agricultural Engineering | theciae</title>
<meta name="description" content="Complete course directory for B.Tech and M.Tech / ICAR-NET Agricultural Engineering — every course and unit with syllabus topics, notes and quick-revision reels." />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://theciae.com/syllabus.html" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500;1,9..144,600&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="styles.css" />
</head>
<body class="cp-body">
<header class="cp-header">
  <a class="brand" href="index.html"><span class="brand-mark">✦</span> the<span>ciae</span>.com</a>
  <a class="cp-back" href="index.html">Home →</a>
</header>
<main class="cp">
  <p class="cp-eyebrow">COURSE DIRECTORY</p>
  <h1>Full syllabus — every course &amp; unit</h1>
  <p class="cp-meta">B.Tech. Agricultural Engineering (ICAR 6th Deans') and M.Tech / ICAR-NET. Tap any course for its topic plan, notes and revision reels.</p>
  $($sb.ToString())
</main>
<footer class="cp-footer">
  <a href="index.html">theciae.com</a> · <a href="reels.html">Study reels</a> · <a href="app.html">Study app</a>
  <p>© <span id="y"></span> The Concept in Agricultural Engineering</p>
</footer>
<script>document.getElementById('y').textContent=new Date().getFullYear()</script>
</body>
</html>
"@
[System.IO.File]::WriteAllText((Join-Path $root 'syllabus.html'), $syl, (New-Object System.Text.UTF8Encoding($false)))

# ---- sitemap.xml ----
$today = Get-Date -Format 'yyyy-MM-dd'
$urls = New-Object System.Text.StringBuilder
function Url($loc,$pri){ "<url><loc>$loc</loc><changefreq>weekly</changefreq><priority>$pri</priority></url>" }
[void]$urls.Append((Url 'https://theciae.com/' '1.0'))
[void]$urls.Append((Url 'https://theciae.com/syllabus.html' '0.9'))
[void]$urls.Append((Url 'https://theciae.com/reels.html' '0.7'))
[void]$urls.Append((Url 'https://theciae.com/app.html' '0.7'))
foreach($c in $all){ [void]$urls.Append((Url "https://theciae.com/course/$($c.code).html" '0.8')) }
$sitemap = '<?xml version="1.0" encoding="UTF-8"?>' + "`n" + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + "`n" + $urls.ToString() + "`n</urlset>`n"
[System.IO.File]::WriteAllText((Join-Path $root 'sitemap.xml'), $sitemap, (New-Object System.Text.UTF8Encoding($false)))

"Generated $n course pages + syllabus.html + sitemap ($($all.Count+4) urls)"

