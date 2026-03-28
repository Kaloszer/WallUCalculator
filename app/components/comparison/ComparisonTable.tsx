import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AssemblyMetrics } from '@/lib/calculations/comparison';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComparisonTableProps {
  assemblies: AssemblyMetrics[];
  bestPerformingIndex: number;
  mostEfficientIndex: number;
  thinnestIndex: number;
  cheapestIndex: number;
  recommendedIndex: number;
}

export function ComparisonTable({
  assemblies,
  bestPerformingIndex,
  mostEfficientIndex,
  thinnestIndex,
  cheapestIndex,
  recommendedIndex
}: ComparisonTableProps) {
  const getIndicator = (currentIndex: number, bestIndex: number, lowerIsBetter: boolean = false) => {
    if (currentIndex === bestIndex) {
      return (
        <Badge variant="default" className="gap-1">
          <TrendingUp className="h-3 w-3" />
          Best
        </Badge>
      );
    }
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const calculatePercentageDiff = (value: number, baseline: number) => {
    if (baseline === 0) return 0;
    return ((value - baseline) / baseline) * 100;
  };

  const baselineRValue = assemblies[0]?.rValue || 0;
  const baselineUValue = assemblies[0]?.uValue || 0;
  const baselineCost = assemblies[0]?.cost || 0;
  const baselineThickness = assemblies[0]?.thickness || 0;
  const baselineEfficiency = assemblies[0]?.costEffectiveness || 0;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Assembly</TableHead>
            <TableHead className="w-[120px]">R-Value</TableHead>
            <TableHead className="w-[120px]">U-Value</TableHead>
            <TableHead className="w-[120px]">Cost</TableHead>
            <TableHead className="w-[120px]">Thickness</TableHead>
            <TableHead className="w-[120px]">Cost Effectiveness</TableHead>
            <TableHead className="w-[100px]">Components</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assemblies.map((assembly, index) => (
            <TableRow
              key={assembly.assemblyId}
              className={
                index === recommendedIndex
                  ? 'bg-primary/5 border-primary/20'
                  : ''
              }
            >
              <TableCell className="font-medium">
                <div className="space-y-1">
                  <div>{assembly.name}</div>
                  {index === recommendedIndex && (
                    <Badge variant="secondary" className="text-xs">
                      Recommended
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-mono text-sm">
                    {assembly.rValue.toFixed(3)} m²K/W
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {index > 0 &&
                      (() => {
                        const diff = calculatePercentageDiff(assembly.rValue, baselineRValue);
                        const formatted = diff.toFixed(1);
                        const isPositive = diff > 0;
                        const className = isPositive ? 'text-green-600' : 'text-red-600';
                        const prefix = isPositive ? '+' : '';
                        return (
                          <span className={className}>
                            {`${prefix}${formatted}%`}
                          </span>
                        );
                      })()}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-mono text-sm">
                    {assembly.uValue.toFixed(3)} W/m²K
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {index > 0 && (
                      <>
                        {calculatePercentageDiff(assembly.uValue, baselineUValue) < 0 ? (
                          <span className="text-green-600">-</span>
                        ) : (
                          <span className="text-red-600">+</span>
                        )}
                        {Math.abs(calculatePercentageDiff(assembly.uValue, baselineUValue)).toFixed(1)}%
                      </>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-mono text-sm">
                    ${assembly.cost.toFixed(2)}/m²
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {index > 0 && (
                      <>
                        {calculatePercentageDiff(assembly.cost, baselineCost) < 0 ? (
                          <span className="text-green-600">-</span>
                        ) : (
                          <span className="text-red-600">+</span>
                        )}
                        {Math.abs(calculatePercentageDiff(assembly.cost, baselineCost)).toFixed(1)}%
                      </>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-mono text-sm">
                    {assembly.thickness} mm
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {index > 0 && (
                      <>
                        {calculatePercentageDiff(assembly.thickness, baselineThickness) < 0 ? (
                          <span className="text-green-600">-</span>
                        ) : (
                          <span className="text-red-600">+</span>
                        )}
                        {Math.abs(calculatePercentageDiff(assembly.thickness, baselineThickness)).toFixed(1)}%
                      </>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-mono text-sm">
                    {(assembly.costEffectiveness * 1000).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {index > 0 && (
                      <>
                        {calculatePercentageDiff(assembly.costEffectiveness, baselineEfficiency) > 0 ? (
                          <span className="text-green-600">+</span>
                        ) : (
                          <span className="text-red-600">-</span>
                        )}
                        {calculatePercentageDiff(assembly.costEffectiveness, baselineEfficiency).toFixed(1)}%
                      </>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-mono text-sm">
                  {assembly.componentCount}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
