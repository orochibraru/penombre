<script lang="ts">
	import * as Select from "#lib/components/ui/select/index.js";
	import * as m from "#lib/paraglide/messages.js";
	import { pitchAvailable, SEMITONES, SPEEDS } from "#lib/playback-tuning.js";

	interface Props {
		speed: number;
		semitones: number;
	}

	let { speed = $bindable(1), semitones = $bindable(0) }: Props = $props();

	const canShift = pitchAvailable();
	const signed = (n: number) => (n > 0 ? `+${n}` : String(n));
</script>

<Select.Root
    type="single"
    value={String(speed)}
    onValueChange={(value) => (speed = Number(value))}
>
    <Select.Trigger
        class="w-20"
        aria-label={m.player_speed()}
        title={m.player_speed()}
    >
        {speed}×
    </Select.Trigger>
    <Select.Content>
        {#each SPEEDS as option (option)}
            <Select.Item value={String(option)}>{option}×</Select.Item>
        {/each}
    </Select.Content>
</Select.Root>

<Select.Root
    type="single"
    value={String(semitones)}
    onValueChange={(value) => (semitones = Number(value))}
    disabled={!canShift}
>
    <Select.Trigger
        class="w-24"
        aria-label={m.player_pitch()}
        title={canShift ? m.player_pitch() : m.player_pitch_insecure()}
    >
        {m.player_semitones({ count: signed(semitones) })}
    </Select.Trigger>
    <Select.Content class="max-h-72">
        {#each SEMITONES as option (option)}
            <Select.Item value={String(option)}>
                {m.player_semitones({ count: signed(option) })}
            </Select.Item>
        {/each}
    </Select.Content>
</Select.Root>
