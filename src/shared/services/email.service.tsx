// import { Injectable } from '@nestjs/common'
// import { Resend } from 'resend'
// import { envConfig } from '../config'
// import OTPEmail from 'emails/otp'
// import * as React from 'react'

// @Injectable()
// export class EmailService {
//   private resend: Resend
//   constructor() {
//     this.resend = new Resend(envConfig.resendApiKey)
//   }

//   sendOTPEmail(payload: { email: string; code: string }) {
//     const subject = 'Your OTP Code'
//     return this.resend.emails.send({
//       from: `Online Movie Platform <onboarding@resend.dev>`,
//       to: 'duongquocnam224400@gmail.com',
//       subject,
//       react: <OTPEmail code={payload.code} title={subject} />,
//     })
//   }
// }
import { Injectable } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import { envConfig } from '../config'
import { render } from '@react-email/components'
import OTPEmail from 'emails/otp'
import React from 'react'

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: envConfig.emailHost,
      port: envConfig.emailPort,
      secure: true,
      auth: {
        user: envConfig.otpEmail,
        pass: envConfig.otpEmailPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })
  }

  async sendOtpEmail(payload: { email: string; code: string }) {
    const subject = 'Elearning - Xác thực Email'

    const htmlContent = await render(<OTPEmail code={payload.code} title={subject} />)

    const mailOptions = {
      from: {
        name: envConfig.otpEmailName,
        address: envConfig.otpEmail,
      },
      to: payload.email,
      subject,
      html: htmlContent,
    }

    return await this.transporter.sendMail(mailOptions)
  }

  async sendEnrollSuccessEmail(args: {
    to: string
    username: string
    courseTitle: string
    startUrl: string
    source?: 'purchase' | 'manual' | 'free'
  }) {
    const subject = `Đăng ký thành công: ${args.courseTitle}`
    const brand = '#6D28D9'
    const text = `Xin chào ${args.username}, bạn đã đăng ký khóa học "${args.courseTitle}" thành công. Bắt đầu học: ${args.startUrl}`

    const escHtml = (s: string) =>
      String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

    const ORDER_CODE = 'INV-DEMO-0001'
    const TRANSACTION_DATE = new Date().toISOString()
    const LIST_PRICE = 299_000 // Giá niêm yết (VND)
    const YOUR_PRICE = 99_000 // Giá của bạn (VND)
    const DISCOUNT = LIST_PRICE - YOUR_PRICE
    const TAX = 0
    const TOTAL = YOUR_PRICE + TAX

    function renderBill(data: {
      transactionDate: string
      transactionNumber: string
      courseName: string
      listPrice: number
      yourPrice: number
      subtotal: number
      taxRate: string
      tax: number
      credits: number
      total: number
      purchaserName: string
      paymentMethod: string
      sellerName: string
      sellerAddress: string
      helpUrl: string
    }) {
      const row = (l: string, r: string, bold = false) => `
    <tr>
      <td style="padding:6px 0;color:#6b7280;font-size:12px">${escHtml(l)}</td>
      <td align="right" style="padding:6px 0;${bold ? 'font-weight:700;' : ''}font-size:12px;color:#111827">${r}</td>
    </tr>`

      return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="border:1px solid #e5e7eb;border-radius:10px;background:#fff;font-family:Arial,Helvetica,sans-serif">
    <tr>
      <td style="padding:14px 16px">
        <div style="font-size:12px;color:#111827;line-height:1.6">
          <div><b>Transaction date:</b> ${escHtml(data.transactionDate)}</div>
          <div><b>Transaction number:</b> ${escHtml(data.transactionNumber)}</div>
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="margin-top:10px;border-collapse:collapse">
          <thead>
            <tr>
              <th align="left"  style="border-bottom:1px solid #e5e7eb;padding:8px 0;font-size:12px;color:#6b7280">Course name</th>
              <th align="right" style="border-bottom:1px solid #e5e7eb;padding:8px 0;font-size:12px;color:#6b7280">List price</th>
              <th align="right" style="border-bottom:1px solid #e5e7eb;padding:8px 0;font-size:12px;color:#6b7280">Your price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:10px 0;font-size:12px;color:#111827">${escHtml(data.courseName)}</td>
              <td align="right" style="padding:10px 0;font-size:12px">${currencyVND(data.listPrice)}</td>
              <td align="right" style="padding:10px 0;font-size:12px">${currencyVND(data.yourPrice)}</td>
            </tr>
          </tbody>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px">
          ${row('Subtotal:', currencyVND(data.subtotal))}
          ${row('Tax rate:', escHtml(data.taxRate))}
        </table>

        <div style="height:1px;background:#e5e7eb;margin:12px 0"></div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${row('Tax:', currencyVND(data.tax))}
          ${row('Credits:', currencyVND(data.credits))}
          ${row('Total:', currencyVND(data.total), true)}
        </table>

        <div style="height:1px;background:#e5e7eb;margin:14px 0"></div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;color:#111827">
          <tr>
            <td width="50%" valign="top" style="padding-right:10px">
              <div style="font-weight:700;margin-bottom:6px">Purchased by</div>
              <div style="margin-bottom:6px">${escHtml(data.purchaserName)}</div>
              <div style="color:#6b7280">Payment method: ${escHtml(data.paymentMethod)}</div>
            </td>
            <td width="50%" valign="top" style="padding-left:10px">
              <div style="font-weight:700;margin-bottom:6px">Sold by</div>
              <div>${escHtml(data.sellerName)}</div>
              <div style="color:#6b7280">${escHtml(data.sellerAddress)}</div>
            </td>
          </tr>
        </table>

        <div style="height:1px;background:#e5e7eb;margin:14px 0"></div>

        <div style="font-size:12px;color:#111827">
          <div style="font-weight:700;margin-bottom:6px">Need help?</div>
          <div>Visit our <a href="${escHtml(data.helpUrl)}" target="_blank" style="color:#2563eb">Help Center</a> for support.</div>
        </div>
      </td>
    </tr>
  </table>`
    }

    const currencyVND = (n: number) =>
      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)

    const billHtml = renderBill({
      transactionDate: '27/08/2025',
      transactionNumber: 'PD-CC-66D64B6E595857656B717945A413D3D', // demo
      courseName: args.courseTitle,
      listPrice: 399000,
      yourPrice: 0,
      subtotal: 0,
      taxRate: '0%',
      tax: 0,
      credits: 0,
      total: 0,
      purchaserName: args.username,
      paymentMethod: 'free method',
      sellerName: 'Elearning, Inc.',
      sellerAddress: '600 Harrison Street, 3rd Floor, San Francisco, CA 94107, US',
      helpUrl: 'https://your-domain.com/help',
    })
    const html = `
  <!doctype html>
  <html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escHtml(subject)}</title>
    <style>
      body { background:#f6f7fb; margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,Arial,sans-serif; color:#111827; }
      a { text-decoration:none; }
      .container { width:100%; max-width:640px; margin:24px auto; }
      .card { background:#fff; border:1px solid #e5e7eb; border-radius:14px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,.06); }
      .header { background:${brand}; color:#fff; text-align:center; padding:18px 16px; font-weight:700; letter-spacing:.3px; }
      .body { padding:24px 20px; }
      h1 { font-size:20px; margin:0 0 10px; line-height:1.35; }
      p { font-size:14px; line-height:1.7; margin:0 0 12px; color:#374151; }
      .pill { display:inline-block; font-size:12px; color:#6b7280; background:#f3f4f6; border-radius:999px; padding:6px 10px; margin-top:8px; }
      .hr { height:1px; background:#eef0f4; border:none; margin:16px 0; }
      .footer { text-align:center; font-size:12px; color:#9ca3af; padding:14px 10px 20px; }
      @media (prefers-color-scheme: dark) {
        body { background:#0b0f17; color:#e5e7eb; }
        .card { background:#0f1522; border-color:#1f2937; }
        p { color:#cbd5e1; }
        .pill { background:#111827; color:#9ca3af; }
        .hr { background:#1f2937; }
        .footer { color:#6b7280; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        <div class="header">Elearning</div>
        <div class="body">
          <h1> Đăng ký khóa học thành công!</h1>
          <p>Xin chào <b>${escHtml(args.username)}</b>,</p>
          <p>Bạn đã đăng ký khoá học <b>${escHtml(args.courseTitle)}</b> thành công.</p>
          <span class="pill">Nguồn: ${escHtml(args.source ?? 'purchase')}</span>

          <!-- CTA: BULLETPROOF BUTTON -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:18px auto 6px;">
            <tr>
              <td bgcolor="${brand}" style="border-radius:12px; mso-padding-alt:12px 20px; text-align:center;">
                <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml"
                    href="${escHtml(args.startUrl)}"
                    style="height:44px;v-text-anchor:middle;width:220px;"
                    arcsize="20%" strokecolor="${brand}" fillcolor="${brand}">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:Segoe UI,Arial,sans-serif;font-size:14px;font-weight:700;">
                      Bắt đầu học
                    </center>
                  </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-- -->
                <a href="${escHtml(args.startUrl)}"
                   target="_blank" rel="noopener"
                   style="
                     display:inline-block;
                     background:${brand};
                     color:#ffffff;
                     font-weight:700;
                     font-size:14px;
                     line-height:44px;
                     padding:0 20px;
                     border:1px solid ${brand};
                     border-radius:12px;
                   ">
                  Bắt đầu học
                </a>
                <!--<![endif]-->
              </td>
            </tr>
          </table>
          <!-- /CTA -->
          ${billHtml}
          <hr class="hr" />
          <p style="font-size:12px;color:#6b7280;">
            Nếu bạn không thực hiện thao tác này, có thể bỏ qua email. Mọi thắc mắc vui lòng phản hồi lại email để được hỗ trợ.
          </p>
        </div>
      </div>

      <div class="footer">© ${new Date().getFullYear()} Elearning. All rights reserved.</div>
    </div>
  </body>
  </html>
  `

    return this.transporter.sendMail({
      from: { name: envConfig.otpEmailName, address: envConfig.otpEmail },
      to: args.to,
      subject,
      text,
      html,
    })
  }

  async sendFeedbackReceivedEmail(args: { to: string; username?: string; title: string }) {
    const subject = 'Elearning - Cảm ơn bạn đã gửi Feedback'
    const username = args.username?.trim() || 'bạn'

    const html = `
    <!doctype html>
    <html lang="vi">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>${subject}</title>
      <style>
        body{background:#f6f7fb;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,Arial,sans-serif;color:#111827}
        .container{max-width:640px;margin:24px auto;padding:0 12px}
        .card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.06)}
        .header{background:#6D28D9;color:#fff;text-align:center;padding:16px 14px;font-weight:700}
        .body{padding:22px 18px}
        h1{font-size:18px;margin:0 0 10px}
        p{font-size:14px;line-height:1.7;margin:0 0 12px;color:#374151}
        .meta{font-size:12px;color:#6b7280;margin-top:8px}
        .footer{font-size:12px;color:#9ca3af;text-align:center;margin-top:14px}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">Elearning</div>
          <div class="body">
            <h1>Cảm ơn ${username} đã gửi feedback!</h1>
            <p>Chúng tôi đã nhận được phản hồi của bạn với tiêu đề:</p>
            <p><b>${args.title}</b></p>
            <p>Đội ngũ admin sẽ xem xét và phản hồi sớm nhất có thể. Bạn có thể trả lời lại email này nếu muốn bổ sung thông tin.</p>
            <div class="meta">Thời gian: ${new Date().toLocaleString('vi-VN')}</div>
          </div>
        </div>
        <div class="footer">© ${new Date().getFullYear()} Elearning</div>
      </div>
    </body>
    </html>`

    return this.transporter.sendMail({
      from: { name: envConfig.otpEmailName, address: envConfig.otpEmail },
      to: args.to,
      subject,
      html,
    })
  }

  private escape(s: string) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }
}
