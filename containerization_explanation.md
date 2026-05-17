# Containerization in Distributed Systems

In this phase, we implemented Docker containerization across the entire Distributed Document Repository using `Dockerfiles` and `docker-compose.yml`.

In traditional deployments, running a distributed system is incredibly painful. You would have to manually install MongoDB, install Redis, run `npm install` on the Gateway, and run `npm install` on each individual storage node, praying that all port numbers, environment variables, and node versions match correctly across different operating systems.

Here is how **Containerization** solves these problems:

## 1. Network Isolation & Service Discovery
In a distributed system, services must discover each other. 
By using `docker-compose`, we created an internal Docker network (`distridoc-net`). 
Inside this network, Docker automatically provides DNS resolution. This means `gateway-server` doesn't need to know the IP address of `mongodb`; it literally just connects to `mongodb:27017`. Similarly, `storage-node-1` communicates with its peer via `http://storage-node-2:5002`. This abstracts away massive amounts of networking complexity.

## 2. Environment Parity (The "It Works on My Machine" Solution)
A core tenet of distributed systems is **Consistency**. We need `storage-node-1` and `storage-node-2` to run identically, regardless of whether they are deployed on an AWS Ubuntu server or a developer's Windows laptop.
By using Dockerfiles (`FROM node:18-alpine`), we guarantee that the operating system, the Node runtime version, and the dependencies are 100% identical and frozen in time for every single node.

## 3. Persistent Volumes
Distributed storage nodes need to actually store data persistently. If a container crashes, its local file system is wiped. 
To ensure fault tolerance, we mapped Docker Volumes (`node1-uploads:/app/uploads`). This detaches the physical file storage from the lifecycle of the container. If `storage-node-1` crashes and Docker restarts it, it simply re-attaches to the volume and instantly regains access to all previously uploaded files, continuing its heartbeat broadcasts without data loss.

## 4. Orchestration & Dependency Trees
Distributed systems have startup dependencies. The Gateway will crash if it starts before MongoDB is ready.
Our `docker-compose.yml` explicitly defines these rules:
```yaml
depends_on:
  mongodb:
    condition: service_healthy
```
This guarantees the orchestrator will not even attempt to boot the Gateway or Storage Nodes until MongoDB and Redis have successfully passed their health-check pings.
