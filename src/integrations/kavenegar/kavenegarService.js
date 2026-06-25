const KavenegarAPI = require("kavenegar").KavenegarApi;

const api = KavenegarAPI({ apikey: process.env.KAVENEGAR_API_KEY });

function sendOtp(phone, otp, otpWay) {
  return new Promise((resolve, reject) => {
    api.VerifyLookup(
      {
        receptor: phone,
        token: otp,
        template: process.env.KAVENEGAR_OTP_TEMPLATE,
        type: otpWay === "call" ? "voice" : "sms",
      },
      (response, status) => {
        if (status !== 200) {
          return reject(new Error(`Kavenegar error: status ${status}`));
        }
        resolve(response);
      }
    );
  });
}

module.exports = { sendOtp };