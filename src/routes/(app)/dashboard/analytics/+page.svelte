<script lang="ts">
    import {
        Card,
        Heading,
        P,
        Badge,
        Button,
        Avatar,
        Progressbar,
        Table,
        TableBody,
        TableBodyCell,
        TableBodyRow,
        TableHead,
        TableHeadCell,
        Tabs,
        TabItem,
    } from "flowbite-svelte";
    import {
        ChartOutline,
        UsersSolid,
        DollarOutline,
        ClipboardListSolid,
        ShoppingBagSolid,
        ClockSolid,
        CheckCircleSolid,
        ChartMixedOutline,
        MessagesSolid,
        BuildingSolid,
        ChartLineUpOutline,
        ExclamationCircleSolid,
        ArrowRightOutline,
        CalendarWeekSolid,
    } from "flowbite-svelte-icons";

    let { data } = $props();
    let analytics = $derived(data.analytics);
    let user = $derived(data.user);

    // Helper functions
    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    function formatDateRelative(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        return `${Math.ceil(diffDays / 30)} months ago`;
    }

    function getStageColor(
        stage: string,
    ):
        | "primary"
        | "secondary"
        | "gray"
        | "red"
        | "orange"
        | "amber"
        | "yellow"
        | "lime"
        | "green"
        | "emerald"
        | "teal"
        | "cyan"
        | "sky"
        | "blue"
        | "indigo"
        | "violet"
        | "purple"
        | "fuchsia"
        | "pink"
        | "rose"
        | undefined {
        const colors: {
            [key: string]:
                | "primary"
                | "secondary"
                | "gray"
                | "red"
                | "orange"
                | "amber"
                | "yellow"
                | "lime"
                | "green"
                | "emerald"
                | "teal"
                | "cyan"
                | "sky"
                | "blue"
                | "indigo"
                | "violet"
                | "purple"
                | "fuchsia"
                | "pink"
                | "rose"
                | undefined;
        } = {
            lead: "blue",
            qualified: "lime",
            proposal: "yellow",
            negotiation: "purple",
            closed_won: "green",
            closed_lost: "red",
        };
        return colors[stage] || "gray";
    }

    function getPriorityColor(priority: string): "primary" | "secondary" | "gray" | "red" | "orange" | "amber" | "yellow" | "lime" | "green" | "emerald" | "teal" | "cyan" | "sky" | "blue" | "indigo" | "violet" | "purple" | "fuchsia" | "pink" | "rose" | undefined {
        const colors: { [key: string]: "primary" | "secondary" | "gray" | "red" | "orange" | "amber" | "yellow" | "lime" | "green" | "emerald" | "teal" | "cyan" | "sky" | "blue" | "indigo" | "violet" | "purple" | "fuchsia" | "pink" | "rose" | undefined } = {
            high: "red",
            medium: "yellow",
            low: "green",
        };
        return colors[priority] || "gray";
    }

    function getStatusColor(status: string): "primary" | "secondary" | "gray" | "red" | "orange" | "amber" | "yellow" | "lime" | "green" | "emerald" | "teal" | "cyan" | "sky" | "blue" | "indigo" | "violet" | "purple" | "fuchsia" | "pink" | "rose" | undefined {
        const colors: { [key: string]: "primary" | "secondary" | "gray" | "red" | "orange" | "amber" | "yellow" | "lime" | "green" | "emerald" | "teal" | "cyan" | "sky" | "blue" | "indigo" | "violet" | "purple" | "fuchsia" | "pink" | "rose" | undefined } = {
            completed: "green",
            in_progress: "blue",
            pending: "yellow",
            cancelled: "red",
        };
        return colors[status] || "gray";
    }

    function calculateConversionRate(): number {
        const won =
            analytics.deals.byStage.find((s) => s.stage === "closed_won")
                ?.count || 0;
        const total = analytics.deals.total;
        return total > 0 ? (won / total) * 100 : 0;
    }

    function calculateAvgDealValue(): number {
        return analytics.deals.total > 0
            ? analytics.deals.totalValue / analytics.deals.total
            : 0;
    }
</script>

<div class="p-2 flex flex-col gap-2 bg-gray-50 dark:bg-gray-900 min-h-screen">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-2">
        <div>
            <Heading
                tag="h1"
                class="text-3xl font-bold text-gray-900 dark:text-white flex items-center"
            >
                <ChartMixedOutline class="w-8 h-8 mr-3 text-primary-600" />
                Business Analytics
            </Heading>
            <P class="text-gray-600 dark:text-gray-400 mt-2">
                Comprehensive insights into your CRM performance and business
                metrics
            </P>
        </div>
        {#if analytics.company}
            <div class="text-right">
                <P class="text-sm text-gray-500 dark:text-gray-400">Company</P>
                <Heading
                    tag="h3"
                    class="text-xl font-semibold text-gray-900 dark:text-white flex items-center"
                >
                    <BuildingSolid class="w-5 h-5 mr-2 text-primary-600" />
                    {analytics.company.name}
                </Heading>
                <Badge color="blue" class="mt-1"
                    >{analytics.company.industry}</Badge
                >
            </div>
        {/if}
    </div>

    <!-- Key Performance Indicators -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Revenue -->
        <Card class="border-0 shadow-lg hover:shadow-xl transition-shadow p-2">
            <div class="flex items-center justify-between">
                <div>
                    <P
                        class="text-sm font-medium text-gray-600 dark:text-gray-400"
                        >Total Revenue</P
                    >
                    <Heading
                        tag="h3"
                        class="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                        {formatCurrency(analytics.deals.totalValue)}
                    </Heading>
                    <div class="flex items-center mt-2">
                        <ChartLineUpOutline
                            class="w-4 h-4 text-green-500 mr-1"
                        />
                        <span
                            class="text-sm text-green-600 dark:text-green-400"
                        >
                            {analytics.deals.total} deals
                        </span>
                    </div>
                </div>
                <div
                    class="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg"
                >
                    <DollarOutline class="w-6 h-6 text-white" />
                </div>
            </div>
        </Card>

        <!-- Total Contacts -->
        <Card class="border-0 shadow-lg hover:shadow-xl transition-shadow p-2">
            <div class="flex items-center justify-between">
                <div>
                    <P
                        class="text-sm font-medium text-gray-600 dark:text-gray-400"
                        >Total Contacts</P
                    >
                    <Heading
                        tag="h3"
                        class="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                        {analytics.contacts.total}
                    </Heading>
                    <div class="flex items-center mt-2">
                        <ChartLineUpOutline
                            class="w-4 h-4 text-blue-500 mr-1"
                        />
                        <span class="text-sm text-blue-600 dark:text-blue-400">
                            Active customers
                        </span>
                    </div>
                </div>
                <div
                    class="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg"
                >
                    <UsersSolid class="w-6 h-6 text-white" />
                </div>
            </div>
        </Card>

        <!-- Pending Tasks -->
        <Card class="border-0 shadow-lg hover:shadow-xl transition-shadow p-2">
            <div class="flex items-center justify-between">
                <div>
                    <P
                        class="text-sm font-medium text-gray-600 dark:text-gray-400"
                        >Pending Tasks</P
                    >
                    <Heading
                        tag="h3"
                        class="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                        {analytics.tasks.pending}
                    </Heading>
                    <div class="flex items-center mt-2">
                        {#if analytics.tasks.overdue.length > 0}
                            <ExclamationCircleSolid
                                class="w-4 h-4 text-red-500 mr-1"
                            />
                            <span
                                class="text-sm text-red-600 dark:text-red-400"
                            >
                                {analytics.tasks.overdue.length} overdue
                            </span>
                        {:else}
                            <CheckCircleSolid
                                class="w-4 h-4 text-green-500 mr-1"
                            />
                            <span
                                class="text-sm text-green-600 dark:text-green-400"
                            >
                                On track
                            </span>
                        {/if}
                    </div>
                </div>
                <div
                    class="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg"
                >
                    <ClipboardListSolid class="w-6 h-6 text-white" />
                </div>
            </div>
        </Card>

        <!-- Team Size -->
        <Card class="border-0 shadow-lg hover:shadow-xl transition-shadow p-2">
            <div class="flex items-center justify-between">
                <div>
                    <P
                        class="text-sm font-medium text-gray-600 dark:text-gray-400"
                        >Team Members</P
                    >
                    <Heading
                        tag="h3"
                        class="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                        {analytics.team.total}
                    </Heading>
                    <div class="flex items-center mt-2">
                        <MessagesSolid class="w-4 h-4 text-purple-500 mr-1" />
                        <span
                            class="text-sm text-purple-600 dark:text-purple-400"
                        >
                            Active collaboration
                        </span>
                    </div>
                </div>
                <div
                    class="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
                >
                    <UsersSolid class="w-6 h-6 text-white" />
                </div>
            </div>
        </Card>
    </div>

    <!-- Main Analytics Content -->
    <Tabs style="underline" class="">
        <!-- Sales Analytics -->
        <TabItem open title="Sales Analytics" class="">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <!-- Deal Pipeline -->
                <Card class="p-6 border-0 shadow-lg">
                    <Heading
                        tag="h4"
                        class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center"
                    >
                        <ChartLineUpOutline
                            class="w-5 h-5 mr-2 text-primary-600"
                        />
                        Sales Pipeline
                    </Heading>
                    <div class="space-y-4">
                        {#each analytics.deals.pipeline as stage}
                            <div
                                class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                                <div class="flex items-center space-x-3">
                                    <Badge
                                        color={getStageColor(stage.stage)}
                                        class="capitalize"
                                    >
                                        {stage.stage.replace("_", " ")}
                                    </Badge>
                                    <span
                                        class="font-medium text-gray-900 dark:text-white"
                                    >
                                        {stage.count} deals
                                    </span>
                                </div>
                                <span
                                    class="text-lg font-bold text-gray-900 dark:text-white"
                                >
                                    {formatCurrency(stage.value)}
                                </span>
                            </div>
                        {/each}
                    </div>
                </Card>

                <!-- Sales Metrics -->
                <Card class="p-6 border-0 shadow-lg">
                    <Heading
                        tag="h4"
                        class="text-xl font-semibold text-gray-900 dark:text-white mb-6"
                    >
                        Key Sales Metrics
                    </Heading>
                    <div >
                        <div>
                            <div class="flex justify-between items-center mb-2">
                                <span
                                    class="text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >Conversion Rate</span
                                >
                                <span
                                    class="text-sm font-bold text-gray-900 dark:text-white"
                                >
                                    {calculateConversionRate().toFixed(1)}%
                                </span>
                            </div>
                            <Progressbar
                                progress={calculateConversionRate()}
                                color="green"
                            />
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div
                                class="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg"
                            >
                                <P
                                    class="text-sm text-blue-600 dark:text-blue-400"
                                    >Average Deal Value</P
                                >
                                <Heading
                                    tag="h4"
                                    class="text-lg font-bold text-blue-900 dark:text-blue-100"
                                >
                                    {formatCurrency(calculateAvgDealValue())}
                                </Heading>
                            </div>
                            <div
                                class="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg"
                            >
                                <P
                                    class="text-sm text-green-600 dark:text-green-400"
                                    >Recent Wins</P
                                >
                                <Heading
                                    tag="h4"
                                    class="text-lg font-bold text-green-900 dark:text-green-100"
                                >
                                    {analytics.deals.recentWins.length}
                                </Heading>
                            </div>
                        </div>

                        <!-- Recent Wins -->
                        {#if analytics.deals.recentWins.length > 0}
                            <div>
                                <P
                                    class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
                                    >Latest Wins</P
                                >
                                <div class="space-y-2">
                                    {#each analytics.deals.recentWins.slice(0, 3) as deal}
                                        <div
                                            class="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                                        >
                                            <div>
                                                <P
                                                    class="font-medium text-green-900 dark:text-green-100"
                                                    >{deal.title}</P
                                                >
                                                <P
                                                    class="text-sm text-green-600 dark:text-green-400"
                                                >
                                                    {formatDateRelative(
                                                        deal.updated_at,
                                                    )}
                                                </P>
                                            </div>
                                            <span
                                                class="text-lg font-bold text-green-900 dark:text-green-100"
                                            >
                                                {formatCurrency(deal.value)}
                                            </span>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>
                </Card>
            </div>

            <!-- Top Deals Table -->
            {#if analytics.deals.topDeals.length > 0}
                <Card class="p-6 border-0 shadow-lg">
                    <div class="flex items-center justify-between mb-6">
                        <Heading
                            tag="h4"
                            class="text-xl font-semibold text-gray-900 dark:text-white"
                        >
                            Top Active Deals
                        </Heading>
                        <Button
                            href="/dashboard/deals"
                            size="sm"
                            color="primary"
                        >
                            View All Deals
                            <ArrowRightOutline class="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                    <Table hoverable>
                        <TableHead>
                            <TableHeadCell>Deal</TableHeadCell>
                            <TableHeadCell>Contact</TableHeadCell>
                            <TableHeadCell>Value</TableHeadCell>
                            <TableHeadCell>Stage</TableHeadCell>
                            <TableHeadCell>Probability</TableHeadCell>
                            <TableHeadCell>Owner</TableHeadCell>
                        </TableHead>
                        <TableBody>
                            {#each analytics.deals.topDeals.slice(0, 10) as deal}
                                <TableBodyRow>
                                    <TableBodyCell class="font-medium"
                                        >{deal.title}</TableBodyCell
                                    >
                                    <TableBodyCell
                                        >{deal.contacts?.fullname ||
                                            "N/A"}</TableBodyCell
                                    >
                                    <TableBodyCell class="font-semibold"
                                        >{formatCurrency(
                                            deal.value,
                                        )}</TableBodyCell
                                    >
                                    <TableBodyCell>
                                        <Badge
                                            color={getStageColor(deal.stage)}
                                            class="capitalize"
                                        >
                                            {deal.stage.replace("_", " ")}
                                        </Badge>
                                    </TableBodyCell>
                                    <TableBodyCell
                                        >{deal.probability || 0}%</TableBodyCell
                                    >
                                    <TableBodyCell
                                        >{deal.profiles?.fullname ||
                                            "Unassigned"}</TableBodyCell
                                    >
                                </TableBodyRow>
                            {/each}
                        </TableBody>
                    </Table>
                </Card>
            {/if}
        </TabItem>

        <!-- Customer Analytics -->
        <TabItem title="Customer Analytics" >
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <!-- Contact Growth -->
                <Card class="p-6 border-0 shadow-lg">
                    <Heading
                        tag="h4"
                        class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center"
                    >
                        <UsersSolid class="w-5 h-5 mr-2 text-primary-600" />
                        Contact Growth
                    </Heading>
                    {#if analytics.contacts.byMonth.length > 0}
                        <div class="space-y-3">
                            {#each analytics.contacts.byMonth.slice(-6) as month}
                                <div
                                    class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                    <span
                                        class="font-medium text-gray-900 dark:text-white"
                                        >{month.month}</span
                                    >
                                    <div class="flex items-center space-x-2">
                                        <Progressbar
                                            progress={(month.count /
                                                Math.max(
                                                    ...analytics.contacts.byMonth.map(
                                                        (m) => m.count,
                                                    ),
                                                )) *
                                                100}
                                            size="sm"
                                            class="w-20"
                                        />
                                        <span
                                            class="text-sm font-semibold text-gray-700 dark:text-gray-300"
                                            >{month.count}</span
                                        >
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <P
                            class="text-gray-500 dark:text-gray-400 text-center py-8"
                            >No contact data available</P
                        >
                    {/if}
                </Card>

                <!-- Recent Interactions -->
                <Card class="p-6 border-0 shadow-lg">
                    <Heading
                        tag="h4"
                        class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center"
                    >
                        <MessagesSolid class="w-5 h-5 mr-2 text-primary-600" />
                        Recent Interactions
                    </Heading>
                    {#if analytics.interactions.recent.length > 0}
                        <div class="space-y-3">
                            {#each analytics.interactions.recent.slice(0, 5) as interaction}
                                <div
                                    class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                    <div
                                        class="flex items-center justify-between mb-2"
                                    >
                                        <Badge color="blue" class="capitalize"
                                            >{interaction.type}</Badge
                                        >
                                        <span
                                            class="text-xs text-gray-500 dark:text-gray-400"
                                        >
                                            {formatDateRelative(
                                                interaction.created_at,
                                            )}
                                        </span>
                                    </div>
                                    <P
                                        class="text-sm text-gray-700 dark:text-gray-300 mb-2"
                                    >
                                        {interaction.note ||
                                            "No notes provided"}
                                    </P>
                                    {#if interaction.deals}
                                        <P
                                            class="text-xs text-blue-600 dark:text-blue-400"
                                        >
                                            Related to: {interaction.deals
                                                .title} ({formatCurrency(
                                                interaction.deals.value,
                                            )})
                                        </P>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <P
                            class="text-gray-500 dark:text-gray-400 text-center py-8"
                            >No recent interactions</P
                        >
                    {/if}
                </Card>
            </div>

            <!-- Interaction Types -->
            {#if analytics.interactions.byType.length > 0}
                <Card class="p-6 border-0 shadow-lg">
                    <Heading
                        tag="h4"
                        class="text-xl font-semibold text-gray-900 dark:text-white mb-6"
                    >
                        Interaction Types Distribution
                    </Heading>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {#each analytics.interactions.byType as type}
                            <div
                                class="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg"
                            >
                                <Heading
                                    tag="h4"
                                    class="text-2xl font-bold text-gray-900 dark:text-white"
                                >
                                    {type.count}
                                </Heading>
                                <P
                                    class="text-sm text-gray-600 dark:text-gray-400 capitalize"
                                    >{type.type}</P
                                >
                            </div>
                        {/each}
                    </div>
                </Card>
            {/if}
        </TabItem>

        <!-- Team Performance -->
        <TabItem title="Team Performance" >
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <!-- Top Performers -->
                <Card class="p-6 border-0 shadow-lg">
                    <Heading
                        tag="h4"
                        class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center"
                    >
                        <ChartLineUpOutline
                            class="w-5 h-5 mr-2 text-primary-600"
                        />
                        Top Performers
                    </Heading>
                    {#if analytics.team.topPerformers.length > 0}
                        <div class="space-y-4">
                            {#each analytics.team.topPerformers as performer, index}
                                <div
                                    class="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg"
                                >
                                    <div class="flex-shrink-0">
                                        <div
                                            class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold"
                                        >
                                            #{index + 1}
                                        </div>
                                    </div>
                                    <div class="flex-1">
                                        <P
                                            class="font-semibold text-gray-900 dark:text-white"
                                            >{performer.fullname}</P
                                        >
                                        <P
                                            class="text-sm text-gray-600 dark:text-gray-400 capitalize"
                                            >{performer.role}</P
                                        >
                                    </div>
                                    <div class="text-right">
                                        <P
                                            class="font-bold text-gray-900 dark:text-white"
                                            >{formatCurrency(
                                                performer.dealsValue,
                                            )}</P
                                        >
                                        <P
                                            class="text-sm text-gray-600 dark:text-gray-400"
                                            >{performer.dealsCount} deals</P
                                        >
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <P
                            class="text-gray-500 dark:text-gray-400 text-center py-8"
                            >No performance data available</P
                        >
                    {/if}
                </Card>

                <!-- Team Overview -->
                <Card class="p-6 border-0 shadow-lg">
                    <Heading
                        tag="h4"
                        class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center"
                    >
                        <UsersSolid class="w-5 h-5 mr-2 text-primary-600" />
                        Team Overview
                    </Heading>
                    {#if analytics.team.members.length > 0}
                        <div class="space-y-3">
                            {#each analytics.team.members.slice(0, 8) as member}
                                <div
                                    class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                    <div class="flex items-center space-x-3">
                                        <Avatar
                                            size="sm"
                                            class="ring-2 ring-white dark:ring-gray-800"
                                        >
                                            <div
                                                class="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                                            >
                                                {member.fullname
                                                    .split(" ")
                                                    .map((n:string) => n[0])
                                                    .join("")}
                                            </div>
                                        </Avatar>
                                        <div>
                                            <P
                                                class="font-medium text-gray-900 dark:text-white"
                                                >{member.fullname}</P
                                            >
                                            <P
                                                class="text-sm text-gray-600 dark:text-gray-400 capitalize"
                                                >{member.role}</P
                                            >
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <P
                                            class="text-sm font-semibold text-gray-900 dark:text-white"
                                        >
                                            {member.dealsCount} deals
                                        </P>
                                        <P
                                            class="text-xs text-gray-600 dark:text-gray-400"
                                        >
                                            {formatCurrency(member.dealsValue)}
                                        </P>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <P
                            class="text-gray-500 dark:text-gray-400 text-center py-8"
                            >No team data available</P
                        >
                    {/if}
                </Card>
            </div>
        </TabItem>

        <!-- Task Management -->
        <TabItem title="Task Management" >
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <!-- Task Status Overview -->
                <Card class="p-6 border-0 shadow-lg">
                    <Heading
                        tag="h4"
                        class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center"
                    >
                        <ClipboardListSolid
                            class="w-5 h-5 mr-2 text-primary-600"
                        />
                        Task Status Overview
                    </Heading>
                    {#if analytics.tasks.byStatus.length > 0}
                        <div class="space-y-4">
                            {#each analytics.tasks.byStatus as status}
                                <div
                                    class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                    <div class="flex items-center space-x-3">
                                        <Badge
                                            color={getStatusColor(
                                                status.status,
                                            )}
                                            class="capitalize"
                                        >
                                            {status.status.replace("_", " ")}
                                        </Badge>
                                        <span
                                            class="font-medium text-gray-900 dark:text-white"
                                        >
                                            {status.count} tasks
                                        </span>
                                    </div>
                                    <Progressbar
                                        progress={(status.count /
                                            analytics.tasks.total) *
                                            100}
                                        size="sm"
                                        class="w-24"
                                        color={getStatusColor(status.status)}
                                    />
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <P
                            class="text-gray-500 dark:text-gray-400 text-center py-8"
                            >No task data available</P
                        >
                    {/if}
                </Card>

                <!-- Upcoming Tasks -->
                <Card class="p-6 border-0 shadow-lg">
                    <Heading
                        tag="h4"
                        class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center"
                    >
                        <CalendarWeekSolid
                            class="w-5 h-5 mr-2 text-primary-600"
                        />
                        Upcoming Tasks
                    </Heading>
                    {#if analytics.tasks.upcoming.length > 0}
                        <div class="space-y-3">
                            {#each analytics.tasks.upcoming.slice(0, 6) as task}
                                <div
                                    class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                    <div
                                        class="flex items-center justify-between mb-2"
                                    >
                                        <P
                                            class="font-medium text-gray-900 dark:text-white"
                                            >{task.title}</P
                                        >
                                        <Badge
                                            color={getPriorityColor(
                                                task.priority,
                                            )}
                                            class="capitalize"
                                        >
                                            {task.priority}
                                        </Badge>
                                    </div>
                                    <P
                                        class="text-sm text-gray-600 dark:text-gray-400 mb-2"
                                    >
                                        {task.description || "No description"}
                                    </P>
                                    <div
                                        class="flex items-center justify-between"
                                    >
                                        <P
                                            class="text-xs text-gray-500 dark:text-gray-400"
                                        >
                                            Due: {formatDate(task.due_date)}
                                        </P>
                                        {#if task.assignedToProfile?.[0]}
                                            <P
                                                class="text-xs text-blue-600 dark:text-blue-400"
                                            >
                                                Assigned to: {task
                                                    .assignedToProfile[0]
                                                    .fullname}
                                            </P>
                                        {/if}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <P
                            class="text-gray-500 dark:text-gray-400 text-center py-8"
                            >No upcoming tasks</P
                        >
                    {/if}
                </Card>
            </div>

            <!-- Overdue Tasks Alert -->
            {#if analytics.tasks.overdue.length > 0}
                <Card
                    class="p-6 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20"
                >
                    <div class="flex items-center space-x-3 mb-4">
                        <ExclamationCircleSolid class="w-6 h-6 text-red-500" />
                        <Heading
                            tag="h4"
                            class="text-xl font-semibold text-red-900 dark:text-red-100"
                        >
                            Overdue Tasks ({analytics.tasks.overdue.length})
                        </Heading>
                    </div>
                    <div class="space-y-3">
                        {#each analytics.tasks.overdue.slice(0, 5) as task}
                            <div
                                class="p-3 bg-white dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800"
                            >
                                <div
                                    class="flex items-center justify-between mb-1"
                                >
                                    <P
                                        class="font-medium text-red-900 dark:text-red-100"
                                        >{task.title}</P
                                    >
                                    <Badge color="red" class="capitalize"
                                        >{task.priority}</Badge
                                    >
                                </div>
                                <P
                                    class="text-sm text-red-700 dark:text-red-300"
                                >
                                    Due: {formatDate(task.due_date)} ({formatDateRelative(
                                        task.due_date,
                                    )})
                                </P>
                            </div>
                        {/each}
                        {#if analytics.tasks.overdue.length > 5}
                            <Button
                                href="/dashboard/tasks"
                                color="red"
                                class="w-full"
                            >
                                View All {analytics.tasks.overdue.length} Overdue
                                Tasks
                            </Button>
                        {/if}
                    </div>
                </Card>
            {/if}
        </TabItem>

        <!-- Products Analytics -->
        <TabItem title="Products" >
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <!-- Product Overview -->
                <Card class="p-6 border-0 shadow-lg">
                    <Heading
                        tag="h4"
                        class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center"
                    >
                        <ShoppingBagSolid
                            class="w-5 h-5 mr-2 text-primary-600"
                        />
                        Product Portfolio
                    </Heading>
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div
                            class="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg"
                        >
                            <Heading
                                tag="h4"
                                class="text-2xl font-bold text-green-900 dark:text-green-100"
                            >
                                {analytics.products.total}
                            </Heading>
                            <P
                                class="text-sm text-green-600 dark:text-green-400"
                                >Total Products</P
                            >
                        </div>
                        <div
                            class="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg"
                        >
                            <Heading
                                tag="h4"
                                class="text-2xl font-bold text-blue-900 dark:text-blue-100"
                            >
                                {formatCurrency(analytics.products.totalValue)}
                            </Heading>
                            <P class="text-sm text-blue-600 dark:text-blue-400"
                                >Total Value</P
                            >
                        </div>
                    </div>

                    {#if analytics.products.list.length > 0}
                        <div class="space-y-3">
                            {#each analytics.products.list.slice(0, 5) as product}
                                <div
                                    class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                    <div
                                        class="flex items-center justify-between"
                                    >
                                        <div>
                                            <P
                                                class="font-medium text-gray-900 dark:text-white"
                                                >{product.name}</P
                                            >
                                            <P
                                                class="text-sm text-gray-600 dark:text-gray-400"
                                            >
                                                {product.description?.slice(
                                                    0,
                                                    60,
                                                )}...
                                            </P>
                                        </div>
                                        <P
                                            class="text-lg font-bold text-gray-900 dark:text-white"
                                        >
                                            {formatCurrency(product.unit_price)}
                                        </P>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </Card>

                <!-- Top Performing Products -->
                <Card class="p-6 border-0 shadow-lg">
                    <Heading
                        tag="h4"
                        class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center"
                    >
                        <ChartLineUpOutline
                            class="w-5 h-5 mr-2 text-primary-600"
                        />
                        Top Performing Products
                    </Heading>
                    {#if analytics.products.topPerforming.length > 0}
                        <div class="space-y-4">
                            {#each analytics.products.topPerforming as product, index}
                                <div
                                    class="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg"
                                >
                                    <div class="flex-shrink-0">
                                        <div
                                            class="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold"
                                        >
                                            #{index + 1}
                                        </div>
                                    </div>
                                    <div class="flex-1">
                                        <P
                                            class="font-semibold text-gray-900 dark:text-white"
                                            >{product.name}</P
                                        >
                                        <P
                                            class="text-sm text-gray-600 dark:text-gray-400"
                                        >
                                            {product.sales} sales
                                        </P>
                                    </div>
                                    <div class="text-right">
                                        <P
                                            class="font-bold text-gray-900 dark:text-white"
                                        >
                                            {formatCurrency(product.revenue)}
                                        </P>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <P
                            class="text-gray-500 dark:text-gray-400 text-center py-8"
                            >No sales data available</P
                        >
                    {/if}
                </Card>
            </div>
        </TabItem>
    </Tabs>
</div>
