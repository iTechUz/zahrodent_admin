import { useState, useMemo } from 'react';

interface UseDataTableOptions<T> {
  data: T[];
  filterFn?: (item: T, search: string, filters: Record<string, string>) => boolean;
  initialFilters?: Record<string, string>;
  perPage?: number;
}

export const useDataTable = <T extends object>({ 
  data, 
  filterFn, 
  initialFilters = {}, 
  perPage = 8 
}: UseDataTableOptions<T>) => {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters);
  const [page, setPage] = useState(0);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (!filterFn) return true;
      return filterFn(item, search, filters);
    });
  }, [data, search, filters, filterFn]);

  const totalPages = Math.ceil(filteredData.length / perPage);
  
  const paginatedData = useMemo(() => {
    const start = page * perPage;
    return filteredData.slice(start, start + perPage);
  }, [filteredData, page, perPage]);

  // Reset page when search or filters change
  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(0);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  return {
    data: paginatedData,
    totalCount: filteredData.length,
    search,
    setSearch: handleSearch,
    filters,
    setFilters: handleFilterChange,
    page,
    setPage,
    totalPages,
    perPage,
  };
};
