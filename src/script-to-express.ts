import express from 'express'
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

export function scriptToExpress(source: string) {
  const runner = evaluateScript(source)
  const app = express()
  app.use(express.json({limit: '32mb'}))
  app.post("/graphql-worker", async (req, res, next) => {
    try {
      const result = await runner(bodyToEvent(req.body));
      if(result === undefined && req.body.resolver !== '$webhook') {
        res.status(400)
      }
      res.json(result)
    } catch(e) {
      next(e)
    }
  })
  return app;
}
