<script lang="ts">
    import { enhance } from "$app/forms";
    import {
        Button,
        Card,
        Heading,
        Input,
        Label,
        Listgroup,
        ListgroupItem,
        Modal,
        P,
        Search,
    } from "flowbite-svelte";
    import { PlusOutline } from "flowbite-svelte-icons";

    let { children, data } = $props();
    let showCreateRoomModal = $state(false);
</script>

<main class="w-full h-full row-start-2 col-start-2 overflow-y-auto flex">
    <aside
        class="w-1/3 h-full p-2 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
    >
        <Heading
            tag="h2"
            class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
            >Chat Rooms</Heading
        >
        <Search placeholder="Search rooms..." size="md" class="mb-2" />
        <Button
            color="light"
            class="w-full mb-2"
            onclick={() => (showCreateRoomModal = true)}
        >
            <PlusOutline class="w-4 h-4 mr-2" />
            New Room
        </Button>
        {#each data.rooms as room}
            <Card
                href={`/dashboard/rooms/${room.room_id}`}
                class="w-full p-4 mb-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
            >
                <Heading
                    tag="h3"
                    class="text-md font-bold text-gray-900 dark:text-white"
                >
                    {room.name}
                </Heading>
                <P class="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {room.last_message.fullname +
                        ": " +
                        room.last_message.content || "No messages yet"}
                </P>
            </Card>
        {/each}
    </aside>
    {@render children()}
</main>

<Modal title="Create New Chat Room" bind:open={showCreateRoomModal} size="md">
    <form use:enhance method="POST" action="/dashboard/rooms?/create" class="space-y-6">
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
                checked={ profile.profile_id == data.user.profile_id ? true : false }
                class="mr-2"
                />
                <span><b>{profile.fullname}</b> <br /> {profile.email}</span>
            </ListgroupItem>
            {/each}
        </Listgroup>
        <Button type="submit" color="primary" class="w-full">
            Create Room
        </Button>
    </form>
</Modal>
