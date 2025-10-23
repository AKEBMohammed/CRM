<script lang="ts">
    import { enhance } from "$app/forms";
    import DataTable from "$lib/components/DataTable.svelte";
    import {
        Banner,
        Breadcrumb,
        BreadcrumbItem,
        Button,
        P,
    } from "flowbite-svelte";
    import { DownloadOutline, HomeSolid, UserSolid } from "flowbite-svelte-icons";

    let { data, form } = $props();

    function handleRefresh() {
        // Handle refresh action (e.g., re-fetch data)
        console.log("Refresh action triggered");
        window.location.reload();
    }

    function handleExport(exportData: any[]) {
        // Handle export action (e.g., trigger data export)
        console.log("Export action triggered", exportData);

        // Convert data to CSV
        const headers = Object.keys(exportData[0] || {});
        const csvContent = [
            headers.join(","), // Header row
            ...exportData.map((row) =>
                headers.map((header) => `"${row[header]}"`).join(","),
            ),
        ].join("\n");

        // Create and trigger download
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "users_export.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
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
        data={data.profiles.map((profile:any) => ({
            id: profile.profile_id,
            fullname: profile.fullname,
            email: profile.email,
            phone: profile.phone,
            role: profile.role,
        })) || []}
        title="User Management"
        subtitle="Manage your application users and their permissions"
        addAction="?/add"
        editAction="?/edit"
        deleteAction="?/delete"
        exportAction="?/export"
        importAction="?/import"
        pageSize={5}
        showStats={true}
        allowColumnToggle={true}
    />
</article>
