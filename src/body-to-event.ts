import { GraphQLEventFields } from '@slash-graphql/lambda-types';

export function bodyToEvent(b: any): GraphQLEventFields {
  return {
    type: b.resolver,
    parents: b.parents || null,
    args: b.args || {},
    authHeader: b.authHeader,
    event: b.event || {},
  }
}
