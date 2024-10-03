import { z } from 'zod'
import {
  SESBounceSchema,
  SESClickSchema,
  SESComplaintSchema,
  SESDeliveryDelaySchema,
  SESDeliverySchema,
  SESOpenSchema,
  SESRejectSchema,
  SESSubscriptionSchema,
} from '../types/ses'

export type EmailScheduledLog = z.infer<typeof EmailScheduledLogSchema>
export type EmailCancelledLog = z.infer<typeof EmailCancelledLogSchema>
export type EmailRejectedLog = z.infer<typeof EmailRejectedLogSchema>
export type EmailSentLog = z.infer<typeof EmailSentLogSchema>
export type EmailDeliveredLog = z.infer<typeof EmailDeliveredLogSchema>
export type EmailDelayedLog = z.infer<typeof EmailDelayedLogSchema>
export type EmailBouncedLog = z.infer<typeof EmailBouncedLogSchema>
export type EmailComplainedLog = z.infer<typeof EmailComplainedLogSchema>
export type EmailOpenedLog = z.infer<typeof EmailOpenedLogSchema>
export type EmailClickedLog = z.infer<typeof EmailClickedLogSchema>
export type EmailUnsubscribedLog = z.infer<typeof EmailUnsubscribedLogSchema>
export type EmailLog = z.infer<typeof EmailLogSchema>
export type EmailStatus = z.infer<typeof EmailStatusSchema>
export type Email = z.infer<typeof EmailSchema>
export type EmailSendBodyInput = z.infer<typeof EmailSendInputSchema>
export type EmailListQueryInput = z.infer<typeof EmailListInputSchema>

const TimestampSchema = z.number().int().min(0).describe('unix timestamp in seconds')

export const EmailScheduledLogSchema = z.object({
  type: z.literal('scheduled'),
  timestamp: TimestampSchema,
  until: TimestampSchema,
})

export const EmailCancelledLogSchema = z.object({
  type: z.literal('cancelled'),
  timestamp: TimestampSchema,
})

export const EmailRejectedLogSchema = z.object({
  type: z.literal('rejected'),
  timestamp: TimestampSchema,
  external: SESRejectSchema,
})

export const EmailSentLogSchema = z.object({
  type: z.literal('sent'),
  timestamp: TimestampSchema,
})

export const EmailDeliveredLogSchema = z.object({
  type: z.literal('delivered'),
  timestamp: TimestampSchema,
  external: SESDeliverySchema,
})

export const EmailDelayedLogSchema = z.object({
  type: z.literal('delayed'),
  timestamp: TimestampSchema,
  external: SESDeliveryDelaySchema,
})

export const EmailBouncedLogSchema = z.object({
  type: z.literal('bounced'),
  timestamp: TimestampSchema,
  external: SESBounceSchema,
})

export const EmailComplainedLogSchema = z.object({
  type: z.literal('complained'),
  timestamp: TimestampSchema,
  external: SESComplaintSchema,
})

export const EmailOpenedLogSchema = z.object({
  type: z.literal('opened'),
  timestamp: TimestampSchema,
  external: SESOpenSchema,
})

export const EmailClickedLogSchema = z.object({
  type: z.literal('clicked'),
  timestamp: TimestampSchema,
  external: SESClickSchema,
})

export const EmailUnsubscribedLogSchema = z.object({
  type: z.literal('unsubscribed'),
  timestamp: TimestampSchema,
  external: SESSubscriptionSchema,
})

export const EmailLogSchema = z.discriminatedUnion('type', [
  EmailScheduledLogSchema,
  EmailCancelledLogSchema,
  EmailRejectedLogSchema,
  EmailSentLogSchema,
  EmailDeliveredLogSchema,
  EmailDelayedLogSchema,
  EmailBouncedLogSchema,
  EmailComplainedLogSchema,
  EmailOpenedLogSchema,
  EmailClickedLogSchema,
  EmailUnsubscribedLogSchema,
])

export const emailStatusOrderedList = [
  // the order of the enum is important
  'scheduled', // INTERNAL: The email was scheduled to be sent.
  'cancelled', // INTERNAL: The email was cancelled before it was sent.
  'rejected', // Amazon SES accepted the email, but determined that it contained a virus and didn't attempt to deliver it to the recipient's mail server.
  'sent', // The send request was successful and Amazon SES will attempt to deliver the message to the recipient's mail server. (If account-level or global suppression is being used, SES will still count it as a send, but delivery is suppressed.)
  'delivered', // Amazon SES successfully delivered the email to the recipient's mail server.
  'delayed', // The email couldn't be delivered to the recipient's mail server because a temporary issue occurred. Delivery delays can occur, for example, when the recipient's inbox is full, or when the receiving email server experiences a transient issue.
  'bounced', // A hard bounce that the recipient's mail server permanently rejected the email. (Soft bounces are only included when SES is no longer retrying to deliver the email. Generally these soft bounces indicate a delivery failure, although in some cases a soft bounce can be returned even when the mail reaches the recipient inbox successfully. This typically occurs when the recipient sends an out-of-office automatic reply.
  'complained', // The email was successfully delivered to the recipient's mail server, but the recipient marked it as spam.
  'opened', // The recipient received the message and opened it in their email client.
  'clicked', // The recipient clicked one or more links in the email.
  'unsubscribed', // The email was successfully delivered, but the recipient updated the subscription preferences by clicking List-Unsubscribe in the email header or the Unsubscribe link in the footer.
] as const

export const EmailStatusSchema = z.enum(emailStatusOrderedList)

export const EmailSchema = z.object({
  id: z.string(),
  externalId: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),

  from: z.string(),
  to: z.array(z.string()).min(1),
  bcc: z.array(z.string()),
  cc: z.array(z.string()),
  replyTo: z.array(z.string()),

  subject: z.string(),
  text: z.string().optional(),
  html: z.string().optional(),
  markdown: z.string().optional(),

  headers: z.record(z.string()).default(() => ({})),
  tags: z.record(z.string()).default(() => ({})),

  logs: z.array(EmailLogSchema).default(() => []),
  status: EmailStatusSchema,
})

export const EmailSendInputSchema = z.object({
  from: z.string(),
  to: z
    .string()
    .or(z.array(z.string()).min(1))
    .transform((to) => (Array.isArray(to) ? to : [to])),
  bcc: z
    .string()
    .or(z.array(z.string()))
    .default(() => [])
    .transform((bcc) => (Array.isArray(bcc) ? bcc : [bcc])),
  cc: z
    .string()
    .or(z.array(z.string()))
    .default(() => [])
    .transform((cc) => (Array.isArray(cc) ? cc : [cc])),
  replyTo: z
    .string()
    .or(z.array(z.string()))
    .default(() => [])
    .transform((replyTo) => (Array.isArray(replyTo) ? replyTo : [replyTo])),

  subject: z.string(),
  text: z.string().optional(),
  html: z.string().optional(),
  markdown: z.string().optional(),

  headers: z.record(z.string()).default(() => ({})),
  tags: z.record(z.string()).default(() => ({})),

  attachments: z
    .array(
      z.object({
        inline: z.boolean().default(false),
        filename: z.string(),
        content: z.string().describe('base64 encoded or public url'),
        contentType: z.string().optional(),
        headers: z.record(z.string()).default(() => ({})),
        cid: z.string().optional(),
      })
    )
    .default(() => []),

  scheduledAt: z.coerce
    .date()
    .optional()
    .refine((v) => !v || v.getTime() > Date.now() - 1000 * 60, {
      message: 'Scheduled at must be in the future',
    }),
})

export const EmailListInputSchema = z.object({
  limit: z.number().min(1).max(100).default(10),
  cursor: z.number().default(0),
  keywords: z.string().optional(),
  status: EmailStatusSchema.optional(),
})
