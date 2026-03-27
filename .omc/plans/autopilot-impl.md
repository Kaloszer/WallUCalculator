# WallUCalculator Implementation Plan

## Overview
This plan outlines the implementation steps for refactoring and enhancing the WallUCalculator codebase based on the specification in `.omc/autopilot/spec.md`.

## Implementation Approach
- **Strategy**: Incremental refactoring with feature additions
- **Workflow**: Test-driven development with continuous validation
- **Branch**: `feature/wall-calculator-improvements`
- **Deployment**: GitHub Pages (production)

## Phase 1: Foundation Refactoring (Days 1-3)

### 1.1 Extract Business Logic (Day 1)

#### Tasks:
1. **Create calculation utilities**
   - `lib/calculations/rValue.ts`
     - Extract `calculateRValue` from types.ts
     - Extract `calculateTotalRValue` from types.ts
     - Extract `calculateUValue` from types.ts
     - Add comprehensive JSDoc
     - Add unit tests

2. **Create dew point utilities**
   - `lib/calculations/dewPoint.ts`
     - Extract dew point calculation logic
     - Magnus-Tetens formula implementation
     - Input validation
     - Unit tests

3. **Create temperature gradient utilities**
   - Extract from `TemperatureGradientDisplay.tsx`
   - `lib/calculations/temperatureGradient.ts`
   - Functions: `calculateTemperatures`, `calculateVaporPressureGradient`, `checkCondensationRisk`, `findDewPointPosition`
   - Unit tests for each function

4. **Create cost utilities**
   - `lib/calculations/cost.ts`
     - Extract cost calculations from `WallVisualization.tsx`
     - Add effectiveness calculations
     - Unit tests

5. **Create domain types**
   - `lib/types/domain.ts`
     - Separate domain types from UI types
     - Add validation schemas
     - Create discriminated unions

6. **Create constants**
   - `lib/constants/materials.ts` - Material database
   - `lib/constants/studWalls.ts` - Stud wall configurations
   - `lib/constants/calculations.ts` - Calculation constants

#### Deliverables:
- [ ] 6 new utility files with complete implementation
- [ ] Unit tests for all calculation functions
- [ ] Types properly separated

#### Validation:
- [ ] All existing tests pass
- [ ] New unit tests pass
- [ ] TypeScript compiles without errors

### 1.2 Component Decomposition (Day 2)

#### Tasks:
1. **Split Calculator.tsx**
   - `app/components/calculator/WallAssemblyTab.tsx`
     - Assembly configuration UI
     - Component table and drag-drop
     - Material selection

   - `app/components/calculator/AnalysisTab.tsx`
     - Dew point analysis
     - Temperature gradient display
     - Risk assessment

   - `app/components/calculator/VisualizationTab.tsx`
     - 2D/3D visualization tabs
     - House sample link
     - Visualization controls

2. **Split WallVisualization3D.tsx**
   - `app/components/calculator/3d/WallMesh.tsx`
     - Wall mesh rendering logic
     - Material display

   - `app/components/calculator/3d/StudRenderer.tsx`
     - Stud visualization
     - I-joist and standard studs

   - `app/components/calculator/3d/DewPointIndicator.tsx`
     - Dew point plane rendering
     - Positioning logic

   - `app/components/calculator/3d/WallCanvas.tsx`
     - Canvas setup
     - OrbitControls configuration
     - Lighting setup

3. **Split TemperatureGradientDisplay.tsx**
   - `app/components/calculator/charts/GradientChart.tsx`
     - Chart.js configuration
     - Data formatting

   - `app/components/calculator/charts/RiskSummary.tsx`
     - Risk assessment display
     - Condensation warnings

4. **Refactor Context**
   - Split `WallCalculatorContext.tsx`:
     - `WallCalculatorProvider` - Core state
     - `useWallCalculator` - Custom hook
     - Extract actions to separate hooks:
       - `useWallActions.ts`
       - `useStudConfiguration.ts`

#### Deliverables:
- [ ] 8 new component files
- [ ] Refactored context provider
- [ ] All components < 200 lines

#### Validation:
- [ ] All E2E tests pass
- [ ] No visual regressions
- [ ] TypeScript compiles

### 1.3 Consolidate Duplicate Logic (Day 3)

#### Tasks:
1. **Create material helpers**
   - `lib/utils/materialHelpers.ts`
     - `getComponentColor()` - Extract from visualizationHelpers
     - `getMaterialById()`
     - `validateMaterialInput()`
     - `isInsulationMaterial()`

2. **Create chart helpers**
   - `lib/utils/chartHelpers.ts`
     - Common chart options
     - Chart data formatters
     - Chart theme configuration

3. **Consolidate color mapping**
   - Single source of truth for material colors
   - Move to constants
   - Remove duplicates

#### Deliverables:
- [ ] 2 new utility files
- [ ] 0% duplicate code
- [ ] All references updated

#### Validation:
- [ ] ESLint no-dupes passes
- [ ] Tests pass
- [ ] Visual consistency verified

## Phase 2: Performance Optimization (Days 4-5)

### 2.1 Rendering Optimization (Day 4)

#### Tasks:
1. **Add React.memo()**
   - Memoize expensive components:
     - `WallVisualization3D`
     - `GradientChart`
     - `SortableTableRow`
     - `StudRenderer`

2. **Optimize calculations**
   - Add `useMemo()` for:
     - R-value calculations
     - Total cost calculations
     - Chart data transformation
     - Dew point position

3. **Optimize callbacks**
   - Add `useCallback()` for:
     - Event handlers in Calculator
     - Drag and drop handlers
     - Chart interactions

4. **Fix key props**
   - Ensure all lists have proper keys
   - Use stable keys (IDs instead of indices)

#### Deliverables:
- [ ] All expensive components memoized
- [ ] Computed values memoized
- [ ] Callbacks stabilized

#### Validation:
- [ ] React DevTools Profiler shows reduced renders
- [ ] Performance budget met (< 16ms per frame)

### 2.2 Code Splitting (Day 5)

#### Tasks:
1. **Lazy load 3D components**
   - Dynamic import for `WallVisualization3D`
   - Loading state while loading
   - Error boundary

2. **Lazy load chart components**
   - Dynamic import for chart components
   - Suspense boundaries
   - Fallback UI

3. **Route-based splitting**
   - Already using Next.js app router
   - Verify proper splitting

4. **Optimize bundle**
   - Analyze bundle with webpack-bundle-analyzer
   - Remove unused dependencies
   - Tree-shake Three.js imports

#### Deliverables:
- [ ] Dynamic imports implemented
- [ ] Bundle size reduced by 20%
- [ ] Initial load < 2s on 3G

#### Validation:
- [ ] Lighthouse performance score 95+
- [ ] Bundle analyzer shows improvements
- [ ] All features work after lazy load

## Phase 3: UX Enhancements (Days 6-8)

### 3.1 Responsive Design (Day 6)

#### Tasks:
1. **Add responsive breakpoints**
   - Update `tailwind.config.ts` with custom breakpoints
   - Mobile-first approach
   - Test on 320px, 768px, 1024px, 1440px

2. **Mobile table optimization**
   - Collapsible table rows
   - Horizontal scroll for complex tables
   - Stack layout on mobile
   - Touch-friendly controls

3. **Responsive 3D canvas**
   - Adjust canvas size based on viewport
   - Touch controls for mobile
   - Simplified 3D on small screens

#### Deliverables:
- [ ] Responsive layouts for all pages
- [ ] Mobile-optimized tables
- [ ] Touch-friendly controls

#### Validation:
- [ ] Works on 320px - 2560px
- [ ] Mobile usability test passes
- [ ] No horizontal scroll on desktop

### 3.2 Accessibility (Day 7)

#### Tasks:
1. **Add ARIA labels**
   - All interactive elements labeled
   - Descriptive labels for charts
   - Live regions for dynamic content

2. **Keyboard navigation**
   - Full keyboard support for all features
   - Drag-and-drop keyboard alternative
   - Visible focus indicators
   - Skip links for navigation

3. **Screen reader support**
   - Alt text for visualizations
   - Chart data in accessible format
   - Table captions and summaries

4. **Color contrast**
   - Validate all color combinations
   - Adjust colors if needed (WCAG AA)
   - High contrast mode support (optional)

5. **Error accessibility**
   - Screen reader announcements for errors
   - Clear error messages
   - Recovery instructions

#### Deliverables:
- [ ] WCAG 2.1 AA compliant
- [ ] Full keyboard navigation
- [ ] Screen reader tested

#### Validation:
- [ ] Axe DevTools passes
- [ ] WAVE evaluation passes
- [ ] Keyboard-only navigation works

### 3.3 Error Handling (Day 8)

#### Tasks:
1. **Add error boundaries**
   - Create `components/ErrorBoundary.tsx`
   - Wrap major component trees
   - Fallback UI with recovery options

2. **Loading states**
   - Skeleton loaders for slow components
   - Progress indicators for calculations
   - Loading states for async data

3. **Graceful degradation**
   - Fallback for missing WebGL
   - Simplified view without 3D
   - Offline-friendly messaging

4. **Retry mechanisms**
   - Retry buttons for failed operations
   - Auto-retry for transient errors
   - Clear success/failure feedback

#### Deliverables:
- [ ] Error boundary component
- [ ] Loading states everywhere
- [ ] Graceful degradation paths

#### Validation:
- [ ] Error scenarios tested
- [ ] Recovery options work
- [ ] No unhandled errors

## Phase 4: New Features (Days 9-13)

### 4.1 Wall Presets Library (Day 9)

#### Tasks:
1. **Create preset system**
   - `lib/presets/wallPresets.ts`
     - 20+ preset configurations
     - Categorized by use case
     - Metadata (name, description, tags)

2. **Preset selector component**
   - `app/components/calculator/PresetSelector.tsx`
     - Search and filter
     - Category tabs
     - Preview cards

3. **Custom preset saving**
   - LocalStorage integration
   - Save current assembly as preset
   - Load custom presets
   - Delete custom presets

#### Deliverables:
- [ ] 20+ wall presets
- [ ] Preset selector UI
- [ ] Custom preset save/load

#### Validation:
- [ ] Presets load correctly
- [ ] Custom presets persist
- [ ] All presets calculate correctly

### 4.2 Comparison Tool (Day 10)

#### Tasks:
1. **Comparison state**
   - New context for comparison mode
   - Add comparison actions

2. **Comparison UI**
   - `app/components/calculator/ComparisonTool.tsx`
     - Side-by-side view
     - Metric comparison table
     - Highlight differences

3. **Export comparison**
   - PDF generation
   - CSV export
   - Print-friendly layout

#### Deliverables:
- [ ] Comparison mode functionality
- [ ] Side-by-side UI
- [ ] Export to PDF/CSV

#### Validation:
- [ ] Comparisons accurate
- [ ] Exports work correctly
- [ ] Print layout works

### 4.3 Export & Sharing (Day 11)

#### Tasks:
1. **Export utilities**
   - `lib/utils/exporters.ts`
     - Export to JSON
     - Export to PDF
     - Export to CSV

2. **Share functionality**
   - Generate shareable URL
   - Copy to clipboard
   - URL validation and parsing

3. **Print optimization**
   - Print-specific styles
   - Hide controls in print
   - Professional layout

#### Deliverables:
- [ ] Export to JSON/PDF/CSV
- [ ] Shareable URLs
- [ ] Print-friendly layout

#### Validation:
- [ ] All exports work
- [ ] URLs are valid
- [ ] Print preview correct

### 4.4 Advanced Analysis (Day 12)

#### Tasks:
1. **Seasonal analysis**
   - Monthly calculations
   - Seasonal risk assessment
   - Charts showing variation

2. **Energy cost estimation**
   - Heating/cooling calculations
   - Cost projections
   - ROI calculator

3. **Material recommendations**
   - Algorithm for optimal materials
   - Cost-benefit analysis
   - Suggestion system

#### Deliverables:
- [ ] Seasonal analysis view
- [ ] Energy cost projections
- [ ] Material recommendations

#### Validation:
- [ ] Calculations accurate
- [ ] Recommendations sensible
- [ ] Results display correctly

### 4.5 3D Enhancements (Day 13)

#### Tasks:
1. **Measurement tools**
   - Distance measurement
   - Thickness indicators
   - Scale display

2. **Multiple orientations**
   - Wall rotation controls
   - Different viewing angles
   - Exploded view toggle

3. **Thermal simulation**
   - Color-coded temperature
   - Heat map visualization
   - Animated temperature flow

#### Deliverables:
- [ ] Measurement tools
- [ ] Multiple orientations
- [ ] Thermal simulation

#### Validation:
- [ ] 3D features work smoothly
- [ ] No performance degradation
- [ ] Visual quality maintained

## Phase 5: Testing (Days 14-16)

### 5.1 Test Suite Creation (Days 14-15)

#### Tasks:
1. **Unit tests**
   - All calculation functions
   - Utility functions
   - Custom hooks
   - Target: 80%+ coverage

2. **Component tests**
   - All components with React Testing Library
   - User interactions
   - Edge cases

3. **Integration tests**
   - Complete user flows
   - State changes
   - Component interactions

4. **Visual regression tests**
   - Screenshots for 3D components
   - Compare against baseline
   - Allow for acceptable changes

#### Deliverables:
- [ ] Comprehensive unit test suite
- [ ] Component tests
- [ ] Integration tests
- [ ] Visual regression tests

#### Validation:
- [ ] 80%+ code coverage
- [ ] All tests pass
- [ ] CI/CD runs tests

### 5.2 CI/CD Improvements (Day 16)

#### Tasks:
1. **Parallel test execution**
   - Split test suite
   - Run in parallel workers
   - Optimize test time

2. **Coverage reporting**
   - Generate coverage reports
   - Upload to coverage service
   - Set minimum thresholds

3. **Performance checks**
   - Lighthouse CI
   - Bundle size monitoring
   - Performance regression tests

4. **Quality gates**
   - Lint checks in CI
   - Type checking
   - Format validation

#### Deliverables:
- [ ] Optimized CI/CD pipeline
- [ ] Coverage reports
- [ ] Performance monitoring

#### Validation:
- [ ] CI/CD runs successfully
- [ ] Coverage reports generated
- [ ] Performance thresholds met

## Phase 6: Documentation (Days 17-18)

### 6.1 Code Documentation (Day 17)

#### Tasks:
1. **JSDoc comments**
   - All public functions
   - Complex algorithms
   - Type definitions

2. **Architecture documentation**
   - Component hierarchy
   - Data flow diagrams
   - Design patterns

3. **Inline comments**
   - Non-obvious logic
   - Formula explanations
   - Trade-off notes

#### Deliverables:
- [ ] Complete API documentation
- [ ] Architecture diagrams
- [ ] Inline comments

#### Validation:
- [ ] Documentation builds
- [ ] No missing JSDoc warnings
- [ ] Clear explanations

### 6.2 User Documentation (Day 18)

#### Tasks:
1. **User guide**
   - Getting started
   - Feature tutorials
   - Examples and use cases

2. **FAQ section**
   - Common questions
   - Troubleshooting
   - Best practices

3. **Feature documentation**
   - All features explained
   - Screenshots included
   - Video demonstrations (optional)

#### Deliverables:
- [ ] Comprehensive user guide
- [ ] FAQ section
- [ ] Feature docs

#### Validation:
- [ ] Documentation is clear
- [ ] All features covered
- [ ] Examples work

## Rollback Plan

### If Critical Issue Occurs:
1. **Immediate Actions**
   - Stop deployment
   - Roll back to previous commit
   - Assess impact

2. **Data Recovery**
   - No user data stored
   - Stateless operations
   - Safe to rollback

3. **Communication**
   - Notify users (if deployed)
   - Document issue
   - Plan fix

### Gradual Rollback Strategy:
- Feature flags for new features
- Incremental deployment
- Monitor for issues
- Quick rollback path

## Success Metrics

### Code Quality
- Average function length: < 50 lines
- Max component size: < 300 lines
- Duplicate code: 0%
- TypeScript errors: 0
- Lint warnings: 0

### Performance
- Initial load: < 2s (3G)
- Time to interactive: < 1s
- Lighthouse score: 95+
- Bundle size: -20% from baseline

### User Experience
- WCAG 2.1 AA compliant
- Responsive: 320px - 2560px
- Accessibility: 100% keyboard accessible
- Error recovery: 100% of cases

### Testing
- Test coverage: 80%+
- Unit tests: All functions
- Component tests: All components
- E2E tests: All critical paths

## Dependencies & Resources

### External Dependencies (No Changes Expected)
- Next.js 15.1.6+
- React 19+
- Three.js 0.170+
- Chart.js 4.4+
- Tailwind CSS 3.4+
- TypeScript 5.7+

### New Dependencies (If Needed)
- PDF generation library (jsPDF or similar)
- PDF export utility
- Chart annotations (already have chartjs-plugin-annotation)

### Development Tools
- TypeScript compiler
- ESLint
- Playwright
- Jest/Vitest (for unit tests)
- React Testing Library

## Branch & Deployment Strategy

### Branch Strategy
- **Main branch**: `main`
- **Feature branch**: `feature/wall-calculator-improvements`
- **Release tags**: `v0.2.0`, `v0.3.0`, etc.

### Deployment
1. Create feature branch from main
2. Implement changes in feature branch
3. Test thoroughly in feature branch
4. Create PR to main
5. Code review and approval
6. Merge to main
7. Deploy to GitHub Pages

### CI/CD Pipeline
1. Run linting and type checking
2. Run unit tests
3. Run component tests
4. Run E2E tests
5. Build production bundle
6. Deploy to GitHub Pages
7. Run post-deployment smoke tests

## Timeline Summary

| Phase | Days | Description |
|--------|-------|-------------|
| 1. Foundation | 3 | Extract logic, decompose components, consolidate duplicates |
| 2. Performance | 2 | Rendering optimization, code splitting |
| 3. UX | 3 | Responsive design, accessibility, error handling |
| 4. Features | 5 | Presets, comparison, export, analysis, 3D |
| 5. Testing | 3 | Unit tests, component tests, CI/CD |
| 6. Docs | 2 | Code docs, user docs |
| **Total** | **18** | **Complete implementation** |

## Next Steps

1. Create feature branch: `feature/wall-calculator-improvements`
2. Begin Phase 1.1: Extract business logic
3. Write tests concurrently with implementation
4. Commit frequently with descriptive messages
5. Run tests after each phase
6. Address issues immediately
7. Deploy when all phases complete

Ready to begin execution!
