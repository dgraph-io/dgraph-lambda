import { EventTarget } from 'event-target-shim';
import vm from 'vm';

const { Request, Response, Headers } = require("node-fetch");
const { URL } = require("url");
const fetch = require("node-fetch");
const atob = require("atob");
const btoa = require("btoa");
// const crypto = new (require("node-webcrypto-ossl"))();
const { TextDecoder, TextEncoder } = require("util");

type GraphQLEventFields = {
  type: string,
  parent: Record<string, any> | null,
  args: any[],
}

type GraphQLEvent = GraphQLEventFields & {
  respondWith: (r: any | Promise<any>) => void,
}

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
    // crypto,
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
      respondWith: (x: any | Promise<any>) => { ret = x }
    }
    target.dispatchEvent(event)
    return await ret;
  }
}
