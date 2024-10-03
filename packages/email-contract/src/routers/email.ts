import { z } from 'zod'
import { orpc } from '../orpc'
import {
  EmailListInputSchema,
  EmailSchema,
  EmailSendInputSchema,
} from '../schemas/email'

export const contractEmailSend = orpc
  .route({
    method: 'POST',
    path: '/',
    summary: 'Send an email',
  })
  .input(EmailSendInputSchema)
  .output(EmailSchema)
export const contractEmailSendBatch = orpc
  .route({
    method: 'POST',
    path: '/batch',
    summary: 'Send multiple emails',
  })
  .input(z.array(EmailSendInputSchema))
  .output(z.array(EmailSchema))

export const contractEmailList = orpc
  .route({
    method: 'GET',
    path: '/',
    summary: 'List emails',
  })
  .input(EmailListInputSchema)
  .output(z.array(EmailSchema))

export const contractEmailRouter = orpc.router({
  send: contractEmailSend,
  sendBatch: contractEmailSendBatch,
  list: contractEmailList,
})
