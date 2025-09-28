<script lang="ts">
    import {
        Button,
        ButtonGroup,
        Search,
        Table,
        TableBody,
        TableBodyCell,
        TableBodyRow,
        TableHead,
        TableHeadCell,
    } from "flowbite-svelte";
    import {
        InfoCircleOutline,
        PenOutline,
        TrashBinOutline,
    } from "flowbite-svelte-icons";

    let { data } = $props();

    let searchQuery = $state("");

    let filteredData = $derived.by(() =>
        data.filter((item: any) =>
            Object.values(item)
                .join(" ")
                .toLowerCase()
                .includes(searchQuery.toLowerCase()),
        ),
    );
</script>

{#snippet row(d: any)}
    <TableBodyRow>
        {#each Object.keys(d) as key}
            <TableBodyCell>
                {d[key]}
            </TableBodyCell>
        {/each}
        <TableBodyCell>
            <ButtonGroup>
                <Button>
                    <InfoCircleOutline />
                </Button>
                <Button>
                    <PenOutline />
                </Button>
                <Button color="red">
                    <TrashBinOutline />
                </Button>
            </ButtonGroup>
        </TableBodyCell>
    </TableBodyRow>
{/snippet}
<div class="w-full h-full p-2 space-y-4">
    <Search bind:value={searchQuery} />
    <Table>
        <TableHead>
            {#each Object.keys(filteredData[0]) as key}
                <TableHeadCell>{key}</TableHeadCell>
            {/each}
            <TableHeadCell>actions</TableHeadCell>
        </TableHead>
        <TableBody>
            {#each filteredData as item}
                {@render row(item)}
            {/each}
        </TableBody>
    </Table>
</div>
