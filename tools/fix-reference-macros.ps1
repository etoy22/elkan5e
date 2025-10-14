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

function Normalize-Key {
    param([string]$key)
    if ([string]::IsNullOrWhiteSpace($key)) { return $key }
    # Remove non-alphanumerics to match Foundry CONFIG keys (e.g., "Light Weapon" -> "lightweapon")
    $k = [regex]::Replace($key, '[^A-Za-z0-9]+', '')
    # Work on lowercase for rules; we will restore casing later if needed
    $kl = $k.ToLowerInvariant()
    # Basic plural heuristics (conservative)
    if ($kl -match 'ies$' -and $kl.Length -gt 3) {
        $kl = $kl.Substring(0, $kl.Length - 3) + 'y'
    } elseif ($kl -match '(xes|zes|ches|shes|ses)$' -and $kl.Length -gt 3) {
        $kl = $kl.Substring(0, $kl.Length - 2)
    } elseif ($kl -match 's$' -and -not ($kl -match '(ss|us|is)$') -and $kl.Length -gt 3) {
        $kl = $kl.Substring(0, $kl.Length - 1)
    }
    return $kl
}

function Apply-Casing {
    param(
        [string]$source,
        [string]$canonical
    )
    if ([string]::IsNullOrEmpty($canonical)) { return $canonical }
    if ($source -cmatch '^[A-Z]+$') { return $canonical.ToUpperInvariant() }
    elseif ($source -cmatch '^[A-Z][a-z]+$') {
        return ([char]::ToUpper($canonical[0])) + ($canonical.Substring(1).ToLowerInvariant())
    }
    elseif ($source -cmatch '^[a-z]+$') { return $canonical.ToLowerInvariant() }
    else { return $canonical }
}

function Get-BaseKey {
    param([string]$inside)
    # If the inside begins with a macro, pull out its inside; else use as-is.
    $m = [regex]::Match($inside, '^&(amp;)?[Rr]eference\[(?<inner>[^\]]+)\]')
    if ($m.Success) {
        $innerInside = $m.Groups['inner'].Value
        $base = $innerInside
    } else {
        $base = $inside
    }
    # Remove any macro options like "apply=false" but preserve multi-word keys
    $base = [regex]::Replace($base, '\s+\w+=\S+', '')
    $base = $base.Trim()
    return (Normalize-Key $base)
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
        $innerInside = $inner.Groups['inner'].Value
        # Strip options from inner macro before display
        $innerInside = [regex]::Replace($innerInside, '\s+\w+=\S+', '')
        return $innerInside.Trim()
    }
    # Strip options from display
    $disp = [regex]::Replace($inside, '\s+\w+=\S+', '')
    return $disp.Trim()
}

function KeepOrFlattenMacro {
    param([System.Text.RegularExpressions.Match]$match)
    $amp = if ($match.Groups['amp'].Success) { '&amp;' } else { '&' }
    $macroCase = if ($match.Value -cmatch '&Reference\[') { 'Reference' } else { 'reference' }
    $inside = $match.Groups['inside'].Value
    $label = if ($match.Groups['label'].Success) { $match.Groups['label'].Value } else { $null }

    # Extract options (e.g., "apply=false") and key part (which may be multi-word)
    $optMatch = [regex]::Match($inside, '^(?<key>[^\]]*?)(?:\s+(?<opts>(?:\w+=\S+)(?:\s+\w+=\S+)*))?$')
    $keyPart = $inside
    $optsPart = ''
    if ($optMatch.Success) {
        $keyPart = $optMatch.Groups['key'].Value.Trim()
        if ($optMatch.Groups['opts'].Success) { $optsPart = ' ' + $optMatch.Groups['opts'].Value.Trim() }
    }

    # If inside itself is a macro, flatten it keeping its label if present
    $inner = [regex]::Match($keyPart, '^&(amp;)?[Rr]eference\[(?<inner>[^\]]+)\](?:\{(?<innerlabel>[^}]+)\})?')
    if ($inner.Success) {
        # Flatten one level: use the inner macro's inside verbatim; prefer outer label if present
        $innerKey = $inner.Groups['inner'].Value.Trim()
        $finalLabel = if ($label) { $label } elseif ($inner.Groups['innerlabel'].Success) { $inner.Groups['innerlabel'].Value } else { $null }
        if ($finalLabel) { return "$amp$macroCase[$innerKey]$optsPart{$finalLabel}" }
        return "$amp$macroCase[$innerKey]$optsPart"
    }

    # Normal case: keep macro as-is (do not singularize or change spacing/casing)
    if ($label) { return "$amp$macroCase[$keyPart]$optsPart{$label}" }
    return "$amp$macroCase[$keyPart]$optsPart"
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
        # If macro includes apply=false option, keep it verbatim and do not count toward dedupe
        $insideVal = $m.Groups['inside'].Value
        $hasNoApply = [regex]::IsMatch($insideVal, '(?i)\bapply\s*=\s*false\b')
        if ($hasNoApply) {
            [void]$sb.Append((KeepOrFlattenMacro $m))
        }
        elseif (-not $seen.Contains($key)) {
            # Keep first occurrence; flatten nested macro if any, but do not alter plural/singular
            $kept = KeepOrFlattenMacro $m
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
    # Pre-pass A: move trailing apply=false into the macro brackets
    # Example: &reference[Charmed] apply=false -> &reference[Charmed apply=false]
    $outsideApplyPattern = '(?i)&(?<amp>amp;)?(?<case>reference)\[(?<inside>[^\]]+)\](?:\s|&nbsp;)+apply\s*=\s*false'
    $content = [regex]::Replace($content, $outsideApplyPattern, {
        param($m)
        $prefix = if ($m.Groups['amp'].Success) { '&amp;' } else { '&' }
        $macroCase = $m.Groups['case'].Value
        $inside = $m.Groups['inside'].Value
        return "$prefix$macroCase[$inside apply=false]"
    })
    # Fallback simple rewrite using backreferences
    $content = [regex]::Replace($content, '(&(?:amp;)?[Rr]eference\[[^\]]+)\]\s*apply\s*=\s*false', '$1 apply=false]')
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
    # Exclude headers (h1–h6) from dedupe to avoid modifying references in headings
    $tags = @('p','li','div','span','em','strong','td','th','dd','dt','blockquote','code','small','a')
    $new = $content
    foreach ($t in $tags) {
        $tagPattern = "<${t}(?<attrs>[^>]*)>(?<body>.*?)</${t}>"
        $tagRegex = New-Object System.Text.RegularExpressions.Regex($tagPattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
        $new = $tagRegex.Replace($new, { param($m) '<' + $t + $m.Groups['attrs'].Value + '>' + (Fix-Paragraph $m.Groups['body'].Value) + '</' + $t + '>' })
    }

    # Pass 2b: Remove macros within headers entirely (replace with display text only)
    $hdrTags = @('h1','h2','h3','h4','h5','h6')
    foreach ($t in $hdrTags) {
        $tagPattern = "<${t}(?<attrs>[^>]*)>(?<body>.*?)</${t}>"
        $tagRegex = New-Object System.Text.RegularExpressions.Regex($tagPattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
        $pattern = '&(?<amp>amp;)?[Rr]eference\[(?<inside>[^\]]+)\](?:\{(?<label>[^}]+)\})?'
        $macroRegex = New-Object System.Text.RegularExpressions.Regex($pattern)
        $new = $tagRegex.Replace($new, {
            param($m)
            $body = $m.Groups['body'].Value
            $replaced = $macroRegex.Replace($body, { param($m2) (Get-DisplayText $m2) })
            return '<' + $t + $m.Groups['attrs'].Value + '>' + $replaced + '</' + $t + '>'
        })
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
    # - Strip attributes from <p ...> so only <p> remains
    $new = [regex]::Replace($new, '(?i)<p\b[^>]*>', '<p>')
    
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
