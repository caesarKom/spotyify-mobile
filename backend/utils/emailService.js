const nodemailer = require("nodemailer")

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
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
  }

  // Metoda do wysyłania OTP
  async sendOTP(email, otp, username = "") {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Twój kod weryfikacyjny - Spotify Clone",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; color: white;">
              <h1>Spotify Clone</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9; border-radius: 10px; margin-top: 20px;">
              <h2 style="color: #333;">Weryfikacja konta</h2>
              ${username ? `<p>Cześć ${username},</p>` : "<p>Cześć,</p>"}
              <p>Dziękujemy za rejestrację w naszej aplikacji! Aby dokończyć proces rejestracji, użyj poniższego kodu weryfikacyjnego:</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <h3 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h3>
              </div>
              
              <p><strong>Ten kod jest ważny przez 10 minut.</strong></p>
              
              <p>Jeśli nie rejestrowałeś się w naszej aplikacji, zignoruj tę wiadomość.</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              
              <p style="color: #666; font-size: 12px;">
                To jest wiadomość automatyczna. Prosimy na nią nie odpowiadać.
              </p>
            </div>
          </div>
        `,
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log("Email wysłany pomyślnie:", result.messageId)
      return { success: true, messageId: result.messageId }
    } catch (error) {
      console.error("Błąd podczas wysyłania emaila:", error)
      throw new Error("Nie udało się wysłać emaila z kodem weryfikacyjnym")
    }
  }

  // Metoda do wysyłania powitalnego emaila po weryfikacji
  async sendWelcomeEmail(email, username) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Witamy w Spotify Clone!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; color: white;">
              <h1>Spotify Clone</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9; border-radius: 10px; margin-top: 20px;">
              <h2 style="color: #333;">Witamy ${username}!</h2>
              <p>Dziękujemy za dołączenie do naszej społeczności! Twoje konto zostało pomyślnie zweryfikowane.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #667eea;">Co możesz teraz zrobić?</h3>
                <ul style="text-align: left; color: #333;">
                  <li>Przesyłać swoją muzykę</li>
                  <li>Tworzyć playlisty</li>
                  <li>Dzielić się muzyką z przyjaciółmi</li>
                  <li>Odkrywać nowe utwory</li>
                </ul>
              </div>
              
              <p>Miłego słuchania!</p>
              <p style="color: #666; font-size: 12px;">
                Zespół Spotify Clone
              </p>
            </div>
          </div>
        `,
      }

      await this.transporter.sendMail(mailOptions)
      console.log("Email powitalny wysłany")
    } catch (error) {
      console.error("Błąd podczas wysyłania emaila powitalnego:", error)
      // Nie rzucamy błędu, bo to nie jest krytyczne
    }
  }

  // Metoda do wysyłania emaila resetującego hasło (na przyszłość)
  async sendPasswordResetEmail(email, resetToken) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Reset hasła - Spotify Clone",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; color: white;">
              <h1>Spotify Clone</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9; border-radius: 10px; margin-top: 20px;">
              <h2 style="color: #333;">Reset hasła</h2>
              <p>Otrzymaliśmy prośbę o reset hasła do Twojego konta. Kliknij poniższy przycisk, aby ustawić nowe hasło:</p>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.CLIENT_URL}/reset-password?token=${resetToken}" 
                   style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Zresetuj hasło
                </a>
              </div>
              
              <p style="color: #666; font-size: 12px;">
                Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.
              </p>
            </div>
          </div>
        `,
      }

      await this.transporter.sendMail(mailOptions)
      console.log("Email resetujący hasło wysłany")
    } catch (error) {
      console.error("Błąd podczas wysyłania emaila resetującego:", error)
      throw new Error("Nie udało się wysłać emaila resetującego hasło")
    }
  }

  // Test połączenia z serwerem SMTP
  async testConnection() {
    try {
      await this.transporter.verify()
      console.log("Połączenie z serwerem email działa poprawnie")
      return true
    } catch (error) {
      console.error("Błąd połączenia z serwerem email:", error)
      return false
    }
  }
}

module.exports = new EmailService()
