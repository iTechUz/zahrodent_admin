// GlobalSearch (cmdk dialog) is not rendered in unit tests yet; the known defect is recorded here.
describe('GlobalSearch', () => {
  it.todo(
    'BUG: src/components/GlobalSearch.tsx:74,77 — filters and titles doctors by `d.name`, but Doctor only has ' +
      'firstName/lastName; doctors never match a name query and results show an empty title',
  );
});
