import { m } from "#lib/paraglide/messages.js";
import type { RawElement, SlideElement } from "#lib/slides/model.js";
import type { LayoutKind } from "#lib/slides/templates/index.js";

/** Names for everything the slide editor shows that comes from the model. */

export const SHAPES: [string, () => string][] = [
	["rect", m.slides_shape_rect],
	["roundRect", m.slides_shape_round_rect],
	["ellipse", m.slides_shape_ellipse],
	["triangle", m.slides_shape_triangle],
	["rtTriangle", m.slides_shape_right_triangle],
	["diamond", m.slides_shape_diamond],
	["parallelogram", m.slides_shape_parallelogram],
	["pentagon", m.slides_shape_pentagon],
	["hexagon", m.slides_shape_hexagon],
	["star5", m.slides_shape_star],
	["star4", m.slides_shape_sparkle],
	["plus", m.slides_shape_plus],
	["rightArrow", m.slides_shape_arrow],
	["leftRightArrow", m.slides_shape_double_arrow],
	["chevron", m.slides_shape_chevron],
	["heart", m.slides_shape_heart],
	["wedgeRoundRectCallout", m.slides_shape_callout],
	["wedgeEllipseCallout", m.slides_shape_speech],
];

export const LAYOUT_NAMES: Record<LayoutKind, () => string> = {
	title: m.slides_layout_title,
	section: m.slides_layout_section,
	content: m.slides_layout_content,
	two: m.slides_layout_two,
	comparison: m.slides_layout_comparison,
	picture: m.slides_layout_picture,
	quote: m.slides_layout_quote,
	number: m.slides_layout_number,
	agenda: m.slides_layout_agenda,
	closing: m.slides_layout_closing,
	blank: m.slides_layout_blank,
};

export const TEMPLATE_NAMES: Record<string, () => string> = {
	midnight: m.slides_template_midnight,
	paper: m.slides_template_paper,
	bold: m.slides_template_bold,
	aurora: m.slides_template_aurora,
	swiss: m.slides_template_swiss,
	forest: m.slides_template_forest,
	sunset: m.slides_template_sunset,
	blueprint: m.slides_template_blueprint,
	pastel: m.slides_template_pastel,
	noir: m.slides_template_noir,
};

const RAW: Record<RawElement["label"], () => string> = {
	table: m.slides_object_table,
	chart: m.slides_object_chart,
	diagram: m.slides_object_diagram,
	media: m.slides_object_media,
	ink: m.slides_object_ink,
	object: m.slides_object_other,
};

export function rawLabel(label: RawElement["label"]): string {
	return RAW[label]();
}

/** What an empty placeholder says while the slide is being edited. */
export function placeholderPrompt(element: SlideElement): string | undefined {
	const type = element.placeholder?.type;
	if (
		!element.placeholder ||
		type === "dt" ||
		type === "ftr" ||
		type === "sldNum" ||
		type === "hdr"
	) {
		return undefined;
	}
	if (type === "title" || type === "ctrTitle") {
		return m.slides_prompt_title();
	}
	if (type === "subTitle") {
		return m.slides_prompt_subtitle();
	}
	return type === "pic" ? m.slides_prompt_picture() : m.slides_prompt_text();
}
