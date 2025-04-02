import fs from 'fs'
import multiparty from 'multiparty'
import type { NextApiRequest, NextApiResponse } from 'next'
import sendpulse from 'sendpulse-api'

import cors from '../../utils/cors'

var API_USER_ID = process.env.API_USER_ID || ''
var API_SECRET = process.env.API_SECRET || ''
var TOKEN_STORAGE = "/tmp/";

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
    // 1 - Setup Sendpulse library
    sendpulse.init(API_USER_ID, API_SECRET, TOKEN_STORAGE, function (token: any) {
      if (token && token.is_error) {
        res.status(400).json({ status: 500, message: token.error })
        return false
      }
    })

    var answerGetter = function (data: any) {
      console.log(data);
    }


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

    const attachments: any = [];
    if (files.attach && Array.isArray(files.attach)) {
      attachments.push(
        ...files.attach.map((attachFile: { path: string, originalFilename: string }) => {
          const fileContent = fs.readFileSync(attachFile.path, { encoding: 'base64' });
          return {
            "name": attachFile.originalFilename,
            "content": fileContent
          }
        })
      );
    };

    var email = {
      "html": fields.message[0],
      "text": fields.message[0].replace(/(<([^>]+)>)/gi, ""),
      "subject": fields.subject[0],
      "from": {
        "name": fields.as[0],
        "email": "oi@tomazzoni.net"
      },
      "to": [
        {
          "name": fields.to[0],
          "email": fields.to[0]
        },
      ],
      "cc": [
        {
          "name": fields.cc,
          "email": fields.cc
        },
      ],
      "bcc": [
        {
          "name": fields.bcc,
          "email": fields.bcc
        },
      ],
      "attachments": attachments
    };

    // 3 - Setup required fields
    // const subject = fields.subject[0]
    // const message = fields.message[0]
    // const replyTo = new Sender(fields.from[0], fields.as[0])
    // const recipients = [new Recipient(fields.to[0])]
    // const sentFrom = new Sender(
    //   'api-mailersend-transaction@tomazzoni.net',
    //   fields.as[0]
    // )

    // 4 - Setup optional fields
    // const cc = fields.cc ? [new Recipient(fields.cc)] : []
    // const bcc = fields.bcc ? [new Recipient(fields.bcc)] : []

    // 4.1 - multi attach
    // const attachments: any = [];
    // if (files.attach && Array.isArray(files.attach)) {
    //   attachments.push(
    //     ...files.attach.map((attachFile: { path: string, originalFilename: string }) => {
    //       const fileContent = fs.readFileSync(attachFile.path, { encoding: 'base64' });
    //       return new Attachment(fileContent, attachFile.originalFilename, 'attachment');
    //     })
    //   );
    // }

    // 5 - Send email
    sendpulse.smtpSendMail(answerGetter, email);

    // 6 - Send response
    res.status(200).json({
      status: 200,
      message: 'Queued. Thank you.',
    })
  } catch (error: any) {
    // 7 - Shit happens
    res.status(400).json({ status: 400, message: error.body.message })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default cors(handler)
