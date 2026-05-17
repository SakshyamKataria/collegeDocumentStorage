class UploadQueue {
  constructor(concurrencyLimit = 5) {
    this.concurrencyLimit = concurrencyLimit;
    this.activeCount = 0;
    this.queue = [];
    
    // Lock map to prevent duplicate writes (Format: userId:filename)
    this.activeUploads = new Set();
  }

  // Enqueue an upload task
  async enqueue(userId, filename, task) {
    const lockKey = `${userId}:${filename}`;
    
    // 1. Prevent duplicate writes
    if (this.activeUploads.has(lockKey)) {
      throw new Error(`Duplicate write detected: You are already uploading ${filename}`);
    }

    // Acquire lock
    this.activeUploads.add(lockKey);

    return new Promise((resolve, reject) => {
      // Wrapper to handle the task execution and queue progression
      const wrappedTask = async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          // Release lock
          this.activeUploads.delete(lockKey);
          
          // Process next in queue
          this.activeCount--;
          this.processNext();
        }
      };

      this.queue.push(wrappedTask);
      this.processNext();
    });
  }

  // Process the next task in the queue if under limits
  processNext() {
    if (this.activeCount < this.concurrencyLimit && this.queue.length > 0) {
      const task = this.queue.shift();
      this.activeCount++;
      task(); // Execute
    }
  }
}

module.exports = new UploadQueue();
