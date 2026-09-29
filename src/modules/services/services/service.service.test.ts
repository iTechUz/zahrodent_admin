import { describe, expect, it } from 'vitest';
import { ServiceModuleService } from './service.service';
import { mockServices } from '@/mock/data';

describe('ServiceModuleService', () => {
  it('initialState defaults category to Davolash', () => {
    expect(ServiceModuleService.initialState()).toEqual({
      name: '', category: 'Davolash', price: 0, duration: 0, description: '',
    });
  });

  it('mapToForm copies fields and defaults description', () => {
    const s = mockServices[0];
    expect(ServiceModuleService.mapToForm(s)).toEqual({
      name: s.name, category: s.category, price: s.price, duration: s.duration, description: s.description,
    });
    expect(ServiceModuleService.mapToForm({ ...s, description: undefined }).description).toBe('');
  });

  it('validate: all mock services are valid', () => {
    mockServices.forEach((s) => expect(ServiceModuleService.validate(ServiceModuleService.mapToForm(s))).toBeNull());
  });

  it('validate: initial form fails on name first', () => {
    expect(ServiceModuleService.validate(ServiceModuleService.initialState())).toBe('Xizmat nomi kiritilishi shart');
  });

  it('validate: zero price then zero duration', () => {
    const base = ServiceModuleService.mapToForm(mockServices[0]);
    expect(ServiceModuleService.validate({ ...base, price: 0 })).toBe("Narxi musbat son bo'lishi shart");
    expect(ServiceModuleService.validate({ ...base, duration: 0 })).toBe("Davomiyligi musbat son bo'lishi shart");
  });
});
