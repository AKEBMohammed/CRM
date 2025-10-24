<script lang="ts">
    import { enhance } from "$app/forms";
    import {
        Button,
        Card,
        Heading,
        Listgroup,
        ListgroupItem,
        P,
        Search,
    } from "flowbite-svelte";
    import { PlusOutline } from "flowbite-svelte-icons";

    let { children, data } = $props();
</script>

<main class="w-full h-full row-start-2 col-start-2 overflow-y-auto flex">
    <aside
        class="w-1/3 h-full p-2 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
    >
        <Heading
            tag="h2"
            class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
            >AI Discussions</Heading
        >
        <Search placeholder="Search discussions..." size="md" class="mb-2" />
        <form use:enhance action="?/create" method="post">
            <Button type="submit" color="primary" size="sm" class="mb-4 w-full">
                <PlusOutline class="w-5 h-5 mr-2" />
                New Discussion
            </Button>
        </form>

        <Listgroup>
            {#each data.discussions as discussion}
                
                <ListgroupItem
                    href={`/dashboard/assistant/${discussion.discussion_id}`}
                    class="flex flex-col justify-start items-start"
                >
                    <Heading tag="h5" class="text-gray-900 dark:text-white">
                        {discussion.name}
                    </Heading>
                </ListgroupItem>
            {/each}
        </Listgroup>
    </aside>
    {@render children()}
</main>
