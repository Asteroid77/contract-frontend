import { $t } from '@/_utils/i18n'
import type { ServicePointSpecification } from '@/modules/service-agreement/application/models'
import { NForm, NInput, NSelect, type FormInst } from 'naive-ui'
import { ref } from 'vue'
import { UsageCategoryOption, VoltageLevelOptions } from '@/modules/service-agreement/application/constants'
import {
  serviceAccountRule,
  transformerCapacityRule,
  usageCategoryRule,
  voltageLevelRule,
} from '@/modules/service-agreement/application/validation'
import { CapacityOptions } from '@/modules/service-agreement/application/transformer-capacity'
import { cloneDeep } from 'lodash'
import { dialog } from '@/_utils/discrete_naive_api'
import AppFormItem from '@/modules/shared/presentation/widget/AppFormItem'

export function motivateSPS(
  callback: (formValue: ServicePointSpecification) => void | false | true,
  data?: FormInput<ServicePointSpecification>,
) {
  const formData = ref<FormInput<ServicePointSpecification>>({})
  const formRef = ref<FormInst | null>(null)
  if (data) {
    formData.value = cloneDeep(data)
  }
  const handlePositiveClick = async () => {
    try {
      await formRef.value?.validate()
      return callback(formData.value as ServicePointSpecification)
    } catch {
      return false
    }
  }
  dialog.create({
    title: `${$t('servicePointSpecification.fields.serviceAccountNumber')}: ${Object.keys(formData.value).length ? $t('actions.edit') : $t('actions.add')}`,
    negativeText: $t('actions.cancel'),
    positiveText: $t('actions.confirm'),
    maskClosable: true,
    onPositiveClick: handlePositiveClick,
    content: () => (
      <NForm model={formData.value} ref={formRef}>
        <AppFormItem
          rule={serviceAccountRule}
          label={$t('servicePointSpecification.fields.serviceAccountNumber')}
          path={`serviceAccount`}
        >
          <NInput v-model:value={formData.value.serviceAccount} />
        </AppFormItem>
        <AppFormItem
          label={$t('servicePointSpecification.fields.transformerCapacity')}
          path={`transformerCapacity`}
          rule={transformerCapacityRule}
        >
          <NSelect
            v-model:value={formData.value.transformerCapacity}
            filterable
            clearable
            options={CapacityOptions.value}
          />
        </AppFormItem>
        <AppFormItem
          label={$t('servicePointSpecification.fields.usageCategory')}
          path={`electricityConsumptionType`}
          rule={usageCategoryRule}
        >
          <NSelect
            v-model:value={formData.value.electricityConsumptionType}
            options={UsageCategoryOption}
          ></NSelect>
        </AppFormItem>
        <AppFormItem
          label={$t('servicePointSpecification.fields.voltageLevel')}
          path={`voltageClass`}
          rule={voltageLevelRule}
        >
          <NSelect v-model:value={formData.value.voltageClass} options={VoltageLevelOptions} />
        </AppFormItem>
      </NForm>
    ),
  })
}
