import { defineComponent, type PropType } from 'vue'
import { NFormItem, NDatePicker } from 'naive-ui'
import type { SignInfoDataForUI } from '@/modules/service-agreement/application/models'
import { $t } from '@/_utils/i18n'

import PriceGroupWidget from './PriceGroupWidget'
import ServicePointSpecificationGroup from './ServicePointSpecificationGroup'

export default defineComponent({
  name: 'SignInfoSection',
  props: {
    modelValue: { type: Object as PropType<FormInput<SignInfoDataForUI>>, required: true },
    path: { type: String, default: 'signInfo' },
  },
  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const updateModel = (updatedFields: Partial<SignInfoDataForUI>) => {
      Object.assign(props.modelValue, updatedFields)
      emit('update:modelValue', props.modelValue)
    }

    return () => (
      <>
        {/* 所有的价格相关逻辑都被这一个组件取代了！ */}
        <PriceGroupWidget
          // 手动切片，只传递 PriceGroupWidget 需要的数据
          modelValue={{
            priceModel: props.modelValue.priceModel || null,
            priceType: props.modelValue.priceType || null,
            priceCategory: props.modelValue.priceCategory || null,
            fixedPrice: props.modelValue.fixedPrice || null,
            fixedSpread: props.modelValue.fixedSpread || null,
            revenueShareRatio: props.modelValue.revenueShareRatio || null,
            comment: props.modelValue.comment || null,
          }}
          // 当 PriceGroupWidget 内部有更新时，直接调用 updateModel
          onUpdate:modelValue={updateModel}
          path={props.path}
        />

        {/* 合同到期时间 */}
        <NFormItem
          label={$t('serviceAgreement.expirationTime')}
          path={`${props.path}.expirationTime`}
        >
          <NDatePicker
            v-model:value={props.modelValue.expirationTime}
            value-format={'yyyy-MM-dd HH:mm:ss'}
            type="datetime"
            clearable
          ></NDatePicker>
        </NFormItem>

        {/* 营销户号管理 */}
        <NFormItem path={`${props.path}.servicePointSpecifications`}>
          <ServicePointSpecificationGroup
            value={props.modelValue.servicePointSpecifications}
            onUpdate:value={(val) => updateModel({ servicePointSpecifications: val })}
          />
        </NFormItem>
      </>
    )
  },
})
