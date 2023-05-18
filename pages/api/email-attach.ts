import type { NextApiRequest, NextApiResponse } from 'next'

import { readFile } from 'fs/promises'

import formData from 'form-data'
import Mailgun from 'mailgun.js'
import multiparty from 'multiparty'

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

  if (!req.headers['content-type']?.startsWith('multipart/form-data')) {
    res.status(400).json({ status: 400, message: 'Wrong content-type' })
    return false
  }

  try {
    // 1 - Setup Mailgun library
    const mailgun = new Mailgun(formData)
    const mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY || 'or_put_your_api_key_here',
    })

    // 2 - Setup Multiparty library
    const form = new multiparty.Form()

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
    const domain = 'api.tomazzoni.net'
    const fromEmail = `${data.fields.as[0]} <${data.fields.from[0]}>`
    const replyToEmail = `${data.fields.as[0]} <${data.fields.from[0]}>`
    const toEmails = data.fields.to
    const subject = data.fields.subject[0]
    const message = data.fields.message[0]

    // 4 - Setup optional fields
    const ccEmails = data.fields.cc ? data.fields.cc : []
    const bccEmails = data.fields.bcc ? data.fields.bcc : []
    const attachFile = data.files.attach
      ? [
          {
            filename: data.files.attach[0].originalFilename,
            data: await readFile(data.files.attach[0].path),
          },
        ]
      : null

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
      attachment: attachFile,
    })
    res.status(200).json({
      status: sendResult.status,
      message: sendResult.message,
    })
  } catch (error: any) {
    res.status(400).json({ status: 400, message: error.message })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default cors(handler)
