/**
 * Words and characters, as a word processor's status line counts them.
 *
 * Words come from `Intl.Segmenter`, which knows that Japanese and Chinese do
 * not separate words with spaces; splitting on whitespace would call a whole
 * Japanese paragraph one word. Firefox before 125 has no segmenter.
 */
const segmenter =
	typeof Intl.Segmenter === "function"
		? new Intl.Segmenter(undefined, { granularity: "word" })
		: null;

export function countWords(text: string): number {
	if (!segmenter) {
		return text.split(/\s+/).filter(Boolean).length;
	}
	let words = 0;
	for (const segment of segmenter.segment(text)) {
		if (segment.isWordLike) {
			words++;
		}
	}
	return words;
}

/** Characters with spaces, not counting the breaks between paragraphs. */
export function countCharacters(text: string): number {
	let characters = 0;
	for (const character of text) {
		if (character !== "\n") {
			characters++;
		}
	}
	return characters;
}
