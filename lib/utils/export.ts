/**
 * Export Utilities
 *
 * Multi-format export functionality for wall assembly data
 * Supports JSON, CSV, PDF, and Excel formats
 */

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { WallComponent, StudWallConfig, ThermalPerformance } from '../types/domain';
import { generatePDFReport, downloadPDFReport, ReportData, ReportConfig } from './reporting';

/**
 * Export format types
 */
export type ExportFormat = 'json' | 'csv' | 'excel' | 'pdf';

/**
 * Export options configuration
 */
export interface ExportOptions {
  /** Export format */
  format: ExportFormat;
  /** Output filename (without extension) */
  filename?: string;
  /** Whether to include calculations */
  includeCalculations?: boolean;
  /** Whether to include metadata */
  includeMetadata?: boolean;
  /** Report configuration (for PDF exports) */
  reportConfig?: ReportConfig;
}

/**
 * Complete export data structure
 */
export interface ExportData {
  /** Wall assembly components */
  components: WallComponent[];
  /** Stud wall configuration */
  studWallConfig?: StudWallConfig;
  /** Thermal performance metrics */
  performance: ThermalPerformance;
  /** Export metadata */
  metadata: {
    /** Export timestamp */
    exportedAt: string;
    /** Export format */
    format: string;
    /** Export version */
    version: string;
  };
  /** Environmental conditions */
  environmental?: {
    insideTemp?: number;
    outsideTemp?: number;
    dewPoint?: number;
  };
  /** Additional custom data */
  custom?: Record<string, any>;
}

/**
 * Export wall assembly data to specified format
 *
 * @param data - Data to export
 * @param options - Export configuration options
 */
export function exportData(data: ExportData, options: ExportOptions): void {
  const {
    format,
    filename = 'wall-assembly-export',
    reportConfig = {}
  } = options;

  const safeFilename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  switch (format) {
    case 'json':
      exportAsJSON(data, safeFilename);
      break;
    case 'csv':
      exportAsCSV(data, safeFilename);
      break;
    case 'excel':
      exportAsExcel(data, safeFilename);
      break;
    case 'pdf':
      exportAsPDF(data, safeFilename, reportConfig);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Export data as JSON
 */
function exportAsJSON(data: ExportData, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  saveAs(blob, `${filename}.json`);
}

/**
 * Export data as CSV (components only)
 */
function exportAsCSV(data: ExportData, filename: string): void {
  const headers = ['Material', 'Thickness (mm)', 'Conductivity (W/mK)', 'R-Value (m²K/W)', 'Has Studs', 'Insulation'];

  const rows = data.components.map((comp, index) => {
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

  const csvContent = [
    headers.join(','),
    ...rows
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
}

/**
 * Export data as Excel workbook
 */
function exportAsExcel(data: ExportData, filename: string): void {
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
    const environmentalData = [
      { Parameter: 'Inside Temperature', Value: data.environmental.insideTemp, Unit: '°C' },
      { Parameter: 'Outside Temperature', Value: data.environmental.outsideTemp, Unit: '°C' },
      { Parameter: 'Dew Point', Value: data.environmental.dewPoint, Unit: '°C' },
      { Parameter: 'Temperature Difference', Value: (data.environmental.insideTemp ?? 0) - (data.environmental.outsideTemp ?? 0), Unit: '°C' }
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
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
}

/**
 * Export data as PDF report
 */
function exportAsPDF(data: ExportData, filename: string, reportConfig: ReportConfig): void {
  const reportData: ReportData = {
    components: data.components,
    studWallConfig: data.studWallConfig,
    performance: data.performance,
    insideTemp: data.environmental?.insideTemp || 20,
    outsideTemp: data.environmental?.outsideTemp || 5,
    dewPoint: data.environmental?.dewPoint || 10,
    generatedAt: new Date(data.metadata.exportedAt)
  };

  downloadPDFReport(reportData, reportConfig, filename);
}

/**
 * Import wall assembly data from JSON file
 *
 * @param file - JSON file to import
 * @returns Parsed export data
 */
export async function importFromJSON(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        resolve(data as ExportData);
      } catch (error) {
        reject(new Error('Failed to parse JSON file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Create export data from wall assembly
 *
 * @param components - Wall components
 * @param studWallConfig - Stud wall configuration
 * @param performance - Thermal performance metrics
 * @param environmental - Environmental conditions
 * @param custom - Additional custom data
 * @returns Complete export data structure
 */
export function createExportData(
  components: WallComponent[],
  studWallConfig: StudWallConfig | undefined,
  performance: ThermalPerformance,
  environmental?: { insideTemp: number; outsideTemp: number; dewPoint: number },
  custom?: Record<string, any>
): ExportData {
  return {
    components,
    studWallConfig,
    performance,
    metadata: {
      exportedAt: new Date().toISOString(),
      format: 'wall-assembly',
      version: '1.0.0'
    },
    environmental,
    custom
  };
}

/**
 * Validate export data structure
 *
 * @param data - Data to validate
 * @returns Whether data is valid
 */
export function validateExportData(data: any): data is ExportData {
  return (
    data &&
    Array.isArray(data.components) &&
    data.metadata &&
    typeof data.metadata.exportedAt === 'string' &&
    data.performance &&
    typeof data.performance.totalRValue === 'number' &&
    typeof data.performance.uValue === 'number'
  );
}

/**
 * Get file extension for export format
 *
 * @param format - Export format
 * @returns File extension (with dot)
 */
export function getFileExtension(format: ExportFormat): string {
  const extensions: Record<ExportFormat, string> = {
    json: '.json',
    csv: '.csv',
    excel: '.xlsx',
    pdf: '.pdf'
  };
  return extensions[format] || '';
}

/**
 * Get MIME type for export format
 *
 * @param format - Export format
 * @returns MIME type string
 */
export function getMimeType(format: ExportFormat): string {
  const mimeTypes: Record<ExportFormat, string> = {
    json: 'application/json',
    csv: 'text/csv',
    excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf'
  };
  return mimeTypes[format] || 'application/octet-stream';
}
