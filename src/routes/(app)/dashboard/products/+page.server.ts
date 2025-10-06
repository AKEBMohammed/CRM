import { fail } from '@sveltejs/kit';
import { gql } from '$lib/graphql';
import type { Actions, PageServerLoad } from './$types';
import { getProfile, supabase } from '$lib/supabase';


async function addProduct(product: { name: string; description: string; created_by: number }): Promise<boolean> {
    const mutation = `
        mutation ($name: String!, $description: String!, $created_by: BigInt!) {
            insertIntoproductsCollection(
                objects: [{
                    name: $name,
                    description: $description,
                    created_by: $created_by
                }]
            ) {
                records {
                    name
                    description
                    created_by
                }
            }
        }
    `;

    const res = await gql(mutation, {
        name: product.name,
        description: product.description,
        created_by: product.created_by
    });

    if (!res) {
        return false
    }

    return true;
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


export const load: PageServerLoad = async ({ params, cookies }) => {
    let user = await getProfile()
    if (!user) {
        return fail(401, { error: 'Unauthorized access. Please log in again.' });
    }

    const products = await getProductsByUser(user);
    if (!products) {
        return fail(500, { error: 'Failed to fetch products from database.' });
    }

    return { products };

};

export const actions = {
    add: async ({ request }) => {
        let user = await getProfile()
        if (!user) {
            return fail(401, { error: 'Unauthorized access. Please log in again.' });
        }

        const formData = await request.formData();
        const name = formData.get('name');
        const description = formData.get('description');

        if (!name || !description) {
            return fail(400, { error: 'All fields are required. Please fill in all the information.' });
        }


        const result = await addProduct({
            name: String(name),
            description: String(description),
            created_by: user.profile_id
        });
        if (!result) {
            return fail(500, { error: 'Failed to add product. Please try again later.' });
        }

        return { success: 'Product added successfully!' };
    },

    import: async ({ request, cookies }) => {
        const user = await getProfile()
        if (!user) {
            return fail(401, { error: 'Unauthorized access. Please log in again.' });
        }

        const formData = await request.formData();
        const file = formData.get('file');
        if (!file || !(file instanceof File)) {
            return fail(400, { error: 'No file uploaded. Please select a file to import.' });
        }

        const text = await file.text();
        let products: any[] = [];

        try {
            if (file.name.endsWith('.json')) {
                products = JSON.parse(text);
            } else if (file.name.endsWith('.csv')) {
                // Parse CSV
                const lines = text.trim().split('\n');
                const headers = lines[0].split(',').map(h => h.trim());
                products = [];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());
                    const product_obj: any = {};

                    headers.forEach((header, index) => {
                        const key = header.toLowerCase().replace(/\s+/g, '_');
                        product_obj[key] = values[index] || '';
                    });

                    // Map CSV headers to expected fields
                    const mappedProduct = {
                        name: product_obj.name,
                        description: product_obj.description,
                    };


                    if (mappedProduct.name) {
                        products.push(mappedProduct);
                    }
                }
            } else {
                return fail(400, { error: 'Unsupported file format. Please use JSON or CSV files only.' });
            }
        } catch (e) {
            return fail(400, { error: 'Invalid file format or corrupted data. Please check your file and try again.' });
        }

        if (!Array.isArray(products)) {
            return fail(400, { error: 'File should contain an array of products. Please check the file format.' });
        }

        let successCount = 0;
        let failedProducts: string[] = [];

        for (let c of products) {
            if (!c.name || !c.description) {
                console.warn('Skipping product with missing name or description:', c);
                failedProducts.push(c.name || c.description || 'Unknown product');
                continue;
            }



            const res = await addProduct({
                name: String(c.fullname),
                description: String(c.email),
                created_by: user.profile_id
            });

            if (!res) {
                console.error('Failed to create product:', c.name);
                failedProducts.push(c.name || c.description);
            } else {
                successCount++;
            }
        }

        if (successCount === 0) {
            return fail(500, { error: `Failed to import any products. ${failedProducts.length > 0 ? 'Failed products: ' + failedProducts.join(', ') : ''}` });
        }

        let message = `Successfully imported ${successCount} products!`;
        if (failedProducts.length > 0) {
            message += ` (${failedProducts.length} failed: ${failedProducts.join(', ')})`;
        }

        return { success: message };
    },

    export: async ({ request, cookies }) => {
        const user = await getProfile()
        if (!user) {
            return fail(401, { error: 'Unauthorized access. Please log in again.' });
        }

        const formData = await request.formData();
        const format = formData.get('format');



        let products = await getProductsByUser(user);

        if (!products || products.length === 0) {
            return fail(500, { error: 'Failed to fetch user profiles for export.' });
        }


        if (!format || (format !== 'csv' && format !== 'json' && format !== 'xml')) {
            return fail(400, { error: 'Invalid export format selected. Please choose CSV, JSON, or XML.' });
        }

        // Generate filename with timestamp and company ID for security policies
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('-', '');
        const filename = `products-export-${user.user_id}-${user.company_id}-${timestamp}.${format}`;
        const bucketName = 'exports'; // You'll need to create this bucket in Supabase

        let fileContent: string;
        let mimeType: string;

        if (format === 'csv') {
            const csvHeaders = ['Product ID', 'Name', 'Description', 'Created By'];
            const csvRows = products.map((product: any) => [
                product.product_id,
                product.name,
                product.description,
                product.fullname + ' (' + product.email + ')'
            ]);


            fileContent = [
                csvHeaders.join(','),
                ...csvRows.map((row: any[]) => row.join(','))
            ].join('\n');
            mimeType = 'text/csv';

        } else if (format === 'json') {
            fileContent = JSON.stringify(products, null, 2);
            mimeType = 'application/json';

        } else if (format === 'xml') {
            fileContent = `<?xml version="1.0" encoding="UTF-8"?>
<products>
    ${products.map((product: any) => `
    <product>
        <product_id>${product.product_id}</product_id>
        <name>${product.name}</name>
        <description>${product.description}</description>
        <created_by>${product.fullname + ' (' + product.email + ')'}</created_by>
    </product>`).join('')}
</products>`.trim();
            mimeType = 'application/xml';

        } else {
            return fail(400, { error: 'Invalid export format selected. Please choose CSV, JSON, or XML.' });
        }



        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filename, fileContent, {
                contentType: mimeType,
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return fail(500, { error: 'Failed to save export file. Please try again.' });
        }

        // Generate a signed URL for download (expires in 1 hour)
        const { data: urlData, error: urlError } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(filename, 3600);

        if (urlError) {
            console.error('URL generation error:', urlError);
            return fail(500, { error: 'Failed to generate download link. Please try again.' });
        }

        return {
            success: `Export completed successfully! Your file contains ${products.length} products.`,
            downloadUrl: urlData.signedUrl,
            filename: filename
        };
    },

    // Edit contact action
    edit: async ({ request, cookies }) => {
        const user = await getProfile()

        if (!user) {
            return fail(401, { error: 'Unauthorized access. Please log in again.' });
        }

        const formData = await request.formData();        
        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;

        if (!name || !description) {
            return fail(400, { error: 'Missing required fields' });
        }

        try {
            // Update contact in database
            const updateMutation = `
                mutation ($product_id: BigInt!, $name: String!, $description: String!) {
                    updateproductsCollection(
                        filter: { product_id: { eq: $product_id } }
                        set: {
                            name: $name,
                            description: $description
                        }
                    ) {
                        records {
                            product_id
                            name
                            description
                            profiles {
                                fullname
                                email
                            }
                        }
                    }
                }
            `;

            const result = await gql(updateMutation, {
                product_id: parseInt(id),
                name,
                description
            });

            if (!result?.updateproductsCollection?.records?.length) {
                return fail(500, { error: 'Failed to update product' });
            }

            return {
                success: `Product ${name} updated successfully!`
            };

        } catch (err) {
            console.error('Edit product error:', err);
            return fail(500, { error: 'Failed to update product' });
        }
    },

    // Delete product action
    delete: async ({ request, cookies }) => {
        const user = await getProfile()

        if (!user) {
            return fail(401, { error: 'Unauthorized access. Please log in again.' });
        }

        const formData = await request.formData();
        const id = formData.get('id') as string;
        const name = formData.get('name') as string;

        if (!id) {
            return fail(400, { error: 'Missing product ID' });
        }

        try {
            // Delete product from database
            const deleteMutation = `
                mutation ($product_id: BigInt!) {
                    deleteFromproductsCollection(
                        filter: { product_id: { eq: $product_id } }
                    ) {
                        records {
                            product_id
                            name
                        }
                    }
                }
            `;

            const result = await gql(deleteMutation, {
                product_id: parseInt(id)
            });

            if (!result?.deleteFromproductsCollection?.records?.length) {
                return fail(500, { error: 'Failed to delete product' });
            }

            return {
                success: `Product ${name || 'Unknown'} deleted successfully!`
            };

        } catch (err) {
            console.error('Delete product error:', err);
            return fail(500, { error: 'Failed to delete product' });
        }
    }
} satisfies Actions;