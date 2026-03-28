"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, RefreshCw, Shield, FileCheck, XCircle, MapPin } from 'lucide-react';
import {
  WallComponent,
  StudWallConfig,
  ClimateZone,
} from '@/lib/types/domain';
import {
  BuildingCodeStandard,
  ClimateZone as BuildingCodeClimateZone,
  DEFAULT_BUILDING_CODE,
  DEFAULT_CLIMATE_ZONE,
} from '@/lib/data/buildingCodes';

interface ComplianceDashboardProps {
  /** Wall components to check */
  components?: WallComponent[];
  /** Stud wall configuration */
  studWallConfig?: StudWallConfig;
  /** Current climate zone */
  climateZone?: ClimateZone;
}

const standardLabels: Record<BuildingCodeStandard, string> = {
  ASHRAE_90_1: 'ASHRAE 90.1',
  IECC_2021: 'IECC 2021',
  IECC_2018: 'IECC 2018',
  ISO_6946: 'ISO 6946',
  EN_12831: 'EN 12831',
  BC_BC_2018: 'BC Building Code 2018',
  NBC_Canada_2020: 'NBC Canada 2020',
  EU_2018_844: 'EU 2018/844',
};

const standardColors: Record<BuildingCodeStandard, string> = {
  ASHRAE_90_1: 'bg-blue-500',
  IECC_2021: 'bg-green-500',
  IECC_2018: 'bg-emerald-500',
  ISO_6946: 'bg-purple-500',
  EN_12831: 'bg-red-500',
  BC_BC_2018: 'bg-orange-500',
  NBC_Canada_2020: 'bg-yellow-500',
  EU_2018_844: 'bg-cyan-500',
};

interface ComplianceCheckResult {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning';
  severity: 'critical' | 'major' | 'minor';
  measuredValue: number;
  requiredValue: number;
  unit: string;
  gap: number;
  recommendations?: string[];
}

interface ComplianceResultData {
  pass: boolean;
  score: number;
  totalUValue: number;
  totalRValue: number;
  checks: ComplianceCheckResult[];
  code: BuildingCodeStandard;
  zone: BuildingCodeClimateZone;
  componentType: string;
  timestamp: string;
}

// Convert API result to display format
function convertToDisplayResult(result: ComplianceResultData) {
  const uValueCheck = result.checks.find(c => c.id === 'u-value');
  const maxUValue = uValueCheck?.requiredValue ?? 0;
  const actualUValue = result.totalUValue;
  const percentageOfRequirement = maxUValue > 0 ? (actualUValue / maxUValue) * 100 : 0;

  // Build violations from failed checks
  const violations = result.checks
    .filter(c => c.status === 'fail')
    .map(c => ({
      type: c.id === 'u-value' ? 'u_value' :
            c.id === 'r-value' ? 'r_value' :
            c.id === 'condensation-risk' ? 'moisture' : 'other' as const,
      severity: c.severity === 'critical' ? 'critical' :
                c.severity === 'major' ? 'major' : 'minor' as const,
      description: c.description,
      suggestion: c.recommendations?.[0],
    }));

  // Build recommendation from recommendations
  const recommendation = result.checks
    .filter(c => c.status === 'fail' && c.recommendations && c.recommendations.length > 0)
    .map(c => c.recommendations![0])
    .join('. ');

  return {
    compliant: result.pass,
    standard: result.code,
    maxUValue,
    actualUValue,
    percentageOfRequirement,
    checks: result.checks.map(c => ({
      id: c.id,
      description: c.description,
      passed: c.status === 'pass',
      expected: c.requiredValue,
      actual: c.measuredValue,
      unit: c.unit,
    })),
    violations,
    recommendation: recommendation || undefined,
  };
}

export function ComplianceDashboard({
  components = [],
  studWallConfig,
  climateZone = DEFAULT_CLIMATE_ZONE,
}: ComplianceDashboardProps) {
  const [results, setResults] = useState<ReturnType<typeof convertToDisplayResult>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStandard, setSelectedStandard] = useState<BuildingCodeStandard | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const codesToCheck: BuildingCodeStandard[] = ['ASHRAE_90_1', 'IECC_2021', 'ISO_6946'];

  const runComplianceCheck = useCallback(async () => {
    if (components.length === 0) {
      setError('Add wall components before running compliance check');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/compliance/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          components,
          studWallConfig,
          codes: codesToCheck,
          zone: climateZone,
          componentType: 'opaque_walls',
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Compliance check failed: ${response.status}`);
      }

      const data: ComplianceResultData[] = await response.json();
      const convertedResults = data.map(convertToDisplayResult);
      setResults(convertedResults);
      setHasRun(true);

      // Auto-select first result only if nothing selected yet
      setSelectedStandard(prev => prev ?? (convertedResults[0]?.standard || null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run compliance check');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [components, studWallConfig, climateZone]);

  const overallScore = results.length > 0
    ? Math.round(results.reduce((acc, r) => acc + r.percentageOfRequirement, 0) / results.length)
    : 0;

  const passedCount = results.filter((r) => r.compliant).length;
  const totalCount = results.length;

  const selectedResult = results.find((r) => r.standard === selectedStandard) || results[0];

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <p>Running compliance checks...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button onClick={runComplianceCheck} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasRun || results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Compliance Dashboard</CardTitle>
          </div>
          <CardDescription>
            Check your wall assembly against building code standards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <FileCheck className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-muted-foreground">
                No compliance checks have been run yet.
              </p>
              {components.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Add wall components first to enable compliance checking.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Climate Zone: {climateZone} ({['Very Hot', 'Hot', 'Mixed-Humid', 'Mixed', 'Cool', 'Cold', 'Very Cold', 'Subarctic'][climateZone - 1]})
                </p>
              )}
            </div>
            <Button
              onClick={runComplianceCheck}
              disabled={components.length === 0}
            >
              <Shield className="h-4 w-4 mr-2" />
              Run Compliance Check
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Compliance Overview</CardTitle>
            </div>
            <Badge variant={overallScore <= 100 ? 'default' : overallScore <= 120 ? 'secondary' : 'destructive'}>
              {passedCount}/{totalCount} Passed
            </Badge>
          </div>
          <CardDescription>
            Overall compliance score across all checked standards (Climate Zone {climateZone})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Avg. % of Requirement</span>
              <span className="text-2xl font-bold">{overallScore.toFixed(1)}%</span>
            </div>
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  overallScore <= 100 ? 'bg-green-500' : overallScore <= 120 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(overallScore, 100)}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {results.map((result) => (
                <button
                  key={result.standard}
                  onClick={() => setSelectedStandard(result.standard)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors bg-muted hover:bg-muted/80 ${
                    selectedResult?.standard === result.standard
                      ? 'ring-2 ring-primary ring-offset-2'
                      : ''
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${standardColors[result.standard]}`} />
                  <span>{standardLabels[result.standard]}</span>
                  {result.compliant ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Standard Detail */}
      {selectedResult && (
        <Card className={selectedResult.compliant ? 'border-green-200' : 'border-red-200'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{standardLabels[selectedResult.standard]}</CardTitle>
                <CardDescription>
                  Detailed compliance information
                </CardDescription>
              </div>
              <Badge
                variant={selectedResult.compliant ? 'default' : 'destructive'}
                className="text-sm"
              >
                {selectedResult.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Max Allowed U-Value</p>
                <p className="text-xl font-semibold">{selectedResult.maxUValue.toFixed(3)}</p>
                <p className="text-xs text-muted-foreground">W/m²K</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Actual U-Value</p>
                <p className={`text-xl font-semibold ${
                  selectedResult.actualUValue <= selectedResult.maxUValue
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {selectedResult.actualUValue.toFixed(3)}
                </p>
                <p className="text-xs text-muted-foreground">W/m²K</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-1">% of Requirement</p>
                <p className={`text-xl font-semibold ${
                  selectedResult.percentageOfRequirement <= 100
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {selectedResult.percentageOfRequirement.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedResult.percentageOfRequirement <= 100
                    ? 'Within limits'
                    : 'Exceeds limits'}
                </p>
              </div>
            </div>

            {selectedResult.violations.length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <p className="font-medium text-red-900">Violations Detected</p>
                </div>
                <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                  {selectedResult.violations.map((v, i) => (
                    <li key={i}>
                      {v.description}
                      {v.suggestion && ` - ${v.suggestion}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedResult.recommendation && (
              <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="font-medium text-blue-900 mb-1">Recommendations</p>
                <p className="text-sm text-blue-800">{selectedResult.recommendation}</p>
              </div>
            )}

            {/* Individual Checks */}
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Individual Checks</p>
              <div className="space-y-2">
                {selectedResult.checks.map((check) => (
                  <div key={check.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <div className="flex items-center gap-2">
                      {check.passed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">{check.description}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {check.actual.toFixed(3)} / {check.expected.toFixed(3)} {check.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Run Check Button */}
      <div className="flex justify-end">
        <Button onClick={runComplianceCheck} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Re-run Compliance Check
        </Button>
      </div>
    </div>
  );
}

