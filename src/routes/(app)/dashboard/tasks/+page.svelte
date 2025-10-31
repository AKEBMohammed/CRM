<script lang="ts">
    import { enhance } from "$app/forms";
    import {
        Badge,
        Banner,
        Button,
        Card,
        Datepicker,
        Heading,
        Input,
        Label,
        Listgroup,
        ListgroupItem,
        Modal,
        P,
        Radio,
        Select,
        Table,
        TableHead,
        Textarea,
    } from "flowbite-svelte";
    import {
        DownloadOutline,
        EyeOutline,
        PlusOutline,
        PrinterOutline,
        RefreshOutline,
    } from "flowbite-svelte-icons";

    let { data, form } = $props();

    let openCreateTaskModal = $state(false);
</script>

{#if form?.error}
    <Banner color="red" class="mb-4">
        <P class="font-medium text-red-800">{form.error}</P>
    </Banner>
{/if}

{#if form?.success}
    <Banner color="green" class="mb-4">
        <P class="font-medium text-green-800">{form.message}</P>
    </Banner>
{/if}

<div class="h-full flex flex-col gap-2 p-2">
    <div class="flex items-center justify-between mb-2">
        <div>
            <Heading tag="h1" class="text-2xl font-bold">Tasks</Heading>
            <P class="text-gray-500 dark:text-gray-400"
                >Manage your tasks here.</P
            >
        </div>

        <div class="flex items-center space-x-2">
            <Button color="primary" size="sm">
                <PlusOutline class="mr-2" />Add New Task
            </Button>
        </div>
    </div>
    <div class="h-full grid grid-cols-4 gap-4">
        {#if data.tasks.length === 0}
            <P class="text-gray-600"
                >No tasks available. Please add a new task.</P
            >
        {:else}
            {#each ["pending", "in_progress", "completed", "canceled"] as status}
                <Card class="h-auto overflow-y-scroll p-2 flex flex-col gap-2">
                    <Heading tag="h4" class="text-lg font-semibold text-center"
                        >{status
                            .replace("_", " ")
                            .split(" ")
                            .map(
                                (word) =>
                                    word.charAt(0).toUpperCase() +
                                    word.slice(1).toLowerCase(),
                            )
                            .join(" ")}</Heading
                    >
                    {#each data.tasks.filter((task: { status: string }) => task.status === status) as task}
                        <Card class="p-4 border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow duration-200">
                            <div class="flex justify-between items-start mb-3">
                                <Heading tag="h5" class="text-lg font-semibold text-gray-800 dark:text-white">{task.title}</Heading>
                                <div class="flex gap-2">
                                    <Badge
                                        class="px-2 py-1 text-xs font-medium"
                                        color={task.priority == "low"
                                            ? "green"
                                            : task.priority == "medium"
                                              ? "yellow"
                                              : "red"}
                                    >
                                        {task.priority.toUpperCase()}
                                    </Badge>
                                    <Badge class="px-2 py-1 text-xs font-medium" color="blue">
                                        {task.type.replace("_", " ").toUpperCase()}
                                    </Badge>
                                </div>
                            </div>
                            
                            <P class="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-3">{task.description}</P>
                            
                            <div class="flex items-center justify-between mb-4">
                                <div class="flex items-center gap-2 text-sm text-gray-500">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                                    </svg>
                                    <span>Due {new Date(task.due_date).toLocaleDateString()}</span>
                                </div>
                                
                                <div class="flex items-center gap-1">
                                    <Button size="xs" color="light" class="p-1">
                                        <EyeOutline class="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                            
                            <div class="border-t pt-3">
                                <form method="POST" class="space-y-2">
                                    <Input
                                        type="hidden"
                                        name="task_id"
                                        value={task.task_id}
                                    />
                                    {#if task.status == "pending"}
                                        <Button
                                            type="submit"
                                            formaction="?/next_stage"
                                            color="blue"
                                            class="w-full"
                                            size="sm"
                                        >
                                            Start Task
                                        </Button>
                                    {:else if task.status == "in_progress"}
                                        <div class="flex gap-2">
                                            <Button
                                                type="submit"
                                                formaction="?/complete"
                                                color="green"
                                                class="flex-1"
                                                size="sm"
                                            >
                                                Complete
                                            </Button>
                                            <Button
                                                type="submit"
                                                formaction="?/cancel"
                                                color="red"
                                                class="flex-1"
                                                size="sm"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    {:else}
                                        <Button
                                            type="submit"
                                            formaction="?/reopen"
                                            color="gray"
                                            class="w-full"
                                            size="sm"
                                        >
                                            Reopen Task
                                        </Button>
                                    {/if}
                                </form>
                            </div>
                        </Card>
                    {/each}
                </Card>
            {/each}
        {/if}
    </div>
</div>

<Modal title="Add New Task" size="md" bind:open={openCreateTaskModal} autoclose>
    <form use:enhance class="flex flex-col gap-4" method="POST" action="?/add">
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
        <Label for="description" class="block text-sm font-medium text-gray-700"
            >Description</Label
        >
        <Textarea
            id="description"
            name="description"
            rows={2}
            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
        ></Textarea>
        <Label>Priority :</Label>
        <Select value="medium" name="priority">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
        </Select>
        <Label>Type :</Label>
        <Select value="other" name="type">
            <option value="email">Email</option>
            <option value="call">Phone call</option>
            <option value="meeting">Meeting</option>
            <option value="other">Other</option>
        </Select>
        <Label>Status :</Label>
        <Select value="pending" name="status">
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
        </Select>
        {#if data.user.role === "admin"}
            <Label>Assign To :</Label>
            <Listgroup>
                {#each data.users as user}
                    <ListgroupItem class="cursor-pointer">
                        <Radio
                            name="assigned_to"
                            value={user.profile_id}
                            class="mr-2"
                            bind:group={data.user.profile_id}
                            checked={user.profile_id === data.user.profile_id}
                        >
                            {user.fullname} ({user.email})
                        </Radio>
                    </ListgroupItem>
                {/each}
            </Listgroup>
        {:else}
            <Label>Assigned To :</Label>
            <P class="text-gray-600">{data.user.fullname}</P>
            <Input
                type="hidden"
                name="assigned_to"
                value={data.user.profile_id}
            />
        {/if}
        <Label>Due Date:</Label>
        <Input
            type="date"
            name="due_date"
            value={new Date(Date.now() + 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0]}
        />
        <Button type="submit" color="primary">Create Task</Button>
    </form>
</Modal>
