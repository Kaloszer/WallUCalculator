import { NextRequest, NextResponse } from 'next/server';
import { ExampleWall, WallComponent, StudWallType } from '@/lib/types/domain';
import { WallAssembly } from '@/lib/calculations/comparison';

export const dynamic = 'force-dynamic';

// Type alias for compatibility
type WallAssemblyType = ExampleWall & { id: string; description?: string; thumbnail?: string };

// Input type for component from request body
interface ComponentInput {
  material: string;
  thickness: number;
  conductivity: number;
  isInsulation?: boolean;
  hasStuds?: boolean;
  studType?: string;
  spacing?: number;
  width?: number;
}

/**
 * GET /api/assemblies
 *
 * Retrieve all saved wall assemblies
 */
export async function GET() {
  try {
    // In a real implementation, this would fetch from a database
    // For now, return mock data
    const assemblies: WallAssemblyType[] = [
      {
        id: '1',
        name: 'Standard Wall',
        components: [
          {
            material: 'Gypsum Board',
            thickness: 13,
            conductivity: 0.16,
            isInsulation: false
          },
          {
            material: 'Mineral Wool',
            thickness: 100,
            conductivity: 0.036,
            isInsulation: true,
            hasStuds: true
          },
          {
            material: 'OSB',
            thickness: 11,
            conductivity: 0.13,
            isInsulation: false
          }
        ],
        studWallType: 'standard',
        description: 'Standard residential wall with mineral wool insulation'
      },
      {
        id: '2',
        name: 'High-Performance Wall',
        components: [
          {
            material: 'Gypsum Board',
            thickness: 13,
            conductivity: 0.16,
            isInsulation: false
          },
          {
            material: 'Mineral Wool',
            thickness: 150,
            conductivity: 0.032,
            isInsulation: true,
            hasStuds: true
          },
          {
            material: 'OSB',
            thickness: 11,
            conductivity: 0.13,
            isInsulation: false
          },
          {
            material: 'Rigid Foam',
            thickness: 50,
            conductivity: 0.032,
            isInsulation: true
          }
        ],
        studWallType: 'standard',
        description: 'Enhanced wall with additional rigid foam insulation'
      }
    ];

    return NextResponse.json({ assemblies });
  } catch (error) {
    console.error('Error fetching assemblies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assemblies' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/assemblies
 *
 * Save a new wall assembly
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, components, studWallType, description, thumbnail } = body;

    // Validate required fields
    if (!name || !components || !Array.isArray(components)) {
      return NextResponse.json(
        { error: 'Name and components are required' },
        { status: 400 }
      );
    }

    if (components.length === 0) {
      return NextResponse.json(
        { error: 'At least one component is required' },
        { status: 400 }
      );
    }

    // Validate components
    for (const component of components) {
      if (!component.material || !component.thickness || !component.conductivity) {
        return NextResponse.json(
          { error: 'Each component must have material, thickness, and conductivity' },
          { status: 400 }
        );
      }
    }

    // Create new assembly
    const newAssembly: WallAssemblyType = {
      id: Date.now().toString(),
      name,
      components: components.map((comp: ComponentInput) => ({
        material: comp.material,
        thickness: comp.thickness,
        conductivity: comp.conductivity,
        isInsulation: comp.isInsulation ?? false,
        hasStuds: comp.hasStuds
      })),
      studWallType: studWallType || 'none',
      description,
      thumbnail
    };

    // In a real implementation, save to database
    console.log('Saving assembly:', newAssembly);

    return NextResponse.json(
      { assembly: newAssembly, message: 'Assembly saved successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving assembly:', error);
    return NextResponse.json(
      { error: 'Failed to save assembly' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/assemblies
 *
 * Update an existing wall assembly
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, components, studWallType, description, thumbnail } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Assembly ID is required' },
        { status: 400 }
      );
    }

    // Validate components if provided
    if (components && Array.isArray(components)) {
      if (components.length === 0) {
        return NextResponse.json(
          { error: 'At least one component is required' },
          { status: 400 }
        );
      }

      for (const component of components) {
        if (!component.material || !component.thickness || !component.conductivity) {
          return NextResponse.json(
            { error: 'Each component must have material, thickness, and conductivity' },
            { status: 400 }
          );
        }
      }
    }

    // In a real implementation, update in database
    console.log('Updating assembly:', id, body);

    return NextResponse.json({ message: 'Assembly updated successfully' });
  } catch (error) {
    console.error('Error updating assembly:', error);
    return NextResponse.json(
      { error: 'Failed to update assembly' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/assemblies
 *
 * Delete a wall assembly
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Assembly ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation, delete from database
    console.log('Deleting assembly:', id);

    return NextResponse.json({ message: 'Assembly deleted successfully' });
  } catch (error) {
    console.error('Error deleting assembly:', error);
    return NextResponse.json(
      { error: 'Failed to delete assembly' },
      { status: 500 }
    );
  }
}
