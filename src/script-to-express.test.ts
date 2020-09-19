import { scriptToExpress } from "./script-to-express";
import supertest from 'supertest'

describe(scriptToExpress, () => {
  it("calls the appropriate function, passing the resolver, parent and args", async () => {
    const app = scriptToExpress(`addMultiParentGraphQLResolvers({
      "Query.fortyTwo": ({parents, args}) => parents.map(({n}) => n + args[0])
    })`)
    const response = await supertest(app)
      .post('/graphql-worker')
      .send({ resolver: "Query.fortyTwo", parents: [{ n: 41 }], args: [1] })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(response.body).toEqual([42]);
  })

  it("can also be called as an array", async () => {
    const app = scriptToExpress(`addMultiParentGraphQLResolvers({
      "Query.fortyTwo": ({parents, args}) => parents.map(({n}) => n + args[0])
    })`)
    const response = await supertest(app)
      .post('/graphql-worker')
      .send([
        { resolver: "Query.fortyTwo", parents: [{ n: 41 }], args: [1] },
        { resolver: "Query.fortyTwo", parents: [{ n: 42 }], args: [2] },
      ])
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(response.body).toEqual([[42], [44]]);
  })
})
