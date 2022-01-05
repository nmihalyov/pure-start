import API from './index';

// popup class interface
interface IPopup {
  $popup: HTMLElement;
  readonly isShown: boolean;
  show(): void;
  hide(): void;
  addClosePopupEventListeners: () => void;
}

// popup contructor options type
type PopupOptions = {
  $popup: HTMLElement;
  onHide?: () => void;
  onShow?: () => void;
};

// popup handling class
class Popup implements IPopup {
  $popup: HTMLElement;

  onHide?: () => void;

  onShow?: () => void;

  constructor(options: PopupOptions) {
    this.$popup = options.$popup;
    this.onHide = options.onHide;
    this.onShow = options.onShow;

    this.addClosePopupEventListeners();
  }

  // return true if popup is shown, otherwise false
  get isShown(): boolean {
    return this.$popup.classList.contains('popup--opened');
  }

  // show popup
  show(): void {
    const { $popup, onShow } = this;

    $popup.style.display = 'block';
    API.hideOverflow();

    setTimeout(() => {
      $popup.classList.add('popup--opened');
      onShow?.();
    });
  }

  // hide popup
  hide(): void {
    const { $popup, onHide } = this;

    $popup.classList.remove('popup--opened');
    setTimeout(() => {
      $popup.style.display = 'none';
      API.showOverflow();
      onHide?.();
    }, 300);
  }

  // handle closing popup
  addClosePopupEventListeners(): void {
    this.$popup.querySelectorAll('.js-close-popup').forEach((el: Element): void => {
      el.addEventListener('click', (e: Event): void => {
        if (
          !(<HTMLElement>e.target).closest('.popup__window') ||
          !(<HTMLElement>e.currentTarget).classList.contains('popup__container')
        ) {
          this.hide();
        }
      });
    });
  }
}

export default Popup;
