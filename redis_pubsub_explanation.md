# The Role of Redis Pub/Sub in Distributed Systems

In monolithic applications, different parts of the system communicate by simply calling functions directly in memory. However, in a **Distributed System** like our Document Repository (composed of a Gateway Server and multiple Storage Nodes), the microservices run in entirely separate processes or even on different physical machines. 

While they can communicate via direct HTTP requests (like our `Axios` calls), relying solely on HTTP creates tight coupling and bottlenecks. This is where **Redis Pub/Sub** (Publish/Subscribe) provides massive advantages.

## 1. Node Heartbeat Broadcasting (Event-Driven Health Checks)
**The Old Way (HTTP Polling):** 
The Gateway uses a `setInterval` to send an HTTP GET request to `/api/health` on every single storage node to see if it's alive. If we scale to 100 nodes, the Gateway has to make 100 network requests every few seconds, hogging bandwidth and CPU.

**The New Way (Redis Pub/Sub):**
The Gateway simply subscribes to a single Redis channel called `node:heartbeat`. Every active Storage Node acts as a **Publisher**, broadcasting a tiny JSON message to `node:heartbeat` every 5 seconds. The Gateway passively receives these messages and updates its internal router. This is significantly more scalable and decoupled.

## 2. Asynchronous Replication Events
When `storage-node-1` finishes replicating a file to `storage-node-2`, the Gateway needs to know so it can update the central MongoDB `Document` status to `completed`.

**The Old Way (HTTP Webhooks):**
`storage-node-1` makes an HTTP PUT request to `GatewayURL/api/documents/...`. If the Gateway is temporarily busy or restarting, the request fails and the status is lost forever.

**The New Way (Redis Pub/Sub):**
`storage-node-1` publishes an event to the `replication:events` channel. The Gateway, acting as a **Subscriber**, listens to this channel and updates MongoDB. This completely decouples the Storage Nodes from needing to know the Gateway's URL or API structure for callbacks. 

## Summary
Redis Pub/Sub enables our microservices to communicate asynchronously in real-time through an **Event Bus**. It shifts our architecture from being "Request/Response" heavy to being **Event-Driven**, which is a foundational requirement for building fault-tolerant, massively scalable distributed systems.
