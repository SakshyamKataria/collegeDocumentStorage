const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { getPublisher } = require('../config/redis');

const PEER_NODE_URL = process.env.PEER_NODE_URL; 
const NODE_ID = process.env.NODE_ID;

class Replicator {
  async replicateFile(localMetadata, gatewayDocumentId) {
    if (!PEER_NODE_URL) {
      console.log('No peer node configured. Skipping replication.');
      return;
    }

    if (!gatewayDocumentId) {
      console.log('No gatewayDocumentId provided. Skipping replication callback.');
      return;
    }

    try {
      console.log(`[Replication] Starting replication for ${localMetadata.originalName} to ${PEER_NODE_URL}`);

      // 1. Prepare form data
      const formData = new FormData();
      const fileStream = fs.createReadStream(localMetadata.path);
      
      // We pass the existing fileId so the replica uses the exact same fileId
      formData.append('file', fileStream, localMetadata.originalName);
      formData.append('isReplica', 'true');
      formData.append('fileId', localMetadata.fileId); 

      // 2. Send to peer node
      await axios.post(`${PEER_NODE_URL}/api/files/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      console.log(`[Replication] Success for ${localMetadata.fileId}`);

      // 3. Notify Gateway via Redis Pub/Sub
      const publisher = getPublisher();
      if (publisher) {
        publisher.publish('replication:events', JSON.stringify({
          documentId: gatewayDocumentId,
          status: 'completed',
          replicaNode: PEER_NODE_URL.includes('5001') ? 'storage-node-1' : 'storage-node-2'
        }));
      }

    } catch (error) {
      console.error(`[Replication] Failed for ${localMetadata.fileId}:`, error.message);
      
      // Notify Gateway of failure via Redis
      const publisher = getPublisher();
      if (publisher) {
        publisher.publish('replication:events', JSON.stringify({
          documentId: gatewayDocumentId,
          status: 'failed'
        }));
      }
    }
  }
}

module.exports = new Replicator();
