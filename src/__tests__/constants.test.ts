import { describe, it, expect } from 'vitest';
import {
  APP_NAME,
  APP_TAGLINE,
  LEGAL_DISCLAIMER,
  TRUST_NOTE,
  RISK_COLORS,
} from '../config/constants';

describe('App Constants & Legal Compliance', () => {
  it('should maintain consistent product branding and tagline', () => {
    expect(APP_NAME).toBe('Legal Lens');
    expect(APP_TAGLINE).toBe('Understand. Compare. Prepare. Navigate.');
  });

  it('should include clear non-lawyer disclaimer', () => {
    expect(LEGAL_DISCLAIMER).toContain('does not provide legal advice');
    expect(LEGAL_DISCLAIMER).toContain('not an AI lawyer');
  });

  it('should state trusted user account boundary without unsupported claims', () => {
    expect(TRUST_NOTE).toBe('Your workspace is protected by your account.');
    expect(TRUST_NOTE).not.toContain('bank-level');
  });

  it('should provide complete risk color mapping', () => {
    expect(RISK_COLORS.low).toBeDefined();
    expect(RISK_COLORS.moderate).toBeDefined();
    expect(RISK_COLORS.high).toBeDefined();
    expect(RISK_COLORS.critical).toBeDefined();
  });
});
