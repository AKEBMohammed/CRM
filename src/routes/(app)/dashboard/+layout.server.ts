import { gql } from '$lib/graphql';
import { supabase } from '$lib/supabase';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies}) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
        redirect(300, '/auth');
    }

    let query = `
        query {
            profilesCollection(
                filter: {
                    user_id: { 
                        eq: "${user.data.user?.id}"
                    }
                }
            ) {
                edges {
                    node {
                        fullname
                        role
                        companies {
                            company_id
                        }
                    }
                }
            }
        }
    `
    let data = await gql(query);    

    let result = {
        user_id: user.data.user?.id,
        email: user.data.user?.email,
        fullname: data.profilesCollection.edges[0]?.node.fullname,
        role: data.profilesCollection.edges[0]?.node.role,
        company: data.profilesCollection.edges[0]?.node.companies?.company_id
    }

    cookies.set('user', JSON.stringify(result), { path: '/' });

    return {
        user: result
    };
};