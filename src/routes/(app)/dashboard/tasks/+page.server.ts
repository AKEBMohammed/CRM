import { gql } from "$lib/graphql";
import { getProfile } from "$lib/supabase";
import { redirect } from "@sveltejs/kit";

async function getProfilesByUser(user: { company_id: number, profile_id: number, role: string }) {

    let query = `
    query {
        profilesCollection(
            filter: {  company_id: { eq: "${user.company_id}" } }
        ) {
            edges {
                node {
                    profile_id
                    fullname
                    phone
                    email
                    role
                }
            }
        }
    }
        `

    let result = await gql(query)

    if (!result) {
        return false;
    }

    let profiles = result.profilesCollection.edges.map((edge: any) => ({
        profile_id: edge.node.profile_id,
        fullname: edge.node.fullname,
        email: edge.node.email,
        phone: edge.node.phone,
        role: edge.node.role,
    }));

    return profiles;
}

async function getTasks(user: { profile_id: string }) {
    let query = `
        query($profile_id: uuid!) {
            tasksCollection(
                filter: { assigned_to: { eq: $profile_id } }
            ) {
                edges {
                    node {
                        task_id
                        title
                        description
                        priority
                    }
                }
            }
        }
    `;

    let tasks = await gql(query, { profile_id: user.profile_id });
    console.log('tasks:', tasks);

    if (tasks?.data?.tasksCollection?.edges && tasks.data.tasksCollection.edges.length > 0) {
        return tasks.data.tasksCollection.edges.map((edge: { node: any }) => edge.node);
    } else {
        return [];
    }

}


export const load = async () => {
    let user = await getProfile();
    if (!user) {
        redirect(303, '/auth');
    }

    let users = [];
    if (user.role == 'admin') {
        users = await getProfilesByUser(user);
    }

    let tasks = await getTasks(user)


    return { users, tasks };
}