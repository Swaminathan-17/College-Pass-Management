#!/bin/bash

echo "🚀 Starting College Pass Management Backend..."

# Check if MongoDB is running
if ! systemctl is-active --quiet mongod; then
    echo "📦 Starting MongoDB service..."
    sudo systemctl start mongod
    if [ $? -eq 0 ]; then
        echo "✅ MongoDB started successfully"
        sleep 2
    else
        echo "❌ Failed to start MongoDB"
        exit 1
    fi
else
    echo "✅ MongoDB is already running"
fi

echo "🔧 Starting backend server..."
node server.js
