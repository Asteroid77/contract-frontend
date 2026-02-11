import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { useSubscribeForm } from '@/modules/shared/application/form/useSubscribeForm'

describe('useSubscribeForm', () => {
  it('creates editable cloned form value and avoids mutating source', () => {
    const source = ref({
      name: 'Alice',
      nested: {
        level: 1,
      },
    })

    const { formValue } = useSubscribeForm(source)

    expect(formValue.value).toEqual(source.value)

    formValue.value.nested.level = 2

    expect(formValue.value.nested.level).toBe(2)
    expect(source.value.nested.level).toBe(1)
  })

  it('syncs editable form value when source changes deeply', async () => {
    const source = ref({
      profile: {
        nickname: 'Old',
      },
    })

    const { formValue } = useSubscribeForm(source)

    source.value = {
      profile: {
        nickname: 'New',
      },
    }
    await nextTick()

    expect(formValue.value.profile.nickname).toBe('New')

    source.value.profile.nickname = 'Newest'
    await nextTick()

    expect(formValue.value.profile.nickname).toBe('Newest')
  })

  it('returns computed value in readonly mode and follows source', async () => {
    const source = ref({
      count: 1,
    })

    const { formValue } = useSubscribeForm(source, true)

    expect(formValue.value.count).toBe(1)

    source.value = {
      count: 2,
    }
    await nextTick()

    expect(formValue.value.count).toBe(2)
  })

  it('handles undefined source by falling back to empty object', async () => {
    const source = ref<{ name?: string } | undefined>(undefined)

    const { formValue } = useSubscribeForm(source)

    expect(formValue.value).toEqual({})

    source.value = { name: 'Bob' }
    await nextTick()

    expect(formValue.value).toEqual({ name: 'Bob' })
  })
})
