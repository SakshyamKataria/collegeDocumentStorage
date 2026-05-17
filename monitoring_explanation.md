# Live Monitoring in Distributed Systems

Monitoring a distributed system involves tracking the health, resource usage, and state of multiple independent microservices in real-time. Without effective monitoring, failures cascade silently, leading to catastrophic system outages.

Here is how live monitoring is implemented in our Document Repository architecture:

## 1. The Challenge of Polling
Previously, the frontend dashboard used HTTP Polling (`setInterval` making a `GET /api/nodes` request every 5 seconds). 
While easy to implement, polling is highly inefficient:
- If 100 admins have the dashboard open, the Gateway is bombarded with 100 requests every 5 seconds.
- 99% of those requests might return the exact same unchanged data, wasting bandwidth and CPU.

## 2. Event-Driven Real-Time Monitoring (WebSockets)
To solve this, we implemented **Socket.IO** (which wraps WebSockets).
- When an admin opens the dashboard, a persistent, bi-directional TCP connection is established between the React app and the Gateway Server.
- Instead of the client asking "Has anything changed?" every 5 seconds, the server actively pushes an event (`node:update`) down the socket **only when data actually changes**.

## 3. The Full Monitoring Pipeline
The pipeline now operates entirely on events, from the physical storage node all the way to the pixels on the admin's screen:

1. **Storage Node** calculates its storage usage and publishes a JSON payload to Redis (`node:heartbeat`).
2. **Gateway Server** (`NodeManager`) is subscribed to Redis. It receives the payload instantly and updates its internal router state in memory.
3. **Gateway Server** uses Socket.IO to emit a `node:update` event containing the new state.
4. **React Frontend** receives the socket event and triggers a state update.
5. **Framer Motion** smoothly animates the dashboard UI, updating the "Storage Consumed" or flashing an "Offline" badge if a node crashed.

This architecture scales beautifully. The Gateway only does work when events occur, and the frontend displays instantaneous state changes without wasting network resources.
