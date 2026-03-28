"use client";

import { useEffect, useState } from 'react';
import { Clock, Trash2, FolderOpen, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { WallComponent, StudWallConfig, ThermalPerformance } from '@/lib/types/domain';
import { ExportData, createExportData, exportData } from '@/lib/utils/export';

interface SavedProject {
  id: string;
  name: string;
  components: WallComponent[];
  studWallType: string;
  iJoistDepth?: number;
  savedAt: string;
  thumbnail?: string;
}

interface RecentProjectsProps {
  onLoadProject: (project: SavedProject) => void;
  components: WallComponent[];
  studWallType: string;
  iJoistDepth?: number;
  performance?: ThermalPerformance;
}

export function RecentProjects({
  onLoadProject,
  components,
  studWallType,
  iJoistDepth,
  performance
}: RecentProjectsProps) {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [open, setOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    try {
      const saved = localStorage.getItem('wall-assembly-projects');
      if (saved) {
        const parsed = JSON.parse(saved) as SavedProject[];
        setProjects(parsed);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const saveCurrentProject = () => {
    const name = prompt('Enter project name:', `Assembly ${new Date().toLocaleDateString()}`);
    if (!name) return;

    const project: SavedProject = {
      id: Date.now().toString(),
      name,
      components,
      studWallType,
      iJoistDepth,
      savedAt: new Date().toISOString()
    };

    try {
      const currentProjects = [...projects, project];
      localStorage.setItem('wall-assembly-projects', JSON.stringify(currentProjects));
      setProjects(currentProjects);
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Failed to save project. Storage may be full.');
    }
  };

  const handleLoadProject = (project: SavedProject) => {
    onLoadProject(project);
    setOpen(false);
  };

  const handleDeleteProject = (projectId: string) => {
    try {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      localStorage.setItem('wall-assembly-projects', JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
      setDeleteDialog(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleExportProject = (project: SavedProject) => {
    if (!performance) {
      alert('Performance data required for export');
      return;
    }

    const data: ExportData = createExportData(
      project.components,
      undefined,
      performance
    );

    exportData(data, {
      format: 'json',
      filename: project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Recent Projects</DialogTitle>
            <DialogDescription>
              Load a previously saved project or save the current assembly
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Save Current Button */}
            <Button onClick={saveCurrentProject} className="w-full">
              Save Current Assembly
            </Button>

            {/* Projects List */}
            {projects.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No saved projects yet. Save your current assembly to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {projects.map((project) => (
                  <Card key={project.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {project.components.length} components • {formatDate(project.savedAt)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleExportProject(project)}
                            title="Export"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setDeleteDialog(project.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 text-sm">
                          <p><strong>Thickness:</strong> {project.components.reduce((sum, c) => sum + c.thickness, 0).toFixed(0)} mm</p>
                          <p><strong>Stud Type:</strong> {project.studWallType}</p>
                        </div>
                        <Button onClick={() => handleLoadProject(project)}>
                          <FolderOpen className="mr-2 h-4 w-4" />
                          Load Project
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDialog && handleDeleteProject(deleteDialog)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button variant="outline" onClick={() => setOpen(false)}>
        <Clock className="mr-2 h-4 w-4" />
        Recent Projects ({projects.length})
      </Button>
    </>
  );
}
