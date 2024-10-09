import { orpc, requiredAWSResources } from '../../orpc'

export const emailSendBatchProcedure = orpc.email.sendBatch
  .use(requiredAWSResources)
  .handler(async () => {
    // TODO: implement
    return []
  })
