import { act, renderHook } from '@testing-library/react';
import { useDialogState } from './useDialogState';

type Item = { id: string; name: string };
const initial = { name: '' };

describe('useDialogState', () => {
  it('starts closed with the initial form', () => {
    const { result } = renderHook(() => useDialogState<Item, { name: string }>(initial));
    expect(result.current.isOpen).toBe(false);
    expect(result.current.editingItem).toBeNull();
    expect(result.current.form).toEqual(initial);
  });

  it('openEdit sets the item, maps it into the form and opens', () => {
    const { result } = renderHook(() => useDialogState<Item, { name: string }>(initial));
    const mapper = vi.fn((i: Item) => ({ name: i.name.toUpperCase() }));
    act(() => result.current.openEdit({ id: '1', name: 'ali' }, mapper));
    expect(mapper).toHaveBeenCalledWith({ id: '1', name: 'ali' });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.editingItem).toEqual({ id: '1', name: 'ali' });
    expect(result.current.form).toEqual({ name: 'ALI' });
  });

  it('openCreate clears the editing item and resets the form', () => {
    const { result } = renderHook(() => useDialogState<Item, { name: string }>(initial));
    act(() => result.current.openEdit({ id: '1', name: 'ali' }, (i) => ({ name: i.name })));
    act(() => result.current.closeDialog());
    act(() => result.current.openCreate());
    expect(result.current.isOpen).toBe(true);
    expect(result.current.editingItem).toBeNull();
    expect(result.current.form).toEqual(initial);
  });

  it('closeDialog closes but keeps editingItem (until next open)', () => {
    const { result } = renderHook(() => useDialogState<Item, { name: string }>(initial));
    act(() => result.current.openEdit({ id: '1', name: 'a' }, (i) => ({ name: i.name })));
    act(() => result.current.closeDialog());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.editingItem).toEqual({ id: '1', name: 'a' });
  });

  it('exposes raw setters', () => {
    const { result } = renderHook(() => useDialogState<Item, { name: string }>(initial));
    act(() => {
      result.current.setIsOpen(true);
      result.current.setForm({ name: 'x' });
      result.current.setEditingItem({ id: '2', name: 'y' });
    });
    expect(result.current).toMatchObject({ isOpen: true, form: { name: 'x' }, editingItem: { id: '2', name: 'y' } });
  });
});
