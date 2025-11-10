<script lang="ts">
  import { Button, Input, Label, Banner, P } from "flowbite-svelte";
  import { enhance } from "$app/forms";

  let { data, form } = $props();
  
</script>

<main
  class="flex-grow container mx-auto py-1.3 px-2 overflow-y-auto max-h-[calc(100vh-80px)]"
>
  <div class="space-y-7">
    <!-- Section 1: Profile photo -->
    <section>
      <h3 class="text-lg font-bold mb-4 border-b border-border-dark pb-2">
        My Profile
      </h3>

      <div class="flex items-center gap-6">
        <div class="relative">
          <div
            class="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-20"
            style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuC7JdpPWffMWb_ngjqoqY37UU19ZUY89pGOwGhJe7gk0sC1mGgtDJNdcY338llfFLXlTb6NotEuzj5QfjLteMg9J7I9BtM8_TOgyIeAv-n8YCOEwaxgY7jAebq_BU76QjGahx-hxKLmnDWrU6JTbux1Iz8ETccl-GCjhVdUQKokJiDc452Lf8lqrPLKGlr5D0Un1HWFJqUpag0kN2WJUkyd-oO9NEMnDAX3QtDnEJp5OWiew4hJJ-Wc7FiWM8ZCvZVoXDjkSWM0EAU');"
          ></div>
        </div>

        <div class="flex-grow">
          <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button
              color="primary"
              class="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium h-10 px-4 py-2 bg-primary text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              Update Photo
            </Button>

            <Button
              color="blue"
              class="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium h-10 px-4 py-2 bg-subtle-dark text-foreground-dark hover:bg-subtle-dark/80 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              Delete Photo
            </Button>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 2: User info -->
    <section>
      <h3 class="text-lg font-bold mb-4 border-b border-border-dark pb-2">
        User Information
      </h3>

      <!-- FORM START -->
      <form
        action="?/update_profile"
        method="POST"
        use:enhance 
        class="space-y-6"
      >
        <input type="hidden" name="action" value="edit" />

        <div>
          <Label class="block text-sm font-medium mb-2" for="fullname">
            Full Name
          </Label>
          <Input
            id="fullname"
            name="fullname"
            type="text"
            value={data.user.fullname}
            class="form-input block w-full rounded-lg border-border-dark bg-subtle-dark focus:border-primary focus:ring-primary text-foreground-dark placeholder:text-muted-dark"
          />
        </div>

        <div>
          <Label class="block text-sm font-medium mb-2" for="email">
            Email Address
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={data.user.email}
            class="form-input block w-full rounded-lg border-border-dark bg-subtle-dark focus:border-primary focus:ring-primary text-foreground-dark placeholder:text-muted-dark"
          />
        </div>

        <div>
          <Label class="block text-sm font-medium mb-2" for="phone">
            Phone Number
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={data.user.phone}
            class="form-input block w-full rounded-lg border-border-dark bg-subtle-dark focus:border-primary focus:ring-primary text-foreground-dark placeholder:text-muted-dark"
          />
        </div>

        <!-- BUTTONS -->
        <div class="mt-8 pt-8 border-t border-border-dark flex justify-end gap-4">
          <Button
            type="button"
            color="red"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium h-10 px-4 py-2 bg-transparent text-muted-dark hover:bg-subtle-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            color="primary"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium h-10 px-4 py-2 bg-primary text-background-dark font-semibold shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
          
            >
            Save Changes
          </Button>
        </div>

         {#if form?.error}
            <Banner color="red" class="mb-4">
                <P class="font-medium text-red-800">{form.error}</P>
            </Banner>
        {/if}

        {#if form?.success}
            <Banner color="green" class="mb-4">
                <P class="font-medium text-green-800">{form.success}</P>
            </Banner>
        {/if}

      </form>

      <!-- Section 3: Change Company -->
    <!-- <section>
      <h3 class="text-lg font-bold mb-4 border-b border-border-dark pb-2">
        Company Information
      </h3>

      <form
        action="?/change_company"
        method="POST"
        use:enhance
        class="space-y-6"
      >
        <div>
          <Label class="block text-sm font-medium mb-2" for="company">
            Company Name
          </Label>
          <Input
            id="company"
            name="company"
            type="text"
            value={data.user.company}
            class="form-input block w-full rounded-lg border-border-dark bg-subtle-dark focus:border-primary focus:ring-primary text-foreground-dark placeholder:text-muted-dark"
          />
        </div>

           ---BUTTONS--- 
        <div class="mt-8 pt-8 border-t border-border-dark flex justify-end gap-4">
          <Button
            type="button"
            color="red"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium h-10 px-4 py-2 bg-transparent text-muted-dark hover:bg-subtle-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            color="primary"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium h-10 px-4 py-2 bg-primary text-background-dark font-semibold shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            Change Company
          </Button>
        </div>

        {#if form?.error}
          <Banner color="red" class="mb-4">
            <P class="font-medium text-red-800">{form.error}</P>
          </Banner>
        {/if}

        {#if form?.success}
          <Banner color="green" class="mb-4">
            <P class="font-medium text-green-800">{form.success}</P>
          </Banner>
        {/if}
      </form>
    </section> -->





      
    </section>
  </div>
</main>
