<script lang="ts">
    import { enhance } from "$app/forms";
    import { Button, Card, Heading, P, Search } from "flowbite-svelte";
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
        <form use:enhance action="./assistant?/create" method="post">
            <Button type="submit" color="light" size="sm" class="mb-4 w-full">
                <PlusOutline class="w-5 h-5 mr-2" />
                New Discussion
            </Button>
        </form>

        {#each data.discussions as discussion}
            <Card
                size="md"
                href={`/dashboard/assistant/${discussion.discussion_id}`}
                class="w-full p-2 mb-1 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
            >
                <Heading
                    tag="h6"
                    class="font-bold text-gray-900 dark:text-white"
                >
                    {discussion.name}
                </Heading>
            </Card>
        {/each}
    </aside>
    {@render children()}
</main>
