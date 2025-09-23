<script lang="ts">
    import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	console.log(data.user); // { id: '...', email: '...' }
</script>

<article class="min-h-full w-full p-2 bg-gray-100 dark:bg-gray-900">
    <div
        class="w-full p-4 bg-gradient-to-r from-primary-600 to-green-300 text-white shadow rounded-lg"
    >
        <h3 class="text-2xl font-bold">Welcome back!</h3>
        <p class="text-lg">
            Welcome to your dashboard! Here you can manage your account and view
            recent activity.
        </p>
    </div>
    <button class="mt-4 p-2 bg-white text-primary-600 rounded shadow"
        >Take Action</button
    >
</article>
