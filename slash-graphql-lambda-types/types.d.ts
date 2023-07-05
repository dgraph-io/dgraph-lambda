declare module "@slash-graphql/lambda-types" {
  type GraphQLResponse = {
    data?: Record<string, any>,
    errors?: { message: string }[]
  }

  type AuthHeaderField = {
    key: string | undefined,
    value: string | undefined
  }

  type InfoField = {
    field: selectionField 
  }

  type selectionField = {
    alias: string,
    name: string,
    arguments: Record<string, any>,
    directives: fldDirectiveList,
    selectionSet: selectionSet
  }

  type selectionSet = Array<selectionField>

  type fldDirectiveList = Array<fldDirective>

  type fldDirective = {
    name: string,
    arguments: Record<string, any>
  }

  type eventPayload = {
    __typename: string,
    operation: string,
    commitTs: number,
    add: addEvent | undefined,
    update: updateEvent | undefined,
    delete: deleteEvent | undefined
  }


  type addEvent = {
    add: {
      rootUIDs: Array<any>,  
      input: Array<any>
    } 
  }

  type updateEvent = {
    update: {
      rootUIDs: Array<any>,
      SetPatch: Object,
      RemovePatch: Object
    } 
  }

  type deleteEvent = {
    delete: {
      rootUIDs: Array<any>
    } 
  }
  // body structure of Alpha request
  // autHeader contains the key and value of the header used in GraphQL authorization
  // the auth key is sepcified in Dgraph.Authorization in the graphql schema
  // accessJWT is the optional user token, obtain after login to a tenant
  // accessJWT is used by lambda to call back the /graphq /query or /mutate endpoints 
  // accessJWT can also be decoded by the lambda code to get user id and namespace
  //    let payload=JSON.parse(atob(accessJWT.split('.')[1]))
  // type is $webhook for webhook calls.
   
  type GraphQLEventFields = {
    type: string,
    parents: (Record<string, any>)[] | null,
    args: Record<string, any>,
    authHeader?: AuthHeaderField,
    event?: eventPayload,
    info?: InfoField,
    accessJWT?: string
  }

  type ResolverResponse = any[] | Promise<any>[] | Promise<any[]>;

  type GraphQLEventCommonFields = {
    type: string;    
    respondWith: (r: ResolverResponse) => void;
    graphql: (s: string, vars: Record<string, any> | undefined, ah?: AuthHeaderField) => Promise<GraphQLResponse>;
    dql: {
      query: (s: string, vars: Record<string, any> | undefined) => Promise<GraphQLResponse>;
      mutate: (s: string) => Promise<GraphQLResponse>;
    };
    authHeader?: AuthHeaderField;
  };
  
  type GraphQLEvent = GraphQLEventCommonFields & {
    parents: Record<string, any>[] | null;
    args: Record<string, any>;
    info: InfoField;
  };
  
  type WebHookGraphQLEvent = GraphQLEventCommonFields & {
    event?: eventPayload;
  }; 

  type GraphQLEventWithParent = GraphQLEvent & {
    parent: Record<string, any> | null
  }

  function addGraphQLResolvers(resolvers: {
    [key: string]: (e: GraphQLEventWithParent) => any;
  }): void

  function addWebHookResolvers(resolvers: {
    [key: string]: (e: WebHookGraphQLEvent) => any;
  }): void

  function addMultiParentGraphQLResolvers(resolvers: {
    [key: string]: (e: GraphQLEvent) => ResolverResponse;
  }): void
}
