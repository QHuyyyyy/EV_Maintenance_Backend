import nodemailer from 'nodemailer';

const FROM_EMAIL = 'evmaintenaceapp@gmail.com';
const APP_NAME = 'EV Maintenance';
const OTP_EXPIRE_MINUTES = 10;

let transporter: nodemailer.Transporter | null = null;
transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    }
});


export async function sendOtpEmail(to: string, otp: string) {
    const subject = `${APP_NAME} — Your verification code`;

    const preheader = `Use this code to complete your ${APP_NAME} registration. It expires in ${OTP_EXPIRE_MINUTES} minutes.`;

    const text = `Hi,

Use the following verification code to complete your ${APP_NAME} registration:

${otp}

This code will expire in ${OTP_EXPIRE_MINUTES} minutes.

If you did not request this, you can ignore this email.

Thanks,
${APP_NAME} Team`;

    const html = `
        <html>
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background:#f6f9fc; color:#333; margin:0; padding:0; }
                    .container { max-width:600px; margin:24px auto; background:#ffffff; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.08); overflow:hidden; }
                    .header { background: linear-gradient(90deg,#0b74de,#0b9adf); padding:20px; color:white; text-align:center; }
                    .content { padding:24px; }
                    .otp { display:block; margin:20px auto; width:fit-content; padding:14px 22px; font-size:28px; letter-spacing:4px; background:#f4f7fb; border-radius:8px; border:1px solid #e6eefb; }
                    .note { color:#666; font-size:13px; margin-top:8px; }
                    .footer { padding:16px 24px; font-size:12px; color:#888; background:#fbfcfe; text-align:center; }
                    a { color:#0b74de; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2 style="margin:0">${APP_NAME}</h2>
                    </div>
                    <div class="content">
                        <p style="margin:0 0 8px 0;">Hi,</p>
                        <p style="margin:0 0 16px 0;">Use the verification code below to complete your registration. This code will expire in <strong>${OTP_EXPIRE_MINUTES} minutes</strong>.</p>
                        <div class="otp">${otp}</div>
                        <p class="note">If you did not request this code, you can safely ignore this email. For assistance, reply to this message or contact our support.</p>
                    </div>
                    <div class="footer">© ${new Date().getFullYear()} ${APP_NAME} — <a href="mailto:${FROM_EMAIL}">Contact support</a></div>
                </div>
            </body>
        </html>
        `;

    if (!transporter) {
        // prettier console mock for dev
        console.log('---');
        console.log(`📨 [EMAIL MOCK] To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(preheader);
        console.log('');
        console.log(text);
        console.log('---');
        return;
    }

    await transporter.sendMail({
        from: FROM_EMAIL,
        to,
        subject,
        text,
        html
    });
}

export default { sendOtpEmail };
