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
        BellSolid,
        BedOutline,
        BellOutline,
    } from "flowbite-svelte-icons";
    import type { PageProps } from "./$types";

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
            href: "/dashboard/assistant",
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
    class="h-full w-full p-2 grid grid-rows-[auto,auto,1fr] grid-cols-[1fr,1fr,1fr,1fr] gap-2 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10"
>
    <div
        class="h-fit col-start-1 col-span-4 row-start-1 flex items-center border-b border-gray-200 dark:border-gray-700 p-2 space-x-6"
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
            {#if data.user && data.user.role == "admin"}
                <div>
                    <Heading
                        tag="h3"
                        class="text-2xl text-center font-bold text-primary-600 dark:text-primary-400"
                    >
                        {data.users.reduce((acc: number) => acc + 1, 0)}
                    </Heading>
                    <P class="text-sm text-gray-600 dark:text-gray-400">
                        Team Members
                    </P>
                </div>
            {/if}

            <div>
                <Heading
                    tag="h3"
                    class="text-2xl text-center font-bold text-blue-600 dark:text-blue-400"
                >
                    {data.rooms ? data.rooms.length : 0}
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
                    {data.tasks ? data.tasks.length : 0}
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
                    {data.deals ? data.deals.length : 0}
                </Heading>
                <P class="text-sm text-gray-600 dark:text-gray-400">
                    Open Deals
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
    <div class="h-fit col-start-2 col-span-3 row-start-2 flex gap-4 p-2">
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
                {data.contacts.length || 0}
            </Heading>
            <span
                class="text-sm text-green-600 dark:text-green-400 font-medium"
            >
                <ChartLineUpOutline class="w-4 h-4 text-green-500" />

                +{data.stats?.contactsThisMonth || 0} this month
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
                {data.stats?.totalInteractions || 0}
            </Heading>
            <span
                class="col-span-2 text-md text-blue-600 dark:text-blue-400 font-medium"
            >
                <CalendarMonthOutline class="w-4 h-4 text-blue-500" />

                {data.stats?.interactionsThisWeek || 0} this week
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
                {data.stats?.totalMessages || 0}
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

        <!-- Deals Card -->
        <Card
            class="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 grid grid-rows-3 grid-cols-[2fr,1fr]"
        >
            <P
                class="col-span-2 text-md font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide"
            >
                Sales Pipeline
            </P>
            <Heading
                tag="h3"
                class="col-span-2 text-3xl font-bold text-purple-900 dark:text-purple-100"
            >
                {data.stats?.totalDeals || 0}
            </Heading>
            <span
                class="col-span-2 text-sm text-green-600 dark:text-green-400 font-medium"
            >
                <ChartLineUpOutline class="w-4 h-4 text-green-500" />
                ${(data.stats?.totalDealsValue || 0).toLocaleString()} value
            </span>
            <div
                class="w-14 h-14 grid place-content-center bg-purple-500 rounded-2xl shadow-lg col-start-3 row-start-1 row-span-3 self-center"
            >
                <CartOutline class="w-8 h-8 text-white" />
            </div>
        </Card>
    </div>

    <div
        class="col-start-1 row-span-2 justify-start items-start place-content-start"
    >
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
                        <action.icon class="w-5 h-5 text-white" />
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
    <div class="col-start-2 h-full">
        <Card
            class="p-2 border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20"
        >
            <div class="flex items-center justify-between mb-4">
                <Heading
                    tag="h4"
                    class="text-xl font-semibold text-slate-900 dark:text-white flex items-center"
                >
                    <CalendarMonthOutline class="w-5 h-5 mr-2 text-blue-500" />
                    Today's Tasks
                </Heading>
                <Badge color="blue" class="px-3 py-1 text-sm">
                    {data.tasks?.length || 0} tasks
                </Badge>
            </div>

            <Listgroup class="max-h-70 overflow-y-auto">
                {#each data.tasks || [] as task, index}
                    <ListgroupItem
                        class="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200 p-2 hover:border-blue-300 dark:hover:border-blue-600"
                    >
                        <div class="flex items-start space-x-3 w-full">
                            <div class="flex-1 min-w-0">
                                <P
                                    class="font-semibold text-gray-900 dark:text-white truncate mb-1"
                                >
                                    {task.title}
                                </P>
                                <P
                                    class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2"
                                >
                                    {task.description}
                                </P>
                                <div
                                    class="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400"
                                >
                                    <CalendarMonthOutline
                                        class="w-3 h-3 mr-1"
                                    />
                                    Due: {new Date(
                                        task.due_date,
                                    ).toLocaleDateString()}
                                </div>
                            </div>
                            <div class="flex-shrink-0">
                                <Badge
                                    color="secondary"
                                    class="text-xs px-2 py-1 mb-2"
                                >
                                    {task.status || "pending"}
                                </Badge>
                                <Badge
                                    color={task.priority === "high"
                                        ? "red"
                                        : task.priority === "medium"
                                          ? "yellow"
                                          : "green"}
                                    class="text-xs px-2 py-1"
                                >
                                    {task.priority || "low"}
                                </Badge>
                            </div>
                        </div>
                    </ListgroupItem>
                {:else}
                    <div
                        class="w-full min-w-70 flex flex-col items-center text-center py-8"
                    >
                        <CalendarMonthOutline
                            class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3"
                        />
                        <P class="text-gray-500 dark:text-gray-400"
                            >No tasks for today</P
                        >
                        <P class="text-sm text-gray-400 dark:text-gray-500"
                            >You're all caught up!</P
                        >
                    </div>
                {/each}
            </Listgroup>
        </Card>
    </div>
    <div class="col-start-3 h-full">
        <Card class="p-4 border-0 shadow-lg ">
            <div class="flex items-center justify-between mb-6">
                <Heading
                    tag="h4"
                    class="text-xl font-semibold text-emerald-900 dark:text-white flex items-center"
                >
                    <CartOutline class="w-5 h-5 mr-2 text-emerald-600" />
                    Open Deals
                </Heading>
                <Badge color="green" class="px-3 py-1 text-sm font-medium">
                    {data.deals?.length || 0} deals
                </Badge>
            </div>

            <Listgroup class="max-h-80 overflow-y-auto">
                {#each data.deals || [] as deal, index}
                    <ListgroupItem
                        class="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-300 p-2 hover:border-emerald-300 dark:hover:border-emerald-600 hover:-translate-y-0.5"
                    >
                        <div class="flex items-start space-x-4 w-full">
                            <!-- Deal Value Circle -->
                            <div class="flex-shrink-0">
                                <div
                                    class="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center shadow-lg"
                                >
                                    <span class="text-white font-bold text-sm">
                                        ${(deal.value / 1000).toFixed(1)}K
                                    </span>
                                </div>
                            </div>
                            <div class="flex flex-col grow-1">
                                <div class="flex-1 min-w-0">
                                    <P
                                        class="font-semibold text-gray-900 dark:text-white truncate"
                                    >
                                        {deal.title}
                                    </P>
                                </div>

                                <P
                                    class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3"
                                >
                                    {deal.description}
                                </P>

                                <!-- Deal Progress Bar -->
                                <div class="mb-3">
                                    <div
                                        class="flex justify-between items-center mb-1"
                                    >
                                        Probability:
                                        <span
                                            class="text-xs font-medium text-emerald-600 dark:text-emerald-400"
                                        >
                                            {deal.probability || 25}%
                                        </span>
                                    </div>
                                    <div
                                        class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"
                                    >
                                        <div
                                            class="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full transition-all duration-300"
                                            style="width: {deal.probability ||
                                                25}%"
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div
                                class="flex-shrink-0 flex flex-col items-end space-y-2"
                            >
                                <Badge
                                    color={deal.status === "won"
                                        ? "green"
                                        : deal.status === "lost"
                                          ? "red"
                                          : deal.status === "negotiation"
                                            ? "yellow"
                                            : "blue"}
                                    class="text-xs px-2 py-1 font-medium capitalize"
                                >
                                    {deal.status || "open"}
                                </Badge>

                                <Badge
                                    color={deal.priority === "high"
                                        ? "red"
                                        : deal.priority === "medium"
                                          ? "yellow"
                                          : "green"}
                                    class="text-xs px-2 py-1"
                                >
                                    {deal.priority || "low"} priority
                                </Badge>

                                <!-- Deal Value -->
                                <div class="text-right">
                                    <P
                                        class="text-sm font-bold text-emerald-600 dark:text-emerald-400"
                                    >
                                        ${(deal.value || 0).toLocaleString()}
                                    </P>
                                </div>
                            </div>
                        </div>
                    </ListgroupItem>
                {:else}
                    <div
                        class="w-full min-w-70 flex flex-col items-center text-center py-12"
                    >
                        <div
                            class="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-emerald-900/40 dark:to-teal-800/40 rounded-full flex items-center justify-center mb-4"
                        >
                            <CartOutline
                                class="w-8 h-8 text-emerald-500 dark:text-emerald-400"
                            />
                        </div>
                        <P
                            class="text-gray-500 dark:text-gray-400 font-medium mb-1"
                        >
                            No open deals
                        </P>
                        <P class="text-sm text-gray-400 dark:text-gray-500">
                            Start building your sales pipeline!
                        </P>
                        <button
                            class="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors"
                        >
                            Create Deal
                        </button>
                    </div>
                {/each}
            </Listgroup>
        </Card>
    </div>
    <div class="col-start-4 h-full">
        <Card class="p-4 border-0 shadow-lg ">
            <div class="flex items-center justify-between mb-6">
                <Heading
                    tag="h4"
                    class="text-xl font-semibold text-emerald-900 dark:text-white flex items-center"
                >
                    <BellOutline class="w-5 h-5 mr-2 text-emerald-600" />
                    Notifications
                </Heading>
                <Badge color="green" class="px-3 py-1 text-sm font-medium">
                    {data.notifications?.length || 0} notifications
                </Badge>
            </div>

            <Listgroup class="max-h-80 overflow-y-auto">
                {#each data.notifications || [] as notification, index}
                    <ListgroupItem
                        class="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-300 p-2 hover:border-emerald-300 dark:hover:border-emerald-600 hover:-translate-y-0.5"
                    >
                        <div class="flex items-start space-x-4 w-full">
                            <Badge
                                color={notification.type === "info"
                                    ? "blue"
                                    : notification.type === "warning"
                                      ? "yellow"
                                      : notification.type === "error"
                                        ? "red"
                                        : "green"}
                                class="flex-shrink-0 text-xs px-2 py-1 font-medium"
                            >
                                {notification.type || "info"}
                            </Badge>
                            <P class="text-sm text-gray-500 dark:text-gray-400">{notification.content}</P>
                        </div>
                    </ListgroupItem>
                {:else}
                    <div
                        class="w-full min-w-70 flex flex-col items-center text-center py-12"
                    >
                        <div
                            class="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-emerald-900/40 dark:to-teal-800/40 rounded-full flex items-center justify-center mb-4"
                        >
                            <BellSolid
                                class="w-8 h-8 text-emerald-500 dark:text-emerald-400"
                            />
                        </div>
                        <P
                            class="text-gray-500 dark:text-gray-400 font-medium mb-1"
                        >
                            No new notifications
                        </P>
                        <P class="text-sm text-gray-400 dark:text-gray-500">
                            You're all caught up!
                        </P>
                    </div>
                {/each}
            </Listgroup>
        </Card>
    </div>
</div>
