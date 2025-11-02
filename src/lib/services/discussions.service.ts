import { supabase } from '$lib/supabase';

export const discussionsService = {
    // Get all discussions for a user
    async getAll(profile_id: number) {
        const { data, error } = await supabase
            .from('discussions')
            .select(`
                *,
                chat_count:chats(count),
                last_chat:chats(content, is_ai, created_at)
            `)
            .eq('profile_id', profile_id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Alias method for consistency with other services
    async getByProfileId(profile_id: number) {
        return this.getAll(profile_id);
    },

    // Get discussion by ID
    async getById(discussion_id: number) {
        const { data, error } = await supabase
            .from('discussions')
            .select(`
                *,
                chats(
                    chat_id,
                    content,
                    is_ai,
                    created_at
                )
            `)
            .eq('discussion_id', discussion_id)
            .single();

        if (error) throw error;
        return data;
    },

    // Create discussion
    async create(discussion_data: {
        name: string;
        profile_id: number;
    }) {
        const { data, error } = await supabase
            .from('discussions')
            .insert(discussion_data)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update discussion
    async update(discussion_id: number, updates: Partial<{
        name: string;
    }>) {
        const { data, error } = await supabase
            .from('discussions')
            .update(updates)
            .eq('discussion_id', discussion_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete discussion
    async delete(discussion_id: number) {
        const { error } = await supabase
            .from('discussions')
            .delete()
            .eq('discussion_id', discussion_id);

        if (error) throw error;
        return true;
    }
};

export const chatsService = {
    // Get chats for a discussion
    async getAll(discussion_id: number) {
        const { data, error } = await supabase
            .from('chats')
            .select('*')
            .eq('discussion_id', discussion_id)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    // Send user message
    async sendUserMessage(discussion_id: number, content: string) {
        const { data, error } = await supabase
            .from('chats')
            .insert({
                discussion_id,
                content,
                is_ai: false
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Send AI message (usually handled by API)
    async sendAIMessage(discussion_id: number, content: string) {
        const { data, error } = await supabase
            .from('chats')
            .insert({
                discussion_id,
                content,
                is_ai: true
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete chat message
    async delete(chat_id: number) {
        const { error } = await supabase
            .from('chats')
            .delete()
            .eq('chat_id', chat_id);

        if (error) throw error;
        return true;
    }
};

export const notificationsService = {
    // Get all notifications for a user
    async getAll(profile_id: number) {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('profile_id', profile_id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get unread notifications
    async getUnread(profile_id: number) {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('profile_id', profile_id)
            .is('seen_at', null)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Create notification
    async create(notification_data: {
        profile_id: number;
        content: string;
    }) {
        const { data, error } = await supabase
            .from('notifications')
            .insert(notification_data)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Mark notification as seen
    async markSeen(notification_id: number) {
        const { data, error } = await supabase
            .from('notifications')
            .update({ seen_at: new Date().toISOString() })
            .eq('notification_id', notification_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Mark all notifications as seen for user
    async markAllSeen(profile_id: number) {
        const { data, error } = await supabase
            .from('notifications')
            .update({ seen_at: new Date().toISOString() })
            .eq('profile_id', profile_id)
            .is('seen_at', null)
            .select();

        if (error) throw error;
        return data;
    },

    // Delete notification
    async delete(notification_id: number) {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('notification_id', notification_id);

        if (error) throw error;
        return true;
    },

    // Get notification count
    async getCount(profile_id: number) {
        const { data, error } = await supabase
            .from('notifications')
            .select('notification_id, seen_at')
            .eq('profile_id', profile_id);

        if (error) throw error;

        const total = data?.length || 0;
        const unread = data?.filter(n => !n.seen_at).length || 0;

        return { total, unread };
    }
};