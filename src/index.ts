import cluster from 'cluster';
import fs from 'fs'
import { scriptToExpress } from './script-to-express';

async function startServer() {
  const source = (await fs.promises.readFile(process.env.SCRIPT_PATH || "./script.js")).toString()
  const app = scriptToExpress(source);
  const port = process.env.PORT || "8686";
  const server = app.listen(port, () => console.log("Server Listening on port " + port + "!"))
  cluster.on('disconnect', () => server.close())
}

startServer();

