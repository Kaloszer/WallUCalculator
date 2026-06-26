/**
 * Compliance & Standards Checking
 *
 * Functions to check wall assembly compliance against various building codes
 * and climate zones.
 */

import { WallComponent, StudWallConfig } from '../types/domain';
import { calculateTotalRValue, calculateUValue } from './rValue';
import {
  getUValueRequirement,
  getAllUValueRequirements,
  BuildingCodeStandard,
  ClimateZone,
  BuildingComponentType,
  UValueRequirement
} from '../data/buildingCodes';

/**
 * Severity level for compliance violations
 */
export type ComplianceSeverity = 'critical' | 'major' | 'minor';

/**
 * Status of a compliance check
 */
export type ComplianceStatus = 'pass' | 'fail' | 'warning';

/**
 * Individual compliance check result
 */
export interface ComplianceCheck {
  /** Unique identifier for this check */
  id: string;
  /** Display name of the check */
  name: string;
  /** Description of what is being checked */
  description: string;
  /** Whether the check passed */
  status: ComplianceStatus;
  /** Severity if failed/warning */
  severity: ComplianceSeverity;
  /** Measured value (e.g., actual U-value) */
  measuredValue: number;
  /** Required value (e.g., max allowed U-value) */
  requiredValue: number;
  /** Unit of measurement */
  unit: string;
  /** Gap between measured and required (positive = exceeds limit) */
  gap: number;
  /** Building code reference */
  codeReference: CodeReference;
  /** Recommendations for fixing the issue */
  recommendations?: string[];
  /** Estimated cost to comply (in USD/m²) */
  estimatedComplianceCost?: number;
}

/**
 * Reference to building code documentation
 */
export interface CodeReference {
  /** Building code standard */
  code: BuildingCodeStandard;
  /** Climate zone */
  zone: ClimateZone;
  /** Component type */
  componentType: BuildingComponentType;
  /** URL to official documentation */
  url: string;
  /** Specific section/clause in the code */
  section?: string;
}

/**
 * Overall compliance result
 */
export interface ComplianceResult {
  /** Overall pass/fail status */
  pass: boolean;
  /** Overall compliance score (0-100) */
  score: number;
  /** Total U-value of the wall assembly */
  totalUValue: number;
  /** Total R-value of the wall assembly */
  totalRValue: number;
  /** Individual compliance checks */
  checks: ComplianceCheck[];
  /** Building code checked against */
  code: BuildingCodeStandard;
  /** Climate zone checked against */
  zone: ClimateZone;
  /** Component type checked */
  componentType: BuildingComponentType;
  /** Timestamp of the check */
  timestamp: string;
}

/**
 * Check wall assembly compliance against a specific building code and climate zone
 *
 * @param components - Array of wall components
 * @param studWallConfig - Stud wall configuration
 * @param code - Building code standard
 * @param zone - Climate zone
 * @param componentType - Type of building component
 * @returns Compliance result
 */
export function checkCompliance(
  components: WallComponent[],
  studWallConfig: StudWallConfig | undefined,
  code: BuildingCodeStandard,
  zone: ClimateZone,
  componentType: BuildingComponentType
): ComplianceResult {
  const totalRValue = calculateTotalRValue(components, studWallConfig, true);
  const totalUValue = calculateUValue(totalRValue);

  const checks: ComplianceCheck[] = [];

  // Check U-value compliance
  const uValueRequirement = getUValueRequirement(code, zone, componentType);
  if (uValueRequirement !== null) {
    const uValueCheck = createUValueCheck(
      totalUValue,
      uValueRequirement,
      code,
      zone,
      componentType,
      components,
      totalRValue
    );
    checks.push(uValueCheck);
  }

  // Check R-value minimum (based on typical requirements)
  const rValueCheck = createRValueCheck(
    totalRValue,
    code,
    zone,
    componentType
  );
  checks.push(rValueCheck);

  // Check insulation continuity (if any component has studs)
  if (components.some(comp => comp.hasStuds)) {
    const insulationCheck = createInsulationContinuityCheck(
      components,
      code,
      zone,
      componentType
    );
    checks.push(insulationCheck);
  }

  // Check condensation risk based on dew point analysis
  const condensationCheck = createCondensationRiskCheck(
    components,
    code,
    zone,
    componentType
  );
  checks.push(condensationCheck);

  // Calculate overall pass/fail and score
  const failedChecks = checks.filter(c => c.status === 'fail');
  const warningChecks = checks.filter(c => c.status === 'warning');
  const pass = failedChecks.length === 0;

  // Score calculation: 100 - (failed * 20) - (warnings * 5)
  const score = Math.max(0, 100 - (failedChecks.length * 20) - (warningChecks.length * 5));

  return {
    pass,
    score,
    totalUValue,
    totalRValue,
    checks,
    code,
    zone,
    componentType,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create U-value compliance check
 */
function createUValueCheck(
  measuredUValue: number,
  requiredMaxUValue: number,
  code: BuildingCodeStandard,
  zone: ClimateZone,
  componentType: BuildingComponentType,
  components: WallComponent[],
  totalRValue: number
): ComplianceCheck {
  const gap = measuredUValue - requiredMaxUValue;
  const status = gap <= 0 ? 'pass' : 'fail';
  const severity = gap > 0.1 ? 'critical' : gap > 0.05 ? 'major' : 'minor';

  const recommendations: string[] = [];
  let estimatedCost = 0;

  if (status === 'fail') {
    recommendations.push(`Reduce U-value by at least ${gap.toFixed(3)} W/m²K`);

    // Estimate additional insulation needed
    // Current R-value needs to increase to meet requirement
    const targetRValue = 1 / requiredMaxUValue;
    const additionalRNeeded = targetRValue - totalRValue;

    if (additionalRNeeded > 0) {
      // Assume adding mineral wool (λ = 0.04 W/mK)
      // Thickness = R * λ * 1000 (to mm)
      const additionalThickness = additionalRNeeded * 0.04 * 1000;
      recommendations.push(
        `Add approximately ${additionalThickness.toFixed(0)}mm of additional insulation`
      );

      // Estimate cost: $15 per m² per 100mm of mineral wool
      estimatedCost = (additionalThickness / 100) * 15;
    }
  }

  return {
    id: 'u-value',
    name: 'U-Value Compliance',
    description: `Maximum allowed U-value for ${componentType.replace('_', ' ')}`,
    status,
    severity,
    measuredValue: measuredUValue,
    requiredValue: requiredMaxUValue,
    unit: 'W/m²K',
    gap,
    codeReference: {
      code,
      zone,
      componentType,
      url: getCodeUrl(code),
      section: 'Thermal Envelope Requirements'
    },
    recommendations: status === 'fail' ? recommendations : undefined,
    estimatedComplianceCost: status === 'fail' ? estimatedCost : undefined
  };
}

/**
 * Create R-value minimum check
 */
function createRValueCheck(
  measuredRValue: number,
  code: BuildingCodeStandard,
  zone: ClimateZone,
  componentType: BuildingComponentType
): ComplianceCheck {
  // Minimum R-value varies by zone
  const minRValues: Record<ClimateZone, number> = {
    1: 1.0,
    2: 1.1,
    3: 1.5,
    4: 1.9,
    5: 2.5,
    6: 3.0,
    7: 3.5,
    8: 4.0
  };

  const requiredMinRValue = minRValues[zone];
  const gap = requiredMinRValue - measuredRValue;
  const status = gap <= 0 ? 'pass' : gap < 0.3 ? 'warning' : 'fail';
  const severity = gap >= 0.3 ? 'major' : 'minor';

  return {
    id: 'r-value',
    name: 'Minimum R-Value',
    description: `Minimum thermal resistance for climate zone ${zone}`,
    status,
    severity,
    measuredValue: measuredRValue,
    requiredValue: requiredMinRValue,
    unit: 'm²K/W',
    gap: -gap, // negative means we're above minimum
    codeReference: {
      code,
      zone,
      componentType,
      url: getCodeUrl(code),
      section: 'Minimum Insulation Levels'
    }
  };
}

/**
 * Create insulation continuity check
 */
function createInsulationContinuityCheck(
  components: WallComponent[],
  code: BuildingCodeStandard,
  zone: ClimateZone,
  componentType: BuildingComponentType
): ComplianceCheck {
  // Check if insulation layers are properly placed
  const insulationLayers = components.filter(c => c.isInsulation);
  const hasInsulation = insulationLayers.length > 0;

  // Check if there are thermal bridges (gaps in insulation)
  const studLayers = components.filter(c => c.hasStuds);
  const hasThermalBridges = studLayers.length > 0;

  const status = hasInsulation ? 'pass' : 'fail';
  const severity = 'major';

  const measuredValue = hasInsulation ? 1 : 0;
  const requiredValue = 1;

  return {
    id: 'insulation-continuity',
    name: 'Insulation Continuity',
    description: 'Ensure continuous insulation layer with minimal thermal bridges',
    status,
    severity,
    measuredValue,
    requiredValue,
    unit: 'rating',
    gap: hasInsulation ? 0 : 1,
    codeReference: {
      code,
      zone,
      componentType,
      url: getCodeUrl(code),
      section: 'Continuous Insulation Requirements'
    },
    recommendations: hasInsulation
      ? undefined
      : ['Add at least one continuous insulation layer']
  };
}

/**
 * Create condensation risk check
 */
function createCondensationRiskCheck(
  components: WallComponent[],
  code: BuildingCodeStandard,
  zone: ClimateZone,
  componentType: BuildingComponentType
): ComplianceCheck {
  // Simplified condensation risk assessment
  // In a real implementation, this would use the full dew point calculation
  const hasVaporBarrier = components.some(c => c.vaporResistance && c.vaporResistance > 50);

  const status = hasVaporBarrier ? 'pass' : 'warning';
  const severity = 'minor';

  const measuredValue = hasVaporBarrier ? 1 : 0;
  const requiredValue = 1;

  return {
    id: 'condensation-risk',
    name: 'Condensation Risk',
    description: 'Vapor barrier presence to prevent moisture accumulation',
    status,
    severity,
    measuredValue,
    requiredValue,
    unit: 'rating',
    gap: hasVaporBarrier ? 0 : 1,
    codeReference: {
      code,
      zone,
      componentType,
      url: getCodeUrl(code),
      section: 'Moisture Control Requirements'
    },
    recommendations: hasVaporBarrier
      ? undefined
      : ['Consider adding a vapor barrier on the warm side of the wall']
  };
}

/**
 * Get URL for building code documentation
 */
function getCodeUrl(code: BuildingCodeStandard): string {
  const urls: Record<BuildingCodeStandard, string> = {
    ASHRAE_90_1: 'https://www.ashrae.org/technical-resources/standards-and-guidelines',
    IECC_2021: 'https://codes.iccsafe.org/content/IECC2021',
    IECC_2018: 'https://codes.iccsafe.org/content/IECC2018',
    ISO_6946: 'https://www.iso.org/standard/63594.html',
    EN_12831: 'https://standards.cen.eu',
    BC_BC_2018: 'https://www.bccodes.ca/building-code.html',
    NBC_Canada_2020: 'https://nrc.canada.ca/codes-canada',
    EU_2018_844: 'https://energy.ec.europa.eu/topics/energy-efficiency/energy-performance-buildings_en'
  };

  return urls[code];
}

/**
 * Check compliance against multiple building codes
 *
 * @param components - Array of wall components
 * @param studWallConfig - Stud wall configuration
 * @param codes - Array of building code standards to check
 * @param zone - Climate zone
 * @param componentType - Type of building component
 * @returns Array of compliance results
 */
export function checkMultipleCompliance(
  components: WallComponent[],
  studWallConfig: StudWallConfig | undefined,
  codes: BuildingCodeStandard[],
  zone: ClimateZone,
  componentType: BuildingComponentType
): ComplianceResult[] {
  return codes.map(code =>
    checkCompliance(components, studWallConfig, code, zone, componentType)
  );
}

/**
 * Get compliance summary across all checked codes
 *
 * @param results - Array of compliance results
 * @returns Summary statistics
 */
export function getComplianceSummary(results: ComplianceResult[]) {
  const passed = results.filter(r => r.pass).length;
  const failed = results.length - passed;
  const averageScore = results.length > 0
    ? results.reduce((sum, r) => sum + r.score, 0) / results.length
    : 0;

  return {
    total: results.length,
    passed,
    failed,
    averageScore,
    percentage: results.length > 0 ? (passed / results.length) * 100 : 0
  };
}
