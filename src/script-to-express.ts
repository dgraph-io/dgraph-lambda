import express from 'express'
import { evaluateScript } from './evaluate-script'
import { bodyToEvent } from './body-to-event'

export function scriptToExpress(source: string) {
  const runner = evaluateScript(source)
  const app = express()
  app.use(express.json({limit: '32mb'}))
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
