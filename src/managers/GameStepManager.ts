import type { GameStep, GameStepSnapshot } from "@/types/game";
import { useMissionFlowStore } from "@/managers/stores/useMissionFlowStore";

export class GameStepManager {
  private static _instance: GameStepManager | null = null;

  private _currentStep: GameStep = "intro";
  private _playerName = "";
  private _canMove = false;
  private readonly _listeners = new Set<() => void>();
  private _cachedSnapshot: GameStepSnapshot | null = null;

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

  getPlayerName(): string {
    return this._playerName;
  }

  canMove(): boolean {
    return this._canMove;
  }

  getSnapshot(): GameStepSnapshot {
    if (!this._cachedSnapshot) {
      this._cachedSnapshot = {
        step: this._currentStep,
        playerName: this._playerName,
        canMove: this._canMove,
        transitionTo: this.transitionTo.bind(this),
        setPlayerName: this.setPlayerName.bind(this),
      };
    }
    return this._cachedSnapshot;
  }

  transitionTo(step: GameStep): void {
    if (this._currentStep === step) return;

    this._currentStep = step;
    this._cachedSnapshot = null;
    useMissionFlowStore.getState().setStep(step);
    this._emit();
  }

  setPlayerName(name: string): void {
    if (this._playerName === name) return;

    this._playerName = name;
    this._cachedSnapshot = null;
    useMissionFlowStore.getState().setPlayerName(name);
    this._emit();
  }

  setCanMove(canMove: boolean): void {
    if (this._canMove === canMove) return;

    this._canMove = canMove;
    this._cachedSnapshot = null;
    useMissionFlowStore.getState().setCanMove(canMove);
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
    this._playerName = "";
    this._canMove = false;
    this._listeners.clear();
    this._cachedSnapshot = null;
    GameStepManager._instance = null;
  }

  private _emit(): void {
    this._listeners.forEach((cb) => cb());
  }
}
