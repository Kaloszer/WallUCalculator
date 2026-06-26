/**
 * Project Storage Utilities
 *
 * Save, load, and manage wall assembly projects
 * Includes undo/redo history with keyboard shortcuts
 * Includes project state persistence
 */

import {
  WallComponent,
  StudWallType,
  ExampleWall,
  StudWallConfig,
  Location,
  ClimateData,
  ComplianceStandard,
  ReportConfig
} from '../types/domain';

/**
 * Saved project structure
 */
export interface SavedProject {
  /** Unique project identifier */
  id: string;
  /** Project name */
  name: string;
  /** Wall components */
  components: WallComponent[];
  /** Stud wall type */
  studWallType: StudWallType;
  /** I-joist depth (if applicable) */
  iJoistDepth?: number;
  /** When project was saved */
  savedAt: string;
  /** Last modified timestamp */
  modifiedAt: string;
  /** Project metadata */
  metadata?: {
    /** Project description */
    description?: string;
    /** Tags */
    tags?: string[];
    /** Custom properties */
    custom?: Record<string, any>;
  };
}

/**
 * History state for undo/redo
 */
interface HistoryState {
  /** Components snapshot */
  components: WallComponent[];
  /** Stud wall type snapshot */
  studWallType: StudWallType;
  /** I-joist depth snapshot */
  iJoistDepth?: number;
  /** Timestamp when state was recorded */
  timestamp: string;
}

/**
 * History manager configuration
 */
interface HistoryConfig {
  /** Maximum history states to keep */
  maxHistory: number;
  /** Maximum redo states to keep */
  maxRedo: number;
}

const DEFAULT_HISTORY_CONFIG: HistoryConfig = {
  maxHistory: 10,
  maxRedo: 10
};

/**
 * Project storage manager with undo/redo support
 */
export class ProjectStorage {
  private history: HistoryState[] = [];
  private redoStack: HistoryState[] = [];
  private config: HistoryConfig;

  constructor(config: Partial<HistoryConfig> = {}) {
    this.config = { ...DEFAULT_HISTORY_CONFIG, ...config };
  }

  /**
   * Save current state to history
   */
  saveState(
    components: WallComponent[],
    studWallType: StudWallType,
    iJoistDepth?: number
  ): void {
    const state: HistoryState = {
      components: JSON.parse(JSON.stringify(components)),
      studWallType,
      iJoistDepth,
      timestamp: new Date().toISOString()
    };

    this.history.push(state);

    // Limit history size
    if (this.history.length > this.config.maxHistory) {
      this.history.shift();
    }

    // Clear redo stack on new action
    this.redoStack = [];
  }

  /**
   * Undo last action
   */
  undo(): HistoryState | null {
    if (this.history.length === 0) {
      return null;
    }

    const currentState = this.history.pop();
    if (!currentState) return null;

    // Get previous state
    const previousState = this.history[this.history.length - 1];

    // Save current state to redo stack
    this.redoStack.push(currentState);

    // Limit redo stack size
    if (this.redoStack.length > this.config.maxRedo) {
      this.redoStack.shift();
    }

    return previousState || null;
  }

  /**
   * Redo last undone action
   */
  redo(): HistoryState | null {
    if (this.redoStack.length === 0) {
      return null;
    }

    const nextState = this.redoStack.pop();
    if (!nextState) return null;

    // Restore to history
    this.history.push(nextState);

    return nextState;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.history.length > 1; // Need at least 2 states (current + previous)
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Get history size
   */
  getHistorySize(): number {
    return this.history.length;
  }

  /**
   * Get redo stack size
   */
  getRedoSize(): number {
    return this.redoStack.length;
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.history = [];
    this.redoStack = [];
  }
}

/**
 * Keyboard shortcut handler for undo/redo
 */
export class KeyboardShortcuts {
  private storage: ProjectStorage;
  private onUndo?: (state: HistoryState | null) => void;
  private onRedo?: (state: HistoryState | null) => void;

  constructor(
    storage: ProjectStorage,
    handlers: {
      onUndo?: (state: HistoryState | null) => void;
      onRedo?: (state: HistoryState | null) => void;
    }
  ) {
    this.storage = storage;
    this.onUndo = handlers.onUndo;
    this.onRedo = handlers.onRedo;
  }

  /**
   * Initialize keyboard shortcuts
   */
  initialize(): () => void {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (this.storage.canUndo()) {
          const state = this.storage.undo();
          this.onUndo?.(state);
        }
      }

      // Ctrl+Shift+Z or Ctrl+Y for redo
      if (
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z') ||
        ((event.ctrlKey || event.metaKey) && event.key === 'y')
      ) {
        event.preventDefault();
        if (this.storage.canRedo()) {
          const state = this.storage.redo();
          this.onRedo?.(state);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }
}

/**
 * Project manager for saving/loading projects
 */
export class ProjectManager {
  private storageKey = 'wall-assembly-projects';

  /**
   * Get all saved projects
   */
  getProjects(): SavedProject[] {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
      return [];
    } catch (error) {
      console.error('Failed to load projects:', error);
      return [];
    }
  }

  /**
   * Save a project
   */
  saveProject(project: SavedProject): boolean {
    try {
      const projects = this.getProjects();
      const existingIndex = projects.findIndex(p => p.id === project.id);

      if (existingIndex >= 0) {
        projects[existingIndex] = project;
      } else {
        projects.push(project);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(projects));
      return true;
    } catch (error) {
      console.error('Failed to save project:', error);
      return false;
    }
  }

  /**
   * Load a project by ID
   */
  loadProject(projectId: string): SavedProject | null {
    try {
      const projects = this.getProjects();
      return projects.find(p => p.id === projectId) || null;
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }

  /**
   * Delete a project
   */
  deleteProject(projectId: string): boolean {
    try {
      const projects = this.getProjects();
      const filtered = projects.filter(p => p.id !== projectId);
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      return false;
    }
  }

  /**
   * Update a project
   */
  updateProject(projectId: string, updates: Partial<SavedProject>): boolean {
    try {
      const projects = this.getProjects();
      const index = projects.findIndex(p => p.id === projectId);

      if (index < 0) return false;

      projects[index] = {
        ...projects[index],
        ...updates,
        modifiedAt: new Date().toISOString()
      };

      localStorage.setItem(this.storageKey, JSON.stringify(projects));
      return true;
    } catch (error) {
      console.error('Failed to update project:', error);
      return false;
    }
  }

  /**
   * Get recent projects (last 10)
   */
  getRecentProjects(limit: number = 10): SavedProject[] {
    const projects = this.getProjects();
    return projects
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
      .slice(0, limit);
  }

  /**
   * Search projects by name
   */
  searchProjects(query: string): SavedProject[] {
    const projects = this.getProjects();
    const lowerQuery = query.toLowerCase();

    return projects.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.metadata?.description?.toLowerCase().includes(lowerQuery) ||
      p.metadata?.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Create project from example wall
   */
  createFromExample(example: ExampleWall): SavedProject {
    return {
      id: Date.now().toString(),
      name: example.name,
      components: example.components.map((comp, index) => ({
        ...comp,
        id: index + 1
      })),
      studWallType: example.studWallType,
      iJoistDepth: example.iJoistDepth,
      savedAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };
  }

  /**
   * Import project from file
   */
  async importFromFile(file: File): Promise<SavedProject | null> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);

          // Validate structure
          if (!data.components || !Array.isArray(data.components)) {
            throw new Error('Invalid project structure');
          }

          const project: SavedProject = {
            id: Date.now().toString(),
            name: data.name || file.name.replace('.json', ''),
            components: data.components,
            studWallType: data.studWallType || 'none',
            iJoistDepth: data.iJoistDepth,
            savedAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            metadata: data.metadata
          };

          resolve(project);
        } catch (error) {
          console.error('Failed to import project:', error);
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Export project to file
   */
  exportToFile(project: SavedProject, filename: string): void {
    const jsonString = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Clear all projects
   */
  clearAllProjects(): boolean {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Failed to clear projects:', error);
      return false;
    }
  }
}

/**
 * Singleton instances
 */
export const projectStorage = new ProjectStorage();
export const projectManager = new ProjectManager();

// ============================================================================
// PROJECT STATE PERSISTENCE
// ============================================================================

const PROJECT_STATE_KEY = 'wallu_project_state';

/**
 * Project state interface
 */
export interface ProjectState {
  /** Current wall assembly components */
  currentAssembly?: {
    components: WallComponent[];
    studWallConfig?: StudWallConfig;
  };
  /** Selected location */
  location?: Location;
  /** Climate data for calculations */
  climateData?: ClimateData;
  /** Selected compliance standard */
  complianceStandard?: ComplianceStandard;
  /** Report configuration */
  reportConfig?: ReportConfig;
  /** Last modified timestamp */
  updatedAt: string;
}

/**
 * Get current project state
 *
 * @returns Project state or null if not set
 */
export function getProjectState(): ProjectState | null {
  try {
    const stored = localStorage.getItem(PROJECT_STATE_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as ProjectState;
  } catch (error) {
    console.error('Error reading project state from storage:', error);
    return null;
  }
}

/**
 * Save project state
 *
 * @param state - Project state to save
 * @returns True if successful, false otherwise
 */
function saveProjectState(state: ProjectState): boolean {
  try {
    localStorage.setItem(PROJECT_STATE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Error saving project state to storage:', error);
    return false;
  }
}

/**
 * Update current assembly in project state
 *
 * @param components - Wall components
 * @param studWallConfig - Optional stud wall configuration
 * @returns True if successful, false otherwise
 */
export function updateCurrentAssembly(
  components: WallComponent[],
  studWallConfig?: StudWallConfig
): boolean {
  try {
    const currentState = getProjectState() || { updatedAt: new Date().toISOString() };

    const updatedState: ProjectState = {
      ...currentState,
      currentAssembly: {
        components,
        studWallConfig
      },
      updatedAt: new Date().toISOString()
    };

    return saveProjectState(updatedState);
  } catch (error) {
    console.error('Error updating current assembly:', error);
    return false;
  }
}

/**
 * Get current assembly from project state
 *
 * @returns Current assembly or null if not set
 */
export function getCurrentAssembly(): {
  components: WallComponent[];
  studWallConfig?: StudWallConfig;
} | null {
  try {
    const state = getProjectState();
    return state?.currentAssembly || null;
  } catch (error) {
    console.error('Error getting current assembly:', error);
    return null;
  }
}

/**
 * Update location in project state
 *
 * @param location - Location data
 * @returns True if successful, false otherwise
 */
export function updateLocation(location: Location): boolean {
  try {
    const currentState = getProjectState() || { updatedAt: new Date().toISOString() };

    const updatedState: ProjectState = {
      ...currentState,
      location,
      updatedAt: new Date().toISOString()
    };

    return saveProjectState(updatedState);
  } catch (error) {
    console.error('Error updating location:', error);
    return false;
  }
}

/**
 * Get location from project state
 *
 * @returns Location or null if not set
 */
export function getLocation(): Location | null {
  try {
    const state = getProjectState();
    return state?.location || null;
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}

/**
 * Update climate data in project state
 *
 * @param climateData - Climate data
 * @returns True if successful, false otherwise
 */
export function updateClimateData(climateData: ClimateData): boolean {
  try {
    const currentState = getProjectState() || { updatedAt: new Date().toISOString() };

    const updatedState: ProjectState = {
      ...currentState,
      climateData,
      updatedAt: new Date().toISOString()
    };

    return saveProjectState(updatedState);
  } catch (error) {
    console.error('Error updating climate data:', error);
    return false;
  }
}

/**
 * Get climate data from project state
 *
 * @returns Climate data or null if not set
 */
export function getClimateData(): ClimateData | null {
  try {
    const state = getProjectState();
    return state?.climateData || null;
  } catch (error) {
    console.error('Error getting climate data:', error);
    return null;
  }
}

/**
 * Update compliance standard in project state
 *
 * @param standard - Compliance standard
 * @returns True if successful, false otherwise
 */
export function updateComplianceStandard(standard: ComplianceStandard): boolean {
  try {
    const currentState = getProjectState() || { updatedAt: new Date().toISOString() };

    const updatedState: ProjectState = {
      ...currentState,
      complianceStandard: standard,
      updatedAt: new Date().toISOString()
    };

    return saveProjectState(updatedState);
  } catch (error) {
    console.error('Error updating compliance standard:', error);
    return false;
  }
}

/**
 * Get compliance standard from project state
 *
 * @returns Compliance standard or null if not set
 */
export function getComplianceStandard(): ComplianceStandard | null {
  try {
    const state = getProjectState();
    return state?.complianceStandard || null;
  } catch (error) {
    console.error('Error getting compliance standard:', error);
    return null;
  }
}

/**
 * Update report configuration in project state
 *
 * @param config - Report configuration
 * @returns True if successful, false otherwise
 */
export function updateReportConfig(config: ReportConfig): boolean {
  try {
    const currentState = getProjectState() || { updatedAt: new Date().toISOString() };

    const updatedState: ProjectState = {
      ...currentState,
      reportConfig: config,
      updatedAt: new Date().toISOString()
    };

    return saveProjectState(updatedState);
  } catch (error) {
    console.error('Error updating report config:', error);
    return false;
  }
}

/**
 * Get report configuration from project state
 *
 * @returns Report configuration or null if not set
 */
export function getReportConfig(): ReportConfig | null {
  try {
    const state = getProjectState();
    return state?.reportConfig || null;
  } catch (error) {
    console.error('Error getting report config:', error);
    return null;
  }
}

/**
 * Clear current assembly from project state
 *
 * @returns True if successful, false otherwise
 */
export function clearCurrentAssembly(): boolean {
  try {
    const currentState = getProjectState();
    if (!currentState) {
      return false;
    }

    const updatedState: ProjectState = {
      ...currentState,
      currentAssembly: undefined,
      updatedAt: new Date().toISOString()
    };

    return saveProjectState(updatedState);
  } catch (error) {
    console.error('Error clearing current assembly:', error);
    return false;
  }
}

/**
 * Clear location from project state
 *
 * @returns True if successful, false otherwise
 */
export function clearLocation(): boolean {
  try {
    const currentState = getProjectState();
    if (!currentState) {
      return false;
    }

    const updatedState: ProjectState = {
      ...currentState,
      location: undefined,
      updatedAt: new Date().toISOString()
    };

    return saveProjectState(updatedState);
  } catch (error) {
    console.error('Error clearing location:', error);
    return false;
  }
}

/**
 * Clear climate data from project state
 *
 * @returns True if successful, false otherwise
 */
export function clearClimateData(): boolean {
  try {
    const currentState = getProjectState();
    if (!currentState) {
      return false;
    }

    const updatedState: ProjectState = {
      ...currentState,
      climateData: undefined,
      updatedAt: new Date().toISOString()
    };

    return saveProjectState(updatedState);
  } catch (error) {
    console.error('Error clearing climate data:', error);
    return false;
  }
}

/**
 * Clear entire project state
 *
 * @returns True if successful, false otherwise
 */
export function clearProjectState(): boolean {
  try {
    localStorage.removeItem(PROJECT_STATE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing project state:', error);
    return false;
  }
}

/**
 * Export project state to JSON
 *
 * @returns JSON string of project state
 */
export function exportProjectState(): string {
  try {
    const state = getProjectState();
    return JSON.stringify(state, null, 2);
  } catch (error) {
    console.error('Error exporting project state:', error);
    return '{}';
  }
}

/**
 * Import project state from JSON
 *
 * @param json - JSON string of project state
 * @returns True if successful, false otherwise
 */
export function importProjectState(json: string): boolean {
  try {
    const state = JSON.parse(json) as ProjectState;
    return saveProjectState({
      ...state,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error importing project state:', error);
    return false;
  }
}

/**
 * Check if project state has unsaved changes
 *
 * @param lastSavedTime - Last saved timestamp to compare against
 * @returns True if there are unsaved changes, false otherwise
 */
export function hasUnsavedChanges(lastSavedTime: string): boolean {
  try {
    const state = getProjectState();
    if (!state) {
      return false;
    }
    return state.updatedAt > lastSavedTime;
  } catch (error) {
    console.error('Error checking unsaved changes:', error);
    return false;
  }
}

/**
 * Get project state summary
 *
 * @returns Summary of project state
 */
export function getProjectSummary(): {
  hasAssembly: boolean;
  hasLocation: boolean;
  hasClimateData: boolean;
  hasComplianceStandard: boolean;
  lastUpdated: string;
} {
  try {
    const state = getProjectState();

    if (!state) {
      return {
        hasAssembly: false,
        hasLocation: false,
        hasClimateData: false,
        hasComplianceStandard: false,
        lastUpdated: new Date().toISOString()
      };
    }

    return {
      hasAssembly: !!state.currentAssembly,
      hasLocation: !!state.location,
      hasClimateData: !!state.climateData,
      hasComplianceStandard: !!state.complianceStandard,
      lastUpdated: state.updatedAt
    };
  } catch (error) {
    console.error('Error getting project summary:', error);
    return {
      hasAssembly: false,
      hasLocation: false,
      hasClimateData: false,
      hasComplianceStandard: false,
      lastUpdated: new Date().toISOString()
    };
  }
}
