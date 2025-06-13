#!/bin/bash

echo "Cleaning up node_modules and lock files..."
rm -rf frontend/node_modules frontend/package-lock.json

echo "Installing frontend dependencies..."
npm install --prefix frontend

echo "Installing backend dependencies..."
npm install --prefix backend

echo "Building frontend..."
npm run build --prefix frontend
