import { defineComponent, type PropType, watch, type Ref, ref, computed } from 'vue'
import { NFormItem, NSwitch, NInputNumber, NGrid, NFormItemGi, type FormItemInst } from 'naive-ui'
import { $t } from '@/_utils/i18n'
import type { CustomerInfoDataForUI } from '@/components/sign/api/sign'
import { percentageRule } from './rules'

type PricingData = FormInput<
  Pick<
    CustomerInfoDataForUI,
    | 'isTimeOfUsePricingEnabled'
    | 'superPeakPercentage'
    | 'peakPercentage'
    | 'standardPercentage'
    | 'valleyPercentage'
  >
>

export default defineComponent({
  name: 'TimeOfUsePricingWidget',
  props: {
    modelValue: { type: Object as PropType<PricingData>, required: true },
    disabled: { type: Boolean, default: false },
    path: { type: String, required: true },
  },
  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const handleUpdate = <K extends keyof PricingData>(field: K, value: PricingData[K]) => {
      emit('update:modelValue', { ...props.modelValue, [field]: value })
    }
    const formValue = computed(() => props.modelValue)
    const itemRefs: Ref<(FormItemInst | null)[]> = ref([])
    const setItemRef = (el: unknown) => {
      if (el) {
        itemRefs.value.push(el as FormItemInst)
      }
    }

    watch(
      () => props.modelValue.isTimeOfUsePricingEnabled,
      (newVal) => {
        if (newVal === false) {
          const clearedValues = {
            superPeakPercentage: null,
            peakPercentage: null,
            standardPercentage: null,
            valleyPercentage: null,
          }
          emit('update:modelValue', {
            ...props.modelValue,
            ...clearedValues,
          })
        }
      },
    )

    return () => (
      <>
        <NFormItem label={$t('serviceAgreement.isTimeOfUsePricingEnabled')}>
          <NSwitch
            value={props.modelValue.isTimeOfUsePricingEnabled}
            onUpdate:value={(val) => handleUpdate('isTimeOfUsePricingEnabled', val)}
          />
        </NFormItem>

        {props.modelValue.isTimeOfUsePricingEnabled && (
          <NGrid x-gap="12 m:24" cols="1 s:2 l:4">
            {(
              [
                { key: 'superPeakPercentage', label: 'serviceAgreement.superPeakPercentage' },
                { key: 'peakPercentage', label: 'serviceAgreement.peakPercentage' },
                { key: 'standardPercentage', label: 'serviceAgreement.standardPercentage' },
                { key: 'valleyPercentage', label: 'serviceAgreement.valleyPercentage' },
              ] as const
            ).map((item) => (
              <NFormItemGi
                label={$t(item.label)}
                ref={setItemRef}
                path={`${props.path}.${item.key}`}
                rule={percentageRule(item.key, formValue, itemRefs)}
              >
                <NInputNumber
                  value={props.modelValue[item.key]}
                  onUpdate:value={(val) => handleUpdate(item.key, val)}
                  placeholder="0-100"
                />
              </NFormItemGi>
            ))}
          </NGrid>
        )}
      </>
    )
  },
})
