# Fault Tolerance in Distributed Systems

Fault Tolerance ensures that the Document Repository remains highly available and functional even when individual components crash, disconnect, or experience hardware failure.

Here is how we implemented Fault Tolerance in this architecture:

## 1. Node Failure Detection (Heartbeats)
A storage node can crash at any time. The Gateway's `NodeManager` uses **Redis Pub/Sub** to constantly listen for `node:heartbeat` events. 
- If the NodeManager does not receive a heartbeat from `storage-node-1` for 15 seconds, it proactively flags it as `offline`.
- **Load Balancing Protection:** Once flagged as `offline`, the Gateway will stop routing new file uploads to that node, ensuring users don't experience failed uploads.

## 2. Dynamic Recovery (Self-Healing)
If `storage-node-1` is restarted or its network connection is restored, it will automatically begin broadcasting heartbeats to Redis again.
- The `NodeManager` instantly detects this new heartbeat and flips the node's status back to `online`. 
- No human intervention or Gateway restart is required. The system "self-heals".

## 3. Automated Failover (Replica Fallback)
If a user tries to download a document that was originally uploaded to `storage-node-1` (the Primary Node), but `storage-node-1` is currently `offline`, the system does not throw a 500 Error.
Instead, the **Failover Logic** activates:
1. The Gateway checks the `Document` metadata in MongoDB to see if the file successfully replicated.
2. It loops through the `replicaNodes` array.
3. It checks if any node in that array (e.g., `storage-node-2`) is currently `online`.
4. The Gateway silently swaps the target and streams the file from `storage-node-2` instead.

The end-user is completely unaware that the primary server crashed; their download still succeeds perfectly.

## 4. Status Dashboard API
To monitor this, we exposed the `GET /api/nodes` endpoint. It returns the live in-memory state of the cluster (who is online, who is offline, and when they were last seen). This allows administrators to visually monitor the health of the distributed system in real-time.
