import { gql } from "$lib/graphql";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";



export const actions = {
    create: async ({ request, cookies }) => {
        const user = JSON.parse(cookies.get('user') || 'null');
        if (!user) {
            throw redirect(302, '/auth');
        }

        const formData = await request.formData();
        const name = formData.get('name') as string;
        const profiles = formData.getAll('profile') as string[];
        console.log('Form Data:', { name, profiles });


        if (!name) {
            console.log('Room name is required');

            return fail(400, { message: 'Room name is required' });
        }

        if (profiles.length < 3) {
            console.log('Select at least 3 profiles to create a room');
            return fail(400, { message: 'Select at least 3 profiles to create a room' });
        }



        const mutation = `
            mutation {
                insertIntoroomsCollection(
                    objects: [{
                        name: "${name}"
                        created_by: ${user.profile_id}
                    }]
                ) {
                    records {
                        room_id
                        name
                        created_by
                    }
                }
            }
        `;

        let response = await gql(mutation);
        console.log('GraphQL Response:', response);

        if (!response?.insertIntoroomsCollection?.records?.length) {
            return fail(500, { message: 'Failed to create room' });
        }

        const newRoom = response.insertIntoroomsCollection.records[0];
        console.log('New Room:', newRoom);

        if (profiles.length > 0) {
            for (let profileId of profiles) {
                const assocMutation = `
                    mutation {
                        insertIntoprofiles_roomsCollection(
                            objects: [{
                                room_id: ${newRoom.room_id}
                                profile_id: ${profileId}
                            }]
                        ) {
                            records {
                                room_id
                                profile_id
                            }
                        }
                    }
                `;

                await gql(assocMutation);
            }
        }
        console.log('Room created successfully:', newRoom);


        redirect(302, `/dashboard/rooms/${newRoom.room_id}`);
    }
} satisfies Actions;