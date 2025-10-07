<script lang="ts">
  import { Settings, Bell } from 'lucide-svelte';
</script>

<div class="flex min-h-screen bg-[#0f172a] text-gray-200">
  <!-- Sidebar -->
  <aside class="w-64 bg-[#1e293b] flex flex-col p-4 border-r border-gray-700">
    <h2 class="text-xl font-bold mb-6">Account Settings</h2>
    <nav class="flex flex-col space-y-2">
      <a
        href="/dashboard/settings"
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#334155] hover:bg-[#475569] transition"
      >
        <Settings size={18} />
        <span>General Settings</span>
      </a>

      <a
      href="/dashboard/settings/notifications"
      class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#475569] transition"
    >
      <Bell size={18} />
      <span>Notifications</span>
    </a>

    </nav>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 p-8 overflow-y-auto">
    <slot /> <!-- Le contenu de +page.svelte s’affichera ici -->
  </main>
</div>


