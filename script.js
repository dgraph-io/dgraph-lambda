async function greeting({parent = {}, args = [], graphql, dql}) {
  const [name] = args;
  return `${parent.message || "Hello"} ${name || "World"}!`
}

self.addGraphQLResolvers({
  "Query.greeting": greeting
})
