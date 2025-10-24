import { gql } from "$lib/graphql";
import { redirect, type Actions } from "@sveltejs/kit";


export const actions = {
    create: async ({ request, cookies }) => {
        console.log('Creating new discussion...');

        let user = JSON.parse(cookies.get('user') || 'null');

        let query = `
            mutation {
                insertIntodiscussionsCollection(
                    objects: [{
                        profile_id: "${user?.profile_id}",
                        name: "New Discussion"
                    }]
                ) {
                    records {
                        discussion_id
                    }
                }
            }
        `

        let data = await gql(query);
        let discussion_id = data.insertIntodiscussionsCollection.records[0].discussion_id;
        throw redirect(300, `/dashboard/assistant/${discussion_id}`);
    }
} satisfies Actions;