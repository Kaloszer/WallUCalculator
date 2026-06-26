'use client';

import { ExtendedMaterial, materialTypes } from '@/lib/constants/defaultMaterials';

interface MaterialCardProps {
  material: ExtendedMaterial;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function MaterialCard({ material, selected, onSelect, onEdit, onDelete }: MaterialCardProps) {
  const typeInfo = materialTypes.find(t => t.value === material.type);

  const getConductivityColor = (conductivity: number): string => {
    if (conductivity < 0.03) return 'bg-green-100 text-green-800';
    if (conductivity < 0.05) return 'bg-yellow-100 text-yellow-800';
    if (conductivity < 0.1) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getConductivityLabel = (conductivity: number): string => {
    if (conductivity < 0.03) return 'Excellent';
    if (conductivity < 0.05) return 'Good';
    if (conductivity < 0.1) return 'Fair';
    return 'Poor';
  };

  return (
    <div
      className={`border-2 rounded-lg p-4 transition-all ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
        />

        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl" title={typeInfo?.label}>
                  {typeInfo?.icon}
                </span>
                <h3 className="font-semibold text-gray-900">{material.name}</h3>
              </div>
              {material.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{material.description}</p>
              )}
            </div>
            <div
              className="w-8 h-8 rounded-full border-2 border-gray-200"
              style={{ backgroundColor: material.color }}
              title={`Color: ${material.color}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500 block">Conductivity:</span>
              <span className="font-medium">{material.conductivity.toFixed(3)} W/mK</span>
              <span
                className={`inline-block ml-2 px-2 py-0.5 rounded text-xs ${getConductivityColor(
                  material.conductivity
                )}`}
              >
                {getConductivityLabel(material.conductivity)}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Vapor Resistance:</span>
              <span className="font-medium">
                {material.vaporResistance >= 1000
                  ? `${(material.vaporResistance / 1000).toFixed(1)}k`
                  : material.vaporResistance}
              </span>
            </div>
            {material.costPerSqM && (
              <div>
                <span className="text-gray-500 block">Cost:</span>
                <span className="font-medium">
                  ${material.costPerSqM.min}
                  {material.costPerSqM.max && material.costPerSqM.max !== material.costPerSqM.min
                    ? ` - $${material.costPerSqM.max}`
                    : ''}
                  /m²
                </span>
              </div>
            )}
            {material.thickness && (
              <div>
                <span className="text-gray-500 block">Thickness:</span>
                <span className="font-medium">{material.thickness} mm</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {material.isInsulation && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Insulation
              </span>
            )}
            {material.density && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {material.density} kg/m³
              </span>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <button
              onClick={onEdit}
              className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 flex items-center justify-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
