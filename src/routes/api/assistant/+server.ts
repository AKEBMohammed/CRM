import { getProfile } from '$lib/supabase.js';
import { PUBLIC_GOOGLE_API_KEY } from '$env/static/public';
import { GoogleGenAI } from "@google/genai";
import { gql } from '$lib/graphql';

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

        // Prepare AI request with context
        const prompt = `You are a helpful CRM assistant. The current discussion is about: "${discussionInfo?.name || 'General Discussion'}". 
                        ${discussionInfo?.description ? `Context: ${discussionInfo.description}` : ''}
                        
                        Previous conversation:
                        ${conversationHistory.slice(-5).map((msg: any) =>
            `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.parts[0].text}`
        ).join('\n')}
                        
                        Current message: ${message}
                        
                        Please provide a helpful response as a CRM assistant.`


        // Send request to Google AI
        const aiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
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