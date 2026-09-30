/**
 * `sortBy` whitelists of the backend list endpoints (zahrodent_backend
 * src/<module>/dto/<module>-query.dto.ts → *_SORT_FIELDS). Anything else is rejected
 * with 400, so table headers may only use these. `order` is asc | desc.
 */
export const SORT_FIELDS = {
  patients: ['createdAt', 'firstName', 'lastName', 'age', 'source'],
  bookings: ['date', 'time', 'createdAt', 'status', 'source'],
  visits: ['date', 'status', 'price'],
  payments: ['date', 'amount', 'status', 'method', 'type'],
  services: ['name', 'category', 'price', 'duration'],
  leads: ['createdAt', 'updatedAt', 'name', 'status', 'source'],
  doctors: ['firstName', 'lastName', 'specialty'],
  users: ['createdAt', 'name', 'role', 'phone'],
} as const;

export type SortResource = keyof typeof SORT_FIELDS;
export type SortField<R extends SortResource> = (typeof SORT_FIELDS)[R][number];

/** Type-checked column → `sortBy` mapping: `sortBy('patients', 'age')`. */
export function sortBy<R extends SortResource>(_resource: R, field: SortField<R>): SortField<R> {
  return field;
}

export function isSortField(resource: SortResource, field: string | undefined): boolean {
  return !!field && (SORT_FIELDS[resource] as readonly string[]).includes(field);
}
