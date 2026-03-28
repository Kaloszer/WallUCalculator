"use client";

import { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { ReportConfig, downloadPDFReport } from '@/lib/utils/reporting';
import { ReportData } from '@/lib/utils/reporting';

interface ReportGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportData: ReportData;
}

export function ReportGenerator({ open, onOpenChange, reportData }: ReportGeneratorProps) {
  const [config, setConfig] = useState<ReportConfig>({
    projectName: '',
    companyName: '',
    logoUrl: '',
    author: '',
    dateFormat: 'yyyy-MM-dd',
    includeRecommendations: true,
    includeCharts: true,
    includeCompliance: true
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    try {
      downloadPDFReport(reportData, config, config.projectName || 'wall-assembly-report');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate PDF Report</DialogTitle>
          <DialogDescription>
            Configure report options and generate a professional PDF document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="My Wall Assembly"
                  value={config.projectName}
                  onChange={(e) => setConfig({ ...config, projectName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  placeholder="Your Name"
                  value={config.author}
                  onChange={(e) => setConfig({ ...config, author: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Branding</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Construction Co."
                  value={config.companyName}
                  onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  placeholder="https://example.com/logo.png"
                  value={config.logoUrl}
                  onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  URL to a PNG or JPG image. Recommended size: 200x60px.
                </p>
              </div>
            </div>
          </div>

          {/* Date Format */}
          <div className="space-y-2">
            <Label htmlFor="dateFormat">Date Format</Label>
            <select
              id="dateFormat"
              className="w-full px-3 py-2 border rounded-md"
              value={config.dateFormat}
              onChange={(e) => setConfig({ ...config, dateFormat: e.target.value as any })}
            >
              <option value="yyyy-MM-dd">2024-03-28 (ISO)</option>
              <option value="MM/dd/yyyy">03/28/2024 (US)</option>
              <option value="dd/MM/yyyy">28/03/2024 (European)</option>
            </select>
          </div>

          {/* Report Sections */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Report Sections</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="includeRecommendations">Recommendations</Label>
                  <p className="text-sm text-muted-foreground">
                    Include improvement suggestions based on analysis
                  </p>
                </div>
                <Switch
                  id="includeRecommendations"
                  checked={config.includeRecommendations}
                  onCheckedChange={(checked: boolean) =>
                    setConfig({ ...config, includeRecommendations: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="includeCharts">Charts</Label>
                  <p className="text-sm text-muted-foreground">
                    Include visual charts in the report
                  </p>
                </div>
                <Switch
                  id="includeCharts"
                  checked={config.includeCharts}
                  onCheckedChange={(checked: boolean) =>
                    setConfig({ ...config, includeCharts: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="includeCompliance">Compliance Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Include building code compliance checks
                  </p>
                </div>
                <Switch
                  id="includeCompliance"
                  checked={config.includeCompliance}
                  onCheckedChange={(checked: boolean) =>
                    setConfig({ ...config, includeCompliance: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Report Preview</h4>
            <div className="space-y-2 text-sm">
              <p><strong>Project:</strong> {config.projectName || 'Untitled Project'}</p>
              <p><strong>Author:</strong> {config.author || 'Not specified'}</p>
              <p><strong>Company:</strong> {config.companyName || 'Not specified'}</p>
              <p><strong>U-Value:</strong> {reportData.performance.uValue.toFixed(3)} W/m²K</p>
              <p><strong>R-Value:</strong> {reportData.performance.totalRValue.toFixed(3)} m²K/W</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
