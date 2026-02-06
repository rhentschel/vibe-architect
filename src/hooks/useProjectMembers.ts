import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ProjectMember, ProjectRole } from '@/types/database.types'

interface CreateUserResponse {
  success: boolean
  userId: string
  email: string
  isNewUser: boolean
  message: string
}

interface ProjectUserData {
  user_id: string
}

interface MemberRoleData {
  role: string
}

export function useProjectMembers(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      if (!projectId) return []

      const { data, error } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as ProjectMember[]
    },
    enabled: !!projectId,
  })
}

export function useProjectRole(projectId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['project-role', projectId, userId],
    queryFn: async (): Promise<ProjectRole> => {
      if (!projectId || !userId) return 'guest'

      // First check if user is project owner
      const { data: project } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single()

      const projectData = project as ProjectUserData | null
      if (projectData?.user_id === userId) {
        return 'owner'
      }

      // Check if user is a member
      const { data: member } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single()

      const memberData = member as MemberRoleData | null
      return (memberData?.role as ProjectRole) || 'guest'
    },
    enabled: !!projectId && !!userId,
  })
}

export function useInviteGuest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (_params: {
      projectId: string
      guestEmail: string
      invitedBy: string
    }): Promise<never> => {
      // Note: We cannot directly query auth.users from client-side
      // This would need a server-side function or edge function
      // For now, we'll use a workaround: store the email and resolve later
      // or require the user ID to be passed directly

      // For simplicity, we'll throw an error suggesting to use user ID
      // In a production app, you'd create an Edge Function to handle this
      throw new Error(
        'Gast-Einladung per E-Mail ist noch nicht verfügbar. ' +
        'Bitte teile den Projekt-Link direkt mit dem Benutzer.'
      )
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] })
    },
  })
}

export function useAddGuestById() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      guestUserId,
      invitedBy,
    }: {
      projectId: string
      guestUserId: string
      invitedBy: string
    }) => {
      const { data, error } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: guestUserId,
          role: 'guest',
          invited_by: invitedBy,
        } as never)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new Error('Dieser Benutzer ist bereits Mitglied des Projekts.')
        }
        throw error
      }

      return data as ProjectMember
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] })
    },
  })
}

export function useRemoveGuest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      memberId,
    }: {
      memberId: string
      projectId: string
    }) => {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] })
    },
  })
}

export function useAssignGuestToProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      guestUserId,
      invitedBy,
    }: {
      projectId: string
      guestUserId: string
      invitedBy: string
    }) => {
      const { data, error } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: guestUserId,
          role: 'guest',
          invited_by: invitedBy,
        } as never)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new Error('Dieser Gast ist bereits in diesem Projekt.')
        }
        throw error
      }

      return data as ProjectMember
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] })
    },
  })
}

export function useKnownGuests(currentProjectId: string | undefined, adminUserId: string | undefined) {
  return useQuery({
    queryKey: ['known-guests', adminUserId, currentProjectId],
    queryFn: async () => {
      if (!adminUserId || !currentProjectId) return []

      // Get all projects owned by this admin
      const { data: ownedProjects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', adminUserId)

      if (projectsError) throw projectsError

      const projectIds = (ownedProjects || []).map((p: { id: string }) => p.id)
      if (projectIds.length === 0) return []

      // Get all guest members across all admin's projects
      const { data: allMembers, error: membersError } = await supabase
        .from('project_members')
        .select('user_id, email')
        .in('project_id', projectIds)
        .eq('role', 'guest')

      if (membersError) throw membersError

      // Get members already in the current project
      const { data: currentMembers, error: currentError } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', currentProjectId)

      if (currentError) throw currentError

      const currentMemberIds = new Set(
        (currentMembers || []).map((m: { user_id: string }) => m.user_id)
      )

      // Deduplicate and filter out already-assigned guests
      const seen = new Set<string>()
      const availableGuests: { user_id: string; email: string }[] = []

      for (const member of (allMembers || []) as { user_id: string; email?: string }[]) {
        if (!currentMemberIds.has(member.user_id) && !seen.has(member.user_id)) {
          seen.add(member.user_id)
          availableGuests.push({
            user_id: member.user_id,
            email: member.email || `Gast ${member.user_id.slice(0, 8)}`,
          })
        }
      }

      return availableGuests
    },
    enabled: !!currentProjectId && !!adminUserId,
  })
}

export function useCreateGuestUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      email,
      password,
      projectId,
      invitedBy,
    }: {
      email: string
      password: string
      projectId: string
      invitedBy: string
    }): Promise<CreateUserResponse> => {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email, password, projectId, invitedBy },
      })

      if (error) {
        throw new Error(error.message || 'Fehler beim Erstellen des Benutzers')
      }

      if (data.error) {
        throw new Error(data.error)
      }

      return data as CreateUserResponse
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] })
    },
  })
}
