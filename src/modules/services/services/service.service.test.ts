import type { Service } from '@/shared/types';
import { ServiceModuleService } from './service.service';

const service: Service = { id: 's1', name: 'Plomba', category: 'Davolash', price: 300000, duration: 30 };

describe('ServiceModuleService', () => {
  it('initialState defaults to the Davolash category', () => {
    expect(ServiceModuleService.initialState()).toEqual({
      name: '',
      category: 'Davolash',
      price: 0,
      duration: 0,
      description: '',
    });
  });

  it('mapToForm', () => {
    expect(ServiceModuleService.mapToForm(service)).toEqual({
      name: 'Plomba',
      category: 'Davolash',
      price: 300000,
      duration: 30,
      description: '',
    });
  });

  it('validate', () => {
    expect(ServiceModuleService.validate(ServiceModuleService.initialState())).toBe('Xizmat nomi kiritilishi shart');
    expect(ServiceModuleService.validate(ServiceModuleService.mapToForm(service))).toBeNull();
    expect(ServiceModuleService.validate({ ...ServiceModuleService.mapToForm(service), duration: 0 })).toBe(
      "Davomiyligi musbat son bo'lishi shart",
    );
  });
});
