import { evaluateScript } from './evaluate-script';
import { waitForDgraph, loadSchema, runQuery } from './test-utils'

const integrationTest = process.env.INTEGRATION_TEST === "true" ? describe : describe.skip;

describe(evaluateScript, () => {
  it("returns undefined if there was no event", async () => {
    const runScript = evaluateScript("")
    expect(await runScript({type: "Query.unknown", args: [], parent: null})).toBeUndefined()
  })

  it("returns the value if there was a resolver registered", async () => {
    const runScript = evaluateScript(`addGraphQLResolvers({
      "Query.fortyTwo": async e => 42
    })`)
    expect(await runScript({ type: "Query.fortyTwo", args: [], parent: null })).toEqual(42)
  })

  it("passes the args and parents over", async () => {
    const runScript = evaluateScript(`addGraphQLResolvers({
      "Query.fortyTwo": ({parent, args}) => parent.n + args[0]
    })`)
    expect(await runScript({ type: "Query.fortyTwo", args: [1], parent: {n: 41} })).toEqual(42)
  })

  integrationTest("dgraph integration", () => {
    beforeAll(async () => {
      await waitForDgraph();
      await loadSchema(`type Todo { id: ID!, title: String! }`)
      await runQuery(`mutation { addTodo(input: [{title: "Kick Ass"}, {title: "Chew Bubblegum"}]) { numUids } }`)
    })

    it("works with dgraph graphql", async () => {
      const runScript = evaluateScript(`
        async function todoTitles({graphql}) {
          const results = await graphql('{ queryTodo { title } }')
          return results.data.queryTodo.map(t => t.title)
        }
        addGraphQLResolvers({ "Query.todoTitles": todoTitles })`)
      const results = await runScript({ type: "Query.todoTitles", args: [], parent: null });
      expect(new Set(results)).toEqual(new Set(["Kick Ass", "Chew Bubblegum"]))
    })

    it("works with dgraph graphql", async () => {
      const runScript = evaluateScript(`
        async function todoTitles({dql}) {
          const results = await dql('{ queryTitles(func: type(Todo)){ Todo.title } }')
          return results.data.queryTitles.map(t => t["Todo.title"])
        }
        addGraphQLResolvers({ "Query.todoTitles": todoTitles })`)
      const results = await runScript({ type: "Query.todoTitles", args: [], parent: null });
      expect(new Set(results)).toEqual(new Set(["Kick Ass", "Chew Bubblegum"]))
    })
  })
})
