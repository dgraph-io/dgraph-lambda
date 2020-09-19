async function greeting({ parents, args = [] }) {
  const [greeting] = args;
  return parents.map(({ name }) => `${greeting || "Hello"} ${name || "World"}!`)
}

async function todoTitles({ parents, graphql }) {
  return parents.map(async () => {
    const results = await graphql('{ queryTodo { title } }')
    return results.data.queryTodo.map(t => t.title)
  })
}

self.addGraphQLResolvers({
  "User.greeting": greeting,
  "Query.todoTitles": todoTitles,
})
