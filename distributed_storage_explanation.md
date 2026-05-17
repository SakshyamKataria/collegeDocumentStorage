# Distributed Storage & Fault Tolerance

The architecture of the **Distributed Student Document Repository** explicitly implements multiple microservices and data nodes to demonstrate key concepts in Distributed Systems.

## 1. Distributed Storage

Instead of storing all files on a single monolithic server, this system utilizes multiple **Storage Nodes** (`storage-node-1` on port 5001, and `storage-node-2` on port 5002). 

### How it works:
- **Independent File Systems:** Each node has its own isolated `./uploads` directory. Files saved to Node 1 are physically separated from files saved to Node 2.
- **Horizontal Scalability:** If the system runs out of storage space, we can simply spin up a `storage-node-3` without modifying the core gateway logic.
- **Data Partitioning (Sharding):** The Gateway Server acts as a Load Balancer. It distributes incoming upload requests across the available nodes (e.g., Round-Robin), ensuring no single node bears the full weight of the data storage.

## 2. Replication (Data Redundancy)

Replication is the process of copying data across multiple nodes. In this architecture, when a document is uploaded to `storage-node-1`, it can be replicated (copied) to `storage-node-2`.

### Why is this important?
- **Data Availability:** If one node goes offline, the data is still accessible from the peer node.
- **Read Scalability:** The Gateway can serve download requests from whichever node is closest or has the least current load, knowing the data exists in both places.

## 3. Fault Tolerance

Fault tolerance is a system's ability to continue operating properly in the event of the failure of some of its components.

### Implementation Mechanisms:
1. **Heartbeat Monitoring:** Each storage node exposes a `/api/health` endpoint. The Gateway Server (and Redis Pub/Sub) constantly polls these endpoints to ensure the nodes are alive.
2. **Failover Routing:** If `storage-node-1` stops responding to heartbeats, the Gateway automatically marks it as "Offline" and routes all new file uploads and download requests exclusively to `storage-node-2`.
3. **Database Decoupling:** We use a centralized MongoDB instance for `FileMetadata`. Even if a storage node crashes, the system still knows *what* files exist and *where* the replicas are located, preventing total state loss.

By utilizing these distributed patterns, the Document Repository transforms from a simple web application into a resilient, highly-available distributed system.
