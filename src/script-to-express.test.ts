import { scriptToExpress } from "./script-to-express";
import supertest from 'supertest';
import express from 'express';

describe(scriptToExpress, () => {
  it("calls the appropriate function, passing the resolver, parent and args", async () => {
    const app = express()
    scriptToExpress(app,"/graphql-worker",`addMultiParentGraphQLResolvers({
      "Query.fortyTwo": ({parents, args}) => parents.map(({n}) => n + args.foo)
    })`)
    const response = await supertest(app)
      .post('/graphql-worker')
      .send({ resolver: "Query.fortyTwo", parents: [{ n: 41 }], args: {foo: 1} })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(response.body).toEqual([42]);
  })

  it("returns a single item if the parents is null", async () => {
    const app = express()
    scriptToExpress(app,"/graphql-worker",`addGraphQLResolvers({
      "Query.fortyTwo": () => 42
    })`)
    const response = await supertest(app)
      .post('/graphql-worker')
      .send(
        { resolver: "Query.fortyTwo" },
      )
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(response.body).toEqual(42);
  })

  it("returns a 400 if the resolver is not registered or invalid", async () => {
    const app = express()
    scriptToExpress(app,"/graphql-worker",``)
    const response = await supertest(app)
      .post('/graphql-worker')
      .send(
        { resolver: "Query.notFound" },
      )
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
    expect(response.body).toEqual("");
  })

  it("gets the auth header as a key", async () => {
    const app = express()
    scriptToExpress(app,"/graphql-worker",`addGraphQLResolvers({
      "Query.authHeader": ({authHeader}) => authHeader.key + authHeader.value
    })`)
    const response = await supertest(app)
      .post('/graphql-worker')
      .send({ resolver: "Query.authHeader", parents: [{ n: 41 }], authHeader: {key: "foo", value: "bar"} })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(response.body).toEqual(["foobar"]);
  })
})
