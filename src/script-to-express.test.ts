import { scriptToExpress } from "./script-to-express";
import supertest from 'supertest'

describe(scriptToExpress, () => {
  it("calls the appropriate function, passing the resolver, parent and args", async () => {
    const app = scriptToExpress(`addGraphQLResolvers({
      "Query.fortyTwo": ({parent, args}) => parent.n + args[0]
    })`)
    const response = await supertest(app)
      .post('/graphql-worker')
      .send({ resolver: "Query.fortyTwo", parent: { n: 41 }, args: [1] })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(response.body).toEqual(42);
  })

  it("can also be called as an array", async () => {
    const app = scriptToExpress(`addGraphQLResolvers({
      "Query.fortyTwo": ({parent, args}) => parent.n + args[0]
    })`)
    const response = await supertest(app)
      .post('/graphql-worker')
      .send([
        { resolver: "Query.fortyTwo", parent: { n: 41 }, args: [1] },
        { resolver: "Query.fortyTwo", parent: { n: 42 }, args: [2] },
      ])
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(response.body).toEqual([42, 44]);
  })
})
