/**
 * SWR Hooks for Projects
 */

import useSWR from "swr";
import { useAuth } from "@/contexts/AuthContext";
import { Project } from "@/types/project";
import { ProjectsAPI } from "@/services/projects.api";

/**
 * Hook to fetch all projects
 */
export function useProjects() {
  const { token } = useAuth();

  const { data, error, isLoading, mutate } = useSWR<Project[]>(
    token ? ["projects", token] : null,
    () => ProjectsAPI.getProjects(token!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    projects: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch single project
 */
export function useProject(projectId: string | null) {
  const { token } = useAuth();

  const { data, error, isLoading, mutate } = useSWR<Project>(
    token && projectId ? ["project", projectId, token] : null,
    () => ProjectsAPI.getProject(projectId!, token!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    project: data,
    isLoading,
    isError: error,
    mutate,
  };
}
