const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { EventBus } = require('../config/redis');
const { CHANNELS } = require('../config/events');
const ReplicationTask = require('../models/ReplicationTask');

class Replicator {
  async replicateFile(localMetadata, gatewayDocumentId, replicaNodeUrl, replicaNodeId) {
    if (!replicaNodeUrl || !replicaNodeId) {
      console.log('No peer node provided dynamically. Skipping replication.');
      return;
    }

    try {
      // 1. Enqueue Task in MongoDB
      await ReplicationTask.create({
        fileId: localMetadata.fileId,
        originalName: localMetadata.originalName,
        path: localMetadata.path,
        gatewayDocumentId: gatewayDocumentId,
        targetUrl: replicaNodeUrl,
        replicaNodeId: replicaNodeId,
        status: 'pending'
      });
      console.log(`[Replication] Enqueued task for ${localMetadata.fileId} to ${replicaNodeUrl}`);
    } catch (error) {
      console.error(`[Replication] Failed to enqueue task:`, error.message);
    }
  }

  // Background worker to process the queue
  async processQueue() {
    try {
      const tasks = await ReplicationTask.find({
        status: { $in: ['pending', 'retrying'] },
        retryCount: { $lt: 5 } // maxRetries
      }).limit(5);

      if (tasks.length === 0) return;

      for (let task of tasks) {
        console.log(`[Replication Queue] Processing ${task.fileId} to ${task.targetUrl} (Attempt ${task.retryCount + 1})`);
        
        if (!fs.existsSync(task.path)) {
           // File lost locally? Fail task permanently.
           task.status = 'failed';
           await task.save();
           continue;
        }

        try {
          const formData = new FormData();
          const fileStream = fs.createReadStream(task.path);
          formData.append('file', fileStream, task.originalName);
          formData.append('isReplica', 'true');
          formData.append('fileId', task.fileId); 

          await axios.post(`${task.targetUrl}/api/files/upload`, formData, {
            headers: { ...formData.getHeaders() },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          });

          // Success!
          task.status = 'completed';
          await task.save();

          console.log(`[Replication Queue] Success for ${task.fileId}`);

          // Notify Gateway
          EventBus.publish(CHANNELS.REPLICATION_EVENTS, {
            documentId: task.gatewayDocumentId,
            status: 'completed',
            replicaNode: task.replicaNodeId
          });

        } catch (error) {
          console.error(`[Replication Queue] Error for ${task.fileId}:`, error.message);
          task.retryCount += 1;
          
          if (task.retryCount >= task.maxRetries) {
            task.status = 'failed';
            // Notify Gateway of permanent failure
            EventBus.publish(CHANNELS.REPLICATION_EVENTS, {
              documentId: task.gatewayDocumentId,
              status: 'failed'
            });
            console.log(`[Replication Queue] Permanent failure for ${task.fileId}`);
          } else {
            task.status = 'retrying';
          }
          await task.save();
        }
      }
    } catch (error) {
      console.error(`[Replication Worker] Fatal error:`, error.message);
    }
  }
}

module.exports = new Replicator();
