<script>
    import {
        Button,
        Card,
        Heading,
        Input,
        Label,
        Listgroup,
        ListgroupItem,
        Modal,
        P,
        Select,
        Textarea,
    } from "flowbite-svelte";
    import { PlusOutline } from "flowbite-svelte-icons";

    let { data } = $props();

    let openCreateTaskModal = $state(false);
</script>

<div class="flex flex-col gap-4 p-2">
    <div class="grid grid-cols-2 grid-rows-2 space-y-2">
        <Heading tag="h1" class="text-2xl font-bold">Tasks</Heading>
        <P class="text-gray-600">Manage your tasks here.</P>
        <Button
            class="col-start-2 row-start-1 col-span-2"
            color="primary"
            onclick={() => (openCreateTaskModal = true)}
            ><PlusOutline class="mr-2" />Add New Task</Button
        >
    </div>
    <div>
        {#if data.tasks.length === 0}
            <P class="text-gray-600"
                >No tasks available. Please add a new task.</P
            >
        {:else}
            {#each data.tasks as task}
                <Card class="mb-4" title={task.title}>
                    <Heading tag="h2" class="text-lg font-semibold"
                        >{task.title}</Heading
                    >
                    <P class="text-gray-600">{task.description}</P>
                </Card>
            {/each}
        {/if}
    </div>
</div>

<Modal title="Add New Task" size="md" open={openCreateTaskModal}>
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
            rows="2"
            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
        ></Textarea>
        <Label>Priority :</Label>
        <Select value="medium">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
        </Select>
        <Label>Type :</Label>
        <Select value="other">
            <option value="email">Email</option>
            <option value="call">Phone call</option>
            <option value="meeting">Meeting</option>
            <option value="other">Other</option>
        </Select>
        <Label>Status :</Label>
        <Select value="pending">
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
        </Select>
        {#if data.user.role === "admin"}
            <Label>Assign To :</Label>
            <Listgroup>
                {#each data.users as user}
                    <ListgroupItem
                        class="cursor-pointer"
                        >
                        <input
                            type="radio"
                            name="assigned_to"
                            value={user.id}
                            class="mr-2"
                            checked={data.user.profile_id === user.profile_id}
                        />

                        {user.fullname} ({user.email})
                    </ListgroupItem>
                {/each}
            </Listgroup>
        {:else}
            <Label>Assigned To :</Label>
            <P class="text-gray-600">{data.user.fullname}</P>
        {/if}
        <Button type="submit" color="primary">Create Task</Button>
    </form>
</Modal>
