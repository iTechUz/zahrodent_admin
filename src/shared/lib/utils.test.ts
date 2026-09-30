import { cn } from './utils';

describe('cn', () => {
  it('joins truthy class names', () => {
    const hidden = false;
    expect(cn('a', hidden && 'b', undefined, null, 'c')).toBe('a c');
  });

  it('supports object / array syntax', () => {
    expect(cn(['a', { b: true, c: false }])).toBe('a b');
  });

  it('lets later tailwind classes win conflicts', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });
});
