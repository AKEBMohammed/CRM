<script lang="ts">
    import { enhance } from "$app/forms";
    import {
        Accordion,
        AccordionItem,
        Button,
        Card,
        Heading,
        Input,
        Label,
        Modal,
        P,
        Select,
        Textarea,
    } from "flowbite-svelte";
    import {
        EnvelopeSolid,
        PenSolid,
        PhoneSolid,
        PlusOutline,
        UserSolid,
        UsersSolid,
    } from "flowbite-svelte-icons";

    let { data, form } = $props();

    let openCreateInteractionModal = $state(false);
    let openEditDealModal = $state(false);
    let deal_probability_value = $state(data.deal.probability);
</script>

<article class="w-full h-full flex gap-4">
    <aside class="w-1/3 border-r border-gray-500 p-2">
        <div class="w-full flex">
            <Heading tag="h4">Deal Details</Heading>
            <Button
                size="sm"
                class="ml-auto rounded-full"
                onclick={() => (openEditDealModal = true)}
            >
                <PenSolid class="w-6 h-6" />
            </Button>
        </div>

        <div class="mt-4 space-y-4">
            <Card class="p-4 rounded-lg border">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <P class="text-sm text-gray-600 mb-1">Deal Title</P>
                        <P class="font-semibold text-gray-900"
                            >{data.deal.title}</P
                        >
                    </div>
                    <div>
                        <P class="text-sm text-gray-600 mb-1">Value</P>
                        <P class="font-semibold text-green-600 text-lg"
                            >${data.deal.value.toLocaleString()}</P
                        >
                    </div>
                    <div>
                        <P class="text-sm text-gray-600 mb-1">Stage</P>
                        <span
                            class="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                        >
                            {data.deal.stage}
                        </span>
                    </div>
                    <div>
                        <P class="text-sm text-gray-600 mb-1">Probability</P>
                        <div class="flex items-center gap-2">
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    class="bg-blue-600 h-2 rounded-full"
                                    style="width: {data.deal.probability}%"
                                ></div>
                            </div>
                            <P class="text-sm font-medium"
                                >{data.deal.probability}%</P
                            >
                        </div>
                    </div>
                    <div class="col-span-2">
                        <P class="text-sm text-gray-600 mb-1">Close Date</P>
                        <P class="font-medium"
                            >{data.deal.close_date || "Not set"}</P
                        >
                    </div>
                </div>
            </Card>

            <Accordion>
                <AccordionItem open>
                    {#snippet header()}
                        <span class="font-semibold">Contact Details</span>
                    {/snippet}

                    <div class="space-y-3">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"
                            >
                                <UserSolid class="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <P class="text-sm text-gray-600">Name</P>
                                <P class="font-medium"
                                    >{data.deal.contact.fullname}</P
                                >
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div
                                class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"
                            >
                                <EnvelopeSolid class="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <P class="text-sm text-gray-600">Email</P>
                                <P class="font-medium"
                                    >{data.deal.contact.email}</P
                                >
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div
                                class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center"
                            >
                                <PhoneSolid class="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <P class="text-sm text-gray-600">Phone</P>
                                <P class="font-medium"
                                    >{data.deal.contact.phone}</P
                                >
                            </div>
                        </div>
                    </div>
                </AccordionItem>

                <AccordionItem>
                    {#snippet header()}
                        <strong>Product Details</strong>
                    {/snippet}

                    <div class="space-y-3">
                        <div>
                            <P class="text-sm text-gray-600 mb-1"
                                >Product Name</P
                            >
                            <P class="font-medium text-lg"
                                >{data.deal.product.name}</P
                            >
                        </div>
                        <div>
                            <P class="text-sm text-gray-600 mb-1">Description</P
                            >
                            <P class="text-gray-700 leading-relaxed"
                                >{data.deal.product.description}</P
                            >
                        </div>
                    </div>
                </AccordionItem>
            </Accordion>
        </div>
    </aside>
    <section class="w-full p-2">
        <div class="flex flex-row items-center gap-4">
            <Heading tag="h5">Deal Interactions</Heading>
            <Button
                class="ml-auto"
                onclick={() => {
                    openCreateInteractionModal = true;
                }}><PlusOutline class="w-4 h-4" /> Add Interaction</Button
            >
        </div>

        <div class="mt-6">
            {#if data.interactions && data.interactions.length > 0}
                <div class="grid grid-cols-3 gap-2">
                    {#each data.interactions as interaction}
                        <Card
                            class="p-4 border rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                            <div class="flex items-start justify-between gap-4">
                                <div class="flex items-start gap-4">
                                    <!-- Interaction Type Icon -->
                                    <div class="flex-shrink-0">
                                        {#if interaction.type === "call"}
                                            <div
                                                class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"
                                            >
                                                <PhoneSolid
                                                    class="w-5 h-5 text-green-600"
                                                />
                                            </div>
                                        {:else if interaction.type === "email"}
                                            <div
                                                class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"
                                            >
                                                <EnvelopeSolid
                                                    class="w-5 h-5 text-blue-600"
                                                />
                                            </div>
                                        {:else if interaction.type === "meeting"}
                                            <div
                                                class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"
                                            >
                                                <UsersSolid
                                                    class="w-5 h-5 text-purple-600"
                                                />
                                            </div>
                                        {:else}
                                            <div
                                                class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
                                            >
                                                <PlusOutline
                                                    class="w-5 h-5 text-gray-600"
                                                />
                                            </div>
                                        {/if}
                                    </div>

                                    <!-- Interaction Content -->
                                    <div class="flex-1 min-w-0">
                                        <div
                                            class="flex items-center gap-3 mb-2"
                                        >
                                            <span
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                            {interaction.type === 'call'
                                                    ? 'bg-green-100 text-green-800'
                                                    : interaction.type ===
                                                        'email'
                                                      ? 'bg-blue-100 text-blue-800'
                                                      : interaction.type ===
                                                          'meeting'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : 'bg-gray-100 text-gray-800'}"
                                            >
                                                {interaction.type}
                                            </span>
                                            <P class="text-sm text-gray-500">
                                                {new Date(
                                                    interaction.created_at,
                                                ).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </P>
                                        </div>
                                        <P
                                            class="text-gray-700 leading-relaxed"
                                        >
                                            {interaction.note}
                                        </P>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    {/each}
                </div>
            {:else}
                <div class="text-center py-12 flex flex-col items-center">
                    <div
                        class="w-16 h-16 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                        <PlusOutline class="w-8 h-8 text-primary-400" />
                    </div>
                    <P class="text-gray-500 text-lg mb-2">No interactions yet</P
                    >
                    <P class="text-gray-400 text-sm"
                        >Start by adding your first interaction with this deal</P
                    >
                </div>
            {/if}
        </div>
    </section>
</article>

<Modal
    title="Add New Interaction"
    size="md"
    bind:open={openCreateInteractionModal}
    autoclose
>
    <form use:enhance method="POST" action="?/add" class="flex flex-col gap-4">
        <input type="hidden" name="deal_id" value={data.deal.deal_id} />
        <Label>Type</Label>
        <Select name="type" id="type" required>
            <option value="call">Call</option>
            <option value="meeting">Meeting</option>
            <option value="email">Email</option>
            <option value="note">Note</option>
            <option value="other">Other</option>
        </Select>
        <Label>Note</Label>
        <Textarea class="w-full" name="note" id="note" rows={3} required
        ></Textarea>
        <Button type="submit" color="primary">Create Interaction</Button>
    </form>
</Modal>

<Modal title="Edit Deal" size="md" bind:open={openEditDealModal} autoclose>
    <form use:enhance method="POST" action="?/edit" class="flex flex-col gap-4">
        <Input type="hidden" name="deal_id" value={data.deal.deal_id} />
        <Label for="title" class="block text-sm font-medium text-gray-700"
            >Title</Label
        >
        <Input
            type="text"
            id="title"
            name="title"
            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            value={data.deal.title}
            required
        />
        <Label>Value :</Label>
        <Input type="number" id="value" name="value" value={data.deal.value} required />

        <Label>Stage :</Label>
        <Select value={data.deal.stage} name="stage">
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
        <Button type="submit" color="primary">Update Deal</Button>
    </form>
</Modal>
