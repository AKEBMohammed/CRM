import { redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { gql } from "$lib/graphql";
import { supabase } from "$lib/supabase";



export const load: PageServerLoad = async ({ params, cookies }) => {
    const user = JSON.parse(cookies.get('user') || 'null');
    if (!user) {
        redirect(300, '/auth');
    }

    //Check if the user has access to this discussion
    let query = `
        query {
            discussionsCollection(
                filter: {
                    profile_id: {
                        eq: "${user?.profile_id}"
                    }

                    discussion_id: {
                        eq: "${params.discussion_id}"
                    }
                    
                }
            ) {
                edges {
                    node {
                            discussion_id
                            name
                            
                    }
                }
            }
        }
    `
    let data = await gql(query);
    if (data.discussionsCollection.edges.length === 0) {
        console.error('User does not have access to this discussion');
        throw redirect(300, '/dashboard/rooms');
    }

    let discussion = data.discussionsCollection.edges[0].node;

    if (!discussion) {
        console.error('Discussion not found');
        throw redirect(300, '/dashboard/discussions');
    }


    query = `
        query {
                chatsCollection(
                filter: {
                    discussion_id: {
                        eq: "${params.discussion_id}"
                    }
                },
                orderBy: [{ created_at: AscNullsLast }]) {
                    edges {
                        node {
                            chat_id
                            content
                            is_ai
                            created_at
                        }
                    }
                }
            }
        
    `
    data = await gql(query);

    if (!data.chatsCollection) {
        throw redirect(300, '/dashboard/assistant');
    }


    let chats = data.chatsCollection.edges.map((edge: any) => edge.node)
    console.log(chats);

    return { discussion: {
        discussion_id: discussion.discussion_id,
        name: discussion.name
    }, chats };
};

