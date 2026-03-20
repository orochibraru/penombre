<script lang="ts">
    import * as Alert from "$lib/components/ui/alert/index";
    import * as m from "$lib/paraglide/messages.js";
</script>

<Alert.Root variant="destructive">
    <Alert.Title>{m.heads_up()}</Alert.Title>
    <Alert.Description>{m.error_loading_page()}</Alert.Description>
</Alert.Root>
