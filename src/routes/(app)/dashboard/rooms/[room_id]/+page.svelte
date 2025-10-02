<script lang="ts">
    import Chatbox from "$lib/components/Chatbox.svelte";
    import { supabase } from "$lib/supabase";
    import {
        Button,
        ButtonGroup,
        Heading,
        Input,
        Avatar,
        P,
    } from "flowbite-svelte";
    import { FileSolid, PaperPlaneSolid } from "flowbite-svelte-icons";
    import { onDestroy } from "svelte";
    let { data } = $props();
</script>

<div class="flex flex-col w-full h-full bg-white dark:bg-gray-900">
    <!-- Chat Header -->
    <div
        class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
    >
        <div class="flex items-center gap-2">
            <Heading
                tag="h2"
                class="text-lg font-semibold text-gray-900 dark:text-white"
            >
                {data.room.name}
            </Heading>
            <P class="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                {data.messages.length} messages
            </P>
        </div>
    </div>

    <!-- Messages Container -->
    <Chatbox room={data.room} user={data.user} messages={data.messages} />
</div>
