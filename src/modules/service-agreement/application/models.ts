import type { BaseQuery, ConditionWrapper } from '@/modules/shared/application/request/types'
import type { OssCallbackView } from '@/modules/file/application/models'

export type PriceGroup = {
  // 价格模式
  priceMode: string | unknown
  // 价格类型
  priceType: string | unknown
  // 价格种类
  priceSort: string | unknown
  // 固定价格
  settledPrice: string | unknown
  // 固定价差
  settledSpread: string | unknown
  // 分成比例
  splitRatio: string | unknown
  // 其它(备注)
  remark: string | unknown
}
/**
 * @file Types converted from ServiceAgreement.java
 */

// --- Enum Types ---

/**
 * 签约状态
 * 1: 备案
 * 2: 签约
 */
export type ServiceAgreementStatus = 1 | 2 | 3

/**
 * 价格模式
 * '分成类' | '保底类' | '保底分成类' | '其它'
 */
export type PriceModel = 1 | 2 | 3 | 4

/**
 * 价格类型
 * '电厂侧' | '用户侧' | '售电公司侧'
 */
export type PriceType = 1 | 2 | 3

/**
 * 价格种类
 * '固定价格' | '固定价差' | '分成比例'
 */
export type PriceCategory = 1 | 2 | 3

/**
 * 用电类别
 */
export type ElectricityConsumptionType = 1 | 2

// --- Main Interface ---

/**
 * 备案/签约实体
 */
export interface ServiceAgreement {
  /**
   * 主键ID
   * @example 1
   */
  id: number

  /**
   * 企业名称
   * @example "某某科技有限公司"
   */
  companyName: string

  /**
   * 企业所处地区(p/c/a，由地区代码组成)
   * @example "110000/110100/110101"
   */
  companyArea: string

  /**
   * 企业详细地址
   * @example "华乐街道翻斗花园25号8栋909楼"
   */
  companyAddress: string

  /**
   * 企业所处行业
   * @example "制造业"
   */
  industry: string | null

  /**
   * 签约状态
   * @see ServiceAgreementStatus
   */
  status: ServiceAgreementStatus

  /**
   * 联系人姓名
   * @example "张三"
   */
  liaisonName: string

  /**
   * 联系人职务
   * @example "总经理"
   */
  liaisonPosition: string

  /**
   * 联系人电话
   * @example "13800138000"
   */
  liaisonPhone: string

  /**
   * 年用电量（万千瓦时）
   * @example 1000
   */
  yearUsableCharge: number

  /**
   * 是否执行分时电价策略
   * @example true
   */
  isTimeOfUsePricingEnabled: boolean

  /**
   * 峰比例 (%)
   * @example 30
   */
  peakPercentage: number | null

  /**
   * 尖比例 (%)
   * @example 10
   */
  superPeakPercentage: number | null

  /**
   * 平比例 (%)
   * @example 40
   */
  standardPercentage: number | null

  /**
   * 谷比例 (%)
   * @example 20
   */
  valleyPercentage: number | null

  /**
   * 进度备注
   * @example "正在审核中"
   */
  comment: string | null

  /**
   * 价格模式
   * @see PriceModel
   */
  priceModel: PriceModel | null

  /**
   * 价格类型
   * @see PriceType
   */
  priceType: PriceType | null

  /**
   * 价格种类
   * @see PriceCategory
   */
  priceCategory: PriceCategory | null

  /**
   * 固定价格 (作为字符串以保证精度)
   * @example "0.5500"
   */
  fixedPrice: string | null

  /**
   * 固定价差 (作为字符串以保证精度)
   * @example "0.0200"
   */
  fixedSpread: string | null

  /**
   * 收入分成比例 (%)
   * @example 30
   */
  revenueShareRatio: number | null

  /**
   * 合同到期时间 (格式: yyyy-MM-dd HH:mm:ss)
   * @example "2025-12-31 23:59:59"
   */
  expirationTime: number | null

  /**
   * 创建人id
   * @example 1
   */
  creator: number

  /**
   * 创建时间 (格式: yyyy-MM-dd HH:mm:ss)
   * @example "2025-07-24 10:00:00"
   */
  createdTime: number

  /**
   * 更新时间 (格式: yyyy-MM-dd HH:mm:ss)
   * @example "2025-07-24 10:00:00"
   */
  updatedTime: number
}
/**
 * 营销户号信息
 * @description 对应 Java 中的 ServicePointSpecification 类
 */
export interface ServicePointSpecification {
  /**
   * 主键ID
   * @example 1
   */
  id: number

  /**
   * 关联备案/签约项的id
   * @type {number} (Java Long)
   * @example 1
   */
  agreementId: number

  /**
   * 营销户号
   * @example "1234567890"
   */
  serviceAccount: string

  /**
   * 变压器容量(kVA)
   * @type {number} (Java BigDecimal)
   * @example 1000.50
   */
  transformerCapacity: number

  /**
   * 用电类别
   */
  electricityConsumptionType: ElectricityConsumptionType

  /**
   * 电压等级(kV)
   * @example "10kV"
   */
  voltageClass: string

  /**
   * 创建时间 (ISO 8601 格式字符串)
   * @type {string} (Java LocalDateTime)
   * @example "2025-07-24T10:00:00"
   */
  createdTime?: string

  /**
   * 更新时间 (ISO 8601 格式字符串)
   * @type {string | null} (Java LocalDateTime)
   * @example "2025-07-24T10:00:00"
   */
  updatedTime?: string | null
}

/**
 * 备案/签约数据前端展示体
 * @description 对应 Java 中的 ServiceAgreementVo 类
 */
export interface ServiceAgreementVo extends ServiceAgreement {
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

export interface ServiceAgreementBaseVO
  extends Omit<ServiceAgreement, 'creator' | 'updatedTime' | 'createdTime' | 'id'> {
  /**
   * 营销户号集合
   */
  servicePointSpecifications: ServicePointSpecification[] | null
  id: number | null
}

export interface ServiceAgreementAttachmentsVO {
  [key: string]: OssCallbackView[]
  contractScanFiles: OssCallbackView[]
  billFiles: OssCallbackView[]
  supplementaryAttachmentFiles: OssCallbackView[]
}

export type ServiceAgreementAttaches = ServiceAgreementAttachmentsVO

/**
 * 备案/签约请求DTO (Data Transfer Object)
 * @description
 * 这个类型用于向服务器发送创建或更新服务协议的请求。
 * 它通过 `Omit` 从基础的 `ServiceAgreement` 类型中移除了服务器生成的字段（如 id, createdTime, updatedTime），
 * 然后添加了特定于请求的字段（如文件ID列表）和覆盖了类型不一致的字段（如 creator）。
 */
export type ServiceAgreementRequestDTO =
  // 1. 从基础 ServiceAgreement 类型中排除掉服务器生成的、或类型不匹配的字段
  Omit<ServiceAgreement, 'id' | 'creator' | 'createdTime' | 'updatedTime'> & {
    // 2. 重新定义 DTO 中存在的、但可能为空的 id
    /**
     * 主键ID.
     * 在创建新记录时应为 null，在更新时为记录的 number ID。
     */
    id: number | null

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
 * 分页查询参数
 * @description 对应 Java 中的 ServiceAgreementPageDTO 类
 */
export interface ServiceAgreementPageDTO extends BaseQuery {
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
 * 分页列表 VO
 * @description 对应 Java 中的 ServiceAgreementPageVo 类
 */
export interface ServiceAgreementPageVo {
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
 * 获取预览附件的请求 DTO
 */
export interface ServiceAgreementPreviewAttachmentsDTO {
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

export type ServiceAgreementAttachesVO = ServiceAgreementAttachmentsVO

/**
 * 预览附件的返回 VO
 */
export interface PreviewAttachmentsVO {
  newFiles: ServiceAgreementAttachmentsVO
  oldFiles: ServiceAgreementAttachmentsVO
}
