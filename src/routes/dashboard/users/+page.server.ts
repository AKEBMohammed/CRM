import { error } from '@sveltejs/kit';
import { gql } from '$lib/graphql';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    let query = `
    query {
        profilesCollection {
            edges {
                node {
                    profile_id
                    fullname
                    role
                }
            }
        }
    }
    `;

    const data = await gql(query);
    if (!data) {
        throw error(500, 'Failed to fetch profiles');
    }

    return { profiles: data.profilesCollection.edges.map((edge: { node: { profile_id: string; fullname: string; role: string } }) => edge.node) };

};