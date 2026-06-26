'use client';

import { useState, useEffect } from 'react';
import { ExtendedMaterial, materialTypes } from '@/lib/constants/defaultMaterials';

interface MaterialFormProps {
  material?: Partial<ExtendedMaterial> | null;
  onSave: (material: Partial<ExtendedMaterial>) => Promise<void>;
  onCancel: () => void;
}

export default function MaterialForm({ material, onSave, onCancel }: MaterialFormProps) {
  const [formData, setFormData] = useState<Partial<ExtendedMaterial>>({
    name: '',
    type: 'insulation',
    description: '',
    conductivity: 0.04,
    color: '#40E0D0',
    cost: 0.3,
    isInsulation: true,
    vaporResistance: 1,
    thickness: undefined,
    costPerSqM: { min: 25, max: 45 },
    density: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewColor, setPreviewColor] = useState('#40E0D0');

  useEffect(() => {
    if (material) {
      setFormData(material);
      setPreviewColor(material.color ?? '#40E0D0');
    }
  }, [material]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Material name is required';
    }

    if (formData.conductivity === undefined || formData.conductivity < 0.01 || formData.conductivity > 250) {
      newErrors.conductivity = 'Conductivity must be between 0.01 and 250 W/mK';
    }

    if (formData.vaporResistance === undefined || formData.vaporResistance < 1 || formData.vaporResistance > 100000) {
      newErrors.vaporResistance = 'Vapor resistance must be between 1 and 100000';
    }

    if (formData.costPerSqM) {
      if (formData.costPerSqM.min !== undefined && formData.costPerSqM.min < 0) {
        newErrors.costMin = 'Minimum cost cannot be negative';
      }
      if (formData.costPerSqM.max !== undefined && formData.costPerSqM.max < 0) {
        newErrors.costMax = 'Maximum cost cannot be negative';
      }
      if (formData.costPerSqM.min !== undefined && formData.costPerSqM.max !== undefined) {
        if (formData.costPerSqM.min > formData.costPerSqM.max) {
          newErrors.costMin = 'Minimum cost cannot be greater than maximum cost';
        }
      }
    }

    if (formData.thickness !== undefined && formData.thickness <= 0) {
      newErrors.thickness = 'Thickness must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (err) {
      console.error('Failed to save material:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ExtendedMaterial, value: string | number | boolean | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCostChange = (field: 'min' | 'max', value: number) => {
    setFormData(prev => ({
      ...prev,
      costPerSqM: { ...(prev.costPerSqM ?? {}), [field]: value } as { min: number; max: number },
    }));
    const errorKey = field === 'min' ? 'costMin' : 'costMax';
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {material ? 'Edit Material' : 'Add New Material'}
          </h2>
          <p className="text-gray-600 mt-1">
            {material ? 'Update material properties' : 'Create a new material for the database'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material Name *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Mineral Wool Batt"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material Type *
              </label>
              <select
                value={formData.type || 'insulation'}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {materialTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={previewColor}
                  onChange={(e) => {
                    setPreviewColor(e.target.value);
                    handleInputChange('color', e.target.value);
                  }}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color || ''}
                  onChange={(e) => {
                    setPreviewColor(e.target.value);
                    handleInputChange('color', e.target.value);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="#40E0D0"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the material..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thermal Conductivity (λ) *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.001"
                  min="0.01"
                  max="250"
                  value={formData.conductivity || ''}
                  onChange={(e) => handleInputChange('conductivity', parseFloat(e.target.value))}
                  className={`flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    errors.conductivity ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.04"
                />
                <span className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                  W/mK
                </span>
              </div>
              {errors.conductivity && <p className="text-red-600 text-sm mt-1">{errors.conductivity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vapor Resistance (μ) *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="100000"
                  value={formData.vaporResistance || ''}
                  onChange={(e) => handleInputChange('vaporResistance', parseFloat(e.target.value))}
                  className={`flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    errors.vaporResistance ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="1"
                />
                <span className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                  μ-value
                </span>
              </div>
              {errors.vaporResistance && <p className="text-red-600 text-sm mt-1">{errors.vaporResistance}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost per mm Thickness
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost || ''}
                  onChange={(e) => handleInputChange('cost', parseFloat(e.target.value))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="0.3"
                />
                <span className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                  $/mm
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost per Square Meter
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPerSqM?.min || ''}
                    onChange={(e) => handleCostChange('min', parseFloat(e.target.value) || 0)}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                      errors.costMin ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Min"
                  />
                  {errors.costMin && <p className="text-red-600 text-sm mt-1">{errors.costMin}</p>}
                </div>
                <div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPerSqM?.max || ''}
                    onChange={(e) => handleCostChange('max', parseFloat(e.target.value) || 0)}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                      errors.costMax ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Max"
                  />
                  {errors.costMax && <p className="text-red-600 text-sm mt-1">{errors.costMax}</p>}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thickness (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.thickness || ''}
                  onChange={(e) => handleInputChange('thickness', parseFloat(e.target.value) || undefined)}
                  className={`flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    errors.thickness ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="100"
                />
                <span className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                  mm
                </span>
              </div>
              {errors.thickness && <p className="text-red-600 text-sm mt-1">{errors.thickness}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Density (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.density || ''}
                  onChange={(e) => handleInputChange('density', parseFloat(e.target.value) || undefined)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                />
                <span className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                  kg/m³
                </span>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isInsulation || false}
                  onChange={(e) => handleInputChange('isInsulation', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  This material provides insulation
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : material ? 'Update Material' : 'Add Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
