<script lang="ts">
    import { supabase } from "$lib/supabase";
    import Sidebar from "../../lib/components/Sidebar.svelte";

    let { children } = $props();

</script>

<main class="w-screen h-full flex">
    <Sidebar />
    {@render children()}
</main>
