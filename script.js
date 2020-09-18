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
