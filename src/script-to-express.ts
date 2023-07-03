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
    accessJWT: b["X-Dgraph-AccessToken"]
  }
}

export function scriptToExpress(app: express.Application, path: string, source: string) {
  const runner = evaluateScript(source)
  console.log("Adding script to path " + path );
  app.post(path, async (req, res, next) => {
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

}
