import {
  FileText,
  Target,
  Users,
  ClipboardList,
  Gauge,
  BookOpen,
  Milestone,
  Cpu,
} from 'lucide-react';
import { SpecificationSection } from './SpecificationSection';
import type { Specification } from '../../types/specification.types';

// The eight structured sections of a specification (feature/firebase-auth, Phase 6). Extracted
// verbatim from ResultPage so both the live result view and the saved-specification detail page
// render identical content and styling from a Specification, with no duplicated markup.

const ICON = 'h-5 w-5';

export function SpecificationSections({ specification: spec }: { specification: Specification }) {
  return (
    <div className="flex flex-col gap-5 lg:col-span-2">
      <SpecificationSection
        icon={<FileText className={ICON} />}
        title="Project Summary"
        defaultOpen
      >
        <p className="leading-relaxed text-slate-600">{spec.projectSummary}</p>
      </SpecificationSection>

      <SpecificationSection icon={<Target className={ICON} />} title="Target Users" defaultOpen>
        <div className="rounded-xl bg-surface-lavender p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Target Audience
          </p>
          <p className="mt-1 text-slate-700">{spec.targetUsers}</p>
        </div>
      </SpecificationSection>

      <SpecificationSection icon={<Users className={ICON} />} title="User Roles">
        <ul className="flex flex-wrap gap-2">
          {spec.userRoles.map((role) => (
            <li
              key={role}
              className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700"
            >
              {role}
            </li>
          ))}
        </ul>
      </SpecificationSection>

      <SpecificationSection
        icon={<ClipboardList className={ICON} />}
        title="Functional Requirements"
        defaultOpen
      >
        <ul className="space-y-4">
          {spec.functionalRequirements.map((requirement, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                F{index + 1}
              </span>
              <p className="text-slate-600">{requirement}</p>
            </li>
          ))}
        </ul>
      </SpecificationSection>

      <SpecificationSection icon={<Gauge className={ICON} />} title="Non-functional Requirements">
        <ul className="list-disc space-y-2 pl-5 text-slate-600">
          {spec.nonFunctionalRequirements.map((requirement, index) => (
            <li key={index}>{requirement}</li>
          ))}
        </ul>
      </SpecificationSection>

      <SpecificationSection icon={<BookOpen className={ICON} />} title="User Stories">
        <ul className="space-y-4">
          {spec.userStories.map((story, index) => (
            <li key={index} className="rounded-xl border border-slate-100 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{story.title}</p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {story.role}
                </span>
              </div>
              <p className="mt-1 text-slate-600">{story.narrative}</p>
            </li>
          ))}
        </ul>
      </SpecificationSection>

      <SpecificationSection icon={<Milestone className={ICON} />} title="Development Milestones">
        <ol className="space-y-4">
          {spec.milestones.map((milestone) => (
            <li key={milestone.order} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                {milestone.order}
              </span>
              <div>
                <p className="font-semibold text-slate-900">{milestone.name}</p>
                <p className="mt-1 text-slate-600">{milestone.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </SpecificationSection>

      <SpecificationSection icon={<Cpu className={ICON} />} title="Technical Considerations">
        <ul className="list-disc space-y-2 pl-5 text-slate-600">
          {spec.technicalConsiderations.map((consideration, index) => (
            <li key={index}>{consideration}</li>
          ))}
        </ul>
      </SpecificationSection>
    </div>
  );
}
