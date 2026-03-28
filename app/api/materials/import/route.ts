import { NextRequest, NextResponse } from 'next/server';
import { ExtendedMaterial, defaultMaterials } from '@/lib/constants/defaultMaterials';
import { validateMaterial } from '@/lib/calculations/materials';

export const dynamic = 'force-dynamic';

const MATERIALS_FILE = '.materials-db.json';

async function loadMaterials(): Promise<ExtendedMaterial[]> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(process.cwd(), MATERIALS_FILE);

    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    console.log('No materials database found, using defaults');
    return [...defaultMaterials];
  }
}

async function saveMaterials(materials: ExtendedMaterial[]): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');
  const filePath = path.join(process.cwd(), MATERIALS_FILE);

  await fs.writeFile(filePath, JSON.stringify(materials, null, 2), 'utf-8');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { materials, mergeStrategy = 'merge' } = body;

    if (!Array.isArray(materials)) {
      return NextResponse.json(
        { error: 'Materials must be an array' },
        { status: 400 }
      );
    }

    const errors: Array<{ index: number; material: any; errors: string[] }> = [];
    const validMaterials: ExtendedMaterial[] = [];

    materials.forEach((material: Partial<ExtendedMaterial>, index: number) => {
      const validation = validateMaterial(material);
      if (!validation.valid) {
        const materialName = (material as { name?: string }).name ??
                            (material as { id?: string }).id ??
                            `Material ${index}`;
        errors.push({
          index,
          material: materialName,
          errors: validation.errors,
        });
      } else {
        validMaterials.push({
          ...material,
          id: (material as { id?: string }).id || `imported-${Date.now()}-${index}`,
          color: (material as { color?: string }).color || '#808080',
        } as ExtendedMaterial);
      }
    });

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          invalidMaterials: errors,
          validCount: validMaterials.length,
        },
        { status: 400 }
      );
    }

    const existing = await loadMaterials();
    let result: ExtendedMaterial[];

    if (mergeStrategy === 'replace') {
      result = validMaterials;
    } else {
      const existingMap = new Map(existing.map(m => [m.id, m]));
      result = [...existing];

      for (const incoming of validMaterials) {
        if (existingMap.has(incoming.id)) {
          const index = result.findIndex(m => m.id === incoming.id);
          if (index !== -1) {
            result[index] = { ...result[index], ...incoming };
          }
        } else {
          result.push(incoming);
        }
      }
    }

    await saveMaterials(result);

    return NextResponse.json({
      message: 'Materials imported successfully',
      importCount: validMaterials.length,
      totalMaterials: result.length,
      mergeStrategy,
    });
  } catch (error) {
    console.error('Error importing materials:', error);
    return NextResponse.json(
      { error: 'Failed to import materials' },
      { status: 500 }
    );
  }
}
