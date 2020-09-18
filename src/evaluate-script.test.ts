import { evaluateScript } from './evaluate-script';

describe(evaluateScript, () => {
  it("returns undefined if there was no event", async () => {
    const runScript = evaluateScript("")
    expect(await runScript({type: "Query.unknown", args: [], parent: null})).toBeUndefined()
  })

  it("returns the value if there was a resolver registered", async () => {
    const runScript = evaluateScript(`addGraphQLResolvers({
      "Query.fortyTwo": async e => 42
    })`)
    expect(await runScript({ type: "Query.fortyTwo", args: [], parent: null })).toBe(42)
  })

  it("passes the args and parents over", async () => {
    const runScript = evaluateScript(`addGraphQLResolvers({
      "Query.fortyTwo": ({parent, args}) => parent.n + args[0]
    })`)
    expect(await runScript({ type: "Query.fortyTwo", args: [1], parent: {n: 41} })).toBe(42)
  })
})
