import express from 'express'
import { evaluateScript } from './evaluate-script'

function bodyToEvent(b: any): GraphQLEventFields {
  return {
    type: b.resolver,
    parents: b.parents || null,
    args: b.args || [],
  }
}

export function scriptToExpress(source: string) {
  const runner = evaluateScript(source)
  const app = express()
  app.use(express.json())
  app.post("/graphql-worker", async (req, res, next) => {
    try {
      const result = await runner(bodyToEvent(req.body));
      if(result === undefined) {
        res.status(400)
      }
      res.json(result)
    } catch(e) {
      next(e)
    }
  })
  return app;
}
