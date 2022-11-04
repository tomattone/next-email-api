import type { NextApiRequest, NextApiResponse } from 'next'

import formData from 'form-data'
import Mailgun from 'mailgun.js'

type ResponseProps = {
  status: number
  message?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseProps>
) {
  // Wrong http method
  if (req.method !== 'POST') {
    res.status(400).json({ status: 400, message: 'Wrong http method' })
    return false
  }

  // Cors
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  )
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  try {
    // 1 - Setup Mailgun library
    const mailgun = new Mailgun(formData)
    const mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY || 'or_put_your_api_key_here',
    })

    // 2 - Setup required fields
    const domain = 'api.agenciaade.com.br'
    const fromEmail = `${req.body.as} <api@agenciaade.com.br>`
    const replyToEmail = `${req.body.as} <${req.body.from}>`
    const toEmails = req.body.to
    const subject = req.body.subject
    const message = req.body.message

    // 3 - Setup optional fields
    const ccEmails = req.body.cc ? req.body.cc : []
    const bccEmails = req.body.bcc ? req.body.bcc : []

    // 4 - Send email
    const sendResult: ResponseProps = await mg.messages.create(domain, {
      from: fromEmail,
      to: toEmails,
      'h:Reply-To': replyToEmail,
      cc: ccEmails,
      bcc: bccEmails,
      subject: subject,
      html: message,
      text: message.replace(/(<([^>]+)>)/gi, ''),
    })
    res.status(200).json({
      status: sendResult.status,
      message: sendResult.message,
    })
  } catch (error: any) {
    res.status(400).json({ status: 400, message: error.message })
  }
}
