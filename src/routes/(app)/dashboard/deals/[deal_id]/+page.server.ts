import { gql } from "$lib/graphql";
import { getProfile } from "$lib/supabase";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";

async function getDealById(deal_id: string) {
    let query = `
        query {
            dealsCollection (filter: { deal_id: { eq: "${deal_id}" } }) {
                edges {
                    node {
                        deal_id
                        title
                        value
                        stage
                        probability
                        contact_id
                        profile_id
                        product_id
                        contacts {
                            fullname
                            email
                            phone
                        }
                        products {
                            name
                            description
                        }
                        profiles {
                            fullname
                            email
                            company_id
                        }
                    }
                }
            }
        }
    `;

    const result = await gql(query);
    if (!result) {
        return false;
    }

    return result.dealsCollection.edges.map((edge: any) => {
        return {
            deal_id: edge.node.deal_id,
            title: edge.node.title,
            value: edge.node.value,
            stage: edge.node.stage,
            probability: edge.node.probability,
            contact: {
                fullname: edge.node.contacts.fullname,
                email: edge.node.contacts.email,
                phone: edge.node.contacts.phone,
            },
            product: {
                name: edge.node.products.name,
                description: edge.node.products.description,
            },
        };
    });
}


async function getContactsByUser(user: { profile_id: number, fullname: string, role: string }): Promise<any[] | false> {
    let query = `
    query {
        contactsCollection${user.role === 'admin' ?
            '' : ` (filter: { created_by: { eq: "${user.profile_id}" } })`} {
            edges {
                node {
                    contact_id
                    fullname
                    phone
                    email
                    address
                    contact_id
                    companies {
                        name
                    }
                    profiles {
                        fullname
                    }
                }
            }
        }
    }
    `;


    const result = await gql(query);
    if (!result) {
        return false;
    }


    let contacts = result
        .contactsCollection
        .edges
        .map((edge: any) => {
            return {
                contact_id: edge.node.contact_id,
                fullname: edge.node.fullname,
                email: edge.node.email,
                phone: edge.node.phone,
                address: edge.node.address,
                company: edge.node.companies ? edge.node.companies.name : 'Unknown',
                created_by: edge.node.profiles ? edge.node.profiles.fullname : user.fullname
            };
        });

    return contacts;
}

async function getInteractionsByDeal(deal: { deal_id: number }): Promise<any[] | false> {
    let query = `
    query {
        interactionsCollection(
            filter: {
                deal_id: { eq: ${deal.deal_id} }
            }
        ) {
            edges {
                node {
                    interaction_id
                    type
                    created_at
                    note
                    created_by {
                        fullname
                        email
                    }
                }
            }
        }
    }`;

    const result = await gql(query);
    if (!result) {
        return false;
    }

    let interactions = result
        .interactionsCollection
        .edges
        .map((edge: any) => {
            return {
                interaction_id: edge.node.interaction_id,
                type: edge.node.type,
                created_at: edge.node.created_at,
                note: edge.node.note,
                created_by: edge.node.created_by
            };
        });

    return interactions || [];
}


export const load = async ({ params }) => {
    const user = await getProfile();
    if (!user) {
        redirect(303, "/auth");
    }
    const deal = await getDealById(params.deal_id);
    if (!deal) {
        return fail(500, { error: 'Failed to fetch deal from database.' });
    }

    const interactions = await getInteractionsByDeal(deal[0]);
    if (!interactions) {
        return fail(500, { error: 'Failed to fetch interactions from database.' });
    }

    return { deal: deal[0], interactions };
}


export const actions = {
    add: async ({ request }) => {
        const formData = await request.formData();

        const deal_id = Number(formData.get('deal_id'));
        const type = formData.get('type');
        const note = formData.get('note');

        console.log('type:', type, 'note:', note);


        if (!type || !note) {
            console.log('All fields are req');
            
            return fail(400, { error: 'All fields are required.' });
        }

        const user = await getProfile();
        if (!user) {
            return fail(403, { error: 'Unauthorized Access.' });
        }

        const data = {
            type: type.toString(),
            note: note.toString(),
            deal_id: deal_id,
            created_by: user.profile_id
        };

        let mutation = `
            mutation ($objects: [interactionsInsertInput!]!) {
                insertIntointeractionsCollection(objects: $objects) {
                    records {
                    deal_id
                    type
                    note
                    created_at
                    }
                }
            }
        `;

        const result = await gql(mutation, { objects: [data] });
        if (!result) {
            console.log('Failed to create interaction in database.');
            return fail(500, { error: 'Failed to create interaction in database.' });
        }

        return { success: 'Interaction created successfully.' };
    }
} satisfies Actions;