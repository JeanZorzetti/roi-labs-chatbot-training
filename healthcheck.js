#!/usr/bin/env node

// Health check script for ROI Labs Chatbot Training
// Enhanced for production Docker containers - v1.0.3

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';
const TIMEOUT = 8000; // 8 second timeout

// Enhanced health check with detailed information
async function healthCheck() {
    const startTime = Date.now();
    
    try {
        console.log('🏥 Starting health check...');
        console.log(`📍 Target: http://${HOST}:${PORT}/api/health`);
        console.log(`⏱️  Timeout: ${TIMEOUT}ms`);
        
        // Quick file system checks (non-blocking)
        await performFileSystemChecks();
        
        // Make HTTP request to health endpoint
        const healthData = await performHealthRequest();
        
        const duration = Date.now() - startTime;
        console.log(`✅ Health check completed in ${duration}ms`);
        console.log(`📊 API Status: ${healthData.status}`);
        
        if (healthData.uptime !== undefined) {
            console.log(`📈 Uptime: ${healthData.uptime}s`);
        }
        
        if (healthData.memory) {
            console.log(`💾 Memory: ${healthData.memory.used}`);
        }
        
        if (healthData.dashboard) {
            console.log(`🎨 Dashboard: ${healthData.dashboard.available ? '✅ Available' : '❌ Not Available'} (${healthData.dashboard.type})`);
        }
        
        return true;
        
    } catch (error) {
        const duration = Date.now() - startTime;
        console.log(`❌ Health check failed after ${duration}ms:`, error.message);
        throw error;
    }
}

// Perform file system checks
async function performFileSystemChecks() {
    try {
        // Check critical directories
        const checks = [
            { path: path.join(__dirname, 'src'), name: 'Source directory' },
            { path: path.join(__dirname, 'public'), name: 'Public directory' },
            { path: path.join(__dirname, 'package.json'), name: 'Package.json' }
        ];
        
        checks.forEach(check => {
            if (fs.existsSync(check.path)) {
                console.log(`📁 ${check.name}: ✅ OK`);
            } else {
                console.log(`📁 ${check.name}: ⚠️  Missing`);
            }
        });
        
        // Check dashboard specifically
        const dashboardPath = path.join(__dirname, 'public', 'dashboard', 'index.html');
        const dashboardExists = fs.existsSync(dashboardPath);
        console.log(`🎨 Dashboard build: ${dashboardExists ? '✅ Available' : '⚠️  Not found'}`);
        
    } catch (fsError) {
        console.log('⚠️  File system check error:', fsError.message);
        // Don't fail health check for FS issues, just log them
    }
}

// Perform HTTP health request
async function performHealthRequest() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: HOST === '0.0.0.0' ? 'localhost' : HOST, // Docker compatibility
            port: PORT,
            path: '/api/health',
            method: 'GET',
            timeout: TIMEOUT,
            headers: {
                'User-Agent': 'ROI-Health-Check/1.0'
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    if (res.statusCode !== 200) {
                        reject(new Error(`HTTP ${res.statusCode}: ${data || 'No response data'}`));
                        return;
                    }
                    
                    const healthData = JSON.parse(data);
                    
                    // Validate response structure
                    if (!healthData.status) {
                        reject(new Error('Invalid health response: missing status'));
                        return;
                    }
                    
                    if (healthData.status !== 'healthy') {
                        reject(new Error(`Service unhealthy: ${healthData.status}`));
                        return;
                    }
                    
                    resolve(healthData);
                    
                } catch (parseError) {
                    console.log('⚠️  Response data:', data.substring(0, 200) + (data.length > 200 ? '...' : ''));
                    reject(new Error(`Parse error: ${parseError.message}`));
                }
            });
        });
        
        req.on('timeout', () => {
            console.log(`❌ Request timeout after ${TIMEOUT}ms`);
            req.destroy();
            reject(new Error(`Health check timeout (${TIMEOUT}ms)`));
        });
        
        req.on('error', (err) => {
            if (err.code === 'ECONNREFUSED') {
                reject(new Error(`Connection refused to ${HOST}:${PORT} - service may not be ready`));
            } else if (err.code === 'ENOTFOUND') {
                reject(new Error(`Host not found: ${HOST}`));
            } else {
                reject(new Error(`Network error: ${err.message}`));
            }
        });
        
        req.setTimeout(TIMEOUT);
        req.end();
    });
}

// Graceful exit handler
function gracefulExit(code, message) {
    if (message) {
        console.log(message);
    }
    
    // Give logs a moment to flush
    setTimeout(() => {
        process.exit(code);
    }, 100);
}

// Run health check when called directly
if (require.main === module) {
    console.log('🚀 ROI Labs Health Check v1.0.3');
    console.log(`🐳 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Process PID: ${process.pid}`);
    
    healthCheck()
        .then(() => {
            gracefulExit(0, '✅ Health check PASSED - Service is healthy!');
        })
        .catch((error) => {
            gracefulExit(1, `❌ Health check FAILED: ${error.message}`);
        });
    
    // Fallback timeout (should never reach this in normal operation)
    setTimeout(() => {
        gracefulExit(1, '❌ Health check TIMEOUT - Force exit after 30s');
    }, 30000);
}

module.exports = { healthCheck };
