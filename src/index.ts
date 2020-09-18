import cluster from 'cluster';
import fs from 'fs'
import { scriptToExpress } from './script-to-express';
import sleep from 'sleep-promise';

async function startWorkers() {
  const cores = 4;
  console.log("Master is setting up Workers #" + cores);

  for (var i = 0; i < cores; i++) {
    cluster.fork();
  }

  cluster.on("online", worker => {
    console.log("Worker started pid#" + worker.process.pid);
  });

  cluster.on("exit", async (worker, code, signal) => {
    console.log(
      "Worker #" +
      worker.process.pid +
      " died with code: " +
      code +
      " and signal: " +
      signal
    );
    if(signal === "SIGINT") {
      cluster.disconnect();
      return;
    }
    await sleep(100);
    cluster.fork();
  });
}

async function startServer() {
  const source = (await fs.promises.readFile(process.env.SCRIPT_PATH || "./script.js")).toString()
  const app = scriptToExpress(source);
  const port = process.env.PORT || "8686";
  const server = app.listen(port, () => console.log("Server Listening on port " + port + "!"))
  cluster.on('disconnect', () => server.close())
}

if(cluster.isMaster) {
  startWorkers();
} else {
  startServer();
}

