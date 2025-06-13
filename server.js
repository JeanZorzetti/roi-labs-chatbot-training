#!/usr/bin/env node

// Arquivo de inicialização otimizado para cPanel
// Este arquivo detecta o ambiente e ajusta as configurações automaticamente

const path = require('path');
const fs = require('fs');

// Configurações de ambiente para cPanel
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Detectar se estamos no cPanel (geralmente tem estas variáveis)
const isCPanel = process.env.cPanel || process.env.CPANEL || process.env.HOME?.includes('/home/');

if (isCPanel) {
    console.log('🏢 Detectado ambiente cPanel');
    
    // Ajustar porta para cPanel (geralmente usa port binding)
    if (!process.env.PORT) {
        // cPanel geralmente usa portas dinâmicas
        process.env.PORT = process.env.npm_config_port || 3000;
    }
    
    // Ajustar caminhos para cPanel
    process.chdir(__dirname);
}

// Verificar se node_modules existe
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
    console.error('❌ node_modules não encontrado!');
    console.log('📦 Execute: npm install');
    process.exit(1);
}

// Verificar se .env existe
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.warn('⚠️  Arquivo .env não encontrado!');
    console.log('🔧 Crie o arquivo .env com as variáveis necessárias');
}

// Log de inicialização
console.log('🚀 Iniciando ROI Labs Chatbot Training...');
console.log(`📁 Diretório: ${__dirname}`);
console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
console.log(`🔌 Porta: ${process.env.PORT || 3000}`);

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
    // Em produção, loggar e continuar quando possível
    if (process.env.NODE_ENV === 'production') {
        console.log('🔄 Tentando continuar...');
    } else {
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada:', reason);
    console.error('At:', promise);
});

// Iniciar a aplicação
try {
    require('./src/app.js');
} catch (error) {
    console.error('❌ Erro ao iniciar aplicação:', error);
    process.exit(1);
}
