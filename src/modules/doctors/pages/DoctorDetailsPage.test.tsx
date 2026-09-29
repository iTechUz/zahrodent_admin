// DoctorDetailsPage is not rendered in unit tests yet; the known defect is recorded here.
describe('DoctorDetailsPage', () => {
  it.todo(
    'BUG: src/modules/doctors/pages/DoctorDetailsPage.tsx:162,169 — reads `visitCount` from the /doctors/efficiency row, but ' +
      'the backend returns `totalVisits` (doctors.repository.ts:138); "Tashriflar" is always 0 and "O\'rtacha chek" is always 0',
  );
});
