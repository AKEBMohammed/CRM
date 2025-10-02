<script lang="ts">
    import { supabase } from "$lib/supabase";
    import {
        Avatar,
        Button,
        ButtonGroup,
        Dropdown,
        DropdownItem,
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

    interface MessageView {
        profile_id: number;
        fullname: string;
        email: string;
        seen_at: string;
        avatar?: string;
    }

    interface Message {
        message_id: number;
        content: string;
        send_at: string;
        created_at?: string;
        sender_id: number;
        fullname: string;
        email: string;
        views: MessageView[];
    }

    let {
        room,
        user,
        messages,
    }: {
        room: any;
        user: any;
        messages: Message[];
    } = $props();

    let messageContent = $state("");
    let messagesContainer: HTMLElement | undefined;
    let channel: any;
    let viewCheckTimeout: any;

    // Debounced function to check and mark viewed messages
    function scheduleViewCheck() {
        if (viewCheckTimeout) {
            clearTimeout(viewCheckTimeout);
        }
        viewCheckTimeout = setTimeout(() => {
            markMessagesAsViewed();
        }, 1000); // Wait 1 second of inactivity before marking as viewed
    }

    // Auto-scroll to bottom when new messages arrive
    function scrollToBottom() {
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            // Mark messages as viewed when scrolling to bottom
            setTimeout(() => markMessagesAsViewed(), 500);
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
                async (payload) => {
                    console.log("New message received via real-time:", payload);
                    console.log("Current messages count:", messages.length);

                    // Check if message is not already in the array (avoid duplicates)
                    const messageExists = messages.some(
                        (msg) => msg.message_id === payload.new.message_id,
                    );

                    if (!messageExists) {
                        // Fetch the complete message with views and sender info
                        const { data: completeMessage, error } = await supabase
                            .from("messages")
                            .select(
                                `
                                *,
                                profiles!messages_sender_id_fkey (
                                    fullname,
                                    email
                                ),
                                views (
                                    profile_id,
                                    seen_at,
                                    profiles (
                                        fullname,
                                        email
                                    )
                                )
                            `,
                            )
                            .eq("message_id", payload.new.message_id)
                            .single();

                        if (!error && completeMessage) {
                            // Transform the data to match our expected format
                            const formattedMessage: Message = {
                                message_id: completeMessage.message_id,
                                content: completeMessage.content,
                                send_at: completeMessage.send_at,
                                sender_id: completeMessage.sender_id,
                                fullname:
                                    completeMessage.profiles?.fullname ||
                                    "Unknown",
                                email: completeMessage.profiles?.email || "",
                                views:
                                    completeMessage.views?.map(
                                        (view: any): MessageView => ({
                                            profile_id: view.profile_id,
                                            fullname:
                                                view.profiles?.fullname ||
                                                "Unknown",
                                            email: view.profiles?.email || "",
                                            seen_at: view.seen_at,
                                        }),
                                    ) || [],
                            };

                            messages = [...messages, formattedMessage];
                            console.log(
                                "Message added. New count:",
                                messages.length,
                            );
                            setTimeout(scrollToBottom, 100);
                        } else {
                            console.error(
                                "Error fetching complete message:",
                                error,
                            );
                            // Fallback to basic message data
                            const fallbackMessage: Message = {
                                message_id: payload.new.message_id,
                                content: payload.new.content,
                                send_at: payload.new.send_at,
                                sender_id: payload.new.sender_id,
                                fullname: "Unknown",
                                email: "",
                                views: [],
                            };
                            messages = [...messages, fallbackMessage];
                            setTimeout(scrollToBottom, 100);
                        }
                    } else {
                        console.log(
                            "Message already exists, skipping duplicate",
                        );
                    }
                },
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "views",
                },
                async (payload) => {
                    console.log("New view received via real-time:", payload);

                    // Check if this view is for a message in our current room
                    const relevantMessage = messages.find(
                        (msg: Message) =>
                            msg.message_id === payload.new.message_id,
                    );

                    if (relevantMessage) {
                        // Fetch the viewer's profile info
                        const { data: profile, error } = await supabase
                            .from("profiles")
                            .select("fullname, email")
                            .eq("profile_id", payload.new.profile_id)
                            .single();

                        if (!error && profile) {
                            const newView: MessageView = {
                                profile_id: payload.new.profile_id,
                                fullname: profile.fullname,
                                email: profile.email,
                                seen_at: payload.new.seen_at,
                            };

                            // Update the message's views array
                            messages = messages.map((msg: Message) => {
                                if (msg.message_id === payload.new.message_id) {
                                    const existingViewIndex =
                                        msg.views.findIndex(
                                            (v: MessageView) =>
                                                v.profile_id ===
                                                payload.new.profile_id,
                                        );

                                    if (existingViewIndex === -1) {
                                        // Add new view
                                        return {
                                            ...msg,
                                            views: [...msg.views, newView],
                                        };
                                    } else {
                                        // Update existing view
                                        const updatedViews = [...msg.views];
                                        updatedViews[existingViewIndex] =
                                            newView;
                                        return { ...msg, views: updatedViews };
                                    }
                                }
                                return msg;
                            });
                        }
                    }
                },
            )
            .subscribe((status) => {
                console.log("Channel subscription status:", status);
                if (status === "SUBSCRIBED") {
                    console.log("Successfully subscribed to real-time updates");

                    // Mark messages as viewed when component loads
                    markMessagesAsViewed();
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
        if (viewCheckTimeout) {
            clearTimeout(viewCheckTimeout);
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

    function isMyMessage(message: Message) {
        console.log(
            "Checking if message is mine:",
            message.sender_id,
            user.profile_id,
        );

        return message.sender_id == user.profile_id;
    }

    function formatTime(dateString: string | undefined): string {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function formatDate(dateString: string | undefined): string {
        if (!dateString) return "";
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

    async function markMessagesAsViewed() {
        try {
            // Get all message IDs that this user hasn't viewed yet
            const messageIds = messages
                .filter(
                    (msg: Message) =>
                        msg.sender_id !== user.profile_id && // Don't mark own messages as viewed
                        !msg.views?.some(
                            (view: MessageView) =>
                                view.profile_id === user.profile_id,
                        ), // Haven't viewed yet
                )
                .map((msg: Message) => msg.message_id);

            if (messageIds.length > 0) {
                // Mark messages as viewed
                const viewRecords = messageIds.map((messageId: number) => ({
                    message_id: messageId,
                    profile_id: user.profile_id,
                    seen_at: new Date().toISOString(),
                }));

                const { error } = await supabase
                    .from("views")
                    .insert(viewRecords);

                if (error) {
                    console.error("Error marking messages as viewed:", error);
                } else {
                    console.log(
                        `Marked ${viewRecords.length} messages as viewed`,
                    );
                }
            }
        } catch (error) {
            console.error("Error in markMessagesAsViewed:", error);
        }
    }
</script>

<div
    bind:this={messagesContainer}
    onscroll={scheduleViewCheck}
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
                                {message.fullname}
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
                            {#if message.views.length > 0}
                                <span
                                    class="text-xs text-gray-500 dark:text-gray-400 m-1"
                                >
                                    <CheckOutline
                                        class="w-4 h-4 inline -m-3 text-primary-500"
                                    />
                                    <CheckOutline
                                        class="w-4 h-4 inline text-primary-500"
                                    />
                                </span>
                                <Dropdown simple class="space-y-1">
                                    <DropdownItem class="text-xs text-gray-500">
                                        Seen by {message.views.length}
                                        {message.views.length === 1
                                            ? "person"
                                            : "people"}
                                    </DropdownItem>
                                    {#each message.views as viewer}
                                        <DropdownItem class="flex">
                                            <Avatar
                                                size="xs"
                                                src={viewer.avatar}
                                                class="mr-2"
                                            />
                                            <span
                                                class="text-sm text-gray-900 dark:text-white"
                                                >{viewer.fullname}</span
                                            >
                                        </DropdownItem>
                                    {/each}
                                </Dropdown>
                            {:else}
                                <CheckOutline
                                    class="w-4 h-4 inline text-primary-500"
                                />
                            {/if}
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
