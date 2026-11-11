import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { patientsApi } from '@/lib/api/endpoints';
import { resetApiMock } from '@/test/api-mock';
import { createTestQueryClient, loginAs } from '@/test/utils';
import type { Doctor } from '@/shared/types';
import { DoctorForm, DoctorVisitForm } from './DoctorForm';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);

const doctor: Doctor = {
  id: 'd1', firstName: 'Aziz', lastName: 'Karimov', specialty: 'Terapevt', phone: '+998901112233',
  schedule: [{ day: 2, startTime: '09:00', endTime: '18:00', isWorking: true, breakStart: '13:00', breakEnd: '14:00' }],
};

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  loginAs('admin');
});

describe('DoctorForm lunch break', () => {
  it('shows the stored break per working day and submits it; days without break stay clean', async () => {
    const onSave = vi.fn();
    render(<DoctorForm open onOpenChange={() => {}} editing={doctor} onSave={onSave} />);
    expect(await screen.findByLabelText('Cho tanaffus boshlanishi')).toHaveValue('13:00');
    expect(screen.getByLabelText('Cho tanaffus tugashi')).toHaveValue('14:00');
    // rest days: the inputs are disabled
    expect(screen.getByLabelText('Du tanaffus boshlanishi')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Yangilash' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const schedule = onSave.mock.calls[0][0].schedule;
    expect(schedule[2]).toMatchObject({ breakStart: '13:00', breakEnd: '14:00' });
  });

  it('rejects a half-filled break with an inline message', async () => {
    const onSave = vi.fn();
    render(<DoctorForm open onOpenChange={() => {}} editing={doctor} onSave={onSave} />);
    fireEvent.change(await screen.findByLabelText('Cho tanaffus tugashi'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Yangilash' }));
    expect(await screen.findByText('Tanaffus uchun boshlanish va tugash vaqtini kiriting')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('DoctorVisitForm patient picker', () => {
  it('searches patients on the server instead of listing the whole table', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={createTestQueryClient()}>
          <DoctorVisitForm open onOpenChange={() => {}} editingVisit={null} doctor={doctor} onSave={vi.fn()} />
        </QueryClientProvider>
      </MemoryRouter>,
    );
    expect(patientsApi.list).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole('combobox')[0]); // patient is the first field
    await waitFor(() => expect(patientsApi.list).toHaveBeenCalledWith({ search: '', limit: 20 }));
  });
});
