import { Popup } from '@/scripts/api';

document.querySelectorAll<HTMLElement>('.js-popup').forEach(($popup): void => {
  const id = $popup.dataset.popup;
  const popup = new Popup({ $popup });

  document.querySelectorAll<HTMLElement>(`.js-open-popup[data-popup="${id}"]`).forEach((button): void => {
    button.addEventListener('click', (): void => popup.show());
  });
});
