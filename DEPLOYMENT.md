# Multi-Machine Deployment Guide

This guide explains how to deploy the Distributed Student Document Repository across multiple laptops, mimicking a true distributed system.

## Architecture

We will deploy the system across three machines (e.g., Laptop A, Laptop B, Laptop C) and use cloud services for MongoDB and Redis.

*   **Laptop A:** Runs Frontend and Gateway Server
*   **Laptop B:** Runs Storage Node 1
*   **Laptop C:** Runs Storage Node 2
*   **Cloud:** MongoDB Atlas and Redis Cloud

---

## 1. Cloud Dependencies Setup

To allow services on different laptops to communicate, we need central databases accessible over the internet.

### MongoDB Atlas
1.  Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  In "Network Access", add `0.0.0.0/0` (Allow access from anywhere) so all laptops can connect.
3.  In "Database Access", create a user with a password.
4.  Get your connection string (Node.js format): `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/`
    *   For the Gateway, append `student-doc-repo` to the URL.
    *   For Node 1, append `storage-node-1-db` to the URL.
    *   For Node 2, append `storage-node-2-db` to the URL.

### Redis Cloud
1.  Create a free database on [Redis Enterprise Cloud](https://redis.com/try-free/).
2.  Get the public endpoint (Host and Port) and Default user password.
3.  Format your Redis URL: `redis://default:<password>@<host>:<port>`

---

## 2. Network Discovery

All laptops **must be on the same Wi-Fi/LAN**.
Find the local IPv4 address of each laptop (e.g., `192.168.1.101`).

*   **Laptop A IP:** `_________________`
*   **Laptop B IP:** `_________________`
*   **Laptop C IP:** `_________________`

---

## 3. Configure Environments

On each laptop, clone the repository. Then, configure the `.env` files based on the `.env.example` templates.

### Laptop A (Gateway & Frontend)

**`gateway-server/.env`**
```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/student-doc-repo
REDIS_URL=redis://default:<password>@<redis-host>:<redis-port>
JWT_SECRET=your_secure_random_string
JWT_EXPIRE=7d
STORAGE_NODE_1=http://<Laptop B IP>:5001
STORAGE_NODE_2=http://<Laptop C IP>:5002
CORS_ORIGIN=http://<Laptop A IP>:3000
REPLICATION_FACTOR=2
```

**`frontend/.env`**
```env
VITE_API_URL=http://<Laptop A IP>:5000/api
VITE_SOCKET_URL=http://<Laptop A IP>:5000
```

### Laptop B (Storage Node 1)

**`storage-node-1/.env`**
```env
PORT=5001
NODE_ID=storage-node-1
NODE_ENV=production
SELF_URL=http://<Laptop B IP>:5001
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/storage-node-1-db
REDIS_URL=redis://default:<password>@<redis-host>:<redis-port>
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
PEER_NODE_URL=http://<Laptop C IP>:5002
PEER_NODE_ID=storage-node-2
GATEWAY_URL=http://<Laptop A IP>:5000
HEARTBEAT_INTERVAL=5000
```

### Laptop C (Storage Node 2)

**`storage-node-2/.env`**
```env
PORT=5002
NODE_ID=storage-node-2
NODE_ENV=production
SELF_URL=http://<Laptop C IP>:5002
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/storage-node-2-db
REDIS_URL=redis://default:<password>@<redis-host>:<redis-port>
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
PEER_NODE_URL=http://<Laptop B IP>:5001
PEER_NODE_ID=storage-node-1
GATEWAY_URL=http://<Laptop A IP>:5000
HEARTBEAT_INTERVAL=5000
```

---

## 4. Startup Sequence

1.  **Start Storage Nodes (Laptops B & C)**
    Navigate to `storage-node-1` on Laptop B and run: `npm install && npm start`
    Navigate to `storage-node-2` on Laptop C and run: `npm install && npm start`

2.  **Start Gateway (Laptop A)**
    Navigate to `gateway-server` on Laptop A and run: `npm install && npm start`
    *The gateway should print logs indicating it received heartbeats from both nodes.*

3.  **Start Frontend (Laptop A)**
    Navigate to `frontend` on Laptop A and run: `npm install && npm run dev -- --host`
    *Using `--host` binds Vite to your local IP address so it can be accessed from other devices on the network.*

## 5. Verify the System

1.  Open the frontend application in your browser: `http://<Laptop A IP>:5173` (or port 3000 if using Docker).
2.  Register and Login.
3.  Go to the **Node Monitor** to verify both `storage-node-1` and `storage-node-2` are "online".
4.  **Upload a document**.
5.  Check the logs on Laptop B and C. One node will handle the upload, and the other will log a successful replication.
6.  Go to the **Dashboard** and verify the total documents, storage used, and replication rate are updating in real-time.
