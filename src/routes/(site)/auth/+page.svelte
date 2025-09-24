<script lang="ts">
    import { enhance } from "$app/forms";
    import {
        Alert,
        Button,
        Modal,
        Input,
        Label,
        TabItem,
        Tabs,
        Toggle,
        Banner,
        P,
    } from "flowbite-svelte";
    import { DownloadOutline } from "flowbite-svelte-icons";
    let { form } = $props();
    let showForgetPasswordModal = $state(false);

    $effect(() => {
        if (form?.success) {
            showForgetPasswordModal = false;
        }
    });
</script>

<article class="h-full flex flex-col items-center justify-center p-2 mt-15">
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
    <Tabs tabStyle="full" divider classes={{ content: "lg:w-150 w-full" }}>
        <TabItem open>
            {#snippet titleSlot()}
                <span class="text-bold"> Login </span>
            {/snippet}
            <form
                action="?/login"
                method="post"
                class="flex flex-col gap-4"
                use:enhance
            >
                <Label for="email">Email</Label>
                <Input type="email" id="email" name="email" required />
                <Label for="password">Password</Label>
                <Input type="password" id="password" name="password" required />

                <div class="w-full flex items-center gap-2">
                    <Label for="remember" class="flex items-center gap-2">
                        Remember me
                    </Label>
                    <Toggle class="ml-auto" id="remember" name="remember" />
                </div>
                <a
                    onclick={() => (showForgetPasswordModal = true)}
                    href="#"
                    class="ml-auto text-blue-400 hover:underline"
                    >Forget password?</a
                >
                <Button class="mx-8" type="submit">Login</Button>
            </form>
        </TabItem>
        <TabItem>
            {#snippet titleSlot()}
                <span class="text-bold"> Register </span>
            {/snippet}

            <form
                action="?/register"
                method="post"
                use:enhance
                class="grid lg:grid-cols-2 grid-cols-1 gap-4"
            >
                <Alert color="blue" class="lg:col-span-2">
                    <span class="font-medium">Info alert!</span>
                    <p>This form is for business owners/admins only.</p>
                </Alert>
                <fieldset class="flex flex-col gap-5">
                    <legend
                        class=" text-lg font-bold text-gray-900 dark:text-white"
                        >Personal Information</legend
                    >
                    <Label for="fullname">Full Name</Label>
                    <Input type="text" id="fullname" name="fullname" required />
                    <Label for="email">Email</Label>
                    <Input type="email" id="email" name="email" required />
                    <Label for="password">Password</Label>
                    <Input
                        type="password"
                        id="password"
                        name="password"
                        required
                    />
                </fieldset>
                <fieldset class="flex flex-col gap-5">
                    <legend
                        class=" text-lg font-bold text-gray-900 dark:text-white"
                        >Business Information</legend
                    >
                    <Label for="company">Company Name</Label>
                    <Input type="text" id="company" name="company" required />
                    <Label for="industry">Industry</Label>
                    <Input type="text" id="industry" name="industry" required />
                </fieldset>

                <Button class="mx-8 lg:col-span-2" type="submit">Signup</Button>
            </form>
        </TabItem>
    </Tabs>
    <Modal
        title="Forget Password"
        bind:open={showForgetPasswordModal}
        size="sm"
    >
        <form
            action="?/forget"
            method="post"
            use:enhance
            class="flex flex-col gap-2"
        >
            <Label for="email">email</Label>
            <Input type="email" id="email" name="email" required />
            <Alert color="blue" class="mt-2">
                <span class="font-medium">Info alert!</span>
                <p>
                    Password reset link will be sent to your email address if it
                    exists in our system.
                </p>
            </Alert>
            <Button type="submit" class="self-center px-4"
                >Send password reset link</Button
            >
        </form>
    </Modal>
</article>
