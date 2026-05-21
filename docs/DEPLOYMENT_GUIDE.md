# Deployment Guide: Distributed Multi-Machine Setup

This guide details how to deploy DistriDoc across multiple physical machines (Laptops/VMs) on a Local Area Network (LAN) or Cloud environment.

## 🌐 Network Topology Example

- **Machine A (192.168.1.10)**: Gateway Server + Frontend UI + Redis DB
- **Machine B (192.168.1.20)**: Storage Node 1
- **Machine C (192.168.1.30)**: Storage Node 2

---

## 🛡️ Security Prerequisites
Before deploying across a network, ensure all machines share the exact same `SERVICE_SECRET` in their `.env` files. This is required for inter-service communication to pass the Zero-Trust firewall.

---

## 💻 Machine A (Gateway & Frontend)

### 1. Environment Configuration (`.env`)
```env
PORT=5000
JWT_SECRET=your_jwt_secret
SERVICE_SECRET=distridoc-internal-secret-2026
MONGO_URI=mongodb+srv://...
REDIS_URL=redis://192.168.1.10:6379
CORS_ORIGIN=http://192.168.1.10:3000
```

### 2. Frontend Build Argument
When building the frontend on Machine A, you must tell the React app where the Gateway lives.
In `frontend/.env.production`:
```env
VITE_API_URL=http://192.168.1.10:5000/api
VITE_SOCKET_URL=http://192.168.1.10:5000
```

### 3. Launch
```bash
docker compose up -d gateway-server frontend
```

---

## 🗄️ Machine B (Storage Node 1)

### 1. Environment Configuration (`.env`)
```env
PORT=5001
NODE_ID=storage-node-1
SERVICE_SECRET=distridoc-internal-secret-2026
MONGO_URI=mongodb+srv://...
REDIS_URL=redis://192.168.1.10:6379
GATEWAY_URL=http://192.168.1.10:5000
SELF_URL=http://192.168.1.20:5001
```
*Note: `SELF_URL` is critical. This is the URL Node 1 broadcasts in its heartbeat, telling the Gateway exactly where to route traffic for it.*

### 2. Launch
```bash
docker compose up -d storage-node-1
```

---

## 🗄️ Machine C (Storage Node 2)

### 1. Environment Configuration (`.env`)
```env
PORT=5002
NODE_ID=storage-node-2
SERVICE_SECRET=distridoc-internal-secret-2026
MONGO_URI=mongodb+srv://...
REDIS_URL=redis://192.168.1.10:6379
GATEWAY_URL=http://192.168.1.10:5000
SELF_URL=http://192.168.1.30:5002
```

### 2. Launch
```bash
docker compose up -d storage-node-2
```

---

## 🔍 Verifying the Deployment
1. Open a browser on any machine and go to `http://192.168.1.10:3000`.
2. Log in as an Admin and navigate to the **Node Monitor**.
3. You should see both `storage-node-1` and `storage-node-2` pop up dynamically via Service Discovery, displaying their respective LAN IPs and actively pulsing heartbeats!
