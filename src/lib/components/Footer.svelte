<script lang="ts">
    import {
        Footer,
        FooterLinkGroup,
        FooterCopyright,
        FooterLink,
    } from "flowbite-svelte";
</script>

<Footer class="mt-auto min-mt-12 border-t pt-6 text-sm text-gray-500 ">
    <FooterCopyright href="/" by="DZ Sales" year={2025} />
    <FooterLinkGroup
        class="flex flex-wrap items-center text-sm text-gray-500 sm:mt-0 dark:text-gray-400"
    >
        <FooterLink href="/">About</FooterLink>
        <FooterLink href="/">Privacy Policy</FooterLink>
        <FooterLink href="/">Licensing</FooterLink>
        <FooterLink href="/">Contact</FooterLink>
    </FooterLinkGroup>
</Footer>
