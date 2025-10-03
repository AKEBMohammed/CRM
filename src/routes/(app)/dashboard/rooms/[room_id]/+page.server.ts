import { error, fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { gql } from "$lib/graphql";
import { getProfile } from "$lib/supabase";

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
                            reply_to
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
        let message = {
            message_id: edge.node.message_id,
            content: edge.node.content,
            send_at: edge.node.send_at,
            sender_id: edge.node.sender_id,
            reply_to: edge.node.reply_to,
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

async function checkUserAccess(params: { room_id: number; user: any }) {
    let query = `
        query {
            profiles_roomsCollection(
                filter: {
                    profile_id: {
                        eq: "${params.user?.profile_id}"
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
                            created_by
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
        throw redirect(300, '/dashboard/rooms');
    }

    return room;
}

export const load: PageServerLoad = async ({ params, cookies }) => {
    const user = await getProfile()
    if (!user) {
        redirect(300, '/auth');
    }

    let room = await checkUserAccess({ room_id: parseInt(params.room_id), user });

    if (!room) {
        console.error('Room not found');
        throw redirect(300, '/dashboard/rooms');
    }


    let messages = await getMessagesWithViewsByRoom(parseInt(params.room_id));

    return { room, messages };
};

export const actions = {
    add: async ({ request, cookies, params }) => {
        const user = await getProfile()
        if (!user) {
            throw redirect(302, '/auth');
        }

        const formData = await request.formData();
        const profiles = formData.getAll('profile') as string[];

        if (profiles.length === 0) {
            return fail(400, { error: 'Profile ID is required' });
        }

        // Check if the user has access to the room
        await checkUserAccess({ room_id: parseInt(params.room_id), user });

        for (let profile_id of profiles) {
            const mutation = `
            mutation {
                insertIntoprofiles_roomsCollection(
                    objects: [{
                        profile_id: ${profile_id},
                        room_id: ${params.room_id}
                    }]
                ) {
                    records {
                        profile_id
                        room_id
                    }
                }
            }
        `;

            let response = await gql(mutation);
            if (!response?.insertIntoprofiles_roomsCollection?.records?.length) {
                return fail(400, { error: 'Failed to add profile to room' });
            }

        }



        return { success: true, message: 'Profile added to room successfully' };
    },

    leave: async ({ request, cookies, params }) => {
        const user = await getProfile()
        if (!user) {
            throw redirect(302, '/auth');
        }

        // Check if the user has access to the room
        await checkUserAccess({ room_id: parseInt(params.room_id), user });

        const mutation = `
            mutation {
                deleteFromprofiles_roomsCollection(
                    filter: {
                        profile_id: { eq: ${user.profile_id} },
                        room_id: { eq: ${params.room_id} }
                    }
                ) {
                    records {
                        room_id
                        profile_id
            }
                }
            }
        `;

        let response = await gql(mutation);

        if (response?.deleteFromprofiles_roomsCollection?.recordsDeleted === 0) {
            return fail(400, 'Failed to leave room');
        }

        redirect(300, '/dashboard/rooms')
    },

    delete: async ({ request, cookies, params }) => {
        const user = await getProfile()
        if (!user) {
            throw redirect(302, '/auth');
        }

        // Check if the user has access to the room
        let room = await checkUserAccess({ room_id: parseInt(params.room_id), user });

        if (room.created_by != user.profile_id) {
            return fail(403, { error: 'Only the creator can delete the room' });
        }

        const mutation = `
            mutation {
                deleteFromroomsCollection(
                    filter: { room_id: { eq: ${params.room_id} } }
                ) {
                    records{
                        room_id}
                }
            }
        `;

        let response = await gql(mutation);


        if (response?.deleteFromroomsCollection?.records.length === 0) {

            return fail(400, { error: 'Failed to delete room' });
        }

        redirect(300, '/dashboard/rooms')
    }
} satisfies Actions;