import { orpc, requiredAWSResources } from '../../orpc'

export const emailSendProcedure = orpc.email.send
  .use(requiredAWSResources)
  .handler(async () => {
    // TODO: implement
    return {} as any
  })
