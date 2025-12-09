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
const TYPE_PREFIX = {
  NUMBER: 'n:',
  STRING: 's:',
  BOOLEAN: 'b:',
  OBJECT: 'j:',
  ARRAY: 'a:',
  UNDEFINED: 'u:',
  NULL: 'l:',
  DATE: 'd:',
  REGEXP: 'r:',
};

/**
 * 序列化值为字符串
 * @param {any} value - 要序列化的值
 * @returns {string} - 序列化后的字符串
 */
export function serialize(value) {
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
    // 处理特殊数字
    if (Number.isNaN(value)) return `${TYPE_PREFIX.NUMBER}NaN`;
    if (value === Infinity) return `${TYPE_PREFIX.NUMBER}Infinity`;
    if (value === -Infinity) return `${TYPE_PREFIX.NUMBER}-Infinity`;
    return `${TYPE_PREFIX.NUMBER}${value}`;
  }
  
  // boolean
  if (type === 'boolean') {
    return `${TYPE_PREFIX.BOOLEAN}${value}`;
  }
  
  // string - 需要检查是否会与类型前缀冲突
  if (type === 'string') {
    // 如果字符串本身以类型前缀开头，需要加 s: 前缀
    if (looksLikeTypedValue(value)) {
      return `${TYPE_PREFIX.STRING}${value}`;
    }
    return value; // 普通字符串直接返回
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
 * @param {string} str - 序列化的字符串
 * @returns {any} - 反序列化后的值
 */
export function deserialize(str) {
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

/**
 * 检查字符串是否看起来像带类型的值
 */
function looksLikeTypedValue(str) {
  const prefixes = Object.values(TYPE_PREFIX);
  return prefixes.some(prefix => str.startsWith(prefix));
}

// 导出类型前缀常量（可选）
export { TYPE_PREFIX };

