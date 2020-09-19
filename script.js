async function greeting({ parents, args = [] }) {
  const [greeting] = args;
  return parents.map(({ firstName }) => `${greeting || "Hello"} ${firstName || "World"}!`)
}

async function todoTitles({ parents, graphql }) {
  return parents.map(async () => {
    // You can also use dql() instead of graphql()
    const results = await graphql('{ queryTodo { title } }')
    return results.data.queryTodo.map(t => t.title)
  })
}

async function fullName({parents}) {
  return parents.map(({firstName, lastName}) => `${firstName} ${lastName}`)
}

self.addGraphQLResolvers({
  "User.fullName": fullName,
  "User.greeting": greeting,
  "Query.todoTitles": todoTitles,
})
