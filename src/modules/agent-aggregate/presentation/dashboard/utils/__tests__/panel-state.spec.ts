import { computed, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { buildPanelState } from '@/modules/agent-aggregate/presentation/dashboard/utils/panel-state'

describe('buildPanelState', () => {
  it('returns error when refetch fails even if previous data still exists', () => {
    const query = {
      isLoading: ref(false),
      isError: ref(true),
      data: ref({ points: [1, 2, 3] }),
      error: ref(new Error('refresh failed')),
    }

    const state = buildPanelState(query, computed(() => 'Request failed'), (data) => Boolean(data))

    expect(state.value).toEqual({
      status: 'error',
      errorMeta: {
        message: 'refresh failed',
        traceId: undefined,
        requestId: undefined,
      },
    })
  })

  it('keeps ready state while background refetch is in flight and previous data exists', () => {
    const query = {
      isLoading: ref(true),
      isError: ref(false),
      data: ref({ points: [1, 2, 3] }),
      error: ref(null),
    }

    const state = buildPanelState(query, computed(() => 'Request failed'), (data) => Boolean(data))

    expect(state.value).toEqual({ status: 'ready' })
  })
})
