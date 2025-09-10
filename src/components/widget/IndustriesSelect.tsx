import { NSelect, selectProps } from 'naive-ui'
import { defineComponent } from 'vue'
import { Industries } from './constant/IndustriesContant'
export default defineComponent({
  props: selectProps,
  setup(props, { attrs, slots }) {
    return () => <NSelect {...props} {...attrs} v-slots={slots} options={Industries}></NSelect>
  },
})
