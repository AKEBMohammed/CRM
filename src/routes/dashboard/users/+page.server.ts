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
                    users {
                        email
                    }
                }
            }
        }
    }
    `;

    const data = await gql(query);
    if (!data) {
        throw error(500, 'Failed to fetch profiles');
    }

    /*TODO: fix descending objects*/


    let users = data
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