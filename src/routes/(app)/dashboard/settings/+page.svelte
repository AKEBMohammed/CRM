<script lang="ts">
  export let data;
  let name = data.userSettings?.name ?? '';
  let email = data.userSettings?.email ?? '';
</script>

<div class="max-w-md ml-10 space-y-6">
  <h1 class="text-2xl font-semibold text-gray-100">General Settings</h1>

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

    <div>
      <label class="block text-sm text-gray-400 mb-1">Email</label>
      <input
        type="text"
        bind:value={email}
        disabled
        class="w-full px-3 py-2 rounded-lg bg-[#1e293b] border border-gray-600 text-gray-400 cursor-not-allowed"
      />
    </div>
  </div>
</div>
