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
        Badge,
        Tooltip,
        Spinner,
    } from "flowbite-svelte";
    import {
        CheckOutline,
        DownloadOutline,
        FileSolid,
        PaperPlaneSolid,
        TrashBinSolid,
        ReplyOutline,
        CloseOutline,
        DotsVerticalOutline,
        EyeOutline,
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
    let selectedFile: File | null = $state(null);
    let replyTo: Message | null = $state(null);
    let isTyping = $state(false);
    let showEmojiPicker = $state(false);

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
                                    reply_to: payload.new.reply_to || null,
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

            if (error) {
                console.error("Error sending message:", error);
                // Restore message content if there's an error
                messageContent = messageToSend;
                alert("Failed to send message. Please try again.");
                return;
            } else {
                console.log("Message sent successfully:", insertedMessage);
                replyTo = null; // Clear reply after successful message send
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

        // Show typing indicator
        if (!isTyping && messageContent.trim()) {
            isTyping = true;
            setTimeout(() => {
                isTyping = false;
            }, 3000);
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

    function getMessageStatus(message: Message) {
        if (!isMyMessage(message)) return null;

        if (message.views.length > 0) {
            return {
                type: "read",
                count: message.views.length,
                viewers: message.views,
            };
        }
        return { type: "sent" };
    }

    function getInitials(fullname: string): string {
        return fullname
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }

    function formatFileSize(bytes: number): string {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

<!-- Professional CRM Chat Interface -->
<!-- Messages Container -->
<div
    bind:this={messagesContainer}
    onscroll={scheduleViewCheck}
    class="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-900"
>
    {#if messages.length === 0}
        <div class="flex items-center justify-center h-full">
            <div class="text-center max-w-sm mx-auto">
                <div
                    class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center"
                >
                    <PaperPlaneSolid
                        class="w-8 h-8 text-gray-400 dark:text-gray-600"
                    />
                </div>
                <Heading
                    tag="h4"
                    class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                >
                    Start the conversation
                </Heading>
                <P class="text-sm text-gray-500 dark:text-gray-400">
                    Send your first message to begin communicating with your
                    team or clients.
                </P>
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
        {@const messageStatus = getMessageStatus(message)}

        {#if showDate}
            <div class="flex justify-center my-6">
                <Badge color="gray" class="px-3 py-1 text-xs font-medium">
                    {formatDate(message.send_at || message.created_at)}
                </Badge>
            </div>
        {/if}

        <div class="group relative">
            <div
                class="flex {isMyMessage(message)
                    ? 'justify-end'
                    : 'justify-start'} items-end space-x-2"
            >
                <!-- Sender Avatar (for received messages) -->
                {#if !isMyMessage(message)}
                    <div class="flex-shrink-0 mb-1">
                        <Avatar size="sm" class="shadow-sm">
                            <div
                                class="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                            >
                                {getInitials(message.fullname)}
                            </div>
                        </Avatar>
                    </div>
                {/if}

                <!-- Message Content -->
                <div
                    class="flex flex-col max-w-xs lg:max-w-md xl:max-w-lg {isMyMessage(
                        message,
                    )
                        ? 'items-end'
                        : 'items-start'}"
                >
                    <!-- Reply Context -->
                    {#if message.reply_to}
                        {@const repliedMessage = messages.find(
                            (m) => m.message_id === message.reply_to,
                        )}
                        {#if repliedMessage}
                            <div
                                class="mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-3 border-primary-500 max-w-full"
                            >
                                <div class="flex items-center space-x-2 mb-1">
                                    <ReplyOutline
                                        class="w-3 h-3 text-primary-500"
                                    />
                                    <P
                                        class="text-xs font-medium text-primary-600 dark:text-primary-400"
                                    >
                                        {repliedMessage.fullname}
                                    </P>
                                </div>
                                <P
                                    class="text-xs text-gray-600 dark:text-gray-400 truncate"
                                >
                                    {repliedMessage.content}
                                </P>
                            </div>
                        {/if}
                    {/if}

                    <!-- Main Message Bubble -->
                    <div class="relative group">
                        <div
                            class="px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md {isMyMessage(
                                message,
                            )
                                ? 'bg-primary-500 text-white rounded-br-md'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md'}"
                        >
                            <!-- Sender Name (for received messages) -->
                            {#if !isMyMessage(message)}
                                <div class="mb-1">
                                    <P
                                        class="text-xs font-semibold text-primary-600 dark:text-primary-400"
                                    >
                                        {message.fullname}
                                    </P>
                                </div>
                            {/if}

                            <!-- Message Content -->
                            <P
                                class="text-sm leading-relaxed break-words whitespace-pre-wrap"
                            >
                                {message.content}
                            </P>

                            <!-- File Attachment -->
                            {#if message.files}
                                <div
                                    class="mt-3 p-3 rounded-lg {isMyMessage(
                                        message,
                                    )
                                        ? 'bg-primary-600'
                                        : 'bg-gray-50 dark:bg-gray-700'} border border-opacity-20"
                                >
                                    <div
                                        class="flex items-center justify-between"
                                    >
                                        <div
                                            class="flex items-center space-x-3"
                                        >
                                            <div
                                                class="p-2 {isMyMessage(message)
                                                    ? 'bg-primary-700'
                                                    : 'bg-gray-200 dark:bg-gray-600'} rounded-lg"
                                            >
                                                <FileSolid
                                                    class="w-4 h-4 {isMyMessage(
                                                        message,
                                                    )
                                                        ? 'text-primary-100'
                                                        : 'text-gray-600 dark:text-gray-400'}"
                                                />
                                            </div>
                                            <div>
                                                <P
                                                    class="text-sm font-medium {isMyMessage(
                                                        message,
                                                    )
                                                        ? 'text-primary-100'
                                                        : 'text-gray-900 dark:text-white'}"
                                                >
                                                    {message.files.v_name}
                                                </P>
                                                <P
                                                    class="text-xs {isMyMessage(
                                                        message,
                                                    )
                                                        ? 'text-primary-200'
                                                        : 'text-gray-500 dark:text-gray-400'}"
                                                >
                                                    Document
                                                </P>
                                            </div>
                                        </div>
                                        <Button
                                            size="xs"
                                            color={isMyMessage(message)
                                                ? "light"
                                                : "primary"}
                                            class="ml-2"
                                            onclick={async () => {
                                                const downloadUrl =
                                                    await getFileDownloadUrl(
                                                        message.files.p_name,
                                                    );
                                                if (downloadUrl) {
                                                    window.open(
                                                        downloadUrl,
                                                        "_blank",
                                                    );
                                                } else {
                                                    alert(
                                                        "Failed to get download link. Please try again later.",
                                                    );
                                                }
                                            }}
                                        >
                                            <DownloadOutline
                                                class="w-3 h-3 mr-1"
                                            />
                                            Download
                                        </Button>
                                    </div>
                                </div>
                            {/if}
                        </div>

                        <!-- Reply Button (appears on hover) -->
                        <div
                            class="absolute top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 {isMyMessage(
                                message,
                            )
                                ? '-left-10'
                                : '-right-10'}"
                        >
                            <Button
                                size="xs"
                                color="light"
                                class="p-2 shadow-md"
                                onclick={() => (replyTo = message)}
                            >
                                <ReplyOutline class="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <!-- Message Metadata -->
                    <div class="flex items-center space-x-2 mt-1 px-1">
                        <span class="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(message.send_at || message.created_at)}
                        </span>

                        {#if messageStatus}
                            <div class="flex items-center space-x-1">
                                {#if messageStatus.type === "read"}
                                    <div class="flex items-center space-x-1">
                                        <CheckOutline
                                            class="w-3 h-3 text-blue-500"
                                        />
                                        <CheckOutline
                                            class="w-3 h-3 text-blue-500 -ml-1"
                                        />
                                        {#if messageStatus.count && messageStatus?.count > 0}
                                            <Dropdown placement="top">
                                                <Button
                                                    size="xs"
                                                    color="light"
                                                    class="p-1 text-xs"
                                                >
                                                    {messageStatus.count}
                                                </Button>
                                                <P
                                                    class="text-xs font-medium mb-2"
                                                    >Read by:</P
                                                >
                                                {#each messageStatus.viewers as viewer}
                                                    <div
                                                        class="flex items-center space-x-2 py-1"
                                                    >
                                                        <Avatar size="xs">
                                                            <div
                                                                class="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs"
                                                            >
                                                                {getInitials(
                                                                    viewer.fullname,
                                                                )}
                                                            </div>
                                                        </Avatar>
                                                        <P class="text-xs"
                                                            >{viewer.fullname}</P
                                                        >
                                                    </div>
                                                {/each}
                                            </Dropdown>
                                        {/if}
                                    </div>
                                {:else}
                                    <CheckOutline
                                        class="w-3 h-3 text-gray-400"
                                    />
                                {/if}
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Sender Avatar (for sent messages) -->
                {#if isMyMessage(message)}
                    <div class="flex-shrink-0 mb-1">
                        <Avatar size="sm" class="shadow-sm">
                            <div
                                class="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                            >
                                {getInitials(user.fullname || "You")}
                            </div>
                        </Avatar>
                    </div>
                {/if}
            </div>
        </div>
    {/each}
</div>

<!-- Professional Message Input Area -->
<div
    class="mt-auto border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
>
    <!-- Reply Preview -->
    {#if replyTo}
        <div class="px-4 pt-3">
            <div
                class="flex items-start space-x-3 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg"
            >
                <div class="flex-shrink-0">
                    <ReplyOutline
                        class="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5"
                    />
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                        <P
                            class="text-xs font-medium text-primary-700 dark:text-primary-300"
                        >
                            Replying to {replyTo.fullname}
                        </P>
                    </div>
                    <P
                        class="text-sm text-gray-600 dark:text-gray-400 truncate mt-1"
                    >
                        {replyTo.content}
                    </P>
                </div>
                <Button
                    size="xs"
                    color="light"
                    class="p-1.5 flex-shrink-0"
                    onclick={() => (replyTo = null)}
                >
                    <CloseOutline class="w-3 h-3" />
                </Button>
            </div>
        </div>
    {/if}

    <!-- File Preview -->
    {#if selectedFile}
        <div class="px-4 {replyTo ? 'pt-2' : 'pt-3'}">
            <div
                class="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
                <div class="flex-shrink-0">
                    <div class="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                        <FileSolid
                            class="w-4 h-4 text-green-600 dark:text-green-400"
                        />
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <P
                        class="text-sm font-medium text-green-800 dark:text-green-200 truncate"
                    >
                        {selectedFile.name}
                    </P>
                    <P class="text-xs text-green-600 dark:text-green-400">
                        {formatFileSize(selectedFile.size)} • Ready to send
                    </P>
                </div>
                <Button
                    size="xs"
                    color="light"
                    class="p-1.5 flex-shrink-0"
                    onclick={() => (selectedFile = null)}
                >
                    <CloseOutline class="w-3 h-3" />
                </Button>
            </div>
        </div>
    {/if}

    <!-- Input Area -->
    <ButtonGroup class="w-full p-2">
        <Button
            size="md"
            color="light"
            class="p-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            onclick={() => {
                const fileInput = document.getElementById(
                    "chatbox-file-input",
                ) as HTMLInputElement;
                if (fileInput) fileInput.click();
            }}
        >
            <FileSolid class="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </Button>
        <input
            id="chatbox-file-input"
            type="file"
            class="hidden"
            onchange={handleFileSelect}
        />

        <!-- Message Input -->

        <Input
            type="text"
            placeholder="Type your message..."
            bind:value={messageContent}
            onkeypress={handleKeyPress}
            class="pr-12 py-3 text-sm border border-gray-300 dark:border-gray-600 "
        />
        <!-- Send Button -->
        <Button
            size="md"
            color="primary"
            disabled={!messageContent.trim() && !selectedFile}
            onclick={sendMessage}
            class="p-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
        >
            <PaperPlaneSolid class="w-5 h-5" />
        </Button>
    </ButtonGroup>

    <!-- Input Help Text -->
    <div
        class="flex justify-between items-center p-2 text-xs text-gray-500 dark:text-gray-400"
    >
        <span>Press Enter to send • Shift + Enter for new line</span>
        {#if isTyping}
            <div class="flex items-center space-x-1">
                <Spinner size="4" />
                <span>Typing...</span>
            </div>
        {/if}
    </div>
</div>
