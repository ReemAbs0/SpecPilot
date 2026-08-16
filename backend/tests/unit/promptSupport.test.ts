import { describe, it, expect } from 'vitest';
import { assessComplexity, contextBlock, range, scopeBrief } from '../../src/agents/promptSupport';

// The prompts scale their target counts from this assessment, so the tiers are what keep a
// to-do list short and an enterprise system long.

const TODO_APP =
  'A small to-do list app where I can add tasks, tick them off, and see what is due today.';

const BOOKING_APP =
  'A dog walker booking app connecting owners with walkers. Owners book a walk, follow it with ' +
  'live GPS tracking, pay in-app, and rate the walker afterwards. An admin dashboard handles ' +
  'walker verification and disputes.';

const ENTERPRISE =
  'A multi-tenant hospital operations platform for regional health networks. Each organisation ' +
  'manages staff scheduling across departments with shift swapping and approval workflows. ' +
  'Doctors and nurses see patient rosters; administrators configure permissions per role and run ' +
  'compliance audits. The system integrates with existing EHR systems over HL7 APIs and syncs ' +
  'billing to the finance ERP, must be HIPAA compliant with full audit logs and encryption, ' +
  'sends shift notifications by push and SMS, provides analytics dashboards on utilisation and ' +
  'overtime forecasting, supports offline access on mobile for ward rounds, and handles document ' +
  'uploads for certifications with expiry tracking and multi-language support for staff.';

describe('assessComplexity', () => {
  it('rates a short single-purpose idea as simple', () => {
    expect(assessComplexity(TODO_APP).tier).toBe('simple');
  });

  it('rates a short idea that spans several capability areas as moderate', () => {
    expect(assessComplexity(BOOKING_APP).tier).toBe('moderate');
  });

  it('rates a long multi-capability system as complex', () => {
    expect(assessComplexity(ENTERPRISE).tier).toBe('complex');
  });

  it('scales every section target upward with the tier', () => {
    const simple = assessComplexity(TODO_APP);
    const complex = assessComplexity(ENTERPRISE);
    expect(complex.functionalRequirements[0]).toBeGreaterThan(simple.functionalRequirements[0]);
    expect(complex.userStories[0]).toBeGreaterThan(simple.userStories[0]);
    expect(complex.milestones[0]).toBeGreaterThan(simple.milestones[0]);
    expect(complex.nonFunctionalRequirements[0]).toBeGreaterThan(
      simple.nonFunctionalRequirements[0],
    );
  });

  it('presents the counts as targets rather than hard limits', () => {
    expect(scopeBrief(assessComplexity(BOOKING_APP))).toContain('targets, not quotas');
    expect(range([14, 20], 'strings')).toBe('roughly 14-20 strings');
  });
});

describe('contextBlock', () => {
  it('is empty for the first stage, which has no earlier output', () => {
    expect(contextBlock({})).toBe('');
  });

  it('renders the draft sections written so far', () => {
    const block = contextBlock({
      title: 'Dog Walking Platform',
      userRoles: ['Dog Owner', 'Walker', 'Admin'],
      functionalRequirements: ['Booking: The system MUST hold a slot for 10 minutes.'],
      userStories: [{ title: 'Book a walk', narrative: 'As a Dog Owner...', role: 'Dog Owner' }],
    });
    expect(block).toContain('Dog Walking Platform');
    expect(block).toContain('Dog Owner, Walker, Admin');
    expect(block).toContain('The system MUST hold a slot for 10 minutes.');
    expect(block).toContain('Book a walk');
  });
});
