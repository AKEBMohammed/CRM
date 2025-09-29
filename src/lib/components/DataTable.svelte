<script lang="ts">
    import { enhance } from "$app/forms";
    import {
        Button,
        ButtonGroup,
        Badge,
        Card,
        Input,
        Label,
        Modal,
        P,
        Search,
        Select,
        Spinner,
        Table,
        TableBody,
        TableBodyCell,
        TableBodyRow,
        TableHead,
        TableHeadCell,
        Textarea,
        Toggle,
        Tooltip,
        Heading,
        Alert,
    } from "flowbite-svelte";
    import {
        InfoCircleOutline,
        PenOutline,
        TrashBinOutline,
        ChevronUpOutline,
        ChevronDownOutline,
        EyeOutline,
        EyeSlashOutline,
        FilterOutline,
        DownloadOutline,
        PrinterOutline,
        RefreshOutline,
        DotsHorizontalOutline,
        SearchOutline,
        ChevronRightOutline,
        ChevronLeftOutline,
    } from "flowbite-svelte-icons";

    interface TableProps {
        data: any[];
        title?: string;
        subtitle?: string;
        loading?: boolean;
        // Form actions for server-side operations
        editAction?: string; // Form action URL for edit
        deleteAction?: string; // Form action URL for delete
        addAction?: string; // Form action URL for add new item
        importAction?: string; // Form action URL for import
        exportAction?: string; // Form action URL for server-side export
        // Optional callbacks for custom handling
        onRefresh?: () => void;
        onExport?: (data: any[], format?: "csv" | "json" | "excel") => void;
        allowColumnToggle?: boolean;
        allowExport?: boolean;
        allowImport?: boolean;
        allowPrint?: boolean;
        allowAdd?: boolean;
        exportFormats?: ("csv" | "json" | "excel")[];
        pageSize?: number;
        showStats?: boolean;
    }

    let {
        data,
        title = "Data Table",
        subtitle = "",
        loading = false,
        editAction,
        deleteAction,
        addAction,
        importAction,
        exportAction,
        onRefresh,
        onExport,
        allowColumnToggle = true,
        allowExport = true,
        allowImport = true,
        allowPrint = true,
        allowAdd = true,
        exportFormats = ["csv", "json"],
        pageSize = 5,
        showStats = true,
    }: TableProps = $props();

    // State management
    let searchQuery = $state("");
    let sortColumn = $state("");
    let sortDirection: "asc" | "desc" = $state("asc");
    let currentPage = $state(1);
    let selectedRows = $state(new Set<number>());
    let columnVisibility = $state<Record<string, boolean>>({});
    let showColumnToggle = $state(false);
    let showFilters = $state(false);
    let columnFilters = $state<Record<string, string>>({});
    let bulkAction = $state("");

    // Action modal states
    let showInfoModal = $state(false);
    let showEditModal = $state(false);
    let showDeleteModal = $state(false);
    let showAddModal = $state(false);
    let showExportModal = $state(false);
    let showImportModal = $state(false);

    // Selected data for actions
    let selectedData = $state<any>(null);
    let selectedDataIndex = $state<number>(-1);

    // Dynamic edit form data - will be populated based on actual data structure
    let editFormData = $state<Record<string, any>>({});

    // Add form data - will be initialized with empty values based on data structure
    let addFormData = $state<Record<string, any>>({});

    // Export settings
    let selectedExportFormat = $state<"csv" | "json" | "excel">("csv");

    // Import settings
    let selectedFile = $state<File | null>(null);
    let importFormat = $state<"csv" | "json">("csv");

    // Initialize column visibility
    $effect(() => {
        if (data.length > 0) {
            const keys = Object.keys(data[0]);
            const visibility: Record<string, boolean> = {};
            keys.forEach((key) => {
                visibility[key] = true;
            });
            columnVisibility = visibility;

            // Initialize add form with empty values
            const emptyFormData: Record<string, any> = {};
            keys.forEach((key) => {
                if (key !== "id") {
                    const sampleValue = data[0][key];
                    if (typeof sampleValue === "boolean") {
                        emptyFormData[key] = false;
                    } else if (typeof sampleValue === "number") {
                        emptyFormData[key] = 0;
                    } else {
                        emptyFormData[key] = "";
                    }
                }
            });
            addFormData = emptyFormData;
        }
    });

    // Get visible columns
    let visibleColumns = $derived(() => {
        if (data.length === 0) return [];
        return Object.keys(data[0]).filter((key) => columnVisibility[key]);
    });

    // Filter and search data
    let filteredData = $derived.by(() => {
        let result = [...data];

        // Apply search
        if (searchQuery.trim()) {
            result = result.filter((item: any) =>
                Object.values(item)
                    .join(" ")
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
            );
        }

        // Apply column filters
        Object.entries(columnFilters).forEach(([column, filter]) => {
            if (filter.trim()) {
                result = result.filter((item: any) =>
                    String(item[column])
                        .toLowerCase()
                        .includes(filter.toLowerCase()),
                );
            }
        });

        // Apply sorting
        if (sortColumn) {
            result.sort((a, b) => {
                const aVal = a[sortColumn];
                const bVal = b[sortColumn];
                const direction = sortDirection === "asc" ? 1 : -1;

                if (typeof aVal === "number" && typeof bVal === "number") {
                    return (aVal - bVal) * direction;
                }

                return String(aVal).localeCompare(String(bVal)) * direction;
            });
        }

        return result;
    });

    // Pagination
    let totalPages = $derived(Math.ceil(filteredData.length / pageSize));
    let paginatedData = $derived(() => {
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        return filteredData.slice(start, end);
    });

    // Stats
    let stats = $derived.by(() => ({
        total: data.length,
        filtered: filteredData.length,
        selected: selectedRows.size,
        currentPage,
        totalPages,
        showing: paginatedData.length,
    }));

    // Functions
    function handleSort(column: string) {
        if (sortColumn === column) {
            sortDirection = sortDirection === "asc" ? "desc" : "asc";
        } else {
            sortColumn = column;
            sortDirection = "asc";
        }
    }

    function toggleRowSelection(index: number) {
        if (selectedRows.has(index)) {
            selectedRows.delete(index);
        } else {
            selectedRows.add(index);
        }
        selectedRows = new Set(selectedRows);
    }

    function selectAllRows() {
        const allIndices = filteredData.map((_, index) => index);
        selectedRows = new Set(allIndices);
    }

    function deselectAllRows() {
        selectedRows = new Set();
    }

    function toggleColumnVisibility(column: string) {
        columnVisibility[column] = !columnVisibility[column];
    }

    function handleInfo(rowData: any, rowIndex: number) {
        selectedData = rowData;
        selectedDataIndex = rowIndex;
        showInfoModal = true;
    }

    function handleEdit(rowData: any, rowIndex: number) {
        selectedData = rowData;
        selectedDataIndex = rowIndex;
        editFormData = { ...rowData }; // Pre-populate form with all data
        showEditModal = true;
    }

    function handleAdd() {
        // Reset form to initial empty values
        if (data.length > 0) {
            const keys = Object.keys(data[0]);
            const emptyFormData: Record<string, any> = {};
            keys.forEach((key) => {
                if (key !== "id") {
                    const sampleValue = data[0][key];
                    if (typeof sampleValue === "boolean") {
                        emptyFormData[key] = false;
                    } else if (typeof sampleValue === "number") {
                        emptyFormData[key] = 0;
                    } else {
                        emptyFormData[key] = "";
                    }
                }
            });
            addFormData = emptyFormData;
        }
        showAddModal = true;
    }

    function confirmDelete(rowData: any, rowIndex: number) {
        selectedData = rowData;
        selectedDataIndex = rowIndex;
        showDeleteModal = true;
    }

    // Handle edit form submission
    function handleEditSubmit(event: Event) {
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        // Add the row index to form data for server processing
        formData.append("rowIndex", selectedDataIndex.toString());

        // Close modal after submission
        showEditModal = false;
        selectedData = null;
        selectedDataIndex = -1;
    }

    // Handle add form submission
    function handleAddSubmit(event: Event) {
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        // Close modal after submission
        showAddModal = false;
    }

    // Handle delete form submission
    function handleDeleteSubmit(event: Event) {
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        // Add the row data to form for server processing
        formData.append("rowIndex", selectedDataIndex.toString());
        formData.append("userData", JSON.stringify(selectedData));

        // Close modal after submission
        showDeleteModal = false;
        selectedData = null;
        selectedDataIndex = -1;
    }

    function handleBulkAction() {
        if (bulkAction && selectedRows.size > 0) {
            const selectedData = Array.from(selectedRows).map(
                (index) => filteredData[index],
            );
            console.log(`Bulk ${bulkAction}:`, selectedData);
            // Handle bulk actions here
        }
    }

    function exportData() {
        const exportData =
            selectedRows.size > 0
                ? Array.from(selectedRows).map((index) => filteredData[index])
                : filteredData;

        if (onExport) {
            onExport(exportData, selectedExportFormat);
        } else {
            // Default export handling
            downloadData(exportData, selectedExportFormat);
        }
    }

    function downloadData(data: any[], format: "csv" | "json" | "excel") {
        const timestamp = new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/:/g, "-");
        const filename = `${title.toLowerCase().replace(/\s+/g, "_")}_${timestamp}`;

        let content: string;
        let mimeType: string;
        let extension: string;

        switch (format) {
            case "csv":
                content = convertToCSV(data);
                mimeType = "text/csv";
                extension = "csv";
                break;
            case "json":
                content = JSON.stringify(data, null, 2);
                mimeType = "application/json";
                extension = "json";
                break;
            case "excel":
                // For now, export as CSV (Excel-compatible)
                content = convertToCSV(data);
                mimeType = "text/csv";
                extension = "csv";
                break;
            default:
                return;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showExportModal = false;
    }

    function convertToCSV(data: any[]): string {
        if (data.length === 0) return "";

        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(",");

        const csvRows = data.map((row) =>
            headers
                .map((header) => {
                    const value = row[header];
                    // Escape commas and quotes in CSV
                    if (
                        typeof value === "string" &&
                        (value.includes(",") || value.includes('"'))
                    ) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                })
                .join(","),
        );

        return [csvHeaders, ...csvRows].join("\n");
    }

    function showExportOptions() {
        showExportModal = true;
    }

    function showImportOptions() {
        showImportModal = true;
    }

    function handleFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            selectedFile = input.files[0];

            // Auto-detect format based on file extension
            if (selectedFile.name.endsWith(".json")) {
                importFormat = "json";
            } else if (selectedFile.name.endsWith(".csv")) {
                importFormat = "csv";
            }
        }
    }

    function handleImportSubmit(event: Event) {
        showImportModal = false;
        selectedFile = null;
    }

        // Enhanced export function that can use either server-side or client-side
    function handleExportAction() {
        if ( exportAction) {
            // Use server-side export - will be handled by form submission
            // The filtered data will be passed via hidden form fields
            showExportModal = true;
        }
    }

    function printTable() {
        window.print();
    }

    function resetFilters() {
        searchQuery = "";
        columnFilters = {};
        sortColumn = "";
        currentPage = 1;
        selectedRows = new Set();
    }
</script>

<div class="flex items-center justify-between mb-6">
    <div>
        <Heading
            tag="h3"
            class="text-xl font-semibold text-gray-900 dark:text-white"
            >{title}</Heading
        >
        {#if subtitle}
            <P class="text-md text-gray-500 dark:text-gray-400">{subtitle}</P>
        {/if}
    </div>

    <div class="flex items-center space-x-2">
        {#if allowAdd && addAction}
            <Button color="primary" size="sm" onclick={handleAdd}>
                <svg
                    class="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4v16m8-8H4"
                    ></path>
                </svg>
                Add New
            </Button>
        {/if}

        {#if allowImport && importAction}
            <Button color="primary" size="sm" onclick={showImportOptions}>
                <svg
                    class="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    ></path>
                </svg>
                Import
            </Button>
        {/if}

        {#if onRefresh}
            <Button
                color="primary"
                size="sm"
                onclick={onRefresh}
                disabled={loading}
            >
                <RefreshOutline class="w-4 h-4 mr-2" />
                Refresh
            </Button>
        {/if}

        {#if allowExport}
            <Button color="primary" size="sm" onclick={handleExportAction}>
                <DownloadOutline class="w-4 h-4 mr-2" />
                Export
            </Button>
        {/if}

        {#if allowPrint}
            <Button color="primary" size="sm" onclick={printTable}>
                <PrinterOutline class="w-4 h-4 mr-2" />
                Print
            </Button>
        {/if}

        <Button
            color="primary"
            size="sm"
            onclick={() => (showColumnToggle = !showColumnToggle)}
        >
            <EyeOutline class="w-4 h-4 mr-2" />
            Columns
        </Button>
    </div>
</div>

<!-- Stats Bar -->
{#if showStats}
    <div
        class="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
    >
        <div
            class="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300"
        >
            <span>Total: <Badge color="blue">{stats.total}</Badge></span>
            <span>Filtered: <Badge color="green">{stats.filtered}</Badge></span>
            {#if stats.selected > 0}
                <span
                    >Selected: <Badge color="purple">{stats.selected}</Badge
                    ></span
                >
            {/if}
        </div>
        <div class="text-sm text-gray-500">
            Page {stats.currentPage} of {stats.totalPages}
        </div>
    </div>
{/if}

<!-- Search and Filters -->
<div class="flex flex-col sm:flex-row gap-4 mb-4">
    <div class="flex-1">
        <Search
            bind:value={searchQuery}
            placeholder="Search all columns..."
            size="md"
        />
    </div>

    <div class="flex items-center space-x-2">
        <Button
            color="alternative"
            size="sm"
            onclick={() => (showFilters = !showFilters)}
            class={showFilters ? "ring-2 ring-blue-500" : ""}
        >
            <FilterOutline class="w-4 h-4 mr-2" />
            Filters
        </Button>

        {#if searchQuery || Object.values(columnFilters).some((f) => f)}
            <Button color="alternative" size="sm" onclick={resetFilters}>
                <InfoCircleOutline class="w-4 h-4 mr-2" />
                Clear
            </Button>
        {/if}
    </div>
</div>

<!-- Column Filters -->
{#if showFilters}
    <div class="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Column Filters
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            {#each visibleColumns() as column}
                <div>
                    <Label class="text-xs">{column}</Label>
                    <Input
                        bind:value={columnFilters[column]}
                        placeholder="Filter {column}..."
                        size="sm"
                    />
                </div>
            {/each}
        </div>
    </div>
{/if}

<!-- Bulk Actions -->
{#if selectedRows.size > 0}
    <div
        class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
    >
        <div class="flex items-center justify-between">
            <span class="text-sm text-blue-700 dark:text-blue-300">
                {selectedRows.size} item{selectedRows.size > 1 ? "s" : ""} selected
            </span>
            <div class="flex items-center space-x-2">
                <Select bind:value={bulkAction} size="sm" class="w-32">
                    <option value="">Bulk Action</option>
                    <option value="export">Export</option>
                    <option value="delete">Delete</option>
                </Select>
                <Button
                    size="sm"
                    onclick={handleBulkAction}
                    disabled={!bulkAction}
                >
                    Apply
                </Button>
                <Button color="alternative" size="sm" onclick={deselectAllRows}>
                    Clear
                </Button>
            </div>
        </div>
    </div>
{/if}

<!-- Loading State -->
{#if loading}
    <div class="flex items-center justify-center py-12">
        <Spinner size="8" />
        <span class="ml-2 text-gray-600 dark:text-gray-300">Loading...</span>
    </div>
{:else if filteredData.length === 0}
    <div class="text-center py-12">
        <div class="text-gray-400 mb-2">
            <SearchOutline class="w-12 h-12 mx-auto" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No results found
        </h3>
        <p class="text-gray-500 dark:text-gray-400">
            {searchQuery
                ? "Try adjusting your search terms"
                : "No data available"}
        </p>
    </div>
{:else}
    <!-- Enhanced Table -->
    <div class="overflow-x-auto">
        <Table hoverable={true} class="min-w-full">
            <TableHead>
                <TableHeadCell class="w-12">
                    <input
                        type="checkbox"
                        class="rounded"
                        checked={selectedRows.size === filteredData.length &&
                            filteredData.length > 0}
                        onchange={(e) => {
                            const target = e.target as HTMLInputElement;
                            target.checked
                                ? selectAllRows()
                                : deselectAllRows();
                        }}
                    />
                </TableHeadCell>
                {#each visibleColumns() as column}
                    <TableHeadCell
                        class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 select-none"
                        onclick={() => handleSort(column)}
                    >
                        <div class="flex items-center space-x-2">
                            <span class="capitalize"
                                >{column
                                    .replace(/([A-Z])/g, " $1")
                                    .trim()}</span
                            >
                            {#if sortColumn === column}
                                {#if sortDirection === "asc"}
                                    <ChevronUpOutline class="w-4 h-4" />
                                {:else}
                                    <ChevronDownOutline class="w-4 h-4" />
                                {/if}
                            {/if}
                        </div>
                    </TableHeadCell>
                {/each}
                <TableHeadCell>Actions</TableHeadCell>
            </TableHead>
            <TableBody>
                {#each paginatedData() as item, index}
                    {@const globalIndex = (currentPage - 1) * pageSize + index}
                    <TableBodyRow
                        class={selectedRows.has(globalIndex)
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : ""}
                    >
                        <TableBodyCell>
                            <input
                                type="checkbox"
                                class="rounded"
                                checked={selectedRows.has(globalIndex)}
                                onchange={() => toggleRowSelection(globalIndex)}
                            />
                        </TableBodyCell>
                        {#each visibleColumns() as column}
                            <TableBodyCell
                                class="max-w-xs truncate"
                                title={String(item[column])}
                            >
                                {#if typeof item[column] === "boolean"}
                                    <Badge
                                        color={item[column] ? "green" : "red"}
                                    >
                                        {item[column] ? "Yes" : "No"}
                                    </Badge>
                                {:else if typeof item[column] === "number"}
                                    <span class="font-mono"
                                        >{item[column].toLocaleString()}</span
                                    >
                                {:else}
                                    {item[column]}
                                {/if}
                            </TableBodyCell>
                        {/each}
                        <TableBodyCell>
                            <ButtonGroup>
                                <!-- Always show info button -->
                                <Button
                                    color="alternative"
                                    onclick={() =>
                                        handleInfo(item, globalIndex)}
                                >
                                    <InfoCircleOutline class="w-4 h-4" />
                                </Button>

                                <!-- Show edit button if edit action provided -->
                                {#if editAction}
                                    <Button
                                        color="alternative"
                                        onclick={() =>
                                            handleEdit(item, globalIndex)}
                                    >
                                        <PenOutline class="w-4 h-4" />
                                    </Button>
                                {/if}

                                <!-- Show delete button if delete action provided -->
                                {#if deleteAction}
                                    <Button
                                        color="red"
                                        onclick={() =>
                                            confirmDelete(item, globalIndex)}
                                    >
                                        <TrashBinOutline class="w-4 h-4" />
                                    </Button>
                                {/if}
                            </ButtonGroup>
                        </TableBodyCell>
                    </TableBodyRow>
                {/each}
            </TableBody>
        </Table>
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
        <div class="flex items-center justify-between mt-6">
            <div class="text-sm text-gray-500 dark:text-gray-400">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(
                    currentPage * pageSize,
                    filteredData.length,
                )} of {filteredData.length} results
            </div>
            <ButtonGroup>
                <Button
                    color="alternative"
                    size="sm"
                    disabled={currentPage === 1}
                    onclick={() => (currentPage = Math.max(1, currentPage - 1))}
                >
                    <ChevronLeftOutline class="h-6 w-6" />
                </Button>

                {#each Array.from( { length: Math.min(5, totalPages) }, (_, i) => {
                        const start = Math.max(1, currentPage - 2);
                        return start + i;
                    }, ).filter((page) => page <= totalPages) as page}
                    <Button
                        color={page === currentPage ? "primary" : "alternative"}
                        size="sm"
                        onclick={() => (currentPage = page)}
                    >
                        {page}
                    </Button>
                {/each}

                <Button
                    color="alternative"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onclick={() =>
                        (currentPage = Math.min(totalPages, currentPage + 1))}
                >
                    <ChevronRightOutline class="h-6 w-6" />
                </Button>
            </ButtonGroup>
        </div>
    {/if}
{/if}

<!-- Column Visibility Toggle -->
<Modal bind:open={showColumnToggle} title="Show/Hide Columns" autoclose>
    <div class="space-y-3">
        {#if data.length > 0}
            {#each Object.keys(data[0]) as column}
                <div class="flex items-center">
                    <Toggle
                        bind:checked={columnVisibility[column]}
                        onchange={() => toggleColumnVisibility(column)}
                    />
                    <span class="ml-3 capitalize"
                        >{column.replace(/([A-Z])/g, " $1").trim()}</span
                    >
                </div>
            {/each}
        {/if}
    </div>
</Modal>
<!-- INFO MODAL -->
<Modal
    bind:open={showInfoModal}
    title="Item Information"
    autoclose
    class="min-w-full md:min-w-[500px]"
>
    {#if selectedData}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each Object.entries(selectedData) as [key, value]}
                {#if key !== "id"}
                    <div
                        class={typeof value === "string" && value.length > 100
                            ? "md:col-span-2"
                            : ""}
                    >
                        <Label class="mb-2 capitalize">
                            {key
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (str) => str.toUpperCase())}
                        </Label>
                        {#if typeof value === "boolean"}
                            <Badge color={value ? "green" : "red"}>
                                {value ? "Yes" : "No"}
                            </Badge>
                        {:else if typeof value === "number"}
                            <p class="font-mono">{value.toLocaleString()}</p>
                        {:else if typeof value === "string" && value.length > 100}
                            <Textarea
                                readonly
                                class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                                >{value}</Textarea
                            >
                        {:else}
                            <P>{value}</P>
                        {/if}
                    </div>
                {/if}
            {/each}
        </div>
    {/if}
</Modal>

<!-- ADD NEW ITEM MODAL -->
<Modal
    bind:open={showAddModal}
    title="Add New Item"
    autoclose
    class="min-w-full md:min-w-[600px]"
>
    {#if addAction && Object.keys(addFormData).length > 0}
        <form
            use:enhance
            action={addAction}
            method="POST"
            onsubmit={handleAddSubmit}
            class="space-y-4"
        >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#each Object.entries(addFormData) as [key, value]}
                    <div
                        class={typeof value === "string" && value.length > 100
                            ? "md:col-span-2"
                            : ""}
                    >
                        <Label for="add-{key}" class="mb-2 capitalize">
                            {key
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (str) => str.toUpperCase())}
                        </Label>

                        {#if key === "role" || key === "status" || key === "type"}
                            <!-- Dropdown for role/status/type fields -->
                            <Select
                                id="add-{key}"
                                name={key}
                                bind:value={addFormData[key]}
                                required
                            >
                                <option value="">Select {key}</option>
                                {#if key === "role"}
                                    <option value="admin">Admin</option>
                                    <option value="user">User</option>
                                {:else if key === "status"}
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="pending">Pending</option>
                                    <option value="suspended">Suspended</option>
                                {:else if key === "type"}
                                    <option value="premium">Premium</option>
                                    <option value="standard">Standard</option>
                                    <option value="basic">Basic</option>
                                    <option value="trial">Trial</option>
                                {/if}
                            </Select>
                        {:else if typeof value === "boolean"}
                            <!-- Toggle for boolean fields -->
                            <div class="flex items-center space-x-2">
                                <Toggle
                                    bind:checked={addFormData[key]}
                                    name={key}
                                    id="add-{key}"
                                />
                                <span
                                    class="text-sm text-gray-600 dark:text-gray-400"
                                >
                                    {addFormData[key] ? "Enabled" : "Disabled"}
                                </span>
                            </div>
                        {:else if typeof value === "number"}
                            <!-- Number input -->
                            <Input
                                type="number"
                                id="add-{key}"
                                name={key}
                                bind:value={addFormData[key]}
                                placeholder="Enter {key}..."
                                required
                            />
                        {:else if key.toLowerCase().includes("email")}
                            <!-- Email input -->
                            <Input
                                type="email"
                                id="add-{key}"
                                name={key}
                                bind:value={addFormData[key]}
                                placeholder="Enter email address..."
                                required
                            />
                        {:else if key.toLowerCase().includes("phone")}
                            <!-- Phone input -->
                            <Input
                                type="tel"
                                id="add-{key}"
                                name={key}
                                bind:value={addFormData[key]}
                                placeholder="Enter phone number..."
                            />
                        {:else if key.toLowerCase().includes("password")}
                            <!-- Password input -->
                            <Input
                                type="password"
                                id="add-{key}"
                                name={key}
                                bind:value={addFormData[key]}
                                placeholder="Enter password..."
                                required
                            />
                        {:else if key.toLowerCase().includes("url") || key
                                .toLowerCase()
                                .includes("website")}
                            <!-- URL input -->
                            <Input
                                type="url"
                                id="add-{key}"
                                name={key}
                                bind:value={addFormData[key]}
                                placeholder="Enter URL..."
                            />
                        {:else if key.toLowerCase().includes("date")}
                            <!-- Date input -->
                            <Input
                                type="date"
                                id="add-{key}"
                                name={key}
                                bind:value={addFormData[key]}
                            />
                        {:else if typeof value === "string" && value.length > 100}
                            <!-- Textarea for long text -->
                            <Textarea
                                id="add-{key}"
                                name={key}
                                bind:value={addFormData[key]}
                                placeholder="Enter {key}..."
                            />
                        {:else}
                            <!-- Default text input -->
                            <Input
                                type="text"
                                id="add-{key}"
                                name={key}
                                bind:value={addFormData[key]}
                                placeholder="Enter {key}..."
                                required={key === "fullname" ||
                                    key === "name" ||
                                    key === "title"}
                            />
                        {/if}
                    </div>
                {/each}
            </div>

            <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div
                    class="flex items-center space-x-2 text-green-700 dark:text-green-300"
                >
                    <InfoCircleOutline class="w-5 h-5" />
                    <span class="text-sm">
                        Creating a new item with the specified information
                    </span>
                </div>
            </div>

            <div class="flex justify-end space-x-2 pt-4">
                <Button
                    color="alternative"
                    onclick={() => (showAddModal = false)}
                    type="button"
                >
                    Cancel
                </Button>
                <Button color="green" type="submit">
                    <svg
                        class="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 4v16m8-8H4"
                        ></path>
                    </svg>
                    Add Item
                </Button>
            </div>
        </form>
    {/if}
</Modal>

<!-- ✏️ DYNAMIC EDIT MODAL -->
<Modal
    bind:open={showEditModal}
    title="Edit Item"
    autoclose
    class="min-w-full md:min-w-[600px]"
>
    {#if selectedData && editAction}
        <form
            use:enhance
            action={editAction}
            method="POST"
            onsubmit={handleEditSubmit}
            class="space-y-4"
        >
            <!-- Hidden field for row identification -->
            <input
                type="hidden"
                name="id"
                value={selectedData.id || selectedDataIndex}
            />

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#each Object.entries(editFormData) as [key, value]}
                    {#if key !== "id"}
                        <div
                            class={typeof value === "string" &&
                            value.length > 100
                                ? "md:col-span-2"
                                : ""}
                        >
                            <Label for="edit-{key}" class="mb-2 capitalize">
                                {key
                                    .replace(/([A-Z])/g, " $1")
                                    .replace(/^./, (str) => str.toUpperCase())}
                            </Label>

                            {#if key === "role" || key === "status" || key === "type"}
                                <!-- Dropdown for role/status/type fields -->
                                <Select
                                    id="edit-{key}"
                                    name={key}
                                    bind:value={editFormData[key]}
                                >
                                    <option value="">Select {key}</option>
                                    {#if key === "role"}
                                        <option value="admin">Admin</option>
                                        <option value="user">User</option>
                                    {:else if key === "status"}
                                        <option value="active">Active</option>
                                        <option value="inactive"
                                            >Inactive</option
                                        >
                                        <option value="pending">Pending</option>
                                        <option value="suspended"
                                            >Suspended</option
                                        >
                                    {:else if key === "type"}
                                        <option value="premium">Premium</option>
                                        <option value="standard"
                                            >Standard</option
                                        >
                                        <option value="basic">Basic</option>
                                        <option value="trial">Trial</option>
                                    {/if}
                                </Select>
                            {:else if typeof value === "boolean"}
                                <!-- Toggle for boolean fields -->
                                <div class="flex items-center space-x-2">
                                    <Toggle
                                        bind:checked={editFormData[key]}
                                        name={key}
                                        id="edit-{key}"
                                    />
                                    <span
                                        class="text-sm text-gray-600 dark:text-gray-400"
                                    >
                                        {editFormData[key]
                                            ? "Enabled"
                                            : "Disabled"}
                                    </span>
                                </div>
                            {:else if typeof value === "number"}
                                <!-- Number input -->
                                <Input
                                    type="number"
                                    id="edit-{key}"
                                    name={key}
                                    bind:value={editFormData[key]}
                                    placeholder="Enter {key}..."
                                />
                            {:else if key.toLowerCase().includes("email")}
                                <!-- Email input -->
                                <Input
                                    type="email"
                                    id="edit-{key}"
                                    name={key}
                                    bind:value={editFormData[key]}
                                    placeholder="Enter email address..."
                                />
                            {:else if key.toLowerCase().includes("phone")}
                                <!-- Phone input -->
                                <Input
                                    type="tel"
                                    id="edit-{key}"
                                    name={key}
                                    bind:value={editFormData[key]}
                                    placeholder="Enter phone number..."
                                />
                            {:else if key.toLowerCase().includes("password")}
                                <!-- Password input -->
                                <Input
                                    type="password"
                                    id="edit-{key}"
                                    name={key}
                                    bind:value={editFormData[key]}
                                    placeholder="Enter password..."
                                />
                            {:else if key.toLowerCase().includes("url") || key
                                    .toLowerCase()
                                    .includes("website")}
                                <!-- URL input -->
                                <Input
                                    type="url"
                                    id="edit-{key}"
                                    name={key}
                                    bind:value={editFormData[key]}
                                    placeholder="Enter URL..."
                                />
                            {:else if key.toLowerCase().includes("date")}
                                <!-- Date input -->
                                <Input
                                    type="date"
                                    id="edit-{key}"
                                    name={key}
                                    bind:value={editFormData[key]}
                                />
                            {:else if typeof value === "string" && value.length > 100}
                                <!-- Textarea for long text -->
                                <Textarea
                                    id="edit-{key}"
                                    name={key}
                                    bind:value={editFormData[key]}
                                    placeholder="Enter {key}..."
                                />
                            {:else}
                                <!-- Default text input -->
                                <Input
                                    type="text"
                                    id="edit-{key}"
                                    name={key}
                                    bind:value={editFormData[key]}
                                    placeholder="Enter {key}..."
                                />
                            {/if}
                        </div>
                    {/if}
                {/each}
            </div>

            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div
                    class="flex items-center space-x-2 text-blue-700 dark:text-blue-300"
                >
                    <InfoCircleOutline class="w-5 h-5" />
                    <span class="text-sm">
                        You are editing item at index #{selectedDataIndex}
                    </span>
                </div>
            </div>

            <div class="flex justify-end space-x-2 pt-4">
                <Button
                    color="alternative"
                    onclick={() => (showEditModal = false)}
                    type="button"
                >
                    Cancel
                </Button>
                <Button color="blue" type="submit">
                    <PenOutline class="w-4 h-4 mr-2" />
                    Update Item
                </Button>
            </div>
        </form>
    {/if}
</Modal>

<!-- DELETE MODAL -->
<Modal bind:open={showDeleteModal} title="Confirm Deletion" autoclose>
    {#if selectedData && deleteAction}
        <div class="w-full p-2 bg-red-100 dark:bg-red-900/20 flex">
            <TrashBinOutline class="w-8 h-8 m-4 text-red-500" />
            <div>
                <h3
                    class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                >
                    Delete User
                </h3>
                <p class="text-gray-600 dark:text-gray-300">
                    Are you sure you want to delete the following user?
                </p>
            </div>
        </div>

        <div class="text-left space-y-2">
            {#each Object.entries(selectedData) as [key, value]}
                <P>{key}: {value}</P>
            {/each}
        </div>

        <Alert color="red">
            {#snippet icon()}
                <InfoCircleOutline class="w-8 h-8" />
            {/snippet}
            <span class="font-medium">Warning!</span>
            This action cannot be undone. The user will be permanently deleted from
            the system.
        </Alert>
        <form
            use:enhance
            action={deleteAction}
            method="POST"
            onsubmit={handleDeleteSubmit}
            class="flex justify-center space-x-4 pt-4"
        >
            <!-- Hidden fields to identify what to delete -->
            <input type="hidden" name="id" value={selectedData.id} />
            <input
                type="hidden"
                name="fullname"
                value={selectedData.fullname}
            />
            <input type="hidden" name="email" value={selectedData.email} />

            <Button
                color="alternative"
                onclick={() => (showDeleteModal = false)}
                type="button"
            >
                Cancel
            </Button>
            <Button color="red" type="submit">
                <TrashBinOutline class="w-4 h-4 mr-2" />
                Yes, Delete User
            </Button>
        </form>
    {/if}
</Modal>

<!-- IMPORT DATA MODAL -->
<Modal
    bind:open={showImportModal}
    title="Import Data"
    autoclose
    class="min-w-full md:min-w-[500px]"
>
    {#if importAction}
        <form
            use:enhance
            action={importAction}
            method="POST"
            enctype="multipart/form-data"
            onsubmit={handleImportSubmit}
            class="space-y-4"
        >
            <Label class="mb-2">Select File to Import</Label>
            <Input
                type="file"
                name="file"
                accept=".csv,.json"
                onchange={handleFileSelect}
                class="w-full text-md text-gray-500"
                required
            />
            <P class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Supported formats: CSV, JSON (max 10MB)
            </P>

            {#if selectedFile}
                <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div
                        class="flex items-center space-x-2 text-green-700 dark:text-green-300"
                    >
                        <svg
                            class="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            ></path>
                        </svg>
                        <div class="text-sm">
                            <p class="font-medium">File Selected:</p>
                            <p>
                                {selectedFile.name} ({(
                                    selectedFile.size / 1024
                                ).toFixed(1)} KB)
                            </p>
                            <p>Format: {importFormat.toUpperCase()}</p>
                        </div>
                    </div>
                </div>
            {/if}

            <div
                class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-center space-x-2 text-blue-700 dark:text-blue-300"
            >
                <InfoCircleOutline class="w-5 h-5" />
                <div class="text-sm">
                    <p class="font-medium mb-2">Import Guidelines:</p>
                    <ul class="space-y-1 text-xs">
                        <li>
                            • <strong>CSV Format:</strong> First row should contain
                            column headers
                        </li>
                        <li>
                            • <strong>JSON Format:</strong> Should be an array of
                            objects
                        </li>
                        <li>
                            • <strong>Batch Processing:</strong> Large files are
                            processed in batches
                        </li>
                    </ul>
                </div>
            </div>

            <div class="flex justify-end space-x-2 pt-4">
                <Button
                    color="alternative"
                    onclick={() => {
                        showImportModal = false;
                        selectedFile = null;
                    }}
                    type="button"
                >
                    Cancel
                </Button>
                <Button color="primary" type="submit" disabled={!selectedFile}>
                    <svg
                        class="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                        ></path>
                    </svg>
                    Import Data
                </Button>
            </div>
        </form>
    {/if}
</Modal>

<!-- EXPORT OPTIONS MODAL -->
<Modal
    bind:open={showExportModal}
    title="Export Data"
    autoclose
    class="min-w-full md:min-w-[400px]"
>
    <div class="space-y-4">
        {#if exportAction}
            <!-- Server-side Export Form -->
            <form
                use:enhance
                action={exportAction}
                method="POST"
                class="space-y-4"
            >
                <!-- Hidden fields to pass current filters and search to server -->
                <input type="hidden" name="searchQuery" value={searchQuery} />
                <input type="hidden" name="columnFilters" value={JSON.stringify(columnFilters)} />
                <input type="hidden" name="sortColumn" value={sortColumn} />
                <input type="hidden" name="sortDirection" value={sortDirection} />
                <input type="hidden" name="filteredData" value={JSON.stringify(filteredData)} />
                
                <div>
                    <Label class="mb-2">Export Format</Label>
                    <Select
                        name="format"
                        bind:value={selectedExportFormat}
                        class="w-full"
                    >
                        {#each exportFormats as format}
                            <option value={format}
                                >{format.toUpperCase()}</option
                            >
                        {/each}
                    </Select>
                </div>

                <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div
                        class="flex items-center space-x-2 text-blue-700 dark:text-blue-300"
                    >
                        <InfoCircleOutline class="w-5 h-5" />
                        <div class="text-sm">
                            <p class="font-medium mb-1">
                                Server Export Details:
                            </p>
                            <ul class="space-y-1">
                                <li>• Total records: {stats.total}</li>
                                <li>• Filtered records: {stats.filtered}</li>
                                <li>
                                    • Will export {stats.filtered} filtered records (current view)
                                </li>
                                <li>
                                    • Search and column filters will be applied
                                </li>
                                <li>
                                    • File will be generated on server and made
                                    available for download
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div
                        class="flex items-center space-x-2 text-green-700 dark:text-green-300"
                    >
                        <svg
                            class="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            ></path>
                        </svg>
                        <div class="text-sm">
                            <p class="font-medium">
                                Filtered Data Export:
                            </p>
                            <ul class="text-xs space-y-1 mt-1">
                                <li>• Only exports currently visible/filtered data</li>
                                <li>• Respects all search and column filters</li>
                                <li>• Maintains current sort order</li>
                                <li>• Includes server-side filtering and permissions</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-2 pt-4">
                    <Button
                        color="alternative"
                        onclick={() => (showExportModal = false)}
                        type="button"
                    >
                        Cancel
                    </Button>
                    <Button color="primary" type="submit">
                        <DownloadOutline class="w-4 h-4 mr-2" />
                        Generate & Download
                    </Button>
                </div>
            </form>
        {/if}
    </div>
</Modal>
