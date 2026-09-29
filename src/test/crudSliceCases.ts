import { beforeEach, describe, expect, it } from 'vitest';
import { useStore, StoreState } from '@/store/useStore';
import { resetStore } from './resetStore';

type Entity = { id: string };

interface CrudCaseOptions<T extends Entity> {
  name: string;
  listKey: keyof StoreState;
  initial: T[];
  add: (s: StoreState, item: T) => void;
  update: (s: StoreState, id: string, data: Partial<T>) => void;
  remove: (s: StoreState, id: string) => void;
  makeNew: () => T;
  patch: Partial<T>;
}

/**
 * Shared behavioural contract for the simple list CRUD slices
 * (add appends, update merges by id, delete filters by id, all immutable).
 */
export function describeCrudSlice<T extends Entity>(o: CrudCaseOptions<T>) {
  const list = () => useStore.getState()[o.listKey] as unknown as T[];

  describe(`${o.name} CRUD`, () => {
    beforeEach(resetStore);

    it('initial state is the mock data', () => {
      expect(list()).toEqual(o.initial);
      expect(list().length).toBeGreaterThan(0);
    });

    it('add appends to the end without mutating the previous array', () => {
      const before = list();
      const item = o.makeNew();
      o.add(useStore.getState(), item);
      const after = list();
      expect(after).toHaveLength(before.length + 1);
      expect(after[after.length - 1]).toEqual(item);
      expect(after).not.toBe(before);
      expect(before).toHaveLength(o.initial.length);
    });

    it('add allows duplicate ids (no uniqueness check)', () => {
      const dup = { ...o.makeNew(), id: o.initial[0].id };
      o.add(useStore.getState(), dup);
      expect(list().filter((x) => x.id === dup.id)).toHaveLength(2);
    });

    it('update merges the patch into the matching item only', () => {
      const target = o.initial[0];
      o.update(useStore.getState(), target.id, o.patch);
      const after = list();
      expect(after.find((x) => x.id === target.id)).toEqual({ ...target, ...o.patch });
      after.slice(1).forEach((x, i) => expect(x).toBe(o.initial[i + 1]));
    });

    it('update does not mutate the original object', () => {
      const snapshot = structuredClone(o.initial[0]);
      o.update(useStore.getState(), o.initial[0].id, o.patch);
      expect(o.initial[0]).toEqual(snapshot);
    });

    it('update keeps the id even when the patch is empty', () => {
      o.update(useStore.getState(), o.initial[0].id, {});
      expect(list()[0]).toEqual(o.initial[0]);
    });

    it('update with an unknown id leaves items unchanged', () => {
      o.update(useStore.getState(), '__missing__', o.patch);
      expect(list()).toEqual(o.initial);
    });

    it('delete removes the matching item', () => {
      const id = o.initial[1].id;
      o.remove(useStore.getState(), id);
      expect(list()).toHaveLength(o.initial.length - 1);
      expect(list().some((x) => x.id === id)).toBe(false);
    });

    it('delete with an unknown id is a no-op', () => {
      o.remove(useStore.getState(), '__missing__');
      expect(list()).toEqual(o.initial);
    });

    it('delete removes all items sharing an id', () => {
      const dup = { ...o.makeNew(), id: o.initial[0].id };
      o.add(useStore.getState(), dup);
      o.remove(useStore.getState(), dup.id);
      expect(list().some((x) => x.id === dup.id)).toBe(false);
    });

    it('add then update then delete round-trips', () => {
      const item = o.makeNew();
      o.add(useStore.getState(), item);
      o.update(useStore.getState(), item.id, o.patch);
      expect(list().find((x) => x.id === item.id)).toEqual({ ...item, ...o.patch });
      o.remove(useStore.getState(), item.id);
      expect(list()).toEqual(o.initial);
    });
  });
}
