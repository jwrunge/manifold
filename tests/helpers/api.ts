import {
	type Effect as EffectClass,
	effect as runEffect,
} from "../../src/Effect.ts";
import Manifold from "../../src/main.ts";

export type Effect = { stop(): void };

const $ = {
	create: Manifold.create.bind(Manifold),
	effect(fn: () => void): Effect {
		const e: EffectClass = runEffect(fn);
		return {
			stop() {
				(e as unknown as { _stop: () => void })._stop();
			},
		};
	},
};

export default $;
