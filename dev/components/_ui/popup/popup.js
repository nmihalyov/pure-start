Array.from(document.querySelectorAll('.js-open-popup')).map(el =>
  el.addEventListener('click', e => {
    e.preventDefault();

    const target = e.currentTarget.dataset.popup;
    const $popup = document.querySelector(`.js-popup[data-popup="${target}"]`);
    
    $api.popup($popup).show();
  })
);
  
Array.from(document.querySelectorAll('.js-close-popup')).map(el =>
  el.addEventListener('click', e => {
    e.preventDefault();

    if(!e.target.closest('.popup__window') || !e.currentTarget.classList.contains('js-popup')) {
      const $popup = e.currentTarget.closest('.popup');

      $api.popup($popup).hide();
    }
  })
);