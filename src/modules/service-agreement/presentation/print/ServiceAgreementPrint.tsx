import { defineComponent, type PropType, ref } from 'vue'
import dayjs from 'dayjs'
import { isEqual } from 'lodash'
import { $t } from '@/_utils/i18n'

// --- 类型定义 ---
import type {
  PriceModel,
  PriceType,
  ServiceAgreementBaseVO,
  ServicePointSpecification,
} from '@/modules/service-agreement/application/models'

// --- 工具类 ---
import { TreeLookup } from '@/modules/shared/presentation/lookup'
import { SelectLookup } from '@/modules/shared/presentation/lookup'
import PcaData from '@/modules/shared/application/constants/PCA.json'

// --- 常量/枚举 ---
import {
  ServiceAgreementStatusOption,
  PriceModelOption,
  PriceTypeOption,
  PriceCategoryOption,
  UsageCategoryOption,
  ServiceAgreementStatusEnum,
  PriceCategoryEnum,
  PriceModelEnum,
} from '@/modules/service-agreement/application/constants'

// --- 引入通用 Diff 组件 (上一轮定义的) ---
import { DiffRenderer } from '@/modules/approval/presentation/print/DiffRenderer'
import clsx from 'clsx'
import { compareList, type DiffRow } from '@/modules/approval/application/print/ListDiff'

// ==========================================
// 2. 组件定义
// ==========================================
export default defineComponent({
  name: 'ServiceAgreementPrint',
  props: {
    data: {
      type: Object as PropType<
        Omit<ServiceAgreementBaseVO, 'creator' | 'createdTime' | 'updatedTime'>
      >,
      required: true,
    },
    compareData: {
      type: Object as PropType<
        Omit<ServiceAgreementBaseVO, 'creator' | 'createdTime' | 'updatedTime'> | null | undefined
      >,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    // --- 字典初始化 ---
    const statusLookup = new SelectLookup(ServiceAgreementStatusOption)
    const priceModelLookup = new SelectLookup(PriceModelOption)
    const priceCategoryLookup = new SelectLookup(PriceCategoryOption(ref<PriceModel | null>(null)))
    const priceTypeLookup = new SelectLookup(PriceTypeOption(ref<PriceType | null>(null)))
    const usageCategoryLoopup = new SelectLookup(UsageCategoryOption)
    const areaLookup = new TreeLookup(PcaData)

    // --- 格式化函数 (复用) ---
    const formatters = {
      date: (ts: unknown) => (ts ? dayjs(ts as number).format('YYYY-MM-DD HH:mm:ss') : '-'),
      priceType: (v: unknown) => (v ? priceTypeLookup.getLabel(v as number) : '-'),
      priceCategory: (v: unknown) => (v ? priceCategoryLookup.getLabel(v as number) : '-'),
      usageCategory: (v: unknown) => (v ? `${usageCategoryLoopup.getLabel(v as number)}` : '-'),
      status: (v: unknown) => statusLookup.getLabel(v as number),
      priceModel: (v: unknown) => priceModelLookup.getLabel(v as number),
      area: (v: unknown) => areaLookup.getFullPath(v as string),
      // 通用兜底
      default: (v: unknown) => (v === null || v === undefined ? '-' : String(v)),
      capacity: (v: unknown) => (v ? `${v} kVA` : '-'),
      voltage: (v: unknown) => (v ? `${v} kV` : '-'),
      percentage: (v: unknown) => (v ? `${v}% ` : '-'),
    }

    // 渲染基础信息的 Diff
    // key: 字段名
    // formatFn: 可选的格式化函数
    const renderDiffItem = (key: keyof ServiceAgreementBaseVO, formatFn = formatters.default) => {
      const newVal = props.data[key]
      const oldVal = props.compareData ? props.compareData[key] : undefined // 如果没 compareData，oldVal 为 undefined

      // 对新旧值都应用格式化
      const displayNew = formatFn(newVal)
      const displayOld = props.compareData ? formatFn(oldVal) : undefined

      return <DiffRenderer newValue={displayNew} oldValue={displayOld} />
    }

    // 渲染列表单元格的 Diff
    // 专门用于处理 compareList 生成的 DiffRow
    const renderListCell = (
      row: DiffRow<ServicePointSpecification>,
      field: keyof ServicePointSpecification,
      formatFn = formatters.default,
    ) => {
      const val = row.data[field]
      const displayVal = formatFn(val)

      // 新增或删除行：只显示单一值（颜色由 tr 的 class 控制）
      if (row.status === 'added' || row.status === 'removed') {
        return displayVal
      }

      // 修改行：只有这一行的某个具体字段变了，才显示 Diff
      if (row.status === 'modified' && row.oldData) {
        const oldVal = row.oldData[field]
        // 值不同才显示 Diff 组件，否则显示普通文本
        if (!isEqual(val, oldVal)) {
          return <DiffRenderer newValue={displayVal} oldValue={formatFn(oldVal)} />
        }
      }

      // 无变化
      return displayVal
    }

    return () => {
      // 解构数据方便逻辑判断
      const {
        status,
        isTimeOfUsePricingEnabled,
        priceModel,
        priceCategory,
        // List 数据
        servicePointSpecifications,
      } = props.data

      // 执行列表比对
      const diffList = compareList(
        servicePointSpecifications || [],
        props.compareData?.servicePointSpecifications,
        'serviceAccount',
      )

      const isSign = status === ServiceAgreementStatusEnum.Sign
      console.log('props.compareData', props.compareData)
      const sectionTitleClass = clsx(
        `${props.compareData === undefined ? 'section-title' : 'sub-section-title'}`,
      )

      return (
        <div class="print-container">
          {!props.compareData && (
            <div class="print-header">
              <h1>{$t('domain.agreement.print.title')}</h1>
              <div class="print-meta">
                <span>
                  {$t('common.action.print')}: {dayjs().format('YYYY-MM-DD HH:mm')}
                </span>
                <span>
                  {$t('common.field.id')}: {props.data.id || '-'}
                </span>
              </div>
            </div>
          )}

          {/*  基础信息  */}
          <section class="print-section">
            <div class={sectionTitleClass}>{$t('domain.agreement.tab.base')}</div>
            <table class="info-table">
              <tbody>
                <tr>
                  <td class="label">{$t('domain.agreement.field.companyName')}</td>
                  <td class="value" colspan={3}>
                    {renderDiffItem('companyName')}
                  </td>
                </tr>
                <tr>
                  <td class="label">{$t('common.label.status')}</td>
                  <td class="value">{renderDiffItem('status', formatters.status)}</td>
                  <td class="label">{$t('domain.agreement.field.industry')}</td>
                  <td class="value">{renderDiffItem('industry')}</td>
                </tr>
                <tr>
                  <td class="label">{$t('domain.agreement.field.area')}</td>
                  <td class="value">{renderDiffItem('companyArea', formatters.area)}</td>
                  <td class="label">{$t('domain.agreement.field.address')}</td>
                  <td class="value">{renderDiffItem('companyAddress')}</td>
                </tr>
                <tr>
                  <td class="label">{$t('domain.agreement.field.contact')}</td>
                  <td class="value">{renderDiffItem('liaisonName')}</td>
                  <td class="label">{$t('domain.agreement.field.phone')}</td>
                  <td class="value">{renderDiffItem('liaisonPhone')}</td>
                </tr>
                <tr>
                  <td class="label">{$t('domain.agreement.field.position')}</td>
                  <td class="value" colspan={3}>
                    {renderDiffItem('liaisonPosition')}
                  </td>
                </tr>

                {/*
                   特殊处理：分时电价 Grid
                   这个结构比较复杂，不适合用简单的 DiffRenderer。
                   通常策略：如果整个开关或比例变了，直接整个区域显示 新 vs 旧 (块级 Diff)。
                   这里简化处理：仅检测开关状态，内部 Grid 如果变了不太好做行内 Diff，
                   可以简单地渲染当前的（假设分时电价很少改细节），或者手动写新旧对比块。
                */}
                <tr>
                  <td class="label">{$t('domain.agreement.field.touEnabled')}</td>
                  <td class="value" colspan={3}>
                    {isTimeOfUsePricingEnabled ? (
                      <div class="tou-grid">
                        {/* 这里如果需要 Diff，建议针对每个百分比字段单独调 renderDiffItem */}
                        <span>
                          {$t('domain.agreement.field.superPeak')}：
                          {renderDiffItem('superPeakPercentage', formatters.percentage)}
                        </span>
                        <span>
                          {$t('domain.agreement.field.peak')}：
                          {renderDiffItem('peakPercentage', formatters.percentage)}
                        </span>
                        <span>
                          {$t('domain.agreement.field.standard')}：
                          {renderDiffItem('standardPercentage', formatters.percentage)}
                        </span>
                        <span>
                          {$t('domain.agreement.field.valley')}：
                          {renderDiffItem('valleyPercentage', formatters.percentage)}
                        </span>
                      </div>
                    ) : (
                      $t('domain.agreement.message.touDisabled')
                    )}
                  </td>
                </tr>
                <tr>
                  <td class="label">{$t('domain.agreement.field.annualUsage')}</td>
                  <td class="value" colspan={3}>
                    {renderDiffItem('yearUsableCharge')}
                  </td>
                </tr>
                <tr>
                  <td class="label">{$t('common.field.remark')}</td>
                  <td class="value" colspan={3}>
                    {renderDiffItem('comment')}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* --- 签约详情 --- */}
          {isSign && (
            <section class="print-section">
              <div class={sectionTitleClass}>{$t('domain.agreement.tab.details')}</div>
              <table class="info-table">
                <tbody>
                  <tr>
                    <td class="label">{$t('domain.agreement.field.priceModel')}</td>
                    <td class="value">{renderDiffItem('priceModel', formatters.priceModel)}</td>
                    <td class="label">{$t('domain.agreement.field.expiryDate')}</td>
                    <td class="value">{renderDiffItem('expirationTime', formatters.date)}</td>
                  </tr>

                  {priceModel !== PriceModelEnum.Other && (
                    <tr>
                      <td class="label">{$t('domain.agreement.field.priceType')}</td>
                      <td class="value">{renderDiffItem('priceType', formatters.priceType)}</td>
                      <td class="label">{$t('domain.agreement.field.priceCategory')}</td>
                      <td class="value">
                        {renderDiffItem('priceCategory', formatters.priceCategory)}
                      </td>
                    </tr>
                  )}

                  {priceCategory === PriceCategoryEnum.FixedPrice && (
                    <tr>
                      <td class="label">{$t('domain.agreement.field.fixedPrice')}</td>
                      <td class="value" colspan={3}>
                        {renderDiffItem('fixedPrice')}
                      </td>
                    </tr>
                  )}
                  {priceCategory === PriceCategoryEnum.FixedSpread && (
                    <tr>
                      <td class="label">{$t('domain.agreement.field.fixedSpread')}</td>
                      <td class="value" colspan={3}>
                        {renderDiffItem('fixedSpread')}
                      </td>
                    </tr>
                  )}
                  {priceCategory === PriceCategoryEnum.ShareRatio && (
                    <tr>
                      <td class="label">{$t('domain.agreement.field.shareRatio')}</td>
                      <td class="value" colspan={3}>
                        {renderDiffItem('revenueShareRatio', formatters.percentage)}
                      </td>
                    </tr>
                  )}
                  {priceModel === PriceModelEnum.Other && (
                    <tr>
                      <td class="label">{$t('common.field.remark')}</td>
                      <td class="value" colspan={3}>
                        {renderDiffItem('comment')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* --- 列表 Diff (使用 renderListCell) --- */}
              <div class="sub-section-title">{$t('domain.servicePoint.title')}</div>
              <table class="list-table">
                <thead>
                  <tr>
                    <th>{$t('domain.servicePoint.field.accountNo')}</th>
                    <th>{$t('domain.servicePoint.field.capacity')}</th>
                    <th>{$t('domain.servicePoint.field.category')}</th>
                    <th>{$t('domain.servicePoint.field.voltage')}</th>
                  </tr>
                </thead>
                <tbody>
                  {diffList.length > 0 ? (
                    diffList.map((row) => (
                      <tr
                        key={row.data.serviceAccount}
                        class={{
                          'row-added': row.status === 'added',
                          'row-removed': row.status === 'removed',
                        }}
                      >
                        {/* 营销户号 (Key) */}
                        <td>
                          {row.data.serviceAccount}
                          {row.status === 'added' ? ` (${$t('common.action.add')})` : ''}
                          {row.status === 'removed' ? ` (${$t('common.action.delete')})` : ''}
                        </td>

                        {/* 容量 */}
                        <td>{renderListCell(row, 'transformerCapacity', formatters.capacity)}</td>

                        {/* 用电类别 */}
                        <td>
                          {renderListCell(
                            row,
                            'electricityConsumptionType',
                            formatters.usageCategory,
                          )}
                        </td>

                        {/* 电压等级 */}
                        <td>{renderListCell(row, 'voltageClass', formatters.voltage)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colspan={4} style={{ textAlign: 'center', color: '#999' }}>
                        {$t('common.label.noData')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          )}

          {/* 附件插槽 */}
          {slots.attachments ? slots.attachments() : null}
        </div>
      )
    }
  },
})
