import { getProfile, supabase } from '$lib/supabase.js';
import { PUBLIC_GOOGLE_API_KEY } from '$env/static/public';
import { GoogleGenAI } from "@google/genai";
import { gql } from '$lib/graphql';

// Initialize Google AI for both generation and embeddings
const genAI = new GoogleGenAI({ apiKey: PUBLIC_GOOGLE_API_KEY });

// Helper function to generate embeddings for user queries
async function embedText(text: string): Promise<number[]> {
    try {
        // Use the REST API directly for embeddings since the SDK might not support it yet
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${PUBLIC_GOOGLE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: {
                        parts: [{ text }]
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Embedding API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.embedding.values;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw error;
    }
}

// Enhanced RAG function to retrieve relevant context
async function getRelevantContext(userMessage: string, userProfile: any): Promise<string> {
    try {
        // Generate embedding for user message
        const queryEmbedding = await embedText(userMessage);

        // Perform similarity search using Supabase client directly (since GraphQL might not support vector similarity)
        let { data: contextData, error: similarityError } = await supabase
            .rpc('match_embeddings', {
                query_embedding: queryEmbedding,
                match_threshold: 0.7,
                match_count: 10
            });

        if (similarityError) {
            console.error('Similarity search error:', similarityError);
            // Fallback to recent data if similarity search fails
            const { data: fallbackData } = await supabase
                .from('embeddings')
                .select('source_table, source_id, content, metadata')
                .in('source_table', ['companies', 'contacts', 'products', 'deals', 'interactions', 'tasks'])
                .order('created_at', { ascending: false })
                .limit(5);
            
            contextData = fallbackData;
        }

        // Format the relevant context
        const relevantChunks = contextData?.map(
            (item: any) => `[${item.source_table}]: ${item.content}`
        ) || [];

        return relevantChunks.length > 0 
            ? `\n\nRelevant CRM Data:\n${relevantChunks.slice(0, 5).join('\n')}\n`
            : '';

    } catch (error) {
        console.error('Error retrieving RAG context:', error);
        return ''; // Fallback to no context if RAG fails
    }
}

// Enhanced function to get user's recent business context
async function getUserBusinessContext(userProfile: any): Promise<string> {
    try {
        const businessContextQuery = `
            query GetBusinessContext($profile_id: BigInt!, $company_id: BigInt!) {
                # Recent contacts
                contactsCollection(
                    filter: { created_by: { eq: $profile_id } }
                    orderBy: [{ created_at: DescNullsLast }]
                    first: 3
                ) {
                    edges {
                        node {
                            fullname
                            email
                            created_at
                        }
                    }
                }
                
                # Active deals
                dealsCollection(
                    filter: { 
                        profile_id: { eq: $profile_id }
                        stage: { neq: "closed_won" }
                        stage: { neq: "closed_lost" }
                    }
                    orderBy: [{ updated_at: DescNullsLast }]
                    first: 3
                ) {
                    edges {
                        node {
                            title
                            value
                            stage
                            probability
                        }
                    }
                }
                
                # Recent interactions
                interactionsCollection(
                    filter: { profile_id: { eq: $profile_id } }
                    orderBy: [{ created_at: DescNullsLast }]
                    first: 3
                ) {
                    edges {
                        node {
                            type
                            note
                            created_at
                        }
                    }
                }
                
                # Pending tasks
                tasksCollection(
                    filter: { 
                        assigned_to: { eq: $profile_id }
                        status: { neq: "completed" }
                    }
                    orderBy: [{ due_date: AscNullsLast }]
                    first: 5
                ) {
                    edges {
                        node {
                            title
                            priority
                            due_date
                            status
                        }
                    }
                }
            }
        `;

        const businessData = await gql(businessContextQuery, {
            profile_id: userProfile.profile_id,
            company_id: userProfile.company_id
        });

        let contextSummary = '\n\nYour Current Business Context:\n';
        
        // Recent contacts
        if (businessData.contactsCollection?.edges?.length > 0) {
            contextSummary += `📋 Recent Contacts: ${businessData.contactsCollection.edges.map((e: any) => e.node.fullname).join(', ')}\n`;
        }
        
        // Active deals
        if (businessData.dealsCollection?.edges?.length > 0) {
            contextSummary += `💰 Active Deals: ${businessData.dealsCollection.edges.map((e: any) => 
                `${e.node.title} ($${e.node.value} - ${e.node.stage})`
            ).join(', ')}\n`;
        }
        
        // Recent interactions
        if (businessData.interactionsCollection?.edges?.length > 0) {
            contextSummary += `📞 Recent Interactions: ${businessData.interactionsCollection.edges.map((e: any) => 
                `${e.node.type}`
            ).join(', ')}\n`;
        }
        
        // Pending tasks
        if (businessData.tasksCollection?.edges?.length > 0) {
            contextSummary += `✅ Pending Tasks: ${businessData.tasksCollection.edges.map((e: any) => 
                `${e.node.title} (${e.node.priority} priority)`
            ).join(', ')}\n`;
        }

        return contextSummary;

    } catch (error) {
        console.error('Error getting business context:', error);
        return '';
    }
}

const ai = new GoogleGenAI({ apiKey: PUBLIC_GOOGLE_API_KEY });

export const POST = async (event) => {
    const user = await getProfile();
    if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { discussion_id, message } = await event.request.json();

    if (!discussion_id || !message) {
        return new Response(JSON.stringify({ error: 'Discussion ID and message are required' }), { status: 400 });
    }

    try {
        // Get conversation context from database
        const contextQuery = `
            query GetConversationContext($discussion_id: BigInt!) {
                chatsCollection(
                    filter: { discussion_id: { eq: $discussion_id } }
                    orderBy: [{ created_at: AscNullsLast }]
                    last: 10
                ) {
                    edges {
                        node {
                            content
                            is_ai
                            created_at
                        }
                    }
                }
                discussionsCollection(
                    filter: { discussion_id: { eq: $discussion_id } }
                ) {
                    edges {
                        node {
                            name
                        }
                    }
                }
            }
        `;

        const contextData = await gql(contextQuery, { discussion_id: parseInt(discussion_id) });

        // Build conversation context for AI
        const conversationHistory = contextData.chatsCollection.edges.map((edge: any) => ({
            role: edge.node.is_ai ? 'model' : 'user',
            parts: [{ text: edge.node.content }]
        }));

        const discussionInfo = contextData.discussionsCollection.edges[0]?.node;

        // Get RAG context and user business context
        console.log('🔍 Retrieving RAG context for:', message);
        const ragContext = await getRelevantContext(message, user);
        const businessContext = await getUserBusinessContext(user);

        // Prepare enhanced AI request with RAG context
        const systemPrompt = `You are an intelligent CRM assistant with access to the user's business data. 

**Your Role:**
- Help with CRM tasks, customer management, sales insights, and business analytics
- Provide actionable advice based on the user's actual data
- Be concise but thorough in your responses
- Use the provided context to give personalized recommendations

**Current Discussion:** "${discussionInfo?.name || 'General Discussion'}"
${discussionInfo?.description ? `Context: ${discussionInfo.description}` : ''}

**User Profile:** ${user.fullname} (${user.role}) at Company ID: ${user.company_id}

${businessContext}
${ragContext}

**Recent Conversation:**
${conversationHistory.slice(-5).map((msg: any) =>
            `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.parts[0].text}`
        ).join('\n')}

**Current Question:** ${message}

Please provide a helpful, data-driven response as their CRM assistant. If the context contains relevant information, reference it specifically. If you need more information to give a complete answer, ask clarifying questions.`;

        // Send request to Google AI with enhanced context
        const aiResponse = await genAI.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: systemPrompt,
        });


        const aiMessage = aiResponse.text || 'Sorry, I could not generate a response.';

        // Insert AI response to database using GraphQL
        const insertMutation = `
            mutation InsertAIResponse($discussion_id: BigInt!, $content: String!) {
                insertIntochatsCollection(
                    objects: [{
                        discussion_id: $discussion_id,
                        content: $content,
                        is_ai: true
                    }]
                ) {
                    records {
                        chat_id
                        discussion_id
                        content
                        is_ai
                        created_at
                    }
                }
            }
        `;

        const insertResult = await gql(insertMutation, {
            discussion_id: parseInt(discussion_id),
            content: aiMessage
        });

        if (!insertResult || !insertResult.insertIntochatsCollection.records.length) {
            throw new Error('Failed to insert AI response to database');
        }

        // Return success response
        return new Response(JSON.stringify({
            success: true,
            message: 'AI response generated and saved successfully',
            ai_response: aiMessage,
            chat_id: insertResult.insertIntochatsCollection.records[0].chat_id
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error('Assistant API error:', error);

        return new Response(JSON.stringify({
            error: 'Failed to process AI request',
            details: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};