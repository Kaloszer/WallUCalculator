"use client";

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Building2, Check } from 'lucide-react';
import { SavedWallAssembly } from '@/lib/types/domain';
import { getAllAssemblies } from '@/lib/storage/assemblyStorage';

interface AssemblySelectorProps {
  selectedIds: string[];
  onAssemblySelect: (assemblyId: string) => void;
}

export function AssemblySelector({ selectedIds, onAssemblySelect }: AssemblySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFavorite, setFilterFavorite] = useState(false);

  const assemblies = useMemo(() => {
    let filtered = getAllAssemblies();

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(assembly =>
        assembly.name.toLowerCase().includes(term) ||
        (assembly.description && assembly.description.toLowerCase().includes(term))
      );
    }

    if (filterFavorite) {
      filtered = filtered.filter(assembly => assembly.isFavorite);
    }

    return filtered;
  }, [searchTerm, filterFavorite]);

  const canSelect = selectedIds.length < 4;
  const isSelected = (id: string) => selectedIds.includes(id);

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assemblies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={filterFavorite ? 'default' : 'outline'}
          onClick={() => setFilterFavorite(!filterFavorite)}
          className="w-full sm:w-auto"
        >
          Favorites Only
        </Button>
      </div>

      {/* Selection Count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {assemblies.length} assembly{assemblies.length !== 1 ? 's' : ''} available
        </span>
        <span className="font-medium">
          {selectedIds.length}/4 selected
        </span>
      </div>

      {/* Assembly List */}
      <div className="grid gap-3">
        {assemblies.length === 0 ? (
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <Building2 className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">No assemblies found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? 'Try a different search term' : 'Create your first assembly to get started'}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          assemblies.map((assembly) => (
            <Card
              key={assembly.id}
              className={`p-4 transition-all cursor-pointer hover:shadow-md ${
                isSelected(assembly.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              } ${!canSelect && !isSelected(assembly.id) ? 'opacity-50' : ''}`}
              onClick={() => canSelect || isSelected(assembly.id) ? onAssemblySelect(assembly.id) : undefined}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <Checkbox
                  checked={isSelected(assembly.id)}
                  disabled={!canSelect && !isSelected(assembly.id)}
                  className="mt-1"
                  onCheckedChange={() =>
                    canSelect || isSelected(assembly.id) ? onAssemblySelect(assembly.id) : undefined
                  }
                />

                {/* Assembly Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{assembly.name}</h4>
                        {isSelected(assembly.id) && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      {assembly.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {assembly.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Assembly Details */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="secondary" className="text-xs">
                      {assembly.components.length} layer{assembly.components.length !== 1 ? 's' : ''}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {assembly.studWallConfig?.type ?? 'No studs'}
                    </Badge>
                    {assembly.tags && assembly.tags.length > 0 && (
                      <>
                        {assembly.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {assembly.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{assembly.tags.length - 2}
                          </Badge>
                        )}
                      </>
                    )}
                    {assembly.isFavorite && (
                      <Badge variant="default" className="text-xs">
                        Favorite
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
