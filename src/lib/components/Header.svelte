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
    } from "flowbite-svelte";
    import favicon from "$lib/assets/favicon.png";
    import avatar from "$lib/assets/user.png";
    import { page } from "$app/stores";
    import {
        ArrowRightOutline,
        BellSolid,
        BrainSolid,
        CogOutline,
        ExclamationCircleOutline,
        MessagesSolid,
        UserCircleSolid,
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
            <Button color="dark">
                <BrainSolid />
            </Button>
            <Tooltip>AI Assistant</Tooltip>
            <Button color="dark" id="chats-drop"><MessagesSolid /></Button>
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
                                <span class="font-medium">{room.name}</span>
                                <span class="text-sm text-gray-500 truncate"
                                    >{room.last_message ||
                                        "No messages yet"}</span
                                >
                            </DropdownItem>
                        {/each}
                    {/if}
                </DropdownGroup>
            </Dropdown>
            <Button color="dark"><BellSolid /></Button>
            <Tooltip>Notifications</Tooltip>

            {#if user?.avatar_url}
                <Avatar size="sm" alt="User settings" id="user-drop">
                    <img
                        class="rounded-full"
                        src={user.avatar_url}
                        alt="User Avatar"
                    />
                </Avatar>
            {:else}
                <Avatar size="sm" alt="User settings" id="user-drop" />
            {/if}
            <Dropdown triggeredBy="#user-drop">
                <DropdownHeader>
                    <span class="block text-md">{user?.fullname}</span>
                    <span class="block truncate text-sm font-medium"
                        >{user?.email}</span
                    >
                </DropdownHeader>
                <DropdownGroup>
                    <DropdownItem class="flex items-center">
                        <CogOutline class="w-5 h-5 me-2" />
                        Settings
                    </DropdownItem>
                    <DropdownItem
                        class="flex items-center"
                        onclick={async () => {
                            await supabase.auth.signOut();
                            cookieStore.set("user","")
                            goto("/auth");
                        }}
                    >
                        <ExclamationCircleOutline class="w-5 h-5 me-2" />
                        Sign out
                    </DropdownItem>
                    <DropdownItem class="flex items-center">
                        <ExclamationCircleOutline class="w-5 h-5 me-2" />
                        Report an issue
                    </DropdownItem>
                </DropdownGroup>
            </Dropdown>
        {/if}
        <DarkMode />
    </div>
</Navbar>
