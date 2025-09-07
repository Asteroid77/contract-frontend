import { defineStore } from 'pinia'
import { generate } from '@ant-design/colors'
import type { GlobalThemeOverrides } from 'naive-ui'
import { ThemeVariableStoreKey } from '@/components/theme-editor/constant/ThemeConstant'
import { ref } from 'vue'

const primaryColor = generate('#6A9D67')
const formLabelTextColor = generate('#70665E')
const backgroundColor = generate('#fcfbfa')

const storeThemeVariable = JSON.parse((localStorage[ThemeVariableStoreKey] as string) || '{}')
export function getCssVariable(variableName: string) {
  // 从根元素获取
  const rootStyles = getComputedStyle(document.documentElement)
  return rootStyles.getPropertyValue(variableName).trim()
}
export const useThemeStore = defineStore('theme', () => {
  const themeInitialVariable: GlobalThemeOverrides = {
    common: {
      baseColor: backgroundColor[5],
      primaryColor: primaryColor[5], // 主色取第6个颜色，和传入的颜色一致
      primaryColorHover: primaryColor[4], // Hover和Suppl颜色一样，取第5个颜色
      primaryColorSuppl: primaryColor[4], // Hover和Suppl颜色一样，取第5个颜色
      primaryColorPressed: primaryColor[6], // 比主色深一档，取第7个颜色
    },
    Input: {
      color: getCssVariable('--color-background'),
      border: 'none',
      borderHover: 'none',
      borderFocus: 'none',
      borderDisabled: 'none',
      borderRadius: 'none',
    },
    Form: {
      labelTextColor: formLabelTextColor[5],
    },
  }
  const themeOverrides = ref(
    Object.keys(storeThemeVariable).length > 0
      ? (storeThemeVariable as GlobalThemeOverrides)
      : themeInitialVariable,
  )
  const themeEdit = (theme: GlobalThemeOverrides) => {
    themeOverrides.value = { ...theme }
  }
  const themeInitiate = () => {
    themeOverrides.value = themeInitialVariable
    localStorage.setItem(ThemeVariableStoreKey, JSON.stringify(themeInitialVariable))
  }
  return {
    themeOverrides,
    themeEdit,
    themeInitiate,
  }
})
