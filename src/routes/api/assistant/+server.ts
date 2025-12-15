/**
 * CRM AI Assistant API Endpoint
 * 
 * Uses Gemini 2.0 Flash with RAG (Retrieval-Augmented Generation)
 * 
 * Key Features:
 * - Gemini 2.0 Flash for fast, efficient responses with free tier support
 * - Vector similarity search using embeddings for context retrieval
 * - Multi-source business context (contacts, deals, tasks, products, interactions)
 * - Automatic discussion title generation
 * 
 * Models:
 * - gemini-2.0-flash-exp: Main conversation model (free tier available)
 * - text-embedding-004: Embedding generation for semantic search
 * 
 * Note: Gemini 3 Pro requires a paid plan. Using Gemini 2.0 Flash for free tier compatibility.
 * @see https://ai.google.dev/gemini-api/docs/models/gemini
 */

import { supabase, getProfile } from '$lib/supabase.js';
import { PUBLIC_GOOGLE_API_KEY } from '$env/static/public';
import { GoogleGenAI } from "@google/genai";
import { discussionsService, chatsService, contactsService, dealsService, interactionsService, profilesService, tasksService, companiesService, productsService } from '$lib/services';

// Initialize Google AI client
const client = new GoogleGenAI({ apiKey: PUBLIC_GOOGLE_API_KEY });

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

// Enhanced function to generate a discussion title based on conversation content
async function generateDiscussionTitle(userMessage: string, aiResponse: string): Promise<string> {
    try {
        const titlePrompt = `Based on this conversation between a user and their CRM assistant, generate a concise, professional title (max 5-7 words) that captures the main topic or purpose.

User's message: "${userMessage}"
AI's response: "${aiResponse}"

Generate only the title, nothing else. Make it business-focused and descriptive.

Examples:
- "Sales Pipeline Review"
- "Customer Onboarding Strategy"
- "Q4 Revenue Forecast"
- "Lead Follow-up Plan"
- "Product Pricing Analysis"`;

        const titleResponse = await client.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: [
                {
                    role: 'user',
                    parts: [{ text: titlePrompt }]
                }
            ],
        });

        const generatedTitle = titleResponse.text?.trim() || 'Business Discussion';

        // Clean up the title (remove quotes, limit length)
        const cleanTitle = generatedTitle
            .replace(/['"]/g, '')
            .substring(0, 50)
            .trim();

        console.log('🏷️ Generated discussion title:', cleanTitle);
        return cleanTitle;

    } catch (error) {
        console.error('Error generating discussion title:', error);
        return 'Business Discussion'; // Fallback title
    }
}

// Enhanced function to get user's recent business context
async function getUserBusinessContext(userProfile: any): Promise<string> {
    try {
        // Get business context using services
        const [contacts, deals, interactions, tasks, products] = await Promise.all([
            contactsService.getAll(userProfile.company_id).then(data => data?.slice(0, 5) || []),
            dealsService.getAll(userProfile.profile_id, userProfile.company_id).then(data => data?.slice(0, 5) || []),
            interactionsService.getAll(userProfile.company_id).then(data => data?.slice(0, 5) || []),
            tasksService.getAll(userProfile.profile_id, userProfile.company_id).then(data => data?.slice(0, 5) || []),
            productsService.getAll(userProfile.company_id).then(data => data?.slice(0, 5) || [])
        ]);

        let contextSummary = '\n\nYour Current Business Context:\n';

        // Recent contacts
        if (contacts.length > 0) {
            contextSummary += `📋 Recent Contacts: ${contacts.map((contact: any) => contact.fullname).join(', ')}\n`;
        }

        // Active deals
        if (deals.length > 0) {
            contextSummary += `💼 Active Deals: ${deals.map((deal: any) =>
                `${deal.title} ($${deal.value} - ${deal.stage})`
            ).join(', ')}\n`;
        }

        // Recent interactions
        if (interactions.length > 0) {
            contextSummary += `🤝 Recent Interactions: ${interactions.map((interaction: any) =>
                `${interaction.type}`
            ).join(', ')}\n`;
        }

        // Pending tasks
        if (tasks.length > 0) {
            contextSummary += `📋 Pending Tasks: ${tasks.map((task: any) =>
                `${task.title} (${task.priority} priority)`
            ).join(', ')}\n`;
        }

        // Available products
        if (products.length > 0) {
            contextSummary += `🛒 Available Products: ${products.map((product: any) =>
                `${product.name} ($${product.unit_price})`
            ).join(', ')}\n`;
        }

        return contextSummary;

    } catch (error) {
        console.error('Error getting business context:', error);
        return '';
    }
}

export const POST = async (event) => {
    const user = await getProfile();
    if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const company = await companiesService.getById(user.company_id);

    const { discussion_id, message } = await event.request.json();

    if (!discussion_id || !message) {
        return new Response(JSON.stringify({ error: 'Discussion ID and message are required' }), { status: 400 });
    }

    try {
        // Get conversation context from database using chatsService
        const chats = await chatsService.getAll(parseInt(discussion_id));

        if (!chats) {
            console.error('Error fetching chats: No chats found');
            return new Response(JSON.stringify({ error: 'Failed to fetch conversation context' }), { status: 500 });
        }

        // Build conversation context for AI
        const conversationHistory = chats.map((chat: any) => ({
            role: chat.is_ai ? 'model' : 'user',
            parts: [{ text: chat.content }]
        }));

        // Get discussion info using discussionsService
        const discussion = await discussionsService.getById(parseInt(discussion_id));

        const discussionInfo = discussion;

        // Get RAG context and user business context
        console.log('🔍 Retrieving RAG context for:', message);
        const ragContext = await getRelevantContext(message, user);
        console.log('Relevent Context:', ragContext);
        const businessContext = await getUserBusinessContext(user);
        console.log('Business Context:', businessContext);

        // Prepare enhanced AI request with RAG context
        const systemPrompt = `
        You are an intelligent CRM assistant with access to the user's business data. Remember to leverage this data to provide accurate and relevant responses.

            **Your Role:**
            - Help with CRM tasks, customer management, sales insights, and business analytics
            - Provide actionable advice based on the user's actual data
            - Be concise but thorough in your responses
            - Use the provided context to give personalized recommendations

            **Current CRM:** DZ Sales is a mini CRM build to help small bussnisses to manage theire work.

            **Current Discussion:** "${discussionInfo?.name || 'General Discussion'}"
            ${discussionInfo?.description ? `Context: ${discussionInfo.description}` : ''}

            **User Profile:** ${user.fullname} (${user.role}) at Company: ${company?.name} which is in ${company?.industry} industry.

            ${businessContext}
            ${ragContext}

            **Recent Conversation:**
            ${conversationHistory.slice(-5).map((msg: any) =>
                        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.parts[0].text}`
                    ).join('\n')}

            Please provide a helpful, data-driven response as their CRM assistant. If the context contains relevant information, reference it specifically. If you need more information to give a complete answer, ask clarifying questions.`;

        const userMessage = message;
        console.log('System Prompt:', systemPrompt);

        // Send request to Google AI with enhanced context
        const aiResponse = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: 'user',
                    parts: [{ text: userMessage }]
                }
            ],
            config: {
                systemInstruction: systemPrompt,
            },
        });


        const aiMessage = aiResponse.text || 'Sorry, I could not generate a response.';

        console.log('Responce: ', aiMessage);

        // Check if this is the first AI response in the discussion
        const isFirstAIResponse = conversationHistory.filter((msg: any) => msg.role === 'model').length === 0;
        console.log('🔍 Is first AI response:', isFirstAIResponse);

        // Generate and update discussion title if this is the first response
        let generatedTitle = null;
        if (isFirstAIResponse) {
            console.log('🏷️ Generating discussion title...');
            generatedTitle = await generateDiscussionTitle(message, aiMessage);

            // Update discussion title in database
            try {
                // Update discussion title using discussionsService
                try {
                    await discussionsService.update(parseInt(discussion_id), { name: generatedTitle });
                    console.log('✅ Discussion title updated successfully:', generatedTitle);
                } catch (titleError) {
                    console.error('❌ Error updating discussion title:', titleError);
                    // Continue with the response even if title update fails
                }
            } catch (error) {
                console.error('❌ Error generating or updating discussion title:', error);
                // Continue without updating title
            }
        }

        // Insert AI response to database using chatsService
        const insertedChat = await chatsService.sendAIMessage(parseInt(discussion_id), aiMessage);

        if (!insertedChat) {
            console.error('Failed to insert AI response to database');
            return new Response(JSON.stringify({
                error: 'Failed to insert AI response to database'
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        // Return success response
        return new Response(JSON.stringify({
            success: true,
            message: 'AI response generated and saved successfully',
            ai_response: aiMessage,
            chat_id: insertedChat.chat_id,
            title_generated: isFirstAIResponse,
            new_title: generatedTitle
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