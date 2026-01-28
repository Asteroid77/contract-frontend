// 定义通用树节点接口
export interface TreeNode {
  key: string
  label: string
  children?: TreeNode[]
  [prop: string]: unknown // 允许其他属性
}

export class TreeLookup {
  // 内部存储两个 Map
  private labelMap = new Map<string, string>()
  private fullPathMap = new Map<string, string>()
  private separator: string

  /**
   * 构造函数
   * @param treeData 树形数据源
   * @param separator 路径连接符，默认 "-"
   */
  constructor(treeData: TreeNode[], separator: string = '-') {
    this.separator = separator
    // 初始化构建
    if (treeData && treeData.length) {
      this.buildMaps(treeData, '')
    }
  }

  /**
   * 递归构建 Map (私有方法)
   */
  private buildMaps(nodes: TreeNode[], prefix: string) {
    for (const node of nodes) {
      const { key, label, children } = node

      // 1. 存单名 Map
      this.labelMap.set(key, label)

      // 2. 存全路径 Map
      // 如果有前缀，拼接前缀；否则就是当前 label
      const currentPath = prefix ? `${prefix}${this.separator}${label}` : label

      this.fullPathMap.set(key, currentPath)

      // 3. 递归处理子节点
      if (children && children.length > 0) {
        this.buildMaps(children, currentPath)
      }
    }
  }

  /**
   * 获取单个名称
   * @param key 键值
   * @returnsLabel 或 key
   */
  getLabel(key: string): string {
    if (!key) return ''
    return this.labelMap.get(key) || key
  }

  /**
   * 获取完整路径
   * @param key 键值
   * @returns "父-子-孙" 或 key
   */
  getFullPath(key: string): string {
    if (!key) return ''
    return this.fullPathMap.get(key) || key
  }
}
