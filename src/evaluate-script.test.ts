import { evaluateScript } from './evaluate-script';
import { waitForDgraph, loadSchema, runQuery , login, addNamespace} from './test-utils'
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

  integrationTest("dgraph integration", () => {
    var accessJWT0: string
    var accessJWT: string
    var namespaceInfo: any
    beforeAll(async () => {
      await waitForDgraph();
      accessJWT0 = await login("groot","password",0)
      namespaceInfo = await addNamespace("tenant1",accessJWT0)

      accessJWT = await login("groot","tenant1",namespaceInfo["namespaceId"])
      await loadSchema(`
      type Todo { id: ID!, title: String! }  
      type Query {
        dqlquery(query: String): String @lambda
        gqlquery(query: String): String @lambda
        dqlmutate(query: String): String @lambda
        echo(query: String): String @lambda
      }`,accessJWT)
      await sleep(250)
      await runQuery(`mutation { addTodo(input: [{title: "Kick Ass"}, {title: "Chew Bubblegum"}]) { numUids } }`,accessJWT)
      
    })
    it("obtain accessJWT", async () => {
      expect(accessJWT != undefined)
    })
    it("add namespace ", async () => {
      expect(namespaceInfo["message"] == "Created namespace successfully")
    })
    it("works with dgraph graphql", async () => {
      const runScript = evaluateScript(`
        async function todoTitles({graphql}) {
          const results = await graphql('{ queryTodo { title } }')
          return results.data.queryTodo.map(t => t.title)
        }
        addGraphQLResolvers({ "Query.todoTitles": todoTitles })`)
      const results = await runScript({ type: "Query.todoTitles", args: {}, parents: null , accessJWT: accessJWT});
      expect(new Set(results)).toEqual(new Set(["Kick Ass", "Chew Bubblegum"]))
    })

    it("works with dgraph dql", async () => {
      const runScript = evaluateScript(`
        async function todoTitles({dql}) {
          const results = await dql.query('{ queryTitles(func: type(Todo)){ Todo.title } }')
          return results.data.queryTitles.map(t => t["Todo.title"])
        }
        addGraphQLResolvers({ "Query.todoTitles": todoTitles })`)
      const results = await runScript({ type: "Query.todoTitles", args: {}, parents: null, accessJWT: accessJWT});
      expect(new Set(results)).toEqual(new Set(["Kick Ass", "Chew Bubblegum"]))
    })
  })
})
