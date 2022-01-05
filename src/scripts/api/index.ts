import Popup from './popup';

// global API class
class API {
  static pageOffset = 0;

  // disable page scroll
  static hideOverflow(): void {
    API.pageOffset = window.scrollY;
    document.body.style.cssText = `position: fixed; margin-top: ${-API.pageOffset}px`;
  }

  // enable page scroll
  static showOverflow(): void {
    document.body.style.cssText = 'position: static; margin-top: 0';
    window.scrollTo(0, API.pageOffset);
    API.pageOffset = 0;
  }
}

export default API;
export { Popup };
