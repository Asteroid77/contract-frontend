import { defineComponent } from 'vue'
import { NCascader, cascaderProps } from 'naive-ui'
import areaData from '@/modules/shared/application/constants/PCA.json'
export default defineComponent({
  name: 'PCACascader',
  props: cascaderProps,
  setup(props, { attrs, slots }) {
    return () => (
      <NCascader
        {...props}
        {...attrs}
        options={areaData}
        value-field={'key'}
        show-path
        checkStrategy={'child'}
        to={false}
        v-slots={slots}
        value={props.value || undefined}
      ></NCascader>
    )
  },
})
