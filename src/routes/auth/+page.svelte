<script>
    import Footer from "$lib/components/Footer.svelte";
    import Header from "$lib/components/Header.svelte";
    import {
        Alert,
        Button,
        Input,
        Label,
        TabItem,
        Tabs,
    } from "flowbite-svelte";
</script>

<Header />

<article class="h-full flex flex-col items-center justify-center p-2">
    <Tabs tabStyle="full" divider>
        <TabItem open>
            {#snippet titleSlot()}
                <span class="text-bold"> Login </span>
            {/snippet}
            <form action="?/login" method="post" class="flex flex-col gap-4">
                <Label for="email">Email</Label>
                <Input type="email" id="email" name="email" required />
                <Label for="password">Password</Label>
                <Input type="password" id="password" name="password" required />
                <Button type="submit">Login</Button>
            </form>
        </TabItem>
        <TabItem>
            {#snippet titleSlot()}
                <span class="text-bold"> Register </span>
            {/snippet}

            <form
                action="?/register"
                method="post"
                class="grid grid-cols-2 gap-4"
            >
                <Alert color="blue" class="col-span-2">
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
                <fieldset class="flex flex-col gap-4">
                    <legend
                        class=" text-lg font-bold text-gray-900 dark:text-white"
                        >Business Information</legend
                    >
                    <Label for="company">Company Name</Label>
                    <Input
                        type="text"
                        id="company"
                        name="company"
                        required
                    />
                    <Label for="industry">Industry</Label>
                    <Input type="text" id="industry" name="industry" required />
                </fieldset>

                <Button class="col-span-2" type="submit">Signup</Button>
            </form>
        </TabItem>
    </Tabs>
</article>
<Footer />
