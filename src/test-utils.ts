import fetch from 'node-fetch';
import sleep from 'sleep-promise';

export async function waitForDgraph() {
  const startTime = new Date().getTime();
  while(true) {
    try {
      const response = await fetch(`${process.env.DGRAPH_URL}/probe/graphql`)
      if(response.status === 200) {
        return
      }
    } catch(e) { }
    await sleep(100);
    if(new Date().getTime() - startTime > 20000) {
      throw new Error("Failed while waiting for dgraph to come up")
    }
  }
}

export async function loadSchema(schema: string, accessJWT:string = "") {
  const response = await fetch(`${process.env.DGRAPH_URL}/admin/schema`, {
    method: "POST",
    headers: { "Content-Type": "application/graphql", "X-Dgraph-AccessToken":accessJWT },
    body: schema
  })
  if(response.status !== 200) {
    throw new Error("Could Not Load Schema")
  }
}

export async function runAdmin(body: string, accessJWT:string = ""):Promise<any>{
  return fetch(`${process.env.DGRAPH_URL}/admin`, {
    method: "POST",
    headers: { "Content-Type": "application/graphql", "X-Dgraph-AccessToken":accessJWT  },
    body: body
  }).then((response) => {
  if (response.status !== 200) {
    throw new Error("Could Not Fire GraphQL Query")
  } else {
    return response.json()
  }
  }) 
}
export async function login(user: string, password: string, tenant: number) {
  const response = await fetch(`${process.env.DGRAPH_URL}/admin`, {
    method: "POST",
    headers: { "Content-Type": "application/graphql" },
    body: `mutation {
      login(userId: "${user}", password: "${password}", namespace: ${tenant}) {
        response {
          accessJWT
          refreshJWT
        }
      }
    }`
  })
  if(response.status !== 200) {
    throw new Error(`Could Not Login in tenant ${tenant} using ${user} and ${password}`)
  }
  let body = await response.json()
  console.log(body)
  let token = body["data"]["login"]["response"]["accessJWT"];
  return token
}

export async function runQuery(query: string, accessJWT:string = "") {
  const response = await fetch(`${process.env.DGRAPH_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/graphql", "X-Dgraph-AccessToken":accessJWT  },
    body: query
  })
  if (response.status !== 200) {
    throw new Error("Could Not Fire GraphQL Query")
  }
}


export async function addNamespace(password:string, accessJWT:string = ""):Promise<any> {
  const body = `mutation {
    addNamespace(input: {password: "${password}"})
     {
       namespaceId
       message
     }
   }`
  const response = await runAdmin(body,accessJWT)
  console.log(response)
  return response["data"]["addNamespace"]
}
