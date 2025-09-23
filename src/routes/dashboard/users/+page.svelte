<script lang="ts">
    import { Table } from "@flowbite-svelte-plugins/datatable";
    import type { PageProps } from "./$types";
    import { Button, Dialog, Heading, Input, Label, Modal, P } from "flowbite-svelte";
    import {
        FileExportOutline,
        PlusOutline,
    } from "flowbite-svelte-icons";

    let { data } = $props();
    let showAddUserModal = $state(false);

    console.log(data.profiles);
</script>

<article class="w-full h-full p-6">
    <div class="grid grid-cols-[1fr_auto_auto] gap-x-2 mb-4">
        <Heading
            tag="h1"
            class="text-3xl font-bold mb-2 text-gray-900 dark:text-white"
            >Users</Heading
        >
        <P class="mb-4 text-gray-500 dark:text-gray-400 col-start-1 row-start-2"
            >Manage your users here.</P
        >
        <Button class="w-fit">
            <FileExportOutline class="w-5 h-5 mr-2" />
            Export
        </Button>
        <Button class="w-fit" onclick={() => (showAddUserModal = true)}>
            <PlusOutline class="w-5 h-5 mr-2" />
            Add
        </Button>
    </div>

    <Table items={data.profiles} />

    <Modal title="Add User" bind:open={showAddUserModal} size="md">
        <P class="mb-4">Fill in the details to add a new user.</P>
        <form action="" method="post" class="flex flex-col justify-center gap-2">
            <Label >
                Full name
            </Label>
            <Input />
            <Label class="mt-4">
                Email
            </Label>
            <Input type="email" />
            <Label class="mt-4">
                Password
                </Label>
            <Input type="password" />
            <Button class="w-2/3 self-center">Add user</Button>
        </form>
    </Modal>
</article>
