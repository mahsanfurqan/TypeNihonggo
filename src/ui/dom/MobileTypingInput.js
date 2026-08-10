import { SimpleKeyboard } from 'simple-keyboard';
import 'simple-keyboard/build/css/index.css';
import { emitRomajiInput } from '../../utils/romajiInputEvents.js';

export class MobileTypingInput {
  constructor(rootElement, { focusElement = document.querySelector('#game-root') } = {}) {
    this.rootElement = rootElement;
    this.focusElement = focusElement;
    this.inputElement = null;
    this.keyboardElement = null;
    this.keyboard = null;
    this.isShiftActive = false;
    this.visualViewport = globalThis.window?.visualViewport ?? null;
    this.handleFocusRequest = this.handleFocusRequest.bind(this);
    this.handleInputFocus = this.handleInputFocus.bind(this);
    this.handleInputBlur = this.handleInputBlur.bind(this);
    this.updateViewportHeight = this.updateViewportHeight.bind(this);

    if (this.rootElement) {
      this.render();
      this.bindViewportEvents();
      this.updateViewportHeight();
    }
  }

  render() {
    this.rootElement.replaceChildren();

    const keyboardElement = document.createElement('div');
    keyboardElement.className = 'mobile-typing-input__keyboard';

    const input = document.createElement('input');
    input.className = 'mobile-typing-input__field';
    input.type = 'text';
    input.inputMode = 'latin';
    input.autocomplete = 'off';
    input.autocapitalize = 'none';
    input.autocorrect = 'off';
    input.spellcheck = false;
    input.enterKeyHint = 'done';
    input.setAttribute('aria-label', 'Romaji typing input');

    input.addEventListener('beforeinput', (event) => {
      if (event.inputType !== 'insertText') {
        return;
      }

      if (this.emitText(event.data)) {
        event.preventDefault();
      }
    });

    input.addEventListener('input', () => {
      this.emitText(input.value);
      input.value = '';
    });
    input.addEventListener('focus', this.handleInputFocus);
    input.addEventListener('blur', this.handleInputBlur);

    this.rootElement.append(input, keyboardElement);
    this.focusElement?.addEventListener?.('pointerdown', this.handleFocusRequest);
    this.inputElement = input;
    this.keyboardElement = keyboardElement;
    this.keyboard = new SimpleKeyboard(keyboardElement, {
      layout: {
        default: [
          'q w e r t y u i o p',
          'a s d f g h j k l',
          '{shift} z x c v b n m {bksp}',
          '{numbers} {settings} {emoji} {space} . {enter}',
        ],
        shift: [
          'Q W E R T Y U I O P',
          'A S D F G H J K L',
          '{shift} Z X C V B N M {bksp}',
          '{numbers} {settings} {emoji} {space} . {enter}',
        ],
      },
      display: {
        '{shift}': '⇧',
        '{bksp}': '⌫',
        '{numbers}': '123',
        '{settings}': '⚙',
        '{emoji}': '☺',
        '{space}': '',
        '{enter}': '↵',
      },
      theme: 'hg-theme-default typenihongo-virtual-keyboard',
      onKeyPress: (button) => this.handleVirtualKeyPress(button),
    });
  }

  handleFocusRequest() {
    if (!this.isVirtualKeyboardVisible()) {
      this.inputElement?.focus({ preventScroll: true });
    }
  }

  handleVirtualKeyPress(button) {
    if (button === '{shift}') {
      this.toggleShift();
      return;
    }

    if (button.startsWith('{')) {
      return;
    }

    this.emitText(button.toLowerCase());
  }

  toggleShift() {
    this.isShiftActive = !this.isShiftActive;
    this.keyboard?.setOptions({
      layoutName: this.isShiftActive ? 'shift' : 'default',
    });
  }

  isVirtualKeyboardVisible() {
    if (!this.keyboardElement) {
      return false;
    }

    return globalThis.window?.matchMedia?.('(max-width: 1280px)').matches ?? false;
  }

  handleInputFocus() {
    document.body.classList.add('is-native-keyboard-active');
    this.updateViewportHeight();
  }

  handleInputBlur() {
    document.body.classList.remove('is-native-keyboard-active');
    this.updateViewportHeight();
  }

  bindViewportEvents() {
    globalThis.window?.addEventListener?.('resize', this.updateViewportHeight);
    this.visualViewport?.addEventListener?.('resize', this.updateViewportHeight);
    this.visualViewport?.addEventListener?.('scroll', this.updateViewportHeight);
  }

  unbindViewportEvents() {
    globalThis.window?.removeEventListener?.('resize', this.updateViewportHeight);
    this.visualViewport?.removeEventListener?.('resize', this.updateViewportHeight);
    this.visualViewport?.removeEventListener?.('scroll', this.updateViewportHeight);
  }

  updateViewportHeight() {
    const viewportHeight = this.visualViewport?.height ?? globalThis.window?.innerHeight;

    if (!viewportHeight) {
      return;
    }

    document.documentElement.style.setProperty(
      '--typenihongo-visual-height',
      `${Math.round(viewportHeight)}px`,
    );
  }

  emitText(value) {
    const characters = String(value ?? '').split('');
    let emittedCharacter = false;

    characters.forEach((character) => {
      emittedCharacter = emitRomajiInput(character) || emittedCharacter;
    });

    return emittedCharacter;
  }

  destroy() {
    this.unbindViewportEvents();
    this.keyboard?.destroy();
    this.inputElement?.removeEventListener?.('focus', this.handleInputFocus);
    this.inputElement?.removeEventListener?.('blur', this.handleInputBlur);
    document.body.classList.remove('is-native-keyboard-active');
    this.focusElement?.removeEventListener?.('pointerdown', this.handleFocusRequest);
    this.rootElement?.replaceChildren();
    this.inputElement = null;
    this.keyboardElement = null;
    this.keyboard = null;
  }
}
