import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { gql } from "$lib/graphql";
import { supabase } from "$lib/supabase";



export const load: PageServerLoad = async ({ params, cookies }) => {
    const user = JSON.parse(cookies.get('user') || 'null');
    if (!user) {
        redirect(300, '/auth');
    }

    //Check if the user has access to this room
    let query = `
        query {
            profiles_roomsCollection(
                filter: {
                    profile_id: {
                        eq: "${user?.profile_id}"
                    }

                        room_id: {
                            eq: "${params.room_id}"
                        }
                    
                }
            ) {
                edges {
                    node {
                        room_id
                        rooms {
                            room_id
                            name
                        }
                    }
                }
            }
        }
    `
    let data = await gql(query);
    if (data.profiles_roomsCollection.edges.length === 0) {
        console.error('User does not have access to this room');
        throw redirect(300, '/dashboard/rooms');
    }

    let room = data.profiles_roomsCollection.edges[0].node.rooms;
    console.log('Fetched room:', room);
    
    if (!room) {
        console.error('Room not found');
        throw redirect(300, '/dashboard/rooms');
    }

    console.log('User has access to this room');
    
    query = `
        query {
                messagesCollection(
                filter: {
                    room_id: {
                        eq: "${params.room_id}"
                    }
                },
                orderBy: [{ send_at: AscNullsLast }]) {
                    edges {
                        node {
                            message_id
                            content
                            send_at
                            sender_id
                            profiles {
                                fullname
                                email
                            }
                        }
                    }
                }
            }
        
    `
    data = await gql(query);

    if (!data.messagesCollection) {
        throw redirect(300, '/dashboard/rooms');
    }


    let messages = data.messagesCollection.edges.map((edge: any) => edge.node)




    return { room, profile_id: user.profile_id, messages };
};