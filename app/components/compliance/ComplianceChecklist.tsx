"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ComplianceResult,
  ComplianceCheck,
  ComplianceStandard,
} from '@/lib/types/domain';
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';

interface ComplianceChecklistProps {
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

function CheckRow({ check, standard }: { check: ComplianceCheck; standard: ComplianceStandard }) {
  const [expanded, setExpanded] = useState(false);

  const formatValue = (value: number | string, unit?: string): string => {
    if (typeof value === 'number') {
      return `${value.toFixed(3)}${unit ? ` ${unit}` : ''}`;
    }
    return `${value}${unit ? ` ${unit}` : ''}`;
  };

  const passed = check.passed;

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
      >
        <TableCell>
          {passed ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
        </TableCell>
        <TableCell>
          <Badge variant={passed ? 'default' : 'destructive'}>
            {passed ? 'PASS' : 'FAIL'}
          </Badge>
        </TableCell>
        <TableCell className="font-medium">{check.description}</TableCell>
        <TableCell>{formatValue(check.expected, check.unit)}</TableCell>
        <TableCell className={passed ? 'text-green-600' : 'text-red-600'}>
          {formatValue(check.actual, check.unit)}
        </TableCell>
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
          <TableCell colSpan={6} className="bg-muted/30">
            <div className="py-2 px-4 space-y-2">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Check ID</p>
                  <p className="font-medium">{check.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Standard</p>
                  <p className="font-medium">{standardLabels[standard]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className={`font-medium ${passed ? 'text-green-600' : 'text-red-600'}`}>
                    {passed ? 'Requirement Met' : 'Requirement Not Met'}
                  </p>
                </div>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">Comparison</p>
                <p>
                  Expected: <span className="font-medium">{formatValue(check.expected, check.unit)}</span>
                  {' | '}
                  Actual: <span className={`font-medium ${passed ? 'text-green-600' : 'text-red-600'}`}>
                    {formatValue(check.actual, check.unit)}
                  </span>
                  {' | '}
                  Difference: <span className={`font-medium ${passed ? 'text-green-600' : 'text-red-600'}`}>
                    {typeof check.actual === 'number' && typeof check.expected === 'number'
                      ? Math.abs(check.actual - check.expected).toFixed(3)
                      : 'N/A'}
                    {check.unit ? ` ${check.unit}` : ''}
                  </span>
                </p>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function ComplianceChecklist({ results, loading = false }: ComplianceChecklistProps) {
  const [selectedStandard, setSelectedStandard] = useState<ComplianceStandard | null>(null);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Checklist</CardTitle>
          <CardDescription>Loading compliance checks...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Checklist</CardTitle>
          <CardDescription>No compliance data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Run a compliance check to see detailed results
          </p>
        </CardContent>
      </Card>
    );
  }

  const selectedResult = results.find((r) => r.standard === selectedStandard) || results[0];
  const allChecks = results.flatMap((r) =>
    r.checks.map((check) => ({ ...check, standard: r.standard, compliant: r.compliant }))
  );

  const passedChecks = allChecks.filter((c) => c.passed).length;
  const failedChecks = allChecks.filter((c) => !c.passed).length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Checks</p>
            <p className="text-2xl font-bold">{allChecks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-green-600">Passed</p>
            <p className="text-2xl font-bold text-green-600">{passedChecks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-red-600">Failed</p>
            <p className="text-2xl font-bold text-red-600">{failedChecks}</p>
          </CardContent>
        </Card>
      </div>

      {/* Standard Selector */}
      {results.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Standard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {results.map((result) => (
                <button
                  key={result.standard}
                  onClick={() => setSelectedStandard(result.standard)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    selectedResult?.standard === result.standard
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {standardLabels[result.standard]}
                  {result.compliant ? (
                    <CheckCircle className="inline-block ml-1 h-3 w-3 text-green-400" />
                  ) : (
                    <XCircle className="inline-block ml-1 h-3 w-3 text-red-400" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checklist Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detailed Checklist</CardTitle>
              <CardDescription>
                {selectedResult && `Showing checks for ${standardLabels[selectedResult.standard]}`}
              </CardDescription>
            </div>
            <Badge variant={selectedResult?.compliant ? 'default' : 'destructive'}>
              {selectedResult?.checks.filter((c) => c.passed).length || 0}/
              {selectedResult?.checks.length || 0} Passed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Status</TableHead>
                <TableHead className="w-20">Result</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedResult?.checks.map((check) => (
                <CheckRow
                  key={check.id}
                  check={check}
                  standard={selectedResult.standard}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
