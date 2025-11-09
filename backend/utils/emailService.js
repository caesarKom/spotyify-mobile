import nodemailer from "nodemailer"
import dotenv from "dotenv";
dotenv.config();

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

  // Send OTP
  export async function sendOTP(email, otp, username = "") {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Your verification code - Spotify Clone",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; color: white;">
              <h1>Spotify Clone</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9; border-radius: 10px; margin-top: 20px;">
              <h2 style="color: #333;">Account verification</h2>
              ${username ? `<p>Hello ${username},</p>` : "<p>Hello,</p>"}
              <p>Thank you for registering with our app! To complete the registration process, please use the verification code below.:</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <h3 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h3>
              </div>
              
              <p><strong>This code is valid for 30 minutes.</strong></p>
              
              <p>If you have not registered in our app, please ignore this message.</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              
              <p style="color: #666; font-size: 12px;">
                This is an automated message. Please do not respond.
              </p>
            </div>
          </div>
        `,
      }

      const result = await transporter.sendMail(mailOptions)
      console.log("Email sent successfully:", result.messageId)
      return { success: true, messageId: result.messageId }
    } catch (error) {
      console.error("Error while sending email:", error)
      throw new Error("Failed to send email with verification code")
    }
  }

 
export async function sendWelcomeEmail(email, username) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Welcome to Spotify Clone!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; color: white;">
              <h1>Spotify Clone</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9; border-radius: 10px; margin-top: 20px;">
              <h2 style="color: #333;">Welcome ${username}!</h2>
              <p>Thank you for joining our community! Your account has been successfully verified.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #667eea;">What can you do now?</h3>
                <ul style="text-align: left; color: #333;">
                  <li>Stream your music</li>
                  <li>Create playlists</li>
                  <li>Share music with friends</li>
                  <li>Discover new songs</li>
                </ul>
              </div>
              
              <p>Enjoy listening!</p>
              <p style="color: #666; font-size: 12px;">
                Spotify Clone Team
              </p>
            </div>
          </div>
        `,
      }

      await transporter.sendMail(mailOptions)
      console.log("Welcome email sent")
    } catch (error) {
      console.error("Error sending welcome email:", error)
    }
  }

export async function sendPasswordResetEmail(email, resetToken) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Password reset - Spotify Clone",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; color: white;">
              <h1>Spotify Clone</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9; border-radius: 10px; margin-top: 20px;">
              <h2 style="color: #333;">Password reset</h2>
              <p>We've received a request to reset your account password. Click the button below to set a new password:</p>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.CLIENT_URL}/reset-password?token=${resetToken}" 
                   style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Reset password
                </a>
              </div>
              
              <p style="color: #666; font-size: 12px;">
                If you have not requested a password reset, please ignore this message.
              </p>
            </div>
          </div>
        `,
      }

      await transporter.sendMail(mailOptions)
      console.log("Password reset email sent")
    } catch (error) {
      console.error("Error sending reset email:", error)
      throw new Error("Failed to send password reset email")
    }
  }


export async function testConnection() {
    try {
      await transporter.verify()
      console.log("The connection to the email server is working correctly")
      return true
    } catch (error) {
      console.error("Email server connection error: ", error)
      return false
    }
  }
