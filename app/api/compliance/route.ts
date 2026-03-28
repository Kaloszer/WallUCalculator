/**
 * Compliance Check API Endpoint
 *
 * POST /api/compliance
 *
 * Checks wall assembly compliance against building codes
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkCompliance, checkMultipleCompliance } from '@/lib/calculations/compliance';
import { BuildingCodeStandard, ClimateZone, BuildingComponentType } from '@/lib/data/buildingCodes';
import { WallComponent, StudWallConfig } from '@/lib/types/domain';

export const dynamic = 'force-dynamic';

/**
 * Request body for compliance check
 */
interface ComplianceRequest {
  /** Wall components */
  components: WallComponent[];
  /** Stud wall configuration */
  studWallConfig?: StudWallConfig;
  /** Building code standard(s) to check against */
  codes: BuildingCodeStandard | BuildingCodeStandard[];
  /** Climate zone */
  zone: ClimateZone;
  /** Component type */
  componentType?: BuildingComponentType;
}

/**
 * POST handler for compliance check
 */
export async function POST(request: NextRequest) {
  try {
    const body: ComplianceRequest = await request.json();

    // Validate required fields
    if (!body.components || !Array.isArray(body.components)) {
      return NextResponse.json(
        { error: 'Invalid components array' },
        { status: 400 }
      );
    }

    if (!body.codes) {
      return NextResponse.json(
        { error: 'Building code(s) required' },
        { status: 400 }
      );
    }

    if (!body.zone || body.zone < 1 || body.zone > 8) {
      return NextResponse.json(
        { error: 'Valid climate zone (1-8) required' },
        { status: 400 }
      );
    }

    const {
      components,
      studWallConfig,
      codes,
      zone,
      componentType = 'opaque_walls'
    } = body;

    // Check compliance
    const codesArray = Array.isArray(codes) ? codes : [codes];
    const results = checkMultipleCompliance(
      components,
      studWallConfig,
      codesArray,
      zone,
      componentType
    );

    // Return single result or array
    const responseData = codesArray.length === 1 ? results[0] : results;

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Compliance check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET handler - returns information about available building codes
 */
export async function GET() {
  const { BUILDING_CODES, CLIMATE_ZONE_DESCRIPTIONS } = await import('@/lib/data/buildingCodes');

  return NextResponse.json({
    buildingCodes: BUILDING_CODES,
    climateZones: CLIMATE_ZONE_DESCRIPTIONS,
    componentTypes: ['opaque_walls', 'floors', 'roof', 'windows', 'doors']
  }, { status: 200 });
}
