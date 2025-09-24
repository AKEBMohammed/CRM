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
    } from "flowbite-svelte";
    import favicon from "$lib/assets/favicon.png";
    import avatar from "$lib/assets/user.png";
    import { page } from "$app/stores";
    import {
        BellSolid,
        CogOutline,
        MessagesSolid,
    } from "flowbite-svelte-icons";
    import { supabase } from "$lib/supabase";
    let currentRoute = $page.url.pathname;

    let { user } = $props()
</script>

<Navbar class="dark:bg-gray-800 shadow-sm col-start-1 col-span-2 absolute">
    <NavBrand href="#">
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
            <Button color="dark"><MessagesSolid /></Button>
            <Button color="dark"><BellSolid /></Button>
            <Avatar
                src={user?.user_metadata?.avatar_url || avatar}
                size="md"
                alt="User settings"
                id="user-drop"
            />
            <Dropdown triggeredBy="#user-drop">
                <DropdownHeader>
                    <span class="block text-sm">{user?.user_metadata?.full_name || "Unknown User" }</span>
                    <span class="block truncate text-sm font-medium"
                        >{user?.email}</span
                    >
                </DropdownHeader>
                <DropdownGroup>
                    <DropdownItem class="flex items-center">
                        <CogOutline class="w-5 h-5 me-2" />
                        Settings
                    </DropdownItem>
                    <DropdownItem class="flex items-center" onclick={async () => {
                        await supabase.auth.signOut();
                        location.href = '/';
                    }}>
                        <div> </div>
                        Sign out
                    </DropdownItem>
                </DropdownGroup>
            </Dropdown>
        {/if}
        <DarkMode />
    </div>
</Navbar>
