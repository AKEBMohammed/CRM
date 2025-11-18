<script lang="ts">
    import { enhance } from "$app/forms";
    import {
        Banner,
        Button,
        Card,
        Heading,
        Input,
        Label,
        Listgroup,
        ListgroupItem,
        Modal,
        P,
        Radio,
        Select,
        Textarea,
    } from "flowbite-svelte";
    import { PlusOutline } from "flowbite-svelte-icons";

    let { data, form } = $props();

    let openCreateDealModal = $state(false);
    let deal_probability_value = $state(50);
</script>

<article class="h-full flex flex-col gap-2 p-2">
    {#if form?.error}
        <Banner color="red" class="mb-4">
            <P class="font-medium text-red-800">{form.error}</P>
        </Banner>
    {/if}

    {#if form?.success}
        <Banner color="green" class="mb-4">
            <P class="font-medium text-green-800">{form.success}</P>
        </Banner>
    {/if}
    <div class="flex items-center justify-between mb-2">
        <div>
            <Heading tag="h1" class="text-2xl font-bold">Deals</Heading>
            <P class="text-gray-500 dark:text-gray-400"
                >Manage your deals here.</P
            >
        </div>

        <div class="flex items-center space-x-2">
            <Button
                onclick={() => (openCreateDealModal = true)}
                color="primary"
                size="sm"
            >
                <PlusOutline class="mr-2" />Add New Deal
            </Button>
        </div>
    </div>
    <div class="grid grid-cols-4 gap-2">
        {#if data.deals.length === 0}
            <div
                class="col-span-4 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg"
            >
                <Heading tag="h4" class="text-lg font-semibold text-center">
                    No Deals Found
                </Heading>
                <P class="text-gray-500 dark:text-gray-400">
                    No deals found. Click "Add New Deal" to create one.
                </P>
            </div>
        {:else}
            {#each data.deals as deal}
                <Card
                    class="p-6 hover:shadow-lg transition-shadow duration-200"
                    href="/dashboard/deals/{deal.deal_id}"
                >
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-3">
                                <Heading
                                    tag="h3"
                                    class="text-lg font-semibold text-gray-900 dark:text-white"
                                >
                                    {deal.title}
                                </Heading>
                                <span
                                    class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                >
                                    {deal.stage}
                                </span>
                            </div>

                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <P
                                        class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                                        >Value</P
                                    >
                                    <P
                                        class="text-lg font-bold text-green-600 dark:text-green-400"
                                        >${deal.value}</P
                                    >
                                </div>
                                <div>
                                    <P
                                        class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                                        >Probability</P
                                    >
                                    <P class="text-sm font-medium"
                                        >{deal.probability}%</P
                                    >
                                </div>
                            </div>

                            <div class="space-y-2">
                                <div class="flex items-center gap-2">
                                    <span
                                        class="w-2 h-2 bg-blue-500 rounded-full"
                                    ></span>
                                    <P
                                        class="text-sm text-gray-600 dark:text-gray-300"
                                    >
                                        <span class="font-medium">Contact:</span
                                        >
                                        {data.contacts?.find(
                                            (c) =>
                                                c.contact_id ===
                                                deal.contact_id,
                                        )?.fullname || "N/A"}
                                    </P>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span
                                        class="w-2 h-2 bg-purple-500 rounded-full"
                                    ></span>
                                    <P
                                        class="text-sm text-gray-600 dark:text-gray-300"
                                    >
                                        <span class="font-medium">Product:</span
                                        >
                                        {data.products?.find(
                                            (p) =>
                                                p.product_id ===
                                                deal.product_id,
                                        )?.name || "N/A"}
                                    </P>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-col items-end gap-2">
                            <div
                                class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                            >
                                <P class="text-white font-bold text-sm"
                                    >{deal.probability}%</P
                                >
                            </div>
                            <P class="text-xs text-gray-500 dark:text-gray-400"
                                >Success Rate</P
                            >
                        </div>
                    </div>
                </Card>
            {/each}
        {/if}
    </div>
</article>

<Modal title="Add New Deal" size="md" bind:open={openCreateDealModal} autoclose>
    <form use:enhance method="POST" action="?/add" class="flex flex-col gap-4">
        <Label for="title" class="block text-sm font-medium text-gray-700"
            >Title</Label
        >
        <Input
            type="text"
            id="title"
            name="title"
            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
        />
        <Label>Value :</Label>
        <Input type="number" id="value" name="value" required />

        <Label>Stage :</Label>
        <Select value="lead" name="stage">
            <option value="lead">Lead</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="closed_won">Closed Won</option>
            <option value="closed_lost">Closed Lost</option>
        </Select>
        <Label>Probability (%): {deal_probability_value}%</Label>
        <Input
            type="range"
            min="0"
            max="100"
            step="10"
            bind:value={deal_probability_value}
            id="probability"
            name="probability"
            required
        />
        <Label>Select a contact :</Label>
        <Select name="contact_id">
            {#each data.contacts as contact}
                <option value={contact.contact_id}>
                    {contact.fullname} ({contact.email} | {contact.phone})
                </option>
            {/each}
        </Select>
        <Label>Select a product :</Label>
        <Select name="product_id">
            {#each data.products as product}
                <option value={product.product_id}>
                    {product.name} ({product.description})
                </option>
            {/each}
        </Select>
        <Button type="submit" color="primary">Create Deal</Button>
    </form>
</Modal>
