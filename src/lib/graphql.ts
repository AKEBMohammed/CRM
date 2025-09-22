import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY } from '$env/static/public';

export async function gql(query: string, variables: Record<string, any> = {}) {
    const res = await fetch(`${PUBLIC_SUPABASE_URL}/graphql/v1`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": PUBLIC_SUPABASE_KEY,
            "Authorization": `Bearer ${PUBLIC_SUPABASE_KEY}`
        },
        body: JSON.stringify({ query, variables })
    });

    const json = await res.json();
    if (json.errors) {
        console.error(json.errors);
        throw new Error("GraphQL Error: " + JSON.stringify(json.errors));
    }
    return json.data;
}
