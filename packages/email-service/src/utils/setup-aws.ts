import {
  ConfigurationSetAlreadyExistsException,
  CreateConfigurationSetCommand,
  CreateConfigurationSetEventDestinationCommand,
  type CreateConfigurationSetEventDestinationCommandInput,
  EventDestinationAlreadyExistsException,
  SESClient,
  UpdateConfigurationSetEventDestinationCommand,
} from '@aws-sdk/client-ses'
import {
  CreateTopicCommand,
  SNSClient,
  SubscribeCommand,
} from '@aws-sdk/client-sns'
import {
  CreateQueueCommand,
  GetQueueAttributesCommand,
  GetQueueUrlCommand,
  QueueNameExists,
  SQSClient,
  SetQueueAttributesCommand,
} from '@aws-sdk/client-sqs'
import { guard } from 'radash'

function generateAWSConfigName(name: string) {
  return `ownmailer-${name}`
}

export async function setupAWS(opts: {
  baseConfigName: string
  region: string
  credentials: {
    accessKeyId: string
    secretAccessKey: string
  }
}): Promise<{
  configName: string
  region: string
  credentials: {
    accessKeyId: string
    secretAccessKey: string
  }
  queueUrl: string
}> {
  const ses = new SESClient({
    region: opts.region,
    credentials: opts.credentials,
  })
  const sns = new SNSClient({
    region: opts.region,
    credentials: opts.credentials,
  })
  const sqs = new SQSClient({
    region: opts.region,
    credentials: opts.credentials,
  })

  const configName = generateAWSConfigName(opts.baseConfigName)

  const queueAttributes = {
    Policy: JSON.stringify({
      Version: '2012-10-17',
      Id: '__default_policy_ID',
      Statement: [
        {
          Sid: '__all_statement',
          Effect: 'Allow',
          Principal: {
            AWS: '*',
          },
          Action: 'SQS:*',
          Resource: '*',
        },
      ],
    }),
  }

  const [, { TopicArn }, { QueueUrl }] = await Promise.all([
    guard(
      () =>
        ses.send(
          new CreateConfigurationSetCommand({
            ConfigurationSet: { Name: configName },
          }),
        ),
      (e) => e instanceof ConfigurationSetAlreadyExistsException,
    ),
    sns.send(new CreateTopicCommand({ Name: configName })),
    sqs
      .send(
        new CreateQueueCommand({
          QueueName: configName,
          Attributes: queueAttributes,
        }),
      )
      .catch(async (e) => {
        if (!(e instanceof QueueNameExists)) {
          throw e
        }

        const { QueueUrl } = await sqs.send(
          new GetQueueUrlCommand({ QueueName: configName }),
        )

        await sqs.send(
          new SetQueueAttributesCommand({
            QueueUrl,
            Attributes: queueAttributes,
          }),
        )

        return { QueueUrl }
      }),
  ])

  if (!TopicArn || !QueueUrl) {
    throw new Error('Something went wrong while creating AWS resources.')
  }

  const { Attributes } = await sqs.send(
    new GetQueueAttributesCommand({
      QueueUrl,
      AttributeNames: ['QueueArn'],
    }),
  )
  const QueueArn = Attributes?.QueueArn

  if (!QueueArn) {
    throw new Error('Something went wrong while creating AWS resources.')
  }

  const configurationSetEventDestinationInput = {
    ConfigurationSetName: configName,
    EventDestination: {
      Name: configName,
      Enabled: true,
      MatchingEventTypes: [
        'bounce',
        'complaint',
        'delivery',
        'reject',
        'open',
        'click',
      ],

      SNSDestination: {
        TopicARN: TopicArn,
      },
    },
  } satisfies CreateConfigurationSetEventDestinationCommandInput

  await Promise.all([
    sns.send(
      new SubscribeCommand({ TopicArn, Protocol: 'sqs', Endpoint: QueueArn }),
    ),
    ses
      .send(
        new CreateConfigurationSetEventDestinationCommand(
          configurationSetEventDestinationInput,
        ),
      )
      .catch((e) => {
        if (!(e instanceof EventDestinationAlreadyExistsException)) {
          throw e
        }

        return ses.send(
          new UpdateConfigurationSetEventDestinationCommand(
            configurationSetEventDestinationInput,
          ),
        )
      }),
  ])

  return {
    ...opts,
    configName: configName,
    queueUrl: QueueUrl,
  }
}
