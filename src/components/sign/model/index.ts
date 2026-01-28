import type {
  AttachmentDataForUI,
  CustomerInfoDataForUI,
  ServiceAgreementRequestDTO,
  ServiceAgreementUIMap,
  ServiceAgreementVo,
  SignInfoDataForUI,
} from '@/components/sign/api/sign'
import type { OssCallbackDTO } from '@/components/file/api/file-storage'
import { ServiceAgreementStatusEnum } from '../constant/enum'
// =================================================================
// 1. 子工厂：客户基本信息 (Customer Info)
// =================================================================
/**
 * 将后端 VO 转换为 UI 所需的 CustomerInfo
 */
export const createCustomerInfoModel = (
  origin: Partial<ServiceAgreementVo> = {},
): CustomerInfoDataForUI => {
  return {
    id: origin.id ?? null,
    // 核心枚举：默认给 '1' (备案)，保证 Select 组件有默认选中
    status: origin.status ?? ServiceAgreementStatusEnum.Record,

    // 字符串字段：给 '' 而不是 null/undefined，防止 input 报 warning
    companyName: origin.companyName ?? '',
    companyArea: origin.companyArea ?? '',
    companyAddress: origin.companyAddress ?? '',

    industry: origin.industry ?? null, // 下拉框通常允许 null

    // 联系人信息
    liaisonName: origin.liaisonName ?? '',
    liaisonPosition: origin.liaisonPosition ?? '',
    liaisonPhone: origin.liaisonPhone ?? '',

    // 数值字段：初始化为 0 或 null，视业务需求而定
    yearUsableCharge: origin.yearUsableCharge ?? 0,

    // 分时电价逻辑
    isTimeOfUsePricingEnabled: origin.isTimeOfUsePricingEnabled ?? false,
    peakPercentage: origin.peakPercentage ?? null,
    superPeakPercentage: origin.superPeakPercentage ?? null,
    standardPercentage: origin.standardPercentage ?? null,
    valleyPercentage: origin.valleyPercentage ?? null,

    // 备注
    comment: origin.comment ?? '',
  }
}

// =================================================================
// 2. 子工厂：签约信息 (Sign Info)
// =================================================================
/**
 * 将后端 VO 转换为 UI 所需的 SignInfo
 */
export const createSignInfoModel = (
  origin: Partial<ServiceAgreementVo> = {},
): SignInfoDataForUI => {
  return {
    // 价格相关枚举：默认为 null (未选择)
    priceModel: origin.priceModel ?? null,
    priceType: origin.priceType ?? null,
    priceCategory: origin.priceCategory ?? null,

    // 价格数值 (字符串类型以保证精度)
    fixedPrice: origin.fixedPrice ?? null,
    fixedSpread: origin.fixedSpread ?? null,
    revenueShareRatio: origin.revenueShareRatio ?? null,

    // 合同过期时间
    expirationTime: origin.expirationTime ? new Date(origin.expirationTime).getTime() : null,

    comment: null,

    // 关键：营销户号列表
    // 必须保证是数组，防止 v-for 报错
    servicePointSpecifications: Array.isArray(origin.servicePointSpecifications)
      ? origin.servicePointSpecifications
      : [],
  }
}

// =================================================================
// 3. 子工厂：附件信息 (Attachment Info)
// =================================================================
/**
 * 将后端 VO (含文件对象列表) 转换为 UI 提交所需的 (ID 列表)
 * 注意：这里是单向转换，用于初始化表单状态。
 */
export const createAttachmentInfoModel = (
  origin: Partial<ServiceAgreementVo> = {},
): AttachmentDataForUI => {
  // 辅助函数：从对象数组中提取 ID 数组
  const mapIds = (files?: OssCallbackDTO[]): number[] => {
    if (!Array.isArray(files)) return []
    return files.map((f) => f.id)
  }

  return {
    // UI Map 需要的是 ID 列表 (根据你的定义)
    // 即便后端传 null，这里也初始化为空数组，方便后续 push 操作
    contractScanIds: origin.contractScanIds || mapIds(origin.contractScanFiles),
    billIds: origin.billIds || mapIds(origin.billFiles),
    supplementaryAttachmentIds:
      origin.supplementaryAttachmentIds || mapIds(origin.supplementaryAttachmentFiles),
  }
}

// =================================================================
// 4. 聚合根工厂 (Aggregate Root Factory)
// =================================================================
/**
 * 主入口：将可能为空的后端 VO 转换为“充血”的 UI 状态树
 * @param origin 后端返回的详情数据 (如果是新建，则为 undefined)
 */
export const createServiceAgreementModel = (
  origin?: Partial<ServiceAgreementVo>,
): ServiceAgreementUIMap => {
  // 即使 origin 是 undefined (新建场景)，safeOrigin 也是 {}
  // 从而保证下方的子工厂接收到的参数是安全的
  const safeOrigin = origin || {}

  return {
    customerInfo: createCustomerInfoModel(safeOrigin),
    signInfo: createSignInfoModel(safeOrigin),
    attachmentInfo: createAttachmentInfoModel(safeOrigin),
  }
}

/**
 * 将 UI 状态树转换为后端所需的 DTO
 * @param uiModel Vue 组件绑定的 UI 状态
 * @param isSigning 是否是执行“签约”操作 (用于强制设置 status)
 */
export const convertUIToRequestDTO = (
  uiModel: ServiceAgreementUIMap,
): ServiceAgreementRequestDTO => {
  const { customerInfo, signInfo, attachmentInfo } = uiModel
  return {
    // --- 基础字段 ---
    id: customerInfo.id,
    status: customerInfo.status,
    companyName: customerInfo.companyName,
    companyArea: customerInfo.companyArea,
    companyAddress: customerInfo.companyAddress,
    industry: customerInfo.industry || '', // 处理 null
    liaisonName: customerInfo.liaisonName,
    liaisonPosition: customerInfo.liaisonPosition,
    liaisonPhone: customerInfo.liaisonPhone,
    yearUsableCharge: customerInfo.yearUsableCharge || 0,
    isTimeOfUsePricingEnabled: customerInfo.isTimeOfUsePricingEnabled,
    peakPercentage: customerInfo.peakPercentage,
    superPeakPercentage: customerInfo.superPeakPercentage,
    standardPercentage: customerInfo.standardPercentage,
    valleyPercentage: customerInfo.valleyPercentage,
    comment: customerInfo.comment,

    // --- 签约字段 ---
    priceModel: signInfo.priceModel,
    priceType: signInfo.priceType,
    priceCategory: signInfo.priceCategory,
    fixedPrice: signInfo.fixedPrice,
    fixedSpread: signInfo.fixedSpread,
    revenueShareRatio: signInfo.revenueShareRatio,
    expirationTime: signInfo.expirationTime,
    servicePointSpecifications: signInfo.servicePointSpecifications,

    // --- 附件字段 ---
    contractScanIds: attachmentInfo.contractScanIds,
    billIds: attachmentInfo.billIds,
    supplementaryAttachmentIds: attachmentInfo.supplementaryAttachmentIds,
  }
}
