import { NextRequest, NextResponse } from 'next/server';
import { ExtendedMaterial, defaultMaterials } from '@/lib/constants/defaultMaterials';

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';
    const ids = searchParams.get('ids');

    const materials = await loadMaterials();

    let exportMaterials = materials;
    if (ids) {
      const idList = ids.split(',').map(id => id.trim());
      exportMaterials = materials.filter(m => idList.includes(m.id));
    }

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      materialCount: exportMaterials.length,
      materials: exportMaterials,
    };

    if (format === 'json') {
      return NextResponse.json(exportData, {
        headers: {
          'Content-Disposition': `attachment; filename="materials-${Date.now()}.json"`,
          'Content-Type': 'application/json',
        },
      });
    }

    return NextResponse.json(
      { error: 'Unsupported format. Use "json"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error exporting materials:', error);
    return NextResponse.json(
      { error: 'Failed to export materials' },
      { status: 500 }
    );
  }
}
