#!/bin/bash
# ASCEND Local Development Runner
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=========================================================="
echo " Starting ASCEND Autonomous Decision Engine & Dashboard"
echo "=========================================================="

cleanup() {
    echo ""
    echo "Stopping background processes..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

trap cleanup INT TERM

# 1. Start FastAPI backend
echo "[1/2] Launching FastAPI Backend on http://127.0.0.1:8000..."
cd "$DIR/backend"
PYTHONPATH=. ./venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend healthcheck..."
until curl -s http://127.0.0.1:8000/health > /dev/null; do
    sleep 0.5
done
echo "Backend is healthy."

# 2. Start Next.js frontend
echo "[2/2] Launching Next.js Dashboard on http://localhost:3000..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo " ASCEND is running!"
echo " Dashboard:  http://localhost:3000"
echo " API Docs:   http://127.0.0.1:8000/docs"
echo "=========================================================="
echo "Press Ctrl+C to stop both servers."

wait
