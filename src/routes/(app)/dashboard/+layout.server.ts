import { supabase, getProfile } from '$lib/supabase';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
    const user = await getProfile();
    if (!user) {
        redirect(303, '/auth');
    }

    console.log('Loading dashboard layout for user:', user.profile_id);

    try {
        // Get user's rooms through profiles_rooms junction table
        const { data: userRooms, error: roomsError } = await supabase
            .from('profiles_rooms')
            .select(`
                rooms!inner(
                    room_id,
                    name
                )
            `)
            .eq('profile_id', user.profile_id);

        if (roomsError) {
            console.error('Error fetching user rooms:', roomsError);
            return { user, rooms: [] };
        }

        console.log('User rooms found:', userRooms?.length || 0);

        // Get room details with latest messages and unread counts
        const roomsData = await Promise.all((userRooms || []).map(async (userRoom: any) => {
            const room = userRoom.rooms;

            // Get latest message for this room
            const { data: latestMessage } = await supabase
                .from('messages')
                .select(`
                        message_id,
                        content,
                        send_at,
                        profile_id
                    `)
                .eq('room_id', room.room_id)
                .order('send_at', { ascending: false })
                .limit(1)
                .single();

            // Get sender's profile info if message exists
            let senderName = null;
            if (latestMessage?.profile_id) {
                const { data: senderProfile } = await supabase
                    .from('profiles')
                    .select('fullname')
                    .eq('profile_id', latestMessage.profile_id)
                    .single();
                senderName = senderProfile?.fullname || null;
            }

            // Get all messages in this room
            const { data: allMessages } = await supabase
                .from('messages')
                .select('message_id, profile_id')
                .eq('room_id', room.room_id);

            // Get viewed messages by current user
            const { data: viewedMessages } = await supabase
                .from('views')
                .select('message_id')
                .eq('profile_id', user.profile_id);

            // Calculate unread count
            const viewedMessageIds = new Set(viewedMessages?.map(v => v.message_id) || []);
            const unreadCount = (allMessages || []).filter(message =>
                message.profile_id !== user.profile_id && // Not sent by current user
                !viewedMessageIds.has(message.message_id) // Not viewed by current user
            ).length;

            // Debug logging for unread messages
            if (unreadCount > 0) {
                const unreadMessages = (allMessages || []).filter(message =>
                    message.profile_id !== user.profile_id &&
                    !viewedMessageIds.has(message.message_id)
                );
                unreadMessages.forEach(msg => {
                    console.log(`Unread message ${msg.message_id} from user ${msg.profile_id} in room ${room.room_id}`);
                });
            }

            return {
                room_id: room.room_id,
                name: room.name,
                fullname: senderName,
                message: latestMessage?.content || null,
                unreadCount
            };
        }))


        console.log('Rooms with unread counts:', roomsData);

        return {
            user,
            rooms: roomsData
        };

    } catch (error) {
        console.error('Layout data fetch error:', error);
        return {
            user,
            rooms: []
        };
    }
};