import { orpc } from '../orpc'
import { emailListProcedure } from './email/list'
import { emailSendProcedure } from './email/send'
import { emailSendBatchProcedure } from './email/send-batch'
import { identityListProcedure } from './identity/list'

export const appRouter = orpc.router({
  email: {
    list: emailListProcedure,
    send: emailSendProcedure,
    sendBatch: emailSendBatchProcedure,
  },
  identity: {
    list: identityListProcedure,
  },
})
