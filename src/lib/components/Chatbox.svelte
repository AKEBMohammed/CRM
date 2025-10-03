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
        Listgroup,
        Label,
        Modal,
        P,
        ListgroupItem,
        Card,
    } from "flowbite-svelte";
    import {
        CheckOutline,
        DownloadOutline,
        FileSolid,
        PaperPlaneSolid,
        TrashBinSolid,
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
        files: any;
        reply_to?: number;
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
    let showSendFileModal = $state(false);
    let selectedFile: File | null = $state(null);
    let replyTo: Message | null = $state(null);

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
                    event: "*", // Listen to all changes: INSERT, UPDATE, DELETE
                    schema: "public",
                    table: "messages",
                    filter: `room_id=eq.${room.room_id}`,
                },
                async (payload) => {
                    console.log(
                        "Message change received via real-time:",
                        payload,
                    );
                    console.log("Event type:", payload.eventType);
                    console.log("Current messages count:", messages.length);

                    if (payload.eventType === "INSERT") {
                        // Handle new message insertion
                        const messageExists = messages.some(
                            (msg) => msg.message_id === payload.new.message_id,
                        );

                        if (!messageExists) {
                            // Fetch the complete message with views and sender info
                            const { data: completeMessage, error } =
                                await supabase
                                    .from("messages")
                                    .select(
                                        `
                                    *,
                                    profiles!messages_sender_id_fkey (
                                        fullname,
                                        email
                                    ),
                                    files (
                                        file_id,
                                        v_name,
                                        p_name
                                    ),
                                    reply_to:messages!messages_reply_id_fkey (
                                        message_id,
                                        content,
                                        send_at,
                                        sender_id,
                                        profiles!messages_sender_id_fkey (
                                            fullname,
                                            email
                                        )
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
                                    email:
                                        completeMessage.profiles?.email || "",
                                    files: completeMessage.files || null,
                                    reply_to: completeMessage.reply_to || null,

                                    views:
                                        completeMessage.views?.map(
                                            (view: any): MessageView => ({
                                                profile_id: view.profile_id,
                                                fullname:
                                                    view.profiles?.fullname ||
                                                    "Unknown",
                                                email:
                                                    view.profiles?.email || "",
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
                                    files: null,
                                    reply_to: payload.new.reply_id || null,
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
                    } else if (payload.eventType === "UPDATE") {
                        // Handle message updates (e.g., when file is attached)
                        console.log("Message updated:", payload.new);

                        // Find and update the existing message
                        const messageIndex = messages.findIndex(
                            (msg) => msg.message_id === payload.new.message_id,
                        );

                        if (messageIndex !== -1) {
                            // Fetch the updated complete message
                            const { data: updatedMessage, error } =
                                await supabase
                                    .from("messages")
                                    .select(
                                        `
                                    *,
                                    profiles!messages_sender_id_fkey (
                                        fullname,
                                        email
                                    ),
                                    files (
                                        file_id,
                                        v_name,
                                        p_name
                                    ),
                                    reply_to:messages!messages_reply_id_fkey (
                                        message_id,
                                        content,
                                        send_at,
                                        sender_id,
                                        profiles!messages_sender_id_fkey (
                                            fullname,
                                            email
                                        )
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

                            if (!error && updatedMessage) {
                                const formattedUpdatedMessage: Message = {
                                    message_id: updatedMessage.message_id,
                                    sender_id: updatedMessage.sender_id,
                                    content: updatedMessage.content,
                                    send_at: updatedMessage.send_at,
                                    reply_to: updatedMessage.reply_to,
                                    fullname:
                                        updatedMessage.profiles?.fullname ||
                                        "Unknown",
                                    email: updatedMessage.profiles?.email || "",
                                    files: updatedMessage.files || [],
                                    views:
                                        updatedMessage.views?.map(
                                            (view: any): MessageView => ({
                                                profile_id: view.profile_id,
                                                fullname:
                                                    view.profiles?.fullname ||
                                                    "Unknown",
                                                email:
                                                    view.profiles?.email || "",

                                                seen_at: view.seen_at,
                                            }),
                                        ) || [],
                                };

                                // Update the message in the array
                                messages = messages.map((msg, index) =>
                                    index === messageIndex
                                        ? formattedUpdatedMessage
                                        : msg,
                                );

                                console.log("Message updated successfully");
                            }
                        }
                    } else if (payload.eventType === "DELETE") {
                        // Handle message deletion
                        console.log("Message deleted:", payload.old);

                        // Remove the message from the array
                        messages = messages.filter(
                            (msg) => msg.message_id !== payload.old.message_id,
                        );

                        console.log("Message removed from UI");
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
                        reply_to: replyTo ? replyTo.message_id : null,
                    },
                ])
                .select("*");
            replyTo = null;

            if (error) {
                console.error("Error sending message:", error);
                // Restore message content if there's an error
                messageContent = messageToSend;
                alert("Failed to send message. Please try again.");
                return;
            } else {
                console.log("Message sent successfully:", insertedMessage);
            }

            if (selectedFile && insertedMessage && insertedMessage[0]) {
                let pname = `chat-${room.room_id}-${user.user_id}-${Date.now().toString().replace(/:/g, "").replace(/-/g, "")}`;
                let { error: fileError } = await supabase.storage
                    .from("shared")
                    .upload(pname, selectedFile);

                if (fileError) {
                    console.error("Error uploading file:", fileError);
                }

                let { data: insertedFile, error: insertedFileError } =
                    await supabase
                        .from("files")
                        .insert([
                            {
                                v_name: selectedFile.name,
                                p_name: pname,
                            },
                        ])
                        .select("file_id")
                        .single();

                if (insertedFile) {
                    let { data: updatedMessage, error: updatedMessageError } =
                        await supabase
                            .from("messages")
                            .update({
                                file_id: insertedFile.file_id,
                            })
                            .eq("message_id", insertedMessage[0].message_id);

                    if (updatedMessageError) {
                        console.error(
                            "Error updating message with file_id:",
                            updatedMessageError,
                        );
                    }
                }
                selectedFile = null;
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
                }));

                const { error } = await supabase
                    .from("views")
                    .insert(viewRecords);

                if (error) {
                    console.log("Error marking messages as viewed:", error);
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

    function handleFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            selectedFile = input.files[0];
        }
    }

    async function getFileDownloadUrl(
        fileName: string,
    ): Promise<string | null> {
        try {
            const { data, error } = await supabase.storage
                .from("shared")
                .createSignedUrl(fileName, 3600); // URL expires in 1 hour

            if (error) {
                console.error("Error creating download URL:", error);
                return null;
            }

            return data.signedUrl;
        } catch (error) {
            console.error("Error in getFileDownloadUrl:", error);
            return null;
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
                    {#if message.reply_to}
                        {@const repliedMessage = messages.find(
                            (m) => m.message_id === message.reply_to,
                        )}
                        <button
                            type="button"
                            class="opacity-70 hover:opacity-100 px-4 py-2 rounded-2xl {isMyMessage(
                                message,
                            )
                                ? 'bg-primary-500 text-white rounded-br-md'
                                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-600'}"
                            aria-label="Reply to message"
                        >
                            <Heading
                                tag="h4"
                                class="text-sm break-words whitespace-pre-wrap"
                            >
                                {repliedMessage?.fullname}
                            </Heading>
                            <P class="text-sm break-words">
                                {repliedMessage?.content}
                            </P>
                        </button>
                    
                    {/if}
                    <button
                        type="button"
                        class="px-4 py-2 rounded-2xl {isMyMessage(message)
                            ? 'bg-primary-500 text-white rounded-br-md'
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-600'}"
                        aria-label="Reply to message"
                        onclick={() => (replyTo = message)}
                        onkeydown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                replyTo = message;
                            }
                        }}
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
                    </button>
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
                    {#if message.files}
                        <div
                            class="w-fit flex gap-2 mt-2 border p-2 rounded-lg dark:border-gray-500 bg-gray-100 dark:bg-gray-900"
                        >
                            <FileSolid
                                class="w-6 h-6 mr-2 text-gray-500 dark:text-gray-400"
                                size="md"
                            />
                            <P>{message.files.v_name}</P>
                            <Button
                                color="alternative"
                                size="xs"
                                onclick={async () => {
                                    const downloadUrl =
                                        await getFileDownloadUrl(
                                            message.files.p_name,
                                        );
                                    console.log(message.files.p_name);

                                    console.log(downloadUrl);

                                    if (downloadUrl) {
                                        window.open(downloadUrl, "_blank");
                                    } else {
                                        alert(
                                            "Failed to get download link. Please try again later.",
                                        );
                                    }
                                }}
                                class="ml-auto p-1"
                            >
                                <DownloadOutline class="w-5 h-5 text-white" />
                            </Button>
                        </div>
                    {/if}
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
    {#if replyTo}
        <div
            class="border-primary-500 dark:bg-green-900/20 p-4 mb-2 flex rounded-lg"
        >
            <div>
                <P class="text-sm">
                    Replying to <b>{replyTo.fullname}</b>: {replyTo.content}
                </P>
            </div>
            <Button
                size="sm"
                color="red"
                class="p-1 ml-auto"
                onclick={() => (replyTo = null)}
            >
                <TrashBinSolid class="w-4 h-4 text-white" />
            </Button>
        </div>
    {/if}
    {#if selectedFile}
        <div
            class=" border-primary-500 dark:bg-green-900/20 p-4 mb-2 flex rounded-lg"
        >
            <FileSolid
                class="w-6 h-6 inline mr-2 text-green-600 dark:text-green-400"
            />
            <span class="text-green-800 dark:text-green-200 font-medium"
                >{selectedFile.name}</span
            >
            <Button
                size="sm"
                color="red"
                class="inline ml-auto p-1"
                onclick={() => (selectedFile = null)}
            >
                <TrashBinSolid class="w-4 h-4 text-white" />
            </Button>
        </div>
    {/if}
    <ButtonGroup class="w-full">
        <Button
            size="sm"
            class="p-3"
            color="primary"
            onclick={() => {
                const fileInput = document.getElementById(
                    "chatbox-file-input",
                ) as HTMLInputElement;
                if (fileInput) fileInput.click();
            }}
        >
            <FileSolid class="w-5 h-5" />
        </Button>
        <input
            id="chatbox-file-input"
            type="file"
            class="hidden"
            onchange={handleFileSelect}
        />

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
