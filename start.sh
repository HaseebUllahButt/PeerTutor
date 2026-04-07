#!/bin/bash

# Navigate to the directory where the script is located
cd "$(dirname "$0")"

echo "==================================="
echo "   Starting PeerTutor Platform"
echo "==================================="

# Check if node_modules exists, if not install
if [ ! -d "node_modules" ]; then
    echo "First time setup: Installing dependencies..."
    npm install
fi

echo -e "\nStarting Next.js Development Server..."
echo "Local MongoDB should be running at mongodb://localhost:27017 for DB connections."
echo "==================================="

# Start the dev server
npm run dev
