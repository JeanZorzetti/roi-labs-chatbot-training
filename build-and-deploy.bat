@echo off
REM Script de build e deploy para Easypanel - Windows
REM ROI Labs Chatbot Training

setlocal enabledelayedexpansion

echo.
echo 🚀 ROI Labs Chatbot Training - Build ^& Deploy Script
echo ==================================================

REM Configurações
set IMAGE_NAME=jeanzvh/roi-chatbot-training
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set VERSION=%dt:~0,8%-%dt:~8,6%
set LATEST_TAG=latest

echo.
echo [INFO] Verificando Docker...

REM Verificar se Docker está instalado
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker não está instalado!
    pause
    exit /b 1
)

echo [INFO] Docker encontrado!

echo.
echo [INFO] Iniciando build da imagem Docker...
echo [INFO] Building image: %IMAGE_NAME%:%VERSION%

REM Build da imagem
docker build ^
    --platform linux/amd64 ^
    --tag "%IMAGE_NAME%:%VERSION%" ^
    --tag "%IMAGE_NAME%:%LATEST_TAG%" ^
    --label "version=%VERSION%" ^
    --label "build-date=%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,8%Z" ^
    --label "maintainer=ROI Labs <contato@roilabs.com.br>" ^
    .

if errorlevel 1 (
    echo [ERROR] ❌ Falha no build da imagem
    pause
    exit /b 1
)

echo [INFO] ✅ Build concluído com sucesso!

echo.
echo [INFO] Testando a imagem localmente...

REM Testar a imagem localmente
for /f %%i in ('docker run -d -p 3001:3001 -e NODE_ENV=production -e PORT=3001 -e HOST=0.0.0.0 "%IMAGE_NAME%:%LATEST_TAG%"') do set CONTAINER_ID=%%i

REM Aguardar container inicializar
echo [INFO] Aguardando container inicializar...
timeout /t 15 /nobreak >nul

REM Testar health check
curl -f http://localhost:3001/api/health >nul 2>&1
if errorlevel 1 (
    echo [ERROR] ❌ Health check falhou!
    docker logs %CONTAINER_ID%
    docker stop %CONTAINER_ID% >nul
    docker rm %CONTAINER_ID% >nul
    pause
    exit /b 1
)

echo [INFO] ✅ Health check passou!

REM Parar container de teste
docker stop %CONTAINER_ID% >nul
docker rm %CONTAINER_ID% >nul

echo.
set /p PUSH_CHOICE="Fazer push para Docker Hub? (y/N): "
if /i "%PUSH_CHOICE%"=="y" (
    echo [INFO] Fazendo push para Docker Hub...
    
    docker push "%IMAGE_NAME%:%VERSION%"
    docker push "%IMAGE_NAME%:%LATEST_TAG%"
    
    if errorlevel 1 (
        echo [ERROR] ❌ Falha no push
        pause
        exit /b 1
    )
    
    echo [INFO] ✅ Push concluído com sucesso!
    echo [INFO] 🐳 Imagem disponível em: %IMAGE_NAME%:%LATEST_TAG%
)

echo.
echo [INFO] Gerando configuração para Easypanel...

REM Gerar configuração para Easypanel
(
echo {
echo   "name": "roi-labs-chatbot-training",
echo   "image": "%IMAGE_NAME%:%LATEST_TAG%",
echo   "port": 3001,
echo   "env": {
echo     "NODE_ENV": "production",
echo     "PORT": "3001",
echo     "HOST": "0.0.0.0",
echo     "DOCKER_ENV": "true"
echo   },
echo   "healthCheck": {
echo     "path": "/api/health",
echo     "port": 3001,
echo     "initialDelaySeconds": 40,
echo     "periodSeconds": 30
echo   },
echo   "resources": {
echo     "limits": {
echo       "memory": "1Gi",
echo       "cpu": "1000m"
echo     },
echo     "requests": {
echo       "memory": "512Mi",
echo       "cpu": "500m"
echo     }
echo   },
echo   "volumes": [
echo     {
echo       "name": "logs",
echo       "mountPath": "/app/logs",
echo       "size": "1Gi"
echo     }
echo   ]
echo }
) > easypanel-deploy.json

echo [INFO] ✅ Configuração salva em: easypanel-deploy.json

echo.
echo 🎉 Build concluído com sucesso!
echo.
echo Próximos passos:
echo 1. 📋 Configure as variáveis de ambiente no Easypanel:
echo    - SUPABASE_URL
echo    - SUPABASE_ANON_KEY
echo    - OPENAI_API_KEY (opcional)
echo.
echo 2. 🚀 No Easypanel:
echo    - Use a imagem: %IMAGE_NAME%:%LATEST_TAG%
echo    - Ou importe: easypanel-deploy.json
echo.
echo 3. 🗃️ Configure o banco de dados Supabase
echo    - Execute o script SQL fornecido
echo.
echo 4. ✅ Teste o deploy:
echo    - Health: https://seudominio.com/api/health
echo    - Dashboard: https://seudominio.com
echo.

set /p CLEANUP_CHOICE="Limpar imagens locais antigas? (y/N): "
if /i "%CLEANUP_CHOICE%"=="y" (
    echo [INFO] Limpando imagens antigas...
    docker image prune -f
    echo [INFO] ✅ Limpeza concluída!
)

echo.
echo 🚀 Deploy ready! Imagem: %IMAGE_NAME%:%LATEST_TAG%
echo.
pause