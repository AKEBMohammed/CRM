<script lang="ts">
    import Sidebar from "../../lib/components/Sidebar.svelte";

    let { children } = $props();
</script>

<main class="w-screen h-full flex">
    <Sidebar />
    {@render children()}
</main>
