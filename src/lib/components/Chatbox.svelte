<script lang="ts">
    import { supabase } from "$lib/supabase";
    import {
        Avatar,
        Button,
        ButtonGroup,
        Heading,
        Input,
        P,
    } from "flowbite-svelte";
    import {
        CheckOutline,
        FileSolid,
        PaperPlaneSolid,
    } from "flowbite-svelte-icons";
    import { onDestroy } from "svelte";

    let { room, user, messages } = $props();

    let messageContent = $state("");
    let messagesContainer: HTMLElement | undefined;
    let channel: any;

    // Auto-scroll to bottom when new messages arrive
    function scrollToBottom() {
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    $effect(() => {
        scrollToBottom();
        // Set up the channel after component mounts
        console.log("Setting up channel for room:", room.room_id);

        channel = supabase
            .channel(`room-${room.room_id}-messages`, {
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
                    table: "messages",
                    filter: `room_id=eq.${room.room_id}`,
                },
                (payload) => {
                    console.log("New message received via real-time:", payload);
                    console.log("Current messages count:", messages.length);

                    // Check if message is not already in the array (avoid duplicates)
                    const messageExists = messages.some(
                        (msg) => msg.message_id === payload.new.message_id,
                    );

                    if (!messageExists) {
                        messages = [...messages, payload.new];
                        console.log(
                            "Message added. New count:",
                            messages.length,
                        );
                        setTimeout(scrollToBottom, 100);
                    } else {
                        console.log(
                            "Message already exists, skipping duplicate",
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
    });

    onDestroy(() => {
        if (channel) {
            console.log("Unsubscribing from channel");
            supabase.removeChannel(channel);
        }
    });

    async function sendMessage() {
        if (!messageContent.trim()) return;

        const messageToSend = messageContent.trim();
        messageContent = ""; // Clear input immediately for better UX

        try {
            const { data: insertedMessage, error } = await supabase
                .from("messages")
                .insert([
                    {
                        content: messageToSend,
                        room_id: room.room_id,
                        sender_id: user.profile_id,
                    },
                ])
                .select();

            if (error) {
                console.error("Error sending message:", error);
                // Restore message content if there's an error
                messageContent = messageToSend;
                alert("Failed to send message. Please try again.");
            } else {
                console.log("Message sent successfully:", insertedMessage);
            }
        } catch (error) {
            console.error("Error sending message:", error);
            messageContent = messageToSend;
            alert("Failed to send message. Please try again.");
        }
    }

    function handleKeyPress(event: KeyboardEvent) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    }

    function isMyMessage(message: any) {
        return message.sender_id == user.profile_id;
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

<div
    bind:this={messagesContainer}
    class="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 dark:bg-gray-900"
>
    {#if messages.length === 0}
        <div class="flex items-center justify-center h-full">
            <div class="text-center text-gray-500 dark:text-gray-400">
                <p class="text-lg mb-2">No messages yet</p>
                <p class="text-sm">Start a conversation by sending a message</p>
            </div>
        </div>
    {/if}

    {#each messages as message, index}
        {@const showDate =
            index === 0 ||
            formatDate(message.send_at || message.created_at) !==
                formatDate(
                    messages[index - 1].send_at ||
                        messages[index - 1].created_at,
                )}

        {#if showDate}
            <div class="flex justify-center">
                <span
                    class="px-3 py-1 text-xs font-light text-gray-500 bg-gray-200 dark:bg-gray-700 dark:text-gray-400 rounded-full"
                >
                    {formatDate(message.send_at || message.created_at)}
                </span>
            </div>
        {/if}

        <div
            class="flex {isMyMessage(message)
                ? 'justify-end'
                : 'justify-start'}"
        >
            <div class="flex items-end space-x-2 max-w-xs lg:max-w-md">
                {#if !isMyMessage(message)}
                    <Avatar size="sm" class="mb-auto" />
                {/if}

                <div
                    class="flex flex-col {isMyMessage(message)
                        ? 'items-end'
                        : 'items-start'}"
                >
                    <div
                        class="px-4 py-2 rounded-2xl {isMyMessage(message)
                            ? 'bg-primary-500 text-white rounded-br-md'
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-600'}"
                    >
                        {#if !isMyMessage(message)}
                            <Heading
                                tag="h4"
                                class="text-sm break-words whitespace-pre-wrap"
                            >
                                {message.profiles.fullname}
                            </Heading>
                        {/if}
                        <P class="text-sm break-words">
                            {message.content}
                        </P>
                    </div>
                    <div class="flex flex-row-reverse items-center space-x-1">
                        <span
                            class="text-xs text-gray-500 dark:text-gray-400 mt-1"
                        >
                            {formatTime(message.send_at || message.created_at)}
                        </span>
                        {#if isMyMessage(message)}
                            <span
                                class="text-xs text-gray-500 dark:text-gray-400 m-1"
                            >
                                <CheckOutline class="w-4 h-4 inline -m-3 text-primary-500" />
                                <CheckOutline class="w-4 h-4 inline text-primary-500" />
                            </span>
                        {/if}
                    </div>
                </div>

                {#if isMyMessage(message)}
                    <Avatar size="sm" class="mb-auto" />
                {/if}
            </div>
        </div>
    {/each}
</div>

<!-- Message Input -->
<div
    class="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
>
    <ButtonGroup class="w-full">
        <Button size="sm" class="p-3" color="primary">
            <FileSolid class="w-5 h-5" />
        </Button>

        <Input
            type="text"
            placeholder="Type your message..."
            bind:value={messageContent}
            onkeypress={handleKeyPress}
            class="pr-12 border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
        />

        <Button
            onclick={sendMessage}
            disabled={!messageContent.trim()}
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
        <span>{messageContent.length}/1000</span>
    </div>
</div>
