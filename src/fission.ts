import { GraphQLEventFields } from '@slash-graphql/lambda-types';
import express from 'express'
import { evaluateScript } from './evaluate-script';
import fs from 'fs';
import { bodyToEvent } from './body-to-event';
import { parseScript } from './fission-util';

// Inspired by https://github.com/fission/fission/blob/master/environments/nodejs/server.js
export function startFission(port: string) {
  // To catch unhandled exceptions thrown by user code async callbacks,
  // these exceptions cannot be catched by try-catch in user function invocation code below
  process.on('uncaughtException', (err) => {
    console.error(`Caught exception: ${err}`);
  });

  // User function.  Starts out undefined.
  let lambdaScript: (e: GraphQLEventFields) => Promise<any | undefined>;

  const app = express();
  app.use(express.json({ limit: '32mb' }))

  app.post('/v2/specialize', function(req, res) {
    console.log("Specializing Container")
    if (lambdaScript !== undefined) {
      res.status(400).send("Not a generic container");
      return;
    }

    try {
      const {script, dgAuth, dgHost, accessToken} = parseScript(fs.readFileSync(req.body.filepath).toString())
      if(dgAuth) {
        process.env.DGRAPH_TOKEN = dgAuth
      }

      if(accessToken) {
        process.env.DGRAPH_ACCESS_TOKEN = accessToken
      }

      if(dgHost) {
        process.env.DGRAPH_HOST = dgHost
        process.env.DGRAPH_URL = "https://"+dgHost
      }
      lambdaScript = evaluateScript(script)
      res.status(202).send();
    } catch(e) {
      console.error(e)
      res.status(500).send(e.message || e);
    }
  });

  // Generic route -- all http requests go to the user function.
  app.all('/', async function (req, res, next) {
    if (!lambdaScript) {
      res.status(500).send("Generic container: no requests supported");
      return;
    }

    try {
      const event = bodyToEvent(req.body)
      console.log("Received event", event.type)
      const result = await lambdaScript(event);
      if (result === undefined) {
        res.status(400)
      }
      res.json(result)
    } catch (e) {
      next(e)
    }
  })

  console.log("Starting Server On Port", port)
  app.listen(port)
}

startFission(process.env.PORT || "8888")
