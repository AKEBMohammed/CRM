import { gql } from '$lib/graphql';
import { supabase } from '$lib/supabase';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies}) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
        redirect(300, '/auth');
    }   

<<<<<<< HEAD
<<<<<<< HEAD
    let profile = JSON.parse(cookies.get('user') || 'null');    
=======
    let profile = JSON.parse(cookies.get('user') || 'null');
    
>>>>>>> dashboard
=======
    let profile = JSON.parse(cookies.get('user') || 'null');    
>>>>>>> 9001f82f518e6c4e62ff797d10fc8f9f0479f42e

    let query = `
        query {
            profiles_roomsCollection(
                filter: {
                    profile_id: {
                        eq: "${profile.profile_id}"
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
            last_message: room.messagesCollection.edges[0]?.node.content || null
        }));
    
    return {
        user: profile,
        rooms
    };
};