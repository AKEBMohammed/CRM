<script lang="ts">
    import { Label, Input, Button, Card, Heading } from "flowbite-svelte";
</script>

<article>
    <Card class="max-w-md mx-auto my-10 p-6">
        <Heading tag="h4">Reset Password</Heading>
        <form action="?/reset" method="post" class="flex flex-col gap-2">
            <Label for="password">New password</Label>
            <Input type="password" id="password" name="password" required />
            <Label for="confirm_password">Confirm new password</Label>
            <Input
                type="password"
                id="confirm_password"
                name="confirm_password"
                required
            />
            <Button type="submit" class="self-center px-4">Reset Password</Button>
        </form>
    </Card>
</article>
