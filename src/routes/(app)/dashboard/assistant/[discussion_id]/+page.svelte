<script lang="ts">
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
    import { onMount, onDestroy } from "svelte";

    let { data } = $props();
    let chatContent = $state("");
    let chats: any[] = $state(data.chats || []);
    let chatsContainer: HTMLElement | undefined;
    let channel: any;

    // Auto-scroll to bottom when new chats arrive
    function scrollToBottom() {
        if (chatsContainer) {
            chatsContainer.scrollTop = chatsContainer.scrollHeight;
        }
    }

    onMount(() => {
        scrollToBottom();
        // Set up the channel after component mounts
        setupChannel();
    });

    onDestroy(() => {
        if (channel) {
            console.log("Unsubscribing from channel");
            supabase.removeChannel(channel);
        }
    });

    function setupChannel() {
        console.log("Setting up channel for room:", data.discussion_id);

        channel = supabase
            .channel(`disscusion-${data.discussion_id}-chats`, {
                config: {
                    presence: {
                        key: data.user.profile_id,
                    },
                },
            })
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chats",
                    filter: `discussion_id=eq.${data.discussion_id}`,
                },
                (payload) => {
                    console.log("New chat received via real-time:", payload);
                    console.log("Current chats count:", chats.length);

                    // Check if chat is not already in the array (avoid duplicates)
                    const chatExists = chats.some(
                        (msg) => msg.chat_id === payload.new.chat_id,
                    );

                    if (!chatExists) {
                        chats = [...chats, payload.new];
                        console.log(
                            "Chat added. New count:",
                            chats.length,
                        );
                        setTimeout(scrollToBottom, 100);
                    } else {
                        console.log(
                            "Chat already exists, skipping duplicate",
                        );
                    }
                },
            )
            .subscribe((status) => {
                console.log("Channel subscription status:", status);
                if (status === "SUBSCRIBED") {
                    console.log("Successfully subscribed to real-time updates");
                } else if (status === "CHANNEL_ERROR") {
                    console.error("Channel subscription error");
                } else if (status === "TIMED_OUT") {
                    console.error("Channel subscription timed out");
                }
            });
    }

    async function sendChat() {
        if (!chatContent.trim()) return;

        const chatToSend = chatContent.trim();
        chatContent = ""; // Clear input immediately for better UX

        try {
            const { data: insertedChat, error } = await supabase
                .from("chats")
                .insert([
                    {
                        discussion_id: data.discussion_id,
                        content: chatToSend,
                        is_ai: false,
                    },
                ])
                .select();

            if (error) {
                console.error("Error sending chat:", error);
                // Restore chat content if there's an error
                chatContent = chatToSend;
                alert("Failed to send chat. Please try again.");
            } else {
                console.log("Chat sent successfully:", insertedChat);
            }
        } catch (error) {
            console.error("Error sending chat:", error);
            chatContent = chatToSend;
            alert("Failed to send chat. Please try again.");
        }
    }

    function handleKeyPress(event: KeyboardEvent) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendChat();
        }
    }

    function isMyChat(chat: any) {
        return !chat.is_ai;
    }

    function formatTime(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        } else {
            return date.toLocaleDateString();
        }
    }
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
                {data.discussions.name}
            </Heading>
            <P class="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                {chats.length} chats
            </P>
        </div>
    </div>

    <!-- Chats Container -->
    <div
        bind:this={chatsContainer}
        class="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 dark:bg-gray-900"
    >
        {#if chats.length === 0}
            <div class="flex items-center justify-center h-full">
                <div class="text-center text-gray-500 dark:text-gray-400">
                    <p class="text-lg mb-2">No chats yet</p>
                    <p class="text-sm">
                        Start a conversation by sending a chat
                    </p>
                </div>
            </div>
        {/if}

        {#each chats as chat, index}
            {@const showDate =
                index === 0 ||
                formatDate(chat.send_at || chat.created_at) !==
                    formatDate(
                        chats[index - 1].send_at ||
                            chats[index - 1].created_at,
                    )}

            {#if showDate}
                <div class="flex justify-center">
                    <span
                        class="px-3 py-1 text-xs font-light text-gray-500 bg-gray-200 dark:bg-gray-700 dark:text-gray-400 rounded-full"
                    >
                        {formatDate( chat.created_at )}
                    </span>
                </div>
            {/if}

            <div
                class="flex {isMyChat(chat)
                    ? 'justify-end'
                    : 'justify-start'}"
            >
                <div class="flex items-end space-x-2 max-w-xs lg:max-w-md">
                    {#if !isMyChat(chat)}
                        <Avatar size="sm" class="mb-auto" />
                    {/if}

                    <div
                        class="flex flex-col {isMyChat(chat)
                            ? 'items-end'
                            : 'items-start'}"
                    >
                        <div
                            class="px-4 py-2 rounded-2xl {isMyChat(chat)
                                ? 'bg-primary-500 text-white rounded-br-md'
                                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-600'}"
                        >
                            <p class="text-sm break-words">
                                {chat.content}
                            </p>
                        </div>

                        <span
                            class="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2"
                        >
                            {formatTime(chat.created_at)}
                        </span>
                    </div>

                    {#if isMyChat(chat)}
                        <Avatar size="sm" class="mb-auto" />
                    {/if}
                </div>
            </div>
        {/each}
    </div>

    <!-- Chat Input -->
    <div
        class="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
    >
        <ButtonGroup class="w-full">
            <Button size="sm" class="p-3" color="primary">
                <FileSolid class="w-5 h-5" />
            </Button>

            <Input
                type="text"
                placeholder="Type your chat..."
                bind:value={chatContent}
                onkeypress={handleKeyPress}
                class="pr-12 border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
            />

            <Button
                onclick={sendChat}
                disabled={!chatContent.trim()}
                color="primary"
                class="p-3 disabled:cursor-not-allowed"
            >
                <PaperPlaneSolid class="w-5 h-5 text-white" />
            </Button>
        </ButtonGroup>

        <div
            class="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400"
        >
            <span>Press Enter to send, Shift + Enter for new line</span>
            <span>{chatContent.length}/1000</span>
        </div>
    </div>
</div>
