import { NSelect } from 'naive-ui'
import { defineComponent } from 'vue'
import { Industries } from './constant/IndustriesContant'
export default defineComponent({
  setup(_, { attrs, slots }) {
    return () => <NSelect options={Industries} {...attrs} v-slots={slots}></NSelect>
  },
})
