import { describe, it, expect } from 'vitest';
import { specificationToMarkdown, markdownFilename } from '../src/services/specificationMarkdown';
import type { Specification } from '../src/types/specification.types';

const SPEC: Specification = {
  title: 'Personal Finance Tracker Specification',
  projectSummary: 'A personal finance app.',
  targetUsers: 'Individuals managing money',
  userRoles: ['User', 'Admin'],
  functionalRequirements: ['Track expenses', 'Set budgets'],
  nonFunctionalRequirements: ['Secure', 'Fast'],
  userStories: [{ title: 'Track', narrative: 'As a User, I want to track expenses', role: 'User' }],
  milestones: [{ name: 'MVP', description: 'Core tracking', order: 1 }],
  technicalConsiderations: ['Architecture: microservices'],
};

describe('specificationToMarkdown', () => {
  it('renders the title and every section heading with content', () => {
    const md = specificationToMarkdown(SPEC);
    expect(md).toContain('# Personal Finance Tracker Specification');
    expect(md).toContain('## Project Summary');
    expect(md).toContain('## Target Users');
    expect(md).toContain('## User Roles');
    expect(md).toContain('## Functional Requirements');
    expect(md).toContain('## Non-functional Requirements');
    expect(md).toContain('## User Stories');
    expect(md).toContain('## Development Milestones');
    expect(md).toContain('## Technical Considerations');
    // Representative content
    expect(md).toContain('- User');
    expect(md).toContain('1. Track expenses');
    expect(md).toContain('### Track');
    expect(md).toContain('1. **MVP** — Core tracking');
    expect(md).toContain('- Architecture: microservices');
  });
});

describe('markdownFilename', () => {
  it('slugifies the title into a .md filename', () => {
    expect(markdownFilename('Personal Finance Tracker Specification')).toBe(
      'personal-finance-tracker-specification.md',
    );
  });

  it('falls back to a default when the title has no usable characters', () => {
    expect(markdownFilename('!!!')).toBe('specification.md');
  });
});
