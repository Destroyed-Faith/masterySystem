# Mastery System - Manual Testing Checklist

Run these tests in a live Foundry VTT instance with the Mastery System loaded.

---

## 1. Character Creation

### 1.1 Attribute Point Buy
- [X] Create a new character actor
- [X] Verify all 7 attributes start at **2** (Mastery Rank base)
- [X] Verify **16 attribute points** are available
- [X] Distribute points and verify no attribute exceeds **8**
- [X] Verify remaining points counter decreases correctly
- [X] Verify Stone count updates: attribute reaching 8 shows **1 Stone**
- [X] Try to exceed 8 on an attribute - should be blocked

### 1.2 Skill Point Buy
- [X] Verify **16 skill points** are available
- [X] Verify no single skill can exceed **4** at creation
- [X] Verify all 5 categories appear (Physical, Knowledge & Craft, Social, Survival, Martial)
- [ ] Verify new skills appear: Negotiation, Seduction, Investigation, Etiquette, Artisanry, Herbalism <- NOPE>
- [ ] Verify renamed skill: Alchemy (was "Herbalism / Alchemy") NOPE
- [ ] Verify Crafting shows Might as primary attribute (not Intellect) NOPE
- [ ] Verify Occultism shows Resolve as primary attribute NOPE
- [ ] Verify Survival shows Vitality as primary attribute NOPE

### 1.3 Powers & Mastery Trees Trees sind komplett kaputt kann nichts auswählen. No predefined powers for this tree
- [ ] Can select up to **2 Mastery Trees** -> The power trees are not shown i get the error message: foundry.mjs:115132 No predefined powers found for this tree 
- [ ] Can select **4 total Powers** across those trees
- [ ] Can set **2 powers to Rank 2**
- [ ] Power dialog shows correct tree and rank options

### 1.4 Disadvantages & Faith Fractures
- [X] Can add disadvantages -> But the fields that explains what the addiction or the issue is can be empty that shouldnt be the case
- [X] Total disadvantage points capped at **8**
- [ ] Faith fractures field is visible

### 1.5 Schticks
- [ ] Can add schticks (1 per Mastery Rank)
- [ ] Schtick has name and manifestation fields

### 1.6 Finalize Creation
- [ ] Finalize button works
- [ ] After finalization, creation mode UI is replaced with progression UI
- [ ] Powers get `minLevel` set to their current level

---

## 2. Derived Values

### 2.1 Health Bars
- [X] 4 bars visible: Healthy, Bruised, Injured, Wounded
- [X] Each bar max = **Vitality x 2**
- [X] Change Vitality and verify bars update proportionally
- [X] Bar penalties: Healthy=0, Bruised=-1, Injured=-2, Wounded=-4

### 2.2 Stress Bars
- [X] 4 bars visible: Healthy, Stressed, Not Well, Breaking
- [ ] Each bar max = **Resolve + Intellect**
- [ ] Change Resolve or Intellect and verify bars update

### 2.3 Stone Pools
- [X] All 7 attributes have stone pools (including **Wits**)
- [X] Pool max = **floor(attribute / 8)**
- [X] Attribute at 7 = 0 stones, at 8 = 1 stone, at 16 = 2 stones

### 2.4 Armor Total
- [ ] Total Armor = **Mastery Rank + Armor Value + Shield Value**
- [ ] Equip armor and shield, verify total updates

### 2.5 Evade
- [ ] Verify evade includes base evade + shield evade bonus NOPE

### 2.6 Saves
Bei Saves steht 2d8 K2 +2 <- wo kommen die +2 her>

---

## 3. XP Progression (Post-Creation)

### 3.1 Attribute XP Spending
- [X] Click + on an attribute to add pending increase
- [X] Verify XP cost: 1 XP per point (attr 0-8), 2 XP (9-16), 3 XP (17-24)
- [ ] Click - to remove pending increase (refund)
- [ ] Confirm changes: attribute increases, XP decreases
- [ ] Cancel changes: everything reverts
- [ ] Header XP display updates live with pending changes

### 3.2 Skill XP Spending
- [ ] Click + to increase skill (pending)
- [ ] Verify XP cost: new_rank x 2 XP
- [ ] Click - to decrease skill (refund)
- [ ] Confirm applies changes
- [ ] Cancel reverts
- [ ] Header XP display updates live

### 3.3 Power Level XP Spending
- [ ] Click + to increase power level (pending)
- [ ] Verify costs: Level 1=2, 2=4, 3=8, 4=16, 5=24, 6=32, 7-12=40 XP
- [ ] Click - to decrease (cannot go below minLevel / creation baseline)
- [ ] Confirm applies changes
- [ ] Cancel reverts
- [ ] Header XP display updates live

---

## 4. Dice Rolling

### 4.1 Basic Roll
- [ ] Click an attribute to roll
- [ ] Verify dice count = attribute value
- [ ] Verify kept dice count = Mastery Rank
- [ ] Verify highest dice are kept
- [ ] Chat message shows all dice with kept ones highlighted

### 4.2 Exploding Dice
- [ ] Roll repeatedly until an 8 explodes
- [ ] Verify explosion: 8 + next roll (can chain)
- [ ] Exploded dice are marked in chat

### 4.3 Skill Rolls
- [ ] Roll a skill check
- [ ] Verify skill pool info shown in chat
- [ ] On failure, verify "Turn it into a success" button appears (if skill pool sufficient)
- [ ] Spend skill points to turn failure into success
- [ ] Verify skill pool decreases

### 4.4 Health Penalty on Rolls
- [ ] Damage a character until Bruised bar is broken
- [ ] Roll and verify dice pool reduced by 1 (penalty -1)
- [ ] Further damage until Injured: dice pool reduced by 2

### 4.5 Raises (Dual-TN)
- [ ] Skill/attribute dialog shows **Normal TN** (unchanged) and **Raise TN** (+4 per declared raise)
- [ ] Roll vs Normal TN only — no TN inflation from declared raises
- [ ] **Fail** (below Normal TN): no success, no raise effects
- [ ] **Partial success** (Normal TN ≤ total < Raise TN): success without raise effects; martial/spell raise cost is lost
- [ ] **Full success** (total ≥ Raise TN): raise cost restored + chosen raise effects apply
- [ ] Stone `freeRaises` / `spellAutoRaises`: bonus raise effects only on **full** success (no extra TN/cost)
- [ ] Auto-Raises (pool −4) and margin raises removed

---

## 5. Combat

### 5.1 Initiative
- [ ] Start combat encounter
- [ ] Verify initiative rolled with MR dice (exploding)
- [ ] Initiative Shop opens for PCs

### 5.2 Initiative Shop
- [ ] Spend 4 initiative for +2m movement
- [ ] Spend 8 for initiative swap
- [ ] Spend 12 for extra reaction
- [ ] Spend 20 for extra attack
- [ ] Remaining initiative sets turn order

### 5.3 Attack Execution
- [ ] Attack a target
- [ ] Verify pool = attribute dice, keep = MR
- [ ] When Raises > 0: pick raise **effects before roll** (damage, special +MR, range, AoE, duration)
- [ ] Cost preview shows pre-roll payment (martial: MR d8 per raise; spell: MR total value)
- [ ] Normal TN vs Raise TN displayed separately
- [ ] **Fail**: no damage dialog
- [ ] **Partial / Full success**: damage dialog opens (no post-roll raise picker)

### 5.4 Damage Resolution
- [ ] Roll damage dice (do NOT explode)
- [ ] Martial damage raise = **+MR d8** (not +1d8); spell damage raise = +1d8
- [ ] Special raise adds **+MR** to existing special rank (e.g. Ignite(3) + MR3 → Ignite(6))
- [ ] Partial success: reduced snapshot after cost; no raise effects
- [ ] Full success: final snapshot with raise effects (+ stone bonus raises if active)
- [ ] Armor subtraction: Total Armor = MR + Armor + Shield
- [ ] Minimum 1 damage per rolled 8 (even if armor blocks all)
- [ ] Damage applies to health bars with overflow

### 5.5 Stone Powers
- [ ] Open Stone Powers dialog
- [ ] Activate a stone power
- [ ] Verify cost: 1st use = 1 stone, 2nd = 2, 3rd = 4 (exponential)
- [ ] End of round: MR stones regenerate (Exhausted -> Ready)

### 5.6 Action Economy
- [ ] Verify 1 Movement + 1 Attack Action per turn
- [ ] Extra attack from Initiative Shop or Stones works
- [ ] Extra reaction from Initiative Shop or Stones works

### 5.7 End of Turn / Round
- [ ] End turn: verify save-ends opportunity
- [ ] End round: verify stone regeneration

---

## 6. Equipment

### 6.1 Weapons
- [ ] Create/equip a weapon
- [ ] Verify damage dice, weapon type, specials display
- [ ] Attack uses weapon damage

### 6.2 Armor
- [ ] Equip armor
- [ ] Verify armor value adds to armorTotal
- [ ] Light (+4), Medium (+8), Heavy (+12)

### 6.3 Shields
- [ ] Equip shield
- [ ] Verify shield value adds to armorTotal
- [ ] Verify evade bonus from shield

### 6.4 Inventory
- [ ] Drag-and-drop equipment
- [ ] Paperdoll body slot spans amulet/ring row through hands row (taller center column)
- [ ] Equipment tiles have no edit/delete overlay buttons (drag + click info still work)
- [ ] Trash dropzone right of paperdoll: drag item → confirm → deletes item
- [ ] Echo-bound items cannot be dropped on trash (warning shown)
- [ ] General Items Storage opens
- [ ] Store (GM) opens

### 6.5 Echo Deck (Attributes tab)
- [ ] Echo Deck shows race name prominently; tagline/type/size in collapsed "Race details"
- [ ] No "Core Traits" section on sheet (traits live on Echo artifacts)
- [ ] Echo cards have more vertical space; Roll/Use buttons still work
- [ ] Echo creation dialog preview shows meta + sub-choice only (no core trait list)

---

## 7. Rest & Recovery

### 7.1 Safe Haven Rest
- [ ] Click Safe Haven Rest button
- [ ] Verify current health bar heals to full
- [ ] Verify skill pools restore (skillsSpent resets)
- [ ] Verify stone pools restore
- [ ] Verify 1 scarred bar restored (if any)

---

## 8. Summons & Familiars (Stone Powers → Summons tab)

- [ ] Stone pools visible on Summons tab
- [ ] Name field types normally (not backwards)
- [ ] New Summon wizard: basics → base stone → upgrades → senses
- [ ] Each stone slot assigns a specific attribute from the pool
- [ ] Live preview shows stats and bound-stone budget
- [ ] Bind Familiar persists on character; sustained stones deducted
- [ ] Multiple familiars up to MR × 4
- [ ] Create Actor produces summon in Familiars folder
- [ ] Place Token drops token on scene near owner
- [ ] Release Bond returns stones and removes summon actor
- [ ] Summon sheet shows read-only statblock

---

## 9. Passives

- [ ] Passive selection dialog opens before combat
- [ ] Can select up to MR passives from available passive powers
- [ ] Passives lock for the duration of combat
- [ ] Active buffs display on character sheet

---

## 10. UI & Themes

- [ ] All 4 themes work: Rulebook, Ember, Ashen, Bloodmoon
- [ ] Character sheet tabs: Attributes, Skills, Powers, Equipment, Disadvantages, Biography
- [ ] Radial menu appears on token
- [ ] Combat carousel shows turn order
