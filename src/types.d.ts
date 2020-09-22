type GraphQLResponse = {
  data?: Record<string, any>,
  errors?: {message: string}[]
}

type GraphQLEventFields = {
  type: string,
  parents: (Record<string, any>)[] | null,
  args: Record<string,any>,
}

type ResolverResponse = any[] | Promise<any>[] | Promise<any[]>;

type GraphQLEvent = GraphQLEventFields & {
  respondWith: (r: ResolverResponse) => void,
  graphql: (s: string, vars: Record<string, any> | undefined) => Promise<GraphQLResponse>,
  dql: (s: string, vars: Record<string, any> | undefined) => Promise<GraphQLResponse>,
}

type GraphQLEventWithParent = GraphQLEvent & {
  parent: Record<string,any> | null
}
