<script lang="ts">
    import { enhance } from "$app/forms";
    import Chatbox from "$lib/components/Chatbox.svelte";
    import { supabase } from "$lib/supabase";
    import {
        Button,
        ButtonGroup,
        Heading,
        Input,
        Avatar,
        P,
        Dropdown,
        DropdownItem,
        Label,
        Modal,
        Listgroup,
        ListgroupItem,
        Banner,
    } from "flowbite-svelte";
    import { DotsVerticalOutline } from "flowbite-svelte-icons";
    let { data, form } = $props();

    let showAddUserModal = $state(false);
    let showLeaveRoomModal = $state(false);
    let showDeleteRoomModal = $state(false);
</script>

{#if form?.error}
    <Banner color="red" class="mb-4">
        <P class="font-medium text-red-800">{form.error}</P>
    </Banner>
{/if}

{#if form?.success}
    <Banner color="green" class="mb-4">
        <P class="font-medium text-green-800">{form.message}</P>
    </Banner>
{/if}

<div class="w-full h-auto flex flex-col bg-white dark:bg-gray-900">
    <!-- Chat Header -->
    <div
        class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
    >
        <div class="flex items-center space-x-3">
            <Avatar
                size="sm"
                class="ring-2 ring-primary-100 dark:ring-primary-900"
            />

            <Heading
                tag="h3"
                class="text-sm font-semibold text-gray-900 dark:text-white"
            >
                {data.room.name}
            </Heading>
        </div>

        <Button size="xs" color="light" class="p-2 ml-auto">
            <DotsVerticalOutline class="w-4 h-4" />
        </Button>
        <Dropdown simple>
            <DropdownItem onclick={() => (showAddUserModal = true)}>
                Add User
            </DropdownItem>
            <DropdownItem onclick={() => (showLeaveRoomModal = true)}
                >Leave Room</DropdownItem
            >
            <DropdownItem onclick={() => (showDeleteRoomModal = true)}
                >Delete Room</DropdownItem
            >
        </Dropdown>
    </div>

    <!-- Messages Container -->
    <Chatbox room={data.room} user={data.user} messages={data.messages} />
</div>

<Modal title="Add New User" bind:open={showAddUserModal} size="md">
    <form use:enhance method="POST" action="?/add" class="space-y-6">
        <Label
            class="block mb-2 text-md font-medium text-gray-900 dark:text-white"
        >
            Add user
        </Label>
        <Listgroup class="h-50 overflow-scroll">
            {#each data.profiles as profile}
                {#if profile.profile_id != data.user.profile_id}
                    
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
                    <Avatar
                        size="sm"
                        class="ring-2 ring-primary-100 dark:ring-primary-900 mr-2"
                    />
                    <span><b>{profile.fullname}</b> <br /> {profile.email}</span
                    >
                </ListgroupItem>
                {/if}
            {/each}
        </Listgroup>
        <Button type="submit" color="primary" class="w-full">Add Users</Button>
    </form>
</Modal>

<Modal title="Leave the room" open={showLeaveRoomModal}>
    <form
        use:enhance
        action="?/leave"
        method="post"
        class="flex flex-col gap-2"
    >
        <Heading tag="h5">Are you sure you want to leave this room ?</Heading>
        <Button type="submit" color="red">I am sure</Button>
    </form>
</Modal>

<Modal title="Delete the room" open={showDeleteRoomModal}>
    <form
        use:enhance
        action="?/delete"
        method="post"
        class="flex flex-col gap-2"
    >
        <Heading tag="h5">Are you sure you want to delete this room ?</Heading>
        <Button type="submit" color="red">I am sure</Button>
    </form>
</Modal>
