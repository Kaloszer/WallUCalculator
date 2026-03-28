"use client";

import { useMemo } from "react";

/**
 * Condensation Alert Component
 *
 * Displays moisture risk notifications with severity levels
 * and provides timeline of condensation events.
 */

interface CondensationEvent {
  month: number;
  monthName: string;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  moistureAccumulation: number;
  affectedLayers: string[];
}

interface CondensationAlertProps {
  condensationRisk: 'none' | 'low' | 'medium' | 'high' | 'critical';
  monthlyData: Array<{
    month: number;
    monthName: string;
    totalAccumulation: number;
    layerData: Array<{
      material: string;
      hasCondensation: boolean;
      moistureAccumulation?: number;
    }>;
  }>;
  dryingPotential: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'none':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'none':
      return '✓';
    case 'low':
      return '⚠';
    case 'medium':
      return '⚠️';
    case 'high':
      return '🔶';
    case 'critical':
      return '🔴';
    default:
      return '•';
  }
}

export function CondensationAlert({
  condensationRisk,
  monthlyData,
  dryingPotential,
}: CondensationAlertProps) {
  const condensationEvents = useMemo<CondensationEvent[]>(() => {
    return monthlyData
      .filter(month => month.totalAccumulation > 0)
      .map(month => {
        const affectedLayers = month.layerData
          .filter(layer => layer.hasCondensation)
          .map(layer => layer.material);

        let severity: CondensationEvent['severity'] = 'low';
        if (month.totalAccumulation > 0.5) severity = 'critical';
        else if (month.totalAccumulation > 0.3) severity = 'high';
        else if (month.totalAccumulation > 0.1) severity = 'medium';

        return {
          month: month.month,
          monthName: month.monthName,
          severity,
          moistureAccumulation: month.totalAccumulation,
          affectedLayers,
        };
      });
  }, [monthlyData]);

  const getRiskMessage = (risk: typeof condensationRisk): string => {
    switch (risk) {
      case 'none':
        return 'No condensation risk detected. Wall assembly is well-designed for moisture management.';
      case 'low':
        return 'Minimal condensation risk. Monitor moisture levels during extreme weather conditions.';
      case 'medium':
        return 'Moderate condensation risk detected. Consider improving vapor control measures.';
      case 'high':
        return 'High condensation risk. Immediate attention recommended - review vapor barrier placement.';
      case 'critical':
        return 'Critical condensation risk! Urgent action required - significant moisture damage likely.';
      default:
        return 'Unable to assess condensation risk.';
    }
  };

  const getDryingMessage = (potential: typeof dryingPotential): string => {
    switch (potential) {
      case 'excellent':
        return 'Excellent drying potential. Wall assembly can effectively dry out moisture.';
      case 'good':
        return 'Good drying potential. Moisture can dissipate under normal conditions.';
      case 'moderate':
        return 'Moderate drying potential. Some moisture may persist in wall cavity.';
      case 'poor':
        return 'Poor drying potential. Moisture retention is likely, increasing long-term risk.';
      case 'critical':
        return 'Critical drying potential. Moisture will accumulate and cause damage.';
      default:
        return 'Unable to assess drying potential.';
    }
  };

  const riskColor = getSeverityColor(condensationRisk);
  const dryingColor = getSeverityColor(dryingPotential);

  return (
    <div className="space-y-4">
      {/* Overall Risk Assessment */}
      <div className={`p-4 border rounded-md ${riskColor}`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{getSeverityIcon(condensationRisk)}</span>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">
              Condensation Risk: {condensationRisk.charAt(0).toUpperCase() + condensationRisk.slice(1)}
            </h3>
            <p className="text-sm opacity-90">{getRiskMessage(condensationRisk)}</p>
          </div>
        </div>
      </div>

      {/* Drying Potential Assessment */}
      <div className={`p-4 border rounded-md ${dryingColor}`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{getSeverityIcon(dryingPotential)}</span>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">
              Drying Potential: {dryingPotential.charAt(0).toUpperCase() + dryingPotential.slice(1)}
            </h3>
            <p className="text-sm opacity-90">{getDryingMessage(dryingPotential)}</p>
          </div>
        </div>
      </div>

      {/* Condensation Timeline */}
      {condensationEvents.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Condensation Event Timeline</h3>
          <div className="space-y-2">
            {condensationEvents.map((event, idx) => (
              <div
                key={idx}
                className={`p-3 border rounded-md ${getSeverityColor(event.severity)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getSeverityIcon(event.severity)}</span>
                    <span className="font-semibold">{event.monthName}</span>
                  </div>
                  <span className="text-sm font-medium uppercase">
                    {event.severity}
                  </span>
                </div>
                <p className="text-sm mb-1">
                  Moisture accumulation: <span className="font-semibold">
                    {event.moistureAccumulation.toFixed(3)} kg/m²
                  </span>
                </p>
                {event.affectedLayers.length > 0 && (
                  <p className="text-xs opacity-75">
                    Affected layers: {event.affectedLayers.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h4 className="font-semibold text-gray-800 mb-1">Critical Events</h4>
          <p className="text-2xl font-bold text-gray-600">
            {condensationEvents.filter(e => e.severity === 'critical').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Months with critical risk
          </p>
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h4 className="font-semibold text-gray-800 mb-1">Total Events</h4>
          <p className="text-2xl font-bold text-gray-600">
            {condensationEvents.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Months with any condensation
          </p>
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h4 className="font-semibold text-gray-800 mb-1">Peak Accumulation</h4>
          <p className="text-2xl font-bold text-gray-600">
            {Math.max(...monthlyData.map(m => m.totalAccumulation)).toFixed(3)} kg/m²
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Highest monthly accumulation
          </p>
        </div>
      </div>

      {/* Recommendations */}
      {(condensationRisk === 'high' || condensationRisk === 'critical') && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-md">
          <h4 className="font-semibold text-red-800 mb-2">Recommended Actions</h4>
          <ul className="space-y-1 text-sm text-red-700">
            <li>• Review vapor barrier placement - ensure proper orientation</li>
            <li>• Consider adding or upgrading vapor retarder</li>
            <li>• Improve wall assembly drying potential</li>
            <li>• Evaluate insulation material moisture resistance</li>
            <li>• Consider mechanical ventilation improvements</li>
          </ul>
        </div>
      )}

      {(condensationRisk === 'medium') && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-md">
          <h4 className="font-semibold text-amber-800 mb-2">Considerations</h4>
          <ul className="space-y-1 text-sm text-amber-700">
            <li>• Monitor moisture levels during seasonal transitions</li>
            <li>• Consider secondary vapor control layer</li>
            <li>• Evaluate local climate patterns</li>
            <li>• Review material specifications for hygroscopic properties</li>
          </ul>
        </div>
      )}
    </div>
  );
}
