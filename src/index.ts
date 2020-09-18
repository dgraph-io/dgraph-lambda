import cluster from 'cluster';
import fs from 'fs'
import { scriptToExpress } from './script-to-express';

async function startWorkers() {
  const cores = 4;
  console.log("Master is setting up Workers #" + cores);

  for (var i = 0; i < cores; i++) {
    cluster.fork();
  }

  cluster.on("online", worker => {
    console.log("Worker started pid#" + worker.process.pid);
  });

  cluster.on("exit", (worker, code, signal) => {
    console.log(
      "Worker #" +
      worker.process.pid +
      " died with code: " +
      code +
      " and signal: " +
      signal
    );
    cluster.fork();
  });
}

async function startServer() {
  const source = await (await fs.promises.readFile(process.env.SCRIPT_PATH || "/app/script")).toString()
  const app = scriptToExpress(source);
  const port = process.env.PORT || "8686";
  app.listen(port, () => console.log("Server Listening on port " + port + "!"))
}

if(cluster.isMaster) {
  startWorkers();
} else {
  startServer();
}

