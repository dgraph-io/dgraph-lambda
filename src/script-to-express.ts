import express from 'express'
import { evaluateScript } from './evaluate-script'

function bodyToEvent(b: any) {
  return {
    type: b.resolver,
    parent: b.parent || undefined,
    args: b.args || [],
  }
}

export function scriptToExpress(source: string) {
  const runner = evaluateScript(source)
  const app = express()
  app.use(express.json())
  app.post("/graphql-worker", async (req, res, next) => {
    try {
      if(Array.isArray(req.body)) {
        const results = []
        for(const b of req.body) {
          results.push(await runner(bodyToEvent(b)))
        }
        res.json(results)
      } else {
        res.json(await runner(bodyToEvent(req.body)))
      }
    } catch(e) {
      next(e)
    }
  })
  return app;
}
