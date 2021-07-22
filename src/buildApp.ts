import express from "express";
import atob from "atob";
import btoa from "btoa";
import { evaluateScript } from './evaluate-script'
import { GraphQLEventFields } from '@slash-graphql/lambda-types'

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