<script lang="ts">
	import "../../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import Header from "$lib/components/Header.svelte";
	import Footer from "$lib/components/Footer.svelte";
	import { page } from "$app/stores";

	let { children } = $props();

	let currentRoute = $page.url.pathname;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main class="w-screen min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
	<Header user={null} rooms={[]} />

	{@render children?.()}

	{#if currentRoute === "/" || currentRoute.startsWith("/auth")}
		<Footer />
	{/if}
</main>
