@echo off
cd /d "%~dp0"
echo.
echo  WebSprint — локальный сервер
echo  Откройте в браузере:
echo.
echo    http://localhost:8765/admin.html
echo    http://localhost:8765/index.html
echo.
echo  Закройте это окно, чтобы остановить сервер.
echo.
python -m http.server 8765
pause
