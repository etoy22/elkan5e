# Fix duplicate &reference macros within a single HTML paragraph in JSON files
# - Keeps the first &reference (or &Reference) to a given element per <p>...</p>
# - Replaces subsequent occurrences in the same paragraph with their display text
# - Handles both "&reference[...]" and "&amp;reference[...]"
# - Fixes accidental nested macros like &reference[&reference[climbing]{Climbing}]{Climbing}

param(
    [Parameter(Mandatory=$false)]
    [string]$Root = "packs/_source",

    [Parameter(Mandatory=$false)]
    [string[]]$Include = @("*.json")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-BaseKey {
    param([string]$inside)
    # If the inside begins with a macro, pull out its inside; else use as-is.
    $m = [regex]::Match($inside, '^&(amp;)?[Rr]eference\[(?<inner>[^\]]+)\]')
    if ($m.Success) {
        $base = $m.Groups['inner'].Value
    } else {
        $base = $inside
    }
    # Use first token before space as the canonical key
    $base = ($base -split '\s+',2)[0]
    return $base.ToLowerInvariant()
}

function Get-DisplayText {
    param([System.Text.RegularExpressions.Match]$match)
    $labelGroup = $match.Groups['label']
    if ($labelGroup.Success) { return $labelGroup.Value }
    $inside = $match.Groups['inside'].Value
    # If the inside itself is a macro, prefer its label or its inside
    $inner = [regex]::Match($inside, '^&(amp;)?[Rr]eference\[(?<inner>[^\]]+)\](?:\{(?<innerlabel>[^}]+)\})?')
    if ($inner.Success) {
        if ($inner.Groups['innerlabel'].Success) { return $inner.Groups['innerlabel'].Value }
        return $inner.Groups['inner'].Value
    }
    return $inside
}

function Fix-NestedMacroIfNeeded {
    param([System.Text.RegularExpressions.Match]$match)
    # Reconstruct a clean macro if the inside begins with a macro
    $full = $match.Value
    $inside = $match.Groups['inside'].Value
    if ($inside -notmatch '^&(amp;)?[Rr]eference\[') { return $full }
    $amp = if ($match.Groups['amp'].Success) { '&amp;' } else { '&' }
    $macroCase = if ($match.Value -cmatch '&Reference\[') { 'Reference' } else { 'reference' }
    # Extract the base key and keep the original label if present
    $key = Get-BaseKey $inside
    $label = if ($match.Groups['label'].Success) { '{' + $match.Groups['label'].Value + '}' } else { '' }
    return "$amp$macroCase[$key]$label"
}

function Fix-Paragraph {
    param([string]$para)
    $pattern = '&(?<amp>amp;)?[Rr]eference\[(?<inside>[^\]]+)\](?:\{(?<label>[^}]+)\})?'
    $regex = New-Object System.Text.RegularExpressions.Regex($pattern)
    $sb = New-Object System.Text.StringBuilder
    $seen = New-Object 'System.Collections.Generic.HashSet[string]'
    $lastIndex = 0
    $m = $regex.Match($para)
    while ($m.Success) {
        # Append text before the match
        [void]$sb.Append($para.Substring($lastIndex, $m.Index - $lastIndex))
        # Key for uniqueness
        $key = Get-BaseKey $m.Groups['inside'].Value
        if (-not $seen.Contains($key)) {
            # Keep first occurrence; also sanitize nested macro if any
            $kept = Fix-NestedMacroIfNeeded $m
            [void]$sb.Append($kept)
            [void]$seen.Add($key)
        } else {
            # Replace subsequent occurrences with display text
            $disp = Get-DisplayText $m
            [void]$sb.Append($disp)
        }
        $lastIndex = $m.Index + $m.Length
        $m = $m.NextMatch()
    }
    # Append trailing text
    if ($lastIndex -lt $para.Length) {
        [void]$sb.Append($para.Substring($lastIndex))
    }
    return $sb.ToString()
}

function Fix-Content {
    param([string]$content)
    # Pre-pass: collapse nested macros like &reference[&reference[x]{Y}]{Z} -> &reference[x]{Z}
    $nestedPattern = '&(?<amp>amp;)?(?<case>[Rr]eference)\[&(?:amp;)?[Rr]eference\[(?<inner>[^\]]+)\](?:\{(?<innerlabel>[^}]+)\})?\](?:\{(?<outerlabel>[^}]+)\})?'
    $content = [regex]::Replace($content, $nestedPattern, {
        param($m)
        $prefix = if ($m.Groups['amp'].Success) { '&amp;' } else { '&' }
        $macroCase = $m.Groups['case'].Value
        $key = ($m.Groups['inner'].Value -split '\s+',2)[0]
        $label = if ($m.Groups['outerlabel'].Success) { $m.Groups['outerlabel'].Value } elseif ($m.Groups['innerlabel'].Success) { $m.Groups['innerlabel'].Value } else { $null }
        if ($label) { return "$prefix$macroCase[$key]{$label}" }
        return "$prefix$macroCase[$key]"
    })
    # Pass 1: collapse nested macros anywhere in the content (works across all tags)
    # Normalize any accidental double-ampersand before reference macros
    $nestedPattern = '&(?<amp>amp;)?(?<case>[Rr]eference)\[&(?:amp;)?[Rr]eference\[(?<inner>[^\]]+)\](?:\{(?<innerlabel>[^}]+)\})?\](?:\{(?<outerlabel>[^}]+)\})?'
    $content = [regex]::Replace($content, $nestedPattern, {
        param($m)
        $prefix = if ($m.Groups['amp'].Success) { '&amp;' } else { '&' }
        $macroCase = $m.Groups['case'].Value
        $key = ($m.Groups['inner'].Value -split '\s+',2)[0]
        $label = if ($m.Groups['outerlabel'].Success) { $m.Groups['outerlabel'].Value } elseif ($m.Groups['innerlabel'].Success) { $m.Groups['innerlabel'].Value } else { $null }
        if ($label) { return "$prefix$macroCase[$key]{$label}" }
        return "$prefix$macroCase[$key]"
    })
    $content = [regex]::Replace($content, '&&(?=(?:amp;)?[Rr]eference)', '&')

    # Pass 2: Deduplicate within common HTML tags (treat each tag body as its own scope)
    $tags = @('p','li','div','span','em','strong','td','th','dd','dt','blockquote','code','small','a','h1','h2','h3','h4','h5','h6')
    $new = $content
    foreach ($t in $tags) {
        $tagPattern = "<${t}(?<attrs>[^>]*)>(?<body>.*?)</${t}>"
        $tagRegex = New-Object System.Text.RegularExpressions.Regex($tagPattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
        $new = $tagRegex.Replace($new, { param($m) '<' + $t + $m.Groups['attrs'].Value + '>' + (Fix-Paragraph $m.Groups['body'].Value) + '</' + $t + '>' })
    }

    # Pass 3: Visual spacing without CSS
    # - Add a <br> between adjacent paragraphs to ensure a visible break when <p> has zero margins in Foundry.
    $new = [regex]::Replace($new, '</p>\s*(?:<br\s*/?>\s*)?<p>', '</p><br><p>')
    # - Ensure a space after inline closers when followed by text (avoid punctuation)
    $new = [regex]::Replace($new, '(</(?:strong|em|a)>)\s*(?=[A-Za-z0-9@])', '$1 ')
    # - Ensure a space before inline openers if jammed against text (avoid right after a tag)
    $new = [regex]::Replace($new, '(?<=[A-Za-z0-9@])(<(?:strong|em|a)\b)', ' $1')
    # - Remove accidental space right after opening block tags before inline tags (e.g., <p> <strong> -> <p><strong>)
    $new = [regex]::Replace($new, '<(p|li|div|h[1-6])([^>]*)>\s+(?=<(?:strong|em|a)\b)', '<$1$2>')
    # - Strip leading/trailing literal spaces inside common block tags
    $new = [regex]::Replace($new, '<(p|li|div|blockquote|h[1-6]|td|th|dd|dt)([^>]*)>\s+', '<$1$2>')
    $new = [regex]::Replace($new, '\s+</(p|li|div|blockquote|h[1-6]|td|th|dd|dt)>', '</$1>')
    
    return $new
}

$files = Get-ChildItem -Path $Root -Recurse -File -Include $Include
$changed = @()
foreach ($f in $files) {
    $orig = Get-Content -LiteralPath $f.FullName -Raw
    $fixed = Fix-Content $orig
    if ($fixed -ne $orig) {
        Set-Content -LiteralPath $f.FullName -Value $fixed -NoNewline
        $changed += $f.FullName
    }
}

"Changed files: $($changed.Count)"
if ($changed.Count -gt 0) { $changed | ForEach-Object { " - $_" } }
