import { EFFECT_NATURAL_FIRE, EFFECT_NONE } from "./constants.mjs";
import { findStyle } from "./styles.mjs";

const PANEL_CLASS = "df-effect-style-info";

/**
 * Below the Fire Style select, describe the chosen style: name, description,
 * clickable source, license and limitations. Hides the style row for effect None.
 * Built from text nodes only; no HTML from i18n strings is injected.
 */
export function decorateStyleField(form, localize = defaultLocalize) {
  const select = form?.querySelector?.('[name="system.fireStyle"]');
  const group = select?.closest?.(".form-group");
  if (!select || !group) return;

  let panel = form.querySelector(`.${PANEL_CLASS}`);
  if (!panel) {
    panel = form.ownerDocument.createElement("div");
    panel.className = `form-group ${PANEL_CLASS}`;
    group.after(panel);
  }

  const effectType = form.querySelector('[name="system.effectType"]')?.value || EFFECT_NATURAL_FIRE;
  const hidden = effectType === EFFECT_NONE;
  group.style.display = hidden ? "none" : "";
  panel.style.display = hidden ? "none" : "";
  if (!hidden) renderPanel(panel, findStyle(effectType, select.value), localize);

  if (form.dataset.dfStyleInfo !== "1") {
    form.dataset.dfStyleInfo = "1";
    form.addEventListener("change", (event) => {
      const name = event.target?.name;
      if (name === "system.fireStyle" || name === "system.effectType") decorateStyleField(form, localize);
    });
  }
}

export function renderPanel(panel, style, localize = defaultLocalize) {
  const doc = panel.ownerDocument;
  panel.replaceChildren();
  if (!style) return;

  const prefix = `DF_PARTICLE_EFFECTS.FIRE_STYLE.${style.key}`;
  const label = doc.createElement("label");
  label.textContent = localize("DF_PARTICLE_EFFECTS.STYLE_INFO.heading");
  const body = doc.createElement("div");
  body.className = "form-fields";
  body.style.flexDirection = "column";
  body.style.alignItems = "flex-start";
  body.style.gap = "0.25rem";

  body.append(
    line(doc, localize(`${prefix}.label`), localize(`${prefix}.description`), true),
  );
  if (style.source) {
    const sourceLine = line(doc, localize("DF_PARTICLE_EFFECTS.STYLE_INFO.source"), "");
    const link = doc.createElement("a");
    link.href = style.source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `${style.source.title} by ${style.source.author} (Shadertoy)`;
    sourceLine.append(link);
    body.append(
      sourceLine,
      line(
        doc,
        localize("DF_PARTICLE_EFFECTS.STYLE_INFO.license"),
        `${style.source.license}. ${localize("DF_PARTICLE_EFFECTS.STYLE_INFO.independent")}`,
      ),
    );
  }
  body.append(line(doc, localize("DF_PARTICLE_EFFECTS.STYLE_INFO.limitations"), localize(`${prefix}.limitations`)));

  panel.append(label, body);
}

function line(doc, title, text, strongTitle = false) {
  const row = doc.createElement("p");
  row.style.margin = "0";
  const head = doc.createElement(strongTitle ? "strong" : "em");
  head.textContent = strongTitle ? title : `${title}: `;
  row.append(head);
  if (text) row.append(doc.createTextNode(strongTitle ? ` – ${text}` : text));
  return row;
}

function defaultLocalize(key) {
  return globalThis.game?.i18n?.localize?.(key) ?? key;
}
