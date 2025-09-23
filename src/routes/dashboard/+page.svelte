<script lang="ts">
    import { Heading,P } from "flowbite-svelte";
    import type { PageProps } from "./$types";

    let { data }: PageProps = $props();

</script>

<article class="min-h-full w-full p-2 bg-gray-100 dark:bg-gray-900">
    <div
        class="w-full p-4 bg-gradient-to-r from-primary-600 to-green-400 text-white shadow rounded-lg"
    >
        <Heading tag="h3">Welcome {data.user?.fullname}!</Heading>
        <P class="text-lg">Welcome to your dashboard! Here you can :</P>
        <ul class="list-disc list-inside mt-2">
            <li>Manage your account.</li>
            <li>View recent activity.</li>
            <li>Access exclusive resources.</li>
            <li>And much more.</li>
        </ul>
    </div>
    <button class="mt-4 p-2 bg-white text-primary-600 rounded shadow"
        >Take Action</button
    >
</article>
