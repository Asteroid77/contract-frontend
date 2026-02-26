import { defineComponent, type PropType, computed, watch } from 'vue'
import { NInput, NInputNumber, NSelect } from 'naive-ui'
import { $t } from '@/_utils/i18n'
import type { PriceGroupData } from '@/modules/service-agreement/application/models'

import {
  PriceCategoryEnum,
  PriceModelEnum,
  PriceModelOption,
  PriceTypeOption,
  PriceCategoryOption,
} from '@/modules/service-agreement/application/constants'
import AppFormItem from '@/modules/shared/presentation/widget/AppFormItem'

export default defineComponent({
  name: 'PriceGroupWidget',
  props: {
    modelValue: { type: Object as PropType<PriceGroupData>, required: true },
    path: { type: String, required: true },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const updateModel = (updatedFields: Partial<PriceGroupData>) => {
      Object.assign(props.modelValue, updatedFields)
      emit('update:modelValue', props.modelValue)
    }
    const showPriceTypeAndCategory = computed(
      () => props.modelValue.priceModel !== PriceModelEnum.Other,
    )
    const showShareRatio = computed(
      () => props.modelValue.priceCategory === PriceCategoryEnum.ShareRatio,
    )
    const showFixedPrice = computed(
      () => props.modelValue.priceCategory === PriceCategoryEnum.FixedPrice,
    )
    const showFixedSpread = computed(
      () => props.modelValue.priceCategory === PriceCategoryEnum.FixedSpread,
    )
    const showComment = computed(() => props.modelValue.priceModel === PriceModelEnum.Other)

    watch(
      () => props.modelValue.priceModel,
      (newVal, oldVal) => {
        if (newVal !== oldVal) {
          updateModel({
            priceType: null,
            priceCategory: null,
            fixedPrice: null,
            fixedSpread: null,
            revenueShareRatio: null,
            comment: null,
          })
        }
      },
    )

    watch(
      () => props.modelValue.priceCategory,
      (newVal, oldVal) => {
        if (newVal !== oldVal) {
          const clearedFields: Partial<PriceGroupData> = {}
          if (oldVal === PriceCategoryEnum.FixedPrice) clearedFields.fixedPrice = null
          if (oldVal === PriceCategoryEnum.FixedSpread) clearedFields.fixedSpread = null
          if (oldVal === PriceCategoryEnum.ShareRatio) clearedFields.revenueShareRatio = null
          if (Object.keys(clearedFields).length > 0) {
            updateModel(clearedFields)
          }
        }
      },
    )

    return () => (
      <div class="sa-form-grid">
        <AppFormItem
          label={$t('domain.agreement.field.priceModel')}
          path={`${props.path}.priceModel`}
        >
          <NSelect
            value={props.modelValue.priceModel}
            onUpdate:value={(val) => updateModel({ priceModel: val })}
            options={PriceModelOption}
            disabled={props.disabled}
            clearable
          />
        </AppFormItem>

        {showPriceTypeAndCategory.value && (
          <>
            <AppFormItem
              label={$t('domain.agreement.field.priceType')}
              path={`${props.path}.priceType`}
            >
              <NSelect
                value={props.modelValue.priceType}
                onUpdate:value={(val) => updateModel({ priceType: val })}
                options={PriceTypeOption(computed(() => props.modelValue.priceModel))} // 假设选项是动态的
                disabled={props.disabled}
                clearable
              />
            </AppFormItem>

            <AppFormItem
              label={$t('domain.agreement.field.priceCategory')}
              path={`${props.path}.priceCategory`}
            >
              <NSelect
                value={props.modelValue.priceCategory}
                onUpdate:value={(val) => updateModel({ priceCategory: val })}
                options={PriceCategoryOption(computed(() => props.modelValue.priceModel))}
                disabled={props.disabled}
                clearable
              />
            </AppFormItem>
          </>
        )}

        {showShareRatio.value && (
          <AppFormItem
            label={$t('domain.agreement.field.shareRatio')}
            path={`${props.path}.revenueShareRatio`}
          >
            <NInputNumber
              class="w-full"
              value={props.modelValue.revenueShareRatio}
              onUpdate:value={(val) => updateModel({ revenueShareRatio: val })}
              disabled={props.disabled}
              v-slots={{
                suffix: () => '%',
              }}
            ></NInputNumber>
          </AppFormItem>
        )}

        {showFixedPrice.value && (
          <AppFormItem
            label={$t('domain.agreement.field.fixedPrice')}
            path={`${props.path}.fixedPrice`}
          >
            <NInputNumber
              class="w-full"
              value={Number(props.modelValue.fixedPrice)}
              onUpdate:value={(val) => updateModel({ fixedPrice: String(val) })}
              disabled={props.disabled}
              precision={4}
            />
          </AppFormItem>
        )}

        {showFixedSpread.value && (
          <AppFormItem
            label={$t('domain.agreement.field.fixedSpread')}
            path={`${props.path}.fixedSpread`}
          >
            <NInputNumber
              class="w-full"
              value={Number(props.modelValue.fixedSpread)}
              onUpdate:value={(val) => updateModel({ fixedSpread: String(val) })}
              disabled={props.disabled}
              precision={4}
            />
          </AppFormItem>
        )}
        {showComment.value && (
          <AppFormItem label={$t('common.field.remark')} path={`${props.path}.comment`}>
            <NInput
              value={props.modelValue.comment}
              onUpdate:value={(val) => updateModel({ comment: val })}
              type="textarea"
              disabled={props.disabled}
            />
          </AppFormItem>
        )}
      </div>
    )
  },
})
