<script lang="ts">
    import { enhance } from "$app/forms";
    import {
        Button,
        Card,
        Heading,
        Input,
        Label,
        List,
        Listgroup,
        ListgroupItem,
        Modal,
        P,
        Search,
        Sidebar,
    } from "flowbite-svelte";
    import { PlusOutline } from "flowbite-svelte-icons";

    let { children, data } = $props();
    let showCreateRoomModal = $state(false);
</script>

<main class="w-full h-full row-start-2 col-start-2 overflow-y-auto flex">
    <div
        class="relative w-1/3 h-full border-r border-gray-200 dark:border-gray-700"
    >
        <Sidebar
            isOpen={true}
            alwaysOpen={true}
            backdrop={false}
            position="absolute"
            class="w-full h-full"
        >
            <Heading tag="h4" class="text-gray-900 dark:text-white mb-2"
                >Chat Rooms</Heading
            >
            <Search placeholder="Search rooms..." size="md" class="mb-2" />
            <Button
                color="primary"
                class="w-full mb-2"
                onclick={() => (showCreateRoomModal = true)}
            >
                <PlusOutline class="w-4 h-4 mr-2" />
                New Room
            </Button>
            <Listgroup class="w-full max-h-120 overflow-y-scroll">
                {#each data.rooms as room}
                    <ListgroupItem
                        href={`/dashboard/rooms/${room.room_id}`}
                        class="flex flex-col justify-start items-start"
                    >
                        <Heading tag="h5" class="text-gray-900 dark:text-white">
                            {room.name}
                        </Heading>
                        <P
                            class="text-sm text-gray-600 dark:text-gray-300 truncate"
                        >
                            <b>{room.last_message.fullname}</b>: {room
                                .last_message.content || "No messages yet"}
                        </P>
                    </ListgroupItem>
                {/each}
            </Listgroup>
        </Sidebar>
    </div>

    {@render children()}
</main>

<Modal title="Create New Chat Room" bind:open={showCreateRoomModal} size="md">
    <form
        use:enhance
        method="POST"
        action="/dashboard/rooms?/create"
        class="space-y-6"
    >
        <Label
            for="name"
            class="block mb-2 text-md font-medium text-gray-900 dark:text-white"
            >Room Name</Label
        >
        <Input
            type="text"
            name="name"
            id="name"
            required
            placeholder="Enter room name"
        />
        <Label
            class="block mb-2 text-md font-medium text-gray-900 dark:text-white"
        >
            Add user
            <small>( min. 3 users)</small>
        </Label>
        <Listgroup class="h-50 overflow-scroll">
            {#each data.profiles as profile}
                <ListgroupItem class="flex items-center mb-2">
                    <input
                        type="checkbox"
                        name="profile"
                        value={profile.profile_id}
                        checked={profile.profile_id == data.user.profile_id
                            ? true
                            : false}
                        class="mr-2"
                    />
                    <span><b>{profile.fullname}</b> <br /> {profile.email}</span
                    >
                </ListgroupItem>
            {/each}
        </Listgroup>
        <Button type="submit" color="primary" class="w-full">
            Create Room
        </Button>
    </form>
</Modal>
