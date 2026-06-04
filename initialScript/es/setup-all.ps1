Write-Host "Setting up Elasticsearch indexes..."

powershell -ExecutionPolicy Bypass -File .\initialScript\es\setup-courses.ps1
powershell -ExecutionPolicy Bypass -File .\initialScript\es\setup-categories.ps1

Write-Host "Elasticsearch indexes ready."
