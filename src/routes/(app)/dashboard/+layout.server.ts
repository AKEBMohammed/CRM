import { getProfile } from '$lib/supabase';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { roomsService, messagesService, notificationsService } from '$lib/services';

export const load: LayoutServerLoad = async ({ cookies }) => {
    const user = await getProfile();
    if (!user) {
        redirect(303, '/auth');
    }

    console.log('Loading dashboard layout for user:', user.profile_id);

    try {
        // Get user's rooms using roomsService
        const userRooms = await roomsService.getAll(user.profile_id);

        console.log('User rooms found:', userRooms?.length || 0);

        // Get room details with latest messages and unread counts
        const roomsData = await Promise.all((userRooms || []).map(async (room: any) => {
            try {
                // Get latest message for this room using messagesService
                const messages = await messagesService.getAll(room.room_id, 1);
                const latestMessage = messages?.[0] || null;

                // Get unread count using messagesService
                const unreadCount = await messagesService.getUnreadCount(room.room_id, user.profile_id);

                return {
                    room_id: room.room_id,
                    name: room.name,
                    fullname: latestMessage?.sender?.fullname || null,
                    message: latestMessage?.content || null,
                    unreadCount
                };
            } catch (roomError) {
                console.error(`Error processing room ${room.room_id}:`, roomError);
                return {
                    room_id: room.room_id,
                    name: room.name,
                    fullname: null,
                    message: null,
                    unreadCount: 0
                };
            }
        }));

        console.log('Rooms with unread counts:', roomsData);

        // Get user's notifications using notificationsService
        const notifications = await notificationsService.getAll(user.profile_id);

        return {
            user,
            rooms: roomsData,
            notifications: notifications || []
        };

    } catch (error) {
        console.error('Layout data fetch error:', error);
        return {
            user,
            rooms: [],
            notifications: []
        };
    }
};