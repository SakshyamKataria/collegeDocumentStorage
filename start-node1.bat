@echo off
echo Starting Storage Node 1...
echo Make sure you have created .env.node1 with your LAN IP
docker compose -f docker-compose.node1.yml up -d --build
pause
