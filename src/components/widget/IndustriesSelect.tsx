import { NSelect, selectProps } from 'naive-ui'
import { defineComponent } from 'vue'
import { Industries } from './constant/IndustriesContant'
export default defineComponent({
  props: selectProps,
  setup(_, { attrs, slots }) {
    return () => <NSelect options={Industries} {...attrs} v-slots={slots}></NSelect>
  },
})
