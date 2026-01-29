import { $t } from '@/_utils/i18n'
import type { ServiceAgreementPageVo } from '@/modules/service-agreement/application/models'
import { type DataTableColumns, NDataTable, type PaginationProps } from 'naive-ui'
import { defineComponent, type PropType } from 'vue'
import areaData from '@/modules/shared/application/constants/PCA.json'
import { TreeLookup } from '@/modules/shared/presentation/lookup'
import { ServiceAgreementStatusOption } from '@/modules/service-agreement/application/constants'
import { SelectLookup } from '@/modules/shared/presentation/lookup'
export default defineComponent({
  name: 'service-agreement-page',
  props: {
    data: {
      type: Array as PropType<ServiceAgreementPageVo[]>,
      default: () => [],
    },
    pagination: {
      type: Object as PropType<PaginationProps>,
      default: () => {},
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { slots }) {
    const treeLookup = new TreeLookup(areaData)
    const selectLookup = new SelectLookup(ServiceAgreementStatusOption)
    function createColumns(): DataTableColumns<ServiceAgreementPageVo> {
      const baseColumn = [
        {
          title: $t('serviceAgreement.companyName'),
          key: 'companyName',
        },
        {
          title: $t('serviceAgreement.companyArea'),
          key: 'companyArea',
          render: (row: ServiceAgreementPageVo) => {
            return treeLookup.getFullPath(row.companyArea)
          },
        },
        {
          title: $t('serviceAgreement.status.label'),
          key: 'status',
          render: (row: ServiceAgreementPageVo) => {
            return selectLookup.getLabel(row.status)
          },
        },
        {
          title: $t('serviceAgreement.yearUsableCharge'),
          key: 'yearUsableCharge',
        },
        {
          title: $t('serviceAgreement.expirationTime'),
          key: 'expirationTime',
        },
      ] as DataTableColumns<ServiceAgreementPageVo>
      if (slots.actions) {
        baseColumn.push({
          title: $t('actions.operate'),
          key: 'operate',
          fixed: 'right',
          render: (row) => slots.actions!(row),
        })
      }
      return baseColumn
    }
    const columns = createColumns()
    return () => (
      <>
        <NDataTable
          columns={columns}
          data={props.data}
          pagination={props.pagination}
          bordered={false}
          loading={props.loading}
        />
      </>
    )
  },
})
