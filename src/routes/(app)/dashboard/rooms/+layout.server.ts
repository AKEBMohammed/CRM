
import { gql } from '$lib/graphql';
import { getProfile, supabase } from '$lib/supabase';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

async function getProfilesByUser(user: { company_id: number, profile_id: number, role: string }) {

    let query = `
    query {
        profilesCollection(
            filter: {  company_id: { eq: "${user.company_id}" } }
        ) {
            edges {
                node {
                    profile_id
                    fullname
                    phone
                    email
                    role
                }
            }
        }
    }
        `

    let result = await gql(query)

    if (!result) {
        return false;
    }

    let profiles = result.profilesCollection.edges.map((edge: any) => ({
        profile_id: edge.node.profile_id,
        fullname: edge.node.fullname,
        email: edge.node.email,
        phone: edge.node.phone,
        role: edge.node.role,
    }));

    return profiles;
}


export const load: LayoutServerLoad = async ({ cookies}) => {
    const user = await getProfile()
    if (!user) {
        redirect(300, '/auth');
    }
    

    let query = `
        query {
            profiles_roomsCollection(
                filter: {
                    profile_id: {
                        eq: "${user?.profile_id}"
                    }
                }
            ) {
                edges {
                    node {
                        rooms {
                            room_id
                            name
                            messagesCollection(
                                orderBy: [{ send_at: DescNullsLast }]
                                first: 1
                            ){
                                edges {
                                    node {
                                        content
                                        profiles {
                                            fullname
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    
    `
    let data = await gql(query);
    let rooms = data
        .profiles_roomsCollection
        .edges
        .map((edge: any) => edge.node.rooms)
        .map((room: any) => ({
            room_id: room.room_id,
            name: room.name,
            last_message: {
                content: room.messagesCollection.edges[0]?.node.content || null,
                fullname: room.messagesCollection.edges[0]?.node.profiles.fullname || null
            }
        }));

    
        let profiles = await getProfilesByUser(user);
        if (!profiles) {
            throw redirect(302, '/dashboard');
        }
    
    return {
        rooms,
        profiles
    };
};