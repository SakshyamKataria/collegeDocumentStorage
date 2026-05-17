const axios = require('axios');
const { getSubscriber } = require('../config/redis');

class NodeManager {
  constructor() {
    this.nodes = [
      { id: 'storage-node-1', url: process.env.STORAGE_NODE_1 || 'http://localhost:5001', status: 'unknown', lastSeen: 0 },
      { id: 'storage-node-2', url: process.env.STORAGE_NODE_2 || 'http://localhost:5002', status: 'unknown', lastSeen: 0 }
    ];
    this.currentIndex = 0;
    this.checkInterval = 10000;
  }

  // Start heartbeat monitoring via Redis
  startMonitoring(io) {
    this.io = io;
    console.log('💓 Starting Storage Node Heartbeat Monitor (Redis & Socket.IO)...');
    
    const subscriber = getSubscriber();
    if (subscriber) {
      subscriber.subscribe('node:heartbeat', (message) => {
        try {
          const data = JSON.parse(message);
          const node = this.getNodeById(data.nodeId);
          if (node) {
            node.lastSeen = Date.now();
            node.totalSize = data.totalSize; // Track storage usage
            
            if (node.status !== 'online') {
              console.log(`✅ Node [${node.id}] is ONLINE (Redis Heartbeat)`);
              node.status = 'online';
            }
            
            // Emit to frontend dashboard
            if (this.io) {
              this.io.emit('node:update', this.nodes);
            }
          }
        } catch (e) {
          console.error('Heartbeat parse error', e);
        }
      });
    }

    // Still need an interval to check if nodes timed out
    setInterval(() => this.checkStaleNodes(), this.checkInterval);
  }

  // Check if nodes haven't sent a heartbeat recently
  checkStaleNodes() {
    const now = Date.now();
    let stateChanged = false;

    for (let node of this.nodes) {
      // If we haven't seen a heartbeat in 15 seconds, mark offline
      if (node.status === 'online' && now - node.lastSeen > 15000) {
        console.log(`❌ Node [${node.id}] is OFFLINE (Missed Heartbeat)`);
        node.status = 'offline';
        stateChanged = true;
      }
    }

    if (stateChanged && this.io) {
      this.io.emit('node:update', this.nodes);
    }
  }



  // Get active nodes
  getActiveNodes() {
    return this.nodes.filter(n => n.status === 'online');
  }

  // Round-robin load balancer to pick next node
  getNextAvailableNode() {
    const activeNodes = this.getActiveNodes();
    if (activeNodes.length === 0) {
      throw new Error('No storage nodes are currently available');
    }

    const node = activeNodes[this.currentIndex % activeNodes.length];
    this.currentIndex++;
    return node;
  }

  // Find a specific node by ID
  getNodeById(id) {
    return this.nodes.find(n => n.id === id);
  }
}

// Export a singleton instance
module.exports = new NodeManager();
