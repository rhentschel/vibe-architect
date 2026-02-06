import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Project } from '@/types/database.types'

interface GuestProject extends Project {
  membershipId: string
}

interface UserRoleResult {
  isGuest: boolean
  guestProjects: GuestProject[]
  isLoading: boolean
}

export function useUserRole(): UserRoleResult {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async (): Promise<{ ownsProjects: boolean; guestProjects: GuestProject[] }> => {
      if (!user) return { ownsProjects: false, guestProjects: [] }

      const [ownedResult, membershipsResult] = await Promise.all([
        supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id)
          .limit(1),
        supabase
          .from('project_members')
          .select('id, project_id')
          .eq('user_id', user.id)
          .eq('role', 'guest'),
      ])

      if (ownedResult.error) throw ownedResult.error
      if (membershipsResult.error) throw membershipsResult.error

      const ownsProjects = (ownedResult.data?.length ?? 0) > 0
      const membershipData = membershipsResult.data as { id: string; project_id: string }[] | null

      let guestProjects: GuestProject[] = []
      if (membershipData && membershipData.length > 0) {
        const projectIds = membershipData.map((m) => m.project_id)
        const { data: projects, error } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds)
          .order('updated_at', { ascending: false })

        if (error) throw error

        guestProjects = ((projects || []) as Project[]).map((p) => ({
          ...p,
          membershipId: membershipData.find((m) => m.project_id === p.id)?.id ?? '',
        }))
      }

      return { ownsProjects, guestProjects }
    },
    enabled: !!user,
  })

  const ownsProjects = data?.ownsProjects ?? false
  const guestProjects = data?.guestProjects ?? []
  const isGuest = !ownsProjects && guestProjects.length > 0

  return { isGuest, guestProjects, isLoading }
}
