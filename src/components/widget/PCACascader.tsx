import { defineComponent } from 'vue'
import { NCascader, type CascaderProps, cascaderProps } from 'naive-ui'
import { onMounted, ref } from 'vue'
export default defineComponent({
  props: cascaderProps,
  setup(_, { attrs, slots }) {
    const optionData = ref<CascaderProps['options']>([])
    const optionLoading = ref<boolean>(false)
    onMounted(async () => {
      try {
        optionLoading.value = true
        const { default: areaData } = await import('@/components/widget/constant/PCA.json')
        optionData.value = areaData
      } finally {
        optionLoading.value = false
      }
    })
    return () => (
      <NCascader
        options={optionData.value}
        value-field={'key'}
        show-path
        checkStrategy={'child'}
        {...attrs}
        v-slots={slots}
      ></NCascader>
    )
  },
})
