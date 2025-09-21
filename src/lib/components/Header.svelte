<script lang="ts">
    import { Navbar, NavBrand, Button, DarkMode } from "flowbite-svelte";
    import favicon from "$lib/assets/favicon.png";
    import { page } from "$app/stores";
    import { BellSolid, MessagesSolid } from "flowbite-svelte-icons";
    let currentRoute = $page.url.pathname;
</script>

<Navbar class="dark:bg-gray-800 shadow-sm">
    <NavBrand href="#">
        <img src={favicon} class="me-3 h-6 sm:h-9" alt="DZ Sales Logo" />
        <span
            class="self-center whitespace-nowrap text-xl font-bold text-primary-500 dark:text-white"
            >DZ Sales</span
        >
    </NavBrand>
    <div class="flex gap-2 md:order-2">
        {#if currentRoute === "/"}
            <Button href="/auth/login" color="dark">Get started!</Button>
        {:else if currentRoute.startsWith("/dashboard")}
            <Button color="dark"><MessagesSolid /></Button>
            <Button color="dark"><BellSolid /></Button>
        {/if}
        <DarkMode />
    </div>
</Navbar>
