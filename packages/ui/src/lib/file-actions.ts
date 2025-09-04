export function touchAction(node: HTMLElement) {
	let timer: number;
	let longPressTriggered = false;
	const longPressDuration = 500; // ms

	// Movement tracking
	let startX: number;
	let startY: number;
	let hasMoved = false;
	const moveTolerance = 10; // pixels

	function handleTouchStart(event: TouchEvent) {
		// Reset state for each new touch
		longPressTriggered = false;
		hasMoved = false;

		// Store starting coordinates
		const touch = event.touches[0];
		if (touch) {
			startX = touch.clientX;
			startY = touch.clientY;
		}

		if (event.cancelable) {
			event.preventDefault();
		}

		timer = window.setTimeout(() => {
			node.dispatchEvent(new CustomEvent('longpress'));
			longPressTriggered = true;
		}, longPressDuration);
	}

	function handleTouchMove(event: TouchEvent) {
		if (hasMoved) return;

		const touch = event.touches[0];
		if (touch) {
			const dx = Math.abs(touch.clientX - startX);
			const dy = Math.abs(touch.clientY - startY);

			if (dx > moveTolerance || dy > moveTolerance) {
				hasMoved = true;
				// If it's a move, it can't be a long press
				clearTimeout(timer);
			}
		}
	}

	function handleTouchEnd() {
		clearTimeout(timer);
		// Only dispatch tap if it wasn't a long press AND it wasn't a move
		if (!longPressTriggered && !hasMoved) {
			node.dispatchEvent(new CustomEvent('tap'));
		}
	}

	function handleClick() {
		node.dispatchEvent(new CustomEvent('tap'));
	}

	node.addEventListener('touchstart', handleTouchStart, { passive: false });
	node.addEventListener('touchend', handleTouchEnd);
	node.addEventListener('touchmove', handleTouchMove);
	node.addEventListener('click', handleClick);

	return {
		destroy() {
			node.removeEventListener('touchstart', handleTouchStart);
			node.removeEventListener('touchend', handleTouchEnd);
			node.removeEventListener('touchmove', handleTouchMove);
			node.removeEventListener('click', handleClick);
		}
	};
}
