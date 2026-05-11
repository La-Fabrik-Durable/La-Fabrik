import type { GameStep } from "@/types/game";

export class GameStepManager {
  private static _instance: GameStepManager | null = null;

  private _currentStep: GameStep = "intro";
  private readonly _listeners = new Set<() => void>();

  static getInstance(): GameStepManager {
    if (!GameStepManager._instance) {
      GameStepManager._instance = new GameStepManager();
    }

    return GameStepManager._instance;
  }

  private constructor() {}

  getStep(): GameStep {
    return this._currentStep;
  }

  transitionTo(step: GameStep): void {
    if (this._currentStep === step) return;

    this._currentStep = step;
    this._emit();
  }

  subscribe(listener: () => void): () => void {
    this._listeners.add(listener);

    return () => {
      this._listeners.delete(listener);
    };
  }

  destroy(): void {
    this._currentStep = "intro";
    this._listeners.clear();
    GameStepManager._instance = null;
  }

  private _emit(): void {
    this._listeners.forEach((cb) => cb());
  }
}
