// Объект глобального API
const $api = {};

// API для работы с попапами
$api.popup = ($popup, { onHide, onShow } = {}) => {
  // Отключает возможность скроллить страницу
  const hideOverflow = () => {
    document.body.style.cssText = `position: fixed; margin-top: ${-window.scrollY}px`;
  };
  
  // Включает возможность скроллить страницу
  const showOverflow = offset => {
    document.body.style.cssText = 'position: static; margin-top: 0';
    
    window.scrollTo(0, offset);
  };
  
  return {
    // Возвращает true, если попап показывается, в ином случае false
    isShown: () => $popup.classList.contains('popup--opened'),
    // Показывает попап
    show() {
      const promise = new Promise(resolve => {
        $popup.style.display = 'block';
        resolve();
      });

      hideOverflow();

      promise.then(() => {
        $popup.classList.add('popup--opened');
        if (typeof onShow === 'function') {
          onShow();
        }
      });
    },
    // Скрывает попап
    hide() {
      const offset = -parseInt(document.body.style.marginTop);
  
      $popup.classList.remove('popup--opened');
      setTimeout(() => {
        $popup.style.display = 'none';
        showOverflow(offset);
        if (typeof onHide === 'function') {
          onHide();
        }
      }, 300);
    }
  };
};