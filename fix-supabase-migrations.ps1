Write-Host "Fixing Supabase migration schema ordering..." -ForegroundColor Cyan

$Migration = ".\supabase\migrations\202607100001_foundation_bootstrap.sql"

if (!(Test-Path $Migration)) {
    Write-Host "Migration file not found:"
    Write-Host $Migration
    exit 1
}

Write-Host "[1/6] Backing up migration..."

Copy-Item `
    $Migration `
    "$Migration.backup" `
    -Force


Write-Host "[2/6] Checking platform_private schema..."

$content = Get-Content $Migration -Raw


if ($content -notmatch "create schema if not exists platform_private") {

    Write-Host "Adding platform_private schema creation..."

    $schema = @"
-- Required internal schema for foundation functions
create schema if not exists platform_private;

grant usage on schema platform_private to postgres;

"@

    $content = $schema + "`r`n" + $content

    Set-Content `
        -Path $Migration `
        -Value $content `
        -Encoding UTF8
}
else {
    Write-Host "Schema already exists."
}


Write-Host "[3/6] Fixing function search paths..."

$content = Get-Content $Migration -Raw

$content = $content -replace `
"set search_path = pg_catalog", `
"set search_path = platform_private, pg_catalog"


Set-Content `
    -Path $Migration `
    -Value $content `
    -Encoding UTF8


Write-Host "[4/6] Checking first lines..."

Get-Content $Migration -TotalCount 35


Write-Host "[5/6] Restarting Supabase..."

supabase stop

supabase start


Write-Host "[6/6] Resetting database..."

supabase db reset


Write-Host ""
Write-Host "DONE. Migration repair completed." -ForegroundColor Green