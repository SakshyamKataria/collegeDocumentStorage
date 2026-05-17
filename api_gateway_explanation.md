# The Role of the API Gateway in Distributed Systems

In our **Distributed Student Document Repository**, the API Gateway (`gateway-server`) acts as the single entry point for all frontend requests. Instead of the frontend trying to figure out which storage node to upload to, it simply talks to the Gateway.

## Key Responsibilities Demonstrated:

### 1. Unified Authentication
The Gateway intercepts incoming requests and verifies the JSON Web Token (JWT) before the request ever reaches a storage node. This ensures storage nodes do not need to individually implement or verify user credentials. They only trust requests coming from the Gateway.

### 2. Global State Aggregation
While physical files are scattered across `storage-node-1` and `storage-node-2`, the frontend needs a single unified list of "All Documents". The Gateway maintains a central MongoDB collection (`DocumentSchema`) that aggregates the metadata of *all* files across *all* nodes.

### 3. Load Balancing (Round-Robin)
When a user uploads a document, the Gateway buffers the file in memory. The `NodeManager` then uses a **Round-Robin** algorithm to pick the next available storage node (`node-1`, then `node-2`, then `node-1`...). The Gateway forwards the file stream over the network to the chosen node.

### 4. Heartbeat Monitoring
The Gateway runs a background interval (`nodeManager.startMonitoring()`) that pings the `/api/health` endpoint of every registered storage node every 10 seconds. 
- If a node stops responding, the Gateway flags it as `offline`.
- The Load Balancer automatically skips offline nodes, preventing failed uploads.
- If a user tries to download a file whose primary node is offline, the Gateway knows immediately and can either fail gracefully or route to a replica node.

### 5. Seamless File Streaming
When a client requests a file download, the Gateway locates the node holding the file, requests the file from that node via Axios, and **pipes (streams)** the response directly back to the client. The client never knows that `storage-node-2` actually provided the file; they only know they received it from the Gateway.
