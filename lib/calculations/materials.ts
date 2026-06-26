import Fuse from 'fuse.js';
import { ExtendedMaterial as Material } from '@/lib/constants/defaultMaterials';

const fuseOptions = {
  keys: ['name', 'description', 'type'],
  threshold: 0.3,
  includeScore: true,
};

export function searchMaterials(materials: Material[], query: string): Material[] {
  if (!query.trim()) return materials;

  const fuse = new Fuse(materials, fuseOptions);
  const results = fuse.search(query);
  return results.map(result => result.item);
}

export function sortMaterials(
  materials: Material[],
  sortBy: 'name' | 'conductivity' | 'cost',
  order: 'asc' | 'desc'
): Material[] {
  return [...materials].sort((a, b) => {
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
}

export function filterMaterials(
  materials: Material[],
  filters: {
    type?: string;
    minConductivity?: number;
    maxConductivity?: number;
    minCost?: number;
    maxCost?: number;
  }
): Material[] {
  return materials.filter(material => {
    if (filters.type && material.type !== filters.type) return false;
    if (filters.minConductivity && material.conductivity < filters.minConductivity) return false;
    if (filters.maxConductivity && material.conductivity > filters.maxConductivity) return false;
    if (filters.minCost && (!material.costPerSqM?.min || material.costPerSqM.min < filters.minCost)) return false;
    if (filters.maxCost && (!material.costPerSqM?.max || material.costPerSqM.max > filters.maxCost)) return false;
    return true;
  });
}

export function recommendMaterials(
  materials: Material[],
  criteria: {
    desiredConductivity?: number;
    maxCostPerSqM?: number;
    materialType?: string;
  },
  limit: number = 5
): Material[] {
  let filtered = materials;

  if (criteria.materialType) {
    filtered = filtered.filter(m => m.type === criteria.materialType);
  }

  if (criteria.maxCostPerSqM) {
    const maxCost = criteria.maxCostPerSqM;
    filtered = filtered.filter(m => !m.costPerSqM || m.costPerSqM.min <= maxCost);
  }

  if (criteria.desiredConductivity) {
    filtered = [...filtered].sort((a, b) => {
      const diffA = Math.abs(a.conductivity - criteria.desiredConductivity!);
      const diffB = Math.abs(b.conductivity - criteria.desiredConductivity!);
      return diffA - diffB;
    });
  } else {
    filtered = sortMaterials(filtered, 'conductivity', 'asc');
  }

  return filtered.slice(0, limit);
}

export function validateMaterial(material: Partial<Material>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!material.name || material.name.trim().length === 0) {
    errors.push('Material name is required');
  }

  if (material.conductivity !== undefined) {
    if (material.conductivity < 0.01 || material.conductivity > 250) {
      errors.push('Conductivity must be between 0.01 and 250 W/mK');
    }
  } else {
    errors.push('Conductivity is required');
  }

  if (material.vaporResistance !== undefined) {
    if (material.vaporResistance < 1 || material.vaporResistance > 100000) {
      errors.push('Vapor resistance must be between 1 and 100000');
    }
  } else {
    errors.push('Vapor resistance is required');
  }

  if (material.costPerSqM) {
    if (material.costPerSqM.min !== undefined && material.costPerSqM.min < 0) {
      errors.push('Minimum cost cannot be negative');
    }
    if (material.costPerSqM.max !== undefined && material.costPerSqM.max < 0) {
      errors.push('Maximum cost cannot be negative');
    }
    if (material.costPerSqM.min !== undefined && material.costPerSqM.max !== undefined) {
      if (material.costPerSqM.min > material.costPerSqM.max) {
        errors.push('Minimum cost cannot be greater than maximum cost');
      }
    }
  }

  if (material.thickness !== undefined && material.thickness <= 0) {
    errors.push('Thickness must be greater than 0');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function mergeMaterials(
  existing: Material[],
  incoming: Material[],
  mergeStrategy: 'merge' | 'replace' = 'merge'
): Material[] {
  if (mergeStrategy === 'replace') {
    return incoming;
  }

  const existingMap = new Map(existing.map(m => [m.id, m]));
  const result = [...existing];

  for (const incomingMaterial of incoming) {
    if (existingMap.has(incomingMaterial.id)) {
      const index = result.findIndex(m => m.id === incomingMaterial.id);
      if (index !== -1) {
        result[index] = { ...result[index], ...incomingMaterial };
      }
    } else {
      result.push(incomingMaterial);
    }
  }

  return result;
}
