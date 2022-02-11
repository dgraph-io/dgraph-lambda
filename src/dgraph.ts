import fetch from 'node-fetch';
import { GraphQLResponse, AuthHeaderField } from '@slash-graphql/lambda-types';

function getHeaders(contentType: string) {
  const headers: Record<string, string> = {
    "Content-Type": contentType,
  }

  if(process.env.DGRAPH_TOKEN && process.env.DGRAPH_TOKEN != "") {
    headers["Dg-Auth"] = process.env.DGRAPH_TOKEN
  }

  if(process.env.DGRAPH_ACCESS_TOKEN && process.env.DGRAPH_ACCESS_TOKEN !=  "") {
    headers["X-Dgraph-AccessToken"] = process.env.DGRAPH_ACCESS_TOKEN
  }

  // This relies on a sneaky use of node-fetch. If you pass in
  // https://host1.com/url and pass Host: host2.net
  // Then node fetch will connect to host1.com, and verify SSL of host2.net,
  // and finally get host2.net/url
  // Cloud uses this by connecting to mutant over the internal network
  if(process.env.DGRAPH_HOST && process.env.DGRAPH_HOST != "") {
    headers["Host"] = process.env.DGRAPH_HOST;
  }

  return headers;
}

export async function graphql(query: string, variables: Record<string, any> = {}, authHeader?: AuthHeaderField): Promise<GraphQLResponse> {
  const headers = getHeaders("application/json")
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
    headers: getHeaders("application/json"),
    body: JSON.stringify({ query, variables })
  })
  if (response.status !== 200) {
    throw new Error("Failed to execute DQL Query")
  }
  return response.json();
}

async function dqlMutate(mutate: string | Object): Promise<GraphQLResponse> {
  const response = await fetch(`${process.env.DGRAPH_URL}/mutate?commitNow=true`, {
    method: "POST",
    headers: {
      "Content-Type": typeof mutate === 'string' ? "application/rdf" : "application/json",
      "X-Auth-Token": process.env.DGRAPH_TOKEN || ""
    },
    body: typeof mutate === 'string' ? mutate : JSON.stringify(mutate)
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
