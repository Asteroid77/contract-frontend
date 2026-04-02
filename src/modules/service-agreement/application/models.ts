import type { BaseQuery, ConditionWrapper } from '@/modules/shared/application/request/types'
import type { OssCallbackView } from '@/modules/file/application/models'
import type {
  ServiceAgreement as DomainServiceAgreement,
  ServicePointSpecification as DomainServicePointSpecification,
} from '../domain/types'
import type {
  ElectricityConsumptionType as DomainElectricityConsumptionType,
  PriceCategory as DomainPriceCategory,
  PriceModel as DomainPriceModel,
  PriceType as DomainPriceType,
  ServiceAgreementStatus as DomainServiceAgreementStatus,
} from '../domain/enums'

/**
 * @file Types converted from ServiceAgreement.java
 */

// --- Enum Types ---
// Re-exporting enums/types for convenience if needed, or just using them directly.
// In this file, we will use the imported types.

/**
 * 签约状态
 */
export type ServiceAgreementStatus = DomainServiceAgreementStatus

/**
 * 价格模式
 */
export type PriceModel = DomainPriceModel

/**
 * 价格类型
 */
export type PriceType = DomainPriceType

/**
 * 价格种类
 */
export type PriceCategory = DomainPriceCategory

/**
 * 用电类别
 */
export type ElectricityConsumptionType = DomainElectricityConsumptionType

// --- Main Interface ---

/**
 * 备案/签约实体
 * Refactored to use Domain Entity
 */
export type ServiceAgreement = DomainServiceAgreement

/**
 * 营销户号信息
 * @description Refactored to use Domain Entity, but with optional timestamps for UI creation/forms.
 */
export type ServicePointSpecification = Omit<
  DomainServicePointSpecification,
  'createdTime' | 'updatedTime'
> & {
  createdTime?: string
  updatedTime?: string | null
}

/**
 * 备案/签约数据前端展示体
 * @description 对应 Java 中的 ServiceAgreementVo 类
 */
export interface ServiceAgreementDetail extends Omit<
  ServiceAgreement,
  'expirationTime' | 'createdTime' | 'updatedTime'
> {
  /**
   * 合同到期时间 (UI 使用 Timestamp)
   */
  expirationTime: number | null
  createdTime: number
  updatedTime: number

  /**
   * 合同扫描件文件列表
   */
  contractScanFiles: OssCallbackView[]
  contractScanIds?: number[]

  /**
   * 近一个月电费单文件列表
   */
  billFiles: OssCallbackView[]
  billIds?: number[]

  /**
   * 其它附件文件列表
   */
  supplementaryAttachmentFiles: OssCallbackView[]
  supplementaryAttachmentIds?: number[]

  /**
   * 营销户号集合
   */
  servicePointSpecifications: ServicePointSpecification[]
}

export interface ServiceAgreementData extends Omit<
  ServiceAgreement,
  | 'creator'
  | 'updatedTime'
  | 'createdTime'
  | 'id'
  | 'expirationTime'
  | 'companyName'
  | 'companyArea'
  | 'companyAddress'
  | 'industry'
  | 'liaisonName'
  | 'liaisonPosition'
  | 'liaisonPhone'
  | 'comment'
> {
  companyName: string | null
  companyArea: string | null
  companyAddress: string | null
  industry: string | null
  liaisonName: string | null
  liaisonPosition: string | null
  liaisonPhone: string | null
  comment: string | null
  /**
   * 营销户号集合
   */
  servicePointSpecifications: ServicePointSpecification[] | null
  id: number | null
  /**
   * 合同到期时间 (UI 使用 Timestamp)
   */
  expirationTime: number | null
}

export interface ServiceAgreementAttachmentsData {
  [key: string]: OssCallbackView[]
  contractScanFiles: OssCallbackView[]
  billFiles: OssCallbackView[]
  supplementaryAttachmentFiles: OssCallbackView[]
}

export type ServiceAgreementAttaches = ServiceAgreementAttachmentsData

/**
 * 备案/签约请求表单数据 (UI Form State)
 * @description
 * 这是一个纯前端的 UI 模型，用于收集用户输入。
 * 它的结构类似 DTO，但字段类型是为了适应前端组件（如 DatePicker 使用 timestamp）。
 * 同时也消除了与 Domain DTO 的命名冲突。
 */
export type ServiceAgreementForm =
  // 1. 从基础 ServiceAgreement 类型中排除掉服务器生成的、或类型不匹配的字段
  Omit<
    ServiceAgreement,
    | 'id'
    | 'creator'
    | 'createdTime'
    | 'updatedTime'
    | 'expirationTime'
    | 'companyName'
    | 'companyArea'
    | 'companyAddress'
    | 'industry'
    | 'liaisonName'
    | 'liaisonPosition'
    | 'liaisonPhone'
    | 'comment'
  > & {
    // 允许表单字段为空
    companyName: string | null
    companyArea: string | null
    companyAddress: string | null
    industry: string | null
    liaisonName: string | null
    liaisonPosition: string | null
    liaisonPhone: string | null
    comment: string | null
    // 2. 重新定义 DTO 中存在的、但可能为空的 id
    /**
     * 主键ID.
     * 在创建新记录时应为 null，在更新时为记录的 number ID。
     */
    id: number | null

    /**
     * 合同到期时间 (UI 使用 Timestamp)
     */
    expirationTime: number | null

    // 4. 添加 DTO 中特有的、用于关联文件的 ID 列表
    /**
     * 合同扫描件ids
     * @validation 在“签约”状态下不能为空
     */
    contractScanIds: number[] | null

    /**
     * 近一个月电费单ids
     * @validation 在“签约”状态下不能为空
     */
    billIds: number[] | null

    /**
     * 其它附件ids
     */
    supplementaryAttachmentIds: number[] | null

    /**
     * 营销户号集合
     * @validation 在“签约”状态下不能为空
     */
    servicePointSpecifications: ServicePointSpecification[] | null
  }

/**
 * 分时电价
 */
export interface TimeOfUsePricingValue {
  // 是否执行分时电价
  isTimeOfUsePricingEnabled: boolean
  // 尖比例(%)
  peakPercentage: number | null
  // 峰
  superPeakPercentage: number | null
  // 平
  standardPercentage: number | null
  // 谷
  valleyPercentage: number | null
}

/**
 * [UI-Facing] 更新整个表单的UI状态树
 */
export interface ServiceAgreementUIMap {
  customerInfo: CustomerInfoDataForUI
  signInfo: SignInfoDataForUI // 新增 signInfo 分区
  attachmentInfo: AttachmentDataForUI
}

/**
 * [UI-Facing] 客户基本信息分区的数据结构
 * 这是从扁平的 ServiceAgreement 中派生出来的，专门用于 CustomerInfoPart 组件。
 */
export interface CustomerInfoDataForUI {
  id: number | null
  status: ServiceAgreementStatus
  companyName: string
  industry: string | null
  companyArea: string
  companyAddress: string
  liaisonName: string
  liaisonPosition: string
  liaisonPhone: string
  yearUsableCharge: number | null
  isTimeOfUsePricingEnabled: boolean
  peakPercentage: number | null
  superPeakPercentage: number | null
  standardPercentage: number | null
  valleyPercentage: number | null
  comment: string | null
}
/**
 * [UI-Facing] 签约详情分区的数据结构
 */
export interface SignInfoDataForUI {
  /** 价格模式 */
  priceModel: PriceModel | null
  priceType: PriceType | null
  /** 价格种类 */
  priceCategory: PriceCategory | null
  /** 固定价格 */
  fixedPrice: string | null
  /** 固定价差 */
  fixedSpread: string | null
  /** 收入分成比例 (%) */
  revenueShareRatio: number | null
  /** 合同到期时间 */
  expirationTime: number | null
  /** 营销户号列表  */
  servicePointSpecifications: ServicePointSpecification[]
  /** 价格模式为其它时，备注 */
  comment: string | null
}
/**
 * [UI-Facing] PriceGroupWidget 组件所需的数据子集
 */
export type PriceGroupData = Pick<
  SignInfoDataForUI,
  | 'priceModel'
  | 'priceType'
  | 'priceCategory'
  | 'fixedPrice'
  | 'fixedSpread'
  | 'revenueShareRatio'
  | 'comment'
>
/**
 * [UI-Facing] 附件上传分区的数据结构
 */
export interface AttachmentDataForUI {
  contractScanIds: number[] | null
  billIds: number[] | null
  supplementaryAttachmentIds: number[] | null
}
export interface AttachmentDataForInitiation {
  /**
   * 合同扫描件文件列表
   */
  contractScanFiles: OssCallbackView[]

  /**
   * 近一个月电费单文件列表
   */
  billFiles: OssCallbackView[]

  /**
   * 其它附件文件列表
   */
  supplementaryAttachmentFiles: OssCallbackView[]
}

/**
 * 分页查询参数 (UI Query State)
 * @description 对应 Java 中的 ServiceAgreementPageDTO 类
 */
export interface ServiceAgreementPageQuery extends BaseQuery {
  /** 公司名称（支持：like） */
  companyName?: ConditionWrapper<string>
  /** 公司所在地区（支持：like） */
  companyArea?: ConditionWrapper<string>
  /** 备案/签约状态（支持：eq） */
  status?: ConditionWrapper<ServiceAgreementStatus>
  /** 合同过期时间（支持：gt, ge, lt, le, between） */
  expiredTime?: ConditionWrapper<number | [number, number]>
  /** 年用电量（支持：gt, ge, lt, le, between） */
  yearUsableCharge?: ConditionWrapper<number | [number, number]>
}
/**
 * 分页列表项 (UI List Item)
 * @description 对应 Java 中的 ServiceAgreementPageVo 类
 */
export interface ServiceAgreementPageItem {
  /** 主键ID */
  id: number
  /** 企业名称 */
  companyName: string
  /** 企业所处地区（6位区代码，如：110101） */
  companyArea: string
  /** 签约状态：1-备案，2-签约 */
  status: ServiceAgreementStatus
  /** 年用电量（万千瓦时） */
  yearUsableCharge: number
  /** 合同到期时间 (格式: yyyy-MM-dd HH:mm:ss) */
  expirationTime: string | null
}

/**
 * 1表单2审批1
 */
export type PreviewType = 1 | 2
/**
 * 获取预览附件的请求参数 (UI Query)
 */
export interface PreviewAttachmentsQuery {
  /**
   * 业务ID (表单查看时为 AgreementID，审批查看时为 ApprovalInstanceID)
   */
  id: number
  /**
   * 预览类型
   */
  type: PreviewType
  /**
   * 访问码 (手机号后四位)
   */
  code: string
}

export type ServiceAgreementAttachesData = ServiceAgreementAttachmentsData

/**
 * 预览附件的返回 VO
 */
export interface PreviewAttachmentsData {
  newFiles: ServiceAgreementAttachmentsData
  oldFiles: ServiceAgreementAttachmentsData
}
