import { z } from 'zod'
import { orpc } from '../orpc'
import { IdentitySchema } from '../schemas/identity'

export const contractIdentityList = orpc
  .route({
    method: 'GET',
    path: '/',
    summary: 'List identities',
  })
  .output(z.array(IdentitySchema))

export const contractIdentityRouter = orpc.router({
  list: contractIdentityList,
})
