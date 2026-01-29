import { defineComponent, type PropType, computed } from 'vue'
import { $t, $te } from '@/_utils/i18n'
import type { ApprovalInstance } from '@/modules/approval/application/models'
import type { UserAdditionalInfo } from '@/modules/user/application/models'
import {
  RegisterType,
  RegisterTypeOption,
} from '@/modules/user/application/constants'
import { BankOption } from '@/modules/shared/application/constants/BankConstant'
import areaData from '@/modules/shared/application/constants/PCA.json'
import { match } from 'ts-pattern'
import { findPathInTree } from '@/modules/shared/presentation/utils'
import { DiffRenderer } from '@/modules/approval/presentation/print/DiffRenderer'

export default defineComponent({
  name: 'UserAdditionalInfoPrintTemplate',
  props: {
    data: {
      type: Object as PropType<ApprovalInstance<Record<string, unknown>>>,
      required: true,
    },
    approvalType: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    // 辅助解析函数：自动处理 对象 或 JSON字符串
    const safeParse = (input: unknown): UserAdditionalInfo => {
      if (!input) return {} as UserAdditionalInfo
      try {
        // 如果已经是对象，为了断开引用（深拷贝），转字符串再转回来
        if (typeof input === 'object') {
          return JSON.parse(JSON.stringify(input))
        }
        // 如果是字符串，解析一次
        if (typeof input === 'string') {
          const firstParse = JSON.parse(input)
          // 如果解析出来还是字符串，再解析一次
          if (typeof firstParse === 'string') {
            return JSON.parse(firstParse)
          }
          return firstParse
        }
      } catch (e) {
        console.warn('PrintTemplate parse error:', e)
      }
      return {} as UserAdditionalInfo
    }

    const approvalData = computed(() => safeParse(props.data.approvalData))
    const sourceData = computed(() =>
      props.data.sourceData ? safeParse(props.data.sourceData) : null,
    )

    const orderItems = [
      'registerType',
      'name',
      'pca',
      'companyAddress',
      'contactPerson',
      'contactPersonPhone',
      'identity',
      'bankName',
      'bankAccount',
    ] as const

    const convertValue = (itemKey: string, text: unknown) => {
      return match(itemKey)
        .with('registerType', () => RegisterTypeOption.find((item) => item.value === text)?.label)
        .with('bankName', () => BankOption.find((item) => item.value === text)?.label)
        .with('pca', () =>
          findPathInTree(areaData, text as string)
            ?.map((item) => item.label)
            .join('-'),
        )
        .otherwise(() => text)
    }

    const convertLabel = (
      itemKey: (typeof orderItems)[number],
      data: UserAdditionalInfo | null | undefined,
    ) => {
      if (!data) return ''
      return match(itemKey)
        .with('name', () => {
          return `${
            RegisterType.INDIVIDUAL === data['registerType']
              ? $t('account.additionalInfo.name')
              : $t('account.additionalInfo.usci')
          }:`
        })
        .otherwise(() => `${$t(`account.additionalInfo.${itemKey}`)}:`)
    }

    const shouldRenderItem = (
      itemKey: keyof UserAdditionalInfo,
      data: UserAdditionalInfo | null,
    ): boolean => {
      if (!data) return false
      const value = data[itemKey]
      return !!value && $te(`account.additionalInfo.${itemKey}`)
    }

    // --- 3. 核心 Diff 逻辑 (适配 computed) ---

    const visibleRows = computed(() => {
      // 调试：如果还是没数据，打开控制台看这里打印了什么
      // console.log('Current Data:', { new: approvalData.value, old: sourceData.value })

      return orderItems
        .filter((key) => {
          // 注意：这里需要传入 .value
          const showInNew = shouldRenderItem(key as keyof UserAdditionalInfo, approvalData.value)
          const showInOld =
            sourceData.value && shouldRenderItem(key as keyof UserAdditionalInfo, sourceData.value)
          return showInNew || showInOld
        })
        .map((key) => {
          // 优先取新数据，没有则取旧数据
          const labelContextData =
            approvalData.value && approvalData.value[key]
              ? approvalData.value
              : sourceData.value || approvalData.value

          const rawLabel = convertLabel(key, labelContextData)
          const cleanLabel = rawLabel.replace(/:$/, '')

          return {
            key,
            label: cleanLabel,
            newDisplay: convertValue(key, approvalData.value?.[key]),
            oldDisplay: sourceData.value ? convertValue(key, sourceData.value?.[key]) : null,
          }
        })
    })

    const renderDiffCell = (field: (typeof visibleRows.value)[0]) => {
      const { newDisplay, oldDisplay } = field
      return (
        <DiffRenderer
          newValue={newDisplay as string | number}
          oldValue={oldDisplay as string | number | undefined}
        />
      )
    }

    return () => (
      <div class="print-section">
        {visibleRows.value.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', border: '1px solid #000' }}>
            {$t('common.empty')}
          </div>
        ) : (
          <table class="info-table">
            <tbody>
              {visibleRows.value.map((row) => (
                <tr key={row.key}>
                  <td class="label">{row.label}</td>
                  {/* colspan=3 确保占满整行 */}
                  <td class="value" colspan={3}>
                    {renderDiffCell(row)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  },
})
