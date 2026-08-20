import { describe, expect, it } from 'vitest';
import {
  UNBOUND_IDENTITIES,
  resolveUnboundArtifactKey,
} from '../src/utils/echos/unbound-identities.js';
import { getEchoArtifact, getEchoArtifactRules } from '../src/utils/echo-artifacts.js';

describe('Unbound identities', () => {
  it('covers Beast, three Witch traditions, and three Bane calls', () => {
    expect(UNBOUND_IDENTITIES.map((id) => id.key)).toEqual([
      'beast',
      'witch-root',
      'witch-ruin',
      'witch-blight',
      'bane-alchemist',
      'bane-greenwarden',
      'bane-relic-hunter',
    ]);
  });

  it('resolves each identity to a catalog Echo Artifact', () => {
    expect(resolveUnboundArtifactKey('witch-root')).toBe('witchStaffRoot');
    expect(resolveUnboundArtifactKey('bane-relic-hunter')).toBe('huntersScourge');
    expect(resolveUnboundArtifactKey('beast')).toBeNull();
    expect(resolveUnboundArtifactKey('beast', 'wits')).toBe('predatorCrownWits');
    for (const id of UNBOUND_IDENTITIES) {
      const key =
        id.extras === 'predator' ? resolveUnboundArtifactKey(id.key, 'might') : resolveUnboundArtifactKey(id.key);
      expect(key, id.key).toBeTruthy();
      expect(getEchoArtifact(key)!.echoKey).toBe('unbound');
      expect(getEchoArtifact(key)!.requiresSubChoice).toBe(id.key);
    }
  });

  it('lists every Unbound artifact on the Echo creation rules', () => {
    const keys = getEchoArtifactRules('unbound').availableKeys;
    expect(keys).toContain('huntersScourge');
    expect(keys).toContain('greenWardenMantle');
    expect(keys).toContain('alchemistCoat');
  });
});
