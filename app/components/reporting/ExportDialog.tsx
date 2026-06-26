"use client";

import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ExportFormat, exportData, createExportData, ExportData } from '@/lib/utils/export';
import { WallComponent, StudWallConfig, ThermalPerformance } from '@/lib/types/domain';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  components: WallComponent[];
  studWallConfig?: StudWallConfig;
  performance: ThermalPerformance;
  environmental?: { insideTemp: number; outsideTemp: number; dewPoint: number };
}

export function ExportDialog({
  open,
  onOpenChange,
  components,
  studWallConfig,
  performance,
  environmental
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [filename, setFilename] = useState('wall-assembly-export');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const data: ExportData = createExportData(
        components,
        studWallConfig,
        performance,
        environmental
      );

      exportData(data, {
        format,
        filename
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formats = [
    {
      value: 'json' as ExportFormat,
      label: 'JSON',
      icon: FileJson,
      description: 'Complete data structure with all calculations and metadata'
    },
    {
      value: 'csv' as ExportFormat,
      icon: FileText,
      description: 'Components table only, compatible with spreadsheet applications'
    },
    {
      value: 'excel' as ExportFormat,
      icon: FileSpreadsheet,
      description: 'Multi-sheet workbook with components, calculations, and settings'
    },
    {
      value: 'pdf' as ExportFormat,
      icon: Download,
      description: 'Professional PDF report with analysis and recommendations'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Wall Assembly</DialogTitle>
          <DialogDescription>
            Choose a format and options for exporting your wall assembly data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-4">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={(value: string) => setFormat(value as ExportFormat)}>
              <div className="grid grid-cols-2 gap-4">
                {formats.map((fmt) => {
                  const Icon = fmt.icon;
                  return (
                    <div key={fmt.value} className="relative">
                      <RadioGroupItem
                        value={fmt.value}
                        id={fmt.value}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={fmt.value}
                        className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        <Icon className="h-6 w-6 text-muted-foreground peer-data-[state=checked]:text-primary" />
                        <div className="flex-1">
                          <div className="font-medium">{fmt.label}</div>
                          <p className="text-sm text-muted-foreground">{fmt.description}</p>
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Filename */}
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value.replace(/[^a-z0-9\-_]/gi, '').toLowerCase())}
              placeholder="wall-assembly-export"
            />
            <p className="text-sm text-muted-foreground">
              File extension will be added automatically (.json, .csv, .xlsx, .pdf)
            </p>
          </div>

          {/* Export Info */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Export Summary</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Components:</strong> {components.length}</p>
              <p><strong>Total Thickness:</strong> {components.reduce((sum, c) => sum + c.thickness, 0).toFixed(0)} mm</p>
              <p><strong>R-Value:</strong> {performance.totalRValue.toFixed(3)} m²K/W</p>
              <p><strong>U-Value:</strong> {performance.uValue.toFixed(3)} W/m²K</p>
              <p><strong>Format:</strong> {format.toUpperCase()}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
