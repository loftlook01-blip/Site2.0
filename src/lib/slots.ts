/** Запись на замер: список ближайших рабочих дней (без воскресенья) в <select data-slot-day>. Строится в браузере — всегда актуален. */
const WD = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function fillSlots(root: ParentNode = document) {
  root.querySelectorAll<HTMLSelectElement>('[data-slot-day]:not([data-ready])').forEach((sel) => {
    sel.dataset.ready = '1';
    const now = new Date();
    const out = ['<option value="">Как можно скорее</option>'];
    let k = now.getHours() >= 16 ? 1 : 0;
    while (out.length < 8) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + k);
      if (d.getDay() !== 0) {
        const name = k === 0 ? 'Сегодня' : k === 1 ? 'Завтра' : '';
        const label = `${name ? name + ', ' : ''}${WD[d.getDay()]}, ${d.getDate()} ${d.toLocaleDateString('ru-RU', { month: 'long' })}`;
        out.push(`<option value="${iso(d)}">${label}</option>`);
      }
      k++;
    }
    sel.innerHTML = out.join('');
  });
}
