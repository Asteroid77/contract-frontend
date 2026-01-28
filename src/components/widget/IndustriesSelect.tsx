import { NSelect, selectProps } from 'naive-ui'
import { defineComponent } from 'vue'
import { Industries } from './constant/IndustriesContant'

// 对比两者的 placeholder 定义

export default defineComponent({
  name: 'IndustriesSelect',
  props: selectProps,
  setup(props, { attrs, slots }) {
    return () => <NSelect {...props} {...attrs} v-slots={slots} options={Industries}></NSelect>
  },
})
