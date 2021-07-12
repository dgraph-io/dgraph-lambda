import cluster from "cluster";
import express from "express";
import { bodyToEvent } from "./script-to-express";
import { evaluateScript } from './evaluate-script'
import atob from "atob";
import btoa from "btoa";
const app = express();
app.use(express.json({limit: '32mb'}))

app.get("/ping", async (req, res, next) => {
	console.log("ping")
})

app.post("/graphql-worker", async (req, res, next) => {
  console.log(req.body)
  try {
    const source = base64Decode(req.body.source) || req.body.source
    const runner = evaluateScript(source)
    const result = await runner(bodyToEvent(req.body));
    if(result === undefined && req.body.resolver !== '$webhook') {
      res.status(400)
    }
    res.json(result)
  } catch(e) {
    next(e)
  }
})

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

const port = process.env.PORT || "8686";
const server = app.listen(port, () =>
  console.log("Server Listening on port " + port + "!")
);
cluster.on("disconnect", () => server.close());

process.on("SIGINT", () => {
  server.close();
  process.exit(0);
});
