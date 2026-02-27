import { computed, defineComponent, type PropType } from 'vue'

const DEFAULT_MAX_SECONDARY = 2

export default defineComponent({
  name: 'MobilePrimarySecondaryText',
  props: {
    primary: {
      type: String,
      required: true,
    },
    secondary: {
      type: Array as PropType<Array<string | null | undefined>>,
      default: () => [],
    },
    maxSecondary: {
      type: Number,
      default: DEFAULT_MAX_SECONDARY,
    },
  },
  setup(props) {
    const secondaryLines = computed(() => {
      const maxSecondary = Number.isFinite(props.maxSecondary)
        ? Math.max(0, props.maxSecondary)
        : DEFAULT_MAX_SECONDARY

      return (props.secondary || [])
        .filter((line): line is string => Boolean(line && line.trim().length))
        .slice(0, maxSecondary)
    })

    return () => (
      <div class="min-w-0" data-test="mobile-primary-secondary">
        <div
          class="text-sm font-medium text-[var(--color-text-main)] truncate"
          data-test="mobile-primary-secondary-primary"
        >
          {props.primary}
        </div>
        {secondaryLines.value.map((line, index) => (
          <div
            key={`${index}-${line}`}
            class="text-xs text-[var(--color-text-light)] truncate mt-1"
            data-test="mobile-primary-secondary-secondary"
          >
            {line}
          </div>
        ))}
      </div>
    )
  },
})
