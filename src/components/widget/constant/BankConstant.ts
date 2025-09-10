export const BankNameMap = {
  PBC: {
    name: '中国人民银行',
    icon: 'icon-yinhang-zhongguorenminyinhang-',
  },
  ICBC: {
    name: '中国工商银行',
    icon: 'icon-ICBC',
  },
  CCB: {
    name: '中国建设银行',
    icon: 'icon-jiansheyinhang',
  },
  HSBC: {
    name: '汇丰银行',
    icon: 'icon-huifengyinhang',
  },
  BOC: {
    name: '中国银行',
    icon: 'icon-yinhang-zhongguoyinhang',
  },
  ABC: {
    name: '中国农业银行',
    icon: 'icon-ABC',
  },
  PSBC: {
    name: '中国邮政储蓄银行',
    icon: 'icon-China_Post',
  },
  CMB: {
    name: '中国招商银行',
    icon: 'icon-China_Merchants_Bank',
  },
  CGB: {
    name: '广发银行',
    icon: 'icon-China_Guangfa_Bank',
  },
  CITIC: {
    name: '中信银行',
    icon: 'icon-China_Citic_Back',
  },
  BCM: {
    name: '交通银行',
    icon: 'icon-jiaotongyinhang',
  },
  SPDB: {
    name: '上海浦东发展银行',
    icon: 'icon-yinhang-shanghaipudongfazhan-',
  },
}
export const BankOption = Object.keys(BankNameMap).map((item: string) => {
  const bankInfo = BankNameMap[item as keyof typeof BankNameMap]
  return {
    label: bankInfo.name,
    value: item,
  }
})
