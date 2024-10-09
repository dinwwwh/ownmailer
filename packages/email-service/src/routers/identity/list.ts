import {
  GetIdentityVerificationAttributesCommand,
  ListIdentitiesCommand,
} from '@aws-sdk/client-ses'
import { match } from 'ts-pattern'
import { orpc, requiredAWSResources } from '../../orpc'

export const identityListProcedure = orpc.identity.list
  .use(requiredAWSResources)
  .handler(async (_, context) => {
    const { Identities } = await context.sesClient.send(
      new ListIdentitiesCommand(),
    )

    if (!Identities?.length) {
      return []
    }

    const { VerificationAttributes } = await context.sesClient.send(
      new GetIdentityVerificationAttributesCommand({
        Identities,
      }),
    )

    return Object.entries(VerificationAttributes ?? {}).map(
      ([identity, attribute]) => ({
        identity,
        status: match(attribute.VerificationStatus)
          .with('NotStarted', () => 'not_started' as const)
          .with('Pending', () => 'pending' as const)
          .with('Failed', () => 'failed' as const)
          .with('TemporaryFailure', () => 'temporary_failure' as const)
          .with('Success', () => 'success' as const)
          .with(undefined, () => 'not_started' as const)
          .exhaustive(),
      }),
    )
  })
