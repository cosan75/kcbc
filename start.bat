@echo off
REM KCBC Builder Studio - 독립 실행 (CC와 무관)
REM 더블클릭하면 dev 서버가 켜지고, 브라우저가 자동으로 열립니다.

cd /d "%~dp0"

REM 의존성 자동 설치
if not exist node_modules (
  echo [INFO] node_modules 가 없어서 처음에 설치합니다...
  call npm install
)

REM 브라우저 자동 열기 (3초 후)
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5174"

REM dev 서버 시작 (이 창을 닫으면 서버도 종료)
echo.
echo ============================================
echo  KCBC Builder Studio
echo  http://localhost:5174
echo  (이 창을 닫으면 서버가 꺼집니다)
echo ============================================
echo.
npm run dev
