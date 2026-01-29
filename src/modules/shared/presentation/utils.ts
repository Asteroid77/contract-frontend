// 定义我们数据项的类型，这在 TypeScript 中是个好习惯
interface DataItem {
  key: string
  data: string
  label: string
  children?: DataItem[]
}

/**
 * 在树状数据结构中递归查找一个节点。
 *
 * @param nodes - 要搜索的节点数组 (树)。
 * @param valueToFind - 要查找的值。
 * @param searchKey - 要在哪一个属性上进行查找, 默认为 'key'。
 * @returns - 找到的节点对象，如果没找到则返回 null。
 */
export function findItemInTree(
  nodes: DataItem[],
  valueToFind: string,
  searchKey: 'key' | 'data' | 'label' = 'key',
): DataItem | null {
  // 1. 遍历当前层的节点
  for (const item of nodes) {
    // 2. 检查当前节点是否匹配
    if (item[searchKey] === valueToFind) {
      return item // 找到了，立即返回！
    }

    // 3. 如果当前节点有子节点，就递归搜索子节点
    if (item.children && item.children.length > 0) {
      const foundInChildren = findItemInTree(item.children, valueToFind, searchKey)

      // 4. 如果在子节点中找到了，立即将结果向上传递
      if (foundInChildren) {
        return foundInChildren
      }
    }
  }

  // 5. 遍历完所有节点及其子节点都没找到，返回 null
  return null
}

/**
 * 在树状数据结构中查找一个节点，并返回从根到该节点的完整路径。
 *
 * @param nodes - 要搜索的节点数组 (树)。
 * @param valueToFind - 要查找的值。
 * @param searchKey - 要在哪一个属性上进行查找, 默认为 'key'。
 * @returns - 包含从根节点到目标节点的路径数组，如果没找到则返回 null。
 */
export function findPathInTree(
  nodes: DataItem[],
  valueToFind: string,
  searchKey: 'key' | 'data' | 'label' = 'key',
): DataItem[] | null {
  // 1. 遍历当前层的节点
  for (const item of nodes) {
    // 2. 检查当前节点是否是目标
    if (item[searchKey] === valueToFind) {
      // 找到了！返回只包含当前节点的路径作为起点
      return [item]
    }

    // 3. 如果有子节点，则递归搜索
    if (item.children && item.children.length > 0) {
      const pathInChildren = findPathInTree(item.children, valueToFind, searchKey)

      // 4. 关键：如果在子节点中找到了路径...
      if (pathInChildren) {
        // ...将当前节点添加到路径的最前面，然后返回完整的路径
        return [item, ...pathInChildren]
      }
    }
  }

  // 5. 在当前层及其所有子孙节点中都找不到，返回 null
  return null
}

/**
 * 遍历文档 <head>，提取所有 Naive UI 相关的 CSS 规则。
 * Naive UI 的 style 标签通常有 id="n-styles" 或 id="n-global-styles"。
 * @returns {string} 包含所有 Naive UI 样式的 CSS 文本。
 */
export function getNaiveCssText(): string {
  const styleElements = document.head.getElementsByTagName('style')
  let naiveCssText = ''

  for (const style of Array.from(styleElements)) {
    // Naive UI 的样式通常注入到带有特定 ID 的 style 标签中
    // 检查这些 ID，这是最可靠的方式
    if (style.id.startsWith('n-')) {
      naiveCssText += style.innerText
    }
  }

  return naiveCssText
}

/** 找出对象中所有空字符串属性 */
export const findEmptyStrings = (obj: object) => Object.entries(obj).filter(([_, v]) => v === '')

/** 找出对象中所有 undefined 属性 */
export const findUndefined = (obj: object) =>
  Object.entries(obj).filter(([_, v]) => v === undefined)

/** 对比两个对象的 keys 差异 */
export const diffKeys = (a: object, b: object) => ({
  onlyInA: Object.keys(a).filter((k) => !(k in b)),
  onlyInB: Object.keys(b).filter((k) => !(k in a)),
})

/** 快速查看 Vue props 的默认值定义 */
export const inspectPropsDefaults = (propsDefinition: object) => {
  Object.entries(propsDefinition).forEach(([key, def]) => {
    if (def && typeof def === 'object' && 'default' in def) {
      console.log(key, '→', def.default)
    }
  })
}
