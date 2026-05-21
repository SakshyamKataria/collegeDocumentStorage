# Real Multi-Laptop Distributed Deployment Guide

This guide explains exactly how to deploy your **Distributed Student Document Repository** across 3 separate laptops on the same Wi-Fi network. 

No code changes are required to the application itself—the system is already designed with dynamic Service Discovery. You just need to change a few configuration IPs and start the specific containers on each laptop.

---

## 🛠 Prerequisites

1. **3 Laptops** connected to the **same Wi-Fi network**.
2. **Docker Desktop** installed on all 3 laptops.
3. **The Source Code** copied to all 3 laptops (via a USB drive or by cloning your GitHub repo).

---

## 📍 Step 1: Find the LAN IPs
You need to find the local IP address of each laptop on your Wi-Fi network.

**On Windows:**
1. Open Command Prompt (`cmd`).
2. Run `ipconfig`.
3. Look for `IPv4 Address` under your Wi-Fi adapter (it usually looks like `192.168.x.x` or `10.x.x.x`).

**Assume the following for this guide:**
- **Laptop A (Gateway & UI)**: `192.168.1.10`
- **Laptop B (Storage Node 1)**: `192.168.1.20`
- **Laptop C (Storage Node 2)**: `192.168.1.30`

---

## 💻 Step 2: Deploy Laptop A (Gateway & Frontend)

This laptop acts as the brain of your distributed system.

1. Open `docker-compose.local.yml` on **Laptop A** in your code editor.
2. Scroll down to the `frontend` section.
3. **Replace** the `args` section to use Laptop A's IP address instead of `localhost`. This tells the React UI where to find the Gateway backend.

**Before:**
```yaml
      args:
        - VITE_API_URL=http://localhost:5000/api
        - VITE_SOCKET_URL=http://localhost:5000
```
**After (replace with Laptop A's real IP):**
```yaml
      args:
        - VITE_API_URL=http://192.168.1.10:5000/api
        - VITE_SOCKET_URL=http://192.168.1.10:5000
```
4. Open your terminal on Laptop A and run:
```bash
docker compose -f docker-compose.local.yml up -d --build gateway-server frontend
```
*(This command specifically tells Docker to ONLY start the Gateway and Frontend containers, ignoring the storage nodes).*

---

## 🗄️ Step 3: Deploy Laptop B (Storage Node 1)

This laptop acts as the first physical file storage server.

1. Open `docker-compose.local.yml` on **Laptop B** in your code editor.
2. Scroll to the `storage-node-1` section.
3. **Replace** the `GATEWAY_URL` and `SELF_URL` under `environment`.
   - `GATEWAY_URL`: Must point to Laptop A.
   - `SELF_URL`: Must point to this laptop (Laptop B).
   - `PEER_NODE_URL`: Must point to the other storage node (Laptop C).

**Before:**
```yaml
      - GATEWAY_URL=http://gateway-server:5000
      - PEER_NODE_URL=http://storage-node-2:5002
      - SELF_URL=http://storage-node-1:5001
```
**After (replace with real IPs):**
```yaml
      - GATEWAY_URL=http://192.168.1.10:5000
      - PEER_NODE_URL=http://192.168.1.30:5002
      - SELF_URL=http://192.168.1.20:5001
```

*(Note: The `SELF_URL` is the most critical piece. Node 1 will broadcast this IP over the Redis EventBus, and the Gateway will dynamically register it and start routing traffic to `192.168.1.20`!)*

4. Open your terminal on Laptop B and run:
```bash
docker compose -f docker-compose.local.yml up -d storage-node-1
```

---

## 🗄️ Step 4: Deploy Laptop C (Storage Node 2)

This laptop acts as the replica storage server.

1. Open `docker-compose.local.yml` on **Laptop C** in your code editor.
2. Scroll to the `storage-node-2` section.
3. **Replace** the environment variables just like you did for Laptop B, but swapped.

**Before:**
```yaml
      - GATEWAY_URL=http://gateway-server:5000
      - PEER_NODE_URL=http://storage-node-1:5001
      - SELF_URL=http://storage-node-2:5002
```
**After (replace with real IPs):**
```yaml
      - GATEWAY_URL=http://192.168.1.10:5000
      - PEER_NODE_URL=http://192.168.1.20:5001
      - SELF_URL=http://192.168.1.30:5002
```

4. Open your terminal on Laptop C and run:
```bash
docker compose -f docker-compose.local.yml up -d storage-node-2
```

---

## 🚀 Step 5: Test the Distributed Cluster!

1. Open a browser on **any** laptop (or even your phone, if it's on the same Wi-Fi).
2. Go to `http://192.168.1.10:3000` (Laptop A's IP on port 3000).
3. Log in and open the **Node Monitor**.
4. You will instantly see `storage-node-1` and `storage-node-2` pop up on the dashboard. Look closely at their URLs—they will show the **actual LAN IP addresses** of Laptops B and C!
5. Upload a file. The Gateway (Laptop A) will transmit the file over the Wi-Fi to Laptop B. Laptop B will then perform background replication, transmitting a copy of the file over the Wi-Fi to Laptop C.

Your real distributed system is now live!
