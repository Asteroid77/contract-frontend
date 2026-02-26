import { defineComponent, computed, reactive, ref, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  NButton,
  NDataTable,
  NPopconfirm,
  NSpace,
  type DataTableColumns,
  type PaginationProps,
} from 'naive-ui'
import type { QueryFilters } from '@/modules/shared/domain/query'
import type { UserPageItem, UserPageRequest } from '@/modules/user/application/models'
import { useDeleteUser, useUserPage } from '@/modules/user/application/hooks/useUserPage'
import {
  ModernQueryBuilder,
  QueryActionButtons,
} from '@/modules/shared/presentation/advanced-query'
import { userListAdvancedQueryFields } from './userListAdvancedQueryFields'
import { RegisterTypeOption } from '@/modules/user/application/constants'
import { resolvePlatformLabelKey } from '@/modules/user/application/utils/platform'
import { usePermission } from '@/modules/access/application/hooks/useCan'
import { useIsMobile } from '@/app/presentation/hooks/useIsMobile'

const normalizeAppliedQuery = (query: QueryFilters): QueryFilters | null =>
  query.filters?.length || query.group ? query : null

export default defineComponent({
  name: 'ManageUserListPage',
  setup() {
    const { t: $t } = useI18n()
    const router = useRouter()

    const canEdit = usePermission('update', 'User')
    const canView = usePermission('read', 'User')
    const canDisable = usePermission('delete', 'User')
    const isMobile = useIsMobile(768)

    const draftQueryFilters = ref<QueryFilters>({})
    const appliedQueryFilters = ref<QueryFilters | null>(null)

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

    const pageRequest = computed<UserPageRequest>(() => {
      const request: UserPageRequest = {
        page: pagination.page,
        size: pagination.pageSize,
      }
      if (appliedQueryFilters.value) {
        request.query = appliedQueryFilters.value
      }
      return request
    })

    const userPageQuery = useUserPage(pageRequest)
    const deleteMutation = useDeleteUser()

    const handleSearch = (query?: QueryFilters) => {
      const nextApplied = normalizeAppliedQuery(query ?? draftQueryFilters.value)
      const shouldForceRefetch =
        pagination.page === 1 &&
        JSON.stringify(appliedQueryFilters.value ?? {}) === JSON.stringify(nextApplied ?? {})

      appliedQueryFilters.value = nextApplied
      pagination.page = 1
      if (shouldForceRefetch) userPageQuery.refetch()
    }

    const handleReset = () => {
      const shouldForceRefetch = pagination.page === 1 && appliedQueryFilters.value == null

      draftQueryFilters.value = {}
      appliedQueryFilters.value = null
      pagination.page = 1
      if (shouldForceRefetch) userPageQuery.refetch()
    }

    const handleDelete = (userId: number) => {
      if (deleteMutation.isPending.value) return
      deleteMutation.mutate(userId)
    }

    const registerTypeLabel = (type: number) =>
      RegisterTypeOption.find((option) => option.value === type)?.label ?? '-'

    const displayName = (row: UserPageItem) =>
      row.discriminator > 0 ? `${row.name}#${row.discriminator}` : row.name

    const activationLabel = (enabled: boolean) =>
      enabled ? $t('domain.user.status.active') : $t('domain.user.status.inactive')

    const userActiveLabel = (deleted: boolean) => activationLabel(!deleted)

    const renderOperate = (row: UserPageItem) => {
      const actionButtons: ReturnType<typeof h>[] = []

      if (canEdit.value) {
        actionButtons.push(
          h(
            NButton,
            {
              size: 'small',
              onClick: () => {
                router.push({ name: 'manage-user-edit', params: { userId: row.id } })
              },
            },
            { default: () => $t('common.action.edit') },
          ),
        )
      }

      if (canView.value) {
        actionButtons.push(
          h(
            NButton,
            {
              size: 'small',
              onClick: () => {
                router.push({ name: 'manage-user-detail', params: { userId: row.id } })
              },
            },
            { default: () => $t('common.action.view') },
          ),
        )
      }

      if (canDisable.value) {
        actionButtons.push(
          h(
            NPopconfirm,
            {
              onPositiveClick: () => handleDelete(row.id),
            },
            {
              trigger: () =>
                h(
                  NButton,
                  {
                    size: 'small',
                    type: 'error',
                    loading: deleteMutation.isPending.value,
                  },
                  { default: () => $t('common.action.delete') },
                ),
              default: () => $t('common.message.deleteConfirm'),
            },
          ),
        )
      }

      if (actionButtons.length === 0) return '-'
      return h(NSpace, {}, { default: () => actionButtons })
    }

    const columns = computed<DataTableColumns<UserPageItem>>(() => [
      ...(isMobile.value
        ? [
            {
              title: $t('domain.user.field.name'),
              key: 'name',
              render: (row: UserPageItem) =>
                h('div', { class: 'min-w-0' }, [
                  h(
                    'div',
                    { class: 'text-sm font-medium text-[var(--color-text-main)] truncate' },
                    displayName(row),
                  ),
                  h(
                    'div',
                    { class: 'text-xs text-[var(--color-text-light)] truncate mt-1' },
                    `${row.phone || '-'} · ${registerTypeLabel(row.registerType)}`,
                  ),
                  h(
                    'div',
                    { class: 'text-xs text-[var(--color-text-light)] truncate mt-1' },
                    $t(resolvePlatformLabelKey(row.platform)),
                  ),
                ]),
            },
            {
              title: $t('common.label.status'),
              key: 'deleted',
              render: (row: UserPageItem) => userActiveLabel(row.deleted),
            },
            {
              title: $t('common.action.operate'),
              key: 'operate',
              render: (row: UserPageItem) => renderOperate(row),
            },
          ]
        : [
            {
              title: $t('domain.user.field.name'),
              key: 'name',
              render: (row: UserPageItem) => displayName(row),
            },
            {
              title: $t('domain.user.field.registerType'),
              key: 'registerType',
              render: (row: UserPageItem) => registerTypeLabel(row.registerType),
            },
            {
              title: $t('layout.profile.field.phone'),
              key: 'phone',
            },
            {
              title: $t('layout.profile.field.platform'),
              key: 'platform',
              render: (row: UserPageItem) => $t(resolvePlatformLabelKey(row.platform)),
            },
            {
              title: $t('layout.profile.twoFactor.title'),
              key: 'totpEnabled',
              render: (row: UserPageItem) => activationLabel(row.totpEnabled),
            },
            {
              title: $t('common.label.status'),
              key: 'deleted',
              render: (row: UserPageItem) => userActiveLabel(row.deleted),
            },
            {
              title: $t('common.action.operate'),
              key: 'operate',
              render: (row: UserPageItem) => renderOperate(row),
            },
          ]),
    ])

    return () => (
      <NSpace vertical size={16}>
        <NSpace vertical size={8}>
          <ModernQueryBuilder
            fields={userListAdvancedQueryFields}
            v-model:query={draftQueryFilters.value}
            onSearch={handleSearch}
            onReset={handleReset}
          />
          <QueryActionButtons
            onSearch={() => handleSearch(draftQueryFilters.value)}
            onReset={handleReset}
          />
        </NSpace>

        <NDataTable
          bordered={false}
          singleLine={false}
          columns={columns.value}
          data={userPageQuery.data.value?.records || []}
          pagination={pagination}
          loading={userPageQuery.isLoading.value || deleteMutation.isPending.value}
        />
      </NSpace>
    )
  },
})
