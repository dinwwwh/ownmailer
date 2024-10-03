#!/usr/bin/env node

/** dinwwwh */

import { serve } from '@hono/node-server'
import { generateOpenAPI } from '@orpc/openapi'
import { contractAppRouter } from '@ownmailer/email-contract'
import { Hono } from 'hono'
import process from 'node:process'

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
      })
    )
  })
  .get('/api/*', (c) => {
    // TODO:
    return c.notFound()
  })

const PORT = process.env.PORT ? Number.parseInt(process.env.PORT) : 2206
const HOST = process.env.HOST || '127.0.0.1'

serve({ fetch: app.fetch, hostname: HOST, port: PORT }).addListener('listening', () => {
  console.log(`Listening on http://${HOST}:${PORT}`)
})
