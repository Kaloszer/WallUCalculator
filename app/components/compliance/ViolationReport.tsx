"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ComplianceViolation,
  ComplianceResult,
  ComplianceStandard,
} from '@/lib/types/domain';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  BookOpen,
} from 'lucide-react';
import { useState } from 'react';

interface ViolationReportProps {
  results: ComplianceResult[];
  loading?: boolean;
}

const standardLabels: Record<ComplianceStandard, string> = {
  ASHRAE_90_1: 'ASHRAE 90.1',
  IECC_2021: 'IECC 2021',
  IECC_2018: 'IECC 2018',
  ISO_6946: 'ISO 6946',
  EN_12831: 'EN 12831',
  BC_BC_2018: 'BC Building Code 2018',
  NBC_Canada_2020: 'NBC Canada 2020',
  EU_2018_844: 'EU 2018/844',
  custom: 'Custom Standard',
};

const severityConfig = {
  critical: {
    icon: AlertOctagon,
    badge: 'destructive',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Critical',
  },
  major: {
    icon: AlertTriangle,
    badge: 'destructive',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    label: 'Major',
  },
  moderate: {
    icon: AlertCircle,
    badge: 'secondary',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: 'Moderate',
  },
  minor: {
    icon: Info,
    badge: 'outline',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Minor',
  },
};

interface ViolationWithStandard extends ComplianceViolation {
  standard: ComplianceStandard;
}

function ViolationRow({ violation }: { violation: ViolationWithStandard }) {
  const [expanded, setExpanded] = useState(false);
  const config = severityConfig[violation.severity];
  const Icon = config.icon;

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
      >
        <TableCell>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </TableCell>
        <TableCell>
          <Badge variant={config.badge as any}>{config.label}</Badge>
        </TableCell>
        <TableCell>{standardLabels[violation.standard]}</TableCell>
        <TableCell className="font-medium">{violation.description}</TableCell>
        <TableCell>
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={5} className="p-0">
            <div className={`p-4 space-y-4 ${config.bgColor} border-t ${config.borderColor}`}>
              {/* Type */}
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Violation Type</p>
                  <p className="text-sm capitalize">{violation.type.replace('_', ' ')}</p>
                </div>
              </div>

              {/* Code Reference */}
              {violation.codeReference && (
                <div className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Code Reference</p>
                    <p className="text-sm">{violation.codeReference}</p>
                  </div>
                </div>
              )}

              {/* Suggestion */}
              {violation.suggestion && (
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Recommendation</p>
                    <p className="text-sm">{violation.suggestion}</p>
                  </div>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function ViolationReport({ results, loading = false }: ViolationReportProps) {
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Violation Report</CardTitle>
          <CardDescription>Loading violation data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Collect all violations from all results
  const allViolations: ViolationWithStandard[] = results.flatMap((r) =>
    r.violations.map((v) => ({ ...v, standard: r.standard }))
  );

  const filteredViolations = filterSeverity
    ? allViolations.filter((v) => v.severity === filterSeverity)
    : allViolations;

  // Count by severity
  const counts = {
    critical: allViolations.filter((v) => v.severity === 'critical').length,
    major: allViolations.filter((v) => v.severity === 'major').length,
    moderate: allViolations.filter((v) => v.severity === 'moderate').length,
    minor: allViolations.filter((v) => v.severity === 'minor').length,
  };

  if (allViolations.length === 0) {
    return (
      <Card className="border-green-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Info className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle>Violation Report</CardTitle>
              <CardDescription>No violations detected</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-green-800">
              Great news! Your wall assembly meets all compliance requirements across all checked standards.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={counts.critical > 0 ? 'border-red-200' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-red-600" />
              <p className="text-sm text-muted-foreground">Critical</p>
            </div>
            <p className={`text-2xl font-bold ${counts.critical > 0 ? 'text-red-600' : ''}`}>
              {counts.critical}
            </p>
          </CardContent>
        </Card>
        <Card className={counts.major > 0 ? 'border-orange-200' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <p className="text-sm text-muted-foreground">Major</p>
            </div>
            <p className={`text-2xl font-bold ${counts.major > 0 ? 'text-orange-600' : ''}`}>
              {counts.major}
            </p>
          </CardContent>
        </Card>
        <Card className={counts.moderate > 0 ? 'border-yellow-200' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-muted-foreground">Moderate</p>
            </div>
            <p className={`text-2xl font-bold ${counts.moderate > 0 ? 'text-yellow-600' : ''}`}>
              {counts.moderate}
            </p>
          </CardContent>
        </Card>
        <Card className={counts.minor > 0 ? 'border-blue-200' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-muted-foreground">Minor</p>
            </div>
            <p className={`text-2xl font-bold ${counts.minor > 0 ? 'text-blue-600' : ''}`}>
              {counts.minor}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter by Severity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterSeverity === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterSeverity(null)}
            >
              All ({allViolations.length})
            </Button>
            {counts.critical > 0 && (
              <Button
                variant={filterSeverity === 'critical' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSeverity('critical')}
                className={filterSeverity !== 'critical' ? 'border-red-200 hover:bg-red-50' : ''}
              >
                Critical ({counts.critical})
              </Button>
            )}
            {counts.major > 0 && (
              <Button
                variant={filterSeverity === 'major' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSeverity('major')}
                className={filterSeverity !== 'major' ? 'border-orange-200 hover:bg-orange-50' : ''}
              >
                Major ({counts.major})
              </Button>
            )}
            {counts.moderate > 0 && (
              <Button
                variant={filterSeverity === 'moderate' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSeverity('moderate')}
                className={filterSeverity !== 'moderate' ? 'border-yellow-200 hover:bg-yellow-50' : ''}
              >
                Moderate ({counts.moderate})
              </Button>
            )}
            {counts.minor > 0 && (
              <Button
                variant={filterSeverity === 'minor' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSeverity('minor')}
                className={filterSeverity !== 'minor' ? 'border-blue-200 hover:bg-blue-50' : ''}
              >
                Minor ({counts.minor})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Violations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Violations</CardTitle>
              <CardDescription>
                {filteredViolations.length} violation(s) found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-24">Severity</TableHead>
                <TableHead className="w-40">Standard</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredViolations.map((violation, index) => (
                <ViolationRow key={index} violation={violation} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
