import { gql } from '$lib/graphql';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad, Actions } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
    const user = JSON.parse(cookies.get('user') || 'null');
    if (!user) {
        redirect(300, '/auth');
    }


    let query = `
        query {
            discussionsCollection(
                filter: {
                    profile_id: {
                        eq: "${user?.profile_id}"
                    }
                }
            ) {
                edges {
                    node {
                        discussion_id
                        profile_id
                        name
                            
                    }
                }
            }
        }
    
    `
    let data = await gql(query);
    let discussions = data
        .discussionsCollection
        .edges
        .map((edge: any) => edge.node)


    return {
        discussions
    };
};

