import fs from 'fs'
import multiparty from 'multiparty'
import type { NextApiRequest, NextApiResponse } from 'next'

import cors from '../../utils/cors'
import { Resend } from 'resend'
import path from 'path'

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
    // 1 - Setup Resend library
    const resend = new Resend(process.env.SMTP_PASS)

    // 2 - Setup Multiparty library
    const form = new multiparty.Form()

    // 2.1 - Get data from request
    const ReqData: any = await new Promise((resolve, reject) => {
      form.parse(req, function (err, fields, files) {
        if (err) {
          res.status(400).json({ status: 500, message: err.message })
          reject({ err })
        }
        resolve({ fields, files })
      })
    })
    const { fields, files } = ReqData

    // 3 - Setup required fields
    const subject = fields.subject[0]
    const message = fields.message[0]
    const replyTo = fields.from[0]
    const recipients = [fields.to[0]]
    const sentFrom = fields.as[0] + '<noreply@transacional.tomazzoni.net>'

    // 4 - Setup optional fields
    const cc = fields.cc ? [fields.cc] : []
    const bcc = fields.bcc ? [fields.bcc] : []

    // 4.1 - multi attach
    const attachments: any = []
    if (files.attach && Array.isArray(files.attach)) {
      attachments.push(
        ...files.attach.map(
          (attachFile: { path: string; originalFilename: string }) => {
            const fileContent = fs.readFileSync(attachFile.path, {
              encoding: 'base64',
            })
            return {
              content: fileContent,
              filename: attachFile.originalFilename,
            }
          }
        )
      )
    }

    // 5 - Send email
    const { data, error } = await resend.emails.send({
      from: sentFrom,
      replyTo: replyTo,
      to: recipients,
      cc: cc,
      bcc: bcc,
      subject: subject,
      html: message,
      text: message.replace(/(<([^>]+)>)/gi, ''),
      attachments: attachments,
    })

    // 6 - Shit happens
    if (error) {
      return res.status(400).json({ status: 400, message: error.message })
    }

    // 7 - Send response
    res.status(200).json({
      status: 200,
      message: 'Queued. Thank you. ID: ' + data.id,
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
