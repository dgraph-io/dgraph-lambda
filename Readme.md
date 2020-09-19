# Omega

Omega is a serverless platform for running JS on Slash GraphQL (or Dgraph).

## Running a script

A script looks something like this. There are two ways to add a resolver
* `addGraphQLResolver` which recieves `{ parent, args }` and returns a single value
* `addMultiParentGraphQLResolver` which received `{ parents, args }` and should return an array of results, each result matching to one parent. This method will have much better performance if you are able to club multiple requests together

If the query is a root query/mutation, parents will be set to `[null]`.

```javascript
const fullName = ({ parent: { firstName, lastName } }) => `${firstName} ${lastName}`

function greeting({parent: {firstName}, args = [] }) {
  const [greeting] = args;
  return `${greeting || "Hello"} ${firstName || "World"}!`
}

async function todoTitles({ graphql }) {
  const results = await graphql('{ queryTodo { title } }')
  return results.data.queryTodo.map(t => t.title)
}

self.addGraphQLResolvers({
  "User.fullName": fullName,
  "User.greeting": greeting,
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

First launch dgraph and load it with the todo schema (and add a todo or two).

```bash
# host.docker.internal may not work on old versions of docker
docker run -it --rm -p 8686:8686 -v /path/to/script.js:/app/script.js -e DGRAPH_URL=http://host.docker.internal:8080 tdinkar/omega
```

Then test it out with the following curls
```bash
curl localhost:8686/graphql-worker -H "Content-Type: application/json" -d '{"resolver":"User.greeting","parents":[{"name":"Tejas"}]}'
# Now lets send an array of queries
curl localhost:8686/graphql-worker -H "Content-Type: application/json" -d '[{"resolver":"User.greeting","parents":[{"name":"Tejas"}]},{"resolver":"Query.todoTitles"}]'
```

## Environment

We are trying to make the environment match the environment you'd get from ServiceWorker.

* [x] fetch
* [x] graphql / dql
* [x] base64
* [x] URL
* [ ] crypto - should test this

## Adding libraries

If you would like to add libraries, then use webpack --target=webworker to compile your script. We'll fill out these instructions later.

## Security

Currently, this uses node context to try and make sure that users aren't up to any fishy business. However, contexts aren't true security, and we should eventually switch to isolates. In the meanwhile, we will basically have kube kill this if it takes a lot of CPU for say 5 secs
