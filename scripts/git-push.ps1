# Git workflow wrapper with interactive prompts for staging, committing, and pushing changes
param(
    [string]$Message = ""
)

# Check if there are changes to commit
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "✓ No changes to commit. Your branch is up to date." -ForegroundColor Green
    exit 0
}

Write-Host "📋 Changes to commit:" -ForegroundColor Cyan
Write-Host $status
Write-Host ""

# If message not provided as parameter, prompt user
if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = Read-Host "Enter commit message"
}

if ([string]::IsNullOrWhiteSpace($Message)) {
    Write-Host "✗ Commit message cannot be empty. Aborting." -ForegroundColor Red
    exit 1
}

# Confirm before proceeding
Write-Host ""
Write-Host "About to:" -ForegroundColor Yellow
Write-Host "  1. Stage all changes"
Write-Host "  2. Commit with message: '$Message'"
Write-Host "  3. Push to remote"
Write-Host ""
$confirm = Read-Host "Continue? (y/n)"

if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "✗ Aborted." -ForegroundColor Red
    exit 1
}

# Execute git commands
Write-Host ""
Write-Host "Staging changes..." -ForegroundColor Cyan
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to stage changes." -ForegroundColor Red
    exit 1
}

Write-Host "Committing..." -ForegroundColor Cyan
git commit -m $Message
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to commit." -ForegroundColor Red
    exit 1
}

Write-Host "Pushing to remote..." -ForegroundColor Cyan
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to push." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✓ Successfully staged, committed, and pushed!" -ForegroundColor Green
