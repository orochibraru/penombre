import type { Palette } from "#lib/slides/color.js";
import type { RawElement, SlideElement, Theme } from "#lib/slides/model.js";

/** What drawing an element needs besides the element. */
export interface RenderContext {
	theme: Theme;
	palette: Palette;
	/** A picture's `src` as a URL the browser can load, or null when it cannot. */
	media: (src: string) => string | null;
	/** The element whose text is being edited. */
	editing?: string | null;
	/** An empty placeholder's prompt, shown only while editing. */
	prompt?: (element: SlideElement) => string | undefined;
	/** What to call something kept but not drawn. */
	label?: (label: RawElement["label"]) => string;
	onEditorRoot?: (node: HTMLElement) => void;
}
