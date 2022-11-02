import type { NextApiRequest, NextApiResponse } from 'next'

import { readFile } from 'fs/promises'

import formData from 'form-data'
import Mailgun from 'mailgun.js'
import multiparty from 'multiparty'

type EmailProps = {
  to: string
  as: string
  from: string
  cc?: string
  bcc?: string
  subject: string
  message: string
  attach?: File
}

type ResponseProps = {
  status: number
  message?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseProps>
) {
  // 1 - Setup Mailgun library
  const mailgun = new Mailgun(formData)
  const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY || 'or_put_your_api_key_here',
  })

  // 2 - Setup Multiparty library
  const form = new multiparty.Form({
    uploadDir: './public/uploads/',
  })

  // 2.1 - Get data from request
  const data: any = await new Promise((resolve, reject) => {
    form.parse(req, function (err, fields, files) {
      if (err) {
        res.status(400).json({ status: 500, message: err.message })
        reject({ err })
      }
      resolve({ fields, files })
    })
  })

  // 3 - Setup required fields
  const domain = 'api.agenciaade.com.br'
  const fromEmail = `${data.fields.as[0]} <api@agenciaade.com.br>`
  const replyToEmail = `${data.fields.as[0]} <${data.fields.from[0]}>`
  const toEmails = data.fields.to
  const subject = data.fields.subject[0]
  const message = data.fields.message[0]

  // 4 - Setup optional fields
  const ccEmails = data.fields.cc ? data.fields.cc : []
  const bccEmails = data.fields.bcc ? data.fields.bcc : []
  const attachFile = data.files.attach
    ? {
        filename: data.files.attach[0].originalFilename,
        data: await readFile(data.files.attach[0].path),
      }
    : {}

  try {
    // Wrong http method
    if (req.method !== 'POST') {
      res.status(400).json({ status: 400, message: 'Not found' })
    }

    // 5 - Send email
    const sendResult: ResponseProps = await mg.messages.create(domain, {
      from: fromEmail,
      to: toEmails,
      'h:Reply-To': replyToEmail,
      cc: ccEmails,
      bcc: bccEmails,
      subject: subject,
      html: message,
      text: message.replace(/(<([^>]+)>)/gi, ''),
      attachment: [attachFile],
    })
    res.status(200).json({
      status: sendResult.status,
      message: sendResult.message,
    })
  } catch (error: any) {
    res.status(400).json({ status: 400, message: error })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
