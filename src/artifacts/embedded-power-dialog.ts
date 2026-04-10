/**
 * Structured editor for artifact Item embedded powers (EmbeddedPowerData).
 */

import type { AoeSpec, ArtifactData, DurationSpec, EmbeddedPowerData, PowerLevelKey, PowerLevelRow, RangeSpec } from '../types/item.js';
import {
  EMBEDDED_POWER_ACTION_COSTS,
  EMBEDDED_POWER_AOE_SHAPES,
  EMBEDDED_POWER_CATEGORIES,
  EMBEDDED_POWER_DURATION_KINDS,
  EMBEDDED_POWER_LIMIT_PERS,
  EMBEDDED_POWER_LIMIT_USE_MAX,
  EMBEDDED_POWER_RANGE_KINDS,
  EMBEDDED_POWER_TAG_PRESETS,
  createDefaultEmbeddedPower,
  normalizePowersForEditor
} from '../utils/embedded-power-ui-constants.js';
import { isOldPowerStructure, migrateArtifactPower } from '../utils/power-migration.js';
import { syncArtifactInheritedFromParent } from '../utils/artifact-folder-sync.js';
import { pushWorldArtifactNodeToEmbeddedActors } from '../utils/artifact-embedded-sync.js';

const BaseDialog: any = (foundry as any)?.appv1?.Application || (Application as any);

export interface EmbeddedPowerLineageOptions {
  isLineageRoot?: boolean;
  /** Power ids inherited from ancestors; non-root cannot delete or edit these. */
  lockedPowerIds?: Set<string> | string[];
  maxTotalPowers?: number;
  /** Current node tree depth (1 = root); stamped on newly added powers. */
  treeDepth?: number;
}

const LEVEL_KEYS: PowerLevelKey[] = ['1', '2', '3', '4'];

function randomId(): string {
  return (foundry.utils as any).randomID();
}

function parseNum(raw: string): number | undefined {
  const t = String(raw ?? '').trim();
  if (t === '') return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

function parseIntOptional(raw: string): number | undefined {
  const t = String(raw ?? '').trim();
  if (t === '') return undefined;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : undefined;
}

function readRange($b: JQuery): RangeSpec | null {
  const kind = String($b.find('.ep-l-range-kind').val() || '').trim();
  if (!kind) return null;
  const spec: RangeSpec = { kind: kind as RangeSpec['kind'] };
  const m = parseNum(String($b.find('.ep-l-range-m').val()));
  if (m !== undefined) spec.m = m;
  const note = String($b.find('.ep-l-range-note').val() || '').trim();
  if (note) spec.note = note;
  return spec;
}

function readAoe($b: JQuery): AoeSpec | null {
  const shape = String($b.find('.ep-l-aoe-shape').val() || '').trim() || 'none';
  if (!shape || shape === 'none') return null;
  const spec: AoeSpec = { shape: shape as AoeSpec['shape'] };
  const addNum = (sel: string, key: keyof AoeSpec) => {
    const v = parseNum(String($b.find(sel).val()));
    if (v !== undefined) (spec as any)[key] = v;
  };
  addNum('.ep-l-aoe-m', 'm');
  addNum('.ep-l-radiusM', 'radiusM');
  addNum('.ep-l-lengthM', 'lengthM');
  addNum('.ep-l-widthM', 'widthM');
  addNum('.ep-l-angleDeg', 'angleDeg');
  const targets = parseIntOptional(String($b.find('.ep-l-targets').val()));
  if (targets !== undefined) spec.targets = targets;
  const note = String($b.find('.ep-l-aoe-note').val() || '').trim();
  if (note) spec.note = note;
  return spec;
}

function readDuration($b: JQuery): DurationSpec {
  const kind = String($b.find('.ep-l-dur-kind').val() || 'instant').trim() as DurationSpec['kind'];
  const spec: DurationSpec = { kind };
  if (kind === 'rounds' || kind === 'masteryRounds' || kind === 'masteryRankRounds') {
    const r = parseNum(String($b.find('.ep-l-dur-rounds').val()));
    if (r !== undefined) spec.rounds = Math.max(1, Math.floor(r));
  }
  const note = String($b.find('.ep-l-dur-note').val() || '').trim();
  if (note) spec.note = note;
  return spec;
}

function readSpecials($b: JQuery): PowerLevelRow['specials'] {
  const out: PowerLevelRow['specials'] = [];
  $b.find('.ep-sp-row').each((_i, row) => {
    const $r = $(row);
    const key = String($r.find('.ep-sp-key').val() || '').trim();
    if (!key) return;
    const entry: (typeof out)[0] = { key };
    const rank = parseNum(String($r.find('.ep-sp-rank').val()));
    if (rank !== undefined) entry.rank = rank;
    const value = parseNum(String($r.find('.ep-sp-value').val()));
    if (value !== undefined) entry.value = value;
    const raiseCost = parseNum(String($r.find('.ep-sp-raise').val()));
    if (raiseCost !== undefined) entry.raiseCost = raiseCost;
    const note = String($r.find('.ep-sp-note').val() || '').trim();
    if (note) entry.note = note;
    out.push(entry);
  });
  return out;
}

function readLevelRow($b: JQuery): PowerLevelRow {
  const type = String($b.find('.ep-l-type').val() || '').trim();
  const row: PowerLevelRow = {
    type,
    range: readRange($b),
    aoe: readAoe($b),
    duration: readDuration($b),
    effect: {
      text: String($b.find('.ep-l-effect-text').val() || '').trim(),
      dice: (() => {
        const d = String($b.find('.ep-l-effect-dice').val() || '').trim();
        return d || undefined;
      })()
    },
    specials: readSpecials($b)
  };
  const lt = String($b.find('.ep-l-trigger').val() || '').trim();
  if (lt) row.trigger = lt;
  const lvlRaw = String($b.find('.ep-l-row-lvl').val() || '').trim();
  if (lvlRaw !== '') {
    const lvl = parseInt(lvlRaw, 10);
    if (Number.isFinite(lvl)) row.lvl = lvl;
  }
  return row;
}

function parseImportedPayload(parsed: unknown): EmbeddedPowerData[] {
  let arr: unknown[];
  if (Array.isArray(parsed)) {
    arr = parsed;
  } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).powers)) {
    arr = (parsed as any).powers;
  } else if (parsed && typeof parsed === 'object') {
    arr = [parsed];
  } else {
    throw new Error('JSON must be an object, an array, or { powers: [...] }');
  }
  return arr.map((raw) => {
    const migrated = isOldPowerStructure(raw) ? migrateArtifactPower(raw) : (JSON.parse(JSON.stringify(raw)) as any);
    return normalizePowersForEditor([migrated])[0];
  });
}

const PRESET_TAG_SET = new Set<string>(EMBEDDED_POWER_TAG_PRESETS as unknown as string[]);

function tagsToTagRows(tags: string[]): { preset: string; customTag: string }[] {
  const rows: { preset: string; customTag: string }[] = [];
  for (const raw of tags || []) {
    const t = String(raw).trim();
    if (!t) continue;
    rows.push(PRESET_TAG_SET.has(t) ? { preset: t, customTag: '' } : { preset: '__custom__', customTag: t });
  }
  return rows.length ? rows : [{ preset: '', customTag: '' }];
}

function clampLimitUses(n: number | undefined): number {
  const u = Math.floor(Number(n));
  if (!Number.isFinite(u) || u < 1) return 1;
  return Math.min(EMBEDDED_POWER_LIMIT_USE_MAX, u);
}

function assignFreshIds(added: EmbeddedPowerData[], existing: EmbeddedPowerData[]): void {
  const used = new Set(existing.map((p) => p.id).filter(Boolean) as string[]);
  for (const p of added) {
    if (!p.id || used.has(p.id)) {
      p.id = randomId();
    }
    used.add(p.id!);
  }
}

function toLockedPowerIdSet(raw: Set<string> | string[] | undefined): Set<string> {
  if (!raw) return new Set();
  if (raw instanceof Set) return new Set([...raw].filter(Boolean));
  return new Set((raw as string[]).map((s) => String(s).trim()).filter(Boolean));
}

export class EmbeddedPowerDialog extends BaseDialog {
  private item: Item;
  private _workingPowers: EmbeddedPowerData[] = [];
  private _baselinePowers: EmbeddedPowerData[] = [];
  private _selectedIndex = 0;
  private _onSaved?: () => void;
  private _lineage: { isLineageRoot: boolean; lockedPowerIds: Set<string>; maxTotalPowers: number };
  private _treeDepth?: number;

  constructor(
    item: Item,
    options?: { onSaved?: () => void; lineage?: EmbeddedPowerLineageOptions }
  ) {
    super();
    this.item = item;
    this._onSaved = options?.onSaved;
    const lin = options?.lineage;
    this._treeDepth = lin?.treeDepth != null && Number.isFinite(lin.treeDepth) ? Math.max(1, Math.floor(lin.treeDepth)) : undefined;
    this._lineage = {
      isLineageRoot: lin?.isLineageRoot !== false,
      lockedPowerIds: toLockedPowerIdSet(lin?.lockedPowerIds),
      maxTotalPowers:
        lin?.maxTotalPowers != null && Number.isFinite(lin.maxTotalPowers)
          ? lin.maxTotalPowers
          : Number.POSITIVE_INFINITY
    };
    const sys = item.system as ArtifactData;
    this._workingPowers = normalizePowersForEditor((sys.powers as any) || []);
    this._baselinePowers = foundry.utils.deepClone(this._workingPowers);
  }

  static get defaultOptions(): any {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'mastery-embedded-power-dialog',
      title: 'Embedded powers',
      template: 'systems/mastery-system/templates/artifacts/embedded-power-dialog.hbs',
      classes: ['mastery-system', 'embedded-power-dialog'],
      width: 960,
      height: 900,
      resizable: true
    });
  }

  private prepareDetail(power: EmbeddedPowerData): any {
    const limitEnabled = !!(power.cost?.limit);
    const roll = power.roll || {};
    const cost = {
      ...power.cost,
      limit: {
        per: (power.cost?.limit?.per || 'day') as 'round' | 'combat' | 'day' | 'week',
        uses: clampLimitUses(power.cost?.limit?.uses)
      }
    };
    return {
      ...power,
      tagRows: tagsToTagRows(power.tags || []),
      limitEnabled,
      cost,
      rollKind: (roll as any).kind || '',
      rollAttr: (roll as any).attribute || '',
      rollVs: (roll as any).vs || '',
      levelsList: LEVEL_KEYS.map((key) => {
        const row = power.levels[key];
        const specs = row.specials || [];
        return {
          key,
          row,
          rangeKind: row.range?.kind || '',
          rangeM: row.range?.m ?? '',
          rangeNote: row.range?.note || '',
          aoeShape: row.aoe?.shape ?? 'none',
          aoeM: row.aoe?.m ?? '',
          aoeRadiusM: row.aoe?.radiusM ?? '',
          aoeLengthM: row.aoe?.lengthM ?? '',
          aoeWidthM: row.aoe?.widthM ?? '',
          aoeAngleDeg: row.aoe?.angleDeg ?? '',
          aoeTargets: row.aoe?.targets ?? '',
          aoeNote: row.aoe?.note || '',
          durKind: row.duration?.kind ?? 'instant',
          durRounds: row.duration?.rounds ?? '',
          durNote: row.duration?.note || '',
          effectText: row.effect?.text || '',
          effectDice: row.effect?.dice || '',
          lvlTrigger: row.trigger || '',
          lvlNum: row.lvl ?? '',
          specialsList: specs.map((s) => ({
            spKey: s.key || '',
            rank: s.rank ?? '',
            value: s.value ?? '',
            raiseCost: s.raiseCost ?? '',
            note: s.note || ''
          }))
        };
      })
    };
  }

  getData(options?: any): any {
    const data: any = super.getData ? super.getData(options) : {};
    const powers = this._workingPowers;
    const hasPowers = powers.length > 0;
    if (hasPowers) {
      this._selectedIndex = Math.min(Math.max(0, this._selectedIndex), powers.length - 1);
    } else {
      this._selectedIndex = 0;
    }
    const current = hasPowers ? powers[this._selectedIndex] : null;
    data.item = this.item;
    data.powerList = powers.map((p, i) => {
      const pid = p.id ? String(p.id) : '';
      const inherited =
        !!pid && !this._lineage.isLineageRoot && this._lineage.lockedPowerIds.has(pid);
      const tier = p.treeDepthDefined != null ? Math.floor(p.treeDepthDefined) : null;
      const tierShort = tier != null ? `T${tier}` : '';
      return {
        i,
        name: p.name,
        category: p.category,
        inherited,
        tierShort
      };
    });
    data.hasPowers = hasPowers;
    data.selectedIndex = this._selectedIndex;
    data.detail = current ? this.prepareDetail(current) : null;
    data.rangeKinds = [...EMBEDDED_POWER_RANGE_KINDS];
    data.aoeShapes = [...EMBEDDED_POWER_AOE_SHAPES];
    data.durationKinds = [...EMBEDDED_POWER_DURATION_KINDS];
    data.categories = [...EMBEDDED_POWER_CATEGORIES];
    data.actionCosts = [...EMBEDDED_POWER_ACTION_COSTS];
    data.limitPers = [...EMBEDDED_POWER_LIMIT_PERS];
    data.limitUseOptions = Array.from({ length: EMBEDDED_POWER_LIMIT_USE_MAX }, (_, i) => i + 1);
    data.tagPresetOptions = [...EMBEDDED_POWER_TAG_PRESETS];
    data.isEditable = (this.item as any).isOwner;
    const atCap =
      !this._lineage.isLineageRoot &&
      Number.isFinite(this._lineage.maxTotalPowers) &&
      powers.length >= this._lineage.maxTotalPowers;
    data.addPowerDisabled = atCap;
    data.duplicatePowerDisabled = atCap || !hasPowers;
    const sel = hasPowers ? powers[this._selectedIndex] : null;
    data.selectedPowerDeleteLocked = Boolean(
      sel &&
        !this._lineage.isLineageRoot &&
        sel.id &&
        this._lineage.lockedPowerIds.has(String(sel.id))
    );
    data.detailReadOnly = Boolean(
      sel &&
        !this._lineage.isLineageRoot &&
        sel.id &&
        this._lineage.lockedPowerIds.has(String(sel.id))
    );
    return data;
  }

  private finalizePowersForSave(): EmbeddedPowerData[] | null {
    let next = foundry.utils.deepClone(this._workingPowers) as EmbeddedPowerData[];
    if (!this._lineage.isLineageRoot) {
      for (const id of this._lineage.lockedPowerIds) {
        if (!id) continue;
        if (!next.some((p) => p.id === id)) {
          const baseline = this._baselinePowers.find((p) => p.id === id);
          if (baseline) next.push(foundry.utils.deepClone(baseline));
        }
      }
      for (let i = 0; i < next.length; i++) {
        const p = next[i];
        const pid = p.id ? String(p.id) : '';
        if (!pid || !this._lineage.lockedPowerIds.has(pid)) continue;
        const baseline = this._baselinePowers.find((b) => b.id && String(b.id) === pid);
        if (baseline) next[i] = foundry.utils.deepClone(baseline);
      }
      if (Number.isFinite(this._lineage.maxTotalPowers) && next.length > this._lineage.maxTotalPowers) {
        ui.notifications?.error(
          `Too many embedded powers for this tree node (max ${this._lineage.maxTotalPowers}).`
        );
        return null;
      }
    }
    return normalizePowersForEditor(next);
  }

  private syncFromDom(html: JQuery): void {
    if (!this._workingPowers.length) return;
    this._workingPowers[this._selectedIndex] = this.readCurrentPowerFromForm(html);
  }

  private readCurrentPowerFromForm(html: JQuery): EmbeddedPowerData {
    const cur = this._workingPowers[this._selectedIndex];
    const curId = cur?.id ? String(cur.id) : '';
    if (
      curId &&
      !this._lineage.isLineageRoot &&
      this._lineage.lockedPowerIds.has(curId)
    ) {
      return foundry.utils.deepClone(cur);
    }
    const prev = foundry.utils.deepClone(this._workingPowers[this._selectedIndex]);
    prev.name = String(html.find('#ep-detail-name').val() || '').trim() || 'Unnamed';
    const fluff = String(html.find('#ep-detail-fluff').val() || '').trim();
    prev.fluff = fluff || undefined;
    prev.category = String(html.find('#ep-detail-category').val() || 'active') as EmbeddedPowerData['category'];
    prev.tags = this.collectTagsFromDom(html);
    prev.cost = {
      action: String(html.find('#ep-cost-action').val() || 'none') as any,
      stones: parseNum(String(html.find('#ep-cost-stones').val())),
      charges: parseNum(String(html.find('#ep-cost-charges').val()))
    };
    if (prev.cost.stones === undefined) delete prev.cost.stones;
    if (prev.cost.charges === undefined) delete prev.cost.charges;
    const limitOn = html.find('#ep-limit-enabled').prop('checked') === true;
    if (limitOn) {
      prev.cost.limit = {
        per: String(html.find('#ep-limit-per').val() || 'day') as any,
        uses: clampLimitUses(parseInt(String(html.find('#ep-limit-uses').val() || '1'), 10))
      };
    } else {
      delete prev.cost.limit;
    }
    const trigger = String(html.find('#ep-trigger').val() || '').trim();
    prev.trigger = trigger || undefined;
    const rollKind = String(html.find('#ep-roll-kind').val() || '').trim();
    if (rollKind) {
      prev.roll = {
        kind: rollKind,
        attribute: String(html.find('#ep-roll-attribute').val() || '').trim() || undefined,
        vs: String(html.find('#ep-roll-vs').val() || '').trim() || undefined
      };
    } else {
      delete prev.roll;
    }

    const levels = { ...prev.levels };
    html.find('.ep-level-block').each((_i, el) => {
      const key = String($(el).data('level') || '') as PowerLevelKey;
      if (!LEVEL_KEYS.includes(key)) return;
      levels[key] = readLevelRow($(el));
    });
    prev.levels = levels;
    return prev;
  }

  private collectTagsFromDom(html: JQuery): string[] {
    const tags: string[] = [];
    html.find('#ep-tags-rows .ep-tag-row').each((_i, el) => {
      const $r = $(el);
      const preset = String($r.find('.ep-tag-preset').val() || '').trim();
      if (!preset) return;
      if (preset === '__custom__') {
        const c = String($r.find('.ep-tag-custom').val() || '').trim();
        if (c) tags.push(c);
      } else {
        tags.push(preset);
      }
    });
    return tags;
  }

  private static syncTagRowCustomField($row: JQuery): void {
    const v = String($row.find('.ep-tag-preset').val() || '');
    $row.find('.ep-tag-custom').toggleClass('hidden', v !== '__custom__');
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);

    html.find('[data-action="ep-cancel"]').on('click', () => {
      (this as any).close();
    });

    html.find('[data-action="ep-save"]').on('click', async () => {
      if (!(this.item as any).isOwner) return;
      this.syncFromDom(html);
      const finalized = this.finalizePowersForSave();
      if (!finalized) return;
      try {
        await this.item.update({ 'system.powers': finalized });
        const childIds = ((this.item as any).getFlag('mastery-system', 'childIds') as string[]) || [];
        if (childIds.length > 0) {
          await syncArtifactInheritedFromParent(this.item);
        }
        await pushWorldArtifactNodeToEmbeddedActors(this.item);
        ui.notifications?.info('Embedded powers saved.');
        this._onSaved?.();
        (this as any).close();
      } catch (e) {
        console.error(e);
        ui.notifications?.error('Could not save powers.');
      }
    });

    html.find('[data-action="ep-select-power"]').on('click', (e: JQuery.ClickEvent) => {
      const idx = parseInt(String($(e.currentTarget).data('index')), 10);
      if (!Number.isFinite(idx)) return;
      this.syncFromDom(html);
      this._selectedIndex = idx;
      (this as any).render(false);
    });

    html.find('[data-action="ep-add-power"]').on('click', () => {
      this.syncFromDom(html);
      if (
        !this._lineage.isLineageRoot &&
        Number.isFinite(this._lineage.maxTotalPowers) &&
        this._workingPowers.length >= this._lineage.maxTotalPowers
      ) {
        ui.notifications?.warn('This node cannot add more embedded powers (tree cap reached).');
        return;
      }
      const np = createDefaultEmbeddedPower(randomId());
      if (this._treeDepth != null && !this._lineage.isLineageRoot) {
        np.treeDepthDefined = this._treeDepth;
      }
      this._workingPowers.push(np);
      this._selectedIndex = this._workingPowers.length - 1;
      (this as any).render(false);
    });

    html.find('[data-action="ep-duplicate-power"]').on('click', () => {
      if (!this._workingPowers.length) return;
      if (
        !this._lineage.isLineageRoot &&
        Number.isFinite(this._lineage.maxTotalPowers) &&
        this._workingPowers.length >= this._lineage.maxTotalPowers
      ) {
        ui.notifications?.warn('Cannot duplicate: tree embedded-power cap reached.');
        return;
      }
      this.syncFromDom(html);
      const cur = foundry.utils.deepClone(this._workingPowers[this._selectedIndex]);
      cur.id = randomId();
      cur.name = `${cur.name} (Copy)`;
      if (this._treeDepth != null && !this._lineage.isLineageRoot) {
        cur.treeDepthDefined = this._treeDepth;
      }
      this._workingPowers.splice(this._selectedIndex + 1, 0, cur);
      this._selectedIndex += 1;
      (this as any).render(false);
    });

    html.find('[data-action="ep-delete-power"]').on('click', () => {
      if (!this._workingPowers.length) return;
      const cur = this._workingPowers[this._selectedIndex];
      if (
        cur?.id &&
        !this._lineage.isLineageRoot &&
        this._lineage.lockedPowerIds.has(String(cur.id))
      ) {
        ui.notifications?.warn('This embedded power is inherited from an ancestor and cannot be removed.');
        return;
      }
      this.syncFromDom(html);
      this._workingPowers.splice(this._selectedIndex, 1);
      if (this._selectedIndex >= this._workingPowers.length) {
        this._selectedIndex = Math.max(0, this._workingPowers.length - 1);
      }
      (this as any).render(false);
    });

    html.find('[data-action="ep-import-replace"]').on('click', () => {
      this.runImport(html, 'replace');
    });
    html.find('[data-action="ep-import-append"]').on('click', () => {
      this.runImport(html, 'append');
    });

    html.on('click', '.ep-add-special', (e: JQuery.ClickEvent) => {
      const lvl = String($(e.currentTarget).data('level') || '');
      const $container = html.find(`.ep-special-rows[data-level="${lvl}"]`);
      const $row = $(`
        <div class="ep-sp-row flexrow">
          <input type="text" class="ep-sp-key" placeholder="key" />
          <input type="number" class="ep-sp-rank" placeholder="rank" />
          <input type="number" class="ep-sp-value" placeholder="value" />
          <input type="number" class="ep-sp-raise" placeholder="raise" />
          <input type="text" class="ep-sp-note" placeholder="note" />
          <button type="button" class="ep-sp-remove" title="Remove">×</button>
        </div>`);
      $container.append($row);
    });

    html.on('click', '.ep-sp-remove', (e: JQuery.ClickEvent) => {
      $(e.currentTarget).closest('.ep-sp-row').remove();
    });

    html.find('#ep-tags-rows .ep-tag-row').each((_i, el) => {
      EmbeddedPowerDialog.syncTagRowCustomField($(el));
    });
    html.on('change', '.ep-tag-preset', (e: JQuery.ChangeEvent) => {
      EmbeddedPowerDialog.syncTagRowCustomField($(e.currentTarget).closest('.ep-tag-row'));
    });

    html.find('[data-action="ep-add-tag-row"]').on('click', () => {
      const $c = html.find('#ep-tags-rows');
      const $first = $c.find('.ep-tag-row').first();
      const $clone = $first.clone();
      $clone.find('.ep-tag-preset').val('');
      $clone.find('.ep-tag-custom').val('').addClass('hidden');
      $c.append($clone);
    });

    html.on('click', '.ep-tag-remove', (e: JQuery.ClickEvent) => {
      const $row = $(e.currentTarget).closest('.ep-tag-row');
      const $parent = $row.parent();
      if ($parent.find('.ep-tag-row').length <= 1) {
        $row.find('.ep-tag-preset').val('');
        $row.find('.ep-tag-custom').val('').addClass('hidden');
        return;
      }
      $row.remove();
    });
  }

  private runImport(html: JQuery, mode: 'replace' | 'append'): void {
    const raw = String(html.find('#ep-json-area').val() || '').trim();
    if (!raw) {
      ui.notifications?.warn('Paste JSON first.');
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const incoming = parseImportedPayload(parsed);
      this.syncFromDom(html);
      if (mode === 'replace') {
        this._workingPowers = incoming;
        assignFreshIds(this._workingPowers, []);
      } else {
        assignFreshIds(incoming, this._workingPowers);
        this._workingPowers.push(...incoming);
      }
      this._selectedIndex = Math.min(this._selectedIndex, Math.max(0, this._workingPowers.length - 1));
      if (this._workingPowers.length && mode === 'replace') this._selectedIndex = 0;
      ui.notifications?.info(mode === 'replace' ? 'Powers replaced from JSON.' : 'Powers appended from JSON.');
      (this as any).render(false);
    } catch (err: any) {
      console.error(err);
      ui.notifications?.error(err?.message || 'Invalid JSON.');
    }
  }
}
