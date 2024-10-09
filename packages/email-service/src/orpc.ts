import { SESClient } from '@aws-sdk/client-ses'
import { SNSClient } from '@aws-sdk/client-sns'
import { SQSClient } from '@aws-sdk/client-sqs'
import { ORPCError, initORPC } from '@orpc/server'
import { contractAppRouter } from '@ownmailer/email-contract'

export type ORPCContext = {
  aws?: {
    configName: string
    region: string
    credentials: {
      accessKeyId: string
      secretAccessKey: string
    }
    queueUrl: string
  }
}

const o = initORPC.context<ORPCContext>()

export const orpc = o.contract(contractAppRouter)

export const requiredAWSResources = o.middleware(async (_, context) => {
  if (!context.aws) {
    throw new ORPCError({
      code: 'SERVICE_UNAVAILABLE',
      message: 'Please set up AWS resources first',
    })
  }

  const sesClient = new SESClient({
    region: context.aws.region,
    credentials: context.aws.credentials,
  })

  const snsClient = new SNSClient({
    region: context.aws.region,
    credentials: context.aws.credentials,
  })

  const sqsClient = new SQSClient({
    region: context.aws.region,
    credentials: context.aws.credentials,
  })

  return {
    context: {
      sesClient,
      snsClient,
      sqsClient,
    },
  }
})
