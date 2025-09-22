<script lang="ts">
    import { Button, Card, Dialog } from "flowbite-svelte";
    import previewImg from "$lib/assets/Ecommerce web page-rafiki.png";
    const features = [
        {
            title: "Contact Management",
            desc: "Store and manage all your contacts with custom fields, tags and relationship mapping.",
        },
        {
            title: "Deal Pipeline",
            desc: "Visual pipeline to track opportunities from lead to won with easy stage updates.",
        },
        {
            title: "Tasks & Activity",
            desc: "Log calls, meetings and set reminders so nothing falls through the cracks.",
        },
    ];
</script>

<article class="max-w-7xl mx-auto p-6 text-primary-500 dark:text-primary-500">
    <!-- Hero -->
    <section class="grid gap-8 md:grid-cols-2 items-center py-5">
        <div>
            <h1 class="text-4xl md:text-5xl font-extrabold leading-tight">
                Simple CRM for fast-growing teams
            </h1>
            <p class="mt-4 text-lg text-gray-500 dark:text-gray-400">
                Manage contacts, track deals, and automate tasks — all in one
                lightweight app built for speed and clarity.
            </p>
            <div class="mt-6 flex gap-3">
                <Button color="primary">Let's start</Button>
            </div>
        </div>
        <div>
            <div
                class="bg-gradient-to-br from-primary-500 to-primary-200 rounded-xl p-6 shadow-md"
            >
                <img
                    alt="dashboard preview"
                    src={previewImg}
                    class="w-full rounded-md"
                />
            </div>
        </div>
    </section>

    <!-- Features -->
    <section class="py-8">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Core features</h2>
        <p class="mt-2 text-gray-500 dark:text-gray-400">
            Everything a small sales team needs to organize relationships and
            close more deals.
        </p>

        <div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {#each features as f}
                <Card class="h-full p-2">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                        {f.title}
                    </h3>
                    <p class="mt-2 text-gray-500 dark:text-gray-400">
                        {f.desc}
                    </p>
                </Card>
            {/each}
        </div>
    </section>

    <!-- CTA strip -->
    <section
        class="mt-12 bg-gradient-to-r from-primary-600 to-green-300 text-white rounded-lg p-8"
    >
        <div class="max-w-3xl">
            <h3 class="text-2xl font-bold ">Ready to try DZ Sales?</h3>
            <p class="mt-2">
                Get started with a free trial and import your contacts in
                minutes.
            </p>
            <div class="mt-4">
                <Button color="light">Create account</Button>
            </div>
        </div>
    </section>
</article>
