import type { Specification } from '../types/specification.types';

// Converts a generated specification into a Markdown document. Used by both the
// "Download Markdown" (FR-020) and "Copy to Clipboard" (FR-021) actions — purely client-side,
// no network (research.md #6).

export function specificationToMarkdown(spec: Specification): string {
  const lines: string[] = [];
  lines.push(`# ${spec.title}`, '');

  lines.push('## Project Summary', '', spec.projectSummary, '');

  lines.push('## Target Users', '', spec.targetUsers, '');

  lines.push('## User Roles', '');
  spec.userRoles.forEach((role) => lines.push(`- ${role}`));
  lines.push('');

  lines.push('## Functional Requirements', '');
  spec.functionalRequirements.forEach((req, i) => lines.push(`${i + 1}. ${req}`));
  lines.push('');

  lines.push('## Non-functional Requirements', '');
  spec.nonFunctionalRequirements.forEach((req) => lines.push(`- ${req}`));
  lines.push('');

  lines.push('## User Stories', '');
  spec.userStories.forEach((story) => {
    lines.push(`### ${story.title}`, '', story.narrative, '', `_Role: ${story.role}_`, '');
  });

  lines.push('## Development Milestones', '');
  spec.milestones.forEach((m) => {
    // A milestone description may carry deliverables and exit criteria as extra paragraphs.
    // The first line stays inline with the numbered item; the rest is indented so Markdown keeps
    // it inside that list item instead of breaking the numbering.
    const [first, ...rest] = m.description.split('\n');
    lines.push(`${m.order}. **${m.name}** — ${first}`);
    rest.forEach((line) => lines.push(line.trim() === '' ? '' : `   ${line}`));
  });
  lines.push('');

  lines.push('## Technical Considerations', '');
  spec.technicalConsiderations.forEach((c) => lines.push(`- ${c}`));
  lines.push('');

  return lines.join('\n');
}

/** Turns a specification title into a safe .md filename, e.g. "My App Spec" → "my-app-spec.md". */
export function markdownFilename(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'specification'}.md`;
}
