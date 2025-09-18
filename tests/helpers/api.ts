import StateBuilder from "../../src/main.ts";
import { effect as runEffect, type Effect as EffectClass } from "../../src/Effect.ts";

export type Effect = { stop(): void };

const $ = {
  create: StateBuilder.create.bind(StateBuilder),
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
