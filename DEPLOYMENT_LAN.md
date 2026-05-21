# Multi-Laptop LAN Deployment Guide

This guide explains how to deploy the Distributed Student Document Repository across three physical laptops connected to the same Wi-Fi or LAN.

## Target Architecture
* **Laptop A**: Gateway Server & Frontend UI (Port `5000` & `3000`)
* **Laptop B**: Storage Node 1 (Port `5001`)
* **Laptop C**: Storage Node 2 (Port `5002`)

## Step 0: Find Your LAN IP Addresses
On each laptop, you need to find the IPv4 address assigned by your router.
* **Windows**: Open Command Prompt, type `ipconfig`, look for `IPv4 Address` under your Wi-Fi/Ethernet adapter (e.g., `192.168.1.5`).
* **Mac/Linux**: Open Terminal, type `ifconfig` or `ip a`, look for `inet` under your active adapter.

Write down the IP addresses for Laptop A, B, and C.

---

## Step 1: Deploy Laptop A (Gateway & Frontend)

1. Clone or copy the project code onto Laptop A.
2. Rename the template `.env.gateway.example` to `.env.gateway`.
3. In the root directory, create a new file simply named `.env`.
4. Open the `.env` file and define the API connection strings using Laptop A's IP:
   ```env
   VITE_API_URL=http://<LAPTOP_A_IP>:5000/api
   VITE_SOCKET_URL=http://<LAPTOP_A_IP>:5000
   ```
5. Double-click the `start-gateway.bat` script (or run `docker compose -f docker-compose.gateway.yml up -d --build`).

*You can now access the frontend from any device on your network by navigating to `http://<LAPTOP_A_IP>:3000`.*

---

## Step 2: Deploy Laptop B (Storage Node 1)

1. Clone or copy the project code onto Laptop B.
2. Rename `.env.node1.example` to `.env.node1`.
3. Open `.env.node1` and replace `<LAPTOP_B_IP>` with Laptop B's actual IP address:
   ```env
   SELF_URL=http://<LAPTOP_B_IP>:5001
   ```
4. Double-click the `start-node1.bat` script.

---

## Step 3: Deploy Laptop C (Storage Node 2)

1. Clone or copy the project code onto Laptop C.
2. Rename `.env.node2.example` to `.env.node2`.
3. Open `.env.node2` and replace `<LAPTOP_C_IP>` with Laptop C's actual IP address:
   ```env
   SELF_URL=http://<LAPTOP_C_IP>:5002
   ```
4. Double-click the `start-node2.bat` script.

---

## Verification & Node Registration Flow

Because the architecture uses **Cloud Redis** as a centralized EventBus:
1. When `start-node1.bat` finishes on Laptop B, Storage Node 1 connects to Redis and begins emitting a heartbeat containing its `SELF_URL`.
2. The Gateway (running on Laptop A) receives this heartbeat over the internet.
3. The Gateway instantly registers Node 1 in its routing table using Laptop B's LAN IP.
4. When a user uploads a file via the Frontend, the Gateway forwards the file stream over the LAN directly to `http://<LAPTOP_B_IP>:5001/api/files/upload`.

---

## Troubleshooting Network Issues

**1. "Connection Refused" or "Timeout" between nodes:**
The most common issue in a LAN deployment is the host machine's firewall blocking incoming traffic.
* **Windows**: Go to "Windows Defender Firewall" -> "Advanced Settings" -> "Inbound Rules". Create a new rule allowing TCP ports `3000`, `5000`, `5001`, and `5002`.
* Ensure your network profile in Windows is set to **Private**, not Public.

**2. Frontend cannot reach Gateway:**
Double check the `.env` file on Laptop A. If `VITE_API_URL` is still pointing to `localhost`, external devices (like your phone or Laptop B) will try to find the API on themselves instead of Laptop A. Rebuild the gateway compose file if you changed the `.env` file.
