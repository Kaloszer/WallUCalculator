'use client'

import { createContext, useContext, useState, ReactNode } from 'react';
import { WallComponent, StudWallType, studWallConfigs, StudWallConfig, ExampleWall } from '../types';

interface WallCalculatorContextType {
  components: WallComponent[];
  studWallType: StudWallType;
  iJoistDepth: number;
  nextId: number;
  addComponent: () => void;
  updateComponent: (id: number, updates: Partial<WallComponent>) => void;
  removeComponent: (id: number) => void;
  toggleStuds: (id: number) => void;
  setStudWallType: (type: StudWallType) => void;
  setIJoistDepth: (depth: number) => void;
  reorderComponents: (fromIndex: number, toIndex: number) => void;
  getStudConfig: () => StudWallConfig;
  loadExampleWall: (example: ExampleWall) => void;
}

const WallCalculatorContext = createContext<WallCalculatorContextType | undefined>(undefined);

export function WallCalculatorProvider({ children }: { children: ReactNode }) {
  const [components, setComponents] = useState<WallComponent[]>([]);
  const [nextId, setNextId] = useState(1);
  const [studWallType, setStudWallType] = useState<StudWallType>('none');
  const [iJoistDepth, setIJoistDepth] = useState(200);

  const addComponent = () => {
    if (components.length >= 8) return;
    setComponents([...components, { 
      id: nextId, 
      material: "", 
      thickness: 0, 
      conductivity: 0, 
      isInsulation: false,
      hasStuds: false 
    }]);
    setNextId(nextId + 1);
  };

  const updateComponent = (id: number, updates: Partial<WallComponent>) => {
    if (updates.thickness && updates.thickness < 0) return;
    setComponents(components.map(comp => 
      comp.id === id ? { ...comp, ...updates } : comp
    ));
  };

  const removeComponent = (id: number) => {
    setComponents(components.filter(comp => comp.id !== id));
  };

  const toggleStuds = (id: number) => {
    setComponents(components.map(comp => {
      if (comp.id === id) {
        return { ...comp, hasStuds: !comp.hasStuds };
      }
      if (comp.hasStuds && comp.id !== id) {
        return { ...comp, hasStuds: false };
      }
      return comp;
    }));
  };

  const reorderComponents = (fromIndex: number, toIndex: number) => {
    setComponents(prevComponents => {
      const newComponents = [...prevComponents];
      const [removed] = newComponents.splice(fromIndex, 1);
      newComponents.splice(toIndex, 0, removed);
      return newComponents;
    });
  };

  const getStudConfig = () => {
    const baseConfig = studWallConfigs[studWallType];
    if (studWallType === 'i-joist') {
      return {
        ...baseConfig,
        studDepth: iJoistDepth
      };
    }
    return baseConfig;
  };

  const loadExampleWall = (example: ExampleWall) => {
    setComponents(example.components.map((comp, index) => ({
      ...comp,
      id: index + 1
    })));
    setNextId(example.components.length + 1);
    setStudWallType(example.studWallType || 'none');
  };

  return (
    <WallCalculatorContext.Provider value={{
      components,
      studWallType,
      iJoistDepth,
      nextId,
      addComponent,
      updateComponent,
      removeComponent,
      toggleStuds,
      setStudWallType,
      setIJoistDepth,
      reorderComponents,
      getStudConfig,
      loadExampleWall,
    }}>
      {children}
    </WallCalculatorContext.Provider>
  );
}

export function useWallCalculator() {
  const context = useContext(WallCalculatorContext);
  if (context === undefined) {
    throw new Error('useWallCalculator must be used within a WallCalculatorProvider');
  }
  return context;
}