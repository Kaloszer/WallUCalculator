"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ComparisonTable } from './ComparisonTable';
import { ComparisonCharts } from './ComparisonCharts';
import { AssemblySelector } from './AssemblySelector';
import {
  compareAssemblies,
  validateAssemblies,
  AssemblyMetrics,
  WallAssembly,
  ComparisonResult
} from '@/lib/calculations/comparison';
import { getAllAssemblies } from '@/lib/storage/assemblyStorage';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function ComparisonView() {
  const [selectedAssemblyIds, setSelectedAssemblyIds] = useState<string[]>([]);
  const [assemblies, setAssemblies] = useState<WallAssembly[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load selected assemblies
  useEffect(() => {
    if (selectedAssemblyIds.length >= 2 && selectedAssemblyIds.length <= 4) {
      loadAssembliesForComparison();
    } else {
      setAssemblies([]);
      setComparison(null);
    }
  }, [selectedAssemblyIds]);

  const loadAssembliesForComparison = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all assemblies from storage
      const allAssemblies = getAllAssemblies();

      // Filter to get only selected assemblies
      const loadedAssemblies: WallAssembly[] = selectedAssemblyIds
        .map(id => {
          const saved = allAssemblies.find(a => a.id === id);
          if (!saved) return null;

          // Map SavedWallAssembly to WallAssembly format
          return {
            id: saved.id,
            name: saved.name,
            components: saved.components.map(comp => ({
              id: comp.id,
              material: comp.material,
              thickness: comp.thickness,
              conductivity: comp.conductivity,
              isInsulation: comp.isInsulation,
              hasStuds: comp.hasStuds
            })),
            studWallType: saved.studWallConfig?.type ?? 'none',
            description: saved.description
          } as WallAssembly;
        })
        .filter((a): a is WallAssembly => a !== null);

      if (loadedAssemblies.length < 2) {
        throw new Error('Could not load enough valid assemblies for comparison');
      }

      setAssemblies(loadedAssemblies);

      // Perform comparison
      validateAssemblies(loadedAssemblies);
      const result = compareAssemblies(loadedAssemblies);
      setComparison(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assemblies');
      setComparison(null);
    } finally {
      setLoading(false);
    }
  }, [selectedAssemblyIds]);

  const handleAssemblySelect = (assemblyId: string) => {
    if (selectedAssemblyIds.includes(assemblyId)) {
      // Deselect
      setSelectedAssemblyIds(prev => prev.filter(id => id !== assemblyId));
    } else if (selectedAssemblyIds.length < 4) {
      // Select (max 4)
      setSelectedAssemblyIds(prev => [...prev, assemblyId]);
    }
  };

  const handleClearSelection = () => {
    setSelectedAssemblyIds([]);
  };

  const getRecommendedAssembly = (): AssemblyMetrics | null => {
    if (!comparison || comparison.recommendedIndex === -1) return null;
    return comparison.assemblies[comparison.recommendedIndex];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Wall Assembly Comparison</CardTitle>
              <CardDescription>
                Select 2-4 assemblies to compare side-by-side
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={selectedAssemblyIds.length >= 2 ? 'default' : 'secondary'}>
                {selectedAssemblyIds.length}/4 selected
              </Badge>
              {selectedAssemblyIds.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSelection}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AssemblySelector
            selectedIds={selectedAssemblyIds}
            onAssemblySelect={handleAssemblySelect}
          />
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <p>Loading comparison...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {comparison && !loading && (
        <>
          {(() => {
            const recommended = getRecommendedAssembly();
            return recommended && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">
                      Recommended: {recommended.name}
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Best overall performance based on weighted criteria (R-value: 50%, Cost: 30%, Thickness: 20%)
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })()}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Detailed comparison of thermal performance and cost
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ComparisonTable
                  assemblies={comparison.assemblies}
                  bestPerformingIndex={comparison.bestPerformingIndex}
                  mostEfficientIndex={comparison.mostEfficientIndex}
                  thinnestIndex={comparison.thinnestIndex}
                  cheapestIndex={comparison.cheapestIndex}
                  recommendedIndex={comparison.recommendedIndex}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visual Comparison</CardTitle>
                <CardDescription>
                  Performance radar chart and cost breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ComparisonCharts
                  assemblies={comparison.assemblies}
                  wallAssemblies={assemblies}
                  bestPerformingIndex={comparison.bestPerformingIndex}
                  mostEfficientIndex={comparison.mostEfficientIndex}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Comparison Summary</CardTitle>
              <CardDescription>
                Quick insights from the analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {comparison.assemblies.map((assembly: AssemblyMetrics, index: number) => (
                  <div
                    key={assembly.assemblyId}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      index === comparison.recommendedIndex
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <h4 className="font-semibold mb-3">{assembly.name}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">R-value:</span>
                        <span className={index === comparison.bestPerformingIndex ? 'font-bold text-primary' : ''}>
                          {assembly.rValue.toFixed(3)} m²K/W
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">U-value:</span>
                        <span className={index === comparison.bestPerformingIndex ? 'font-bold text-primary' : ''}>
                          {assembly.uValue.toFixed(3)} W/m²K
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cost:</span>
                        <span className={index === comparison.cheapestIndex ? 'font-bold text-primary' : ''}>
                          ${assembly.cost.toFixed(2)}/m²
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Thickness:</span>
                        <span className={index === comparison.thinnestIndex ? 'font-bold text-primary' : ''}>
                          {assembly.thickness} mm
                        </span>
                      </div>
                    </div>
                    {index === comparison.recommendedIndex && (
                      <Badge className="mt-3 w-full justify-center">
                        Recommended
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
