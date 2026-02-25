import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('naive-ui', () => ({
  NForm: defineComponent({
    name: 'NForm',
    props: {
      model: {
        type: Object,
        required: false,
      },
      disabled: {
        type: Boolean,
        required: false,
      },
    },
    setup(props, { slots, expose }) {
      const validate = vi.fn()
      const restoreValidation = vi.fn()

      expose({
        validate,
        restoreValidation,
      })

      return () =>
        h(
          'form',
          {
            'data-test': 'n-form',
            'data-disabled': String(Boolean(props.disabled)),
          },
          slots.default?.(),
        )
    },
  }),
  NFormItem: defineComponent({
    name: 'NFormItem',
    props: {
      path: {
        type: String,
        required: false,
      },
      label: {
        type: String,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h(
          'div',
          {
            'data-test': 'n-form-item',
            'data-path': props.path ?? '',
            'data-label': props.label ?? '',
          },
          slots.default?.(),
        )
    },
  }),
  NInput: defineComponent({
    name: 'NInput',
    setup() {
      return () => h('input', { 'data-test': 'n-input' })
    },
  }),
  NSelect: defineComponent({
    name: 'NSelect',
    props: {
      value: {
        required: false,
      },
      options: {
        type: Array,
        required: false,
      },
    },
    setup(props) {
      return () =>
        h('div', {
          'data-test': 'n-select',
          'data-value': props.value == null ? '' : String(props.value),
          'data-options-len': String((props.options || []).length),
        })
    },
  }),
}))

vi.mock('@/modules/shared/presentation/widget/PCACascader', () => ({
  default: defineComponent({
    name: 'PCACascader',
    setup() {
      return () => h('div', { 'data-test': 'pca-cascader' })
    },
  }),
}))

vi.mock('@/modules/shared/presentation/widget/BankSelect', () => ({
  default: defineComponent({
    name: 'BankSelect',
    setup() {
      return () => h('div', { 'data-test': 'bank-select' })
    },
  }),
}))

import UserAdditionalInfoForm from '@/modules/user/presentation/user_additional_info/UserAdditionalInfoForm'
import { RegisterType } from '@/modules/user/application/constants'
import type { UserAdditionalInfoForm as UserAdditionalInfoFormModel } from '@/modules/user/application/models'

type UserAdditionalInfoFormVm = {
  getFormInstance: () => {
    validate: (...args: unknown[]) => unknown
    restoreValidation: () => void
    values: UserAdditionalInfoFormModel
  }
  getRequiredKeys: () => string[]
}

const createLegalForm = (): FormInput<UserAdditionalInfoFormModel> => ({
  registerType:
    RegisterType.LEGAL_REPRESENTATIVE as UserAdditionalInfoFormModel['registerType'],
  name: 'Acme',
  pca: '110000',
  companyAddress: 'Road 1',
  contactPerson: 'Alice',
  contactPersonPhone: '13800000000',
  identity: '91330000ABCDEFGH12',
  bankName: 'ICBC',
  bankAccount: '6222000000000000',
  invitationCode: 'INV-1',
})

const createIndividualForm = (): FormInput<UserAdditionalInfoFormModel> => ({
  id: 100,
  registerType: RegisterType.INDIVIDUAL as UserAdditionalInfoFormModel['registerType'],
  name: 'Bob',
  pca: '120000',
  identity: '330102199901019999',
  bankName: 'CCB',
  bankAccount: '6222000000000001',
})

describe('UserAdditionalInfoForm', () => {
  it('renders legal representative fields and invitation code when creating', () => {
    const wrapper = mount(UserAdditionalInfoForm, {
      props: {
        initialValue: createLegalForm(),
      },
    })

    expect(wrapper.find('[data-path="companyAddress"]').exists()).toBe(true)
    expect(wrapper.find('[data-path="contactPerson"]').exists()).toBe(true)
    expect(wrapper.find('[data-path="contactPersonPhone"]').exists()).toBe(true)
    expect(wrapper.find('[data-path="invitationCode"]').exists()).toBe(true)
  })

  it('renders individual fields and hides legal/invitation fields for existing record', () => {
    const wrapper = mount(UserAdditionalInfoForm, {
      props: {
        initialValue: createIndividualForm(),
      },
    })

    expect(wrapper.find('[data-path="companyAddress"]').exists()).toBe(false)
    expect(wrapper.find('[data-path="contactPerson"]').exists()).toBe(false)
    expect(wrapper.find('[data-path="contactPersonPhone"]').exists()).toBe(false)
    expect(wrapper.find('[data-path="invitationCode"]').exists()).toBe(false)
  })

  it('exposes form instance helpers and required keys', () => {
    const wrapper = mount(UserAdditionalInfoForm, {
      props: {
        initialValue: createLegalForm(),
      },
    })

    const vm = wrapper.vm as unknown as UserAdditionalInfoFormVm
    const formInstance = vm.getFormInstance()
    const requiredKeys = vm.getRequiredKeys()

    expect(typeof formInstance.validate).toBe('function')
    expect(typeof formInstance.restoreValidation).toBe('function')
    expect(formInstance.values.registerType).toBe(RegisterType.LEGAL_REPRESENTATIVE)

    expect(requiredKeys).toContain('registerType')
    expect(requiredKeys).toContain('name')
    expect(requiredKeys).toContain('identity')
    expect(requiredKeys).toContain('companyAddress')
    expect(requiredKeys).toContain('contactPerson')
    expect(requiredKeys).toContain('contactPersonPhone')
  })

  it('disables form when type is detail', () => {
    const wrapper = mount(UserAdditionalInfoForm, {
      props: {
        initialValue: createIndividualForm(),
        type: 'detail',
      },
    })

    expect(wrapper.get('[data-test="n-form"]').attributes('data-disabled')).toBe('true')
  })
})
