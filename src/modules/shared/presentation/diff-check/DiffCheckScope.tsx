import { defineComponent } from 'vue'

import '@/modules/shared/presentation/diff-check/styles/scope.css'

export default defineComponent({
  name: 'DiffCheckScope',
  setup(_, { slots }) {
    return () => <div class="diff-check-scope">{slots.default?.()}</div>
  },
})
