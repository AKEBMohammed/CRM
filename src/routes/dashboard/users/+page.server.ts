import { error } from '@sveltejs/kit';
import { gql } from '$lib/graphql';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, cookies }) => {
    let data = cookies.get('user');
    if (!data) {
        throw error(401, 'Unauthorized');
    }
    const user = JSON.parse(data);

    let query = `
    query {
        profilesCollection(
            filter: {  company_id: { eq: "${user.company}" } }
        ) {
            edges {
                node {
                    profile_id
                    fullname
                    role
                    users {
                        email
                    }
                }
            }
        }
    }
    `;

    const res = await gql(query);
    if (!res) {
        throw error(500, 'Failed to fetch profiles');
    }

    let users = res
        .profilesCollection
        .edges
        .map((edge: any) => {
            return {
                email: edge.node.users?.email || 'N/A',
                ...edge.node,
            };
        });
    console.log(users);
    

    return { users };

};