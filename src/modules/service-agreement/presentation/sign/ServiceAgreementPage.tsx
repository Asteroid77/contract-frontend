import { $t } from '@/_utils/i18n'
import type { ServiceAgreementPageItem } from '@/modules/service-agreement/application/models'
import { useIsMobile } from '@/app/presentation/hooks/useIsMobile'
import areaData from '@/modules/shared/application/constants/PCA.json'
import { SelectLookup, TreeLookup } from '@/modules/shared/presentation/lookup'
import { ServiceAgreementStatusOption } from '@/modules/service-agreement/application/constants'
import { type DataTableColumns, NDataTable, type PaginationProps } from 'naive-ui'
import { computed, defineComponent, h, type PropType } from 'vue'

export default defineComponent({
  name: 'service-agreement-page',
  props: {
    data: {
      type: Array as PropType<ServiceAgreementPageItem[]>,
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
    const isMobile = useIsMobile(768)

    function createColumns(mobile: boolean): DataTableColumns<ServiceAgreementPageItem> {
      if (mobile) {
        const mobileColumns = [
          {
            title: $t('domain.agreement.field.companyName'),
            key: 'companyName',
            render: (row: ServiceAgreementPageItem) =>
              h('div', { class: 'min-w-0' }, [
                h(
                  'div',
                  { class: 'text-sm font-medium text-[var(--color-text-main)] truncate' },
                  row.companyName,
                ),
                h(
                  'div',
                  { class: 'text-xs text-[var(--color-text-light)] truncate mt-1' },
                  treeLookup.getFullPath(row.companyArea),
                ),
              ]),
          },
          {
            title: $t('common.label.status'),
            key: 'status',
            render: (row: ServiceAgreementPageItem) =>
              h(
                'span',
                { class: 'text-xs text-[var(--color-text-main)]' },
                selectLookup.getLabel(row.status),
              ),
          },
        ] as DataTableColumns<ServiceAgreementPageItem>

        if (slots.actions) {
          mobileColumns.push({
            title: $t('common.action.operate'),
            key: 'operate',
            render: (row: ServiceAgreementPageItem) => slots.actions!(row),
          })
        }

        return mobileColumns
      }

      const baseColumn = [
        {
          title: $t('domain.agreement.field.companyName'),
          key: 'companyName',
        },
        {
          title: $t('domain.agreement.field.area'),
          key: 'companyArea',
          render: (row: ServiceAgreementPageItem) => {
            return treeLookup.getFullPath(row.companyArea)
          },
        },
        {
          title: $t('common.label.status'),
          key: 'status',
          render: (row: ServiceAgreementPageItem) => {
            return selectLookup.getLabel(row.status)
          },
        },
        {
          title: $t('domain.agreement.field.annualUsage'),
          key: 'yearUsableCharge',
        },
        {
          title: $t('domain.agreement.field.expiryDate'),
          key: 'expirationTime',
        },
      ] as DataTableColumns<ServiceAgreementPageItem>

      if (slots.actions) {
        baseColumn.push({
          title: $t('common.action.operate'),
          key: 'operate',
          fixed: 'right',
          render: (row: ServiceAgreementPageItem) => slots.actions!(row),
        })
      }

      return baseColumn
    }

    const columns = computed(() => createColumns(isMobile.value))

    return () => (
      <NDataTable
        columns={columns.value}
        data={props.data}
        pagination={props.pagination}
        bordered={false}
        singleLine={false}
        loading={props.loading}
        v-slots={{
          empty: () => slots.empty?.(),
        }}
      />
    )
  },
})
