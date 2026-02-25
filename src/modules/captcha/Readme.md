# Captcha 模块

图形验证码与短信验证码的获取和发送，服务于登录、注册等需要人机校验的场景。

## 目录结构

```
captcha/
├── domain/
│   └── types.ts              # 领域类型：ImageCaptchaResponse, SmsCaptchaResponse
├── application/
│   ├── models.ts             # 应用层类型别名（CaptchaResponse, SMSSendResponse）
│   ├── service.ts            # captchaService（getCaptcha, sendSmsCode）
│   └── hooks/
│       ├── useCaptcha.ts     # 图形验证码查询 hook（vue-query useQuery）
│       └── useSMS.ts         # 短信发送 hook（vue-query useMutation + 冷却计时）
└── infrastructure/
    └── captcha-repository.ts # API 调用实现（/captcha/arithmetic, /captcha/sms/send）
```

## 主要能力

### 图形验证码

`useCaptcha()` 通过 vue-query 的 `useQuery` 获取算术验证码图片。返回值包含验证码 `id` 和 base64 编码的 `image`。查询会自动缓存和重新获取。

### 短信验证码

`useSMS()` 提供三个功能：

- `sendSMSCode()` 发送短信验证码（vue-query `useMutation`），发送成功后自动写入 IndexedDB 记录发送时间。
- `getSMSCoolDownSecond(phone)` 获取指定手机号的剩余冷却秒数（60 秒倒计时），页面刷新后从 IndexedDB 恢复。
- `getSendBtnLabelText(phone)` 根据冷却状态返回按钮文案（倒计时文本或"发送"）。

## 使用方式

```typescript
// 图形验证码
import { useCaptcha } from '@/modules/captcha/application/hooks/useCaptcha'
const { data: captcha, refetch } = useCaptcha()

// 短信验证码
import { useSMS } from '@/modules/captcha/application/hooks/useSMS'
const { sendSMSCode, getSendBtnLabelText, getSMSCoolDownSecond } = useSMS()
const { mutate: send } = sendSMSCode()
send('13800138000')
```

## 注意事项

- 短信冷却计时依赖 Dexie (IndexedDB) 持久化，保证刷新页面后倒计时不会重置。
- API 端点通过 `createPrefixedEndpoints` 生成，前缀为 `/captcha`。
- 本模块不包含验证码校验逻辑，校验由后端在登录/注册接口中完成。
