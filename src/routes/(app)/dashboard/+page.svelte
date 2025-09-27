<script lang="ts">
    import { 
        Card, 
        Heading, 
        P, 
        Button, 
        Badge, 
        Avatar, 
        Progressbar,
        Alert
    } from "flowbite-svelte";
    import { 
        UserSolid, 
        CommandOutline, 
        PlusOutline,
        ArrowUpOutline,
        ClockSolid,
        EyeSolid,
        CogSolid,
        ChartPieSolid
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
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) return "just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }

    // Quick actions
    const quickActions = [
        { 
            title: "Add User", 
            description: "Invite new team member", 
            icon: UserSolid, 
            color: "blue",
            href: "/dashboard/users"
        },
        { 
            title: "Create Room", 
            description: "Start new conversation", 
            icon: CommandOutline, 
            color: "green",
            href: "/dashboard/rooms"
        },
        { 
            title: "View Reports", 
            description: "Analytics & insights", 
            icon: ChartPieSolid, 
            color: "purple",
            href: "/dashboard/reports"
        },
        { 
            title: "Settings", 
            description: "Configure your workspace", 
            icon: CogSolid, 
            color: "gray",
            href: "/dashboard/settings"
        }
    ];
</script>

<div class="min-h-full w-full p-6 bg-gray-50 dark:bg-gray-900">
    <!-- Welcome Header -->
    <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
            <div>
                <Heading tag="h1" class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {getGreeting()}, {data.user?.fullname}! 👋
                </Heading>
                <P class="text-lg text-gray-600 dark:text-gray-300">
                    Welcome back to your dashboard. Here's what's happening today.
                </P>
            </div>
            <div class="hidden md:flex items-center space-x-3">
                <Badge color="green" class="px-3 py-1">
                    <div class="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Online
                </Badge>
            </div>
        </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Total Users Card -->
        <Card class="p-6 hover:shadow-lg transition-shadow duration-200">
            <div class="flex items-center justify-between">
                <div>
                    <P class="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Total Users
                    </P>
                    <Heading tag="h3" class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {data.stats?.totalUsers || 0}
                    </Heading>
                    {#if data.stats?.newUsersThisWeek > 0}
                        <div class="flex items-center mt-2">
                            <ArrowUpOutline class="w-4 h-4 text-green-500 mr-1" />
                            <span class="text-sm text-green-600 dark:text-green-400 font-medium">
                                +{data.stats.newUsersThisWeek} this week
                            </span>
                        </div>
                    {/if}
                </div>
                <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <UserSolid class="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
            </div>
        </Card>

        <!-- Total Rooms Card -->
        <Card class="p-6 hover:shadow-lg transition-shadow duration-200">
            <div class="flex items-center justify-between">
                <div>
                    <P class="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Chat Rooms
                    </P>
                    <Heading tag="h3" class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {data.stats?.totalRooms || 0}
                    </Heading>
                    <P class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Active conversations
                    </P>
                </div>
                <div class="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                    <CommandOutline class="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
            </div>
        </Card>

        <!-- User Roles Card -->
        <Card class="p-6 hover:shadow-lg transition-shadow duration-200">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <P class="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Team Roles
                    </P>
                </div>
                <div class="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <ChartPieSolid class="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
            </div>
            <div class="space-y-3">
                {#if data.stats?.roleDistribution?.admin}
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-300">Admins</span>
                        <Badge color="red">{data.stats.roleDistribution.admin}</Badge>
                    </div>
                {/if}
                {#if data.stats?.roleDistribution?.user}
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-300">Users</span>
                        <Badge color="blue">{data.stats.roleDistribution.user}</Badge>
                    </div>
                {/if}
            </div>
        </Card>

        <!-- Activity Card -->
        <Card class="p-6 hover:shadow-lg transition-shadow duration-200">
            <div class="flex items-center justify-between">
                <div>
                    <P class="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Activity
                    </P>
                    <Heading tag="h3" class="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                        {data.stats?.totalMessages || 'No data'}
                    </Heading>
                    <P class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Recent messages
                    </P>
                </div>
                <div class="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                    <ClockSolid class="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
            </div>
        </Card>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Quick Actions -->
        <div class="lg:col-span-1">
            <Card class="p-6">
                <div class="flex items-center justify-between mb-6">
                    <Heading tag="h4" class="text-xl font-semibold text-gray-900 dark:text-white">
                        Quick Actions
                    </Heading>
                    <PlusOutline class="w-5 h-5 text-gray-400" />
                </div>
                
                <div class="space-y-4">
                    {#each quickActions as action}
                        <Button 
                            href={action.href}
                            color="gray" 
                            class="w-full justify-start p-4 h-auto hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <div class="flex items-center space-x-4">
                                <div class="p-2 bg-{action.color}-100 dark:bg-{action.color}-900 rounded-lg">
                                    <svelte:component this={action.icon} class="w-5 h-5 text-{action.color}-600 dark:text-{action.color}-400" />
                                </div>
                                <div class="text-left">
                                    <P class="font-medium text-gray-900 dark:text-white">
                                        {action.title}
                                    </P>
                                    <P class="text-sm text-gray-500 dark:text-gray-400">
                                        {action.description}
                                    </P>
                                </div>
                            </div>
                        </Button>
                    {/each}
                </div>
            </Card>
        </div>

        <!-- Recent Activity -->
        <div class="lg:col-span-2">
            <div class="space-y-6">
                <!-- Recent Messages -->
                <Card class="p-6">
                    <div class="flex items-center justify-between mb-6">
                        <Heading tag="h4" class="text-xl font-semibold text-gray-900 dark:text-white">
                            Recent Messages
                        </Heading>
                        <Button href="/dashboard/rooms" size="sm" color="primary">
                            View All
                            <EyeSolid class="w-4 h-4 ml-2" />
                        </Button>
                    </div>

                    <div class="space-y-4">
                        {#if data.recentMessages && data.recentMessages.length > 0}
                            {#each data.recentMessages as message}
                                <div class="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <Avatar size="sm" />
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center justify-between">
                                            <P class="font-medium text-gray-900 dark:text-white truncate">
                                                {message.profiles?.fullname || 'Unknown User'}
                                            </P>
                                            <span class="text-xs text-gray-500 dark:text-gray-400">
                                                {formatTimeAgo(message.send_at)}
                                            </span>
                                        </div>
                                        <P class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                            in #{message.rooms?.name || 'Unknown Room'}
                                        </P>
                                        <P class="text-sm text-gray-800 dark:text-gray-200 mt-2 line-clamp-2">
                                            {message.content}
                                        </P>
                                    </div>
                                </div>
                            {/each}
                        {:else}
                            <div class="text-center py-8">
                                <CommandOutline class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <P class="text-gray-500 dark:text-gray-400">
                                    No recent messages. Start a conversation!
                                </P>
                                <Button href="/dashboard/rooms" class="mt-4">
                                    Go to Rooms
                                </Button>
                            </div>
                        {/if}
                    </div>
                </Card>

                <!-- Team Members Preview -->
                <Card class="p-6">
                    <div class="flex items-center justify-between mb-6">
                        <Heading tag="h4" class="text-xl font-semibold text-gray-900 dark:text-white">
                            Team Members
                        </Heading>
                        <Button href="/dashboard/users" size="sm" color="primary">
                            Manage Users
                            <EyeSolid class="w-4 h-4 ml-2" />
                        </Button>
                    </div>

                    <div class="space-y-3">
                        {#if data.recentUsers && data.recentUsers.length > 0}
                            {#each data.recentUsers as user}
                                <div class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <div class="flex items-center space-x-3">
                                        <Avatar size="sm" />
                                        <div>
                                            <P class="font-medium text-gray-900 dark:text-white">
                                                {user.fullname}
                                            </P>
                                            <P class="text-sm text-gray-500 dark:text-gray-400">
                                                {user.role || 'user'}
                                            </P>
                                        </div>
                                    </div>
                                    <Badge color={user.role === 'admin' ? 'red' : 'blue'}>
                                        {user.role || 'user'}
                                    </Badge>
                                </div>
                            {/each}
                        {:else}
                            <div class="text-center py-6">
                                <UserSolid class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <P class="text-gray-500 dark:text-gray-400">
                                    No team members yet.
                                </P>
                                <Button href="/dashboard/users" class="mt-3">
                                    Add Users
                                </Button>
                            </div>
                        {/if}
                    </div>
                </Card>
            </div>
        </div>
    </div>

    <!-- Welcome Tips for New Users -->
    {#if data.stats?.totalUsers === 1}
        <Alert class="mt-8" color="blue">
            <div class="flex items-start">
                <div class="flex-1">
                    <Heading tag="h5" class="font-medium text-blue-800 dark:text-blue-200 mb-2">
                        🎉 Welcome to your new CRM!
                    </Heading>
                    <P class="text-blue-700 dark:text-blue-300 mb-3">
                        Get started by adding your team members and creating your first chat room.
                    </P>
                    <div class="flex space-x-3">
                        <Button href="/dashboard/users" size="sm" color="blue">
                            Add Team Members
                        </Button>
                        <Button href="/dashboard/rooms" size="sm" color="gray">
                            Create Room
                        </Button>
                    </div>
                </div>
            </div>
        </Alert>
    {/if}
</div>
