export class GameSceneEventBinder {
  constructor({ wordManager, typingManager, handlers, context }) {
    this.wordManager = wordManager;
    this.typingManager = typingManager;
    this.handlers = handlers;
    this.context = context;
    this.isBound = false;
  }

  bind() {
    if (this.isBound) {
      return;
    }

    this.wordManager.events.on('word-completed', this.handlers.onWordCompleted, this.context);
    this.wordManager.events.on(
      'word-completion-effect-finished',
      this.handlers.onWordCompletionEffectFinished,
      this.context,
    );
    this.wordManager.events.on('word-escaped', this.handlers.onWordEscaped, this.context);
    this.typingManager.events.on('target-changed', this.handlers.onTargetChanged, this.context);
    this.typingManager.events.on('correct-key', this.handlers.onCorrectKey, this.context);
    this.typingManager.events.on('wrong-key', this.handlers.onWrongKey, this.context);
    this.isBound = true;
  }

  unbind() {
    if (!this.isBound) {
      return;
    }

    this.wordManager.events.off('word-completed', this.handlers.onWordCompleted, this.context);
    this.wordManager.events.off(
      'word-completion-effect-finished',
      this.handlers.onWordCompletionEffectFinished,
      this.context,
    );
    this.wordManager.events.off('word-escaped', this.handlers.onWordEscaped, this.context);
    this.typingManager.events.off('target-changed', this.handlers.onTargetChanged, this.context);
    this.typingManager.events.off('correct-key', this.handlers.onCorrectKey, this.context);
    this.typingManager.events.off('wrong-key', this.handlers.onWrongKey, this.context);
    this.isBound = false;
  }
}
