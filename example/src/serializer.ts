/**
 * 类型序列化系统 - 参考 Qwik 的设计
 * 
 * 使用类型前缀来区分不同数据类型：
 * - n: number (数字)
 * - s: string (字符串，当可能与其他类型混淆时)
 * - b: boolean (布尔值)
 * - j: JSON object (对象)
 * - a: JSON array (数组)
 * - u: undefined
 * - l: null
 * - d: Date
 * - r: RegExp
 * 
 * 简单字符串（不以类型前缀开头）直接存储
 */

// 类型前缀定义
export const TYPE_PREFIX = {
  NUMBER: 'n:',
  STRING: 's:',
  BOOLEAN: 'b:',
  OBJECT: 'j:',
  ARRAY: 'a:',
  UNDEFINED: 'u:',
  NULL: 'l:',
  DATE: 'd:',
  REGEXP: 'r:',
} as const;

/**
 * 检查字符串是否看起来像带类型的值
 */
function looksLikeTypedValue(str: string): boolean {
  const prefixes = Object.values(TYPE_PREFIX);
  return prefixes.some(prefix => str.startsWith(prefix));
}

/**
 * 序列化值为字符串
 */
export function serialize(value: unknown): string {
  // null
  if (value === null) {
    return TYPE_PREFIX.NULL;
  }
  
  // undefined
  if (value === undefined) {
    return TYPE_PREFIX.UNDEFINED;
  }
  
  const type = typeof value;
  
  // number
  if (type === 'number') {
    const num = value as number;
    if (Number.isNaN(num)) return `${TYPE_PREFIX.NUMBER}NaN`;
    if (num === Infinity) return `${TYPE_PREFIX.NUMBER}Infinity`;
    if (num === -Infinity) return `${TYPE_PREFIX.NUMBER}-Infinity`;
    return `${TYPE_PREFIX.NUMBER}${num}`;
  }
  
  // boolean
  if (type === 'boolean') {
    return `${TYPE_PREFIX.BOOLEAN}${value}`;
  }
  
  // string - 需要检查是否会与类型前缀冲突
  if (type === 'string') {
    const str = value as string;
    if (looksLikeTypedValue(str)) {
      return `${TYPE_PREFIX.STRING}${str}`;
    }
    return str;
  }
  
  // Date
  if (value instanceof Date) {
    return `${TYPE_PREFIX.DATE}${value.toISOString()}`;
  }
  
  // RegExp
  if (value instanceof RegExp) {
    return `${TYPE_PREFIX.REGEXP}${value.flags}:${value.source}`;
  }
  
  // Array
  if (Array.isArray(value)) {
    return `${TYPE_PREFIX.ARRAY}${JSON.stringify(value)}`;
  }
  
  // Object
  if (type === 'object') {
    return `${TYPE_PREFIX.OBJECT}${JSON.stringify(value)}`;
  }
  
  // 其他类型，尝试转换为字符串
  return String(value);
}

/**
 * 反序列化字符串为原始值
 */
export function deserialize(str: string): unknown {
  if (typeof str !== 'string') return str;
  
  // null
  if (str === TYPE_PREFIX.NULL || str === 'l:') {
    return null;
  }
  
  // undefined
  if (str === TYPE_PREFIX.UNDEFINED || str === 'u:') {
    return undefined;
  }
  
  // number
  if (str.startsWith(TYPE_PREFIX.NUMBER)) {
    const numStr = str.slice(2);
    if (numStr === 'NaN') return NaN;
    if (numStr === 'Infinity') return Infinity;
    if (numStr === '-Infinity') return -Infinity;
    return Number(numStr);
  }
  
  // boolean
  if (str.startsWith(TYPE_PREFIX.BOOLEAN)) {
    return str.slice(2) === 'true';
  }
  
  // string (escaped)
  if (str.startsWith(TYPE_PREFIX.STRING)) {
    return str.slice(2);
  }
  
  // Date
  if (str.startsWith(TYPE_PREFIX.DATE)) {
    return new Date(str.slice(2));
  }
  
  // RegExp
  if (str.startsWith(TYPE_PREFIX.REGEXP)) {
    const content = str.slice(2);
    const colonIndex = content.indexOf(':');
    const flags = content.slice(0, colonIndex);
    const source = content.slice(colonIndex + 1);
    return new RegExp(source, flags);
  }
  
  // Array
  if (str.startsWith(TYPE_PREFIX.ARRAY)) {
    return JSON.parse(str.slice(2));
  }
  
  // Object
  if (str.startsWith(TYPE_PREFIX.OBJECT)) {
    return JSON.parse(str.slice(2));
  }
  
  // 普通字符串
  return str;
}

