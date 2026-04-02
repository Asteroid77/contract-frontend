import { defineComponent, type PropType } from 'vue'
import { NGrid, NFormItemGi } from 'naive-ui'
import { $t } from '@/_utils/i18n'
import type {
  AttachmentDataForInitiation,
  AttachmentDataForUI,
} from '@/modules/service-agreement/application/models'

import ImagesUploader from './ImagesUploader'
import { FileCategoryEnum } from '@/modules/service-agreement/application/constants'

export default defineComponent({
  name: 'AttachmentSection',
  props: {
    modelValue: {
      type: Object as PropType<AttachmentDataForUI>,
      required: true,
    },
    initialValue: {
      type: Object as PropType<AttachmentDataForInitiation>,
    },
    path: {
      type: String,
      default: 'attachmentInfo',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const updateModel = (updatedFields: Partial<AttachmentDataForUI>) => {
      emit('update:modelValue', {
        ...props.modelValue,
        ...updatedFields,
      })
    }

    const uploaderConfigs = [
      {
        key: 'contractScanIds',
        initialKey: 'contractScanFiles',
        label: $t('domain.agreement.file.contract'),
        fileCategory: FileCategoryEnum.CONTRACT,
        maxFiles: 3,
      },
      {
        key: 'billIds',
        initialKey: 'billFiles',
        label: $t('domain.agreement.file.bill'),
        fileCategory: FileCategoryEnum.BILL,
        maxFiles: 3,
      },
      {
        key: 'supplementaryAttachmentIds',
        initialKey: 'supplementaryAttachmentFiles',
        label: $t('domain.agreement.file.other'),
        fileCategory: FileCategoryEnum.ATTACHMENT,
        maxFiles: 3,
      },
    ] as const

    return () => (
      <NGrid cols="1" y-gap={24}>
        {uploaderConfigs.map((config) => (
          <NFormItemGi label={config.label} path={`${props.path}.${config.key}`}>
            <ImagesUploader
              value={props.modelValue[config.key] || []}
              onUpdate:value={(newIds: number[]) => {
                updateModel({ [config.key]: newIds })
              }}
              fileCategory={config.fileCategory}
              maxFiles={config.maxFiles}
              initialFileList={props.initialValue?.[config.initialKey]}
            />
          </NFormItemGi>
        ))}
      </NGrid>
    )
  },
})
