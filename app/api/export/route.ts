/**
 * Export API Route
 *
 * Handles multi-format export of wall assembly data
 * Supports JSON, CSV, Excel, and PDF formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { WallComponent, StudWallConfig, ThermalPerformance } from '@/lib/types/domain';
import { ExportData, ExportFormat, createExportData, validateExportData } from '@/lib/utils/export';

export const dynamic = 'force-dynamic';

/**
 * POST /api/export
 * Export wall assembly data in specified format
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const { data, format } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'Missing required field: data' },
        { status: 400 }
      );
    }

    if (!format || !['json', 'csv', 'excel', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be one of: json, csv, excel, pdf' },
        { status: 400 }
      );
    }

    // Validate export data
    if (!validateExportData(data)) {
      return NextResponse.json(
        { error: 'Invalid export data structure' },
        { status: 400 }
      );
    }

    // Create export data
    const exportData: ExportData = data;

    // Generate file based on format
    let fileContent: string | Buffer;
    let mimeType: string;
    let filename: string;

    switch (format) {
      case 'json':
        fileContent = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
        filename = 'wall-assembly-export.json';
        break;

      case 'csv':
        fileContent = generateCSV(exportData);
        mimeType = 'text/csv';
        filename = 'wall-assembly-export.csv';
        break;

      case 'excel':
        fileContent = await generateExcel(exportData);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = 'wall-assembly-export.xlsx';
        break;

      case 'pdf':
        return NextResponse.json(
          { error: 'PDF export requires client-side generation. Use the /pdf endpoint.' },
          { status: 400 }
        );

      default:
        return NextResponse.json(
          { error: 'Unsupported format' },
          { status: 400 }
        );
    }

    // Return file as response (Buffer → Uint8Array for a valid BodyInit)
    return new NextResponse(Buffer.isBuffer(fileContent) ? new Uint8Array(fileContent) : fileContent, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': (Buffer.isBuffer(fileContent) ? fileContent.length : Buffer.byteLength(fileContent)).toString()
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Generate CSV from export data
 */
function generateCSV(data: ExportData): string {
  const headers = ['Material', 'Thickness (mm)', 'Conductivity (W/mK)', 'R-Value (m²K/W)', 'Has Studs', 'Insulation'];

  const rows = data.components.map((comp) => {
    const rValue = comp.conductivity > 0 ? (comp.thickness / 1000) / comp.conductivity : 0;
    return [
      comp.material,
      comp.thickness.toFixed(1),
      comp.conductivity.toFixed(3),
      rValue.toFixed(3),
      comp.hasStuds ? 'Yes' : 'No',
      comp.isInsulation ? 'Yes' : 'No'
    ].join(',');
  });

  return [
    headers.join(','),
    ...rows
  ].join('\n');
}

/**
 * Generate Excel file from export data
 */
async function generateExcel(data: ExportData): Promise<Buffer> {
  // Dynamic import to avoid server-side issues
  const XLSX = await import('xlsx');

  const workbook = XLSX.utils.book_new();

  // Components sheet
  const componentsData = data.components.map((comp, index) => ({
    '#': index + 1,
    'Material': comp.material,
    'Thickness (mm)': comp.thickness,
    'Conductivity (W/mK)': comp.conductivity,
    'R-Value (m²K/W)': comp.conductivity > 0 ? (comp.thickness / 1000) / comp.conductivity : 0,
    'Has Studs': comp.hasStuds ? 'Yes' : 'No',
    'Insulation': comp.isInsulation ? 'Yes' : 'No'
  }));

  const componentsSheet = XLSX.utils.json_to_sheet(componentsData);
  XLSX.utils.book_append_sheet(workbook, componentsSheet, 'Components');

  // Calculations sheet
  const calculationsData = [
    { Metric: 'Total R-Value', Value: data.performance.totalRValue, Unit: 'm²K/W' },
    { Metric: 'U-Value', Value: data.performance.uValue, Unit: 'W/m²K' },
    { Metric: 'Total Cost', Value: data.performance.totalCost, Unit: '$/m²' },
    { Metric: 'Cost Effectiveness', Value: data.performance.costEffectiveness, Unit: 'R-value per $100' }
  ];

  const calculationsSheet = XLSX.utils.json_to_sheet(calculationsData);
  XLSX.utils.book_append_sheet(workbook, calculationsSheet, 'Calculations');

  // Environmental sheet (if available)
  if (data.environmental) {
    const insideTemp = data.environmental.insideTemp ?? 0;
    const outsideTemp = data.environmental.outsideTemp ?? 0;
    const environmentalData = [
      { Parameter: 'Inside Temperature', Value: insideTemp, Unit: '°C' },
      { Parameter: 'Outside Temperature', Value: outsideTemp, Unit: '°C' },
      { Parameter: 'Dew Point', Value: data.environmental.dewPoint, Unit: '°C' },
      { Parameter: 'Temperature Difference', Value: insideTemp - outsideTemp, Unit: '°C' }
    ];

    const environmentalSheet = XLSX.utils.json_to_sheet(environmentalData);
    XLSX.utils.book_append_sheet(workbook, environmentalSheet, 'Environmental');
  }

  // Stud config sheet (if available)
  if (data.studWallConfig && data.studWallConfig.type !== 'none') {
    const config = data.studWallConfig;
    const studData = [
      { Parameter: 'Type', Value: config.type },
      { Parameter: 'Stud Width', Value: config.studWidth, Unit: 'mm' },
      { Parameter: 'Stud Depth', Value: config.studDepth, Unit: 'mm' },
      { Parameter: 'Stud Spacing', Value: config.studSpacing, Unit: 'mm' },
      { Parameter: 'Stud Conductivity', Value: config.studConductivity, Unit: 'W/mK' },
      { Parameter: 'Stud Area', Value: config.studArea * 100, Unit: '%' }
    ];

    const studSheet = XLSX.utils.json_to_sheet(studData);
    XLSX.utils.book_append_sheet(workbook, studSheet, 'Stud Configuration');
  }

  // Write workbook
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
}

/**
 * GET /api/export
 * Get available export formats
 */
export async function GET() {
  return NextResponse.json({
    formats: ['json', 'csv', 'excel'],
    description: 'Export wall assembly data in various formats',
    endpoints: {
      pdf: '/api/export/pdf - Generate PDF reports'
    }
  });
}
