import { defineComponent, computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { NButton, NDataTable, NPopconfirm, NSpace, type DataTableColumns } from 'naive-ui'
import type { UserPageItem, UserPageRequest } from '@/modules/user/application/models'
import { useDeleteUser, useUserPage } from '@/modules/user/application/hooks/useUserPage'
import {
  ModernQueryBuilder,
  QueryActionButtons,
} from '@/modules/shared/presentation/advanced-query'
import { useListQueryState } from '@/modules/shared/presentation/advanced-query/useListQueryState'
import MobilePrimarySecondaryText from '@/modules/shared/presentation/widget/MobilePrimarySecondaryText'
import { userListAdvancedQueryFields } from './userListAdvancedQueryFields'
import { RegisterTypeOption } from '@/modules/user/application/constants'
import { resolvePlatformLabelKey } from '@/modules/user/application/utils/platform'
import { resolveUserDisplayName } from '@/modules/user/application/utils/displayName'
import { usePermission } from '@/modules/access/application/hooks/useCan'
import { useIsMobile } from '@/app/presentation/hooks/useIsMobile'

export default defineComponent({
  name: 'ManageUserListPage',
  setup() {
    const { t: $t } = useI18n()
    const router = useRouter()

    const canEdit = usePermission('update', 'user')
    const canView = usePermission('read', 'user')
    const canDisable = usePermission('delete', 'user')
    const isMobile = useIsMobile(768)

    const { draftQueryFilters, appliedQueryFilters, pagination, bindRefetchHandlers } =
      useListQueryState()

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
    const { onSearch: handleSearchWithRefetch, onReset: handleResetWithRefetch } =
      bindRefetchHandlers(() => userPageQuery.refetch())

    const handleDelete = (userId: number) => {
      if (deleteMutation.isPending.value) return
      deleteMutation.mutate(userId)
    }

    const registerTypeLabel = (type: number) =>
      RegisterTypeOption.find((option) => option.value === type)?.label ?? '-'

    const displayName = (row: UserPageItem) => resolveUserDisplayName(row)

    const activationLabel = (enabled: boolean) =>
      enabled ? $t('domain.user.status.active') : $t('domain.user.status.inactive')

    const userActiveLabel = (deleted: boolean) => activationLabel(!deleted)

    const renderUserStatusText = (deleted: boolean) =>
      h(
        'span',
        { class: 'text-xs text-[var(--color-text-main)] leading-5' },
        userActiveLabel(deleted),
      )

    const renderOperate = (row: UserPageItem) => {
      const actionButtons: ReturnType<typeof h>[] = []

      if (canEdit.value) {
        actionButtons.push(
          h(
            NButton,
            {
              size: 'tiny',
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
              size: 'tiny',
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
                    size: 'tiny',
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
                h(MobilePrimarySecondaryText, {
                  primary: displayName(row),
                  secondary: [
                    `${row.phone || '-'} · ${registerTypeLabel(row.registerType)}`,
                    $t(resolvePlatformLabelKey(row.platform)),
                  ],
                }),
            },
            {
              title: $t('common.label.status'),
              key: 'deleted',
              render: (row: UserPageItem) => renderUserStatusText(row.deleted),
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
              render: (row: UserPageItem) => renderUserStatusText(row.deleted),
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
            onSearch={handleSearchWithRefetch}
            onReset={handleResetWithRefetch}
          />
          <QueryActionButtons
            onSearch={() => handleSearchWithRefetch(draftQueryFilters.value)}
            onReset={handleResetWithRefetch}
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
