<script lang="ts">
    import DiscussionBox from "$lib/components/DiscussionBox.svelte";
    import { Badge, Heading } from "flowbite-svelte";

    let { data } = $props();
</script>

<article class="flex flex-col w-full h-full bg-gray-50 dark:bg-gray-900">
    <div
        class="flex p-2 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
    >
        <Heading
            tag="h2"
            class="text-lg font-semibold text-gray-900 dark:text-white"
        >
            {data.discussion?.name || "AI Assistant"}
        </Heading>

        <Badge color="primary" class="ml-auto">
            {data.chats.length} messages
        </Badge>
    </div>

    <DiscussionBox
        discussion={data.discussion}
        user={data.user}
        chats={data.chats}
    />
</article>
