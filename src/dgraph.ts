import fetch from 'node-fetch';
import { GraphQLResponse } from '@slash-graphql/lambda-types';

export async function graphql(query: string, variables: Record<string, any> = {}): Promise<GraphQLResponse> {
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

export async function dql(query: string, variables: Record<string, any> = {}): Promise<GraphQLResponse> {
  const response = await fetch(`${process.env.DGRAPH_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables })
  })
  if (response.status !== 200) {
    throw new Error("Failed to execute DQL Query")
  }
  return response.json();
}
