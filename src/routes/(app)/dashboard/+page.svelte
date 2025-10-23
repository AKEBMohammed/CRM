<script lang="ts">
    import {
        Card,
        Heading,
        P,
        Badge,
        Avatar,
        Listgroup,
        ListgroupItem,
    } from "flowbite-svelte";
    import {
        UserSolid,
        ChartPieSolid,
        UsersGroupSolid,
        MessageCaptionSolid,
        ChartLineUpOutline,
        CalendarMonthOutline,
        PhoneSolid,
        BuildingOutline,
        CartOutline,
        FireSolid,
        LightbulbOutline,
    } from "flowbite-svelte-icons";
    import type { PageProps } from "./$types";
    import Header from "$lib/components/Header.svelte";

    let { data }: PageProps = $props();

    // Get current time for greeting
    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    }

    function formatTimeAgo(dateString: string) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60),
        );

        if (diffInMinutes < 1) return "just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440)
            return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }

    function getInitials(name: string) {
        return (
            name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "NA"
        );
    }

    // CRM Quick Actions based on database schema
    const quickActions = [
        {
            title: "Add Contact",
            description: "Create new customer contact",
            icon: UserSolid,
            color: "blue",
            href: "/dashboard/contacts",
            highlight: true,
        },
        {
            title: "Log Interaction",
            description: "Record customer interaction",
            icon: PhoneSolid,
            color: "green",
            href: "/dashboard/interactions",
        },
        {
            title: "Team Chat",
            description: "Collaborate with your team",
            icon: MessageCaptionSolid,
            color: "purple",
            href: "/dashboard/rooms",
        },
        {
            title: "Add Product",
            description: "Expand your product catalog",
            icon: CartOutline,
            color: "orange",
            href: "/dashboard/products",
        },
        {
            title: "AI Insights",
            description: "Get AI-powered recommendations",
            icon: LightbulbOutline,
            color: "yellow",
            href: "/dashboard/ai",
        },
        {
            title: "Analytics",
            description: "View performance metrics",
            icon: ChartPieSolid,
            color: "red",
            href: "/dashboard/analytics",
        },
    ];
</script>

<div
    class="h-full w-full p-2 grid grid-rows-[auto,1fr] grid-cols-[1fr,2fr,1fr] gap-2 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10"
>
    <div
        class="h-fit col-start-1 col-span-3 row-start-1 flex items-center border-b border-gray-200 dark:border-gray-700 p-2 space-x-6"
    >
        <Avatar
            size="md"
            class="ring-2 ring-primary-500 dark:ring-primary-400 shadow-lg"
        ></Avatar>
        <div class="flex flex-col">
            <Heading tag="h2" class="text-2xl font-bold">
                {getGreeting()}, {data.user?.fullname}!
            </Heading>
            <P
                class="text-lg text-gray-600 dark:text-gray-300 flex items-center space-x-2"
            >
                <BuildingOutline class="w-4 h-4" />
                <span
                    >CRM Dashboard - {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}</span
                >
            </P>
        </div>
        <div
            class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 border border-gray-200 dark:border-gray-700 flex gap-2"
        >
            <div>
                <Heading
                    tag="h3"
                    class="text-2xl text-center font-bold text-primary-600 dark:text-primary-400"
                >
                    {data.stats?.totalUsers || 0}
                </Heading>
                <P class="text-sm text-gray-600 dark:text-gray-400">
                    Team Members
                </P>
            </div>

            <div>
                <Heading
                    tag="h3"
                    class="text-2xl text-center font-bold text-blue-600 dark:text-blue-400"
                >
                    {data.stats?.totalRooms || 0}
                </Heading>
                <P class="text-sm text-gray-600 dark:text-gray-400">
                    Active Rooms
                </P>
            </div>

            <div>
                <Heading
                    tag="h3"
                    class="text-2xl text-center font-bold text-orange-600 dark:text-orange-400"
                >
                    {0}
                </Heading>
                <P class="text-sm text-gray-600 dark:text-gray-400">
                    Today's Tasks
                </P>
            </div>
            <div class="">
                <Heading
                    tag="h3"
                    class="text-2xl text-center font-bold text-purple-600 dark:text-purple-400"
                >
                    {0}
                </Heading>
                <P class="text-sm text-gray-600 dark:text-gray-400">
                    Recent Activities
                </P>
            </div>
        </div>

        <!-- Status Badge -->
        <Badge color="green" class="ml-auto px-4 py-2 text-sm font-medium">
            <div
                class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"
            ></div>
            Online & Active
        </Badge>

        <!-- User Role -->
        <Badge color="primary" class="px-4 py-2 text-sm font-medium capitalize">
            {data.user?.role || "User"}
        </Badge>
    </div>

    <!-- CRM Performance Cards -->
    <div class="h-fit col-start-2 col-span-2 row-start-2 flex gap-4 p-2">
        <!-- Contacts Card -->
        <Card
            class="p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 grid grid-rows-3 grid-cols-[2fr,1fr]"
        >
            <P
                class="col-span-2 text-md font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide"
            >
                Customer Contacts
            </P>
            <Heading
                tag="h3"
                class=" col-span-2 text-3xl font-bold text-blue-900 dark:text-blue-100"
            >
                0
            </Heading>
            <span
                class="text-sm text-green-600 dark:text-green-400 font-medium"
            >
                <ChartLineUpOutline class="w-4 h-4 text-green-500" />

                +0 this month
            </span>
            <div
                class="w-14 h-14 grid place-content-center bg-blue-500 rounded-2xl shadow-lg col-start-3 row-start-1 row-span-3 self-center"
            >
                <UsersGroupSolid class="w-8 h-8 text-white" />
            </div>
        </Card>

        <!-- Interactions Card -->
        <Card
            class="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 grid grid-rows-3 grid-cols-[2fr,1fr]"
        >
            <P
                class="col-span-2 text-sm font-medium text-green-600 dark:text-green-400 uppercase tracking-wide"
            >
                Customer Interactions
            </P>
            <Heading
                tag="h3"
                class="col-span-2 text-3xl font-bold text-green-900 dark:text-green-100"
            >
                0
            </Heading>
            <span
                class="col-span-2 text-md text-blue-600 dark:text-blue-400 font-medium"
            >
                <CalendarMonthOutline class="w-4 h-4 text-blue-500" />

                0 this week
            </span>
            <div
                class="w-14 h-14 grid place-content-center bg-green-500 rounded-2xl shadow-lg col-start-3 row-start-1 row-span-3 self-center"
            >
                <PhoneSolid class="w-8 h-8 text-white" />
            </div>
        </Card>

        <!-- Team Collaboration Card -->
        <Card
            class="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 grid grid-rows-3 grid-cols-[2fr,1fr]"
        >
            <P
                class="col-span-2 text-md font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide"
            >
                Team Messages
            </P>
            <Heading
                tag="h3"
                class="col-span-2 text-3xl font-bold text-orange-900 dark:text-orange-100"
            >
                {data.recentMessages?.length || 0}
            </Heading>
            <span
                class="col-span-2 text-sm text-blue-600 dark:text-blue-400 font-medium"
            >
                <MessageCaptionSolid class="w-4 h-4 text-blue-500" />

                {data.stats?.totalRooms || 0} active rooms
            </span>
            <div
                class="w-14 h-14 grid place-content-center bg-orange-500 rounded-2xl shadow-lg col-start-3 row-start-1 row-span-3 self-center"
            >
                <MessageCaptionSolid class="w-8 h-8 text-white" />
            </div>
        </Card>
    </div>

    <div class="col-start-1 space-y-6">
        <!-- CRM Quick Actions -->
        <Listgroup title="Quick Actions">
            <ListgroupItem>
                <Heading
                    tag="h4"
                    class="text-xl font-semibold text-gray-900 dark:text-white flex items-center"
                >
                    <FireSolid class="w-5 h-5 mr-2 text-orange-500" />
                    Quick Actions
                </Heading>
            </ListgroupItem>
            {#each quickActions as action}
                <ListgroupItem
                    href={action.href}
                    color="light"
                    class="w-full justify-start p-4 h-auto hover:bg-gradient-to-r hover:from-{action.color}-50 hover:to-{action.color}-100 dark:hover:from-{action.color}-900/20 dark:hover:to-{action.color}-800/20 transition-all duration-200 border-0 shadow-sm hover:shadow-md"
                >
                    <div
                        class="p-3 bg-gradient-to-br from-{action.color}-400 to-{action.color}-600 rounded-xl shadow-lg flex-shrink-0"
                    >
                        <svelte:component
                            this={action.icon}
                            class="w-5 h-5 text-white"
                        />
                    </div>
                    <div class="text-left flex-1">
                        <P class="font-semibold text-gray-900 dark:text-white">
                            {action.title}
                        </P>
                        <P class="text-sm text-gray-600 dark:text-gray-400">
                            {action.description}
                        </P>
                    </div>
                </ListgroupItem>
            {/each}
        </Listgroup>
    </div>
</div>
