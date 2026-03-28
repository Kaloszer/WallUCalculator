/**
 * PDF Export API Route
 *
 * Handles PDF report generation for wall assemblies
 * Client-side generation with validation and metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReportData, ReportConfig } from '@/lib/utils/reporting';

export const dynamic = 'force-dynamic';

/**
 * POST /api/export/pdf
 * Validate and prepare PDF report data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const { data, config } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'Missing required field: data' },
        { status: 400 }
      );
    }

    // Validate report data structure
    if (!isValidReportData(data)) {
      return NextResponse.json(
        { error: 'Invalid report data structure' },
        { status: 400 }
      );
    }

    // Validate config if provided
    if (config && !isValidReportConfig(config)) {
      return NextResponse.json(
        { error: 'Invalid report configuration' },
        { status: 400 }
      );
    }

    // PDF generation requires client-side processing
    // This endpoint validates data and returns it for client-side generation
    const validatedData = {
      ...data,
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: validatedData,
      message: 'Data validated successfully. Use client-side PDF generation.',
      clientSideGeneration: true,
      recommendedLibrary: 'jspdf'
    });

  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { error: 'Failed to prepare PDF data', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/export/pdf
 * Get PDF export information and requirements
 */
export async function GET() {
  return NextResponse.json({
    description: 'PDF report generation for wall assemblies',
    clientSideGeneration: true,
    requirements: {
      libraries: ['jspdf', 'jspdf-autotable', 'html2canvas'],
      installed: true
    },
    features: [
      'Cover page with project information',
      'Table of contents',
      'Wall assembly configuration',
      'Calculation results',
      'Thermal performance analysis',
      'Compliance summary',
      'Recommendations'
    ],
    options: {
      projectName: 'string - Project name for the report',
      companyName: 'string - Company name for branding',
      logoUrl: 'string - Logo URL for header',
      author: 'string - Report author/preparer',
      dateFormat: 'string - Date format string (yyyy-MM-dd, MM/dd/yyyy, dd/MM/yyyy)',
      includeRecommendations: 'boolean - Whether to include recommendations',
      includeCharts: 'boolean - Whether to include charts',
      includeCompliance: 'boolean - Whether to include compliance summary'
    },
    example: {
      data: {
        components: [
          {
            id: 1,
            material: 'Gypsum Board',
            thickness: 12.7,
            conductivity: 0.16,
            isInsulation: false,
            hasStuds: false
          }
        ],
        performance: {
          totalRValue: 2.5,
          uValue: 0.4,
          totalCost: 100,
          costEffectiveness: 0.25
        },
        insideTemp: 20,
        outsideTemp: 5,
        dewPoint: 10,
        generatedAt: new Date().toISOString()
      },
      config: {
        projectName: 'Example Project',
        companyName: 'Construction Co.',
        includeRecommendations: true,
        includeCompliance: true
      }
    }
  });
}

/**
 * Validate report data structure
 */
function isValidReportData(data: any): data is ReportData {
  return (
    data &&
    Array.isArray(data.components) &&
    data.performance &&
    typeof data.performance.totalRValue === 'number' &&
    typeof data.performance.uValue === 'number' &&
    typeof data.insideTemp === 'number' &&
    typeof data.outsideTemp === 'number' &&
    typeof data.dewPoint === 'number'
  );
}

/**
 * Validate report configuration
 */
function isValidReportConfig(config: any): config is ReportConfig {
  if (!config || typeof config !== 'object') {
    return true; // Config is optional
  }

  // Check optional fields if present
  if (config.projectName !== undefined && typeof config.projectName !== 'string') {
    return false;
  }

  if (config.companyName !== undefined && typeof config.companyName !== 'string') {
    return false;
  }

  if (config.logoUrl !== undefined && typeof config.logoUrl !== 'string') {
    return false;
  }

  if (config.author !== undefined && typeof config.author !== 'string') {
    return false;
  }

  if (config.dateFormat !== undefined && typeof config.dateFormat !== 'string') {
    return false;
  }

  if (config.includeRecommendations !== undefined && typeof config.includeRecommendations !== 'boolean') {
    return false;
  }

  if (config.includeCharts !== undefined && typeof config.includeCharts !== 'boolean') {
    return false;
  }

  if (config.includeCompliance !== undefined && typeof config.includeCompliance !== 'boolean') {
    return false;
  }

  return true;
}
