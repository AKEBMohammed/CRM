<script lang="ts">
    import { supabase } from "$lib/supabase";
    import { messagesService, profilesService, filesService } from '$lib/services';
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
        DropdownHeader,
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
    let isMarkingViewed = $state(false); // Prevent duplicate view marking
    let isUploadingFile = $state(false); // Track file upload status

    // Debounced function to check and mark viewed messages
    function scheduleViewCheck() {
        if (viewCheckTimeout) {
            clearTimeout(viewCheckTimeout);
        }
        viewCheckTimeout = setTimeout(() => {
            if (!isMarkingViewed) {
                markMessagesAsViewed();
            }
        }, 1000); // Wait 1 second of inactivity before marking as viewed
    }

    // Auto-scroll to bottom when new messages arrive
    function scrollToBottom() {
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            // Mark messages as viewed when scrolling to bottom (with debouncing)
            scheduleViewCheck();
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
                            try {
                                // Fetch the complete message with views and sender info using service
                                const completeMessage = await messagesService.getByIdWithDetails(payload.new.message_id);

                                if (completeMessage) {
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
                                    console.log("Message added. New count:", messages.length);
                                    setTimeout(scrollToBottom, 100);
                                } else {
                                    console.error("Failed to fetch complete message via service");
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
                            } catch (error) {
                                console.error("Error fetching complete message via service:", error);
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
                            try {
                                // Fetch the updated complete message using service
                                const updatedMessage = await messagesService.getByIdWithDetails(payload.new.message_id);

                                if (updatedMessage) {
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
                            } catch (error) {
                                console.error("Error fetching updated message via service:", error);
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
                        try {
                            // Fetch the viewer's profile info using service
                            const profile = await profilesService.getById(payload.new.profile_id);

                            if (profile) {
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
                                                    v.profile_id === payload.new.profile_id,
                                            );

                                        if (existingViewIndex === -1) {
                                            // Add new view
                                            return {
                                                ...msg,
                                                views: [...msg.views, newView],
                                            };
                                        } else {
                                            // Update existing view (in case seen_at changed)
                                            const updatedViews = [...msg.views];
                                            updatedViews[existingViewIndex] = newView;
                                            return { ...msg, views: updatedViews };
                                        }
                                    }
                                    return msg;
                                });
                                
                                console.log(`Updated views for message ${payload.new.message_id}, viewer: ${profile.fullname}`);
                            } else {
                                console.warn(`Failed to fetch profile for viewer ${payload.new.profile_id}`);
                            }
                        } catch (error) {
                            console.error("Error fetching profile via service:", error);
                        }
                    } else {
                        console.log(`View received for message not in current room: ${payload.new.message_id}`);
                    }
                },
            )
            .subscribe((status) => {
                console.log("Channel subscription status:", status);
                if (status === "SUBSCRIBED") {
                    console.log("Successfully subscribed to real-time updates");

                    // Mark messages as viewed when component loads (with slight delay)
                    setTimeout(() => markMessagesAsViewed(), 1000);
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
            const messageData = {
                content: messageToSend,
                room_id: room.room_id,
                sender_id: user.profile_id,
                reply_to: replyTo ? replyTo.message_id : undefined,
            };

            const insertedMessage = await messagesService.send(messageData);

            if (insertedMessage) {
                console.log("Message sent successfully:", insertedMessage);
                replyTo = null; // Clear reply after successful message send

                // Handle file attachment if present
                if (selectedFile) {
                    try {
                        isUploadingFile = true;
                        
                        console.log(`Uploading file via backend: ${selectedFile.name}`);
                        
                        // Upload file using backend API (this also creates the file record)
                        const uploadedFile = await filesService.upload(
                            selectedFile, 
                            selectedFile.name, // Use original filename as visible name
                            'shared'
                        );

                        if (uploadedFile && uploadedFile.file_id) {
                            // Update message with file_id using messagesService
                            await messagesService.updateFile(insertedMessage.message_id, uploadedFile.file_id);
                            console.log(`File attached to message ${insertedMessage.message_id}`, uploadedFile);
                        }
                        
                        selectedFile = null;
                    } catch (fileError) {
                        console.error("Error handling file attachment:", fileError);
                        
                        // Show user-friendly error message based on error type
                        const errorMessage = fileError instanceof Error 
                            ? fileError.message 
                            : 'Unknown error occurred';
                            
                        // Handle specific backend upload errors
                        if (errorMessage.includes('Authentication required') || errorMessage.includes('Invalid authentication')) {
                            alert(
                                '� Authentication Error\n\n' +
                                'You need to be signed in to upload files. Please refresh the page and sign in again.\n\n' +
                                'Your message was sent without the file attachment.'
                            );
                        } else if (errorMessage.includes('File size') && errorMessage.includes('exceeds')) {
                            alert(
                                '📏 File Size Error\n\n' +
                                errorMessage + '\n\n' +
                                'Please choose a smaller file or compress your file before uploading.\n\n' +
                                'Your message was sent without the file attachment.'
                            );
                        } else if (errorMessage.includes('File type') && errorMessage.includes('not allowed')) {
                            alert(
                                '📎 File Type Error\n\n' +
                                errorMessage + '\n\n' +
                                'Please choose a supported file type.\n\n' +
                                'Your message was sent without the file attachment.'
                            );
                        } else if (errorMessage.includes('network error') || errorMessage.includes('Failed to fetch')) {
                            alert(
                                '🌐 Network Error\n\n' +
                                'Upload failed due to a network issue. Please check your internet connection and try again.\n\n' +
                                'Your message was sent without the file attachment.'
                            );
                        } else if (errorMessage.includes('already exists')) {
                            alert(
                                '📁 File Exists\n\n' +
                                'A file with this name already exists. The system should have automatically renamed your file, but this failed.\n\n' +
                                'Please try renaming your file and upload again.\n\n' +
                                'Your message was sent without the file attachment.'
                            );
                        } else {
                            alert(`❌ File Upload Failed\n\n${errorMessage}\n\nYour message was sent without the file attachment.`);
                        }
                        
                    } finally {
                        isUploadingFile = false;
                    }
                }
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
        if (isMarkingViewed) return; // Prevent concurrent executions
        
        try {
            isMarkingViewed = true;
            
            // Get all message IDs that this user hasn't viewed yet
            const messageIds = messages
                .filter((msg: Message) => {
                    // Only mark messages from other users as viewed
                    if (msg.sender_id === user.profile_id) return false;
                    
                    // Check if this user has already viewed this message
                    const alreadyViewed = msg.views?.some(
                        (view: MessageView) => view.profile_id === user.profile_id
                    );
                    
                    return !alreadyViewed;
                })
                .map((msg: Message) => msg.message_id);

            if (messageIds.length > 0) {
                console.log(`Attempting to mark ${messageIds.length} messages as viewed`);
                
                // Mark messages as viewed using bulk service method
                await messagesService.markViewedBulk(messageIds, user.profile_id);
                console.log(`Successfully marked ${messageIds.length} messages as viewed`);
            }
        } catch (error) {
            console.error("Error in markMessagesAsViewed:", error);
            // Don't throw the error to prevent breaking the UI
        } finally {
            isMarkingViewed = false;
        }
    }

    function handleFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            
            // File size validation (10MB limit)
            const maxSize = 10 * 1024 * 1024; // 10MB in bytes
            if (file.size > maxSize) {
                alert('File size must be less than 10MB. Please choose a smaller file.');
                input.value = ''; // Clear the input
                return;
            }
            
            // Enhanced file type validation
            const allowedTypes = [
                // Images
                'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
                // Videos
                'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
                // Audio
                'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac',
                // Documents
                'text/plain', 'application/pdf', 'application/msword', 
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/zip', 'application/x-zip-compressed', 'application/json', 'text/csv'
            ];
            
            const isAllowedType = allowedTypes.includes(file.type) || 
                allowedTypes.some(type => file.type.startsWith(type.split('/')[0] + '/'));
            
            if (!isAllowedType && file.type !== '') {
                alert(
                    `File type "${file.type}" is not supported.\n\n` +
                    'Supported types:\n' +
                    '• Images: JPEG, PNG, GIF, WebP\n' +
                    '• Videos: MP4, MPEG, QuickTime, AVI\n' +
                    '• Audio: MP3, WAV, OGG, AAC\n' +
                    '• Documents: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV, JSON, ZIP'
                );
                input.value = ''; // Clear the input
                return;
            }
            
            selectedFile = file;
            console.log(`File selected: ${file.name} (${formatFileSize(file.size)}) - Type: ${file.type}`);
        }
    }

    function getMessageStatus(message: Message) {
        if (!isMyMessage(message)) return null;

        // For sent messages, show read status based on views
        const otherUserViews = message.views.filter(
            (view: MessageView) => view.profile_id !== user.profile_id
        );

        if (otherUserViews.length > 0) {
            return {
                type: "read",
                count: otherUserViews.length,
                viewers: otherUserViews,
            };
        }
        
        // Message was sent but not read by others yet
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

    // Helper functions to detect file types
    function isImageFile(file: any): boolean {
        if (!file) return false;
        
        // Primary check: use file_type if available
        if (file.file_type) {
            return file.file_type.startsWith('image/');
        }
        
        // Fallback: check file extension from v_name or p_name
        const fileName = file.v_name || file.p_name || '';
        const extension = fileName.toLowerCase().split('.').pop();
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
        return imageExtensions.includes(extension || '');
    }

    function isVideoFile(file: any): boolean {
        if (!file) return false;
        
        // Primary check: use file_type if available
        if (file.file_type) {
            return file.file_type.startsWith('video/');
        }
        
        // Fallback: check file extension from v_name or p_name
        const fileName = file.v_name || file.p_name || '';
        const extension = fileName.toLowerCase().split('.').pop();
        const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'mpg', 'mpeg'];
        return videoExtensions.includes(extension || '');
    }

    function isAudioFile(file: any): boolean {
        if (!file) return false;
        
        // Primary check: use file_type if available
        if (file.file_type) {
            return file.file_type.startsWith('audio/');
        }
        
        // Fallback: check file extension from v_name or p_name
        const fileName = file.v_name || file.p_name || '';
        const extension = fileName.toLowerCase().split('.').pop();
        const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'wma', 'flac'];
        return audioExtensions.includes(extension || '');
    }

    function getMediaTypeLabel(file: any): string {
        if (isImageFile(file)) return 'Image';
        if (isVideoFile(file)) return 'Video';
        if (isAudioFile(file)) return 'Audio';
        return 'Document';
    }

    async function getFileDownloadUrl(
        fileName: string,
    ): Promise<string | null> {
        try {
            return await filesService.getDownloadUrl(fileName);
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
                    <div class="flex-shrink-0 mb-6">
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
                            class="px-2 py-2 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md {isMyMessage(
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
                                    <!-- Media Preview for Images, Videos, and Audio -->
                                    {#if isImageFile(message.files)}
                                        <!-- Image Preview -->
                                        <div class="mb-3">
                                            {#await getFileDownloadUrl(message.files.p_name)}
                                                <div class="w-full h-48 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                                    <Spinner size="6" />
                                                </div>
                                            {:then downloadUrl}
                                                {#if downloadUrl}
                                                    <button
                                                        type="button"
                                                        class="w-full bg-transparent border-none p-0 cursor-pointer"
                                                        onclick={() => {
                                                            window.open(downloadUrl, '_blank');
                                                        }}
                                                        onkeydown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.preventDefault();
                                                                window.open(downloadUrl, '_blank');
                                                            }
                                                        }}
                                                        title="Click to view full image"
                                                    >
                                                        <img 
                                                            src={downloadUrl} 
                                                            alt={message.files.v_name || 'Image'}
                                                            class="max-w-full h-auto max-h-64 rounded-lg hover:opacity-90 transition-opacity"
                                                            onerror={(e) => {
                                                                console.error('Failed to load image:', e);
                                                                const target = e.target as HTMLImageElement;
                                                                if (target) {
                                                                    target.style.display = 'none';
                                                                }
                                                            }}
                                                        />
                                                    </button>
                                                {:else}
                                                    <div class="w-full h-48 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                                        <P class="text-gray-500">Failed to load image</P>
                                                    </div>
                                                {/if}
                                            {:catch error}
                                                <div class="w-full h-48 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                                    <P class="text-gray-500">Failed to load image</P>
                                                </div>
                                            {/await}
                                        </div>
                                    {:else if isVideoFile(message.files)}
                                        <!-- Video Preview -->
                                        <div class="mb-3">
                                            {#await getFileDownloadUrl(message.files.p_name)}
                                                <div class="w-full h-48 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                                    <Spinner size="6" />
                                                </div>
                                            {:then downloadUrl}
                                                {#if downloadUrl}
                                                    <video 
                                                        controls 
                                                        class="max-w-full h-auto max-h-64 rounded-lg"
                                                        preload="metadata"
                                                    >
                                                        <source src={downloadUrl} type={message.files.file_type || 'video/mp4'} />
                                                        <track kind="captions" />
                                                        Your browser does not support the video tag.
                                                    </video>
                                                {:else}
                                                    <div class="w-full h-48 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                                        <P class="text-gray-500">Failed to load video</P>
                                                    </div>
                                                {/if}
                                            {:catch error}
                                                <div class="w-full h-48 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                                    <P class="text-gray-500">Failed to load video</P>
                                                </div>
                                            {/await}
                                        </div>
                                    {:else if isAudioFile(message.files)}
                                        <!-- Audio Preview -->
                                        <div class="mb-3">
                                            {#await getFileDownloadUrl(message.files.p_name)}
                                                <div class="w-full h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                                    <Spinner size="4" />
                                                </div>
                                            {:then downloadUrl}
                                                {#if downloadUrl}
                                                    <audio 
                                                        controls 
                                                        class="w-full rounded-lg"
                                                        preload="metadata"
                                                    >
                                                        <source src={downloadUrl} type={message.files.file_type || 'audio/mpeg'} />
                                                        Your browser does not support the audio tag.
                                                    </audio>
                                                {:else}
                                                    <div class="w-full h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                                        <P class="text-gray-500">Failed to load audio</P>
                                                    </div>
                                                {/if}
                                            {:catch error}
                                                <div class="w-full h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                                    <P class="text-gray-500">Failed to load audio</P>
                                                </div>
                                            {/await}
                                        </div>
                                    {/if}

                                    <!-- File Info and Download Section -->
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
                                                    {message.files.v_name || 'Attached File'}
                                                </P>
                                                <P
                                                    class="text-xs {isMyMessage(
                                                        message,
                                                    )
                                                        ? 'text-primary-200'
                                                        : 'text-gray-500 dark:text-gray-400'}"
                                                >
                                                    {getMediaTypeLabel(message.files)}
                                                    {#if message.files.file_size}
                                                        • {formatFileSize(message.files.file_size)}
                                                    {/if}
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
                                                try {
                                                    const downloadUrl = await getFileDownloadUrl(
                                                        message.files.p_name,
                                                    );
                                                    if (downloadUrl) {
                                                        // Create a temporary link to trigger download
                                                        const link = document.createElement('a');
                                                        link.href = downloadUrl;
                                                        link.download = message.files.v_name || 'download';
                                                        link.target = '_blank';
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        document.body.removeChild(link);
                                                    } else {
                                                        alert("Failed to get download link. Please try again later.");
                                                    }
                                                } catch (error) {
                                                    console.error('Download error:', error);
                                                    alert("Error downloading file. Please try again later.");
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
                                            class="w-3 h-3 text-primary-500"
                                        />
                                        <CheckOutline
                                            class="w-3 h-3 text-primary-500 -ml-3"
                                        />
                                        {#if messageStatus.count && messageStatus?.count > 0}
                                            <Dropdown simple placement="top">
                                                <DropdownHeader
                                                    class="flex items-center space-x-2"
                                                >
                                                    <P
                                                        class="text-sm font-medium mb-2"
                                                        >Read by {messageStatus.count}
                                                        {messageStatus.count ===
                                                        1
                                                            ? "person"
                                                            : "people"}:</P
                                                    >
                                                </DropdownHeader>

                                                {#each messageStatus.viewers as viewer}
                                                    <DropdownItem
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
                                                    </DropdownItem>
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
                    <div class="flex-shrink-0 mb-6">
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
                class="flex items-center space-x-3 p-3 {isUploadingFile 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                    : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'} rounded-lg"
            >
                <div class="flex-shrink-0">
                    <div class="p-2 {isUploadingFile 
                        ? 'bg-blue-100 dark:bg-blue-800' 
                        : 'bg-green-100 dark:bg-green-800'} rounded-lg">
                        {#if isUploadingFile}
                            <Spinner size="4" class="text-blue-600 dark:text-blue-400" />
                        {:else}
                            <FileSolid
                                class="w-4 h-4 text-green-600 dark:text-green-400"
                            />
                        {/if}
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <P
                        class="text-sm font-medium {isUploadingFile 
                            ? 'text-blue-800 dark:text-blue-200' 
                            : 'text-green-800 dark:text-green-200'} truncate"
                    >
                        {selectedFile.name}
                    </P>
                    <P class="text-xs {isUploadingFile 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-green-600 dark:text-green-400'}">
                        {formatFileSize(selectedFile.size)} • 
                        {#if selectedFile.type.startsWith('image/')}
                            Image
                        {:else if selectedFile.type.startsWith('video/')}
                            Video
                        {:else if selectedFile.type.startsWith('audio/')}
                            Audio
                        {:else}
                            Document
                        {/if}
                        • {isUploadingFile ? 'Uploading...' : 'Ready to send'}
                    </P>
                </div>
                {#if !isUploadingFile}
                    <Button
                        size="xs"
                        color="light"
                        class="p-1.5 flex-shrink-0"
                        onclick={() => (selectedFile = null)}
                    >
                        <CloseOutline class="w-3 h-3" />
                    </Button>
                {/if}
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
            disabled={(!messageContent.trim() && !selectedFile) || isUploadingFile}
            onclick={sendMessage}
            class="p-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
        >
            {#if isUploadingFile}
                <Spinner size="4" />
            {:else}
                <PaperPlaneSolid class="w-5 h-5" />
            {/if}
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
