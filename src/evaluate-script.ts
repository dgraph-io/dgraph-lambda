import { EventTarget } from 'event-target-shim';
import vm from 'vm';

import fetch, { Request, Response, Headers } from "node-fetch";
import { URL } from "url";
import atob from "atob";
import btoa from "btoa";
import { TextDecoder, TextEncoder } from "util";
import { Crypto } from "node-webcrypto-ossl";
import { graphql, dql } from './dgraph';

class GraphQLResolverEventTarget extends EventTarget {
  addMultiParentGraphQLResolvers(resolvers: {[key: string]: (e: GraphQLEvent) => (any | Promise<any>)}) {
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
        event.respondWith(event.parents.map(parent => resolver({...event, parent})))
      })
    }
  }
}

function newContext(eventTarget: GraphQLResolverEventTarget) {
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
  });
}

export function evaluateScript(source: string) {
  const script = new vm.Script(source)
  const target = new GraphQLResolverEventTarget();
  const context = newContext(target)
  script.runInContext(context);

  return async function(e: GraphQLEventFields): Promise<any[] | undefined> {
    let retPromise: ResolverResponse | undefined = undefined;
    const event = {
      ...e,
      respondWith: (x: ResolverResponse) => { retPromise = x },
      graphql,
      dql,
    }
    target.dispatchEvent(event)

    if(retPromise === undefined) {
      return undefined
    }

    let ret = await (retPromise as ResolverResponse);
    if(!Array.isArray(ret) || ret.length !== e.parents.length) {
      process.env.NODE_ENV != "test" && console.error(`Value returned from ${e.type} was not an array or of incorrect length`)
      return undefined
    }

    return await Promise.all(ret);
  }
}
