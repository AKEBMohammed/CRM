<script lang="ts">
    import { enhance } from "$app/forms";
    import {
        A,
        Button,
        Card,
        Heading,
        Listgroup,
        ListgroupItem,
        Modal,
        P,
        Search,
        tabItem,
    } from "flowbite-svelte";
    import { PlusOutline, TrashBinSolid } from "flowbite-svelte-icons";

    let { children, data } = $props();

    let showDeleteModal = $state(false);
    let discussionToDelete = $state<string | null>(null);
</script>

<main class="w-full h-full row-start-2 col-start-2 flex flex-row">
    <aside
        class="w-1/3 p-2 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col"
    >
        <Heading
            tag="h2"
            class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
            >AI Discussions</Heading
        >
        <Search placeholder="Search discussions..." size="md" class="mb-2" />
        <form use:enhance action="/dashboard/assistant/?/create" method="POST">
            <Button type="submit" color="primary" size="sm" class="mb-4 w-full">
                <PlusOutline class="w-5 h-5 mr-2" />
                New Discussion
            </Button>
        </form>

        <Listgroup class="w-full max-h-120 overflow-y-scroll">
            {#each data.discussions as discussion}
                <ListgroupItem class="flex">
                    <Heading tag="h5" class="text-gray-900 dark:text-white">
                        <A
                            class="color-gray-900 dark:text-white hover:no-underline"
                            href={`/dashboard/assistant/${discussion.discussion_id}`}
                            >{discussion.name}</A
                        >
                    </Heading>
                    <form class="ml-auto p-2" method="POST">
                        <Button
                            size="sm"
                            color="light"
                            onclick={() => {
                                showDeleteModal = true;
                                discussionToDelete = discussion.discussion_id;
                            }}
                        >
                            <TrashBinSolid class="w-4 h-4 text-light-600" />
                        </Button>
                    </form>
                </ListgroupItem>
            {/each}
        </Listgroup>
    </aside>
    {@render children()}
</main>
<Modal
    bind:open={showDeleteModal}
    size="md"
    title="Delete Discussion"
    autoclose
>
    <div>
        <P class="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this discussion? This action cannot
            be undone.
        </P>
    </div>
    <div class="flex justify-end space-x-4 mt-4">
        <Button color="gray" onclick={() => (showDeleteModal = false)}>
            Cancel
        </Button>
        <form
            use:enhance
            method="POST"
            action={`/dashboard/assistant/?/delete`}
        >
            <input
                type="hidden"
                name="discussion_id"
                value={discussionToDelete}
            />
            <Button type="submit" color="red">Delete</Button>
        </form>
    </div>
</Modal>
