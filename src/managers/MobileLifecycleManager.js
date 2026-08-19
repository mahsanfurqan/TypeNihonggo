export const MOBILE_LIFECYCLE_EVENT = 'typenihongo:native-lifecycle';

export class MobileLifecycleManager {
  constructor(game, eventTarget = globalThis.window) {
    this.game = game;
    this.eventTarget = eventTarget;
    this.isSuspended = false;
    this.shouldWakeLoop = false;
    this.handleLifecycleChange = this.handleLifecycleChange.bind(this);

    this.eventTarget?.addEventListener?.(MOBILE_LIFECYCLE_EVENT, this.handleLifecycleChange);
  }

  handleLifecycleChange(event) {
    const state = event?.detail?.state;

    if (state === 'background') {
      this.suspend();
    } else if (state === 'active') {
      this.resume();
    }
  }

  suspend() {
    if (this.isSuspended) {
      return;
    }

    this.isSuspended = true;
    this.shouldWakeLoop = this.game?.loop?.running !== false;
    this.game?.sound?.pauseAll?.();
    this.game?.loop?.sleep?.();
  }

  resume() {
    if (!this.isSuspended) {
      return;
    }

    this.isSuspended = false;
    this.game?.sound?.resumeAll?.();

    if (this.shouldWakeLoop) {
      this.game?.loop?.wake?.();
    }

    this.shouldWakeLoop = false;
  }

  destroy() {
    this.eventTarget?.removeEventListener?.(MOBILE_LIFECYCLE_EVENT, this.handleLifecycleChange);
  }
}
