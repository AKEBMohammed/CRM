import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { gql } from "$lib/graphql";

async function getMessagesWithViewsByRoom(room_id: number) {
    let query = `
        query {
                messagesCollection(
                filter: {
                    room_id: {
                        eq: "${room_id}"
                    }
                    
                }
                last: 50
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
                            files {
                                file_id
                                p_name
                                v_name
                            }
                            viewsCollection {
                                edges {
                                    node {
                                        profile_id
                                        seen_at
                                        profiles {
                                            fullname
                                            email
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

    if (!data.messagesCollection) {
        return [];
    }

    let results = data.messagesCollection.edges.map((edge: any) => {
        console.log(edge.node.files);

        let message = {
            message_id: edge.node.message_id,
            content: edge.node.content,
            send_at: edge.node.send_at,
            sender_id: edge.node.sender_id,
            fullname: edge.node.profiles.fullname,
            email: edge.node.profiles.email,
            views: edge.node.viewsCollection.edges.map((viewEdge: any) => ({
                profile_id: viewEdge.node.profile_id,
                fullname: viewEdge.node.profiles.fullname,
                email: viewEdge.node.profiles.email,
                seen_at: viewEdge.node.seen_at,

            })),
            files: edge.node.files
        };
        return message;
    });

    return results;
}



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

    if (!room) {
        console.error('Room not found');
        throw redirect(300, '/dashboard/rooms');
    }


    let messages = await getMessagesWithViewsByRoom(parseInt(params.room_id));

    return { room, messages };
};