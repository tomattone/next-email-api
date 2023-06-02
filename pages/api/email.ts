import { EmailParams, MailerSend, Recipient, Sender } from 'mailersend'
import type { NextApiRequest, NextApiResponse } from 'next'

import cors from '../../utils/cors'

type ResponseProps = {
  status: number
  message?: string
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseProps>
) {
  // Wrong http method
  if (req.method !== 'POST') {
    res.status(400).json({ status: 400, message: 'Wrong http method' })
    return false
  }

  // Wrong content-type
  if (req.headers['content-type'] != 'application/json') {
    res.status(400).json({ status: 400, message: 'Wrong content-type' })
    return false
  }

  try {
    // 1 - Setup MailerSend library
    const mailerSend = new MailerSend({
      apiKey: process.env.MAILERSEND_API_KEY || '',
    })

    // 2 - Setup required fields
    const subject = req.body.subject
    const message = req.body.message
    const replyTo = new Sender(req.body.from, req.body.as)
    const recipients = [new Recipient(req.body.to)]
    const sentFrom = new Sender(
      'api-mailersend-transaction@tomazzoni.net',
      req.body.as
    )

    // 3 - Setup optional fields
    const cc = req.body.cc ? [new Recipient(req.body.cc)] : []
    const bcc = req.body.bcc ? [new Recipient(req.body.bcc)] : []

    // 4 - Send email
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setReplyTo(replyTo)
      .setTo(recipients)
      .setCc(cc)
      .setBcc(bcc)
      .setSubject(subject)
      .setHtml(message)
      .setText(message.replace(/(<([^>]+)>)/gi, ''))

    await mailerSend.email.send(emailParams)

    // 5 - Send response
    res.status(200).json({
      status: 200,
      message: 'Queued. Thank you.',
    })
  } catch (error: any) {
    // 6 - Shit happens
    res.status(400).json({ status: 400, message: error.body.message })
  }
}

export default cors(handler)
