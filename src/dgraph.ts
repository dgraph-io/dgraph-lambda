import fetch from 'node-fetch';
import { GraphQLResponse, AuthHeaderField } from '@slash-graphql/lambda-types';

export async function graphql(query: string, variables: Record<string, any> = {}, authHeader?: AuthHeaderField): Promise<GraphQLResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authHeader && authHeader.key && authHeader.value) {
    headers[authHeader.key] = authHeader.value;
  }
  const response = await fetch(`${process.env.DGRAPH_URL}/graphql`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables })
  })
  if (response.status !== 200) {
    throw new Error("Failed to execute GraphQL Query")
  }
  return response.json();
}

async function dqlQuery(query: string, variables: Record<string, any> = {}): Promise<GraphQLResponse> {
  const response = await fetch(`${process.env.DGRAPH_URL}/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": process.env.DGRAPH_TOKEN || ""
    },
    body: JSON.stringify({ query, variables })
  })
  if (response.status !== 200) {
    throw new Error("Failed to execute DQL Query")
  }
  return response.json();
}

async function dqlMutate(mutate: string | any): Promise<GraphQLResponse> {
  const response = await fetch(`${process.env.DGRAPH_URL}/mutate?commitNow=true`, {
    method: "POST",
    headers: {
      "Content-Type": typeof mutate === 'object' ? "application/json" : "application/rdf",
      "X-Auth-Token": process.env.DGRAPH_TOKEN || ""
    },
    body: typeof mutate === 'object' ? JSON.stringify(mutate) : mutate
  })
  if (response.status !== 200) {
    throw new Error("Failed to execute DQL Mutate")
  }
  return response.json();
}

export const dql = {
  query: dqlQuery,
  mutate: dqlMutate,
}
