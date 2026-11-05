# gmail-smtp

A minimal TypeScript wrapper around [nodemailer](https://nodemailer.com/) for sending email through Gmail SMTP using an app password.

## Features

- Type-safe config and send API (`GmailConfig`, `MailInput`, `SendResult`)
- Supports both ESM and CommonJS
- Pool mode for high-volume sending
- Built-in app-password whitespace stripping
- `.verify()` to confirm credentials before sending

## Install

```sh
npm install gmail-smtp
```

Requires **Node.js 18+**.

## Quick Setup

1. Enable 2-Step Verification on your Google account.
2. Generate an app password at https://myaccount.google.com/apppasswords
3. Set environment variables:

```
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop   # spaces are fine — they get stripped
GMAIL_FROM_NAME=Your Name                 # optional
```

## Usage

```ts
import { createMailer } from "gmail-smtp";

const mailer = createMailer();

// Verify credentials first (optional but recommended)
await mailer.verify();

// Send plain text
await mailer.send({
  to: "someone@example.com",
  subject: "Hello",
  text: "Plain text body",
});

// Send HTML
await mailer.send({
  to: ["a@example.com", "b@example.com"],
  subject: "Report",
  html: "<p>HTML body</p>",
  cc: "lead@example.com",
  attachments: [{ filename: "report.pdf", path: "./report.pdf" }],
});

// Cleanup pool when done
mailer.close();
```

### Explicit config (no env vars)

```ts
const mailer = createMailer({
  user: "you@gmail.com",
  appPassword: "abcdefghijklmnop",
  fromName: "Your Name",
  port: 587,        // 465 (SSL) is default
  pool: true,       // reuse connections
});
```

## API

### `createMailer(config?: GmailConfig)`

Returns a new `GmailMailer` instance. Reads `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `GMAIL_FROM_NAME` from environment if not provided.

### `GmailConfig`

| Field | Type | Default | Description |
|---|---|---|---|
| `user` | `string` | `GMAIL_USER` env var | Full Gmail address |
| `appPassword` | `string` | `GMAIL_APP_PASSWORD` env var | 16-char Google app password |
| `fromName` | `string` | `GMAIL_FROM_NAME` env var | Display name for from address |
| `port` | `465 \| 587` | `465` | `465` = SSL, `587` = STARTTLS |
| `pool` | `boolean` | `false` | Reuse TCP connections |

### `MailInput`

| Field | Type | Required | Description |
|---|---|---|---|
| `to` | `string \| string[]` | ✅ | Recipient(s) |
| `subject` | `string` | ✅ | Email subject |
| `text` | `string` | ⚠️* | Plain-text body |
| `html` | `string` | ⚠️* | HTML body |
| `cc` | `string \| string[]` | | CC recipients |
| `bcc` | `string \| string[]` | | BCC recipients |
| `replyTo` | `string` | | Reply-to address |
| `attachments` | `SendMailOptions["attachments"]` | | File attachments |
| `headers` | `SendMailOptions["headers"]` | | Custom headers |

\* Either `text` or `html` must be provided.

### `GmailMailer` methods

- `verify(): Promise<true>` — Tests the connection; throws on bad credentials.
- `send(mail: MailInput): Promise<SendResult>` — Sends the email.
- `close(): void` — Destroys the connection pool.

### `SendResult`

```ts
{
  messageId: string;
  accepted: string[];   // successfully delivered addresses
  rejected: string[];   // failed addresses
}
```

## Gmail limits

- Personal accounts: ~500 recipients/day.
- Always send from the same address you authenticate with.
- For higher volumes consider Google Workspace or a transactional service (SendGrid, Postmark).

## License

MIT
