/**
 * Undo and redo over whole states. A sheet's rows are never mutated, only
 * replaced (an edit copies the list of rows and the rows it touches), so a
 * state here costs a list of pointers, not a copy of every cell.
 */
export class History<T> {
	private past: T[] = [];
	private future: T[] = [];

	constructor(private readonly limit = 100) {}

	/** Remember `state` as the one before a change; a new change ends redo. */
	record(state: T): void {
		this.past.push(state);
		if (this.past.length > this.limit) {
			this.past.shift();
		}
		this.future = [];
	}

	/** The state to go back to, given the one on screen; undefined at the start. */
	undo(current: T): T | undefined {
		const previous = this.past.pop();
		if (previous !== undefined) {
			this.future.push(current);
		}
		return previous;
	}

	redo(current: T): T | undefined {
		const next = this.future.pop();
		if (next !== undefined) {
			this.past.push(current);
		}
		return next;
	}

	get canUndo(): boolean {
		return this.past.length > 0;
	}

	get canRedo(): boolean {
		return this.future.length > 0;
	}
}
