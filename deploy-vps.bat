@echo off
REM Script de deploy para VPS com Docker (Windows)
REM Execute: deploy-vps.bat

echo 🚀 Iniciando deploy do ROI Labs Chatbot Training na VPS...

REM Verificar se está na pasta correta
if not exist "package.json" (
    echo ❌ Execute este script na pasta raiz do projeto!
    pause
    exit /b 1
)

REM Verificar se Docker está rodando
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker não está rodando!
    pause
    exit /b 1
)

REM Verificar se docker-compose está disponível
docker-compose version >nul 2>&1
if errorlevel 1 (
    docker compose version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Docker Compose não encontrado!
        pause
        exit /b 1
    ) else (
        set DOCKER_COMPOSE=docker compose
    )
) else (
    set DOCKER_COMPOSE=docker-compose
)

echo ✅ Docker Compose encontrado: %DOCKER_COMPOSE%

REM Parar containers existentes
echo 📦 Parando containers existentes...
%DOCKER_COMPOSE% down --remove-orphans

REM Criar diretórios necessários
echo 📁 Criando diretórios necessários...
if not exist "logs" mkdir logs
if not exist "logs\nginx" mkdir logs\nginx
if not exist "ssl" mkdir ssl

REM Verificar se .env.production existe
if not exist ".env.production" (
    echo ⚠️ Arquivo .env.production não encontrado!
    echo 📄 Criando arquivo de exemplo...
    copy .env .env.production >nul
    echo ⚠️ Configure as variáveis em .env.production antes do deploy!
)

REM Build da imagem
echo 🔨 Fazendo build da imagem Docker...
%DOCKER_COMPOSE% build --no-cache
if errorlevel 1 (
    echo ❌ Falha no build da imagem Docker!
    pause
    exit /b 1
)

REM Iniciar containers
echo 🚀 Iniciando containers...
%DOCKER_COMPOSE% up -d

REM Aguardar que a aplicação esteja pronta
echo ⏳ Aguardando aplicação inicializar...
timeout /t 10 /nobreak >nul

REM Verificar se a aplicação está rodando
echo 🔍 Verificando se aplicação está respondendo...
set /a ATTEMPT=1
set /a MAX_ATTEMPTS=30

:check_health
curl -f http://localhost:3000/api/health >nul 2>&1
if not errorlevel 1 (
    echo ✅ Aplicação está respondendo!
    goto :health_ok
)

if %ATTEMPT% geq %MAX_ATTEMPTS% (
    echo ❌ Aplicação não respondeu após %MAX_ATTEMPTS% tentativas
    pause
    exit /b 1
)

echo Tentativa %ATTEMPT%/%MAX_ATTEMPTS%...
timeout /t 2 /nobreak >nul
set /a ATTEMPT+=1
goto :check_health

:health_ok

REM Mostrar status dos containers
echo 📊 Status dos containers:
%DOCKER_COMPOSE% ps

REM Mostrar logs recentes
echo 📋 Logs recentes da aplicação:
%DOCKER_COMPOSE% logs --tail=20 roi-chatbot

echo.
echo 🎉 Deploy concluído com sucesso!
echo.
echo 📍 URLs disponíveis:
echo    • Health Check: http://localhost:3000/api/health
echo    • API Info: http://localhost:3000/api/info
echo    • Dashboard: http://localhost:3000
echo.
echo 🔧 Comandos úteis:
echo    • Ver logs: %DOCKER_COMPOSE% logs -f
echo    • Parar: %DOCKER_COMPOSE% down
echo    • Reiniciar: %DOCKER_COMPOSE% restart
echo    • Status: %DOCKER_COMPOSE% ps
echo.
echo 📊 Para monitorar:
echo    • curl http://localhost:3000/api/health
echo    • %DOCKER_COMPOSE% logs roi-chatbot
echo.

pause
