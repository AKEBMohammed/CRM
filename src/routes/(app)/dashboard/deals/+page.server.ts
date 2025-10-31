import { gql } from "$lib/graphql";
import { getProfile } from "$lib/supabase";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";

async function getDeals() {
    let query = `
        query {
            dealsCollection {
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
                    }
                }
            }
        }
    `;

    const result = await gql(query);
    if (!result) {
        return false;
    }

    return result.dealsCollection.edges.map((edge: any) => edge.node);
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

async function getProductsByUser(user: { profile_id: number, fullname: string, role: string, company_id: number }): Promise<any[] | false> {
    let query = `
    query {
        productsCollection(
            filter: {
                ${user.role === 'admin'
            ? ''//` created_by: { company_id: { eq: ${user.company_id} } }`
            : ` created_by: { eq: ${user.profile_id} }`
        }
            }
        ) {
            edges {
                node {
                    product_id
                    name
                    description
                    profiles {
                        fullname
                        email
                        company_id
                    }

                    
                }
            }
        }
    }`


    const result = await gql(query);
    if (!result) {
        return false;
    }


    let products = result
        .productsCollection
        .edges
        .map((edge: any) => {
            return {
                product_id: edge.node.product_id,
                name: edge.node.name,
                description: edge.node.description,
                fullname: edge.node.profiles.fullname,
                email: edge.node.profiles.email,
            };
        });

    return products;
}


export const load = async () => {
    const user = await getProfile();
    if (!user) {
        redirect(303, "/auth");
    }
    const deals = await getDeals();
    if (!deals) {
        return fail(500, { error: 'Failed to fetch deals from database.' });
    }

    const contacts = await getContactsByUser(user);
    if (!contacts) {
        return fail(500, { error: 'Failed to fetch contacts from database.' });
    }

    const products = await getProductsByUser(user);
    if (!products) {
        return fail(500, { error: 'Failed to fetch products from database.' });
    }

    return { deals, contacts, products };
}


export const actions = {
    add: async ({ request }) => {
        const formData = await request.formData();

        const title = formData.get('title');
        const value = formData.get('value');
        const stage = formData.get('stage');
        const probability = formData.get('probability');
        const contact_id = formData.get('contact_id');
        const product_id = formData.get('product_id');

        console.log('deal: title', title, ' - value: ', value, ' - stage: ', stage, ' - probability: ', probability, ' - contact_id: ', contact_id, ' - product_id: ', product_id);

        if (!title || !value || !stage || !probability || !contact_id || !product_id) {
            console.log('All fields are required.');
            return fail(400, { error: 'All fields are required.' });
        }


        const data = {
            title: title.toString(),
            value: Number(value),
            stage: stage.toString(),
            probability: Number(probability),
            contact_id: Number(contact_id),
            product_id: Number(product_id),
        };

        let mutation = `
            mutation ($objects: [dealsInsertInput!]!) {
                insertIntodealsCollection(objects: $objects) {
                    records {
                    deal_id
                    title
                    value
                    contact_id
                    product_id
                    }
                }
            }
        `;

        const result = await gql(mutation, { objects: [data] });
        if (!result) {
            return fail(500, { error: 'Failed to create deal in database.' });
        }

        return { success: 'Deal created successfully.' };
    }
} satisfies Actions;