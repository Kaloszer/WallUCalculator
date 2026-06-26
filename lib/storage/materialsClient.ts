/**
 * Client-side materials store
 *
 * Replaces the former /api/materials* routes. Persists the material database in
 * localStorage, seeded from the bundled defaults on first use. All operations are
 * synchronous and browser-only.
 */

import { ExtendedMaterial, defaultMaterials } from '@/lib/constants/defaultMaterials';
import { validateMaterial } from '@/lib/calculations/materials';

const STORAGE_KEY = 'wallu_materials_db';

/** Load all materials, seeding from defaults on first use. */
export function loadMaterials(): ExtendedMaterial[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMaterials));
      return [...defaultMaterials];
    }
    return JSON.parse(stored) as ExtendedMaterial[];
  } catch {
    return [...defaultMaterials];
  }
}

function persist(materials: ExtendedMaterial[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
}

/** Create or update a material. Throws on validation failure. */
export function saveMaterial(input: Partial<ExtendedMaterial>, isEdit: boolean): ExtendedMaterial {
  const validation = validateMaterial(input);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  const materials = loadMaterials();

  if (isEdit) {
    const index = materials.findIndex((m) => m.id === input.id);
    if (index === -1) throw new Error('Material not found');
    materials[index] = { ...materials[index], ...input } as ExtendedMaterial;
    persist(materials);
    return materials[index];
  }

  const newMaterial = {
    ...input,
    id: input.id || `custom-${Date.now()}`,
    color: input.color || '#808080',
  } as ExtendedMaterial;

  materials.push(newMaterial);
  persist(materials);
  return newMaterial;
}

/** Delete a material by id. Returns false if not found. */
export function deleteMaterialById(id: string): boolean {
  const materials = loadMaterials();
  const filtered = materials.filter((m) => m.id !== id);
  if (filtered.length === materials.length) return false;
  persist(filtered);
  return true;
}

/** Import materials with a merge or replace strategy. Throws on validation failure. */
export function importMaterials(
  incoming: Partial<ExtendedMaterial>[],
  mergeStrategy: 'merge' | 'replace'
): { importCount: number; total: number } {
  const valid: ExtendedMaterial[] = incoming.map((material, index) => {
    const validation = validateMaterial(material);
    if (!validation.valid) {
      throw new Error(`${material.name ?? `Material ${index}`}: ${validation.errors.join(', ')}`);
    }
    return {
      ...material,
      id: material.id || `imported-${Date.now()}-${index}`,
      color: material.color || '#808080',
    } as ExtendedMaterial;
  });

  let result: ExtendedMaterial[];
  if (mergeStrategy === 'replace') {
    result = valid;
  } else {
    result = loadMaterials();
    for (const incomingMaterial of valid) {
      const index = result.findIndex((m) => m.id === incomingMaterial.id);
      if (index !== -1) {
        result[index] = { ...result[index], ...incomingMaterial };
      } else {
        result.push(incomingMaterial);
      }
    }
  }

  persist(result);
  return { importCount: valid.length, total: result.length };
}

/** Build an export payload for all materials, or a selected subset by id. */
export function exportMaterials(ids?: string[]): {
  version: string;
  exportedAt: string;
  materialCount: number;
  materials: ExtendedMaterial[];
} {
  const materials = loadMaterials();
  const selected = ids && ids.length ? materials.filter((m) => ids.includes(m.id)) : materials;
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    materialCount: selected.length,
    materials: selected,
  };
}
