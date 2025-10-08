<script lang="ts">
  import {Button, Input, Label} from 'flowbite-svelte';
  let {data}= $props();
</script>


<main class="flex-grow container mx-auto py-1.3 px-2  overflow-y-visible">

   

    <div class="space-y-7">

        <section>

          <h3 class="text-lg font-bold mb-4 border-b border-border-dark pb-2">My Profile</h3>

          <div class="flex items-center gap-6">

              <div class="relative">

                  <div class="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-20" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuC7JdpPWffMWb_ngjqoqY37UU19ZUY89pGOwGhJe7gk0sC1mGgtDJNdcY338llfFLXlTb6NotEuzj5QfjLteMg9J7I9BtM8_TOgyIeAv-n8YCOEwaxgY7jAebq_BU76QjGahx-hxKLmnDWrU6JTbux1Iz8ETccl-GCjhVdUQKokJiDc452Lf8lqrPLKGlr5D0Un1HWFJqUpag0kN2WJUkyd-oO9NEMnDAX3QtDnEJp5OWiew4hJJ-Wc7FiWM8ZCvZVoXDjkSWM0EAU");'>
                  
                  </div>

                    

              </div>

              <div class="flex-grow">

                      <div class="flex flex-col sm:flex-row sm:items-center gap-3">

                      <Button color="primary" class="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium h-10 px-4 py-2 bg-primary text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50">
                          Update Photo
                      </Button>

                      <Button color="blue" class="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium h-10 px-4 py-2 bg-subtle-dark text-foreground-dark hover:bg-subtle-dark/80 focus:outline-none focus:ring-2 focus:ring-primary/50">
                          Delete Photo
                      </Button>

                      </div>

              </div>

          </div>

        </section>

        <section>

            <h3 class="text-lg font-bold mb-4 border-b border-border-dark pb-2">User Information</h3>

            <form class="space-y-6">

            <div>

                <Label class="block text-sm font-medium mb-2" for="fullName">Full Name</Label>

                <Input class="form-input block w-full rounded-lg border-border-dark bg-subtle-dark focus:border-primary focus:ring-primary text-foreground-dark placeholder:text-muted-dark" id="fullName" name="fullName" type="text" value={data.user.fullname}/>

            </div>

            <div>

                <Label class="block text-sm font-medium mb-2" for="email">Email Address</Label>

                <Input class="form-input block w-full rounded-lg border-border-dark bg-subtle-dark focus:border-primary focus:ring-primary text-foreground-dark placeholder:text-muted-dark" id="email" name="email" type="email" value={data.user.email}/>

            </div>

            <div>

                <Label class="block text-sm font-medium mb-2" for="phone">Phone Number</Label>

                <Input class="form-input block w-full rounded-lg border-border-dark bg-subtle-dark focus:border-primary focus:ring-primary text-foreground-dark placeholder:text-muted-dark" id="phone" name="phone" type="tel" value={data.user.phone}/>

            </div>

            </form>

        </section>

    </div>

    
    <div class="mt-8 pt-8 border-t border-border-dark flex justify-end gap-4">

        <Button color="red" class="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium h-10 px-4 py-2 bg-transparent text-muted-dark hover:bg-subtle-dark focus:outline-none focus:ring-2 focus:ring-primary/50">
          Cancel
        </Button>

        <Button color="primary" class="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium h-10 px-4 py-2 bg-primary text-background-dark font-semibold shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50">
          Save Changes
        </Button>

    </div>


</main>