import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

const {
  uploadPropsState,
  mutateSpy,
  messageSuccessSpy,
  messageErrorSpy,
  fetchedFilesState,
  isSuccessState,
} = vi.hoisted(() => ({
  uploadPropsState: {
    value: null as Record<string, any> | null,
  },
  mutateSpy: vi.fn(),
  messageSuccessSpy: vi.fn(),
  messageErrorSpy: vi.fn(),
  fetchedFilesState: {
    value: [] as Array<Record<string, unknown>>,
  },
  isSuccessState: {
    value: false,
  },
}))

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('@/_utils/discrete_naive_api', () => ({
  message: {
    success: messageSuccessSpy,
    error: messageErrorSpy,
  },
}))

vi.mock('@/modules/service-agreement/application/hooks/useSignService', () => ({
  useUploadFileMutation: () => ({
    mutate: mutateSpy,
  }),
}))

vi.mock('@/modules/file/application/hooks/useFileService', () => ({
  useFilesDetailQuery: () => ({
    data: fetchedFilesState,
    isSuccess: isSuccessState,
  }),
}))

vi.mock('@vicons/material', () => ({
  ImageOutlined: defineComponent({
    name: 'ImageOutlined',
    setup() {
      return () => h('span', { 'data-test': 'image-outlined' })
    },
  }),
}))

vi.mock('naive-ui', () => ({
  NIcon: defineComponent({
    name: 'NIcon',
    setup(_, { slots }) {
      return () => h('i', { 'data-test': 'n-icon' }, slots.default?.())
    },
  }),
  NUpload: defineComponent({
    name: 'NUpload',
    props: {
      fileList: {
        type: Array,
        required: false,
      },
      max: {
        type: Number,
        required: false,
      },
      customRequest: {
        type: Function,
        required: false,
      },
      createThumbnailUrl: {
        type: Function,
        required: false,
      },
      renderIcon: {
        type: Function,
        required: false,
      },
      listType: {
        type: String,
        required: false,
      },
      accept: {
        type: String,
        required: false,
      },
      'onUpdate:fileList': {
        type: Function,
        required: false,
      },
    },
    setup(props) {
      uploadPropsState.value = props as unknown as Record<string, any>
      return () =>
        h('div', {
          'data-test': 'n-upload',
          'data-file-len': String((props.fileList || []).length),
          'data-max': String(props.max ?? ''),
          'data-list-type': props.listType ?? '',
        })
    },
  }),
}))

import ImagesUploader from '@/modules/service-agreement/presentation/sign/ImagesUploader'

const createInitialFile = (id: number, fileName: string, accessUrl: string) =>
  ({
    id,
    fileName,
    accessUrl,
  }) as never

describe('ImagesUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    uploadPropsState.value = null
    fetchedFilesState.value = []
    isSuccessState.value = false
  })

  it('maps initialFileList to upload file-list', async () => {
    mount(ImagesUploader, {
      props: {
        value: [],
        initialFileList: [
          createInitialFile(1, 'a.png', 'https://a'),
          createInitialFile(2, 'b.png', 'https://b'),
        ],
        fileCategory: 'BILL',
      },
    })

    await nextTick()

    expect(uploadPropsState.value).toBeTruthy()
    expect(uploadPropsState.value!.fileList).toHaveLength(2)
    expect(uploadPropsState.value!.fileList[0].id).toBe('1')
    expect(uploadPropsState.value!.fileList[0].name).toBe('a.png')
    expect(uploadPropsState.value!.fileList[0].url).toBe('https://a')
  })

  it('emits numeric finished ids when file-list updates', async () => {
    const wrapper = mount(ImagesUploader, {
      props: {
        value: [],
        initialFileList: [],
        fileCategory: 'BILL',
      },
    })

    const updateFileList = uploadPropsState.value?.['onUpdate:fileList'] as ((list: unknown[]) => void) | undefined
    expect(updateFileList).toBeTypeOf('function')

    updateFileList?.([
      { id: '1', status: 'finished' } as never,
      { id: 'X', status: 'finished' } as never,
      { id: '2', status: 'uploading' } as never,
    ])

    const emitted = wrapper.emitted('update:value') || []
    expect(emitted.length).toBe(1)
    expect(emitted[0][0]).toEqual([1])
  })

  it('calls onError when customRequest gets no real file object', () => {
    mount(ImagesUploader, {
      props: {
        value: [],
        initialFileList: [],
        fileCategory: 'BILL',
      },
    })

    const customRequest = uploadPropsState.value?.customRequest as ((options: Record<string, unknown>) => void) | undefined
    const onError = vi.fn()

    customRequest?.({
      file: {
        id: 'temp',
        name: 'broken.png',
      },
      onError,
      onFinish: vi.fn(),
      onProgress: vi.fn(),
    })

    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('replaces temp id with server id and emits new finished ids on upload success', () => {
    const wrapper = mount(ImagesUploader, {
      props: {
        value: [],
        initialFileList: [],
        fileCategory: 'BILL',
      },
    })

    mutateSpy.mockImplementation((_, callbacks: { onSuccess: (value: Record<string, unknown>) => void }) => {
      callbacks.onSuccess({
        id: 99,
        fileName: 'server.png',
        accessUrl: 'https://cdn/server.png',
      })
    })

    const updateFileList = uploadPropsState.value?.['onUpdate:fileList'] as ((list: unknown[]) => void) | undefined
    const tempFile = {
      id: 'temp-id',
      name: 'local.png',
      status: 'uploading',
    }
    updateFileList?.([tempFile as never])

    const customRequest = uploadPropsState.value?.customRequest as ((options: Record<string, unknown>) => void) | undefined
    const onFinish = vi.fn(() => {
      tempFile.status = 'finished'
    })

    customRequest?.({
      file: {
        id: 'temp-id',
        name: 'local.png',
        file: new File(['123'], 'local.png', { type: 'image/png' }),
      },
      onFinish,
      onError: vi.fn(),
      onProgress: vi.fn(),
    })

    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(messageSuccessSpy).toHaveBeenCalledTimes(1)

    const emitted = wrapper.emitted('update:value') || []
    const lastPayload = emitted[emitted.length - 1][0] as number[]
    expect(lastPayload).toEqual([99])
  })
})
