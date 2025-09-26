<script lang="ts">
    import { Card, Heading, P, Search } from "flowbite-svelte";

    let { children, data } = $props();
</script>

<main class="w-full h-full row-start-2 col-start-2 overflow-y-auto flex">
    <aside class="w-1/3 h-full p-2 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <Heading
            tag="h2"
            class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
            >Chat Rooms</Heading
        >
        <Search placeholder="Search rooms..." size="md" class="mb-2" />
        {#each data.rooms as room}
            <Card href={`/dashboard/rooms/${room.room_id}`}
                class="p-4 mb-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
            >
                <Heading tag="h3" class="text-md font-bold text-gray-900 dark:text-white">
                    {room.name}
                </Heading>
                <P class="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {(room.last_message.fullname + ": " + room.last_message.content) || "No messages yet"}
                </P>
            </Card>
            
        {/each}
    </aside>
    {@render children()}
</main>
