import { supabase } from '$lib/supabase';

export const roomsService = {
    // Get all rooms for a user
    async getAll(profile_id: number) {
        const { data, error } = await supabase
            .from('profiles_rooms')
            .select(`
                rooms(
                    room_id,
                    name,
                    created_at,
                    creator:profiles!created_by(fullname, email)
                )
            `)
            .eq('profile_id', profile_id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data?.map(item => item.rooms) || [];
    },

    // Get room by ID
    async getById(room_id: number) {
        const { data, error } = await supabase
            .from('rooms')
            .select(`
                *,
                creator:profiles!created_by(fullname, email),
                members:profiles_rooms(
                    profile:profiles(profile_id, fullname, email, role)
                )
            `)
            .eq('room_id', room_id)
            .single();

        if (error) throw error;
        return data;
    },

    // Create room
    async create(room_data: {
        name: string;
        created_by: number;
    }) {
        const { data, error } = await supabase
            .from('rooms')
            .insert(room_data)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update room
    async update(room_id: number, updates: Partial<{
        name: string;
    }>) {
        const { data, error } = await supabase
            .from('rooms')
            .update(updates)
            .eq('room_id', room_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete room
    async delete(room_id: number) {
        const { error } = await supabase
            .from('rooms')
            .delete()
            .eq('room_id', room_id);

        if (error) throw error;
        return true;
    },

    // Add member to room
    async addMember(room_id: number, profile_id: number) {
        const { data, error } = await supabase
            .from('profiles_rooms')
            .insert({
                room_id,
                profile_id
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Remove member from room
    async removeMember(room_id: number, profile_id: number) {
        const { error } = await supabase
            .from('profiles_rooms')
            .delete()
            .eq('room_id', room_id)
            .eq('profile_id', profile_id);

        if (error) throw error;
        return true;
    },

    // Get room members
    async getMembers(room_id: number) {
        const { data, error } = await supabase
            .from('profiles_rooms')
            .select(`
                profile:profiles(
                    profile_id,
                    fullname,
                    email,
                    role,
                    avatar
                )
            `)
            .eq('room_id', room_id);

        if (error) throw error;
        return data?.map(item => item.profile) || [];
    },

    // Check if user is member of room
    async isMember(room_id: number, profile_id: number) {
        const { data, error } = await supabase
            .from('profiles_rooms')
            .select('profiles_rooms_id')
            .eq('room_id', room_id)
            .eq('profile_id', profile_id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return !!data;
    }
};

export const messagesService = {
    // Get messages for a room
    async getAll(room_id: number, limit: number = 50) {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:profiles!sender_id(fullname, email, avatar),
                reply_to_message:messages!reply_to(content, sender:profiles!sender_id(fullname)),
                file:files(v_name, p_name)
            `)
            .eq('room_id', room_id)
            .order('send_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data?.reverse() || [];
    },

    // Send message
    async send(message_data: {
        room_id: number;
        sender_id: number;
        content: string;
        reply_to?: number;
        file_id?: number;
    }) {
        const { data, error } = await supabase
            .from('messages')
            .insert(message_data)
            .select(`
                *,
                sender:profiles!sender_id(fullname, email, avatar)
            `)
            .single();

        if (error) throw error;
        return data;
    },

    // Update message
    async update(message_id: number, content: string) {
        const { data, error } = await supabase
            .from('messages')
            .update({ content })
            .eq('message_id', message_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete message
    async delete(message_id: number) {
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('message_id', message_id);

        if (error) throw error;
        return true;
    },

    // Mark message as viewed
    async markViewed(message_id: number, profile_id: number) {
        const { data, error } = await supabase
            .from('views')
            .insert({
                message_id,
                profile_id
            })
            .select()
            .single();

        if (error && error.code !== '23505') throw error; // Ignore duplicate entries
        return data;
    },

    // Get message by ID with complete details (profiles, files, views)
    async getByIdWithDetails(message_id: number) {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                profiles!messages_sender_id_fkey (
                    fullname,
                    email
                ),
                files (
                    file_id,
                    v_name,
                    p_name
                ),
                views (
                    profile_id,
                    seen_at,
                    profiles (
                        fullname,
                        email
                    )
                )
            `)
            .eq('message_id', message_id)
            .single();

        if (error) throw error;
        return data;
    },

    // Update message with file_id
    async updateFile(message_id: number, file_id: number) {
        const { data, error } = await supabase
            .from('messages')
            .update({ file_id })
            .eq('message_id', message_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Mark multiple messages as viewed (bulk operation)
    async markViewedBulk(message_ids: number[], profile_id: number) {
        if (!message_ids || message_ids.length === 0) {
            return []; // Return empty array if no messages to mark
        }

        // Remove duplicates from message_ids
        const uniqueMessageIds = [...new Set(message_ids)];

        // Check which messages are already viewed to avoid duplicates
        const { data: existingViews, error: checkError } = await supabase
            .from('views')
            .select('message_id')
            .eq('profile_id', profile_id)
            .in('message_id', uniqueMessageIds);

        if (checkError) throw checkError;

        // Filter out already viewed messages
        const existingViewedIds = new Set(existingViews?.map(v => v.message_id) || []);
        const newMessageIds = uniqueMessageIds.filter(id => !existingViewedIds.has(id));

        if (newMessageIds.length === 0) {
            console.log('All messages already marked as viewed');
            return [];
        }

        // Create view records for unviewed messages only
        const viewRecords = newMessageIds.map(message_id => ({
            message_id,
            profile_id
        }));

        const { data, error } = await supabase
            .from('views')
            .insert(viewRecords)
            .select();

        if (error) {
            // Even if there's an error, log it but don't throw to prevent UI breaking
            console.error('Error inserting view records:', error);
            throw error;
        }

        console.log(`Successfully marked ${newMessageIds.length} new messages as viewed`);
        return data;
    },

    // Get unread count for user in room
    async getUnreadCount(room_id: number, profile_id: number) {
        // Get all messages in room
        const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('message_id, sender_id')
            .eq('room_id', room_id)
            .neq('sender_id', profile_id); // Exclude own messages

        if (messagesError) throw messagesError;

        // Get viewed messages by user
        const { data: views, error: viewsError } = await supabase
            .from('views')
            .select('message_id')
            .eq('profile_id', profile_id);

        if (viewsError) throw viewsError;

        const viewedMessageIds = new Set(views?.map(v => v.message_id) || []);
        const unreadCount = messages?.filter(msg => !viewedMessageIds.has(msg.message_id)).length || 0;

        return unreadCount;
    }
};