<div align="center">
  <h1>
    <br/>
    <br/>
    📩
    <br />
    next-email-api
    <br />
    <br />
    <br />
    <br />
  </h1>
  <div>
    <br />
    Send transactionals emails with Mailgun (https://mailgun.com) and Next.js (https://nextjs.org) (not spams 😅).
    <br />
    <br />
  
  </div>
  <br />
  <br />
</div>

<br />

# Set-up

Copy `.env.example` to `.env` and add your mailgun token. [Get your token here](https://app.mailgun.com/app/account/security/api_keys).
<br /><br />

# How to use

```http
POST /email
```

| Param     | Type     | Required? | Description                 | Example                                                         |
| :-------- | :------- | :-------- | :-------------------------- | :-------------------------------------------------------------- |
| `to`      | `ARRAY`  | yes       | Address to                  | `test@example.com` or `[test1@example.com, test2@example.com]`  |
| `from`    | `STRING` | yes       | Address from                | `test@example.com`                                              |
| `as`      | `STRING` | yes       | Send as                     | `Full name `                                                    |
| `subject` | `STRING` | yes       | Message subject             | `Sending an e-mail to you`                                      |
| `message` | `STRING` | yes       | Message body                | `<p>Body in HTML</p>`                                           |
| `cc`      | `ARRAY`  | no        | Carbon copy addresses       | `copy1@example.com` or `[copy1@example.com, copy2@example.com]` |
| `bcc`     | `ARRAY`  | no        | Blind carbon copy addresses | `copy1@example.com` or `[copy1@example.com, copy2@example.com]` |
| `attach`  | `FILE`   | no        | Attachments files           | `file`                                                          |
