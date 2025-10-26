#!/bin/bash

echo "╔════════════════════════════════════════╗"
echo "║   NEXUS VOID - Multiplayer Setup      ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
   echo "❌ Node.js is not installed!"
   echo "Please install Node.js from: https://nodejs.org/"
   exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
   echo ""
   echo "✅ Setup complete!"
   echo ""
   echo "🚀 To start the server, run:"
   echo "   npm start"
   echo ""
   echo "🌐 Then open your browser to:"
   echo "   http://localhost:3000"
   echo ""
else
   echo ""
   echo "❌ Installation failed!"
   echo "Please check the error messages above."
   exit 1
fi
