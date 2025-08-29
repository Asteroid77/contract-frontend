const CHINA_MOBILE_PHONE_REGULAR: RegExp =
  /^1(3\d|4[5-9]|5[0-35-9]|6[2567]|7[0-8]|8\d|9[0-35-9])\d{8}$/

export const chinaMobilePhoneVerify = (phone: string): boolean => {
  return CHINA_MOBILE_PHONE_REGULAR.test(phone)
}
