import { mock } from "bun:test";

export class MockDrizzle {
	public mocks = {
		select: mock(),
		insert: mock(),
		update: mock(),
		delete: mock(),
		transaction: mock(),
		execute: mock(),
		prepare: mock(),
		from: mock(),
		where: mock(),
		orderBy: mock(),
		values: mock(),
	};

	// biome-ignore lint/suspicious/noExplicitAny: Mocking generic return values
	private returnValue: any = [];

	constructor() {
		this.setup();
	}

	private createChain() {
		// biome-ignore lint/suspicious/noExplicitAny: Mocking chainable object
		const chain: any = {
			// biome-ignore lint/suspicious/noExplicitAny: Mocking args
			from: mock((...args: any[]) => {
				this.mocks.from(...args);
				return chain;
			}),
			// biome-ignore lint/suspicious/noExplicitAny: Mocking args
			where: mock((...args: any[]) => {
				this.mocks.where(...args);
				return chain;
			}),
			// biome-ignore lint/suspicious/noExplicitAny: Mocking args
			orderBy: mock((...args: any[]) => {
				this.mocks.orderBy(...args);
				return chain;
			}),
			// biome-ignore lint/suspicious/noExplicitAny: Mocking args
			values: mock((...args: any[]) => {
				this.mocks.values(...args);
				return chain;
			}),
			// biome-ignore lint/suspicious/noExplicitAny: Mocking args
			prepare: mock((...args: any[]) => {
				this.mocks.prepare(...args);
				return { execute: this.mocks.execute };
			}),
			// biome-ignore lint/suspicious/noThenProperty: Mocking Promise-like behavior
			// biome-ignore lint/suspicious/noExplicitAny: Mocking resolve
			then: (resolve: any) => resolve(this.returnValue),
		};
		return chain;
	}

	private setup() {
		this.mocks.execute.mockImplementation(() =>
			Promise.resolve(this.returnValue),
		);

		this.mocks.select.mockImplementation(() => this.createChain());
		this.mocks.insert.mockImplementation(() => this.createChain());

		// biome-ignore lint/suspicious/noExplicitAny: Mocking callback
		this.mocks.transaction.mockImplementation(async (cb: any) => {
			const tx = {
				insert: this.mocks.insert,
				update: this.mocks.update,
				delete: this.mocks.delete,
				select: this.mocks.select,
			};
			return cb(tx);
		});
	}

	// biome-ignore lint/suspicious/noExplicitAny: Mocking value
	public setResolvedValue(value: any) {
		this.returnValue = value;
		this.mocks.execute.mockResolvedValue(value);
	}

	public getDb() {
		return {
			select: this.mocks.select,
			insert: this.mocks.insert,
			update: this.mocks.update,
			delete: this.mocks.delete,
			transaction: this.mocks.transaction,
			// biome-ignore lint/suspicious/noExplicitAny: Mocking global db
		} as any;
	}

	public reset() {
		for (const m of Object.values(this.mocks)) {
			m.mockClear();
		}
		this.returnValue = [];
		this.mocks.execute.mockResolvedValue([]);
	}
}
