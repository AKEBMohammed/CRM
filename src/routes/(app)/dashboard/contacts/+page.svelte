<script lang="ts">
    import { enhance } from "$app/forms";
    import DataTable from "$lib/components/DataTable.svelte";
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

    <DataTable
        data={data.contacts || []}
        title="Contacts"
        subtitle="Manage your contacts here."
        onDelete={ (data,index) => {
            if (!confirm(`Are you sure you want to delete contact ${data[index].first_name} ${data[index].last_name}?`)) {
                return false;
            }
            return true;
        }}
        onEdit={
            (data, index) => `/dashboard/contacts/${data[index].id}/edit`
        }
        onInfo={
            (data, index) => `/dashboard/contacts/${data[index].id}`
        }
    />
</article>
