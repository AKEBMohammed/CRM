import { gql } from '$lib/graphql';
import { getProfile, supabase } from '$lib/supabase';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
    const user = await getProfile();
    if (!user) {
        redirect(303, '/auth');
    }


    let query = `
        query {
            profiles_roomsCollection(
                filter: {
                    profile_id: {
                        eq: "${user.profile_id}"
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
                            allMessages: messagesCollection {
                                edges {
                                    node {
                                        message_id
                                        sender_id
                                        viewsCollection(
                                            filter: {
                                                profile_id: {
                                                    eq: "${user.profile_id}"
                                                }
                                            }
                                        ) {
                                            edges {
                                                node {
                                                    view_id
                                                }
                                            }
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
        .map((room: any) => {
            // Calculate unread messages count
            const unreadCount = room.allMessages.edges.filter((messageEdge: any) => {
                const message = messageEdge.node;
                // Don't count own messages as unread
                if (message.sender_id === user.profile_id) return false;
                // Check if user has viewed this message
                return message.viewsCollection.edges.length === 0;
            }).length;

            return {
                room_id: room.room_id,
                name: room.name,
                fullname: room.messagesCollection.edges[0]?.node.profiles.fullname || null,
                message: room.messagesCollection.edges[0]?.node.content || null,
                unreadCount
            };
        });

        console.log('Rooms with unread counts:', rooms);
        

    return {
        user,
        rooms
    };
};