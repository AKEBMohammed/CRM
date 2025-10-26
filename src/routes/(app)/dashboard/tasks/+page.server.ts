import { gql } from "$lib/graphql";
import { getProfile } from "$lib/supabase";
import { error, fail, redirect } from "@sveltejs/kit";

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
                        type
                        status
                        due_date
                    }
                }
            }
        }
    `;

    let result = await gql(query, { profile_id: user.profile_id });


    if (!result?.tasksCollection?.edges) {
        return false;
    }

    let tasks = result.tasksCollection.edges.map((edge: any) => ({
        task_id: edge.node.task_id,
        title: edge.node.title,
        description: edge.node.description,
        priority: edge.node.priority,
        type: edge.node.type,
        status: edge.node.status,
        due_date: edge.node.due_date,
    }));

    return tasks;


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

    if (!tasks) {
        return fail(500, { error: "failed to load tasks" })
    }


    return { users, tasks };
}

export const actions = {
    add: async ({ request }) => {
        const formData = await request.formData();
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const priority = formData.get('priority') as string;
        const status = formData.get('status') as string;
        const type = formData.get('type') as string;
        const assigned_to = formData.get('assigned_to') as string;
        const due_date = formData.get('due_date') as string;

        const user = await getProfile();
        if (!user) {
            redirect(303, '/auth');
        }

        let mutation = `
            mutation($title: String!, $description: String!, $priority: String!, $status: String!, $type: String!, $due_date: date!, $assigned_to: uuid!, $created_by: uuid!) {
                insertIntotasksCollection(
                    objects: [{
                        title: $title,
                        description: $description,
                        priority: $priority,
                        status: $status,
                        type: $type,
                        due_date: $due_date,
                        assigned_to: $assigned_to,
                        created_by: $created_by
                    }]
                ) {
                    records {
                        task_id
                        title
                        description
                        priority
                        type
                        status
                        due_date
                        assigned_to
                    }
                }
            }
        `;

        let result = await gql(mutation, {
            title,
            description,
            priority,
            status,
            type,
            due_date,
            assigned_to,
            created_by: user.profile_id
        });

        if (result?.data?.createTask?.task) {
            return { success: true, task: result.data.createTask.task };
        } else {
            return fail(400, { error: 'Failed to create task' });
        }
    },
    next_stage: async ({ request }) => {
        const formData = await request.formData();
        const task_id = formData.get('task_id') as string;

        const user = await getProfile();
        if (!user) {
            redirect(303, '/auth');
        }

        let mutation = `
            mutation($task_id: uuid!) {
                updatetasksCollection(
                    filter: { task_id: { eq: $task_id }, status: { eq: "pending" } },
                    set: { status: "in_progress" }
                ) {
                    records {
                        task_id
                        status
                    }
                }
            }
        `;

        let result = await gql(mutation, { task_id });

        if (result?.updatetasksCollection?.records) {
            return { success: true, message: 'Task updated successfully' };
        } else {
            return fail(400, { error: 'Failed to update task' });
        }
    },
    complete: async ({ request }) => {
        const formData = await request.formData();
        const task_id = formData.get('task_id') as string;

        const user = await getProfile();
        if (!user) {
            redirect(303, '/auth');
        }

        let mutation = `
            mutation($task_id: uuid!) {
                updatetasksCollection(
                    filter: { task_id: { eq: $task_id }, status: { eq: "in_progress" } },
                    set: { status: "completed" }
                ) {
                    records {
                        task_id
                        status
                    }
                }
            }
        `;

        let result = await gql(mutation, { task_id });

        if (result?.updatetasksCollection?.records) {
            return { success: true, message: 'Task completed successfully' };
        } else {
            return fail(400, { error: 'Failed to complete task' });
        }
    },
    cancel: async ({ request }) => {
        const formData = await request.formData();
        const task_id = formData.get('task_id') as string;

        const user = await getProfile();
        if (!user) {
            redirect(303, '/auth');
        }

        let mutation = `
            mutation($task_id: uuid!) {
                updatetasksCollection(
                    filter: { task_id: { eq: $task_id }, status: { eq: "in_progress" } },
                    set: { status: "canceled" }
                ) {
                    records {
                        task_id
                        status
                    }
                }
            }
        `;

        let result = await gql(mutation, { task_id });

        if (result?.updatetasksCollection?.records) {
            return { success: true, message: 'Task canceled successfully' };
        } else {
            return fail(400, { error: 'Failed to cancel task' });
        }
    },
    reopen: async ({ request }) => {
        const formData = await request.formData();
        const task_id = formData.get('task_id') as string;

        const user = await getProfile();
        if (!user) {
            redirect(303, '/auth');
        }

        let mutation = `
            mutation($task_id: uuid!) {
            updatetasksCollection(
                filter: { 
                task_id: { eq: $task_id }, 
                status: { in: ["completed", "canceled"] } 
                },
                set: { status: "pending" }
            ) {
                records {
                task_id
                status
                }
            }
            }
        `;

        let result = await gql(mutation, { task_id });        

        if (result?.updatetasksCollection?.records) {
            return { success: true, message: 'Task reopened successfully' };
        } else {
            return fail(400, { error: 'Failed to reopen task' });
        }
    }
};