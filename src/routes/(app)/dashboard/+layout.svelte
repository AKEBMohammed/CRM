<script lang="ts">
    import "../../../app.css";
    import Header from "$lib/components/Header.svelte";
    import Sidebar from "$lib/components/Sidebar.svelte";
    import type { LayoutProps } from "./$types";

    let { children, data }: LayoutProps = $props();

</script>

<main
    class="w-screen h-screen grid grid-cols-[60px_1fr] grid-rows-[60px_1fr] bg-gray-50 dark:bg-gray-900"
>
    <Header user={data.user} rooms={data.rooms} />
    <Sidebar />
    <article class="w-full h-full row-start-2 col-start-2 overflow-y-auto">
        {@render children()}
    </article>
</main>
