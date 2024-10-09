import { orpc } from '../orpc'
import { contractEmailRouter } from './email'
import { contractIdentityRouter } from './identity'

export const contractAppRouter = orpc.router({
  identity: orpc.prefix('/identities').router(contractIdentityRouter),
  email: orpc.prefix('/emails').router(contractEmailRouter),
})
