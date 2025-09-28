<script lang="ts">
    import {
        Button,
        ButtonGroup,
        Badge,
        Card,
        Dropdown,
        DropdownItem,
        DropdownDivider,
        Helper,
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
        Toggle,
        Tooltip,
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
    } from "flowbite-svelte-icons";

    interface TableProps {
        data: any[];
        title?: string;
        subtitle?: string;
        loading?: boolean;
        onInfo?: (rowData: any, rowIndex: number) => void;
        onEdit?: (rowData: any, rowIndex: number) => void;
        onDelete?: (rowData: any, rowIndex: number) => void;
        onRefresh?: () => void;
        onExport?: (data: any[]) => void;
        allowColumnToggle?: boolean;
        allowExport?: boolean;
        allowPrint?: boolean;
        pageSize?: number;
        showStats?: boolean;
    }

    let { 
        data, 
        title = "Data Table",
        subtitle = "",
        loading = false,
        onInfo,
        onEdit, 
        onDelete,
        onRefresh,
        onExport,
        allowColumnToggle = true,
        allowExport = true,
        allowPrint = true,
        pageSize = 10,
        showStats = true
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
    let deleteModalOpen = $state(false);
    let itemToDelete = $state<any>(null);
    let bulkAction = $state("");

    // Initialize column visibility
    $effect(() => {
        if (data.length > 0) {
            const keys = Object.keys(data[0]);
            const visibility: Record<string, boolean> = {};
            keys.forEach(key => {
                visibility[key] = true;
            });
            columnVisibility = visibility;
        }
    });

    // Get visible columns
    let visibleColumns = $derived(() => {
        if (data.length === 0) return [];
        return Object.keys(data[0]).filter(key => columnVisibility[key]);
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
                    .includes(searchQuery.toLowerCase())
            );
        }
        
        // Apply column filters
        Object.entries(columnFilters).forEach(([column, filter]) => {
            if (filter.trim()) {
                result = result.filter((item: any) =>
                    String(item[column])
                        .toLowerCase()
                        .includes(filter.toLowerCase())
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
    let stats = $derived(() => ({
        total: data.length,
        filtered: filteredData.length,
        selected: selectedRows.size,
        currentPage,
        totalPages,
        showing: paginatedData.length
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
        onInfo?.(rowData, rowIndex);
    }

    function handleEdit(rowData: any, rowIndex: number) {
        onEdit?.(rowData, rowIndex);
    }

    function confirmDelete(rowData: any, rowIndex: number) {
        itemToDelete = { data: rowData, index: rowIndex };
        deleteModalOpen = true;
    }

    function handleDelete() {
        if (itemToDelete) {
            onDelete?.(itemToDelete.data, itemToDelete.index);
            deleteModalOpen = false;
            itemToDelete = null;
        }
    }

    function handleBulkAction() {
        if (bulkAction && selectedRows.size > 0) {
            const selectedData = Array.from(selectedRows).map(index => filteredData[index]);
            console.log(`Bulk ${bulkAction}:`, selectedData);
            // Handle bulk actions here
        }
    }

    function exportData() {
        const exportData = selectedRows.size > 0 
            ? Array.from(selectedRows).map(index => filteredData[index])
            : filteredData;
        onExport?.(exportData);
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

<!-- Enhanced DataTable Header -->
    <div class="flex items-center justify-between mb-6">
        <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            {#if subtitle}
                <p class="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            {/if}
        </div>
        
        <div class="flex items-center space-x-2">
            {#if onRefresh}
                <Button color="alternative" size="sm" onclick={onRefresh} disabled={loading}>
                    <RefreshOutline class="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            {/if}
            
            {#if allowExport}
                <Button color="alternative" size="sm" onclick={exportData}>
                    <DownloadOutline class="w-4 h-4 mr-2" />
                    Export
                </Button>
            {/if}
            
            {#if allowPrint}
                <Button color="alternative" size="sm" onclick={printTable}>
                    <PrinterOutline class="w-4 h-4 mr-2" />
                    Print
                </Button>
            {/if}
            
            <Button color="alternative" size="sm" onclick={() => showColumnToggle = !showColumnToggle}>
                <EyeOutline class="w-4 h-4 mr-2" />
                Columns
            </Button>
        </div>
    </div>

    <!-- Stats Bar -->
    {#if showStats}
        <div class="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                <span>Total: <Badge color="blue">{data.length}</Badge></span>
                <span>Filtered: <Badge color="green">{filteredData.length}</Badge></span>
                {#if selectedRows.size > 0}
                    <span>Selected: <Badge color="purple">{selectedRows.size}</Badge></span>
                {/if}
            </div>
            <div class="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
            </div>
        </div>
    {/if}

    <!-- Search and Filters -->
    <div class="flex flex-col sm:flex-row gap-4 mb-4">
        <div class="flex-1">
            <Search bind:value={searchQuery} placeholder="Search all columns..." size="md" />
        </div>
        
        <div class="flex items-center space-x-2">
            <Button 
                color="alternative" 
                size="sm" 
                onclick={() => showFilters = !showFilters}
                class={showFilters ? "ring-2 ring-blue-500" : ""}
            >
                <FilterOutline class="w-4 h-4 mr-2" />
                Filters
            </Button>
            
            {#if searchQuery || Object.values(columnFilters).some(f => f)}
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
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Column Filters</h4>
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
        <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div class="flex items-center justify-between">
                <span class="text-sm text-blue-700 dark:text-blue-300">
                    {selectedRows.size} item{selectedRows.size > 1 ? 's' : ''} selected
                </span>
                <div class="flex items-center space-x-2">
                    <Select bind:value={bulkAction} size="sm" class="w-32">
                        <option value="">Bulk Action</option>
                        <option value="export">Export</option>
                        <option value="delete">Delete</option>
                    </Select>
                    <Button size="sm" onclick={handleBulkAction} disabled={!bulkAction}>
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
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No results found</h3>
            <p class="text-gray-500 dark:text-gray-400">
                {searchQuery ? 'Try adjusting your search terms' : 'No data available'}
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
                            checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                            onchange={(e) => e.target?.checked ? selectAllRows() : deselectAllRows()}
                        />
                    </TableHeadCell>
                    {#each visibleColumns() as column}
                        <TableHeadCell 
                            class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 select-none"
                            onclick={() => handleSort(column)}
                        >
                            <div class="flex items-center space-x-2">
                                <span class="capitalize">{column.replace(/([A-Z])/g, ' $1').trim()}</span>
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
                        <TableBodyRow class={selectedRows.has(globalIndex) ? "bg-blue-50 dark:bg-blue-900/20" : ""}>
                            <TableBodyCell>
                                <input 
                                    type="checkbox"
                                    class="rounded"
                                    checked={selectedRows.has(globalIndex)}
                                    onchange={() => toggleRowSelection(globalIndex)}
                                />
                            </TableBodyCell>
                            {#each visibleColumns() as column}
                                <TableBodyCell class="max-w-xs truncate" title={String(item[column])}>
                                    {#if typeof item[column] === 'boolean'}
                                        <Badge color={item[column] ? 'green' : 'red'}>
                                            {item[column] ? 'Yes' : 'No'}
                                        </Badge>
                                    {:else if typeof item[column] === 'number'}
                                        <span class="font-mono">{item[column].toLocaleString()}</span>
                                    {:else}
                                        {item[column]}
                                    {/if}
                                </TableBodyCell>
                            {/each}
                            <TableBodyCell>
                                <ButtonGroup size="sm">
                                    {#if onInfo}
                                        <Tooltip>
                                            <Button color="alternative" onclick={() => handleInfo(item, globalIndex)}>
                                                <InfoCircleOutline class="w-4 h-4" />
                                            </Button>
                                        </Tooltip>
                                    {/if}
                                    {#if onEdit}
                                        <Tooltip>
                                            <Button color="alternative" onclick={() => handleEdit(item, globalIndex)}>
                                                <PenOutline class="w-4 h-4" />
                                            </Button>
                                        </Tooltip>
                                    {/if}
                                    {#if onDelete}
                                        <Tooltip>
                                            <Button color="red" onclick={() => confirmDelete(item, globalIndex)}>
                                                <TrashBinOutline class="w-4 h-4" />
                                            </Button>
                                        </Tooltip>
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
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} results
                </div>
                <div class="flex items-center space-x-2">
                    <Button 
                        color="alternative" 
                        size="sm" 
                        disabled={currentPage === 1}
                        onclick={() => currentPage = Math.max(1, currentPage - 1)}
                    >
                        Previous
                    </Button>
                    
                    {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                        const start = Math.max(1, currentPage - 2);
                        return start + i;
                    }).filter(page => page <= totalPages) as page}
                        <Button 
                            color={page === currentPage ? "blue" : "alternative"}
                            size="sm"
                            onclick={() => currentPage = page}
                        >
                            {page}
                        </Button>
                    {/each}
                    
                    <Button 
                        color="alternative" 
                        size="sm" 
                        disabled={currentPage === totalPages}
                        onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
                    >
                        Next
                    </Button>
                </div>
            </div>
        {/if}
    {/if}

<!-- Column Visibility Toggle -->
{#if showColumnToggle}
    <Modal bind:open={showColumnToggle} title="Show/Hide Columns" autoclose>
        <div class="space-y-3">
            {#if data.length > 0}
                {#each Object.keys(data[0]) as column}
                    <div class="flex items-center">
                        <Toggle 
                            bind:checked={columnVisibility[column]}
                            onchange={() => toggleColumnVisibility(column)}
                        />
                        <span class="ml-3 capitalize">{column.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </div>
                {/each}
            {/if}
        </div>
    </Modal>
{/if}

<!-- Delete Confirmation Modal -->
<Modal bind:open={deleteModalOpen} title="Confirm Deletion" autoclose>
    <div class="text-center">
        <TrashBinOutline class="mx-auto mb-4 text-gray-400 w-12 h-12" />
        <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
            Are you sure you want to delete this item?
        </h3>
        <div class="flex justify-center space-x-4">
            <Button color="red" onclick={handleDelete}>Yes, delete</Button>
            <Button color="alternative" onclick={() => deleteModalOpen = false}>Cancel</Button>
        </div>
    </div>
</Modal>
