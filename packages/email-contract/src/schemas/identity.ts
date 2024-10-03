import { z } from 'zod'

export type IdentityVerificationStatus = z.infer<typeof IdentityVerificationStatusSchema>
export type Identity = z.infer<typeof IdentitySchema>

export const IdentityVerificationStatusSchema = z.enum([
  'failed',
  'not_started',
  'pending',
  'success',
  'temporary_failure',
])

export const IdentitySchema = z.object({
  identity: z.string(),
  status: IdentityVerificationStatusSchema,
})
