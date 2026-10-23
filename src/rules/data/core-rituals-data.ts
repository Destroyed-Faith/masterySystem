/** Auto-generated from core-rituals.json — do not edit by hand; re-run: node scripts/embed-rules-json.mjs */
export default [
  {
    "id": "read-resonance",
    "name": "Read Resonance",
    "tagline": "You quiet your senses and listen for the pressure left behind when power touched the world.",
    "time": "1 Tyhran Hour",
    "baseTnNote": "**12 minimum** (higher for harder sources or tasks)",
    "effectDuration": "Concentration, up to 1 Forearm",
    "requirement": "The caster must focus on an area, object, threshold, corpse, mark, relic, symbol, wound, seal, or visible phenomenon.",
    "exampleApproaches": "Occult (listen to old names), Science & Craft (tune instruments), Investigation (reconstruct traces), Physical (measured tapping).",
    "tiers": {
      "0": "You learn whether readable Resonance is present within **10 meters**. If Resonance is present, you learn its broad type: **Ritual**, **Artifact**, **Ward**, **Seal**, **Demonic**, **Divine**, **Necrotic**, **Cursed**, **Spiritual**, **Planar**, or **Unknown**.",
      "1": "You learn the Resonance's rough strength and state: faint, strong, active, dormant, fresh, old, fading, unstable, concealed, or corrupted. You can tell whether a Ritual was worked here, an Artifact was active here, a Ward or Seal is present, or a demonic or divine influence touched the area.",
      "2": "You read the Resonance pattern. You learn what kind of thing the Resonance clings to: a place, object, body, threshold, mark, wound, altar, doorway, weapon, blood, name, or spiritual anchor. You may also learn whether the Resonance was created by protection, binding, hunger, command, sacrifice, death, memory, travel, concealment, or corruption.",
      "3": "You may trace one Resonance to its nearest source, anchor, exit point, or strongest remaining direction within **100 meters**, if such a trace still exists. This can reveal that a powerful Artifact was carried away, a Ritual was worked from a specific point, a Seal is anchored elsewhere, or a demonic influence entered through a specific mark or threshold.",
      "4": "You pierce common masking, false traces, and concealment. You learn the true dominant Resonance beneath the surface layer, unless it is protected by a stronger story-level ward, Artifact will, divine concealment, demonic deception, or specific GM protection."
    },
    "limits": "Read Resonance detects **supernatural traces** and identifies their broad character or origin. Investigation, Tracking and Perception handle mundane evidence; **Learn Artifact** examines an Artifact's function and binding. The achieved tier determines the depth of the reading. Failure gives no reliable conclusion.",
    "danger": "Strong Resonance can answer back; ancient Seals, demonic marks, divine ruins and intelligent Artifacts may notice a reading."
  },
  {
    "id": "locate-object",
    "name": "Locate Object",
    "tagline": "You close your eyes and trace a pattern in the air. A pull forms within your mind, guiding you toward what you seek.",
    "time": "1 Tyhran Hour",
    "baseTnNote": "**12 minimum** (higher for harder sources or tasks)",
    "effectDuration": "Concentration, up to 1 Forearm",
    "requirement": "You must have seen or touched the object, or know its precise form.",
    "exampleApproaches": "Survival (dowsing and landmarks), Science & Craft (compass or sympathetic tool), Investigation (study connections), Social (recall a promise).",
    "tiers": {
      "0": "You sense the direction of one specific object you describe within **60 meters**, provided no major ward, consecrated barrier, sealed vault, or Resonance-blocking obstruction blocks the link.",
      "1": "The range expands to **300 meters**. You can distinguish between multiple similar items and sense which one best matches your mental image.",
      "2": "You receive short sensory flashes from the object's immediate environment, such as smell, texture, temperature, pressure, or nearby sound.",
      "3": "The Ritual can reach through thin barriers, shallow ground, or up to **2 meters of stone**. Range extends to **1 kilometer**.",
      "4": "You glimpse one brief memory tied to the object, such as who last touched it, where it last rested, or what strong emotion clings to it. Range extends to **5 kilometers**, unless a stronger ward blocks the link."
    },
    "limits": "Locate Object tracks a **specified object or defined object type**, including one carried by a creature. Tracking and Investigation address ordinary evidence; **Learn Artifact** reveals an Artifact's purpose.",
    "danger": "Powerful, cursed or intelligent objects may notice your search."
  },
  {
    "id": "clairvoyance",
    "name": "Clairvoyance",
    "tagline": "You open a window through distance, letting your mind wander where your body cannot.",
    "time": "1 Tyhran Hour",
    "baseTnNote": "**12 minimum** (higher for harder sources or tasks)",
    "effectDuration": "Concentration, up to 1 Forearm",
    "requirement": "You must name a place you know or a creature familiar to you.",
    "exampleApproaches": "Occult (meditation), Science & Craft (mirrors and lenses), Investigation (mental reconstruction), Social (rhythmic chanting).",
    "tiers": {
      "0": "You project your senses to a known location or familiar creature within **1 kilometer**. You can see from that point as though present, though sight is hazy and colorless.",
      "1": "The vision becomes clearer and gains sound. You can faintly hear conversations, movement, and nearby environmental noise.",
      "2": "You can shift the viewpoint up to **20 meters** around the initial location, or follow the creature slowly at half walking speed.",
      "3": "The image becomes vivid and detailed. You may focus on small objects, writings, symbols, faces, or gestures clearly.",
      "4": "You may scry across any distance on the same plane. With a strong sympathetic connection and GM approval, the Ritual may glimpse across a planar boundary. After ending the Ritual, your body remains senseless for a brief moment."
    },
    "limits": "Clairvoyance observes a known place or familiar creature from a distance. Wards, divine concealment, demonic deception and protected minds apply normally; the caster remains an observer rather than an actor at the remote location.",
    "danger": "Distant or planar sight may attract the attention of what is watched."
  },
  {
    "id": "threshold-alarm",
    "name": "Threshold Alarm",
    "tagline": "You mark a threshold, camp edge, door, window, or boundary so that the place remembers being crossed.",
    "time": "1 Tyhran Hour",
    "baseTnNote": "**12 minimum** (higher for harder sources or tasks)",
    "effectDuration": "Until the next Safe Haven Rest or one Tyhran Day, whichever comes first",
    "requirement": "You must mark or touch the threshold, boundary, or protected entry point.",
    "exampleApproaches": "Survival (knotted boundary line), Finesse (precise markings), Science & Craft (chimes and wire), Occult (warding words).",
    "tiers": {
      "0": "Ward one doorway, window, tunnel mouth, room boundary, or camp edge. When a creature crosses it, one named wardkeeper within **1 kilometer** receives a clear alarm. This does not block, harm, slow, or reveal the creature.",
      "1": "You may name up to **Mastery Rank** creatures who do not trigger the alarm.",
      "2": "The alarm can cover a small house, campsite, chamber, or connected room cluster instead of one entry point. The wardkeeper senses the direction of the breach.",
      "3": "The alarm conveys the approximate number and size of creatures crossing the threshold. Mundane stealth does not prevent the alarm.",
      "4": "The alarm may wake all named allies inside the warded area. It cannot be silenced or bypassed without overcoming the established warding TN or using a specific countermeasure."
    },
    "limits": "Threshold Alarm **warns of a crossing**; the named tiers determine its reach and the detail conveyed. Intruders remain free to enter, and defensive protection requires a separate effect. ---",
    "danger": ""
  },
  {
    "id": "seal-passage",
    "name": "Seal Passage",
    "tagline": "You press power into a door, gate, hatch, tunnel, archway, or ancient seam, telling the world that this way is closed.",
    "time": "1 Tyhran Hour",
    "baseTnNote": "**12 minimum** (higher for harder sources or tasks)",
    "effectDuration": "Until broken, opened, dismissed, or overcome",
    "requirement": "You must touch the passage, seal, door, gate, hatch, or boundary being affected.",
    "exampleApproaches": "Science & Craft (forge a seal), Physical (stonework gestures), Occult (inscribe a rune), Social (bind a declared promise).",
    "tiers": {
      "0": "You seal one accessible mundane passage, such as a door, gate, hatch, window, tunnel mouth, or stone seam. The passage closes and locks without needing a key. If you are attempting to open an existing sealed or forgotten passage, you instead confirm whether such a passage or seal truly exists.",
      "1": "The sealed passage cannot be opened by mundane keys, latches, or ordinary handling. It must be forced, ritually opened, dismissed by the caster, or overcome with an appropriate check against the established warding TN.",
      "2": "The sealed passage becomes twice as physically durable. If the object has Health, Structure, or a similar value, double that value for the purpose of breaking through.",
      "3": "The sealed passage becomes as hard as solid granite for the purpose of forcing, breaking, burning, cutting, or smashing it.",
      "4": ""
    },
    "limits": "Seal Passage applies a supernatural seal to an **existing passage** or opens such a seal at Raise 4. Declare **sealing or opening before rolling**; the Raise-4 opening mode replaces the lower sealing tiers. Ordinary locks, construction and excavation use their relevant Skills.",
    "danger": ""
  },
  {
    "id": "purify-ground",
    "name": "Purify Ground",
    "tagline": "You cleanse a place where something wrong has soaked into the world.",
    "time": "1 Tyhran Hour",
    "baseTnNote": "**12 minimum** (higher for harder sources or tasks)",
    "effectDuration": "Instant, with lasting consequences as described by the Raise result",
    "requirement": "You must remain within the area being purified for the full Ritual.",
    "exampleApproaches": "Survival (herbal smoke), Science & Craft (salt patterns), Occult (prayer), Social (purifying song).",
    "tiers": {
      "0": "Purify a small area, such as a room, grave, altar, blood circle, ritual mark, corpse pile, shrine, or battlefield focus, from surface-level necrotic, demonic, infernal, or corrupt ritual residue.",
      "1": "Before the residue fades, you learn its broad type and emotional pressure, such as hunger, fear, command, grief, sacrifice, binding, or desecration.",
      "2": "You suppress one minor ongoing scene effect caused by the residue, such as whispers, corpse-stirring, nightmare pressure, ritual sickness, or spiritual contamination.",
      "3": "You purify a larger connected site, such as a crypt chamber, ruined shrine, small battlefield, ritual cellar, desecrated house, or corrupted grove.",
      "4": "You may break one active residue-anchor, lingering desecration, corpse-binding, or demonic trace if the declared Task Level adequately accounts for the relevant source. The GM may require a specific focus, name, remains, or symbol."
    },
    "limits": "Purify Ground cleanses **spiritual and ritual residue** from an existing site at the declared tier. Physical evidence, structural damage, Health and Scarred Bars remain as they were; Safe Haven and Healing follow their own rules. ---",
    "danger": ""
  },
  {
    "id": "learn-artifact",
    "name": "Learn Artifact",
    "tagline": "You study a relic until its surface stops being an object and starts becoming a history.",
    "time": "1 Tyhran Hour",
    "baseTnNote": "**12 minimum** (higher for harder sources or tasks)",
    "effectDuration": "Instant",
    "requirement": "You must hold, touch, examine, or remain close to the Artifact or relic for the full Ritual.",
    "exampleApproaches": "Science & Craft (inspect workmanship), Investigation (reconstruct provenance), Occult (speak its names), Social (ritual testimony).",
    "tiers": {
      "0": "You learn the Artifact's visible category, basic function, occupied Slot, binding status, and whether it is mundane, Resonant, Echo-bound, cursed, awakened, dormant, or unknown.",
      "1": "You learn its origin style, creator tradition, previous owner trace, emotional residue, or broad purpose.",
      "2": "You learn one hidden restriction, cost, dormant function, binding rule, warning sign, or danger connected to using or bonding with it.",
      "3": "You may learn an awakening condition, command phrase, pact mark, curse logic, hidden limitation, or why the Artifact rejects or accepts a bearer.",
      "4": "You reach one deeper truth: true creator, true purpose, concealed taint, secret command, hidden price, or a protected memory the Artifact is willing or forced to reveal."
    },
    "limits": "Learn Artifact reveals **functions, binding rules, costs or hidden history** in proportion to its achieved tier. Intelligent, divine or demonic Artifacts can keep secrets behind appropriately high source difficulty. Read Resonance identifies their supernatural character; this Ritual investigates the Artifact itself.",
    "danger": ""
  },
  {
    "id": "forgotten-memory",
    "name": "Forgotten Memory",
    "tagline": "You touch a place or object and listen for the feelings it could not let go.",
    "time": "1 Tyhran Hour",
    "baseTnNote": "**12 minimum** (higher for harder sources or tasks)",
    "effectDuration": "Concentration, up to 1 Forearm",
    "requirement": "You must touch the object, location, wall, floor, weapon, relic, or remains being read.",
    "exampleApproaches": "Investigation (reconstruct a scene), Occult (meditation), Social (lamentation), Survival (read a place through living signs).",
    "tiers": {
      "0": "You sense the strongest emotional residue tied to the place or object, such as fear, grief, hunger, relief, rage, devotion, betrayal, or hope.",
      "1": "You receive one sensory fragment connected to that residue: sound, smell, touch, color, pressure, taste, or a single image.",
      "2": "You witness a brief sequence of events around the memory. The sequence is emotional and symbolic, but it shows what kind of event created the residue.",
      "3": "You identify one important person, symbol, object, phrase, direction, or relationship connected to the memory.",
      "4": "You step into the memory for a brief moment and experience it from within. If the memory is violent, demonic, death-bound, or horrific, the GM may call for a **Fear Check (Resolve k1; fixed Fear result bands)**."
    },
    "limits": "Forgotten Memory reads **subjective emotional residue in a place or object**. Its impressions may be incomplete or symbolic; Investigation establishes factual conclusions. Personal former-life memories belong to **Echo Imprints**. ---",
    "danger": ""
  },
  {
    "id": "word-of-recall",
    "name": "Word of Recall",
    "tagline": "You etch a hidden mark of return upon a sanctuary, a promise to the world that you will one day come home.",
    "time": "1 Tyhran Hour",
    "baseTnNote": "**12 minimum** (higher for harder sources or tasks)",
    "effectDuration": "Permanent until used, dismissed, broken, or removed",
    "requirement": "The place must be meaningful to you and prepared through prayer, blood, sacrifice, craft, memory, or witness.",
    "exampleApproaches": "Survival (route knots), Science & Craft (engrave a homeward mark), Occult (true-name rite), Social (ceremony of belonging).",
    "tiers": {
      "0": "You bind a spiritual mark to the location. At a later time, you may return to that exact point. The mark fades when used.",
      "1": "You may bring one willing ally who stands within **2 meters** of you when the recall is activated.",
      "2": "The recall becomes gentler. Willing allies arrive standing, stable, and with fragile gear intact unless the destination itself is dangerous.",
      "3": "The recall can pass through minor wards, interference, or sanctum pressure, unless a stronger effect specifically blocks planar or spatial travel.",
      "4": "The mark becomes a lasting bond. It may be used once every 7 Tyhran Days without fading, but the Stones remain Sealed while the bond exists."
    },
    "limits": "Word of Recall anchors a return to a **previously visited, meaningful location**. The destination retains its actual hazards. The return uses the listed out-of-combat activation, subject to binding seals, travel prohibitions and exceptional warding.",
    "danger": ""
  },
  {
    "id": "dreamwalk",
    "name": "Dreamwalk",
    "tagline": "You step through the mirror of sleep, drifting into another's dreams to seek truth, warning, or solace.",
    "time": "1 Tyhran Hour",
    "baseTnNote": "**12 minimum** (higher for harder sources or tasks)",
    "effectDuration": "Up to 1 Forearm inside the dream",
    "requirement": "The target must be asleep and willing, or their soul must be unguarded with GM approval.",
    "exampleApproaches": "Occult (trance), Social (lullaby), Science & Craft (dream mandala), Survival (sleep herbs).",
    "tiers": {
      "0": "You enter the target's dreamscape, perceiving symbolic visions of their fears, memories, desires, or current emotional state. You may speak within the dream as a guiding voice.",
      "1": "You may interact with elements of the dream, reshape minor symbols, calm a nightmare scene, or create a safe image for conversation.",
      "2": "You can communicate directly with the dreamer's subconscious. A simple message, warning, apology, or promise may persist after waking.",
      "3": "You glimpse buried memories or truths the target hides even from themselves. These are emotional and symbolic, not guaranteed factual records.",
      "4": "You risk full immersion, walking the dream as if real. The dreamer may see you clearly. If the dream is hostile, demonic, cursed, or traumatic, the GM may call for a **Fear Check (Resolve k1; fixed Fear result bands)**."
    },
    "limits": "Dreamwalk allows an encounter **within a dream**, respecting the sleeper's agency and defenses. Protected secrets require an adequate target-based Task Level, the appropriate named tier and GM approval. Social persuasion and lasting psychological recovery follow their own rules. ---",
    "danger": ""
  },
  {
    "id": "last-light",
    "name": "Last Light",
    "tagline": "You kindle a flame for the fallen, guiding what remains beyond the veil so it may rest.",
    "time": "1 Tyhran Hour",
    "baseTnNote": "**12 minimum** (higher for harder sources or tasks)",
    "effectDuration": "Instant, with lasting consequences as described by the Raise result",
    "requirement": "Performed within sight of the body, grave, ashes, relic, or death-place of the deceased.",
    "exampleApproaches": "Social (farewell and witness), Occult (liturgy), Science & Craft (memorial craft), Survival (funerary herbs).",
    "tiers": {
      "0": "You perform a rite that severs the soul's lingering ties, helping it pass peacefully and preventing ordinary undeath or spiritual corruption from taking hold.",
      "1": "The immediate burial area is purified from minor necrotic residue, corpse-stirring, grave whispers, or restless spiritual pressure.",
      "2": "You may carry one short message from the living to the dead, such as farewell, forgiveness, warning, or love.",
      "3": "If the spirit is willing or able, it may manifest briefly, sharing one phrase, image, emotion, or final impression before passing beyond reach.",
      "4": "The grave, body, or death-place becomes hallowed against future desecration or necromantic use unless overcome by a stronger effect."
    },
    "limits": "Last Light guides a deceased soul's **natural passage** and protects ordinary funerary rites from spiritual contamination or undeath. It is a funerary working; resurrection, combat against undead and Safe Haven recovery use their existing systems. ---",
    "danger": ""
  },
  {
    "id": "augury-signs-of-tomorrow",
    "name": "Augury — Signs of Tomorrow",
    "tagline": "You ask the world which shadow a decision may cast.",
    "time": "1 Tyhran Hour",
    "baseTnNote": "**12 minimum** (higher for harder sources or tasks)",
    "effectDuration": "Instant",
    "requirement": "State **one specific course of action** you genuinely intend to attempt within the next Tyhran Day; arrange a symbolic medium, such as ashes, cards, water, metal shavings, bones, or written omens.",
    "exampleApproaches": "Occult (prayer), Survival (natural signs), Science & Craft (star chart), Social (oracular storytelling).",
    "tiers": {
      "0": "You receive a symbolic omen: **favorable**, **dangerous**, **mixed**, or **uncertain**, based on the course's plausible near-term consequences.",
      "1": "The omen suggests the broad **nature of the main opportunity or danger**, such as betrayal, violence, spiritual pressure, loss, or assistance.",
      "2": "One image, sound, or phrase hints at a **condition or action that could alter** the likely outcome.",
      "3": "One important **person, place, object, or choice** connected to the possible outcome appears symbolically.",
      "4": "You glimpse one **plausible short future scene** and a significant condition under which it could occur. It is not an inevitable timeline."
    },
    "limits": "Augury offers a **plausible omen based on current circumstances**, not a fixed future. A changed situation can change the omen. Repeating an unchanged question adds no new information; ambiguous questions receive ambiguous signs.",
    "danger": ""
  },
  {
    "id": "circle-of-quiet",
    "name": "Circle of Quiet",
    "tagline": "You draw a boundary around a little peace, asking the world's restless whispers to soften.",
    "time": "1 Tyhran Hour",
    "baseTnNote": "**12 minimum** (higher for harder sources or tasks)",
    "effectDuration": "Until the next Safe Haven Rest or 1 Tyhran Day, whichever comes first",
    "requirement": "Remain within the intended space and mark its boundary throughout the working.",
    "exampleApproaches": "Occult (quiet litany), Social (shared lullaby), Science & Craft (harmonic chimes), Survival (woven boughs).",
    "tiers": {
      "0": "A **2-meter area** grows quiet in a **spiritual**, not acoustically silent, sense. Faint ambient whispers and harmless psychic unease from old residue soften.",
      "1": "The circle may cover **one modest chamber** rather than a 2-meter area. Normal speech and ordinary environmental sounds remain audible.",
      "2": "Willing sleepers inside experience relief from **minor, non-hostile residual dream imagery**. Genuine nightmares caused by active curses, Powers, or hostile spirits remain effective.",
      "3": "Minor recurring **ambient echoes** from an old event (distant knocks, flickering spiritual afterimages, meaningless murmurs) quiet down while the circle lasts. The source itself is not purified.",
      "4": "The circle may cover **a small connected group of rooms or campsite**, sharing its peace with willing occupants. It still cannot overpower an active hostile working."
    },
    "limits": "Circle of Quiet softens **ambient spiritual noise** so a place feels calmer. Normal sound, hostile Powers, fear, healing and rest use their existing rules. **Threshold Alarm** detects crossings; **Purify Ground** removes residue.",
    "danger": ""
  },
  {
    "id": "binding-oath",
    "name": "Binding Oath",
    "tagline": "You give a spoken promise a witness that words alone cannot provide.",
    "time": "1 Tyhran Hour",
    "baseTnNote": "**12 minimum** (higher for harder sources or tasks)",
    "effectDuration": "As stated by the chosen tier, no longer than 1 Lunar Month",
    "requirement": "Two **informed, willing** oathmakers agree to **clear, specific terms** and take part in the full ceremony. They may create a shared witness token.",
    "exampleApproaches": "Social (public witness or song), Occult (names and vow), Science & Craft (engraved token), Investigation (precise wording).",
    "tiers": {
      "0": "A faint shared sign manifests for **1 Tyhran Day**, bearing witness that both parties freely spoke **these agreed terms**. It does not prove that either intended to comply.",
      "1": "For up to **7 Tyhran Days**, either party may touch the sign to recall the **precise terms** they voluntarily accepted. The Ritual does not alter memories or beliefs.",
      "2": "The sign can show whether **one clearly measurable condition** has been **fulfilled, broken, or remains unresolved**, if the facts are accessible to the working. Ambiguous duties remain unresolved.",
      "3": "When that objective condition is fulfilled or broken, both willing signers feel **one brief, non-damaging spiritual echo**, even if separated on the same plane. It does not reveal location or intention.",
      "4": "The shared witness token preserves the agreed words and the observable condition's status for **up to 1 Lunar Month**, visible to anyone the signers allow to examine it. No private thoughts are recorded."
    },
    "limits": "Binding Oath records a **mutually voluntary, clearly worded promise** as a lasting supernatural witness. It observes declared conditions without compelling conduct or punishing breaches. Unclear terms yield an uncertain result; **Oath Ember** is the temporary personal sign.",
    "danger": ""
  },
  {
    "id": "voice-of-the-wild",
    "name": "Voice of the Wild",
    "tagline": "For a short while you listen to the meaning beneath an animal's cries, and let it hear your own.",
    "time": "1 Tyhran Hour",
    "baseTnNote": "**12 minimum** (higher for harder sources or tasks)",
    "effectDuration": "Concentration, up to 1 Forearm after completion",
    "requirement": "A **living animal** must be within **10 meters** when communication begins. The caster prepares natural tokens, gestures, sounds, or another suitable working.",
    "exampleApproaches": "Survival (Animal Handling or field signs), Social (song), Science & Craft (sympathetic instrument), Occult (spirit-tongue rite).",
    "tiers": {
      "0": "Sense one animal's **simple present emotion or need**: hunger, fear, comfort, distress, attachment, or territorial tension.",
      "1": "Understand **simple impressions and intentions** the animal is already expressing: shelter, food, danger, young, familiar companion, or a remembered trail.",
      "2": "Convey **one basic peaceful intention or request** through feelings and images. The animal understands the request but may refuse or ignore it.",
      "3": "Exchange one **recent, firsthand sensory impression**, such as a familiar path, strange smell, passing herd, or nearby landmark the animal noticed. It is not a map or objective report.",
      "4": "Hold a short exchange of related impressions with **a few willing nearby animals**, allowing a composite sense of what **they personally witnessed**. Each remains independent."
    },
    "limits": "Voice of the Wild conveys **an animal's simple feelings and perceptions**, subject to the animal's own awareness and willingness. Training, tracking, taming and commands remain Animal Handling or other relevant tasks. Supernatural beasts may present their own resistance.",
    "danger": ""
  },
  {
    "id": "whispers-of-lost-tongues",
    "name": "Whispers of Lost Tongues",
    "tagline": "An ancient alphabet stirs with the voice of someone who once knew how to speak it.",
    "time": "1 Tyhran Hour",
    "baseTnNote": "**12 minimum** (higher for harder sources or tasks)",
    "effectDuration": "Concentration, up to 1 Forearm after completion",
    "requirement": "A **real sample** of unfamiliar writing or speech must be available during preparation. The working focuses on **one language or script**, not all unknown languages.",
    "exampleApproaches": "Investigation (study letterforms), Science & Craft (reconstruct a text), Social (chant the cadence), Occult (listen to old names).",
    "tiers": {
      "0": "Sense the **broad purpose or tone** of one short passage: warning, prayer, dedication, instruction, lament, record, or threat.",
      "1": "Grasp the **general meaning** of one short paragraph or spoken statement, without guaranteeing exact words, names, or numbers.",
      "2": "Understand a **brief ordinary notice or instruction** well enough to act on its plain meaning. Cultural idioms remain uncertain.",
      "3": "Recover **significant names, dates, numbers, or one crucial nuance** from a brief passage, provided they are not deliberately hidden or mystically sealed.",
      "4": "Comprehend the **broad faithful meaning** of up to **one short page** or one speaker's ongoing simple speech during the Ritual's effect duration. This does not teach fluency."
    },
    "limits": "Whispers of Lost Tongues reads **the general meaning of a present language sample** at the achieved tier. Codes, ciphers, guarded command phrases and disputed translations may require research, source difficulty or Investigation; speaking and writing fluency remain separate.",
    "danger": ""
  }
]
;
