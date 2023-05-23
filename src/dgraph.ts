import fetch from 'node-fetch';
import { GraphQLResponse, AuthHeaderField } from '@slash-graphql/lambda-types';

export async function graphql(query: string, variables: Record<string, any> = {}, authHeader?: AuthHeaderField, accessJWT?:string): Promise<GraphQLResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  // add graphql auth header is defined
  if (authHeader && authHeader.key && authHeader.value) {
    headers[authHeader.key] = authHeader.value;
  }
  // add user access token (login to tenant) if defined
  if (accessJWT && accessJWT!='') {
    headers["X-Dgraph-AccessToken"] = accessJWT;
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


export class dql {
  accessJWT: string | undefined;
 
  constructor(accessJWT?:string) {
    // keep access token (login to tenant) if defined
    // it will be used by dql.query and dql.mutate methods
    this.accessJWT = accessJWT
  }
  async query(query: string, variables: Record<string, any> = {}): Promise<GraphQLResponse> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    headers["X-Auth-Token"] = process.env.DGRAPH_TOKEN || "";
    // add user access token (login to tenant) if defined
    if (this.accessJWT && this.accessJWT!='') {
      headers["X-Dgraph-AccessToken"] = this.accessJWT;
    }
    const response = await fetch(`${process.env.DGRAPH_URL}/query`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ query, variables })
    })
    if (response.status !== 200) {
      throw new Error("Failed to execute DQL Query")
    }
    return response.json();
  }

  async mutate(mutate: string | Object): Promise<GraphQLResponse> {
    const headers: Record<string, string> = { };
    headers["Content-Type"] = typeof mutate === 'string' ? "application/rdf" : "application/json"
    headers["X-Auth-Token"] = process.env.DGRAPH_TOKEN || "";
    // add user access token (login to tenant) if defined
    if (this.accessJWT && this.accessJWT!='') {
      headers["X-Dgraph-AccessToken"] = this.accessJWT;
    }
    const response = await fetch(`${process.env.DGRAPH_URL}/mutate?commitNow=true`, {
      method: "POST",
      headers: headers,
      body: typeof mutate === 'string' ? mutate : JSON.stringify(mutate)
    })
    if (response.status !== 200) {
      throw new Error("Failed to execute DQL Mutate")
    }
    return response.json();
  }

}

