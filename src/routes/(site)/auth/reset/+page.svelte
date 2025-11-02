<script lang="ts">
    import { enhance } from "$app/forms";
    import { Label, Input, Button, Card, Heading, Banner, P } from "flowbite-svelte";
    let { form } = $props();
</script>

<article>
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
    <Card class="max-w-md mx-auto my-20 p-6">
        <Heading tag="h4">Reset Password</Heading>
        <form
            action="?/reset"
            method="post"
            use:enhance
            class="flex flex-col gap-2"
        >
            <Label for="password">New password</Label>
            <Input type="password" id="password" name="password" required />
            <Label for="confirm_password">Confirm new password</Label>
            <Input
                type="password"
                id="confirm_password"
                name="confirm_password"
                required
            />
            <Button type="submit" class="self-center px-4"
                >Reset Password</Button
            >
        </form>
    </Card>
</article>
