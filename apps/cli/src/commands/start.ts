import process from 'node:process'
import {
  Command,
  InvalidOptionArgumentError,
} from '@commander-js/extra-typings'
import { serve } from '@hono/node-server'
import { generateOpenAPI } from '@orpc/openapi'
import { createRouterHandler } from '@orpc/server'
import { fetchHandler } from '@orpc/server/fetch'
import { contractAppRouter } from '@ownmailer/email-contract'
import { setupAWS } from '@ownmailer/email-service'
import { appRouter } from '@ownmailer/email-service'
import consola from 'consola'
import { Hono } from 'hono'

export const start = new Command()
  .name('start')
  .description('Start running the application server')
  .option(
    '--port <port>',
    'Port to listen on',
    (v) => {
      const port = Number.parseInt(v, 10)
      if (Number.isNaN(port) || port < 0 || port > 65535) {
        throw new InvalidOptionArgumentError(
          'Port must be a number between 0 and 65535',
        )
      }
      return port
    },
    2206,
  )
  .option('--host <host>', 'Host to listen on', '0.0.0.0')
  //   .option('--dir <directory>', 'Path to persistent data directory', ':memory:')
  //   .option('--api-key <api-key>', 'API key to use for authentication', 'secret')
  .option('--name <name>', 'Base name used for configurations', 'default')
  .option('--aws-region <name>', 'AWS region to use', 'us-east-1')
  .option(
    '--aws-access-key-id <aws-access-key-id>',
    'AWS access key ID to use (if not set, will use AWS_ACCESS_KEY_ID environment variables)',
    process.env.AWS_ACCESS_KEY_ID,
  )
  .option(
    '--aws-secret-access-key <aws-secret-access-key>',
    'AWS secret access key to use (if not set, will use AWS_SECRET_ACCESS_KEY environment variables)',
    process.env.AWS_SECRET_ACCESS_KEY,
  )
  .action(async (options) => {
    const aws = await (async () => {
      if (
        !options.awsAccessKeyId ||
        !options.awsSecretAccessKey ||
        !options.awsRegion
      ) {
        return undefined
      }

      consola.start('Setting up AWS resources...')
      const aws = await setupAWS({
        baseConfigName: options.name,
        region: options.awsRegion,
        credentials: {
          accessKeyId: options.awsAccessKeyId,
          secretAccessKey: options.awsSecretAccessKey,
        },
      })
      consola.success(
        'AWS resources set up successfully! with config name:',
        aws.configName,
      )
      return aws
    })()

    const emailRouterHandler = createRouterHandler({ router: appRouter })

    const app = new Hono()

    app
      .get('/api', (c) => {
        return c.html(`
            <!doctype html>
            <html>
              <head>
                <title>Ownmailer API Reference</title>
                <meta charset="utf-8" />
                <meta
                  name="viewport"
                  content="width=device-width, initial-scale=1" />
              </head>
              <body>
                <!-- Need a Custom Header? Check out this example https://codepen.io/scalarorg/pen/VwOXqam -->
                <script
                  id="api-reference"
                  data-url="/api/spec.json"></script>
                <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
              </body>
            </html>
            `)
      })
      .get('/api/spec.json', (c) => {
        return c.json(
          generateOpenAPI({
            router: contractAppRouter,
            info: {
              title: 'Ownmailer API',
              version: '0.0.0',
            },
            servers: [
              {
                url: new URL('/api', c.req.url).toString(),
              },
            ],
            security: [
              {
                bearerAuth: [],
              },
            ],
            components: {
              securitySchemes: {
                bearerAuth: {
                  type: 'http',
                  scheme: 'bearer',
                },
              },
            },
          }),
        )
      })
      .all('/api/*', (c) => {
        return fetchHandler({
          request: c.req.raw,
          prefix: '/api',
          handler: emailRouterHandler,
          context: { aws },
        })
      })

    serve({
      fetch: app.fetch,
      hostname: options.host,
      port: options.port,
    }).addListener('listening', () => {
      consola.info(`Listening on http://${options.host}:${options.port}/api`)
    })
  })
