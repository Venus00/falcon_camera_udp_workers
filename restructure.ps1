# PowerShell Script to Restructure the Project
# This moves existing UDP workers files into the udp_workers folder

Write-Host "=".PadRight(70, "=")
Write-Host "  Restructuring Military Workers Project"
Write-Host "=".PadRight(70, "=")
Write-Host ""

# Items to move to udp_workers
$itemsToMove = @(
    "src",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "node_modules",
    "README.md",
    "PELCO-D-REFERENCE.md",
    "PELCO-D-TESTING-GUIDE.md",
    "PROJECT-SUMMARY.md",
    "SERVER-1-PELCO-D.md",
    "SERVER-2-SMART.md",
    "SMART-REFERENCE.md"
)

Write-Host "Moving files to udp_workers folder..."
Write-Host ""

foreach ($item in $itemsToMove) {
    $sourcePath = ".\$item"
    $destPath = ".\udp_workers\$item"
    
    if (Test-Path $sourcePath) {
        try {
            Move-Item -Path $sourcePath -Destination $destPath -Force
            Write-Host "[OK] Moved: $item" -ForegroundColor Green
        }
        catch {
            Write-Host "[ERROR] Failed to move: $item - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    else {
        Write-Host "[SKIP] Not found: $item" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Renaming root package.json..."

if (Test-Path ".\package.json.root") {
    try {
        Rename-Item -Path ".\package.json.root" -NewName "package.json" -Force
        Write-Host "[OK] Renamed package.json.root to package.json" -ForegroundColor Green
    }
    catch {
        Write-Host "[ERROR] Failed to rename package.json.root - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Renaming ROOT-README.md to README.md..."

if (Test-Path ".\ROOT-README.md") {
    try {
        Rename-Item -Path ".\ROOT-README.md" -NewName "README.md" -Force
        Write-Host "[OK] Renamed ROOT-README.md to README.md" -ForegroundColor Green
    }
    catch {
        Write-Host "[ERROR] Failed to rename ROOT-README.md - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=".PadRight(70, "=")
Write-Host "  Restructuring Complete!"
Write-Host "=".PadRight(70, "=")
Write-Host ""
Write-Host "Next Steps:"
Write-Host ""
Write-Host "1. Install stockage dependencies:"
Write-Host "   cd stockage"
Write-Host "   npm install"
Write-Host "   cd .."
Write-Host ""
Write-Host "2. Verify udp_workers still works:"
Write-Host "   cd udp_workers"
Write-Host "   npm run dev"
Write-Host "   cd .."
Write-Host ""
Write-Host "3. Test stockage services:"
Write-Host "   cd stockage"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "Project structure:"
Write-Host "  ./udp_workers/    - UDP camera control system"
Write-Host "  ./stockage/       - FTP + Express file storage"
Write-Host ""
