<script lang="ts">
    import { supabase } from "$lib/supabase";
    import {
        Button,
        Textarea,
        Badge,
        Spinner,
        Tooltip,
        ButtonGroup,
        Input,
        Avatar,
        P,
        Heading,
        tags,
    } from "flowbite-svelte";
    import {
        PaperPlaneSolid,
        WandMagicSparklesOutline,
        ClipboardListSolid,
        ThumbsUpSolid,
        ThumbsDownSolid,
        ArrowDownOutline,
        StopSolid,
        UserOutline,
        UserSolid,
        AddressBookSolid,
        ChartLineUpOutline,
    } from "flowbite-svelte-icons";
    import { onMount, onDestroy, tick } from "svelte";
    import { marked } from "marked";

    let { discussion, user, chats } = $props();
    let chatsContainer: HTMLElement | undefined = $state(undefined);
    let chatContent = $state("");
    let channel: any;
    let isLoading = $state(false);
    let isTyping = $state(false);
    let discussion_id = $derived(discussion.discussion_id);

    let chatsLength = $derived(chats.length);

    // Configure marked for better rendering
    marked.setOptions({
        breaks: true,
        gfm: true,
    });

    // Auto-scroll to bottom when new chats arrive
    function scrollToBottom() {
        console.log("scrolling...");

        if (chatsContainer) {
            chatsContainer.scrollTop = chatsContainer.scrollHeight;
        }
    }

    $effect(() => {
        scrollToBottom();
        setupChannel();
    });

    onDestroy(() => {
        if (channel) {
            console.log("Unsubscribing from channel");
            supabase.removeChannel(channel);
        }
    });

    function setupChannel() {
        console.log("Setting up channel for room:", discussion_id);

        channel = supabase
            .channel(`disscusion-${discussion_id}-chats`, {
                config: {
                    presence: {
                        key: user.profile_id,
                    },
                },
            })
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chats",
                    filter: `discussion_id=eq.${discussion_id}`,
                },
                (payload) => {
                    console.log("New chat received via real-time:", payload);
                    console.log("Current chats count:", chats.length);

                    // Check if chat is not already in the array (avoid duplicates)
                    const chatExists = chats.some(
                        (msg: { chat_id: string }) =>
                            msg.chat_id === payload.new.chat_id,
                    );

                    if (!chatExists) {
                        chats = [...chats, payload.new];
                        console.log("Chat added. New count:", chats.length);
                        if (payload.new.is_ai) {
                            isTyping = false;
                        }
                        scrollToBottom();
                    } else {
                        console.log("Chat already exists, skipping duplicate");
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
        if (!chatContent.trim() || isLoading) return;

        const chatToSend = chatContent.trim();
        chatContent = ""; // Clear input immediately for better UX
        isLoading = true;
        isTyping = true;

        try {
            const { data: insertedChat, error } = await supabase
                .from("chats")
                .insert([
                    {
                        discussion_id: discussion_id,
                        content: chatToSend,
                        is_ai: false,
                    },
                ])
                .select();

            if (error) {
                console.error("Error sending chat:", error);
                chatContent = chatToSend;
                isLoading = false;
                isTyping = false;
                return;
            }

            scrollToBottom();
        } catch (error) {
            console.error("Error sending chat:", error);
            chatContent = chatToSend;
            isLoading = false;
            isTyping = false;
            return;
        }

        try {
            let response = await fetch(`/api/assistant`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    discussion_id: discussion_id,
                    message: chatToSend,
                }),
            });

            if (!response.ok) {
                console.error("Error from assistant API:", response.statusText);
            }
        } catch (error) {
            console.error("Error calling assistant API:", error);
            isTyping = false;
        } finally {
            isLoading = false;
            scrollToBottom();
        }
    }

    function handleKeyPress(event: KeyboardEvent) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendChat();
        }
    }

    async function copyToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
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

    function renderMarkdown(content: string): string {
        try {
            return marked.parse(content) as string;
        } catch (error) {
            console.error("Error parsing markdown:", error);
            return content; // Fallback to plain text
        }
    }
</script>

<!-- Messages Container -->
<div class="flex-1 overflow-y-auto" bind:this={chatsContainer}>
    <div class="w-full">
        {#if chatsLength === 0}
            <!-- Welcome Screen -->
            <div
                class="flex items-center justify-center w-full min-h-full px-4 py-16"
            >
                <div class="text-center max-w-md">
                    <div
                        class="w-16 h-16 bg-gradient-to-br from-primary-700 to-primary-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                    >
                        <WandMagicSparklesOutline class="w-8 h-8 text-white" />
                    </div>
                    <h2
                        class="text-2xl font-bold text-gray-900 dark:text-white mb-3"
                    >
                        Welcome to AI Assistant
                    </h2>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        I'm here to help you with your CRM tasks, answer
                        questions, and provide insights. What would you like to
                        know?
                    </p>
                    <div class="grid grid-cols-1 gap-3">
                        <button
                            class="p-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                            onclick={() =>
                                (chatContent =
                                    "How can I manage my contacts more effectively?")}
                        >
                            <div
                                class="text-sm font-medium text-gray-900 dark:text-white"
                            >
                                <AddressBookSolid class="w-4 h-4 mr-2" /> Contact
                                Management
                            </div>
                            <div
                                class="text-xs text-gray-500 dark:text-gray-400 mt-1"
                            >
                                Tips for better customer relationships
                            </div>
                        </button>
                        <button
                            class="p-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                            onclick={() =>
                                (chatContent =
                                    "Show me analytics insights for my business")}
                        >
                            <div
                                class="text-sm font-medium text-gray-900 dark:text-white"
                            >
                                <ChartLineUpOutline class="w-4 h-4 mr-2" /> Business
                                Analytics
                            </div>
                            <div
                                class="text-xs text-gray-500 dark:text-gray-400 mt-1"
                            >
                                Understand your business performance
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        {:else}
            <!-- Chat Messages -->
            <div class="space-y-8 px-4 py-6">
                {#each chats as chat, index}
                    {@const showDate =
                        index === 0 ||
                        formatDate(chat.created_at) !==
                            formatDate(chats[index - 1].created_at)}

                    {#if showDate}
                        <div class="flex justify-center my-8">
                            <span
                                class="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm"
                            >
                                {formatDate(chat.created_at)}
                            </span>
                        </div>
                    {/if}

                    {#if chat.is_ai}
                        <!-- AI Message -->
                        <div class="flex items-start space-x-4 group">
                            <Avatar
                                size="md"
                                class="flex-shrink-0 flex items-center justify-center shadow-lg"
                            >
                                <WandMagicSparklesOutline
                                    class="w-4 h-4 text-primary-600"
                                />
                            </Avatar>
                            <div class="flex-1 min-w-0">
                                <div class=" text-gray-800 dark:text-white">
                                    {@html renderMarkdown(chat.content)}
                                </div>

                                <!-- Message Actions -->
                                <div
                                    class="flex items-center space-x-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Button
                                        size="xs"
                                        color="light"
                                        class="p-2"
                                        onclick={() =>
                                            copyToClipboard(chat.content)}
                                    >
                                        <ClipboardListSolid />
                                        <Tooltip>Copy</Tooltip>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    {:else}
                        <div class="w-full flex gap-2">
                            <Avatar
                                size="md"
                                class="flex-shrink-0 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center shadow-lg"
                                ><UserSolid
                                    class="text-gray-600 dark:text-gray-300"
                                /></Avatar
                            >
                            <div
                                class="w-fit min-w-15 p-2 bg-gray-600 rounded-2xl"
                            >
                                <P>{chat.content}</P>
                            </div>
                        </div>
                    {/if}
                {/each}

                <!-- AI Typing Indicator -->
                {#if isTyping}
                    <div class="flex items-start space-x-4">
                        <Avatar
                            size="md"
                            class=" rounded-full flex items-center justify-center shadow-lg"
                        >
                            <Spinner color="primary" />
                        </Avatar>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center space-x-2 mb-2">
                                <span
                                    class="text-sm font-semibold text-gray-900 dark:text-white"
                                    >AI Assistant</span
                                >
                                <span
                                    class="text-xs text-gray-500 dark:text-gray-400"
                                    >is typing...</span
                                >
                            </div>

                            <div class="flex space-x-1">
                                <div
                                    class="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
                                ></div>
                                <div
                                    class="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
                                    style="animation-delay: 0.1s"
                                ></div>
                                <div
                                    class="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
                                    style="animation-delay: 0.2s"
                                ></div>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>

<!-- Input Area -->
<div
    class="border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
>
    <div class="max-w-4xl mx-auto p-2">
        <!-- Suggestions (only when no chats) -->
        {#if chats.length !== 0}
            <div class="flex flex-wrap gap-2 pb-2">
                <Button
                    size="sm"
                    color="light"
                    onclick={() =>
                        (chatContent =
                            "What's the best way to track customer interactions?")}
                    class="text-xs"
                >
                    🎯 Track Interactions
                </Button>
                <Button
                    size="sm"
                    color="light"
                    onclick={() =>
                        (chatContent =
                            "How do I analyze my sales performance?")}
                    class="text-xs"
                >
                    📈 Sales Analytics
                </Button>
                <Button
                    size="sm"
                    color="light"
                    onclick={() =>
                        (chatContent = "Help me organize my product catalog")}
                    class="text-xs"
                >
                    📦 Product Management
                </Button>
            </div>
        {/if}

        <!-- Input Container -->
        <div class="relative">
            <ButtonGroup class=" w-full">
                <Input
                    bind:value={chatContent}
                    placeholder="Message AI Assistant..."
                    onkeydown={handleKeyPress}
                    disabled={isLoading}
                />

                <!-- Send Button -->
                <Button
                    onclick={sendChat}
                    disabled={!chatContent.trim() || isLoading}
                    color="primary"
                >
                    {#if isLoading}
                        <StopSolid class="w-5 h-5 text-white" />
                    {:else}
                        <PaperPlaneSolid class="w-5 h-5 text-white" />
                    {/if}
                </Button>
            </ButtonGroup>

            <!-- Input Footer -->
            <div class="flex items-center justify-between p-2">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                    AI can make mistakes. Verify important information.
                </span>
            </div>
        </div>
    </div>
</div>
