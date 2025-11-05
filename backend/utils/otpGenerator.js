class OTPGenerator {
  static generate(length = 6) {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      otp += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    
    return otp;
  }

  static getExpiryTime(minutes = 30) {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  static isValid(otp, storedOTP, expiryTime) {
    if (!otp || !storedOTP || !expiryTime) {
      return false;
    }

    if (otp !== storedOTP) {
      return false;
    }

    const now = new Date();
    const expiry = new Date(expiryTime);
    
    return now <= expiry;
  }

  static generateRandomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }
}

export default new OTPGenerator()
