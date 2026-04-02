import { defineComponent, ref, computed, h, type PropType } from 'vue'
import { NForm, NFormItem, NInput, type FormInst, type SelectOption } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { dialog, message } from '@/_utils/discrete_naive_api'
import CrudSelect from '@/modules/shared/presentation/widget/CrudSelect'
import {
  useCategoryList,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../application/hooks/useCategoryService'
import { useCategoryRules } from '../application/rules/categoryRules'
import { can } from '@/modules/access/application/ability'
import type { WorkOrderCategoryForm } from '../domain/types'
import './styles/WorkOrderCategorySelect.css'

export default defineComponent({
  name: 'WorkOrderCategorySelect',
  props: {
    value: { type: Number as PropType<number | null>, default: null },
    disabled: { type: Boolean, default: false },
    showAdd: { type: Boolean, default: true },
    showEdit: { type: Boolean, default: true },
    showDelete: { type: Boolean, default: true },
    showSearch: { type: Boolean, default: true },
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    const { t: $t } = useI18n()
    const { data: categories } = useCategoryList()
    const createMutation = useCreateCategory()
    const updateMutation = useUpdateCategory()
    const deleteMutation = useDeleteCategory()
    const rules = useCategoryRules()
    const canManage = computed(() => can('manage', 'WorkOrderCategory'))

    const options = computed<SelectOption[]>(() =>
      (categories.value ?? []).map((c) => ({ label: c.name, value: c.id })),
    )

    const openCategoryDialog = (mode: 'add' | 'edit', editId?: number) => {
      const existing = mode === 'edit' ? categories.value?.find((c) => c.id === editId) : undefined

      const formValue = ref<WorkOrderCategoryForm>({
        name: existing?.name ?? '',
        permissionCode: existing?.permissionCode ?? '',
      })
      const formRef = ref<FormInst | null>(null)

      dialog.create({
        title:
          mode === 'add'
            ? $t('domain.workOrderCategory.action.add')
            : $t('domain.workOrderCategory.action.edit'),
        content: () =>
          h(
            NForm,
            {
              ref: (el: unknown) => {
                formRef.value = el as FormInst | null
              },
              model: formValue.value,
              rules,
              class: 'work-order-category-form-grid',
            },
            {
              default: () => [
                h(
                  NFormItem,
                  {
                    label: $t('domain.workOrderCategory.field.name'),
                    path: 'name',
                  },
                  {
                    default: () =>
                      h(NInput, {
                        value: formValue.value.name,
                        'onUpdate:value': (v: string) => {
                          formValue.value.name = v
                        },
                        placeholder: $t('common.placeholder.input', {
                          label: $t('domain.workOrderCategory.field.name'),
                        }),
                        maxlength: 100,
                        showCount: true,
                      }),
                  },
                ),
                h(
                  NFormItem,
                  {
                    label: $t('domain.workOrderCategory.field.permissionCode'),
                    path: 'permissionCode',
                  },
                  {
                    default: () =>
                      h(NInput, {
                        value: formValue.value.permissionCode,
                        'onUpdate:value': (v: string) => {
                          formValue.value.permissionCode = v
                        },
                        placeholder: $t('common.placeholder.input', {
                          label: $t('domain.workOrderCategory.field.permissionCode'),
                        }),
                        maxlength: 100,
                        showCount: true,
                      }),
                  },
                ),
              ],
            },
          ),
        positiveText: $t('common.action.submit'),
        negativeText: $t('common.action.cancel'),
        onPositiveClick: async () => {
          await formRef.value?.validate()
          if (mode === 'add') {
            await createMutation.mutateAsync(formValue.value)
            message.success($t('domain.workOrderCategory.message.createSuccess'))
          } else {
            await updateMutation.mutateAsync({ id: editId!, dto: formValue.value })
            message.success($t('domain.workOrderCategory.message.updateSuccess'))
          }
        },
      })
    }

    const handleAdd = () => openCategoryDialog('add')
    const handleEdit = (id: number) => openCategoryDialog('edit', id)
    const handleDelete = (id: number) => {
      dialog.warning({
        title: $t('common.action.delete'),
        content: $t('domain.workOrderCategory.message.deleteConfirm'),
        positiveText: $t('common.action.confirm'),
        negativeText: $t('common.action.cancel'),
        onPositiveClick: async () => {
          await deleteMutation.mutateAsync(id)
          message.success($t('domain.workOrderCategory.message.deleteSuccess'))
          if (props.value === id) {
            emit('update:value', null)
          }
        },
      })
    }

    return () => (
      <CrudSelect
        value={props.value}
        options={options.value}
        disabled={props.disabled}
        showAdd={props.showAdd && canManage.value}
        showEdit={props.showEdit && canManage.value}
        showDelete={props.showDelete && canManage.value}
        showSearch={props.showSearch}
        placeholder={$t('common.placeholder.select', {
          label: $t('domain.workOrderCategory.field.name'),
        })}
        onUpdate:value={(v: number | null) => emit('update:value', v)}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    )
  },
})
