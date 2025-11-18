<script lang="ts">
    import { Button, Card, Badge, Avatar, Heading, P } from "flowbite-svelte";
    import {
        ShieldCheckSolid,
        UsersSolid,
        UsersGroupSolid,
        BellSolid,
        ArrowRightOutline,
        PlaySolid,
        StarSolid,
        BrainSolid,
        AtomOutline,
    } from "flowbite-svelte-icons";
    import previewImg from "$lib/assets/Ecommerce web page-rafiki.png";

    const features = [
        {
            icon: UsersSolid,
            title: "Smart Contact Management",
            desc: "Centralize all customer data with intelligent organization, company associations, and relationship mapping.",
            highlight: "AI-Powered",
        },
        {
            icon: UsersGroupSolid,
            title: "Team Collaboration",
            desc: "Real-time chat rooms, file sharing, and seamless communication across your entire organization.",
            highlight: "Real-time",
        },
        {
            icon: AtomOutline,
            title: "Interaction Tracking",
            desc: "Complete customer journey visibility with automated activity logging and interaction history.",
            highlight: "Analytics",
        },
        {
            icon: BellSolid,
            title: "Smart Notifications",
            desc: "Never miss important updates with intelligent notification system and task reminders.",
            highlight: "Automated",
        },
        {
            icon: BrainSolid,
            title: "AI Integration",
            desc: "Leverage artificial intelligence for customer insights, recommendations, and automated workflows.",
            highlight: "AI-Driven",
        },
        {
            icon: ShieldCheckSolid,
            title: "Enterprise Security",
            desc: "Multi-tenant architecture with role-based access control and company-level data isolation.",
            highlight: "Secure",
        },
    ];

    const testimonials = [
        {
            name: "Sarah Johnson",
            role: "Sales Director",
            company: "TechFlow Solutions",
            content:
                "This CRM transformed how our team collaborates. The real-time chat integration is game-changing.",
            rating: 5,
        },
        {
            name: "Michael Chen",
            role: "Account Manager",
            company: "Digital Dynamics",
            content:
                "Finally, a CRM that doesn't feel like a burden. The AI features save us hours every week.",
            rating: 5,
        },
        {
            name: "Emily Rodriguez",
            role: "Customer Success",
            company: "Growth Partners",
            content:
                "The interaction tracking gives us complete visibility into our customer relationships.",
            rating: 5,
        },
    ];

    const stats = [
        { value: "500+", label: "Companies Trust Us" },
        { value: "25k+", label: "Contacts Managed" },
        { value: "99.9%", label: "Uptime Guarantee" },
        { value: "4.9★", label: "Customer Rating" },
    ];
</script>

<article
    class="min-h-screen-50 mt-15 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900"
>
    <!-- Hero Section -->
    <section
        class="w-full flex flex-row items-center justify-between max-w-7xl mx-auto p-2 gap-2"
    >
        <!-- Hero Content -->
        <div class=" w-1/2 flex flex-col gap-8 max-w-lg">
            <Badge color="primary" class="w-fit">
                <span class="flex items-center gap-2">
                    <span
                        class="w-2 h-2 bg-green-400 rounded-full animate-pulse"
                    ></span>
                    AI-Powered CRM Platform
                </span>
            </Badge>

            <Heading
                tag="h1"
                class="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-primary-600 to-blue-600 bg-clip-text text-transparent dark:from-white dark:via-primary-400 dark:to-blue-400"
            >
                The Future of Customer Relationship Management
            </Heading>

            <P
                class="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg"
            >
                Streamline your sales process with intelligent automation,
                real-time collaboration, and comprehensive customer insights.
                Built for modern teams who demand excellence.
            </P>

            <!-- CTA Buttons -->
            <div class="flex flex-col sm:flex-row gap-4">
                <Button
                    size="xl"
                    color="primary"
                    href="/auth"
                    class="p-2 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                >
                    Start Free Trial
                    <ArrowRightOutline class="w-5 h-5 ml-2" />
                </Button>
                <Button
                    size="xl"
                    color="light"
                    class="p-2 text-lg font-semibold border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                    <PlaySolid class="w-5 h-5 mr-2" />
                    Watch Demo
                </Button>
            </div>
        </div>

        <!-- Hero Image -->
        <div
            class="h-fit bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-xl flex-1 grid place-items-center"
        >
            <img
                alt="CRM Dashboard Preview"
                src={previewImg}
                class="w-150 h-full object-cover rounded-2xl"
            />
        </div>
    </section>

    <!-- Stats Section -->
    <section
        class="py-16 bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700 flex justify-center items-center"
    >
        {#each stats as stat}
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col">
                <Heading
                    tag="h3"
                    class="text-4xl font-bold text-primary-600 dark:text-primary-400"
                >
                    {stat.value}
                </Heading>
                <P class="text-gray-600 dark:text-gray-400 mt-2 font-medium">
                    {stat.label}
                </P>
            </div>
        {/each}
    </section>

    <!-- Features Section -->
    <section
        class="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
    >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center space-y-4 mb-16">
                <Badge color="primary" class="w-fit mx-auto">Features</Badge>
                <Heading
                    tag="h2"
                    class="text-4xl font-bold text-gray-900 dark:text-white"
                >
                    Everything you need to succeed
                </Heading>
                <P
                    class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
                >
                    Comprehensive CRM features designed for modern businesses.
                    From AI-powered insights to real-time collaboration, we've
                    got you covered.
                </P>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {#each features as feature}
                    <Card
                        class="p-8 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg bg-white dark:bg-gray-800"
                    >
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <div
                                    class="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg"
                                >
                                    <svelte:component
                                        this={feature.icon}
                                        class="w-7 h-7 text-white"
                                    />
                                </div>
                                <Badge color="green" class="text-xs">
                                    {feature.highlight}
                                </Badge>
                            </div>

                            <div class="space-y-2">
                                <Heading
                                    tag="h3"
                                    class="text-xl font-bold text-gray-900 dark:text-white"
                                >
                                    {feature.title}
                                </Heading>
                                <P
                                    class="text-gray-600 dark:text-gray-300 leading-relaxed"
                                >
                                    {feature.desc}
                                </P>
                            </div>
                        </div>
                    </Card>
                {/each}
            </div>
        </div>
    </section>

    <!-- Testimonials Section -->
    <section class="py-20 bg-white dark:bg-gray-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center space-y-4 mb-16">
                <Badge color="primary" class="w-fit mx-auto">Testimonials</Badge
                >
                <Heading
                    tag="h2"
                    class="text-4xl font-bold text-gray-900 dark:text-white"
                >
                    Loved by teams worldwide
                </Heading>
                <P class="text-xl text-center text-gray-600 dark:text-gray-300">
                    See what our customers say about their experience
                </P>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {#each testimonials as testimonial}
                    <Card
                        class="p-8 hover:shadow-xl transition-all duration-300 border-1 shadow-lg"
                    >
                        <div class="space-y-6">
                            <div class="flex gap-1">
                                {#each Array(testimonial.rating) as _}
                                    <StarSolid
                                        class="w-5 h-5 text-yellow-400"
                                    />
                                {/each}
                            </div>

                            <P
                                class="text-gray-700 dark:text-gray-300 leading-relaxed italic"
                            >
                                "{testimonial.content}"
                            </P>

                            <div class="flex items-center gap-4">
                                <Avatar size="md">
                                    <div
                                        class="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold"
                                    >
                                        {testimonial.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                    </div>
                                </Avatar>
                                <div>
                                    <P
                                        class="font-semibold text-gray-900 dark:text-white"
                                    >
                                        {testimonial.name}
                                    </P>
                                    <P
                                        class="text-sm text-gray-600 dark:text-gray-400"
                                    >
                                        {testimonial.role} at {testimonial.company}
                                    </P>
                                </div>
                            </div>
                        </div>
                    </Card>
                {/each}
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section
        class="py-20 bg-gradient-to-r from-primary-600 via-blue-600 to-purple-600 relative overflow-hidden"
    >
        <div class="absolute inset-0 bg-black/20"></div>
        <div
            class="absolute inset-0 bg-gradient-to-br from-primary-500/30 via-transparent to-blue-500/30"
        ></div>

        <div
            class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
            <div class="space-y-8">
                <div class="space-y-4">
                    <Heading
                        tag="h2"
                        class="text-4xl lg:text-5xl font-bold text-white"
                    >
                        Ready to transform your sales process?
                    </Heading>
                    <P class="text-xl text-blue-100 max-w-2xl mx-auto">
                        Join thousands of companies already using our CRM to
                        build better customer relationships and drive more
                        revenue.
                    </P>
                </div>

                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        size="xl"
                        color="primary"
                        href="/auth"
                        class="px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                    >
                        Start Your Journey
                        <ArrowRightOutline class="w-5 h-5 ml-2" />
                    </Button>
                    
                </div>
            </div>
        </div>
    </section>
</article>
