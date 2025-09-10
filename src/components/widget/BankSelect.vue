<script setup lang="ts">
import { NSelect, type SelectRenderLabel, NAvatar, NText, type SelectRenderTag } from 'naive-ui'
import ZwIcon from '@/components/widget/ZwIcon.vue'
import { h } from 'vue'
import { BankNameMap, BankOption } from './constant/BankConstant'
const renderLabel: SelectRenderLabel = (option) => {
  return h(
    'div',
    {
      class: ['flex', 'items-center'],
    },
    [
      h(
        NAvatar,
        {
          class: ['bg-transparent!'],
          round: true,
          size: 'small',
        },
        {
          default: () =>
            h(ZwIcon, { name: BankNameMap[option.value as keyof typeof BankNameMap].icon }),
        },
      ),
      h(
        'div',
        {
          class: ['ml-3', 'px-2'],
        },
        [
          h('div', null, [option.value as string]),
          h(
            NText,
            { depth: 3, tag: 'div' },
            {
              default: () => BankNameMap[option.value as keyof typeof BankNameMap].name,
            },
          ),
        ],
      ),
    ],
  )
}
const renderTag: SelectRenderTag = ({ option }) => {
  return h(
    'div',
    {
      class: ['flex', 'items-center'],
    },
    [
      h(
        NAvatar,
        {
          class: ['bg-transparent!', 'mr-3'],
          size: 24,
        },
        {
          default: () =>
            h(ZwIcon, { name: BankNameMap[option.value as keyof typeof BankNameMap].icon }),
        },
      ),
      option.label as string,
    ],
  )
}
</script>
<template>
  <n-select :options="BankOption" :render-label="renderLabel" :render-tag="renderTag" clearable />
</template>
