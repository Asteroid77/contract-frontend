import { defineComponent, type PropType } from 'vue'
import { NInput, NInputNumber, NSelect } from 'naive-ui'
import type { CustomerInfoDataForUI } from '@/components/sign/api/sign'

import ChinaAreaCascader from '@/components/widget/PCACascader'
import IndustriesSelect from '../widget/IndustriesSelect'
import { ServiceAgreementStatusOption } from './constant/enum'
import TimeOfUsePricingWidget from './TimeOfUsePricingWidget'
import { $t } from '@/_utils/i18n'
import AppFormItem from '../widget/AppFormItem'

export default defineComponent({
  name: 'CustomerInfoSection',
  props: {
    modelValue: {
      type: Object as PropType<FormInput<CustomerInfoDataForUI>>,
      required: true,
    },
    path: {
      type: String,
      default: 'customerInfo',
    },
  },
  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const updateModel = (updatedFields: Partial<CustomerInfoDataForUI>) => {
      emit('update:modelValue', {
        ...props.modelValue,
        ...updatedFields,
      })
    }

    return () => (
      <>
        {/* 签约状态 */}
        <AppFormItem label={$t('serviceAgreement.status.label')} path={`${props.path}.status`}>
          <NSelect
            value={props.modelValue.status}
            onUpdate:value={(val) => updateModel({ status: val })}
            options={ServiceAgreementStatusOption}
          />
        </AppFormItem>

        {/* 企业名称 */}
        <AppFormItem label={$t('serviceAgreement.companyName')} path={`${props.path}.companyName`}>
          <NInput
            value={props.modelValue.companyName}
            onUpdate:value={(val) => updateModel({ companyName: val })}
          />
        </AppFormItem>

        {/* 行业 */}
        <AppFormItem label={$t('serviceAgreement.industry')} path={`${props.path}.industry`}>
          <IndustriesSelect
            value={props.modelValue.industry}
            onUpdate:value={(val: string | null) => updateModel({ industry: val })}
          />
        </AppFormItem>

        {/* 公司地区 */}
        <AppFormItem label={$t('serviceAgreement.companyArea')} path={`${props.path}.companyArea`}>
          <ChinaAreaCascader
            value={props.modelValue.companyArea}
            onUpdate:value={(val: string) => updateModel({ companyArea: val })}
          />
        </AppFormItem>

        {/* 企业详细地址 */}
        <AppFormItem
          label={$t('serviceAgreement.companyAddress')}
          path={`${props.path}.companyAddress`}
        >
          <NInput
            value={props.modelValue.companyAddress}
            onUpdate:value={(val) => updateModel({ companyAddress: val })}
          />
        </AppFormItem>

        {/* 联系人 */}
        <AppFormItem label={$t('serviceAgreement.liaisonName')} path={`${props.path}.liaisonName`}>
          <NInput
            value={props.modelValue.liaisonName}
            onUpdate:value={(val) => updateModel({ liaisonName: val })}
          />
        </AppFormItem>

        {/* 联系人电话 */}
        <AppFormItem
          label={$t('serviceAgreement.liaisonPhone')}
          path={`${props.path}.liaisonPhone`}
        >
          <NInput
            value={props.modelValue.liaisonPhone}
            onUpdate:value={(val) => updateModel({ liaisonPhone: val })}
          />
        </AppFormItem>

        {/* 联系人职务 */}
        <AppFormItem
          label={$t('serviceAgreement.liaisonPosition')}
          path={`${props.path}.liaisonPosition`}
        >
          <NInput
            value={props.modelValue.liaisonPosition}
            onUpdate:value={(val) => updateModel({ liaisonPosition: val })}
          />
        </AppFormItem>

        {/* 用电分配 (分时电价组件) */}
        <TimeOfUsePricingWidget
          modelValue={{
            isTimeOfUsePricingEnabled: props.modelValue.isTimeOfUsePricingEnabled,
            superPeakPercentage: props.modelValue.superPeakPercentage,
            peakPercentage: props.modelValue.peakPercentage,
            standardPercentage: props.modelValue.standardPercentage,
            valleyPercentage: props.modelValue.valleyPercentage,
          }}
          onUpdate:modelValue={updateModel}
          path={props.path}
        />

        {/** 年用电量 */}
        <AppFormItem
          label={$t('serviceAgreement.yearUsableCharge')}
          path={`${props.path}.yearUsableCharge`}
        >
          <NInputNumber
            class="w-full"
            value={props.modelValue.yearUsableCharge}
            onUpdate:value={(val) => updateModel({ yearUsableCharge: val })}
            v-slots={{
              suffix: () => '10k kWh',
            }}
          ></NInputNumber>
        </AppFormItem>
        {/* 进展备注 */}
        <AppFormItem label={$t('serviceAgreement.comment')} path={`${props.path}.comment`}>
          <NInput
            value={props.modelValue.comment}
            onUpdate:value={(val) => updateModel({ comment: val })}
            type="textarea"
          />
        </AppFormItem>
      </>
    )
  },
})
