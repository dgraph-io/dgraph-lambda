type GraphQLResponse = {
  data?: Record<string, any>,
  errors?: {message: string}[]
}

type GraphQLEventFields = {
  type: string,
  parent: Record<string, any> | null,
  args: any[],
}

type GraphQLEvent = GraphQLEventFields & {
  respondWith: (r: any | Promise<any>) => void,
  graphql: (s: string, vars: Record<string, any> | undefined) => Promise<GraphQLResponse>,
  dql: (s: string, vars: Record<string, any> | undefined) => Promise<GraphQLResponse>,
}
