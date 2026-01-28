import { $t } from '@/_utils/i18n'
import type { ServicePointSpecification } from '@/components/sign/api/sign'
import { NButton, NDataTable, NFlex, type DataTableColumns } from 'naive-ui'
import { defineComponent, type PropType, computed } from 'vue'
import { motivateSPS } from './ServicePointSpecification'
import { UsageCategoryOption } from './constant/enum'
import { message } from '@/_utils/discrete_naive_api'

export default defineComponent({
  name: 'service-point-specification-group',
  props: {
    value: {
      type: Array as PropType<ServicePointSpecification[]>,
      default: () => [],
    },
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    const list = computed(() => props.value || [])

    const updateList = (newList: ServicePointSpecification[]) => {
      emit('update:value', newList)
    }

    // 校验重复
    const isDuplicate = (serviceAccount: string, excludeIndex: number = -1) => {
      const index = list.value.findIndex((item, idx) => {
        return item.serviceAccount === serviceAccount && idx !== excludeIndex
      })

      if (index !== -1) {
        message.error($t('servicePointSpecification.serviceAccountNumber.duplicate'))
        return true
      }
      return false
    }

    const columns = computed<DataTableColumns<ServicePointSpecification>>(() => [
      {
        type: 'selection',
      },
      {
        title: $t('servicePointSpecification.fields.serviceAccountNumber'),
        key: 'serviceAccount',
      },
      {
        title: $t('servicePointSpecification.fields.transformerCapacity'),
        key: 'transformerCapacity',
      },
      {
        title: $t('servicePointSpecification.fields.usageCategory'),
        key: 'electricityConsumptionType',
        render: (rowData) => {
          console.log('electricityConsumptionType', rowData?.electricityConsumptionType)
          return UsageCategoryOption.find(
            (item) => item.value === rowData.electricityConsumptionType,
          )?.label
        },
      },
      {
        title: $t('servicePointSpecification.fields.voltageLevel'),
        key: 'voltageClass',
      },
      {
        title: $t('actions.operate'),
        key: 'action',
        render: (rowData, rowIndex) => (
          <NFlex>
            <NButton
              size="small"
              onClick={() => {
                motivateSPS((formValue) => {
                  // 编辑模式：传入当前 rowIndex 以排除自身
                  if (isDuplicate(formValue.serviceAccount, rowIndex)) {
                    return false
                  }

                  // 创建新数组，替换指定索引的项
                  const newList = [...list.value]
                  newList[rowIndex] = {
                    ...rowData, // 保留原数据
                    ...formValue, // 覆盖新表单数据
                  }
                  updateList(newList)
                  return true
                }, rowData)
              }}
            >
              {$t('actions.edit')}
            </NButton>
            <NButton
              size="small"
              type="error"
              onClick={() => {
                // 创建新数组，过滤掉当前项
                const newList = list.value.filter((_, index) => index !== rowIndex)
                updateList(newList)
              }}
            >
              {$t('actions.delete')}
            </NButton>
          </NFlex>
        ),
      },
    ])

    const handleAdd = () => {
      motivateSPS((formValue) => {
        // 新增模式：不需要排除索引
        if (isDuplicate(formValue.serviceAccount)) {
          return false
        }
        // 创建新数组并追加
        const newList = [...list.value, formValue]
        updateList(newList)
        return true
      })
    }

    return () => (
      <div>
        <NButton size="small" onClick={handleAdd} type="primary">
          {$t('actions.add')}
        </NButton>
        <NDataTable
          class={'mt-2'}
          data={list.value}
          columns={columns.value}
          rowKey={(rowData: ServicePointSpecification) => rowData.serviceAccount}
        ></NDataTable>
      </div>
    )
  },
})
