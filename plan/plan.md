## Folder Structure
Follow the current  folder structure and create new folders/files as necessary to align with next.js best practices.

## Steps to Implement

1. Update wall assembly logic
   - Differentiate between studded and solid walls.
   - For studded walls, split assemblies at the second floor (2.8m) level.
   - Ensure continuous wall assembly for solid walls.

2. Create a new house sample feature
   - Define a House model with default dimensions:
     - Ground floor: 7m x 10m (70sqm), height: 2.8m.
     - Second floor: height: 1m before roof slope begins.
   - The house model should be an object that is adjustable.

3. Adjust wall assembly configuration page button
   - Update the button to pass wall assembly arguments directly from the calculator wall to houseSamplePage.
   - Replace the placeholder pass with the actual wall assembly data for cost calculations.

4. Create a new roof assembly configuration
   - Create a roof assembly page (`roofConfigPage.tsx`) similar to wall assembly.
   - Allow parameters for:
     - Rafter design.
     - Insulation thickness (range: 10cm to 50cm).

5. Update the cost calculator utility
   - Extend it to compute overall cost for the house including walls and roof assemblies.
   - Implement cost summing logic based on input dimensions and selected assemblies.

## User Stories / Features

- As a user, I want to define a wall assembly for a house so that I can generate a sample house with the correct dimensions.
- As a user, I need the house sample page to display the total cost of the walls based on my assembly configuration.
- As a user, I want to define a roof assembly with customizable insulation and rafter details so that I can see the full house cost.
- As a user, I can adjust the house dimensions (default: 7m x 10m with 2 floors) so the model is extensible.