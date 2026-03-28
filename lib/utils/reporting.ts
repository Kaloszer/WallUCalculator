/**
 * PDF Report Generation Utilities
 *
 * Client-side PDF report generation using jsPDF with auto-table
 * for wall assembly analysis and compliance documentation
 */

import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { WallComponent, StudWallConfig, ThermalPerformance } from '../types/domain';
import { calculateTotalRValue, calculateUValue } from '../calculations/rValue';
import { calculateComponentRValue } from '../calculations/rValue';

/**
 * Report configuration options
 */
export interface ReportConfig {
  /** Project name for the report */
  projectName?: string;
  /** Company name for branding */
  companyName?: string;
  /** Logo URL for header */
  logoUrl?: string;
  /** Report author/preparer */
  author?: string;
  /** Date format string */
  dateFormat?: string;
  /** Whether to include recommendations */
  includeRecommendations?: boolean;
  /** Whether to include charts */
  includeCharts?: boolean;
  /** Whether to include compliance summary */
  includeCompliance?: boolean;
}

/**
 * Complete report data structure
 */
export interface ReportData {
  /** Wall components */
  components: WallComponent[];
  /** Stud wall configuration */
  studWallConfig?: StudWallConfig;
  /** Thermal performance metrics */
  performance: ThermalPerformance;
  /** Environmental conditions */
  insideTemp: number;
  outsideTemp: number;
  /** Dew point data */
  dewPoint: number;
  /** Condensation risk assessment */
  condensationRisk?: {
    hasRisk: boolean;
    riskLayers: number[];
  };
  /** Date report was generated */
  generatedAt: Date;
}

/**
 * Generate a complete PDF report
 *
 * @param data - Complete report data
 * @param config - Report configuration options
 * @returns jsPDF document instance
 */
export function generatePDFReport(
  data: ReportData,
  config: ReportConfig = {}
): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  let yPosition = margin;

  // Add cover page
  addCoverPage(doc, data, config, pageWidth, pageHeight);
  doc.addPage();

  // Add table of contents
  yPosition = addTableOfContents(doc, pageWidth, margin);
  doc.addPage();

  // Add wall assembly details
  yPosition = addWallAssemblySection(doc, data, config, pageWidth, margin);
  doc.addPage();

  // Add calculations results
  yPosition = addCalculationsSection(doc, data, config, pageWidth, margin);
  doc.addPage();

  // Add thermal performance analysis
  yPosition = addThermalPerformanceSection(doc, data, config, pageWidth, margin);
  doc.addPage();

  // Add compliance summary if requested
  if (config.includeCompliance) {
    yPosition = addComplianceSection(doc, data, config, pageWidth, margin);
    doc.addPage();
  }

  // Add recommendations if requested
  if (config.includeRecommendations) {
    yPosition = addRecommendationsSection(doc, data, config, pageWidth, margin);
  }

  // Add page numbers
  addPageNumbers(doc);

  return doc;
}

/**
 * Add cover page to document
 */
function addCoverPage(
  doc: jsPDF,
  data: ReportData,
  config: ReportConfig,
  pageWidth: number,
  pageHeight: number
): void {
  const margin = 15;
  // Background color
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Logo if provided
  if (config.logoUrl) {
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(config.companyName || '', margin, 15);
  }

  // Title
  doc.setFontSize(24);
  doc.setTextColor(0, 0, 0);
  doc.text('Wall Assembly Analysis Report', pageWidth / 2, 80, { align: 'center' });

  // Subtitle
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(config.projectName || 'Untitled Project', pageWidth / 2, 95, { align: 'center' });

  // Key metrics
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  const startY = 130;
  const lineHeight = 12;

  doc.text(`U-Value: ${data.performance.uValue.toFixed(3)} W/m²K`, pageWidth / 2, startY, { align: 'center' });
  doc.text(`Total R-Value: ${data.performance.totalRValue.toFixed(3)} m²K/W`, pageWidth / 2, startY + lineHeight, { align: 'center' });
  doc.text(`Total Thickness: ${data.components.reduce((sum, c) => sum + c.thickness, 0).toFixed(0)} mm`, pageWidth / 2, startY + lineHeight * 2, { align: 'center' });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  const generatedDate = formatDate(data.generatedAt, config.dateFormat);
  doc.text(`Generated: ${generatedDate}`, pageWidth / 2, pageHeight - 30, { align: 'center' });
  if (config.author) {
    doc.text(`Prepared by: ${config.author}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
  }
}

/**
 * Add table of contents
 */
function addTableOfContents(
  doc: jsPDF,
  pageWidth: number,
  margin: number
): number {
  let y = margin;

  // Section title
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('Table of Contents', margin, y);
  y += 15;

  // TOC entries
  doc.setFontSize(11);
  const entries = [
    'Wall Assembly Configuration',
    'Calculation Results',
    'Thermal Performance Analysis',
    'Compliance Summary',
    'Recommendations',
    'Appendix: Material Properties'
  ];

  entries.forEach((entry, index) => {
    doc.setTextColor(50, 50, 50);
    doc.text(`${index + 1}. ${entry}`, margin + 5, y);
    y += 10;
  });

  return y;
}

/**
 * Add wall assembly details section
 */
function addWallAssemblySection(
  doc: jsPDF,
  data: ReportData,
  config: ReportConfig,
  pageWidth: number,
  margin: number
): number {
  // Section header
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('Wall Assembly Configuration', margin, margin);

  // Components table
  autoTable(doc, {
    startY: margin + 15,
    head: [['#', 'Material', 'Thickness (mm)', 'λ-Value (W/mK)', 'R-Value (m²K/W)', 'Studs']],
    body: data.components.map((comp, index) => [
      index + 1,
      comp.material,
      comp.thickness.toFixed(1),
      comp.conductivity.toFixed(3),
      calculateComponentRValue(comp, data.studWallConfig).toFixed(3),
      comp.hasStuds ? 'Yes' : 'No'
    ]),
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] }
  });

  // Stud wall configuration
  if (data.studWallConfig && data.studWallConfig.type !== 'none') {
    const y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Stud Wall Configuration:', margin, y);

    const config = data.studWallConfig;
    const details = [
      `Type: ${config.type}`,
      `Stud Width: ${config.studWidth} mm`,
      `Stud Depth: ${config.studDepth} mm`,
      `Stud Spacing: ${config.studSpacing} mm`,
      `Stud Conductivity: ${config.studConductivity} W/mK`
    ];

    doc.setFontSize(10);
    details.forEach((detail, index) => {
      doc.text(detail, margin + 5, y + 10 + (index * 7));
    });
  }

  return (doc as any).lastAutoTable.finalY + 50;
}

/**
 * Add calculations results section
 */
function addCalculationsSection(
  doc: jsPDF,
  data: ReportData,
  config: ReportConfig,
  pageWidth: number,
  margin: number
): number {
  let y = margin;

  // Section header
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('Calculation Results', margin, y);
  y += 15;

  // Environmental conditions
  doc.setFontSize(12);
  doc.text('Environmental Conditions:', margin, y);
  y += 10;

  doc.setFontSize(10);
  const conditions = [
    `Inside Temperature: ${data.insideTemp}°C`,
    `Outside Temperature: ${data.outsideTemp}°C`,
    `Temperature Difference: ${(data.insideTemp - data.outsideTemp).toFixed(1)}°C`,
    `Dew Point: ${data.dewPoint.toFixed(1)}°C`
  ];

  conditions.forEach(condition => {
    doc.text(condition, margin + 5, y);
    y += 7;
  });

  y += 10;

  // Thermal calculations
  doc.setFontSize(12);
  doc.text('Thermal Calculations:', margin, y);
  y += 10;

  doc.setFontSize(10);
  const calculations = [
    `Total R-Value (components): ${data.performance.totalRValue.toFixed(3)} m²K/W`,
    `Total R-Value (with air films): ${(data.performance.totalRValue + 0.17).toFixed(3)} m²K/W`,
    `U-Value: ${data.performance.uValue.toFixed(3)} W/m²K`,
    `Heat Loss Rate: ${(data.performance.uValue * (data.insideTemp - data.outsideTemp)).toFixed(2)} W/m²`
  ];

  calculations.forEach(calc => {
    doc.text(calc, margin + 5, y);
    y += 7;
  });

  return y;
}

/**
 * Add thermal performance analysis section
 */
function addThermalPerformanceSection(
  doc: jsPDF,
  data: ReportData,
  config: ReportConfig,
  pageWidth: number,
  margin: number
): number {
  let y = margin;

  // Section header
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('Thermal Performance Analysis', margin, y);
  y += 15;

  // R-value distribution table
  autoTable(doc, {
    startY: y,
    head: [['Component', 'R-Value (m²K/W)', 'Contribution (%)']],
    body: data.components.map(comp => {
      const rValue = calculateComponentRValue(comp, data.studWallConfig);
      const contribution = (rValue / data.performance.totalRValue) * 100;
      return [
        comp.material || 'Unnamed',
        rValue.toFixed(3),
        contribution.toFixed(1)
      ];
    }),
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 40 },
      2: { cellWidth: 30, halign: 'right' }
    }
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  // Cost analysis
  doc.setFontSize(12);
  doc.text('Cost Analysis:', margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.text(`Total Cost: $${data.performance.totalCost.toFixed(2)} per m²`, margin + 5, y);
  y += 7;
  doc.text(`Cost Effectiveness: ${data.performance.costEffectiveness.toFixed(3)} R-value per $100`, margin + 5, y);

  return y + 20;
}

/**
 * Add compliance summary section
 */
function addComplianceSection(
  doc: jsPDF,
  data: ReportData,
  config: ReportConfig,
  pageWidth: number,
  margin: number
): number {
  let y = margin;

  // Section header
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('Compliance Summary', margin, y);
  y += 15;

  // Compliance checks
  const complianceChecks = [
    {
      standard: 'Building Code (R-Value)',
      status: data.performance.totalRValue >= 2.5 ? 'PASS' : 'FAIL',
      details: `Required: ≥2.5 m²K/W, Actual: ${data.performance.totalRValue.toFixed(3)} m²K/W`
    },
    {
      standard: 'Building Code (U-Value)',
      status: data.performance.uValue <= 0.4 ? 'PASS' : 'FAIL',
      details: `Required: ≤0.4 W/m²K, Actual: ${data.performance.uValue.toFixed(3)} W/m²K`
    },
    {
      standard: 'Condensation Risk',
      status: !data.condensationRisk?.hasRisk ? 'PASS' : 'FAIL',
      details: data.condensationRisk?.hasRisk
        ? `Risk detected in layers: ${data.condensationRisk.riskLayers.join(', ')}`
        : 'No condensation risk detected'
    }
  ];

  complianceChecks.forEach(check => {
    // Status badge
    doc.setFillColor(check.status === 'PASS' ? 34 : 239, check.status === 'PASS' ? 197 : 68, check.status === 'PASS' ? 94 : 68);
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, y, 20, 8, 'F');
    doc.text(check.status, margin + 10, y + 6, { align: 'center' });

    // Standard name
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(check.standard, margin + 25, y + 6);

    // Details
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(check.details, margin + 25, y + 14);

    y += 25;
  });

  return y;
}

/**
 * Add recommendations section
 */
function addRecommendationsSection(
  doc: jsPDF,
  data: ReportData,
  config: ReportConfig,
  pageWidth: number,
  margin: number
): number {
  let y = margin;

  // Section header
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('Recommendations', margin, y);
  y += 15;

  // Generate recommendations
  const recommendations = generateRecommendations(data);

  recommendations.forEach((rec, index) => {
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`${index + 1}. ${rec.title}`, margin + 5, y);
    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(rec.description, pageWidth - margin * 2 - 10);
    doc.text(lines, margin + 10, y);
    y += lines.length * 5 + 8;
  });

  return y;
}

/**
 * Generate recommendations based on wall assembly analysis
 */
function generateRecommendations(data: ReportData): Array<{ title: string; description: string }> {
  const recommendations: Array<{ title: string; description: string }> = [];

  // Check R-value
  if (data.performance.totalRValue < 2.5) {
    recommendations.push({
      title: 'Increase Insulation',
      description: 'The current assembly does not meet minimum building code requirements. Consider adding additional insulation layers or upgrading to materials with higher R-value.'
    });
  }

  // Check condensation risk
  if (data.condensationRisk?.hasRisk) {
    recommendations.push({
      title: 'Address Condensation Risk',
      description: 'Condensation risk detected in the wall assembly. Consider adding a vapor barrier or improving ventilation to prevent moisture issues.'
    });
  }

  // Check cost effectiveness
  if (data.performance.costEffectiveness < 0.1) {
    recommendations.push({
      title: 'Improve Cost Efficiency',
      description: 'The current assembly has low cost-effectiveness. Consider using alternative materials that provide better R-value per dollar spent.'
    });
  }

  // Check for stud bridges
  const studLayer = data.components.find(c => c.hasStuds);
  if (studLayer && studLayer.conductivity > 0.1) {
    recommendations.push({
      title: 'Reduce Thermal Bridging',
      description: 'Consider using advanced framing techniques or thermal breaks to reduce heat loss through studs.'
    });
  }

  return recommendations;
}

/**
 * Add page numbers to document
 */
function addPageNumbers(doc: jsPDF): void {
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
}

/**
 * Format date according to specified format
 */
function formatDate(date: Date, format: string = 'yyyy-MM-dd'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  if (format === 'yyyy-MM-dd') {
    return `${year}-${month}-${day}`;
  } else if (format === 'MM/dd/yyyy') {
    return `${month}/${day}/${year}`;
  } else if (format === 'dd/MM/yyyy') {
    return `${day}/${month}/${year}`;
  }

  return `${year}-${month}-${day}`;
}

/**
 * Download PDF report
 *
 * @param data - Report data
 * @param config - Report configuration
 * @param filename - Output filename (without .pdf extension)
 */
export function downloadPDFReport(
  data: ReportData,
  config: ReportConfig = {},
  filename: string = 'wall-assembly-report'
): void {
  const doc = generatePDFReport(data, config);
  const safeFilename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`${safeFilename}.pdf`);
}
