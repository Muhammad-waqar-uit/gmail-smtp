import nodemailer, { type Transporter, type SendMailOptions } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

export interface GmailConfig {
  /** Your full Gmail address. Falls back to GMAIL_USER. */
  user?: string;
  /** 16 character Google app password. Falls back to GMAIL_APP_PASSWORD. */
  appPassword?: string;
  /** Display name shown to recipients. Falls back to GMAIL_FROM_NAME. */
  fromName?: string;
  /** 465 (SSL, default) or 587 (STARTTLS). */
  port?: 465 | 587;
  /** Reuse connections when sending many emails. */
  pool?: boolean;
}

export interface MailInput {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: SendMailOptions["attachments"];
  headers?: SendMailOptions["headers"];
}

export interface SendResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

export class GmailMailer {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: GmailConfig = {}) {
    const user = config.user ?? process.env.GMAIL_USER;
    const rawPass = config.appPassword ?? process.env.GMAIL_APP_PASSWORD;
    const fromName = config.fromName ?? process.env.GMAIL_FROM_NAME;

    if (!user) throw new Error("Missing Gmail address. Pass `user` or set GMAIL_USER.");
    if (!rawPass) throw new Error("Missing app password. Pass `appPassword` or set GMAIL_APP_PASSWORD.");

    // Google shows app passwords in groups of four with spaces. Strip them.
    const pass = rawPass.replace(/\s+/g, "");
    const port = config.port ?? 465;

    this.from = fromName ? `"${fromName.replace(/"/g, "")}" <${user}>` : user;
    const options = {
      host: "smtp.gmail.com",
      port,
      secure: port === 465,
      pool: config.pool ?? false,
      auth: { user, pass },
    } as SMTPTransport.Options;
    this.transporter = nodemailer.createTransport(options);
  }

  /** Check that the credentials work without sending anything. */
  async verify(): Promise<true> {
    await this.transporter.verify();
    return true;
  }

  async send(mail: MailInput): Promise<SendResult> {
    if (!mail.text && !mail.html) {
      throw new Error("Provide `text` or `html` for the email body.");
    }
    const info = await this.transporter.sendMail({ from: this.from, ...mail });
    return {
      messageId: info.messageId,
      accepted: info.accepted.map(String),
      rejected: info.rejected.map(String),
    };
  }

  close(): void {
    this.transporter.close();
  }
}

export function createMailer(config?: GmailConfig): GmailMailer {
  return new GmailMailer(config);
}

export default createMailer;
