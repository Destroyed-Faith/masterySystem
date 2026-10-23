/**
 * Compact Echo info dialog — ancestry summary + Echo Artifact blurbs.
 * Change Echo reuses the existing creation dialog (without Echo Cards).
 */

import { getEcho, getEchoSubChoice, getAllEchos } from '../utils/echos/index.js';
import {
  getEchoArtifact,
  getEchoArtifactRules,
  listSelectableEchoArtifacts,
} from '../utils/echo-artifacts.js';
import { getEchoArtifactKey, isEchoBoundArtifact } from '../utils/echo-artifact-equip.js';
import { masteryLocalize } from '../utils/mastery-localize.js';

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export interface EchoInfoDialogResult {
  /** True when the player opened Change Echo from this dialog. */
  changed: boolean;
}

/** Equipped echo-bound artifacts on the actor, with catalog blurbs. */
export function listEquippedEchoArtifacts(actor: any): Array<{
  id: string;
  name: string;
  key: string | null;
  description: string;
  slot: string;
}> {
  const items = Array.from(actor?.items ?? []);
  const out: Array<{ id: string; name: string; key: string | null; description: string; slot: string }> = [];
  for (const it of items as any[]) {
    if (it?.type !== 'artifact' || !isEchoBoundArtifact(it)) continue;
    const key = getEchoArtifactKey(it);
    const def = key ? getEchoArtifact(key) : null;
    out.push({
      id: String(it.id || ''),
      name: String(it.name || def?.name || key || 'Artifact'),
      key,
      description: String(def?.description || ''),
      slot: String(def?.slot || it.system?.slot || ''),
    });
  }
  return out;
}

/** Catalog artifacts offered to this Echo (for reference when none equipped yet). */
export function listCatalogEchoArtifacts(echoKey: string | null | undefined, subChoiceKey?: string | null): Array<{
  key: string;
  name: string;
  description: string;
  slot: string;
}> {
  if (!echoKey) return [];
  const defs = listSelectableEchoArtifacts(String(echoKey), subChoiceKey);
  return defs.map((d) => ({
    key: d.key,
    name: d.name,
    description: d.description,
    slot: d.slot,
  }));
}

export function buildEchoInfoHtml(actor: any): string {
  const system = actor?.system ?? {};
  const echo = system.echo ?? {};
  const def = getEcho(echo.key);
  const sub = def ? getEchoSubChoice(echo.key, echo.subChoiceKey) : undefined;
  const veiled = echo.veiledFormKey ? getEcho(echo.veiledFormKey) : undefined;
  const equipped = listEquippedEchoArtifacts(actor);
  const catalog = def ? listCatalogEchoArtifacts(def.key, echo.subChoiceKey) : [];
  const rules = getEchoArtifactRules(echo.key);

  if (!def) {
    const catalogAll = getAllEchos()
      .map(
        (e) =>
          `<li><strong>${esc(e.name)}</strong> — <em>${esc(e.tagline)}</em><br/><span class="ei-muted">${esc(e.summary)}</span></li>`,
      )
      .join('');
    return `
      <div class="echo-info-dialog">
        <p class="ei-missing">${esc(
          masteryLocalize('MASTERY.echo.info.noneChosen', 'No Echo chosen yet.'),
        )}</p>
        <p class="ei-muted">${esc(
          masteryLocalize(
            'MASTERY.echo.info.pickHint',
            'Use Change Echo to pick an ancestry. Short blurbs:',
          ),
        )}</p>
        <ul class="ei-catalog">${catalogAll}</ul>
      </div>`;
  }

  const equippedHtml = equipped.length
    ? `<ul class="ei-artifacts">${equipped
        .map(
          (a) =>
            `<li><strong>${esc(a.name)}</strong>${a.slot ? ` <em>(${esc(a.slot)})</em>` : ''}${
              a.description ? `<br/><span class="ei-muted">${esc(a.description)}</span>` : ''
            }</li>`,
        )
        .join('')}</ul>`
    : `<p class="ei-muted">${esc(
        masteryLocalize('MASTERY.echo.info.noEquippedArtifacts', 'No Echo Artifacts equipped yet.'),
      )}</p>`;

  const catalogHtml =
    !equipped.length && catalog.length
      ? `<div class="ei-section">
          <h4>${esc(masteryLocalize('MASTERY.echo.info.availableArtifacts', 'Available Echo Artifacts'))}</h4>
          <p class="ei-muted">${esc(
            masteryLocalize(
              'MASTERY.echo.info.artifactRules',
              `Creation: ${rules.requiredAtCreation}–${rules.maxAtCreation} required.`,
            ),
          )}</p>
          <ul class="ei-artifacts">${catalog
            .map(
              (a) =>
                `<li><strong>${esc(a.name)}</strong>${a.slot ? ` <em>(${esc(a.slot)})</em>` : ''}<br/><span class="ei-muted">${esc(a.description)}</span></li>`,
            )
            .join('')}</ul>
        </div>`
      : equipped.length
        ? ''
        : rules.maxAtCreation === 0
          ? `<p class="ei-muted">${esc(
              masteryLocalize('MASTERY.echo.info.noArtifactsForEcho', 'This Echo has no Echo Artifacts.'),
            )}</p>`
          : '';

  return `
    <div class="echo-info-dialog">
      <header class="ei-head">
        <h3><i class="fas fa-mask"></i> ${esc(def.name)}</h3>
        <p class="ei-tagline"><em>${esc(def.tagline)}</em></p>
      </header>
      <p class="ei-summary">${esc(def.summary)}</p>
      <p class="ei-theme ei-muted">${esc(def.theme)}</p>
      <p class="ei-meta">${esc(def.creatureType)} · ${esc(cap(def.size))} · ${def.speed} m
        ${sub ? ` · ${esc(def.subChoiceLabel || 'Choice')}: <strong>${esc(sub.name)}</strong>` : ''}
        ${veiled ? ` · ${esc(masteryLocalize('MASTERY.echo.info.veiledAs', 'veiled as'))} <strong>${esc(veiled.name)}</strong>` : ''}
      </p>
      <div class="ei-section">
        <h4>${esc(masteryLocalize('MASTERY.echo.info.artifacts', 'Echo Artifacts'))}</h4>
        ${equippedHtml}
        ${catalogHtml}
      </div>
    </div>`;
}

/**
 * Open the Echo info dialog. Optional Change Echo button opens the picker.
 */
export async function showEchoInfoDialog(actor: any): Promise<EchoInfoDialogResult> {
  const Dialog: any = (globalThis as any).Dialog;
  if (!Dialog) return { changed: false };

  const hasEcho = !!getEcho(actor?.system?.echo?.key);
  const content = buildEchoInfoHtml(actor);

  return new Promise((resolve) => {
    let settled = false;
    const done = (changed: boolean) => {
      if (settled) return;
      settled = true;
      resolve({ changed });
    };
    new Dialog(
      {
        title: masteryLocalize('MASTERY.echo.info.title', 'Echo'),
        content,
        buttons: {
          change: {
            icon: '<i class="fas fa-mask"></i>',
            label: hasEcho
              ? masteryLocalize('MASTERY.echo.info.change', 'Change Echo')
              : masteryLocalize('MASTERY.echo.info.choose', 'Choose Echo'),
            callback: async () => {
              const { showEchoCreationDialog } = await import('./character-sheet-echo-dialog.js');
              await showEchoCreationDialog(actor);
              done(true);
            },
          },
          close: {
            label: masteryLocalize('MASTERY.echo.info.close', 'Close'),
            callback: () => done(false),
          },
        },
        default: 'close',
        close: () => done(false),
      },
      { classes: ['mastery-system', 'echo-info-dialog-app'], width: 480 },
    ).render(true);
  });
}
