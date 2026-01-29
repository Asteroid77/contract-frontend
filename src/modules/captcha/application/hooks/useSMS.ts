import dexie from '@/app/infrastructure/storage/dexie'
import type { RestSmsCd } from '@/app/infrastructure/storage/dexie/defineRestSMSCd'
import { $t } from '@/_utils/i18n'
import { captchaService } from '@/modules/captcha/application/service'
import type { SMSSendResponse } from '@/modules/captcha/application/models'
import { useMutation } from '@tanstack/vue-query'
import { match } from 'ts-pattern'
import { computed, ref, type ComputedRef, type Ref } from 'vue'

const COOL_DOWN_TIME = 60
const smsInfoStore: { [key: string]: Ref<number> } = {}
const timerStore: Record<string, ReturnType<typeof setInterval>> = {}
/**
 * SMS相关复用逻辑
 * @returns {Object} 验证码功能相关函数对象
 * @property {function(phoneNumber: string): ComputedRef<string>} getSendBtnLabelText 获取当前手机号对应的发送按钮文案
 * @property {function(phoneNumber: string): Ref<number>} getSMSCoolDownSecond 获取当前手机号对应的发送冷却时间
 * @property {function():UseMutationReturnType<SMSSendResponse,unknown,string,string>} sendSMSCode 发送手机验证码
 */
export function useSMS() {
  return { getSendBtnLabelText, getSMSCoolDownSecond, sendSMSCode }
}

/**
 * 发送手机验证码
 * @return {UseMutationReturnType<SMSSendResponse,unknown,string,string>} mutation执行对象
 */
function sendSMSCode() {
  return useMutation<SMSSendResponse, unknown, string>({
    mutationKey: ['sms'],
    mutationFn: (phone: string) => captchaService.sendSmsCode(phone),
    onSuccess: async (_data: SMSSendResponse, phone: string) => {
      const result = await _querySMSInfoByPhoneNumber(phone)
      const restSeconds = COOL_DOWN_TIME
      const time = new Date(Date.now() - (COOL_DOWN_TIME - restSeconds) * 1000)
      match(result)
        .with(undefined, () => {
          dexie.restcd.add({
            phone,
            time,
          })
        })
        .otherwise(() => {
          dexie.restcd.put({
            id: result?.id,
            phone,
            time,
          })
        })
      smsInfoStore[phone].value = restSeconds
      coolDown(phone)
    },
  })
}
/**
 * 获取验证码发送按钮的文案
 * @param {string} phoneNumber
 * @return Ref<string> 返回验证码发送按钮文案
 */
function getSendBtnLabelText(phoneNumber: string): ComputedRef<string> {
  if (!phoneNumber) {
    return computed(() => $t('captcha.sms.empty'))
  }
  const cooldownSecond: Ref<number> = getSMSCoolDownSecond(phoneNumber)
  const prefix = $t('captcha.sms.prefix')
  const suffix = $t('captcha.sms.suffix')

  return computed(() => {
    // 冷却时间直接有值时，返回获取到的冷却时间。
    if (cooldownSecond.value) {
      return `${prefix}${cooldownSecond.value}${suffix}`
    }
    // 直接返回发送文案
    return $t('actions.send')
  })
}

/**
 * 获取手机验证码的发送冷却时间
 * @param {string} phoneNumber 手机号
 * @return {Ref<number>} 返回一个带有倒计时功能的冷却时间
 */
function getSMSCoolDownSecond(phoneNumber: string): Ref<number> {
  // 如果已存在且在倒计时中，直接返回
  if (smsInfoStore[phoneNumber]?.value > 0) {
    return smsInfoStore[phoneNumber]
  }

  if (!smsInfoStore.hasOwnProperty(phoneNumber)) {
    smsInfoStore[phoneNumber] = ref<number>(0)
  }

  _querySMSInfoByPhoneNumber(phoneNumber).then((value) => {
    const t: Date | undefined = value?.time
    if (t) {
      const currentTime = new Date()
      const restTime = Math.floor((currentTime.getTime() - t.getTime()) / 1000)
      smsInfoStore[phoneNumber].value = restTime > COOL_DOWN_TIME ? 0 : COOL_DOWN_TIME - restTime
    }

    // 清理旧定时器
    if (timerStore[phoneNumber]) {
      clearInterval(timerStore[phoneNumber])
    }

    // 只在需要倒计时时启动
    if (smsInfoStore[phoneNumber].value > 0) {
      coolDown(phoneNumber)
    }
  })

  return smsInfoStore[phoneNumber]
}

/**
 * 冷却时间倒计时
 * @param time 需要倒计时的冷却时间
 */
function coolDown(phoneNumber: string) {
  const time = smsInfoStore[phoneNumber]

  timerStore[phoneNumber] = setInterval(() => {
    if (time.value > 0) {
      time.value = time.value - 1
    } else {
      clearInterval(timerStore[phoneNumber])
      delete timerStore[phoneNumber]
    }
  }, 1000)
}
/**
 * 通过phoneNumber在indexedDB中获取对应的校验码日期
 * @param {string} phoneNumber
 * @return {Promise<RestSmsCd | undefined>} 返回indexedDB中对应手机号的Promise对象
 */
function _querySMSInfoByPhoneNumber(phoneNumber: string): Promise<RestSmsCd | undefined> {
  return dexie.restcd.where('phone').equals(phoneNumber).first()
}
