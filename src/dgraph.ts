import fetch from 'node-fetch';

export async function graphql(query: string, variables: Record<string, any> | undefined = {}): Promise<GraphQLResponse> {
  const response = await fetch(`${process.env.DGRAPH_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({query, variables})
  })
  if(response.status !== 200) {
    throw new Error("Failed to execute GraphQL Query")
  }
  return response.json();
}

export async function dql(query: string, vars: Record<string, any>): Promise<GraphQLResponse> {
  return { data: {} }
}
