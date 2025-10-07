<script lang="ts">
    import { Button, Tooltip } from "flowbite-svelte";
    import {
        UserSolid,
        AddressBookSolid,
        CogSolid,
        ReactSolid,
        HomeSolid,
        BarcodeOutline,
        ChartPieSolid,
    } from "flowbite-svelte-icons";
    import { page } from "$app/stores";

    let list = [
        {
            name: "Dashboard",
            icon: HomeSolid,
            href: "/dashboard",
        },
        {
            name: "Users",
            icon: UserSolid,
            href: "/dashboard/users",
        },
        {
            name: "Contacts",
            icon: AddressBookSolid,
            href: "/dashboard/contacts",
        },
        {
            name: "Products",
            icon: BarcodeOutline,
            href: "/dashboard/products",
        },
        {
            name: "Interactions",
            icon: ReactSolid,
            href: "/dashboard/interactions",
        },
        {
            name: "Analytics",
            icon: ChartPieSolid,
            href: "/dashboard/analytics",
        },
        {
            name: "Settings",
            icon: CogSolid,
            href: "/dashboard/settings",
        },
    ];
    let currentRoute = $state($page.url.pathname);
    let { user } = $props();

    $effect(() => {
        currentRoute = $page.url.pathname;
    });
</script>

<div
    class="w-15 h-full border-r border-gray-200 dark:border-gray-700 p-2 flex flex-col items-center gap-4 bg-white shadow dark:bg-gray-800 row-start-2"
>
    {#each list as { name, icon: Icon, href }, i}
        {#if !(name === "Users" && user.role === "user")}
            <div class={i === list.length - 1 ? "mt-auto flex flex-col items-center" : ""}>
                <Button
                    color={currentRoute === href ? "primary" : "dark"}
                    {href}
                    class="flex items-center justify-center w-12 h-12 rounded-lg transition "
                    aria-label={name}
                >
                    <Icon class="w-6 h-6 text-gray-900 dark:text-white" />
                </Button>
                <Tooltip placement="right">{name}</Tooltip>
            </div>
        {/if}
    {/each}
</div>
