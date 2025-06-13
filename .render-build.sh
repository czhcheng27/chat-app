#!/bin/bash

echo "Cleaning frontend dependencies and lock file..."
rm -rf frontend/node_modules frontend/package-lock.json

echo "Installing frontend dependencies..."
npm install --prefix frontend

echo "Installing required dev types (react-dom)..."
npm install --save-dev --prefix frontend @types/react @types/react-dom

echo "Installing vite plugin react..."
npm install --prefix frontend @vitejs/plugin-react

echo "Building frontend..."
npm run build --prefix frontend

echo "Installing backend dependencies..."
npm install --prefix backend
