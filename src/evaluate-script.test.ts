import { evaluateScript } from './evaluate-script';
import { waitForDgraph, loadSchema, runQuery } from './test-utils'
import sleep from 'sleep-promise';

const integrationTest = process.env.INTEGRATION_TEST === "true" ? describe : describe.skip;

describe(evaluateScript, () => {
  it("returns undefined if there was no event", async () => {
    const runScript = evaluateScript("")
    expect(await runScript({type: "Query.unknown", args: {}, parents: null})).toBeUndefined()
  })

  it("returns the value if there is a resolver registered", async () => {
    const runScript = evaluateScript(`addGraphQLResolvers({
      "Query.fortyTwo": ({parent}) => 42
    })`)
    expect(await runScript({ type: "Query.fortyTwo", args: {}, parents: null })).toEqual(42)
  })

  it("passes the args and parents over", async () => {
    const runScript = evaluateScript(`addMultiParentGraphQLResolvers({
      "User.fortyTwo": ({parents, args}) => parents.map(({n}) => n + args.foo)
    })`)
    expect(await runScript({ type: "User.fortyTwo", args: {foo: 1}, parents: [{n: 41}] })).toEqual([42])
  })

  it("returns undefined if the number of parents doesn't match the number of return types", async () => {
    const runScript = evaluateScript(`addMultiParentGraphQLResolvers({
      "Query.fortyTwo": () => [41, 42]
    })`)
    expect(await runScript({ type: "Query.fortyTwo", args: {}, parents: null })).toBeUndefined()
  })

  it("returns undefined somehow the script doesn't return an array", async () => {
    const runScript = evaluateScript(`addMultiParentGraphQLResolvers({
      "User.fortyTwo": () => ({})
    })`)
    expect(await runScript({ type: "User.fortyTwo", args: {}, parents: [{n: 42}] })).toBeUndefined()
  })

  it("passes exposed environment variables to script", async () => {
    const runScript = evaluateScript(`addGraphQLResolvers({
      "Query.envVar": () => process.env.EXPOSED_VAR
    })`)
    expect(await runScript({ type: "Query.envVar", args: {}, parents: null })).toEqual('works')
  })

  it("filters out environment variables that haven't been exposed to script", async () => {
    const runScript = evaluateScript(`addGraphQLResolvers({
      "Query.envVar": () => process.env.SOME_VAR
    })`)
    expect(await runScript({ type: "Query.envVar", args: {}, parents: null })).toBeUndefined()
  })

  integrationTest("dgraph integration", () => {
    beforeAll(async () => {
      await waitForDgraph();
      await loadSchema(`type Todo { id: ID!, title: String! }`)
      await sleep(250)
      await runQuery(`mutation { addTodo(input: [{title: "Kick Ass"}, {title: "Chew Bubblegum"}]) { numUids } }`)
    })

    it("works with dgraph graphql", async () => {
      const runScript = evaluateScript(`
        async function todoTitles({graphql}) {
          const results = await graphql('{ queryTodo { title } }')
          return results.data.queryTodo.map(t => t.title)
        }
        addGraphQLResolvers({ "Query.todoTitles": todoTitles })`)
      const results = await runScript({ type: "Query.todoTitles", args: {}, parents: null });
      expect(new Set(results)).toEqual(new Set(["Kick Ass", "Chew Bubblegum"]))
    })

    it("works with dgraph dql", async () => {
      const runScript = evaluateScript(`
        async function todoTitles({dql}) {
          const results = await dql.query('{ queryTitles(func: type(Todo)){ Todo.title } }')
          return results.data.queryTitles.map(t => t["Todo.title"])
        }
        addGraphQLResolvers({ "Query.todoTitles": todoTitles })`)
      const results = await runScript({ type: "Query.todoTitles", args: {}, parents: null });
      expect(new Set(results)).toEqual(new Set(["Kick Ass", "Chew Bubblegum"]))
    })
  })
})
