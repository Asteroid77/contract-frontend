import { message } from '@/_utils/discrete_naive_api'
import type { ServicePointSpecification } from '@/components/sign/api/sign'
import { ref, type Ref } from 'vue'
import { TransformerCapacityOption } from '../constant/enum'
import type { SelectOption } from 'naive-ui'
export const CapacityOptions = ref<SelectOption[]>(TransformerCapacityOption)
export const handleCapacityOptionCreate = (
  label: string,
  formModel: Ref<FormInput<ServicePointSpecification>>,
) => {
  // 清理用户可能输入的多余字符，比如单位 "kva"
  const cleanedLabel = label.trim().replace(/kva/i, '').trim()

  if (cleanedLabel === '') {
    return // 如果用户只输入了空格或单位，则不处理
  }

  const newValue = parseFloat(cleanedLabel)

  if (isNaN(newValue) || newValue <= 0) {
    message.error(`"${label}" 不是一个有效的容量值，请输入正数。`)
    // 创建失败时，最好将 v-model 清空或重置，防止非法字符串留在输入框
    formModel.value.transformerCapacity = undefined
    return
  }

  // 检查这个值是否已经存在于标准选项中
  const existingOption = TransformerCapacityOption.find((opt) => opt.value === newValue)
  if (existingOption) {
    // 如果已存在，直接使用标准值，无需创建新选项
    formModel.value.transformerCapacity = existingOption.value as number | undefined
    return
  }

  // 检查这个自定义值是否已经创建过
  const alreadyCreated = CapacityOptions.value.some((opt) => opt.value === newValue)
  if (alreadyCreated) {
    // 如果已经创建过，也直接赋值即可
    formModel.value.transformerCapacity = newValue
    return
  }

  // 创建新的选项对象
  const newOption: SelectOption = {
    label: `${newValue} kVA`,
    value: newValue,
  }

  CapacityOptions.value.push(newOption)
  return newOption
}
