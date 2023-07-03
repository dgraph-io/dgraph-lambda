import cluster from "cluster";
import fs from "fs";
import { scriptToExpress } from "./script-to-express";
import atob from "atob";
import btoa from "btoa";
import express from 'express';
var path = require('path');

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
  const app = express()
  app.use(express.json({limit: '32mb'}))
  try {
    const data = fs.readFileSync(process.env.SCRIPT_PATH || "./script/script.js")
    console.info(`Found script at root\n`);
    const source = data.toString();
    const script = base64Decode(source) || source;
    scriptToExpress(app,"/graphql-worker",script);
  } catch {
    console.info(`No script at root\n`); 
  }
      
    const dirPath = process.env.SCRIPT_PATH || "./script";
    fs.readdirSync(dirPath).forEach(function(file) {
          let namespace = parseInt(file)
          let filepath = path.join(dirPath , file);
          let stat= fs.statSync(filepath);
          if (stat.isDirectory() && !isNaN(namespace)) {
            let scriptpath =  path.join(filepath , 'script.js');
            if (fs.existsSync(scriptpath))  {
              console.info(`found script.js in directory for namespace ${namespace}\n`); 
              let source = fs.readFileSync(scriptpath).toString();
              let script = base64Decode(source) || source;
              scriptToExpress(app,`/${namespace}/graphql-worker`,script);
            }             
          }     
    });
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
