import { EventTarget } from 'event-target-shim';
import vm from 'vm';
import { GraphQLEvent, GraphQLEventWithParent, GraphQLEventFields, ResolverResponse, AuthHeaderField, WebHookGraphQLEvent } from '@slash-graphql/lambda-types'

import fetch, { Request, Response, Headers } from "node-fetch";
import { URL } from "url";
import atob from "atob";
import btoa from "btoa";
import { TextDecoder, TextEncoder } from "util";
import { Crypto } from "node-webcrypto-ossl";
import { CryptoKey } from "webcrypto-core"
import { graphql, dql } from './dgraph';

function getParents(e: GraphQLEventFields): (Record<string,any>|null)[] {
  return e.parents || [null]
}

class GraphQLResolverEventTarget extends EventTarget {
  addMultiParentGraphQLResolvers(resolvers: {[key: string]: (e: GraphQLEvent) => ResolverResponse}) {
    for (const [name, resolver] of Object.entries(resolvers)) {
      this.addEventListener(name, e => {
        const event = e as unknown as GraphQLEvent;
        event.respondWith(resolver(event))
      })
    }
  }

  addGraphQLResolvers(resolvers: { [key: string]: (e: GraphQLEventWithParent) => (any | Promise<any>) }) {
    for (const [name, resolver] of Object.entries(resolvers)) {
      this.addEventListener(name, e => {
        const event = e as unknown as GraphQLEvent;
        event.respondWith(getParents(event).map(parent => resolver({...event, parent})))
      })
    }
  }

  addWebHookResolvers(resolvers: { [key: string]: (e: WebHookGraphQLEvent) => (any | Promise<any>) }) {
    for (const [name, resolver] of Object.entries(resolvers)) {
      this.addEventListener(name, e => {
        const event = e as unknown as WebHookGraphQLEvent;
        event.respondWith(resolver(event))
      })
    }
  }
}

function newContext(eventTarget: GraphQLResolverEventTarget) {
  const env = {} as Record<string, string | undefined>
  Object.entries(process.env).forEach(([key, value]) => {
    if (key.startsWith('EXPOSED_')) {
      env[key] = value
    }
  })

  return vm.createContext({
    // From fetch
    fetch,
    Request,
    Response,
    Headers,

    // URL Standards
    URL,
    URLSearchParams,

    // bas64
    atob,
    btoa,

    // Crypto
    crypto: new Crypto(),
    TextDecoder,
    TextEncoder,
    CryptoKey,

    // Debugging
    console,

    // Async
    setTimeout,
    setInterval,
    clearTimeout,
    clearInterval,

    // EventTarget
    self: eventTarget,
    addEventListener: eventTarget.addEventListener.bind(eventTarget),
    removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
    addMultiParentGraphQLResolvers: eventTarget.addMultiParentGraphQLResolvers.bind(eventTarget),
    addGraphQLResolvers: eventTarget.addGraphQLResolvers.bind(eventTarget),
    addWebHookResolvers: eventTarget.addWebHookResolvers.bind(eventTarget),

    // Environment
    process: { env },
  });
}

export function evaluateScript(source: string) {
  const script = new vm.Script(source)
  const target = new GraphQLResolverEventTarget();
  const context = newContext(target)
  script.runInContext(context);

  return async function(e: GraphQLEventFields): Promise<any | undefined> {
    let retPromise: ResolverResponse | undefined = undefined;
    const event = {
      ...e,
      respondWith: (x: ResolverResponse) => { retPromise = x },
      graphql: (query: string, variables: Record<string, any>, ah?: AuthHeaderField) => graphql(query, variables, ah || e.authHeader),
      dql,
    }
    if (e.type === '$webhook' && e.event) {
      event.type = `${e.event?.__typename}.${e.event?.operation}` 
    }
    target.dispatchEvent(event)

    if(retPromise === undefined) {
      return undefined
    }

    const resolvedArray = await (retPromise as ResolverResponse);
    if(!Array.isArray(resolvedArray) || resolvedArray.length !== getParents(e).length) {
      process.env.NODE_ENV != "test" && e.type !== '$webhook' && console.error(`Value returned from ${e.type} was not an array or of incorrect length`)
      return undefined
    }

    const response = await Promise.all(resolvedArray);
    return e.parents === null ? response[0] : response;
  }
}
