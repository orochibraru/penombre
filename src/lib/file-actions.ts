export function touchAction(node: HTMLElement) {
	let timer: number;
	let longPressTriggered = false;
	const longPressDuration = 500; // ms

	function handleTouchStart(event: TouchEvent) {
		longPressTriggered = false;
		event.preventDefault();

		timer = window.setTimeout(() => {
			node.dispatchEvent(new CustomEvent('longpress'));
			longPressTriggered = true;
		}, longPressDuration);
	}

	function handleTouchEnd() {
		clearTimeout(timer);
		if (!longPressTriggered) {
			node.dispatchEvent(new CustomEvent('tap'));
		}
	}

	function handleTouchMove() {
		clearTimeout(timer);
	}

	node.addEventListener('touchstart', handleTouchStart, { passive: false });
	node.addEventListener('touchend', handleTouchEnd);
	node.addEventListener('touchmove', handleTouchMove);

	return {
		destroy() {
			node.removeEventListener('touchstart', handleTouchStart);
			node.removeEventListener('touchend', handleTouchEnd);
			node.removeEventListener('touchmove', handleTouchMove);
		}
	};
}
