# Concurrency Handling in Distributed Systems

Handling concurrent uploads is critical in a Distributed Document Repository. If 1,000 students attempt to upload a document at the exact same millisecond, the Gateway could exhaust its RAM (OOM - Out of Memory) or open too many network sockets.

Here is how concurrency was handled in our architecture:

## 1. Concurrency Queue Limits (Throttling)
I implemented an `UploadQueue` service inside the Gateway Server.
- When an upload request arrives, the Gateway accepts it, but **throttles** the network forward to the storage node.
- The `UploadQueue` is configured with a `concurrencyLimit = 5`. This means the Gateway will only process 5 file forwards simultaneously. 
- The 6th upload is held asynchronously in a FIFO (First-In, First-Out) queue and will only execute once one of the first 5 finishes. This protects the Gateway from crashing under sudden traffic spikes.

## 2. Preventing Duplicate Writes (Locks)
In distributed systems, users or faulty frontend logic might accidentally send the same request twice in a fraction of a second (Double-Clicking a submit button). 
- To prevent this, the `UploadQueue` implements an in-memory **Distributed Lock Map**.
- When an upload begins, it registers a lock key: `userId:filename`. 
- If a second request comes in with the exact same `userId:filename` while the first is still processing, the Queue throws an immediate `Duplicate write detected` error. Once the file finishes successfully, the lock is released.

## 3. Upload Progress Tracking (Frontend to Gateway)
While the Gateway handles backend throttling, the **Frontend** must provide UX feedback.
- I configured the `Axios` instance in `frontend/src/services/api.js` to utilize the `onUploadProgress` event listener.
- As the browser breaks the physical file into chunks and streams them over the TCP connection to the Gateway, Axios calculates `(loaded / total) * 100`.
- We can pass a callback function to update a state variable, which will power a visual progress bar component in the React UI, proving to the user that their concurrent upload is processing smoothly.
