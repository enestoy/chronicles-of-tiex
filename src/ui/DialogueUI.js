import { characters } from '../data/characters.js';
import { escapeHtml } from './icons.js';
export class DialogueUI {
  constructor(root, onChoose) { this.element = root; this.onChoose = onChoose; this.choices = []; }
  show(event) {
    const speaker = characters[event.speaker]; this.choices = event.choices;
    this.element.innerHTML = `<div class="dialogue-rule"><span>◆</span></div><div class="dialogue-body"><div class="dialogue-narrative"><p class="eyebrow">${escapeHtml(speaker?.role ?? event.eyebrow ?? 'VELMORA FOREST')}</p><h2>${escapeHtml(speaker?.name ?? event.title ?? 'The night goes on.')}</h2><p class="dialogue-text">${escapeHtml(event.text).replaceAll('\n', '<br>')}</p></div><div class="choices" role="group" aria-label="Story choices">${event.choices.map((c, i) => `<button class="choice" data-choice="${c.id}" ${c.enabled ? '' : 'disabled'}><span class="choice-number">${String(i + 1).padStart(2, '0')}</span><span>${escapeHtml(c.text)}${c.hint ? `<small>${c.enabled ? '' : '◇ '}${escapeHtml(c.hint)}</small>` : ''}</span><span class="choice-arrow">↗</span></button>`).join('')}</div></div><div class="dialogue-foot"><span>Every choice leaves a mark.</span><span><kbd>1–${event.choices.length}</kbd> or click</span></div>`;
    this.element.hidden = false;
    this.element.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => onChoice(button.dataset.choice)));
    const onChoice = id => this.onChoose(id);
    this.element.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
  }
  chooseNumber(number) { const c = this.choices[number - 1]; if (c?.enabled) this.onChoose(c.id); }
  hide() { this.element.hidden = true; this.choices = []; }
}
