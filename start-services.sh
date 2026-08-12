#!/usr/bin/env bash

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MSG_DIR="${ROOT_DIR}/msgservice"
EVO_DIR="${ROOT_DIR}/msgservice/evolution-api"

echo "=================================================="
echo " Starting Integrated Ecosystem Services"
echo "=================================================="

cleanup() {
    echo -e "\nStopping all services..."
    kill $(jobs -p) 2>/dev/null
    exit
}
trap cleanup SIGINT SIGTERM EXIT

echo "1. Starting Evolution API (WhatsApp Gateway) on port 8080..."
(cd "$EVO_DIR" && npm start) &

sleep 3

echo "2. Starting msgservice on port 3000..."
(cd "$MSG_DIR" && npm run dev) &

sleep 2

echo "3. Starting CommunityCircle on port 3001..."
(cd "$ROOT_DIR" && npm run dev -- -p 3001) &

echo "=================================================="
echo " All services are running concurrently!"
echo " • Evolution API:       http://localhost:8080"
echo " • msgservice API:       http://localhost:3000"
echo " • CommunityCircle App:  http://localhost:3001"
echo " Press Ctrl+C to stop all services."
echo "=================================================="

wait
