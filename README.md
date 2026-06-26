# WallU Calculator

A web-based calculator application for computing thermal transmittance (U-value) of walls with advanced moisture analysis and 3D visualization.

## Technologies Used

- **Bun** - JavaScript runtime & package manager
- **Next.js** - React framework with App Router
- **TypeScript** - For type-safe code
- **Tailwind CSS** - For styling
- **React** - UI library
- **Chart.js** - For data visualization
- **Three.js** - For 3D wall visualization

## Project Structure

The project is organized with a domain-driven design pattern separating business logic from UI components:

```text
WallUCalculator/
├── app/                      # Next.js App Router directory (UI layer)
│   ├── components/         # React components
│   │   ├── calculator/    # Main calculator components
│   │   └── ...
│   └── page.tsx
├── lib/                      # Business logic layer
│   ├── calculations/        # Core calculation functions
│   │   ├── rValue.ts       # R-value and U-value calculations
│   │   ├── dewPoint.ts      # Dew point calculations
│   │   ├── temperatureGradient.ts  # Temperature/vapor pressure gradients
│   │   └── cost.ts          # Cost and ROI calculations
│   ├── types/             # Domain types
│   │   └── domain.ts       # Core domain model types
│   ├── constants/          # Configuration constants
│   │   ├── materials.ts    # Material database
│   │   ├── studWalls.ts    # Stud wall configurations
│   │   └── calculations.ts  # Physical constants
│   ├── utils/              # Utility functions
│   │   ├── materialHelpers.ts  # Material-related utilities
│   │   └── chartHelpers.ts     # Chart configuration helpers
│   └── __tests__/           # Test files
│       └── calculations/     # Calculation function tests
```

## Architecture

### Domain Layer (lib/)

The domain layer contains all business logic and is independent of the UI:

- **Types** (`lib/types/domain.ts`): Core domain model types
- **Calculations** (`lib/calculations/`): All thermal and moisture calculations
- **Constants** (`lib/constants/`): Material data, configurations, and physical constants
- **Utils** (`lib/utils/`): Helper functions for materials, charts, and formatting

### UI Layer (app/)

The UI layer contains React components that consume the domain layer:

- **Calculator**: Main component with drag-and-drop wall assembly
- **Visualizations**: 2D and 3D wall representations
- **Analysis**: Dew point and temperature gradient displays

### Benefits of This Architecture

- **Testability**: Business logic can be tested independently of React
- **Reusability**: Calculation functions can be used across components
- **Maintainability**: Clear separation of concerns
- **Type Safety**: Domain types provide strong typing

## Key Features

- Wall assembly configuration with drag-and-drop reordering
- R-value and U-value calculations following ISO 6946 standards
- Dew point analysis with condensation risk detection
- Temperature gradient visualization
- Vapor pressure gradient analysis
- 3D wall visualization with Three.js
- Interactive chart displays
- Example wall presets
- Stud wall configuration (standard, i-joist, none)
- Cost and effectiveness calculations

## Local Development

### Prerequisites

- Install [Bun](https://bun.sh/docs/installation)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/Kaloszer/WallUCalculator.git
cd WallUCalculator
```

2. Install dependencies:

```bash
bun install
```

3. Run development server:

```bash
bun run dev
```

4. Build for production:

```bash
bun run build
```

5. Run tests:

```bash
bun test
```

## Navigate to GitHub Pages

<https://kaloszer.github.io/WallUCalculator/>

## Testing

The project includes comprehensive tests for the domain layer:

```bash
bun test
```

Tests are located in `lib/__tests__/calculations/` and cover:

- R-value calculations
- Dew point calculations
- U-value conversions
- Component R-value contributions

## Performance Optimizations

The application uses React performance best practices:

- **useCallback**: Event handlers are memoized to prevent unnecessary re-renders
- **useMemo**: Expensive calculations are cached
- **React.memo**: Presentational components are memoized
- **Proper Hook Order**: useState hooks are declared before useMemo

## Domain Layer API

The domain layer provides these key functions:

### R-value Calculations

```typescript
import {
  calculateComponentRValue,
  calculateTotalRValue,
  calculateUValue,
  calculateRValueContributions
} from '@/lib/calculations/rValue';
```

### Dew Point Calculations

```typescript
import {
  calculateDewPoint,
  calculateSaturationPressure,
  willCondensationOccur,
  getCondensationRiskLevel
} from '@/lib/calculations/dewPoint';
```

### Temperature Gradient

```typescript
import {
  calculateTemperatures,
  calculateVaporPressureGradient,
  checkCondensationRisk,
  findDewPointPosition,
  getTemperatureDataPoints
} from '@/lib/calculations/temperatureGradient';
```

### Cost Calculations

```typescript
import {
  calculateComponentCost,
  calculateTotalCost,
  calculateCostEffectiveness,
  calculateInsulationROI
} from '@/lib/calculations/cost';
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Ensure all business logic goes in the `lib/calculations/` directory
2. Use TypeScript strict mode
3. Add tests for new calculation functions
4. Follow the existing code style and patterns
5. Run tests before committing changes

## License

This project is open source and available under the MIT License.
