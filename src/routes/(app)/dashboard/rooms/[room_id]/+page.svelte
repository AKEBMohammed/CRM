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
    import { onMount } from "svelte";

    let { data } = $props();
    let messageContent = $state("");
    let messages: any[] = $state(data.messages || []);
    let messagesContainer: HTMLElement | undefined;

    // Auto-scroll to bottom when new messages arrive
    function scrollToBottom() {
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    onMount(() => {
        scrollToBottom();
    });

    let channel = supabase
        .channel(`room:${data.room.room_id}:messages`, { config: { private: true } })
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "messages",
                filter: `room_id=eq.${data.room.room_id}`,
            },
            (payload) => {
                console.log("Change received!", payload);

                if (payload.eventType === "INSERT" && payload.new) {
                    // Check if this message is not already in our messages (avoid duplicates)
                    const existingMessage = messages.find(
                        (m) =>
                            m.message_id === payload.new.message_id ||
                            (m.content === payload.new.content &&
                                m.sender_id === payload.new.sender_id),
                    );

                    if (!existingMessage) {
                        const newMessage = {
                            ...payload.new,
                            sender_id:
                                payload.new.sender_id || payload.new.profile_id,
                        };
                        messages = [...messages, newMessage];
                        setTimeout(scrollToBottom, 100);
                    } else {
                        // Replace temporary message with real one
                        if (existingMessage.message_id?.startsWith("temp-")) {
                            messages = messages.map((m) =>
                                m.message_id === existingMessage.message_id
                                    ? {
                                          ...payload.new,
                                          sender_id:
                                              payload.new.sender_id ||
                                              payload.new.profile_id,
                                      }
                                    : m,
                            );
                        }
                    }
                }
            },
        )
        .subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
                console.log("Subscribed to room messages channel");
            }
        });

    async function sendMessage() {
        if (!messageContent.trim()) return;

        const tempMessage = {
            content: messageContent,
            room_id: data.room.room_id,
            sender_id: data.profile_id,
            send_at: new Date().toISOString(),
            message_id: `temp-${Date.now()}`,
            profiles: {
                profile_id: data.profile_id,
                fullname: "You",
                email: "",
            },
        };

        // Add message optimistically to UI
        messages = [...messages, tempMessage];
        const messageToSend = messageContent;
        messageContent = "";
        setTimeout(scrollToBottom, 100);

        try {
            await supabase.from("messages").insert([
                {
                    content: messageToSend,
                    room_id: data.room.room_id,
                    sender_id: data.profile_id,
                },
            ]);
        } catch (error) {
            console.error("Failed to send message:", error);
            // Remove the temporary message on error
            messages = messages.filter(
                (m) => m.message_id !== tempMessage.message_id,
            );
        }
    }

    function handleKeyPress(event: KeyboardEvent) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    }

    function isMyMessage(message: any) {
        return message.sender_id === data.profile_id;
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
            <Avatar size="sm" />
            <Heading
                tag="h2"
                class="text-lg font-semibold text-gray-900 dark:text-white"
            >
                {data.room.name || "Room Chat"}
            </Heading>
            <P class="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                {messages.length} messages
            </P>
        </div>
    </div>

    <!-- Messages Container -->
    <div
        bind:this={messagesContainer}
        class="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 dark:bg-gray-900"
    >
        {#if messages.length === 0}
            <div class="flex items-center justify-center h-full">
                <div class="text-center text-gray-500 dark:text-gray-400">
                    <p class="text-lg mb-2">No messages yet</p>
                    <p class="text-sm">
                        Start a conversation by sending a message
                    </p>
                </div>
            </div>
        {/if}

        {#each messages as message, index}
            {@const showDate =
                index === 0 ||
                formatDate(message.send_at) !==
                    formatDate(messages[index - 1].send_at)}

            {#if showDate}
                <div class="flex justify-center">
                    <span
                        class="px-3 py-1 text-xs font-light text-gray-500 bg-gray-200 dark:bg-gray-700 dark:text-gray-400 rounded-full"
                    >
                        {formatDate(message.send_at)}
                    </span>
                </div>
            {/if}

            <div
                class="flex {isMyMessage(message)
                    ? 'justify-end'
                    : 'justify-start'}"
            >
                <div class="flex items-end space-x-2 max-w-full lg:max-w-md">
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
                            <p class="text-sm break-words">
                                {message.content}
                            </p>
                        </div>

                        <span
                            class="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2"
                        >
                            {formatTime(message.send_at)}
                        </span>
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
            <Button size="sm" class="p-2">
                <FileSolid class="w-5 h-5 text-gray-500" />
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
                color="primary"
                disabled={!messageContent.trim()}
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
</div>
