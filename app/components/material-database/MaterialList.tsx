'use client';

import { useState } from 'react';
import { ExtendedMaterial, materialTypes } from '@/lib/constants/defaultMaterials';
import MaterialCard from './MaterialCard';

interface MaterialListProps {
  materials: ExtendedMaterial[];
  onEdit: (material: ExtendedMaterial) => void;
  onDelete: (id: string) => void;
  onExport: (ids: string[]) => void;
}

export default function MaterialList({ materials, onEdit, onDelete, onExport }: MaterialListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelectAll = () => {
    if (selectedIds.size === materials.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(materials.map(m => m.id)));
    }
  };

  const handleSelectMaterial = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExportSelected = () => {
    if (selectedIds.size > 0) {
      onExport(Array.from(selectedIds));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    const count = selectedIds.size;
    if (!confirm(`Are you sure you want to delete ${count} selected material${count > 1 ? 's' : ''}?`)) return;

    for (const id of selectedIds) {
      await onDelete(id);
    }
    setSelectedIds(new Set());
  };

  if (materials.length === 0) {
    return (
      <div className="bg-white p-12 rounded-lg shadow-xs border border-gray-200 text-center">
        <svg
          className="mx-auto h-16 w-16 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
        <p className="text-gray-600">
          {materials.length === 0
            ? 'Try adjusting your search or filters'
            : 'Add materials to get started'}
        </p>
      </div>
    );
  }

  const groupedMaterials = materials.reduce((acc, material) => {
    if (!acc[material.type]) {
      acc[material.type] = [];
    }
    acc[material.type].push(material);
    return acc;
  }, {} as Record<string, ExtendedMaterial[]>);

  return (
    <div className="space-y-4">
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center justify-between">
          <span className="text-blue-800">
            {selectedIds.size} material{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleExportSelected}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Export Selected
            </button>
            <button
              onClick={handleDeleteSelected}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-4 py-2 text-blue-800 hover:bg-blue-100 rounded"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={selectedIds.size === materials.length && materials.length > 0}
          onChange={handleSelectAll}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <span>Select all ({materials.length} materials)</span>
      </div>

      {Object.entries(groupedMaterials).map(([type, typeMaterials]) => {
        const typeInfo = materialTypes.find(t => t.value === type);
        return (
          <div key={type} className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
              <span className="text-2xl">{typeInfo?.icon}</span>
              <h3 className="text-lg font-semibold text-gray-900">{typeInfo?.label || type}</h3>
              <span className="text-sm text-gray-500">({typeMaterials.length})</span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {typeMaterials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  selected={selectedIds.has(material.id)}
                  onSelect={() => handleSelectMaterial(material.id)}
                  onEdit={() => onEdit(material)}
                  onDelete={() => onDelete(material.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
