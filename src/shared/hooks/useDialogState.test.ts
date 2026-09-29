import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDialogState } from './useDialogState';

type Item = { id: string; title: string };
type Form = { title: string };
const initial: Form = { title: '' };

describe('useDialogState', () => {
  it('starts closed, with no editing item and the initial form', () => {
    const { result } = renderHook(() => useDialogState<Item, Form>(initial));
    expect(result.current.isOpen).toBe(false);
    expect(result.current.editingItem).toBeNull();
    expect(result.current.form).toBe(initial);
  });

  it('openEdit sets the item, maps the form and opens', () => {
    const { result } = renderHook(() => useDialogState<Item, Form>(initial));
    const item = { id: '1', title: 'Hello' };
    act(() => result.current.openEdit(item, (i) => ({ title: i.title.toUpperCase() })));
    expect(result.current.isOpen).toBe(true);
    expect(result.current.editingItem).toBe(item);
    expect(result.current.form).toEqual({ title: 'HELLO' });
  });

  it('openCreate after openEdit clears the item and resets the form', () => {
    const { result } = renderHook(() => useDialogState<Item, Form>(initial));
    act(() => result.current.openEdit({ id: '1', title: 'x' }, (i) => ({ title: i.title })));
    act(() => result.current.closeDialog());
    act(() => result.current.openCreate());
    expect(result.current.isOpen).toBe(true);
    expect(result.current.editingItem).toBeNull();
    expect(result.current.form).toEqual(initial);
  });

  it('closeDialog closes but keeps editingItem and form', () => {
    const { result } = renderHook(() => useDialogState<Item, Form>(initial));
    const item = { id: '1', title: 'x' };
    act(() => result.current.openEdit(item, (i) => ({ title: i.title })));
    act(() => result.current.closeDialog());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.editingItem).toBe(item);
    expect(result.current.form).toEqual({ title: 'x' });
  });

  it('exposes raw setters', () => {
    const { result } = renderHook(() => useDialogState<Item, Form>(initial));
    act(() => {
      result.current.setIsOpen(true);
      result.current.setForm({ title: 'typed' });
      result.current.setEditingItem({ id: '9', title: 't' });
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.form).toEqual({ title: 'typed' });
    expect(result.current.editingItem).toEqual({ id: '9', title: 't' });
  });

  it('openCreate uses the latest initialFormState prop', () => {
    const { result, rerender } = renderHook(({ init }) => useDialogState<Item, Form>(init), {
      initialProps: { init: initial },
    });
    rerender({ init: { title: 'preset' } });
    act(() => result.current.openCreate());
    expect(result.current.form).toEqual({ title: 'preset' });
  });

  it('callbacks are stable across renders when initialFormState is stable', () => {
    const { result, rerender } = renderHook(() => useDialogState<Item, Form>(initial));
    const { openCreate, openEdit, closeDialog } = result.current;
    rerender();
    expect(result.current.openCreate).toBe(openCreate);
    expect(result.current.openEdit).toBe(openEdit);
    expect(result.current.closeDialog).toBe(closeDialog);
  });
});
