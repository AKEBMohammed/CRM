import type { PageServerLoad } from './$types';
import { gql } from '$lib/graphql';
import { redirect } from '@sveltejs/kit';
import { getProfile } from '$lib/supabase';

export const load: PageServerLoad = async ({ cookies }) => {
    const user = await getProfile()
    if (!user) {
        throw redirect(302, '/auth');
    }


    // Fetch dashboard statistics
    const statsQuery = `
        query CompanyData($companyId: BigInt!, $profileIds: [BigInt!]) {
  profilesCollection(
    filter: { company_id: { eq: $companyId } }
  ) {
    edges {
      node {
        profile_id
        fullname
        role
        created_at
      }
    }
  }

  roomsCollection(
    filter: { created_by: { in: $profileIds } }
  ) {
    edges {
      node {
        room_id
        name
        created_at
      }
    }
  }

  messagesCollection(
    filter: { sender_id: { in: $profileIds } }
    orderBy: [{ send_at: DescNullsLast }]
    first: 5
  ) {
    edges {
      node {
        message_id
        content
        send_at
        sender: profiles {
          fullname
        }
        rooms {
          name
        }
      }
    }
  }
}
    `;

    try {
        const result = await gql(statsQuery, {
            companyId: user.company_id,
            profileIds: [user.profile_id]
        });


        const users = result?.profilesCollection?.edges || [];
        const rooms = result?.roomsCollection?.edges || [];
        const recentMessages = result?.messagesCollection?.edges || [];

        // Calculate user role distribution
        const roleStats = users.reduce((acc: any, edge: any) => {
            const role = edge.node.role || 'user';
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {});

        // Get recent users (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const newUsersThisWeek = users.filter((edge: any) =>
            new Date(edge.node.created_at) > weekAgo
        ).length;

        return {
            stats: {
                totalUsers: users.length,
                totalRooms: rooms.length,
                newUsersThisWeek,
                roleDistribution: roleStats,
                totalMessages: recentMessages.length > 0 ? 'Active' : 'No recent activity'
            },
            recentMessages: recentMessages.map((edge: any) => edge.node),
            recentUsers: users.slice(0, 5).map((edge: any) => edge.node)
        };
    } catch (error) {
        console.error('Dashboard data fetch error:', error);
        return {
            stats: {
                totalUsers: 0,
                totalRooms: 0,
                newUsersThisWeek: 0,
                roleDistribution: {},
                totalMessages: 'Error loading'
            },
            recentMessages: [],
            recentUsers: []
        };
    }
};