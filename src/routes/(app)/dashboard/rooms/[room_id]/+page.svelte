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
    import { DotsVerticalOutline, FileSolid, PaperPlaneSolid } from "flowbite-svelte-icons";
    import { onDestroy } from "svelte";
    let { data } = $props();
</script>

<div class="w-full h-auto flex flex-col bg-white dark:bg-gray-900">
    <!-- Chat Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 ">
        <div class="flex items-center space-x-3">
            <div class="relative">
                <Avatar size="sm" class="ring-2 ring-primary-100 dark:ring-primary-900" />
                <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
            </div>
            <div>
                <Heading tag="h3" class="text-sm font-semibold text-gray-900 dark:text-white">
                    {data.room.name}
                </Heading>
                
            </div>
        </div>
        
        <div class="flex items-center space-x-2">
            
            <Button size="xs" color="light" class="p-2">
                <DotsVerticalOutline class="w-4 h-4" />
            </Button>
        </div>
    </div>

    <!-- Messages Container -->
    <Chatbox room={data.room} user={data.user} messages={data.messages} />
</div>
