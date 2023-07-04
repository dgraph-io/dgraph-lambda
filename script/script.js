const fullName = ({ parent: { firstName, lastName } }) =>
  `${firstName} ${lastName}`;

async function todoTitles({ graphql }) {
  const results = await graphql("{ queryTodo { title } }");
  return results.data.queryTodo.map((t) => t.title);
}

self.addGraphQLResolvers({
  "User.fullName": fullName,
  "Query.todoTitles": todoTitles,
});

async function reallyComplexDql({ parents, dql }) {
  const ids = parents.map((p) => p.id);
  const someComplexResults = await dql.query(
    `really-complex-query-here with ${ids}`
  );
  return parents.map((parent) => someComplexResults[parent.id]);
}

self.addMultiParentGraphQLResolvers({
  "User.reallyComplexProperty": reallyComplexDql,
});

/*
 Test functions to use with following Schema
 type Query {
  dqlquery(query: String): String @lambda
  gqlquery(query: String): String @lambda
  dqlmutate(query: String): String @lambda
  echo(query: String): String @lambda
}

*/
const echo = async ({args, authHeader, graphql, dql,accessJWT}) => {
  let payload=JSON.parse(atob(accessJWT.split('.')[1]));
  return  `args: ${JSON.stringify(args)}
  accesJWT: ${accessJWT}
  authHeader: ${JSON.stringify(authHeader)}
  namespace: ${payload.namespace}`
}
 const dqlquery = async ({args, authHeader, graphql, dql}) => {

    const dqlQ = await dql.query(`${args.query}`)
    return  JSON.stringify(dqlQ)
  }
  const gqlquery = async ({args, authHeader, graphql, dql}) => {
    const gqlQ = await graphql(`${args.query}`)
    return  JSON.stringify(gqlQ)
  }
  const dqlmutation = async ({args, authHeader, graphql, dql}) => {
     // Mutate User with DQL
    const dqlM = await dql.mutate(`${args.query}`)
    return  JSON.stringify(dqlM)
  }

  self.addGraphQLResolvers({
    "Query.dqlquery": dqlquery,
    "Query.gqlquery": gqlquery,
    "Query.dqlmutate": dqlmutation,
    "Query.echo": echo,
  });
