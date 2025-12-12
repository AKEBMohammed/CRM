<script lang="ts">
    import {
        Navbar,
        NavBrand,
        Button,
        DarkMode,
        Avatar,
        Dropdown,
        DropdownHeader,
        DropdownGroup,
        DropdownItem,
        Heading,
        Tooltip,
        Indicator,
        DropdownDivider,
        Badge,
        P,
    } from "flowbite-svelte";
    import favicon from "$lib/assets/favicon.png";
    import { page } from "$app/stores";
    import {
        ArrowRightOutline,
        BellSolid,
        BrainSolid,
        CogOutline,
        ExclamationCircleOutline,
        MessagesSolid,
    } from "flowbite-svelte-icons";
    import { supabase } from "$lib/supabase";
    import { roomsService, messagesService, notificationsService } from '$lib/services';
    import { goto } from "$app/navigation";
    import { onMount, onDestroy } from 'svelte';

    let currentRoute = $page.url.pathname;

    let { user, rooms: initialRooms, notifications: initialNotifications } = $props();

    // Reactive state for real-time updates
    let rooms = $state(initialRooms || []);
    let notifications = $state(initialNotifications || []);
    
    // Track subscriptions for cleanup
    let messagesSubscription: any = null;
    let notificationsSubscription: any = null;
    let viewsSubscription: any = null;
    
    // Throttling for refresh functions
    let refreshRoomsTimeout: any = null;
    let refreshNotificationsTimeout: any = null;

    // Function to refresh rooms data with throttling
    function throttledRefreshRooms() {
        if (refreshRoomsTimeout) clearTimeout(refreshRoomsTimeout);
        refreshRoomsTimeout = setTimeout(refreshRooms, 500);
    }

    // Function to refresh notifications data with throttling
    function throttledRefreshNotifications() {
        if (refreshNotificationsTimeout) clearTimeout(refreshNotificationsTimeout);
        refreshNotificationsTimeout = setTimeout(refreshNotifications, 500);
    }

    // Function to refresh rooms data
    async function refreshRooms() {
        if (!user?.profile_id) return;
        
        try {
            const userRooms = await roomsService.getAll(user.profile_id);
            
            const roomsData = await Promise.all((userRooms || []).map(async (room: any) => {
                try {
                    const messages = await messagesService.getAll(room.room_id, 1);
                    const latestMessage = messages?.[0] || null;
                    const unreadCount = await messagesService.getUnreadCount(room.room_id, user.profile_id);

                    return {
                        room_id: room.room_id,
                        name: room.name,
                        fullname: latestMessage?.sender?.fullname || null,
                        message: latestMessage?.content || null,
                        unreadCount
                    };
                } catch (error) {
                    console.error(`Error refreshing room ${room.room_id}:`, error);
                    return {
                        room_id: room.room_id,
                        name: room.name,
                        fullname: null,
                        message: null,
                        unreadCount: 0
                    };
                }
            }));
            
            rooms = roomsData;
        } catch (error) {
            console.error('Error refreshing rooms:', error);
        }
    }

    // Function to refresh notifications data
    async function refreshNotifications() {
        if (!user?.profile_id) return;
        
        try {
            const updatedNotifications = await notificationsService.getAll(user.profile_id);
            notifications = updatedNotifications || [];
        } catch (error) {
            console.error('Error refreshing notifications:', error);
        }
    }

    // Function to mark notification as seen
    async function markNotificationSeen(notificationId: number) {
        try {
            await notificationsService.markSeen(notificationId);
            // Refresh notifications to update the UI
            await refreshNotifications();
        } catch (error) {
            console.error('Error marking notification as seen:', error);
        }
    }

    // Set up real-time subscriptions
    onMount(() => {
        if (!user?.profile_id) return;

        console.log('Setting up real-time subscriptions for user:', user.profile_id);

        // Subscribe to messages table changes
        messagesSubscription = supabase
            .channel('messages-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages'
            }, async (payload) => {
                console.log('Messages change detected:', payload);
                throttledRefreshRooms();
            })
            .subscribe();

        // Subscribe to notifications table changes
        notificationsSubscription = supabase
            .channel('notifications-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `profile_id=eq.${user.profile_id}`
            }, async (payload) => {
                console.log('Notifications change detected:', payload);
                throttledRefreshNotifications();
            })
            .subscribe();

        // Subscribe to views table changes (for message read status)
        viewsSubscription = supabase
            .channel('views-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'views',
                filter: `profile_id=eq.${user.profile_id}`
            }, async (payload) => {
                console.log('Views change detected:', payload);
                throttledRefreshRooms();
            })
            .subscribe();
    });

    // Clean up subscriptions
    onDestroy(() => {
        console.log('Cleaning up real-time subscriptions');
        
        // Clear timeouts
        if (refreshRoomsTimeout) clearTimeout(refreshRoomsTimeout);
        if (refreshNotificationsTimeout) clearTimeout(refreshNotificationsTimeout);
        
        if (messagesSubscription) {
            supabase.removeChannel(messagesSubscription);
            messagesSubscription = null;
        }
        
        if (notificationsSubscription) {
            supabase.removeChannel(notificationsSubscription);
            notificationsSubscription = null;
        }
        
        if (viewsSubscription) {
            supabase.removeChannel(viewsSubscription);
            viewsSubscription = null;
        }
    });
</script>

<Navbar class="h-[80px] dark:bg-gray-800 shadow-sm col-start-1 col-span-2 absolute">
    <NavBrand href="/">
        <img src={favicon} class="me-3 h-6 sm:h-9" alt="DZ Sales Logo" />
        <span
            class="self-center whitespace-nowrap text-xl font-bold text-primary-500 dark:text-white"
            >DZ Sales</span
        >
    </NavBrand>
    <div class="flex gap-2 md:order-2">
        {#if currentRoute === "/"}
            <Button href="/auth" color="primary">Get started!</Button>
        {:else if user}
            <Button color="light" href="/dashboard/assistant" class="border-0">
                <BrainSolid />
            </Button>
            <Tooltip>AI Assistant</Tooltip>
            <Button color="light" id="chats-drop" class="relative border-0"
                ><MessagesSolid />
                {#if rooms.length > 0 && rooms.some((room: any) => room.unreadCount > 0)}
                    <Indicator
                        color="red"
                        size="xl"
                        placement="top-right"
                        class="text-xs font-bold"
                        >{rooms.reduce(
                            (acc: number, room: any) => acc + room.unreadCount,
                            0,
                        )}</Indicator
                    >
                {/if}
            </Button>
            <Tooltip>Messages</Tooltip>
            <Dropdown triggeredBy="#chats-drop" class="w-50">
                <DropdownHeader class="flex gap-4">
                    <Heading tag="h6">Messages</Heading>
                    <Button size="xs" href="/dashboard/rooms" class="ml-auto">
                        <ArrowRightOutline class="w-4 h-4" />
                    </Button>
                </DropdownHeader>
                <DropdownGroup>
                    {#if rooms.length === 0}
                        <span class="text-md text-gray-500 px-4 py-2 block">
                            No messages
                        </span>
                    {:else}
                        {#each rooms as room}
                            <DropdownItem
                                class="flex flex-col"
                                href={`/dashboard/rooms/${room.room_id}`}
                            >
                                <span class="flex font-medium"
                                    >{room.name}

                                    {#if room.unreadCount > 0}
                                        <Badge color="red" class="ml-auto"
                                            >{room.unreadCount}</Badge
                                        >
                                    {/if}
                                </span>
                                <span class="text-sm text-gray-500 truncate"
                                    >{room.fullname + ": " + room.message ||
                                        "No messages yet"}</span
                                >
                            </DropdownItem>
                        {/each}
                    {/if}
                </DropdownGroup>
            </Dropdown>
            <Button color="light" class="border-0 relative" id="notifications-drop"
                ><BellSolid />
                {#if notifications.length > 0 && notifications.some((n: any) => !n.seen_at)}
                    <Indicator
                        color="red"
                        size="xl"
                        placement="top-right"
                        class="text-xs font-bold"
                        >{notifications.filter((n: any) => !n.seen_at).length}</Indicator
                    >
                {/if}
            </Button>
            <Tooltip>Notifications</Tooltip>
            <Dropdown class="w-100" triggeredBy="#notifications-drop">
                <DropdownHeader class="flex gap-4">
                    <Heading tag="h6">Notifications</Heading>
                </DropdownHeader>
                {#if notifications && notifications.length === 0}
                    <span class="text-md text-gray-500 px-4 py-2 block">
                        No notifications
                    </span>
                {:else}
                    <DropdownGroup>
                        {#each notifications as notification}
                            <DropdownItem 
                                class="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                onclick={() => markNotificationSeen(notification.notification_id)}
                            >
                                <div class="flex items-center justify-between w-full">
                                    <div class="flex items-center gap-2">
                                        <Badge class="h-fit">{notification.type || 'general'}</Badge>
                                        <P class="text-sm flex-1">{notification.content}</P>
                                    </div>
                                    {#if !notification.seen_at}
                                        <Badge color="red" class="ml-auto">New</Badge>
                                    {/if}
                                </div>
                            </DropdownItem>
                        {/each}
                    </DropdownGroup>
                {/if}
            </Dropdown>
            {#if user?.avatar_url}
                <Avatar
                    size="sm"
                    alt="User settings"
                    id="user-drop"
                    class="ring-2 ring-primary-100 dark:ring-primary-900 mx-2"
                >
                    <img
                        class="rounded-full"
                        src={user.avatar_url}
                        alt="User Avatar"
                    />
                </Avatar>
            {:else}
                <Avatar
                    size="sm"
                    alt="User settings"
                    id="user-drop"
                    class="ring-2 ring-primary-100 dark:ring-primary-900 mx-2"
                />
            {/if}
            <Dropdown triggeredBy="#user-drop">
                <DropdownHeader>
                    <span class="block text-md">{user?.fullname}</span>
                    <span class="block truncate text-sm font-medium"
                        >{user?.email}</span
                    >
                </DropdownHeader>
                <DropdownGroup>
                    <DropdownItem
                        href="/dashboard/settings"
                        class="flex items-center"
                    >
                        <CogOutline class="w-5 h-5 me-2" />
                        Settings
                    </DropdownItem>
                    <DropdownItem
                        href="/auth/signout"
                        class="flex items-center"
                    >
                        <ExclamationCircleOutline class="w-5 h-5 me-2" />
                        Sign out
                    </DropdownItem>
                </DropdownGroup>
            </Dropdown>
        {/if}
        <DarkMode />
    </div>
</Navbar>
