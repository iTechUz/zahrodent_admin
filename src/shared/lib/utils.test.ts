import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('joins class names', () => expect(cn('a', 'b')).toBe('a b'));
  it('returns empty string with no input', () => expect(cn()).toBe(''));
  it('drops falsy values', () => expect(cn('a', false, null, undefined, 0, '', 'b')).toBe('a b'));
  it('supports conditional objects', () => expect(cn({ a: true, b: false }, 'c')).toBe('a c'));
  it('flattens arrays', () => expect(cn(['a', ['b', { c: true }]])).toBe('a b c'));
  it('resolves tailwind conflicts, last wins', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-sm text-red-500', 'text-blue-500')).toBe('text-sm text-blue-500');
  });
  it('keeps non-conflicting tailwind classes', () => expect(cn('px-2', 'py-4')).toBe('px-2 py-4'));
});
