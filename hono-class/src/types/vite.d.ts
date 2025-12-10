/**
 * Vite import.meta.glob 类型定义
 */

interface ImportMeta {
  glob<T = any>(
    pattern: string,
    options?: {
      eager?: boolean;
      import?: string;
      as?: string;
    }
  ): Record<string, T>;
}

