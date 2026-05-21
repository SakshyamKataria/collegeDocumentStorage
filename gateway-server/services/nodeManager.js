const axios = require('axios');
const { EventBus } = require('../config/redis');
const { CHANNELS } = require('../config/events');
const logger = require('../utils/logger');

class NodeManager {
  constructor() {
    this.nodes = []; // Dynamic registry
    this.alerts = []; // Ring buffer for system alerts
    this.currentIndex = 0;
    this.checkInterval = 10000;
  }

  addAlert(type, message, nodeId = 'SYSTEM') {
    const alert = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type, // 'FAULT' | 'RECOVERY' | 'INFO' | 'SECURITY' | 'AUDIT'
      message,
      nodeId,
      timestamp: Date.now()
    };
    this.alerts.unshift(alert);
    if (this.alerts.length > 50) this.alerts.pop();
    
    if (this.io) {
      this.io.emit('system:alert', alert);
    }
  }

  // Start heartbeat monitoring via Redis EventBus
  startMonitoring(io) {
    this.io = io;
    logger.system('Starting Storage Node Heartbeat Monitor (EventBus & Socket.IO)...');
    
    // Subscribe to heartbeats
    EventBus.subscribe(CHANNELS.NODE_HEARTBEAT, (data) => {
      let node = this.getNodeById(data.nodeId);
      if (!node) {
        // Node Registration
        node = { id: data.nodeId, url: data.url, status: 'unknown', lastSeen: 0, totalSize: 0, latencyMs: 0 };
        this.nodes.push(node);
        logger.network(`Node [${node.id}] REGISTERED dynamically at ${node.url}`);
      }
      
      node.lastSeen = Date.now();
      node.totalSize = data.totalSize; // Track storage usage
      
      if (data.sentAt) {
        node.latencyMs = Date.now() - data.sentAt;
      }
      
      // Dynamically update node URL from heartbeat (supports multi-machine deployment)
      if (data.url) {
        node.url = data.url;
      }

      if (node.status !== 'online') {
        logger.network(`Node [${node.id}] is ONLINE at ${node.url} (Redis Heartbeat)`);
        if (node.status === 'offline') {
           this.addAlert('RECOVERY', `Node ${node.id} recovered and resumed heartbeats.`, node.id);
        } else if (node.status === 'unknown') {
           this.addAlert('INFO', `Node ${node.id} successfully registered.`, node.id);
        }
        node.status = 'online';
      }
      
      // Emit to frontend dashboard
      if (this.io) {
        this.io.emit('node:update', this.nodes);
      }
    });

    // Subscribe to Graceful Deregistration
    EventBus.subscribe(CHANNELS.NODE_DEREGISTER, (data) => {
      logger.warn(`Node [${data.nodeId}] DEREGISTERING (Graceful Shutdown)`);
      this.addAlert('FAULT', `Node ${data.nodeId} gracefully shut down and is now offline.`, data.nodeId);
      
      const node = this.getNodeById(data.nodeId);
      if (node) {
        node.status = 'offline';
        node.lastSeen = Date.now(); // Reset timer so it stays on dashboard for 60s before disappearing
      }
      
      if (this.io) {
        this.io.emit('node:update', this.nodes);
      }
    });

    // Still need an interval to check if nodes timed out
    setInterval(() => this.checkStaleNodes(), this.checkInterval);
  }

  // Check if nodes haven't sent a heartbeat recently
  checkStaleNodes() {
    const now = Date.now();
    let stateChanged = false;

    // Filter out nodes that have missed heartbeats for > 120 seconds (Deregistration Cleanup)
    const activeNodes = [];
    for (let node of this.nodes) {
      if (now - node.lastSeen > 120000) {
        logger.error(`Node [${node.id}] DEREGISTERED (Timeout > 120s)`);
        this.addAlert('FAULT', `Node ${node.id} permanently deregistered due to 120s timeout.`, node.id);
        stateChanged = true;
        continue; // Drop from activeNodes
      }

      // If we haven't seen a heartbeat in 30 seconds, mark offline
      if (node.status === 'online' && now - node.lastSeen > 30000) {
        logger.warn(`Node [${node.id}] is OFFLINE (Missed Heartbeat > 30s)`);
        this.addAlert('FAULT', `Node ${node.id} went offline. No heartbeat for 30s. Traffic isolated.`, node.id);
        node.status = 'offline';
        stateChanged = true;
      }
      
      activeNodes.push(node);
    }
    
    if (this.nodes.length !== activeNodes.length) {
      this.nodes = activeNodes;
      stateChanged = true;
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
