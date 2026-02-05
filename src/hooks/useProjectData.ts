import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useProjectStore } from '@/lib/store/useProjectStore'
import type { Project, Message, GraphData } from '@/types/database.types'

export function useProjects(userId: string | undefined) {
  return useQuery({
    queryKey: ['projects', userId],
    queryFn: async () => {
      if (!userId) return []

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data as Project[]
    },
    enabled: !!userId,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  const { setCurrentProject, reset } = useProjectStore()

  return useMutation({
    mutationFn: async ({ name, description, userId }: { name: string; description?: string; userId: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({ name, description, user_id: userId } as never)
        .select()
        .single()

      if (error) throw error
      return data as Project
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      reset()
      setCurrentProject(project)
    },
  })
}

interface SnapshotData {
  graph_data?: GraphData
}

export function useLoadProject() {
  const { setCurrentProject, setMessages, setGraph, setLocalVersion, reset } = useProjectStore()

  return useMutation({
    mutationFn: async (projectId: string) => {
      const [projectResult, messagesResult, snapshotResult] = await Promise.all([
        supabase.from('projects').select('*').eq('id', projectId).single(),
        supabase.from('messages').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
        supabase
          .from('architecture_snapshots')
          .select('*')
          .eq('project_id', projectId)
          .order('version', { ascending: false })
          .limit(1)
          .single(),
      ])

      if (projectResult.error) throw projectResult.error

      return {
        project: projectResult.data as Project,
        messages: (messagesResult.data || []) as Message[],
        snapshot: snapshotResult.data as (SnapshotData & { version?: number }) | null,
      }
    },
    onSuccess: ({ project, messages, snapshot }) => {
      reset()
      setCurrentProject(project)
      setMessages(messages)
      if (snapshot?.graph_data) {
        setGraph(snapshot.graph_data)
      }
      setLocalVersion(snapshot?.version ?? 0)
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  const { currentProject, reset } = useProjectStore()

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', projectId)
      if (error) throw error
    },
    onSuccess: (_, deletedProjectId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      if (currentProject?.id === deletedProjectId) {
        reset()
      }
    },
  })
}
