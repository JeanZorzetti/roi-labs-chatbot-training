#!/usr/bin/env node

// Health check script for ROI Labs Chatbot Training
// Enhanced for better debugging and monitoring

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

// Enhanced health check with detailed information
async function healthCheck() {
    try {
        console.log('🏥 Starting enhanced health check...');
        console.log(`📍 Checking service at http://${HOST}:${PORT}`);
        
        // Check if React dashboard files exist
        const dashboardPath = path.join(__dirname, 'public', 'dashboard', 'index.html');
        const dashboardExists = fs.existsSync(dashboardPath);
        
        console.log(`📁 Dashboard path: ${dashboardPath}`);
        console.log(`📁 Dashboard exists: ${dashboardExists ? '✅ YES' : '❌ NO'}`);
        
        if (dashboardExists) {
            const stats = fs.statSync(dashboardPath);
            console.log(`📊 Dashboard file size: ${stats.size} bytes`);
            console.log(`📅 Dashboard modified: ${stats.mtime}`);
        }
        
        // Check public directory structure
        const publicDir = path.join(__dirname, 'public');
        if (fs.existsSync(publicDir)) {
            console.log('📂 Public directory contents:');
            const contents = fs.readdirSync(publicDir);
            contents.forEach(item => {
                const itemPath = path.join(publicDir, item);
                const isDir = fs.statSync(itemPath).isDirectory();
                console.log(`  ${isDir ? '📁' : '📄'} ${item}`);
                
                if (item === 'dashboard' && isDir) {
                    const dashboardContents = fs.readdirSync(itemPath);
                    console.log('    📂 Dashboard contents:');
                    dashboardContents.forEach(file => {
                        console.log(`      📄 ${file}`);
                    });
                }
            });
        } else {
            console.log('❌ Public directory not found!');
        }
        
        // Make HTTP request to health endpoint
        const options = {
            hostname: HOST,
            port: PORT,
            path: '/api/health',
            method: 'GET',
            timeout: 5000
        };
        
        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const healthData = JSON.parse(data);
                        console.log('✅ Health check successful!');
                        console.log(`📊 Status: ${healthData.status}`);
                        console.log(`📈 Uptime: ${healthData.uptime}s`);
                        console.log(`💾 Memory: ${healthData.memory?.used || 'unknown'}`);
                        console.log(`🎨 Dashboard: ${healthData.dashboard?.available ? '✅ Available' : '❌ Not Available'}`);
                        console.log(`🔧 Dashboard Type: ${healthData.dashboard?.type || 'unknown'}`);
                        
                        if (res.statusCode === 200 && healthData.status === 'healthy') {
                            resolve(true);
                        } else {
                            reject(new Error(`Health check failed: ${healthData.status || 'unknown'}`));
                        }
                    } catch (parseError) {
                        console.log('⚠️  Could not parse health response:', data);
                        reject(parseError);
                    }
                });
            });
            
            req.on('timeout', () => {
                console.log('❌ Health check timeout');
                req.destroy();
                reject(new Error('Health check timeout'));
            });
            
            req.on('error', (err) => {
                console.log('❌ Health check error:', err.message);
                reject(err);
            });
            
            req.end();
        });
        
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
        throw error;
    }
}

// Run health check
if (require.main === module) {
    healthCheck()
        .then(() => {
            console.log('✅ Health check passed!');
            process.exit(0);
        })
        .catch((error) => {
            console.log('❌ Health check failed:', error.message);
            process.exit(1);
        });
}

module.exports = { healthCheck };