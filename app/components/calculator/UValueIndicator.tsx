interface UValueIndicatorProps {
  uValue: number;
}

export function UValueIndicator({ uValue }: UValueIndicatorProps) {
  // Map uValue to position percentage (0-1 scale)
  const position = Math.min(Math.max((uValue / 1.0) * 100, 0), 100);
  
  return (
    <div className="mt-4 p-4 border rounded">
      <h3 className="text-lg font-semibold mb-2">U-Value Performance</h3>
      <div className="relative h-8 w-full rounded-full overflow-hidden">
        {/* Gradient background */}
        <div 
          className="absolute inset-0" 
          style={{
            background: 'linear-gradient(to right, #22c55e, #fbbf24, #ef4444)',
          }}
        />
        
        {/* Vertical marker lines */}
        <div className="absolute inset-0">
          <div className="absolute h-full w-0.5 bg-gray-300/50" style={{ left: '15%' }} />
          <div className="absolute h-full w-0.5 bg-gray-300/50" style={{ left: '30%' }} />
          <div className="absolute h-full w-0.5 bg-gray-300/50" style={{ left: '50%' }} />
          <div className="absolute h-full w-0.5 bg-gray-300/50" style={{ left: '100%' }} />
        </div>
        
        {/* Indicator line */}
        <div 
          className="absolute w-0.5 h-full bg-black"
          style={{
            left: `${position}%`,
            transition: 'left 0.3s ease-in-out',
            zIndex: 10
          }}
        />

        {/* Performance markers - aligned with vertical lines */}
        <div className="absolute inset-0 flex items-center text-xs font-medium text-white">
          <span className="absolute left-2">0</span>
          <span className="absolute" style={{ left: '15%' }}>0.15</span>
          <span className="absolute" style={{ left: '30%' }}>0.3</span>
          <span className="absolute" style={{ left: '50%' }}>0.5</span>
          <span className="absolute" style={{ left: '100%', transform: 'translateX(-100%)' }}>1.0</span>
        </div>
      </div>

      {/* Performance labels */}
      <div className="flex justify-between mt-1 text-sm">
        <span>Excellent</span>
        <span>Good</span>
        <span>Moderate</span>
        <span>Poor</span>
      </div>

      {/* Current value */}
      <div className="text-center mt-2">
        <span className="font-medium">
          Current U-Value: {uValue.toFixed(3)} W/m²K - 
          {uValue <= 0.15 && " Excellent"}
          {uValue > 0.15 && uValue <= 0.3 && " Good"}
          {uValue > 0.3 && uValue <= 0.5 && " Moderate"}
          {uValue > 0.5 && " Poor"}
        </span>
      </div>
    </div>
  );
}
