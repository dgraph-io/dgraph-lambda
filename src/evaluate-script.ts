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
  addGraphQLResolvers(resolvers: {[key: string]: (e: GraphQLEvent) => (any | Promise<any>)}) {
    for (const [name, resolver] of Object.entries(resolvers)) {
      this.addEventListener(name, e => {
        const event = e as unknown as GraphQLEvent;
        event.respondWith(resolver(event))
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
    addGraphQLResolvers: eventTarget.addGraphQLResolvers.bind(eventTarget),
  });
}

export function evaluateScript(source: string) {
  const script = new vm.Script(source)
  const target = new GraphQLResolverEventTarget();
  const context = newContext(target)
  script.runInContext(context);

  return async function(e: GraphQLEventFields): Promise<any> {
    let ret = undefined;
    const event = {
      ...e,
      respondWith: (x: any | Promise<any>) => { ret = x },
      graphql,
      dql,
    }
    target.dispatchEvent(event)
    return await ret;
  }
}
