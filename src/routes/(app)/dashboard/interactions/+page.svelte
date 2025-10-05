<script lang="ts">
    import { Card } from "flowbite-svelte";

    let { data } = $props()
</script>
<article>
    <h2>User Interactions</h2>
    <div class="w-full grid">
        {#each data.interactions as interaction}
            <Card href={`./${interaction.interaction_id}`}>
                <h3>Interaction ID: {interaction.interaction_id}</h3>
            </Card>
        {/each}
    </div>
</article>