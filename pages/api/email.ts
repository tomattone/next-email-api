import type { NextApiRequest, NextApiResponse } from 'next'

import cors from '../../utils/cors'
import { Resend } from 'resend'

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
    // 1 - Setup Resend library
    const resend = new Resend(process.env.SMTP_PASS)

    // 2 - Set recipients
    let recipients: any = []
    if (req.body.to) {
      if (!Array.isArray(req.body.to)) {
        recipients = [req.body.to]
      } else {
        req.body.to.forEach((recipient: string) => {
          recipients.push(recipient)
        })
      }
    }

    // 3 - Set carbon copy
    let cc: any = []
    if (req.body.cc) {
      if (!Array.isArray(req.body.cc)) {
        cc = [req.body.cc]
      } else {
        req.body.cc.forEach((recipient: string) => {
          cc.push(recipient)
        })
      }
    }

    // 4 - Set blind carbon copy
    let bcc: any = []
    if (req.body.bcc) {
      if (!Array.isArray(req.body.bcc)) {
        bcc = [req.body.bcc]
      } else {
        req.body.bcc.forEach((recipient: string) => {
          bcc.push(recipient)
        })
      }
    }

    // 5 - Set reply to
    let replyTo = req.body.from
    if (req.body.replyTo) {
      replyTo = req.body.replyTo
    }

    // 6 - Setup required fields
    const subject = req.body.subject
    const message = req.body.message
    const sentFrom = req.body.as + '<api-mailersend-transaction@tomazzoni.net>'

    // 7 - Send email
    const { data, error } = await resend.emails.send({
      from: sentFrom,
      replyTo: replyTo,
      to: recipients,
      cc: cc,
      bcc: bcc,
      subject: subject,
      html: message,
      text: message.replace(/(<([^>]+)>)/gi, ''),
    })

    // 8 - Shit happens
    if (error) {
      return res.status(400).json({ status: 400, message: error.message })
    }

    // 9 - Send response
    res.status(200).json({
      status: 200,
      message: 'Queued. Thank you. ID: ' + data.id,
    })
  } catch (error: any) {
    res.status(400).json({ status: 400, message: error.message })
  }
}

export default cors(handler)
