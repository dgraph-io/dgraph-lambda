module "@slash-graphql/lambda-types" {
  type GraphQLResponse = {
    data?: Record<string, any>,
    errors?: { message: string }[]
  }

  type AuthHeaderField = {
    key: string | undefined,
    value: string | undefined
  }

  type GraphQLEventFields = {
    type: string,
    parents: (Record<string, any>)[] | null,
    args: Record<string, any>,
    authHeader?: AuthHeaderField
  }

  type ResolverResponse = any[] | Promise<any>[] | Promise<any[]>;

  type GraphQLEvent = GraphQLEventFields & {
    respondWith: (r: ResolverResponse) => void,
    graphql: (s: string, vars: Record<string, any> | undefined) => Promise<GraphQLResponse>,
    dql: (s: string, vars: Record<string, any> | undefined) => Promise<GraphQLResponse>,
  }

  type GraphQLEventWithParent = GraphQLEvent & {
    parent: Record<string, any> | null
  }

  function addGraphQLResolvers(resolvers: {
    [key: string]: (e: GraphQLEventWithParent) => any;
  }): void

  function addMultiParentGraphQLResolvers(resolvers: {
    [key: string]: (e: GraphQLEvent) => ResolverResponse;
  }): void
}
