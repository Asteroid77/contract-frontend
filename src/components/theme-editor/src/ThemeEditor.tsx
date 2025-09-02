import { computed, defineComponent, ref, toRaw, watch, inject } from 'vue'
import { cloneDeep, merge } from 'lodash'
import { lightTheme } from 'naive-ui'
import { type GlobalTheme, type GlobalThemeOverrides, NConfigProvider } from 'naive-ui'
import {
  NCollapse,
  NCollapseItem,
  NInput,
  NSpace,
  NGrid,
  NGi,
  NDivider,
  NButton,
  NColorPicker,
  NEmpty,
  NIcon,
} from 'naive-ui'
import { useLocale } from '../_mixins'
import { createInjectionKey, download } from '../_utils'
import { MinimizeIcon } from './MinimizeIcon'
import { MaximizeIcon } from './MaximizeIcon'
import type { ConfigProviderInjection } from 'naive-ui/lib/config-provider/src/internal-interface'
import { useThemeStore } from '@/stores/useThemeStore'
import { notification } from '@/_utils/discrete_naive_api'
import { ThemeVariableStoreKey } from '../constant/ThemeConstant'
import { $t } from '@/_utils/i18n'
const configProviderInjectionKey = createInjectionKey<ConfigProviderInjection>('n-config-provider')
const showColorPicker = (key: string): boolean => {
  if (key.includes('pacity')) return false
  if (key.includes('color') || key.includes('Color')) return true
  return false
}

export default defineComponent({
  name: 'ZWThemeEditor',
  inheritAttrs: false,
  setup() {
    const isMaximized = ref<boolean>(false)
    const fileInputRef = ref<HTMLInputElement | null>(null)
    const NConfigProvider: ConfigProviderInjection | null = inject(configProviderInjectionKey, null)
    const theme = computed(() => {
      const mergedTheme: GlobalTheme = NConfigProvider?.mergedThemeRef.value || lightTheme
      const mergedThemeOverrides = NConfigProvider?.mergedThemeOverridesRef.value
      const common = merge(
        {},
        mergedTheme.common || lightTheme.common,
        mergedThemeOverrides?.common,
        overridesRef.value.common || {},
      ) as NonNullable<GlobalTheme['common']>
      const overrides: GlobalThemeOverrides = {
        common,
      }
      for (const key of Object.keys(lightTheme) as Array<
        Exclude<keyof typeof lightTheme, 'name'>
      >) {
        if (key === 'common')
          continue
          // @ts-expect-error: There (last line) we must use as any, nor ts 2590 will be raised since the union
          // is too complex
        ;(overrides as GlobalThemeOverrides)[key] =
          mergedTheme[key]?.self?.(common) || lightTheme[key].self?.(common)
        if (mergedThemeOverrides && (overrides as GlobalThemeOverrides)[key]) {
          merge((overrides as GlobalThemeOverrides)[key], mergedThemeOverrides[key])
        }
      }
      return overrides
    })
    const themeCommonDefaultRef = computed(() => {
      return NConfigProvider?.mergedThemeRef.value?.common || lightTheme.common
    })
    const showPanelRef = ref(false)
    const themeStore = useThemeStore()
    const overridesRef = ref(themeStore.themeOverrides)
    const tempOverridesRef = ref(themeStore.themeOverrides)
    const varNamePatternRef = ref('')
    const compNamePatternRef = ref('')
    const tempVarNamePatternRef = ref('')
    const tempCompNamePatternRef = ref('')
    function applyTempOverrides(): void {
      overridesRef.value = cloneDeep(toRaw(tempOverridesRef.value))
    }
    function setTempOverrides(compName: string, varName: string, value: string): void {
      const { value: tempOverrides } = tempOverridesRef
      // @ts-expect-error `theme` is typed as `GlobalThemeOverrides`, but `themeKey` is a string.The relationship is too complex for the type system to statically infer.
      if (!(compName in tempOverrides)) tempOverrides[compName] = {}
      // @ts-expect-error `theme` is typed as `GlobalThemeOverrides`, but `themeKey` is a string.The relationship is too complex for the type system to statically infer.
      const compOverrides = tempOverrides[compName]
      if (value) {
        compOverrides[varName] = value
      } else {
        delete compOverrides[varName]
      }
    }
    function handleClearAllClick(): void {
      useThemeStore().themeInitiate()
      tempOverridesRef.value = useThemeStore().themeOverrides
      overridesRef.value = useThemeStore().themeOverrides
    }
    function handleImportClick(): void {
      const { value: fileInput } = fileInputRef
      if (!fileInput) return
      fileInput.click()
    }
    function toggleMaximized(): void {
      isMaximized.value = !isMaximized.value
    }
    function handleInputFileChange(): void {
      const { value: fileInput } = fileInputRef
      if (!fileInput) return
      const fileList = fileInput.files
      const file = fileList?.[0]
      if (!file) return
      file
        .text()
        .then((value) => {
          overridesRef.value = JSON.parse(value)
          tempOverridesRef.value = JSON.parse(value)
        })
        .catch((e) => {
          alert('Imported File is Invalid')
          console.error(e)
        })
        .finally(() => {
          fileInput.value = ''
        })
    }
    function handleExportClick(): void {
      const url = URL.createObjectURL(new Blob([JSON.stringify(overridesRef.value, undefined, 2)]))
      download(url, 'naive-ui-theme-overrides.json')
      URL.revokeObjectURL(url)
    }
    function handleSubmitClick(): void {
      useThemeStore().themeEdit(overridesRef.value)
      notification.success({
        title: $t('theme.modify.success.title'),
        content: $t('theme.modify.success.content'),
        duration: 2500,
      })
    }
    watch(overridesRef, (value) => {
      localStorage[ThemeVariableStoreKey] = JSON.stringify(value)
    })
    return {
      locale: useLocale('ThemeEditor').localeRef,
      themeCommonDefault: themeCommonDefaultRef,
      theme,
      showPanel: showPanelRef,
      tempOverrides: tempOverridesRef,
      overrides: overridesRef,
      compNamePattern: compNamePatternRef,
      tempCompNamePattern: tempCompNamePatternRef,
      varNamePattern: varNamePatternRef,
      tempVarNamePattern: tempVarNamePatternRef,
      fileInputRef,
      applyTempOverrides,
      setTempOverrides,
      handleClearAllClick,
      handleExportClick,
      handleSubmitClick,
      handleImportClick,
      handleInputFileChange,
      toggleMaximized,
      isMaximized,
    }
  },
  render() {
    return (
      <NConfigProvider themeOverrides={this.overrides}>
        {{
          default: () => [
            <>
              <input
                type="file"
                ref="fileInputRef"
                style={{
                  display: 'block',
                  width: 0,
                  height: 0,
                  visibility: 'hidden',
                }}
                onChange={this.handleInputFileChange}
              />
              <NSpace vertical>
                {{
                  default: () => [
                    <NSpace
                      align="center"
                      justify="space-between"
                      style={{
                        marginBottom: '8px',
                        fontSize: '18px',
                        fontWeight: 500,
                      }}
                    >
                      {{
                        default: () => (
                          <>
                            <span>{this.locale.title}</span>
                            <NButton onClick={this.toggleMaximized} secondary circle size="tiny">
                              {{
                                icon: () => (
                                  <NIcon
                                    component={this.isMaximized ? MinimizeIcon : MaximizeIcon}
                                  />
                                ),
                              }}
                            </NButton>
                          </>
                        ),
                      }}
                    </NSpace>,
                    this.locale.filterCompName,
                    <NInput
                      onChange={() => {
                        this.compNamePattern = this.tempCompNamePattern
                      }}
                      onInput={(value: string) => {
                        this.tempCompNamePattern = value
                      }}
                      value={this.tempCompNamePattern}
                      placeholder={this.locale.filterCompName}
                    />,
                    this.locale.filterVarName,
                    <NInput
                      onChange={(value: string) => {
                        this.varNamePattern = value
                      }}
                      onInput={(value: string) => {
                        this.tempVarNamePattern = value
                      }}
                      value={this.tempVarNamePattern}
                      placeholder={this.locale.filterVarName}
                    />,
                    <NButton
                      size="small"
                      onClick={() => {
                        this.compNamePattern = ''
                        this.varNamePattern = ''
                        this.tempCompNamePattern = ''
                        this.tempVarNamePattern = ''
                      }}
                      block
                    >
                      {{ default: () => this.locale.clearSearch }}
                    </NButton>,
                    <NButton size="small" onClick={this.handleClearAllClick} block>
                      {{
                        default: () => this.locale.clearAllVars,
                      }}
                    </NButton>,
                    <NSpace itemStyle={{ flex: 1 }}>
                      {{
                        default: () => (
                          <>
                            <NButton block size="small" onClick={this.handleImportClick}>
                              {{
                                default: () => this.locale.import,
                              }}
                            </NButton>
                            <NButton block size="small" onClick={this.handleExportClick}>
                              {{
                                default: () => this.locale.export,
                              }}
                            </NButton>
                          </>
                        ),
                      }}
                    </NSpace>,
                    <NSpace itemStyle={{ flex: 1 }}>
                      {{
                        default: () => (
                          <>
                            <NButton type="primary" block onClick={this.handleSubmitClick}>
                              {{
                                default: () => '应用',
                              }}
                            </NButton>
                          </>
                        ),
                      }}
                    </NSpace>,
                  ],
                }}
              </NSpace>
              <NDivider />
              <NCollapse>
                {{
                  default: () => {
                    const { theme, compNamePattern, varNamePattern } = this
                    const themeKeys = Object.keys(theme)
                    const compNamePatternLower = compNamePattern.toLowerCase()
                    const varNamePatternLower = varNamePattern.toLowerCase()
                    let filteredItemsCount = 0
                    const collapsedItems = themeKeys
                      .filter((themeKey) => {
                        return themeKey.toLowerCase().includes(compNamePatternLower)
                      })
                      .map((themeKey) => {
                        const componentTheme: Record<string, string> | undefined =
                          // @ts-expect-error `theme` is typed as `GlobalThemeOverrides`, but `themeKey` is a string.
                          // The relationship is too complex for the type system to statically infer.
                          themeKey === 'common' ? this.themeCommonDefault : theme[themeKey]
                        if (componentTheme === undefined) {
                          return null
                        }
                        const varKeys = Object.keys(componentTheme).filter((key) => {
                          return key !== 'name' && key.toLowerCase().includes(varNamePatternLower)
                        })
                        if (!varKeys.length) {
                          return null
                        }
                        filteredItemsCount += 1
                        return (
                          <NCollapseItem title={themeKey} name={themeKey}>
                            {{
                              default: () => (
                                <NGrid
                                  xGap={32}
                                  yGap={16}
                                  responsive="screen"
                                  cols={this.isMaximized ? '1 xs:1 s:2 m:3 l:4' : 1}
                                >
                                  {{
                                    default: () =>
                                      varKeys.map((varKey) => (
                                        <NGi>
                                          {{
                                            default: () => (
                                              <>
                                                <div
                                                  key={`${varKey}Label`}
                                                  style={{
                                                    wordBreak: 'break-word',
                                                  }}
                                                >
                                                  {varKey}
                                                </div>

                                                {showColorPicker(varKey) ? (
                                                  <NColorPicker
                                                    key={varKey}
                                                    modes={['rgb', 'hex']}
                                                    value={
                                                      // @ts-expect-error `theme` is typed as `GlobalThemeOverrides`, but `themeKey` is a string.The relationship is too complex for the type system to statically infer.
                                                      this.tempOverrides?.[themeKey]?.[varKey] ||
                                                      componentTheme[varKey]
                                                    }
                                                    onComplete={this.applyTempOverrides}
                                                    onUpdateValue={(value: string) => {
                                                      this.setTempOverrides(themeKey, varKey, value)
                                                    }}
                                                  >
                                                    {{
                                                      action: () => (
                                                        <NButton
                                                          size="small"
                                                          disabled={
                                                            componentTheme[varKey] ===
                                                            // @ts-expect-error `theme` is typed as `GlobalThemeOverrides`, but `themeKey` is a string.The relationship is too complex for the type system to statically infer.
                                                            this.tempOverrides?.[themeKey]?.[varKey]
                                                          }
                                                          onClick={() => {
                                                            this.setTempOverrides(
                                                              themeKey,
                                                              varKey,
                                                              componentTheme[varKey],
                                                            )
                                                            this.applyTempOverrides()
                                                          }}
                                                        >
                                                          {{
                                                            default: () => this.locale.restore,
                                                          }}
                                                        </NButton>
                                                      ),
                                                    }}
                                                  </NColorPicker>
                                                ) : (
                                                  <NInput
                                                    key={varKey}
                                                    onChange={this.applyTempOverrides}
                                                    onUpdateValue={(value: string) => {
                                                      this.setTempOverrides(themeKey, varKey, value)
                                                    }}
                                                    value={
                                                      // @ts-expect-error `theme` is typed as `GlobalThemeOverrides`, but `themeKey` is a string.The relationship is too complex for the type system to statically infer.
                                                      this.tempOverrides?.[themeKey]?.[varKey] || ''
                                                    }
                                                    placeholder={componentTheme[varKey]}
                                                  />
                                                )}
                                              </>
                                            ),
                                          }}
                                        </NGi>
                                      )),
                                  }}
                                </NGrid>
                              ),
                            }}
                          </NCollapseItem>
                        )
                      })
                    if (!filteredItemsCount) return <NEmpty />
                    return collapsedItems
                  },
                }}
              </NCollapse>
            </>,
          ],
        }}
      </NConfigProvider>
    )
  },
})
