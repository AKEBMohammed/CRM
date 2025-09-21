<script lang="ts">
	import "../app.css";
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

<Header />

{@render children?.()}

{#if currentRoute === "/"}
	<Footer />
{/if}
