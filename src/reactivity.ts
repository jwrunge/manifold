import { isEqual } from "./equality";

type Effect = InstanceType<typeof State.Effect>;

export class State<T = unknown> {
	private _value!: T;
	private _reactive!: T; // proxied
	private _derive?: () => T;
	private _topLevelEffects = new Set<Effect>();
	private static _granularEffects = new WeakMap<
		object,
		Map<string | symbol, Set<Effect>>
	>();
	private static _currentEffect: Effect | null = null;
	private static _proxyInstances = new WeakSet<object>();

	static Effect = class {
		private _deps: (() => void)[] = [];
		private _active = true;

		constructor(private fn: () => void) {}

		run() {
			if (!this._active) return;
			this._deps.forEach((cleanup) => cleanup());
			this._deps.length = 0;
			State._currentEffect = this;
			try {
				this.fn();
			} finally {
				State._currentEffect = null;
			}
		}

		addDependency = (cleanup: () => void) => this._deps.push(cleanup);

		stop() {
			this._active = false;
			this._deps.forEach((cleanup) => cleanup());
			this._deps.length = 0;
		}
	};

	constructor(value: T | (() => T)) {
		if (typeof value === "function") {
			this._derive = value as () => T;
			const deriveEffect = new State.Effect(() =>
				this._updateInternalValue(this._derive!())
			);
			this._topLevelEffects.add(deriveEffect);
			deriveEffect.run();
		} else {
			this._updateInternalValue(value);
		}
	}

	private _updateInternalValue(newValue: T) {
		if (isEqual(this._value, newValue)) return;
		this._value = newValue;
		this._reactive = State._makeObservable(newValue);
		this._topLevelEffects.forEach((effect) => effect.run());
	}

	private static _track(target: object, key: string | symbol) {
		const effect = State._currentEffect;
		if (!effect) return;

		let subs = State._granularEffects.get(target);
		if (!subs) State._granularEffects.set(target, (subs = new Map()));

		let effects = subs.get(key);
		if (!effects) subs.set(key, (effects = new Set()));

		effects.add(effect);
		effect.addDependency(() => {
			effects!.delete(effect);
			if (!effects!.size) {
				subs!.delete(key);
				if (!subs!.size) State._granularEffects.delete(target);
			}
		});
	}

	private static _makeObservable = <T>(obj: T): T => {
		if (!obj || typeof obj !== "object" || State._proxyInstances.has(obj))
			return obj;

		const proxy = new Proxy(obj, {
			get(target, key, receiver) {
				State._track(target, key);
				return State._makeObservable(
					Reflect.get(target, key, receiver)
				);
			},
			set(target, key, value, receiver) {
				if (isEqual(Reflect.get(target, key, receiver), value))
					return true;
				const result = Reflect.set(target, key, value, receiver);
				if (result) {
					State._granularEffects
						.get(target)
						?.get(key)
						?.forEach((effect) => effect.run());
				}
				return result;
			},
		});

		State._proxyInstances.add(proxy);
		return proxy;
	};

	get value(): T {
		if (State._currentEffect) {
			this._topLevelEffects.add(State._currentEffect);
			State._currentEffect.addDependency(() => {
				this._topLevelEffects.delete(State._currentEffect!);
			});
		}

		return this._reactive;
	}

	set value(newValue: T) {
		if (!this._derive) this._updateInternalValue(newValue);
	}

	effect(fn: () => void) {
		const effect = new State.Effect(fn);
		effect.run();
		return effect.stop.bind(effect);
	}
}
