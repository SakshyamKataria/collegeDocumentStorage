@echo off
echo Starting Gateway and Frontend...
echo Make sure you have created .env.gateway and .env with your LAN IP
docker compose -f docker-compose.gateway.yml up -d --build
pause
