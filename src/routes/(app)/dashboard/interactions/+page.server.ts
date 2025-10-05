import { gql } from "$lib/graphql";
import { getProfile } from "$lib/supabase";
import { redirect } from "@sveltejs/kit";

async function getInteractions() {
    let query = `
        query {
            interactionsCollection {
                edges {
                    node {
                        interaction_id
                        profile_id
                        product_id
                    }
                }
            }
        }
    `;

    const result = await gql(query);
    if (!result) {
        return false;
    }

    return result.interactionsCollection.edges.map((edge: any) => edge.node);
}

export const load = async () => {
    const user = await getProfile();
    if (!user) {
        redirect(303, "/auth");
    }
    const interactions = await getInteractions();
    return { interactions };
}