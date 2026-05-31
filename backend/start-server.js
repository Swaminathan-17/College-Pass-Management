#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting College Pass Management Backend...\n');

// Function to check if MongoDB is running
function checkMongoDB() {
  return new Promise((resolve) => {
    const check = spawn('sudo', ['systemctl', 'is-active', '--quiet', 'mongod']);
    check.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

// Function to start MongoDB
function startMongoDB() {
  return new Promise((resolve, reject) => {
    console.log('📦 Starting MongoDB service...');
    const start = spawn('sudo', ['systemctl', 'start', 'mongod'], {
      stdio: 'inherit'
    });
    
    start.on('close', (code) => {
      if (code === 0) {
        console.log('✅ MongoDB started successfully\n');
        resolve();
      } else {
        console.log('❌ Failed to start MongoDB');
        reject(new Error('MongoDB startup failed'));
      }
    });
  });
}

// Function to start the backend server
function startBackend() {
  console.log('🔧 Starting backend server...');
  
  const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    cwd: __dirname
  });

  // Handle server process
  server.on('close', (code) => {
    console.log(`\nBackend server exited with code: ${code}`);
  });

  // Handle Ctrl+C to gracefully shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.kill('SIGINT');
    process.exit(0);
  });

  return server;
}

// Main execution
async function main() {
  try {
    // Check if MongoDB is running
    const mongoRunning = await checkMongoDB();
    
    if (!mongoRunning) {
      await startMongoDB();
      // Give MongoDB a moment to fully start
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log('✅ MongoDB is already running\n');
    }

    // Start the backend server
    startBackend();
    
  } catch (error) {
    console.error('❌ Startup failed:', error.message);
    process.exit(1);
  }
}

main();
