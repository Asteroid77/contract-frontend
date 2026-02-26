<script setup lang="ts">
import type { RolePageQuery, RoleItem } from '@/modules/access/application/models'
import { useRolePage } from '@/modules/access/application/hooks/useRoleService'
import type { BasePageRequest } from '@/modules/shared/application/request/types'
import {
  NButton,
  NSpace,
  type DataTableColumns,
  type PaginationProps,
  NDataTable,
  NDrawer,
} from 'naive-ui'
import { computed, reactive, ref } from 'vue'
import { h } from 'vue'
import { useRouter } from 'vue-router'
import RoleAssign from './RoleAssign.vue'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/app/presentation/hooks/useIsMobile'
const $router = useRouter()
const { t: $t } = useI18n()
const isMobile = useIsMobile(768)

function createColumns({
  edit,
  assign,
  mobile,
}: {
  edit: (rowData: RoleItem) => void
  assign: (rowData: RoleItem) => void
  mobile: boolean
}): DataTableColumns<RoleItem> {
  if (mobile) {
    return [
      {
        title: $t('system.role.field.code'),
        key: 'name',
        render(row) {
          return h('div', { class: 'min-w-0' }, [
            h(
              'div',
              { class: 'text-sm font-medium text-[var(--color-text-main)] truncate' },
              row.name,
            ),
            h(
              'div',
              { class: 'text-xs text-[var(--color-text-light)] truncate mt-1' },
              row.description || '-',
            ),
          ])
        },
      },
      {
        title: $t('common.action.operate'),
        key: 'operate',
        render(row) {
          return h(
            NSpace,
            {},
            {
              default: () => [
                h(
                  NButton,
                  { size: 'small', onClick: () => edit(row) },
                  { default: () => $t('common.action.edit') },
                ),
                h(
                  NButton,
                  { size: 'small', onClick: () => assign(row) },
                  { default: () => $t('common.action.assign') },
                ),
              ],
            },
          )
        },
      },
    ]
  }

  return [
    {
      title: $t('system.role.field.code'),
      key: 'name',
    },
    {
      title: $t('system.role.field.desc'),
      key: 'description',
    },
    {
      title: $t('common.action.operate'),
      key: 'operate',
      render(row) {
        return h(
          NSpace,
          {},
          {
            default: () => [
              h(
                NButton,
                { size: 'small', onClick: () => edit(row) },
                { default: () => $t('common.action.edit') },
              ),
              h(
                NButton,
                { size: 'small', onClick: () => assign(row) },
                { default: () => $t('common.action.assign') },
              ),
            ],
          },
        )
      },
    },
  ]
}
const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 50, 100],
  onChange: (page: number) => {
    pagination.page = page
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
  },
})
const currentDrawerWithRoleId = ref<number>(1)
const showOuter = ref<boolean>(false)
const columns = computed(() =>
  createColumns({
    edit: (rowData: RoleItem) => {
      $router.push({
        name: 'role-detail',
        params: {
          id: rowData.id,
        },
      })
    },
    assign: (rowData: RoleItem) => {
      showOuter.value = true
      currentDrawerWithRoleId.value = rowData.id
    },
    mobile: isMobile.value,
  }),
)
const queryConditionMap = ref<BasePageRequest<RolePageQuery>>({
  page: pagination.page,
  size: pagination.size,
})
const { data, isLoading } = useRolePage(queryConditionMap)
const tableData = computed(() => {
  return data.value?.records
})
</script>
<template>
  <n-data-table
    :bordered="false"
    :single-line="false"
    :columns="columns"
    :data="tableData"
    :pagination="pagination"
    :loading="isLoading"
  />
  <n-drawer v-model:show="showOuter" width="350">
    <role-assign :role-id="currentDrawerWithRoleId"></role-assign>
  </n-drawer>
</template>
