import type { NextApiRequest, NextApiResponse } from 'next'
import { createTransport } from 'nodemailer'

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

  // 1 - Setup Nodemailer
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  const transporter = createTransport({
    host: host,
    port: port,
    auth: {
      user: user,
      pass: pass
    }
  });

  // 1.1 - Verify connection configuration
  transporter.verify(function (error) {
    if (error) {
      res.status(535).json({ status: 535, message: error.message })
    }
  });

  try {
    // 2 - Send email
    const fields = req.body
    const mail = await transporter.sendMail({
      from: `${fields.as} <oi@tomazzoni.net>`,
      to: fields.to,
      replyTo: fields.to,
      subject: fields.subject,
      html: fields.message,
      text: fields.message.replace(/<[^>]*>?/gm, ''),
      cc: fields.cc,
      bcc: fields.bcc
    })

    res.status(200).json({ status: 200, message: mail.response })

  } catch (error: any) {
    res.status(400).json({ status: 400, message: error.message })
  }
}

export default cors(handler)
