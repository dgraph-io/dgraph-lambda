import express from 'express'
import { evaluateScript } from './evaluate-script'
import { GraphQLEventFields } from '@slash-graphql/lambda-types'

export function bodyToEvent(b: any): GraphQLEventFields {
  console.log(b)
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
  // const runner = evaluateScript(source)
  // return runner;
}
