<script lang="ts">
    import { enhance } from "$app/forms";
    import { Table } from "@flowbite-svelte-plugins/datatable";
    import {
        Button,
        Heading,
        Input,
        Label,
        Modal,
        P,
        Select,
        Alert,
        Banner,
        Dropzone,
        Listgroup,
    } from "flowbite-svelte";
    import {
        CloudArrowUpOutline,
        DownloadOutline,
        FileExportOutline,
        FileImportOutline,
        PlusOutline,
    } from "flowbite-svelte-icons";

    let { data, form } = $props();
    let showAddUserModal = $state(false);
    let showExportDataModal = $state(false);
    let showImportDataModal = $state(false);

    // Close modals on successful operations
    $effect(() => {
        if (form?.success) {
            showAddUserModal = false;
            showImportDataModal = false;
            showExportDataModal = false;
        }
    });
</script>

<article class="w-full h-full p-6">
    {#if form?.error}
        <Banner color="red" class="mb-4">
            <P class="font-medium text-red-800">{form.error}</P>
        </Banner>
    {/if}

    {#if form?.success}
        <Banner color="green" class="mb-4">
            <P class="font-medium text-green-800">{form.success}</P>
            {#if form?.downloadUrl}
                <div class="mt-2">
                    <Button
                        href={form.downloadUrl}
                        target="_blank"
                        download={form.filename || "export.csv"}
                        color="green"
                        size="sm"
                        class="inline-flex items-center"
                    >
                        <DownloadOutline class="w-6 h-6 " />
                        Download File
                    </Button>
                </div>
            {/if}
        </Banner>
    {/if}
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

    <Table
        items={data.users}
        
    />

    <Modal title="Add User" bind:open={showAddUserModal} size="md">
        <P class="mb-4">Fill in the details to add a new user.</P>
        <form
            use:enhance
            action="?/add"
            method="post"
            class="flex flex-col justify-center gap-2"
        >
            <Label>Full name</Label>
            <Input name="fullname" type="text" required />
            <Label class="mt-4">Email</Label>
            <Input name="email" type="email" required />
            <Label class="mt-4">Password</Label>
            <Input name="password" type="password" required />
            <Label class="mt-4">Role</Label>
            <Select
                name="role"
                items={[
                    { name: "admin", value: "admin" },
                    { name: "user", value: "user" },
                ]}
                value="user"
            />

            <Alert color="blue" class="mt-4 border-2">
                <P class="font-medium text-blue-800">
                    Do not forget to send the credentials to the new user!
                </P>
            </Alert>

            <Button type="submit" class="w-2/3 self-center">Add user</Button>
        </form>
    </Modal>

    <Modal title="Export Data" bind:open={showExportDataModal} size="md">
        <P class="mb-4">Choose the format to export your data.</P>
        <form
            use:enhance
            action="?/export"
            method="POST"
            class="flex flex-col justify-center gap-4"
        >
            <Label>Choose export file format :</Label>
            <Select
                name="format"
                items={[
                    { name: "CSV", value: "csv" },
                    { name: "JSON", value: "json" },
                    { name: "XML", value: "xml" },
                ]}
                value="csv"
            />

            <Button type="submit" class="w-2/3 self-center">Export</Button>
        </form>
    </Modal>

    <Modal title="Import Data" bind:open={showImportDataModal} size="md">
        <P class="mb-4">Choose a file to import.</P>
        <form
            use:enhance
            action="?/import"
            method="POST"
            enctype="multipart/form-data"
            class="flex flex-col justify-center gap-4"
        >
            <Label for="file-upload">Upload File</Label>
            <Dropzone
                id="file-upload"
                name="file"
                type="file"
                accept=".json,.csv"
                required
            >
                <CloudArrowUpOutline class="w-10 h-10 mb-3 text-gray-400" />
            </Dropzone>
            <P class="text-md text-gray-500 dark:text-gray-400">
                Supported formats: JSON, CSV
            </P>
            <Button type="submit" class="w-2/3 self-center mt-4"
                >Import Data</Button
            >
        </form>
    </Modal>
</article>
