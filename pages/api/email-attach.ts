import fs from 'fs'
import {
  Attachment,
  EmailParams,
  MailerSend,
  Recipient,
  Sender,
} from 'mailersend'
import multiparty from 'multiparty'
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

  if (!req.headers['content-type']?.startsWith('multipart/form-data')) {
    res.status(400).json({ status: 400, message: 'Wrong content-type' })
    return false
  }

  try {
    // 1 - Setup MailerSend library
    const mailerSend = new MailerSend({
      apiKey: process.env.MAILERSEND_API_KEY || '',
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
    const { fields, files } = data

    // 3 - Set recipients
    let recipients: any = []
    if (req.body.to) {
      if (!Array.isArray(req.body.to)) {
        recipients = [new Recipient(req.body.to)]
      } else {
        req.body.to.forEach((recipient: string) => {
          recipients.push(new Recipient(recipient))
        })
      }
    }

    // 4 - Set carbon copy
    let cc: any = []
    if (req.body.cc) {
      if (!Array.isArray(req.body.cc)) {
        cc = [new Recipient(req.body.cc)]
      } else {
        req.body.cc.forEach((recipient: string) => {
          cc.push(new Recipient(recipient))
        })
      }
    }

    // 5 - Set blind carbon copy
    let bcc: any = []
    if (req.body.bcc) {
      if (!Array.isArray(req.body.bcc)) {
        bcc = [new Recipient(req.body.bcc)]
      } else {
        req.body.bcc.forEach((recipient: string) => {
          bcc.push(new Recipient(recipient))
        })
      }
    }

    // 6 - Set reply to
    let replyTo = new Sender(req.body.from, req.body.as)
    if (req.body.replyTo) {
      replyTo = new Sender(req.body.replyTo)
    }

    // 7 - multi attach
    const attachments: any = []
    if (files.attach && Array.isArray(files.attach)) {
      attachments.push(
        ...files.attach.map(
          (attachFile: { path: string; originalFilename: string }) => {
            const fileContent = fs.readFileSync(attachFile.path, {
              encoding: 'base64',
            })
            return new Attachment(
              fileContent,
              attachFile.originalFilename,
              'attachment'
            )
          }
        )
      )
    }

    // 8 - Setup required fields
    const subject = fields.subject[0]
    const message = fields.message[0]
    const sentFrom = new Sender(
      'api-mailersend-transaction@tomazzoni.net',
      fields.as[0]
    )

    // 9 - Send email
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setReplyTo(replyTo)
      .setTo(recipients)
      .setCc(cc)
      .setBcc(bcc)
      .setSubject(subject)
      .setHtml(message)
      .setText(message.replace(/(<([^>]+)>)/gi, ''))
      .setAttachments(attachments)

    await mailerSend.email.send(emailParams)

    // 10 - Send response
    res.status(200).json({
      status: 200,
      message: 'Queued. Thank you.',
    })
  } catch (error: any) {
    // 11 - Shit happens
    res.status(400).json({ status: 400, message: error.body.message })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default cors(handler)
