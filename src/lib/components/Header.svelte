<script lang="ts">
    import { Navbar, NavBrand, Button, DarkMode } from "flowbite-svelte";
    import favicon from "$lib/assets/favicon.png";
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
        {#if 0 }
            <Button color="primary" size="sm">Get Started</Button>
        {/if}
        <DarkMode />
    </div>
</Navbar>
