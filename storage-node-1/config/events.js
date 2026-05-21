// Event Channel Constants for Redis Pub/Sub
module.exports = {
  CHANNELS: {
    NODE_HEARTBEAT: 'node:heartbeat',
    REPLICATION_EVENTS: 'replication:events',
    DOCUMENT_UPLOADED: 'document:uploaded',
    DOCUMENT_DELETED: 'document:deleted',
    NODE_FAILURE: 'node:failure',
    NODE_DEREGISTER: 'node:deregister'
  }
};

