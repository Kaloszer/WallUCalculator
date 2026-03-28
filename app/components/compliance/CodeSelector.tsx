"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ComplianceStandard,
} from '@/lib/types/domain';
import {
  ClimateZone,
} from '@/lib/data/buildingCodes';
import {
  Building2,
  Home,
  MapPin,
  FileText,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface CodeSelectorProps {
  selectedStandard: ComplianceStandard;
  selectedClimateZone: ClimateZone;
  buildingType: 'residential' | 'commercial';
  onStandardChange: (standard: ComplianceStandard) => void;
  onClimateZoneChange: (zone: ClimateZone) => void;
  onBuildingTypeChange: (type: 'residential' | 'commercial') => void;
  onRunCheck?: () => void;
  loading?: boolean;
}

const standards: { value: ComplianceStandard; label: string; description: string }[] = [
  {
    value: 'ASHRAE_90_1',
    label: 'ASHRAE 90.1',
    description: 'Energy Standard for Buildings Except Low-Rise Residential',
  },
  {
    value: 'IECC_2021',
    label: 'IECC 2021',
    description: 'International Energy Conservation Code 2021',
  },
  {
    value: 'IECC_2018',
    label: 'IECC 2018',
    description: 'International Energy Conservation Code 2018',
  },
  {
    value: 'BC_BC_2018',
    label: 'BC Building Code 2018',
    description: 'British Columbia Building Code',
  },
  {
    value: 'NBC_Canada_2020',
    label: 'NBC Canada 2020',
    description: 'National Building Code of Canada 2020',
  },
  {
    value: 'EU_2018_844',
    label: 'EU 2018/844',
    description: 'EU Energy Performance of Buildings Directive',
  },
  {
    value: 'custom',
    label: 'Custom Standard',
    description: 'User-defined compliance requirements',
  },
];

const climateZones: { value: string; label: string; description: string; zoneNum: ClimateZone }[] = [
  {
    value: '1',
    zoneNum: 1,
    label: 'Very Cold',
    description: 'Below -15°C average temperature',
  },
  {
    value: '2',
    zoneNum: 2,
    label: 'Cold',
    description: '-15°C to 0°C average temperature',
  },
  {
    value: '3',
    zoneNum: 3,
    label: 'Mixed-Humid',
    description: '0°C to 10°C, humid conditions',
  },
  {
    value: '4',
    zoneNum: 4,
    label: 'Mixed-Dry',
    description: '0°C to 10°C, dry conditions',
  },
  {
    value: '5',
    zoneNum: 5,
    label: 'Hot-Humid',
    description: 'Above 10°C, humid conditions',
  },
  {
    value: '6',
    zoneNum: 6,
    label: 'Hot-Dry',
    description: 'Above 10°C, dry conditions',
  },
  {
    value: '7',
    zoneNum: 7,
    label: 'Marine',
    description: 'Coastal moderate climate',
  },
  {
    value: '8',
    zoneNum: 8,
    label: 'Very Hot',
    description: 'Extreme heat conditions',
  },
];

const buildingTypes: { value: 'residential' | 'commercial'; label: string; icon: typeof Home }[] = [
  { value: 'residential', label: 'Residential', icon: Home },
  { value: 'commercial', label: 'Commercial', icon: Building2 },
];

export function CodeSelector({
  selectedStandard,
  selectedClimateZone,
  buildingType,
  onStandardChange,
  onClimateZoneChange,
  onBuildingTypeChange,
  onRunCheck,
  loading = false,
}: CodeSelectorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectedStandardInfo = standards.find((s) => s.value === selectedStandard);
  const selectedClimateInfo = climateZones.find((z) => z.zoneNum === selectedClimateZone);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <CardTitle>Code Selection</CardTitle>
        </div>
        <CardDescription>
          Select the building code standard and parameters for compliance checking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Compliance Standard */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Compliance Standard</label>
          <Select
            value={selectedStandard}
            onValueChange={(value) => onStandardChange(value as ComplianceStandard)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a standard" />
            </SelectTrigger>
            <SelectContent>
              {standards.map((standard) => (
                <SelectItem key={standard.value} value={standard.value}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{standard.label}</span>
                    <span className="text-xs text-muted-foreground">{standard.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedStandardInfo && (
            <p className="text-sm text-muted-foreground">{selectedStandardInfo.description}</p>
          )}
        </div>

        {/* Building Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Building Type</label>
          <div className="grid grid-cols-2 gap-3">
            {buildingTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => onBuildingTypeChange(type.value)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    buildingType === type.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{type.label}</span>
                  {buildingType === type.value && (
                    <CheckCircle className="h-4 w-4 text-primary ml-auto" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Climate Zone */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Climate Zone</label>
          <Select
            value={String(selectedClimateZone)}
            onValueChange={(value) => {
              const zone = climateZones.find((z) => z.value === value);
              if (zone) onClimateZoneChange(zone.zoneNum);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select climate zone" />
            </SelectTrigger>
            <SelectContent>
              {climateZones.map((zone) => (
                <SelectItem key={zone.value} value={String(zone.value)}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{zone.label}</span>
                    <span className="text-xs text-muted-foreground">{zone.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedClimateInfo && (
            <p className="text-sm text-muted-foreground">
              <MapPin className="inline-block h-3 w-3 mr-1" />
              {selectedClimateInfo.description}
            </p>
          )}
        </div>

        {/* Summary */}
        <div className="p-4 rounded-lg bg-muted">
          <p className="text-sm font-medium mb-2">Current Selection</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">{selectedStandardInfo?.label || selectedStandard}</Badge>
            <Badge variant="secondary">{buildingType === 'residential' ? 'Residential' : 'Commercial'}</Badge>
            <Badge variant="outline">{selectedClimateInfo?.label || selectedClimateZone}</Badge>
          </div>
        </div>

        {/* Help Text */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Different standards have varying requirements based on climate zone and building type.
            Make sure to select the correct parameters for accurate compliance checking.
          </p>
        </div>

        {/* Run Check Button */}
        {onRunCheck && (
          <Button
            onClick={onRunCheck}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Running Compliance Check...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Run Compliance Check
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
