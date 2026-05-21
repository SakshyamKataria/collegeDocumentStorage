@echo off
echo Starting Storage Node 2...
echo Make sure you have created .env.node2 with your LAN IP
docker compose -f docker-compose.node2.yml up -d --build
pause
