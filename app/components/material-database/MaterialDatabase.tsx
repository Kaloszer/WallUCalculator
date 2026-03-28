'use client';

import { useState, useEffect } from 'react';
import { ExtendedMaterial } from '@/lib/constants/defaultMaterials';
import MaterialSearch from './MaterialSearch';
import MaterialList from './MaterialList';
import MaterialForm from './MaterialForm';

interface MaterialFormData extends Partial<ExtendedMaterial> {}

export default function MaterialDatabase() {
  const [materials, setMaterials] = useState<ExtendedMaterial[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<ExtendedMaterial[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<ExtendedMaterial | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/materials/');
      if (!response.ok) throw new Error('Failed to load materials');
      const data = await response.json();
      setMaterials(data);
      setFilteredMaterials(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (results: ExtendedMaterial[]) => {
    setFilteredMaterials(results);
  };

  const handleFilter = (filters: { type?: string }) => {
    let results = materials;

    if (filters.type) {
      results = results.filter(m => m.type === filters.type);
    }

    setFilteredMaterials(results);
  };

  const handleSort = (sortBy: 'name' | 'conductivity' | 'cost', order: 'asc' | 'desc') => {
    const sorted = [...filteredMaterials].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'conductivity':
          comparison = a.conductivity - b.conductivity;
          break;
        case 'cost':
          comparison = (a.costPerSqM?.min || 0) - (b.costPerSqM?.min || 0);
          break;
      }
      return order === 'asc' ? comparison : -comparison;
    });
    setFilteredMaterials(sorted);
  };

  const handleAdd = () => {
    setSelectedMaterial(null);
    setIsFormOpen(true);
  };

  const handleEdit = (material: ExtendedMaterial) => {
    setSelectedMaterial(material);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
      const response = await fetch(`/api/materials/?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete material');

      showNotification('success', 'Material deleted successfully');
      await loadMaterials();
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Failed to delete material');
    }
  };

  const handleSave = async (material: MaterialFormData) => {
    try {
      const response = await fetch('/api/materials/', {
        method: selectedMaterial ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(material),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save material');
      }

      showNotification('success', selectedMaterial ? 'Material updated successfully' : 'Material added successfully');
      setIsFormOpen(false);
      await loadMaterials();
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Failed to save material');
      throw err;
    }
  };

  const handleImport = async (file: File, mergeStrategy: 'merge' | 'replace') => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const response = await fetch('/api/materials/import/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials: data.materials || data, mergeStrategy }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import materials');
      }

      showNotification('success', `Materials imported successfully`);
      await loadMaterials();
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Failed to import materials');
      throw err;
    }
  };

  const handleExport = async (selectedIds?: string[]) => {
    try {
      const url = selectedIds
        ? `/api/materials/export?format=json&ids=${selectedIds.join(',')}`
        : '/api/materials/export?format=json';

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to export materials');

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const urlObj = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlObj;
      a.download = `materials-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(urlObj);

      showNotification('success', 'Materials exported successfully');
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Failed to export materials');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-medium">Error loading materials</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button
          onClick={loadMaterials}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`p-4 rounded-lg border ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Material Database</h1>
          <p className="text-gray-600 mt-1">Manage building materials for wall calculations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => document.getElementById('import-file')?.click()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
          </button>
          <input
            id="import-file"
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file, 'merge');
            }}
          />
          <button
            onClick={() => handleExport()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Material
          </button>
        </div>
      </div>

      <MaterialSearch
        materials={materials}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onSort={handleSort}
      />

      <MaterialList
        materials={filteredMaterials}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onExport={(ids) => handleExport(ids)}
      />

      {isFormOpen && (
        <MaterialForm
          material={selectedMaterial}
          onSave={handleSave}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
