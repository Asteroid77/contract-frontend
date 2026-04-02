import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

const {
  createMutateSpy,
  updateMutateSpy,
  deleteMutateSpy,
  invitationListRef,
  listLoadingRef,
  createPendingRef,
  updatePendingRef,
  deletePendingRef,
} = vi.hoisted(() => ({
  createMutateSpy: vi.fn(),
  updateMutateSpy: vi.fn(),
  deleteMutateSpy: vi.fn(),
  invitationListRef: {
    value: [
      {
        id: 1,
        code: 'INVITE-1',
        creatorId: 10,
        remark: 'remark-1',
        status: 1,
        usedCount: 0,
        createdTime: '2026-02-10T10:00:00+08:00',
        updatedTime: null,
        isDeleted: false,
      },
      {
        id: 2,
        code: 'INVITE-2',
        creatorId: 10,
        remark: 'remark-2',
        status: 0,
        usedCount: 1,
        createdTime: '2026-02-11T10:00:00+08:00',
        updatedTime: null,
        isDeleted: false,
      },
    ],
  },
  listLoadingRef: { value: false },
  createPendingRef: { value: false },
  updatePendingRef: { value: false },
  deletePendingRef: { value: false },
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/modules/shared/presentation/time', () => ({
  formatted: (value: string) => ({
    standard: `formatted:${value}`,
  }),
}))

vi.mock('@/modules/invitation/application/hooks/useInvitationService', () => ({
  useInvitationCodeListQuery: () => ({
    data: invitationListRef,
    isLoading: listLoadingRef,
  }),
  useCreateInvitationCodeMutation: () => ({
    mutate: createMutateSpy,
    isPending: createPendingRef,
  }),
  useUpdateInvitationCodeMutation: () => ({
    mutate: updateMutateSpy,
    isPending: updatePendingRef,
  }),
  useDeleteInvitationCodeMutation: () => ({
    mutate: deleteMutateSpy,
    isPending: deletePendingRef,
  }),
}))

vi.mock('naive-ui', () => ({
  NButton: defineComponent({
    name: 'NButton',
    props: {
      disabled: {
        type: Boolean,
        default: false,
      },
      loading: {
        type: Boolean,
        default: false,
      },
      type: {
        type: String,
        required: false,
      },
    },
    emits: ['click'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            'data-test': 'n-button',
            'data-disabled': String(props.disabled),
            'data-loading': String(props.loading),
            'data-type': props.type ?? '',
            onClick: () => emit('click'),
          },
          slots.default?.(),
        )
    },
  }),
  NSpace: defineComponent({
    name: 'NSpace',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-space' }, slots.default?.())
    },
  }),
  NPopconfirm: defineComponent({
    name: 'NPopconfirm',
    emits: ['positive-click'],
    setup(_, { slots }) {
      return () =>
        h('div', { 'data-test': 'n-popconfirm' }, [
          h('div', { 'data-test': 'n-popconfirm-trigger' }, slots.trigger?.()),
          h('div', { 'data-test': 'n-popconfirm-content' }, slots.default?.()),
        ])
    },
  }),
  NInput: defineComponent({
    name: 'NInput',
    props: {
      value: {
        type: String,
        required: false,
      },
    },
    emits: ['update:value'],
    setup(props) {
      return () => h('input', { 'data-test': 'n-input', value: props.value ?? '' })
    },
  }),
  NDataTable: defineComponent({
    name: 'NDataTable',
    props: {
      data: {
        type: Array,
        required: false,
      },
      checkedRowKeys: {
        type: Array,
        required: false,
      },
    },
    emits: ['update:checked-row-keys'],
    setup(props) {
      return () =>
        h('div', {
          'data-test': 'n-data-table',
          'data-rows': String((props.data || []).length),
          'data-checked-count': String((props.checkedRowKeys || []).length),
        })
    },
  }),
}))

import InvitationCodePage from '@/modules/invitation/presentation/invitation/InvitationCodePage.vue'

describe('InvitationCodePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    invitationListRef.value = [
      {
        id: 1,
        code: 'INVITE-1',
        creatorId: 10,
        remark: 'remark-1',
        status: 1,
        usedCount: 0,
        createdTime: '2026-02-10T10:00:00+08:00',
        updatedTime: null,
        isDeleted: false,
      },
      {
        id: 2,
        code: 'INVITE-2',
        creatorId: 10,
        remark: 'remark-2',
        status: 0,
        usedCount: 1,
        createdTime: '2026-02-11T10:00:00+08:00',
        updatedTime: null,
        isDeleted: false,
      },
    ]
  })

  it('triggers create mutation on add button click', async () => {
    const wrapper = mount(InvitationCodePage)

    const buttons = wrapper.findAll('[data-test="n-button"]')
    expect(buttons).toHaveLength(3)

    await buttons[0].trigger('click')

    expect(createMutateSpy).toHaveBeenCalledTimes(1)
  })

  it('enables save/delete after row selection and forwards payload', async () => {
    const wrapper = mount(InvitationCodePage)

    const buttonsBefore = wrapper.findAll('[data-test="n-button"]')
    expect(buttonsBefore[1].attributes('data-disabled')).toBe('true')
    expect(buttonsBefore[2].attributes('data-disabled')).toBe('true')

    const table = wrapper.findComponent({ name: 'NDataTable' })
    table.vm.$emit('update:checked-row-keys', [1, 2])
    await nextTick()

    const buttonsAfter = wrapper.findAll('[data-test="n-button"]')
    expect(buttonsAfter[1].attributes('data-disabled')).toBe('false')
    expect(buttonsAfter[2].attributes('data-disabled')).toBe('false')

    const popconfirms = wrapper.findAllComponents({ name: 'NPopconfirm' })
    expect(popconfirms).toHaveLength(2)

    popconfirms[0].vm.$emit('positive-click')
    await nextTick()

    expect(updateMutateSpy).toHaveBeenCalledWith([
      {
        id: 1,
        remark: 'remark-1',
      },
      {
        id: 2,
        remark: 'remark-2',
      },
    ])

    popconfirms[1].vm.$emit('positive-click')
    await nextTick()

    expect(deleteMutateSpy).toHaveBeenCalledWith([1, 2])
  })
})
