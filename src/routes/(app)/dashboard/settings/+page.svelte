<script lang="ts">
  import { onMount } from 'svelte'
  export let data: { user?: any }

  let name = ''

  onMount(() => {
    name = data?.user?.user_metadata?.name ?? ''
  })
</script>

<div class="pl-6 pr-4 space-y-6 max-w-lg">
  <h1 class="text-2xl font-semibold text-gray-100 mb-4">General Settings</h1>

  <div class="bg-[#071028] p-6 rounded-2xl border border-gray-700 space-y-4">
    <div>
      <label class="block text-sm text-gray-400 mb-1">Nom</label>
      <input
        type="text"
        bind:value={name}
        placeholder="Nom d'affichage"
        class="w-full px-3 py-2 rounded-lg bg-[#334155] border border-gray-600 focus:outline-none"
      />
    </div>

    <p class="text-sm text-gray-500">Les changements ne sont pas encore sauvegardés.</p>
  </div>
</div>
