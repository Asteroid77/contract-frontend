import { $t } from '@/_utils/i18n'
import { BankOption } from '@/modules/shared/application/constants/BankConstant'
import areaData from '@/modules/shared/application/constants/PCA.json'
import { findPathInTree } from '@/modules/shared/presentation/utils'
import type { ApprovalInstance } from '@/modules/approval/application/models'
import type { ServiceAgreementRequestDTO } from '@/modules/service-agreement/domain/dto'
import type { UserAdditionalInfo } from '@/modules/user/application/models'
import { RegisterType, RegisterTypeOption } from '@/modules/user/application/constants'
import { useFilesDetailQuery } from '@/modules/file/application/hooks/useFileService'
import type { FileResponse } from '@/modules/file/domain/types'
import type { FieldDefinition, FormData } from '@/modules/shared/presentation/diff-check/domain/types/field'
import UnifiedFormTable from '@/modules/shared/presentation/diff-check/components/unified/UnifiedFormTable'
import { buildServiceAgreementDiffCheckFields, toServiceAgreementDiffCheckForm } from '@/modules/service-agreement/presentation/diff-check/serviceAgreementDiffCheck'
import { uniq } from 'lodash'
import { match } from 'ts-pattern'
import { computed, defineComponent, type PropType } from 'vue'

type I18nKey = Parameters<typeof $t>[0]

const safeParse = <T extends object>(input: unknown): T => {
  if (!input) return {} as T
  try {
    if (typeof input === 'object') return JSON.parse(JSON.stringify(input))
    if (typeof input === 'string') {
      const firstParse = JSON.parse(input)
      if (typeof firstParse === 'string') return JSON.parse(firstParse)
      return firstParse
    }
  } catch (e) {
    console.warn('ApprovalContentDiffCheck parse error:', e)
  }
  return {} as T
}

export default defineComponent({
  name: 'ApprovalContentDiffCheck',
  props: {
    data: {
      type: Object as PropType<ApprovalInstance<Record<string, unknown>>>,
      required: true,
    },
    variant: {
      type: String as PropType<'screen' | 'print'>,
      default: 'screen',
    },
    showOnlyChanged: {
      type: Boolean,
      default: false,
    },
    disableListToggle: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const isUserAdditionalInfo = computed(() => props.data.processName === '用户信息审批')

    const approvalDataUser = computed(() => safeParse<UserAdditionalInfo>(props.data.approvalData))
    const sourceDataUser = computed(() => (props.data.sourceData ? safeParse<UserAdditionalInfo>(props.data.sourceData) : null))

    const userOrder = [
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

    const userConvertValue = (itemKey: string, raw: unknown) => {
      return match(itemKey)
        .with('registerType', () => RegisterTypeOption.find((item) => item.value === raw)?.label)
        .with('bankName', () => BankOption.find((item) => item.value === raw)?.label)
        .with('pca', () => findPathInTree(areaData, raw as string)?.map((item) => item.label).join('-'))
        .otherwise(() => raw)
    }

    const userLabel = (itemKey: (typeof userOrder)[number], data: UserAdditionalInfo | null | undefined): string => {
      if (!data) return ''
      const labelMap: Record<Exclude<(typeof userOrder)[number], 'name'>, I18nKey> = {
        registerType: 'domain.user.field.registerType',
        pca: 'domain.user.field.region',
        companyAddress: 'domain.user.field.companyAddress',
        contactPerson: 'domain.user.field.contactPerson',
        contactPersonPhone: 'domain.user.field.contactPhone',
        identity: 'domain.user.field.identity',
        bankName: 'domain.user.field.bankName',
        bankAccount: 'domain.user.field.bankAccount',
      }
      const key: I18nKey =
        itemKey === 'name'
          ? RegisterType.INDIVIDUAL === data.registerType
            ? 'domain.user.field.name'
            : 'domain.user.field.usci'
          : labelMap[itemKey]
      return $t(key) as string
    }

    const userShouldShow = (key: keyof UserAdditionalInfo, data: UserAdditionalInfo | null): boolean => {
      if (!data) return false
      const v = data[key]
      return v !== null && v !== undefined && v !== ''
    }

    const userFields = computed<FieldDefinition[]>(() => {
      return userOrder
        .filter((key) => userShouldShow(key as keyof UserAdditionalInfo, approvalDataUser.value) || userShouldShow(key as keyof UserAdditionalInfo, sourceDataUser.value))
        .map((key) => {
          const ctx = approvalDataUser.value?.[key] ? approvalDataUser.value : sourceDataUser.value || approvalDataUser.value
          return { key, label: userLabel(key, ctx), type: 'text' }
        })
    })

    const userData = computed<FormData>(() => {
      const data: FormData = {}
      userFields.value.forEach((f) => {
        const key = f.key as keyof UserAdditionalInfo
        const raw = approvalDataUser.value?.[key]
        const display = userConvertValue(String(key), raw)
        data[String(key)] = display == null ? '' : String(display)
      })
      return data
    })

    const userOldData = computed<FormData | null>(() => {
      if (!sourceDataUser.value) return null
      const data: FormData = {}
      userFields.value.forEach((f) => {
        const key = f.key as keyof UserAdditionalInfo
        const raw = sourceDataUser.value?.[key]
        const display = userConvertValue(String(key), raw)
        data[String(key)] = display == null ? '' : String(display)
      })
      return data
    })

    // ========== Service Agreement ==========

    const approvalDataAgreement = computed(() => props.data.approvalData as unknown as ServiceAgreementRequestDTO)
    const sourceDataAgreement = computed(() => (props.data.sourceData as unknown as ServiceAgreementRequestDTO | null) ?? null)

    const agreementFileIdKeys = [
      'billIds',
      'contractScanIds',
      'supplementaryAttachmentIds',
    ] as const

    const allFileIds = computed(() => {
      const ids: number[] = []
      const collect = (obj: ServiceAgreementRequestDTO | null) => {
        if (!obj) return
        agreementFileIdKeys.forEach((key) => {
          const arr = obj[key]
          if (Array.isArray(arr) && arr.length) ids.push(...arr)
        })
      }
      collect(sourceDataAgreement.value)
      collect(approvalDataAgreement.value)
      return uniq(ids).filter((id) => typeof id === 'number' && id > 0)
    })

    const { data: files } = useFilesDetailQuery(allFileIds)

    const fileMap = computed(() => {
      const map = new Map<number, FileResponse>()
      ;(files.value || []).forEach((f) => map.set(f.id, f))
      return map
    })

    const pickFiles = (ids: number[] | null | undefined): FileResponse[] => {
      if (!ids || !ids.length) return []
      return ids.map((id) => fileMap.value.get(id)).filter(Boolean) as FileResponse[]
    }

    const agreementFields = computed<FieldDefinition[]>(() => buildServiceAgreementDiffCheckFields())

    const agreementData = computed<FormData>(() => {
      const model = {
        ...approvalDataAgreement.value,
        contractScanFiles: pickFiles(approvalDataAgreement.value.contractScanIds),
        billFiles: pickFiles(approvalDataAgreement.value.billIds),
        supplementaryAttachmentFiles: pickFiles(approvalDataAgreement.value.supplementaryAttachmentIds),
      }
      return toServiceAgreementDiffCheckForm(model)
    })

    const agreementOldData = computed<FormData | null>(() => {
      if (!sourceDataAgreement.value) return null
      const model = {
        ...sourceDataAgreement.value,
        contractScanFiles: pickFiles(sourceDataAgreement.value.contractScanIds),
        billFiles: pickFiles(sourceDataAgreement.value.billIds),
        supplementaryAttachmentFiles: pickFiles(sourceDataAgreement.value.supplementaryAttachmentIds),
      }
      return toServiceAgreementDiffCheckForm(model)
    })

    const fields = computed(() => (isUserAdditionalInfo.value ? userFields.value : agreementFields.value))
    const data = computed(() => (isUserAdditionalInfo.value ? userData.value : agreementData.value))
    const oldData = computed(() => (isUserAdditionalInfo.value ? userOldData.value : agreementOldData.value))

    return () => (
      <UnifiedFormTable
        variant={props.variant}
        fields={fields.value}
        data={data.value}
        oldData={oldData.value}
        showOnlyChanged={oldData.value ? props.showOnlyChanged && props.variant === 'screen' : false}
        columnCount={2}
        expandAllLists
        disableListToggle={props.disableListToggle || props.variant === 'print'}
      />
    )
  },
})
