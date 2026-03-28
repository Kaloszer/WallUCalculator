import { NextRequest, NextResponse } from 'next/server';
import {
  compareAssemblies,
  validateAssemblies,
  calculateCostBreakdown,
  calculatePerformanceSummary,
  ComparisonWeights,
  WallAssembly
} from '@/lib/calculations/comparison';

export const dynamic = 'force-dynamic';

/**
 * POST /api/assemblies/compare
 *
 * Compare multiple wall assemblies side-by-side
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assemblies, weights } = body;

    // Validate request
    if (!assemblies || !Array.isArray(assemblies)) {
      return NextResponse.json(
        { error: 'Assemblies array is required' },
        { status: 400 }
      );
    }

    if (assemblies.length < 2 || assemblies.length > 4) {
      return NextResponse.json(
        { error: 'Must provide between 2 and 4 assemblies to compare' },
        { status: 400 }
      );
    }

    // Validate assemblies
    try {
      validateAssemblies(assemblies);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid assemblies' },
        { status: 400 }
      );
    }

    // Compare assemblies
    const comparisonResult = compareAssemblies(assemblies, weights);

    // Calculate additional insights
    const costBreakdown = calculateCostBreakdown(assemblies);

    const performanceSummaries = comparisonResult.assemblies.map(metrics =>
      calculatePerformanceSummary(metrics)
    );

    return NextResponse.json({
      comparison: comparisonResult,
      costBreakdown,
      performanceSummaries,
      message: 'Comparison completed successfully'
    });
  } catch (error) {
    console.error('Error comparing assemblies:', error);
    return NextResponse.json(
      {
        error: 'Failed to compare assemblies',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/assemblies/compare
 *
 * Get comparison for specific assemblies by IDs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assemblyIds = searchParams.get('ids');

    if (!assemblyIds) {
      return NextResponse.json(
        { error: 'Assembly IDs are required' },
        { status: 400 }
      );
    }

    const ids = assemblyIds.split(',').map((id: string) => id.trim());

    // In a real implementation, fetch assemblies from database
    // For now, return mock assemblies
    const mockAssemblies: WallAssembly[] = ids.map((id: string, index: number) => ({
      id,
      name: `Assembly ${id}`,
      components: [
        {
          id: 1,
          material: 'Gypsum Board',
          thickness: 13,
          conductivity: 0.16,
          isInsulation: false
        },
        {
          id: 2,
          material: 'Mineral Wool',
          thickness: 100 + (index * 50),
          conductivity: 0.036,
          isInsulation: true,
          hasStuds: true
        },
        {
          id: 3,
          material: 'OSB',
          thickness: 11,
          conductivity: 0.13,
          isInsulation: false
        }
      ],
      studWallType: 'standard',
      description: `Mock assembly ${id} for testing`
    }));

    // Compare assemblies
    const comparisonResult = compareAssemblies(mockAssemblies);

    return NextResponse.json({
      assemblies: mockAssemblies,
      comparison: comparisonResult,
      message: 'Comparison completed successfully'
    });
  } catch (error) {
    console.error('Error fetching comparison:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch comparison',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
