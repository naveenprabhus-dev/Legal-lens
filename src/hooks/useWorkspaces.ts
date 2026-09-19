import { useState, useEffect } from 'react';
import { Workspace } from '../types';
import {
  subscribeUserWorkspaces,
  createWorkspace as apiCreateWorkspace,
  deleteWorkspace as apiDeleteWorkspace,
} from '../services/firebase/firestore';

export function useWorkspaces(userId: string | undefined) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setWorkspaces([]);
      setActiveWorkspaceId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeUserWorkspaces(
      userId,
      updatedWorkspaces => {
        setWorkspaces(updatedWorkspaces);
        setLoading(false);
        // Auto-select first workspace if none selected or if previously selected was deleted
        if (updatedWorkspaces.length > 0) {
          setActiveWorkspaceId(prev => {
            if (!prev || !updatedWorkspaces.some(w => w.id === prev)) {
              return updatedWorkspaces[0].id;
            }
            return prev;
          });
        } else {
          setActiveWorkspaceId(null);
        }
      },
      err => {
        console.error('Workspaces subscription error:', err);
        setError('Failed to sync workspaces.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const createWorkspace = async (name: string, description?: string) => {
    if (!userId) throw new Error('User must be signed in to create a workspace.');
    const ws = await apiCreateWorkspace(userId, { name, description });
    setActiveWorkspaceId(ws.id);
    return ws;
  };

  const deleteWorkspace = async (workspaceId: string) => {
    if (!userId) return;
    await apiDeleteWorkspace(userId, workspaceId);
  };

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || null;

  return {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    setActiveWorkspaceId,
    loading,
    error,
    createWorkspace,
    deleteWorkspace,
  };
}
