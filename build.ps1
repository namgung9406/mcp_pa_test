$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
function Invoke-BuildStep([string]$StepName, [scriptblock]$Action) {
    Write-Host $StepName
    & $Action
    if ($LASTEXITCODE -ne 0) { throw "$StepName 실패: 종료 코드 $LASTEXITCODE" }
}
Push-Location (Join-Path $projectRoot 'WorkHub')
try {
    Invoke-BuildStep '의존성 복원' { npm ci }
    Invoke-BuildStep 'PCF 타입 생성' { npm run refreshTypes }
    Invoke-BuildStep '타입 검증' { npm run typecheck }
    Invoke-BuildStep '미리보기 생성' { npm run preview:build }
    Invoke-BuildStep '솔루션 빌드' { dotnet build ../WorkHubSolution/WorkHubSolution.cdsproj --configuration Release }
    Invoke-BuildStep '입력 검증' { node scripts/check-domain.mjs }
    Invoke-BuildStep 'UI 검증' { node scripts/check-ui.mjs }
    Invoke-BuildStep 'PCF 호스트 검증' { node scripts/check-pcf.mjs }
    Write-Host '완료: WorkHubSolution/bin/Release의 ZIP을 사용하세요.'
} finally {
    Pop-Location
}
