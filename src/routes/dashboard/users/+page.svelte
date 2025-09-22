<script lang="ts">
    import { Table } from "@flowbite-svelte-plugins/datatable";
    import type { PageProps } from './$types';

    let { data } = $props();
    console.log(data.profiles);
</script>

<article class="w-full h-full p-6">
    <h1 class="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Users</h1>
    <p class="mb-4 text-gray-500 dark:text-gray-400">Manage your users here.</p>
    <Table items={data.profiles} />
</article>
