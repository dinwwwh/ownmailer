import { orpc } from '../orpc'
import { contractEmailRouter } from './email'
import { contractIdentityRouter } from './identity'

export const contractAppRouter = orpc.router({
  identity: contractIdentityRouter.prefix('/identities'),
  email: contractEmailRouter.prefix('/emails'),
})
