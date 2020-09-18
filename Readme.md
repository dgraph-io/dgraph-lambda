# Omega

Omega is a serverless platform for running arbitrary JS on Dgraph GraphQL.

## Running a script

A script looks something like this

```javascript
async function greeting({parent = {}, args = [], graphql, dql}) {
  const [greeting] = args;
  return `${greeting || "Hello"} ${parent.name || "World"}!`
}

async function todoTitles({ graphql }) {
  const results = await graphql('{ queryTodo { title } }')
  return results.data.queryTodo.map(t => t.title)
}

self.addGraphQLResolvers({
  "User.greeting": greeting,
  "Query.todoTitles": todoTitles,
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
curl localhost:8686/graphql-worker -H "Content-Type: application/json" -d '{"resolver":"User.greeting","parent":{"name":"Tejas"}}'
# Now lets send an array of queries
curl localhost:8686/graphql-worker -H "Content-Type: application/json" -d '[{"resolver":"User.greeting","parent":{"name":"Tejas"}},{"resolver":"Query.todoTitles"}]'
```

## Adding libraries

If you would like to add libraries, then use webpack --target=webworker to compile your script. We'll fill out these instructions later.

## Environment
* [x] fetch
* [x] graphql / dql
* [x] base64
* [x] URL
* [ ] crypto - should test this
