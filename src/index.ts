import cluster from "cluster";
import fs from "fs";
import { scriptToExpress } from "./script-to-express";
import atob from "atob";
import btoa from "btoa";

function base64Decode(str: string) {
  try {
    const original = str.trim();
    const decoded = atob(original);
    return btoa(decoded) === original ? decoded : "";
  } catch (err) {
    console.error(err);
    return "";
  }
}

async function startServer() {
  const source = (
    await fs.promises.readFile(process.env.SCRIPT_PATH || "./script/script.js")
  ).toString();
  const script = base64Decode(source) || source;

  const app = scriptToExpress(script);
  const port = process.env.PORT || "8686";
  const server = app.listen(port, () =>
    console.log("Server Listening on port " + port + "!")
  );
  cluster.on("disconnect", () => server.close());

  process.on("SIGINT", () => {
    server.close();
    process.exit(0);
  });
}

startServer();
