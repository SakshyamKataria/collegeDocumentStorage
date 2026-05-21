# API Reference

## Gateway APIs

The Gateway acts as the central coordinator and authentication layer for the entire cluster. All client traffic must flow through the Gateway.

### Authentication
- `POST /api/auth/register` - Register a new user.
- `POST /api/auth/login` - Authenticate and receive a JWT.
- `GET /api/auth/me` - Get current user profile.

*(Note: Auth endpoints are strictly rate-limited to 15 requests / 15 min to prevent brute force attacks).*

### Documents
- `GET /api/documents` - List all accessible documents (respects RBAC).
- `POST /api/documents/upload` - Upload a document. The Gateway load-balances this request to an active Storage Node.
- `GET /api/documents/:id/download` - Download a document. If the primary node is offline, the Gateway automatically reroutes the stream from a replica.
- `DELETE /api/documents/:id` - Delete a document. Emits a distributed delete event over Redis to purge replicas globally.
- `PUT /api/documents/:id` - Rename or change visibility of a document.

### Distributed Nodes & Telemetry
- `GET /api/nodes` - Fetches the live array of registered storage nodes, including latency telemetry and storage metrics.
- `GET /api/analytics` - Fetches aggregated multi-node network traffic telemetry (Upload/Download bytes over the last 7 days).

### Admin Management
- `GET /api/users` - List all registered users.
- `PUT /api/users/:id/role` - Promote or demote a user (Triggers distributed Audit Log).
- `DELETE /api/users/:id` - Permanently delete a user (Triggers distributed Audit Log).

---

## Storage Node APIs

Storage Node APIs are completely locked down. They reside inside the private LAN cluster and reject any traffic that does not contain the cryptographic `SERVICE_SECRET`.

### File Operations
- `POST /api/files/upload` - Physically stream the file chunk to the local filesystem and store metadata in the node's shard DB.
- `GET /api/files/:fileId` - Stream the physical file chunk back to the Gateway.
- `DELETE /api/files/:fileId` - Physically delete the file chunk from disk.
