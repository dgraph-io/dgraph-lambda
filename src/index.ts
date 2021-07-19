import cluster from "cluster";
import express from "express";
import { evaluateScript } from './evaluate-script'
import { base64Decode, bodyToEvent } from "./utils";

export function buildApp() {
  const app = express();
  app.use(express.json({limit: '32mb'}))
  app.post("/graphql-worker", async (req, res, next) => {
    try {
      const source = base64Decode(req.body.source) || req.body.source
      const runner = evaluateScript(source)
      const result = await runner(bodyToEvent(req.body));
      if(result === undefined && req.body.resolver !== '$webhook') {
        res.status(400)
      }
      res.json(result)
    } catch(err) {
      next(err)
    }
  })
  return app;
}

async function startServer() {
  const app = buildApp()
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