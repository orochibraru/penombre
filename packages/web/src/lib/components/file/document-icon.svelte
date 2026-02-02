<script lang="ts">
    import {
        FileIcon,
        FileTextIcon,
        FileCodeIcon,
        FileArchiveIcon,
        FileSpreadsheetIcon,
        PresentationIcon,
    } from "@lucide/svelte";

    type Props = {
        type:
            | "word"
            | "excel"
            | "powerpoint"
            | "gdoc"
            | "gsheet"
            | "gslide"
            | "pdf"
            | "code"
            | "archive"
            | "default";
        class?: string;
    };

    let { type, class: className = "h-6 w-6" }: Props = $props();

    // Icon component mapping - use specific icons for each type
    const Icon = $derived.by(() => {
        switch (type) {
            case "word":
            case "gdoc":
            case "pdf":
                return FileTextIcon;
            case "excel":
            case "gsheet":
                return FileSpreadsheetIcon;
            case "powerpoint":
            case "gslide":
                return PresentationIcon;
            case "code":
                return FileCodeIcon;
            case "archive":
                return FileArchiveIcon;
            default:
                return FileIcon;
        }
    });

    // Color mapping for each file type
    const color = $derived.by(() => {
        switch (type) {
            case "word":
                return "#4472C4"; // Word blue
            case "excel":
                return "#70AD47"; // Excel green
            case "powerpoint":
                return "#ED7D31"; // PowerPoint orange
            case "gdoc":
                return "#4285F4"; // Google blue
            case "gsheet":
                return "#34A853"; // Google green
            case "gslide":
                return "#EA4335"; // Google red
            case "pdf":
                return "#D32F2F"; // PDF red
            case "code":
                return "#9C27B0"; // Purple
            case "archive":
                return "#14B8A6"; // Teal
            default:
                return "currentColor";
        }
    });
</script>

<div class={className} style="color: {color}">
    <Icon class={className} />
</div>
