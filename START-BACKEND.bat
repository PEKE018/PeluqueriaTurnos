@echo off
echo ====================================
echo   INICIANDO BACKEND MOSTAZA
echo ====================================
echo.

cd backend

echo Verificando archivo .env...
if not exist .env (
    echo ERROR: Archivo .env no encontrado!
    echo Copia .env.example a .env y configura las credenciales
    pause
    exit /b 1
)

echo.
echo Iniciando servidor Node.js...
echo Backend corriendo en: http://localhost:3000
echo.
echo Presiona Ctrl+C para detener
echo.

npm start
