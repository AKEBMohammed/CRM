<script>
    import Footer from "$lib/components/Footer.svelte";
    import Header from "$lib/components/Header.svelte";
    import { Button, Input, Label, TabItem, Tabs } from "flowbite-svelte";

</script>

<Header />

<article class="h-full flex flex-col items-center justify-center p-2">
    <Tabs tabStyle="full" contentClass="w-1/3" divider>
        <TabItem open>
            {#snippet titleSlot()}
                <span class="text-bold">
                    Login
                </span>
            {/snippet}
            <form action="" method="post" class="flex flex-col gap-4">
                <Label for="email">Email</Label>
                <Input type="email" id="email" name="email" required />
                <Label for="password">Password</Label>
                <Input type="password" id="password" name="password" required />
                <Button type="submit">Login</Button>
            </form>
        </TabItem>
        <TabItem>
            {#snippet titleSlot()}
                <span class="text-bold">
                    Signup
                </span>
            {/snippet}
            <form action="" method="post" class="flex flex-col gap-4">
                <Label for="fullname">Full Name</Label>
                <Input type="text" id="fullname" name="fullname" required />
                <Label for="email">Email</Label>
                <Input type="email" id="email" name="email" required />
                <Label for="password">Password</Label>
                <Input type="password" id="password" name="password" required />
                <Button type="submit">Signup</Button>
            </form>
        </TabItem>
    </Tabs>
</article>
<Footer />
