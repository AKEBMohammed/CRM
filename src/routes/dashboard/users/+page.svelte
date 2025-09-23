<script lang="ts">
    import { Table } from "@flowbite-svelte-plugins/datatable";
    import {
        Button,
        Heading,
        Input,
        Label,
        Modal,
        P,
        Fileupload,
        Select,
        Alert,
        Dropzone,
    } from "flowbite-svelte";
    import {
    CloudArrowUpOutline,
        FileExportOutline,
        FileImportOutline,
        PlusOutline,
    } from "flowbite-svelte-icons";

    let { data } = $props();
    let showAddUserModal = $state(false);
    let showExportDataModal = $state(false);
    let showImportDataModal = $state(false);
</script>

<article class="w-full h-full p-6">
    <div class="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 mb-4">
        <Heading
            tag="h1"
            class="text-3xl font-bold mb-2 text-gray-900 dark:text-white"
            >Users</Heading
        >
        <P class="mb-4 text-gray-500 dark:text-gray-400 col-start-1 row-start-2"
            >Manage your users here.</P
        >
        <Button class="w-fit" onclick={() => (showImportDataModal = true)}>
            <FileImportOutline class="w-5 h-5 mr-2" />
            Import
        </Button>
        <Button class="w-fit" onclick={() => (showExportDataModal = true)}>
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
        <form
            action=""
            method="post"
            class="flex flex-col justify-center gap-2"
        >
            <Label>Full name</Label>
            <Input type="text" />
            <Label class="mt-4">Email</Label>
            <Input type="email" />
            <Label class="mt-4">Password</Label>
            <Input type="password" />
            <Label class="mt-4">Role</Label>
            <Select items={[
                {name:'admin',value:'admin'},
                {name:'user',value:'user'}
            ]} value="user"/>

            <Alert color="blue" class="mt-4 border-2">
                <P class="font-medium">
                    Do not forget to send the credentials to the new user!
                </P>
            </Alert>
                
            <Button class="w-2/3 self-center">Add user</Button>
        </form>
    </Modal>
    <Modal title="Export Data" bind:open={showExportDataModal} size="md">
        <P class="mb-4">Choose the format to export your data.</P>
        <div class="flex flex-row justify-center gap-4">
            <Button class="w-2/3 self-center">Export as CSV</Button>
            <Button class="w-2/3 self-center">Export as JSON</Button>
            <Button class="w-2/3 self-center">Export as XML</Button>
        </div>
    </Modal>
    <Modal title="Import Data" bind:open={showImportDataModal} size="md">
        <P class="mb-4">Choose a file to import.</P>
        <div class="flex flex-col justify-center gap-4">
            <Dropzone>
                <CloudArrowUpOutline class="w-10 h-10 mb-2 text-gray-500 dark:text-gray-400" />
                <P class="text-gray-500 dark:text-gray-400">
                    Drag and drop your file here or click to browse.
                </P>
            </Dropzone>
            <Button class="w-2/3 self-center mt-4">Import Data</Button>
        </div>
    </Modal>
</article>
