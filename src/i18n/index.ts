import { vi, type MessageKey } from './vi';

const dictionaries = { vi } as const;
export type Locale = keyof typeof dictionaries;

let current: Locale = 'vi';

export function setLocale(locale: Locale): void {
  current = locale;
}

/** Tra chuỗi và thay các biến dạng {name}. */
export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  const template: string = dictionaries[current][key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, name: string) =>
    name in vars ? String(vars[name]) : m,
  );
}

export type { MessageKey };
