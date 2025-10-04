class OTPGenerator {
  // Generowanie 6-cyfrowego kodu OTP
  static generate(length = 6) {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      otp += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    
    return otp;
  }

  // Obliczanie czasu wygaśnięcia OTP (domyślnie 10 minut)
  static getExpiryTime(minutes = 10) {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  // Walidacja OTP
  static isValid(otp, storedOTP, expiryTime) {
    if (!otp || !storedOTP || !expiryTime) {
      return false;
    }

    // Sprawdź czy OTP się zgadza
    if (otp !== storedOTP) {
      return false;
    }

    // Sprawdź czy OTP nie wygasł
    const now = new Date();
    const expiry = new Date(expiryTime);
    
    return now <= expiry;
  }

  // Generowanie losowego ciągu dla tokenów resetowania hasła
  static generateRandomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }
}

module.exports = OTPGenerator;