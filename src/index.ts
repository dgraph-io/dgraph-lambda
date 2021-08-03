import atob from "atob";
import btoa from "btoa";
import { evaluateScript } from './evaluate-script'
import { GraphQLEventFields } from '@slash-graphql/lambda-types'
import fs from "fs"

function bodyToEvent(b: any): GraphQLEventFields {
  return {
    type: b.resolver,
    parents: b.parents || null,
    args: b.args || {},
    authHeader: b.authHeader,
    event: b.event || {},
    info: b.info || null,
  }
}

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

var scripts = new Map();

async function execute(body: any, res: any) {
  try {
    // console.log(body)
    const source = base64Decode(body.source) || body.source
    const namespace = body.namespace || "0"
    if(scripts.has(source)){
      const runner = scripts.get(source)
      const result = await runner(bodyToEvent(body));
      console.log(result)
      if(result === undefined && body.resolver !== '$webhook') {
          res.status(400)
      }
      res.json(result)
      return
    }
    const runner = evaluateScript(source, namespace)
    scripts.set(source, runner)
    const result = await runner(bodyToEvent(body));

    console.log("Result", result)
    if(result === undefined && body.resolver !== '$webhook') {
        res.status(400)
    }
    res.json(result)
  } catch(err) {
    if(err.message.includes("Script execution timed out")) {
      res.json({"error": err.message})
    }
  }
}

async function run() {
  fs.open('/dev/shm/hey.txt', 'r', function(status, fd) {
    if (status) {
        console.log(status.message);
        return;
    }
    var readIdx = 4;
    var idxBuf = Buffer.alloc(4);
    function loop(i: number) {
      setTimeout(() => {
        fs.readSync(fd, idxBuf, 0, 4, 0);
        const idx = idxBuf.readUInt32BE(0);
        if (idx >= readIdx) {
          var szBuf = Buffer.alloc(4);
          // Return if nothing was written
          fs.readSync(fd, szBuf, 0, 4, readIdx)
          const sz = szBuf.readUInt32BE(0);
          var buf = Buffer.alloc(sz)
          fs.readSync(fd, buf, 0, sz, readIdx+4,)
          console.log("Reading at readIdx:", readIdx, " found idx:", idx, " sz:", sz)
          readIdx += 4 + sz
          const json = JSON.parse(buf.toString())
          execute(json, null)
        }
        loop(++i);
      }, 1000)
    }
    loop(0)
});
}

async function startServer() {
  run()
  process.on("SIGINT", () => {
    process.exit(0);
  });
}

startServer();