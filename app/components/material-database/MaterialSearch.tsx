'use client';

import { useState, useCallback } from 'react';
import Fuse from 'fuse.js';
import { ExtendedMaterial, materialTypes } from '@/lib/constants/defaultMaterials';

interface MaterialSearchProps {
  materials: ExtendedMaterial[];
  onSearch: (results: ExtendedMaterial[]) => void;
  onFilter: (filters: { type?: string }) => void;
  onSort: (sortBy: 'name' | 'conductivity' | 'cost', order: 'asc' | 'desc') => void;
}

export default function MaterialSearch({
  materials,
  onSearch,
  onFilter,
  onSort,
}: MaterialSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'conductivity' | 'cost'>('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const fuse = new Fuse(materials, {
    keys: ['name', 'description', 'type'],
    threshold: 0.3,
  }) as Fuse<ExtendedMaterial>;

  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    if (!searchQuery.trim()) {
      let results = materials;
      if (selectedType) {
        results = results.filter(m => m.type === selectedType);
      }
      onSearch(results);
    } else {
      const startTime = performance.now();
      const results = fuse.search(searchQuery).map(r => r.item);
      const endTime = performance.now();
      console.log(`Search took ${(endTime - startTime).toFixed(2)}ms for ${results.length} results`);

      if (selectedType) {
        const filtered = results.filter(m => m.type === selectedType);
        onSearch(filtered);
      } else {
        onSearch(results);
      }
    }
  }, [fuse, materials, selectedType, onSearch]);

  const handleFilterChange = useCallback((type: string) => {
    setSelectedType(type);
    if (!query.trim()) {
      onFilter({ type: type || undefined });
    } else {
      handleSearch(query);
    }
  }, [query, onFilter, handleSearch]);

  const handleSortChange = useCallback((newSortBy: 'name' | 'conductivity' | 'cost') => {
    if (newSortBy === sortBy) {
      const newOrder = order === 'asc' ? 'desc' : 'asc';
      setOrder(newOrder);
      onSort(newSortBy, newOrder);
    } else {
      setSortBy(newSortBy);
      setOrder('asc');
      onSort(newSortBy, 'asc');
    }
  }, [sortBy, order, onSort]);

  const handleReset = () => {
    setQuery('');
    setSelectedType('');
    setSortBy('name');
    setOrder('asc');
    onSearch(materials);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xs border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Materials
          </label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, description, or type..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pl-10"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Material Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            {materialTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <div className="flex gap-2">
            <select
              value={`${sortBy}-${order}`}
              onChange={(e) => {
                const [newSortBy, newOrder] = e.target.value.split('-') as [
                  'name' | 'conductivity' | 'cost',
                  'asc' | 'desc'
                ];
                setSortBy(newSortBy);
                setOrder(newOrder);
                onSort(newSortBy, newOrder);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="conductivity-asc">Conductivity (Low-High)</option>
              <option value="conductivity-desc">Conductivity (High-Low)</option>
              <option value="cost-asc">Cost (Low-High)</option>
              <option value="cost-desc">Cost (High-Low)</option>
            </select>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              title="Reset filters"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-4 text-sm text-gray-600">
        <span className="font-medium">Quick Sort:</span>
        <button
          onClick={() => handleSortChange('name')}
          className={`hover:text-blue-600 ${sortBy === 'name' ? 'text-blue-600 font-medium' : ''}`}
        >
          Name
        </button>
        <button
          onClick={() => handleSortChange('conductivity')}
          className={`hover:text-blue-600 ${sortBy === 'conductivity' ? 'text-blue-600 font-medium' : ''}`}
        >
          Conductivity
        </button>
        <button
          onClick={() => handleSortChange('cost')}
          className={`hover:text-blue-600 ${sortBy === 'cost' ? 'text-blue-600 font-medium' : ''}`}
        >
          Cost
        </button>
        {order === 'asc' && (
          <span className="text-gray-400">(ascending)</span>
        )}
        {order === 'desc' && (
          <span className="text-gray-400">(descending)</span>
        )}
      </div>
    </div>
  );
}
