# Dgraph Lambda

Dgraph Lambda is a serverless platform for running JS on Slash GraphQL (or Dgraph).

## Running a script

A script looks something like this. There are two ways to add a resolver
* `addGraphQLResolver` which recieves `{ parent, args }` and returns a single value
* `addMultiParentGraphQLResolver` which received `{ parents, args }` and should return an array of results, each result matching to one parent. This method will have much better performance if you are able to club multiple requests together

If the query is a root query/mutation, parents will be set to `[null]`.

```javascript
const fullName = ({ parent: { firstName, lastName } }) => `${firstName} ${lastName}`

async function todoTitles({ graphql }) {
  const results = await graphql('{ queryTodo { title } }')
  return results.data.queryTodo.map(t => t.title)
}

self.addGraphQLResolvers({
  "User.fullName": fullName,
  "Query.todoTitles": todoTitles,
})

async function reallyComplexDql({parents, dql}) {
  const ids = parents.map(p => p.id);
  const someComplexResults = await dql(`really-complex-query-here with ${ids}`);
  return parents.map(parent => someComplexResults[parent.id])
}

self.addMultiParentGraphQLResolvers({
  "User.reallyComplexProperty": reallyComplexDql
})
```

## Running Locally

Create a "local-lambda" docker image
``` 
docker build -t local-lambda .
```
###  option 1 - run the lambda server alone with
```
docker run -d -p 8686:8686 local-lambda
```
You can perform a basic test using curl:

```bash
curl localhost:8686/graphql-worker -H "Content-Type: application/json" -d '{"resolver":"User.fullName","parents":[{"firstName":"Dgraph","lastName":"Labs"}]}'
```


### option 2 - use one of the scripts in dgraph/contrib/local-test

- change the lambda image used in the script to use local-lambda for your tests
- check the script you want to load. To run the lambda jest, load the script provided in this repo.

For testing, update exosystem.config.js

- add node_args: ["--inspect"], to enable debugging.
- set instances to 1, to be sure that the port 9230 will be on the only instance your are testing.

in VS code, attach to the docker container, and then launch the debug confugration "Attach to Process"


### Tests
run 
```
docker-compose up
``` 
to get an cluster with Dgraph zero, alpha and lambda server

run 

```
export DGRAPH_URL=http://localhost:8080

export INTEGRATION_TEST=true 

npm test
```
to execute the tests.



## Environment

We are trying to make the environment match the environment you'd get from ServiceWorker.

* [x] fetch
* [x] graphql / dql
* [x] base64
* [x] URL
* [ ] crypto - should test this

## Adding libraries

If you would like to add libraries, then use webpack --target=webworker to compile your script. We'll fill out these instructions later.

### Working with Typescript

You can import `@slash-graphql/lambda-types` to get types for `addGraphQLResolver` and `addGraphQLMultiParentResolver`.

## Security

Currently, this uses node context to try and make sure that users aren't up to any fishy business. However, contexts aren't true security, and we should eventually switch to isolates. In the meanwhile, we will basically have kube kill this if it takes a lot of CPU for say 5 secs

## Publishing

Currently, the publishing of this isn't automated. In order to publish:
* Publish the types in slash-graphql-lambda-types if needed with (npm version minor; npm publish)
* The docker-image auto publishes, but pushing a tag will create a tagged version that is more stable
