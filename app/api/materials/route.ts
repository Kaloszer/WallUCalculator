import { NextRequest, NextResponse } from 'next/server';
import { ExtendedMaterial, defaultMaterials } from '@/lib/constants/defaultMaterials';
import { validateMaterial } from '@/lib/calculations/materials';

export const dynamic = 'force-dynamic';

let materialsCache: ExtendedMaterial[] | null = null;

async function loadMaterials(): Promise<ExtendedMaterial[]> {
  if (materialsCache) return materialsCache;

  // Initialize from defaults on first use. For durable persistence across
  // deployments or instances, replace this with a real backing store (DB/KV).
  materialsCache = [...defaultMaterials];
  return materialsCache;
}

async function saveMaterials(materials: ExtendedMaterial[]): Promise<void> {
  // Persist only in memory; for durable persistence across deployments or
  // multiple instances, replace this with a proper backing store (DB/KV).
  // Note: user-added materials will be lost on server restart or redeployment.
  materialsCache = materials;
}

function materialToResponse(material: ExtendedMaterial) {
  return {
    id: material.id,
    name: material.name,
    type: material.type,
    description: material.description,
    conductivity: material.conductivity,
    color: material.color,
    cost: material.cost,
    isInsulation: material.isInsulation,
    vaporResistance: material.vaporResistance,
    thickness: material.thickness,
    costPerSqM: material.costPerSqM,
    density: material.density,
  };
}

export async function GET(request: NextRequest) {
  try {
    const materials = await loadMaterials();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const sortBy = searchParams.get('sortBy') as 'name' | 'conductivity' | 'cost' || 'name';
    const order = searchParams.get('order') as 'asc' | 'desc' || 'asc';
    const type = searchParams.get('type');

    let filtered = materials;

    if (query) {
      const Fuse = (await import('fuse.js')).default;
      const fuse = new Fuse(materials, {
        keys: ['name', 'description', 'type'],
        threshold: 0.3,
      });
      const results = fuse.search(query);
      filtered = results.map(r => r.item);
    }

    if (type) {
      filtered = filtered.filter(m => m.type === type);
    }

    const sorted = [...filtered].sort((a, b) => {
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

    return NextResponse.json(sorted.map(materialToResponse));
  } catch (error) {
    console.error('Error loading materials:', error);
    return NextResponse.json(
      { error: 'Failed to load materials' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { validateOnly } = body;

    const validation = validateMaterial(body);

    if (validateOnly) {
      return NextResponse.json(validation);
    }

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const materials = await loadMaterials();
    const newMaterial: ExtendedMaterial = {
      ...body,
      id: body.id || `custom-${Date.now()}`,
      color: body.color || '#808080',
    };

    materials.push(newMaterial);
    await saveMaterials(materials);

    return NextResponse.json(materialToResponse(newMaterial), { status: 201 });
  } catch (error) {
    console.error('Error creating material:', error);
    return NextResponse.json(
      { error: 'Failed to create material' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Material ID is required' },
        { status: 400 }
      );
    }

    const validation = validateMaterial(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const materials = await loadMaterials();
    const index = materials.findIndex(m => m.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    materials[index] = { ...materials[index], ...body };
    await saveMaterials(materials);

    return NextResponse.json(materialToResponse(materials[index]));
  } catch (error) {
    console.error('Error updating material:', error);
    return NextResponse.json(
      { error: 'Failed to update material' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Material ID is required' },
        { status: 400 }
      );
    }

    const materials = await loadMaterials();
    const index = materials.findIndex(m => m.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    const deleted = materials.splice(index, 1)[0];
    await saveMaterials(materials);

    return NextResponse.json({ id: deleted.id, name: deleted.name });
  } catch (error) {
    console.error('Error deleting material:', error);
    return NextResponse.json(
      { error: 'Failed to delete material' },
      { status: 500 }
    );
  }
}
