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
    import { goto } from "$app/navigation";
    let currentRoute = $page.url.pathname;

    let { user, rooms } = $props();
</script>

<Navbar class="dark:bg-gray-800 shadow-sm col-start-1 col-span-2 absolute">
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
                {#if rooms[0].unreadCount > 0}
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
            <Button color="light" class="border-0"><BellSolid /></Button>
            <Tooltip>Notifications</Tooltip>

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
