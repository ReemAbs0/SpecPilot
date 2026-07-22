import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
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
import { useSpecification } from '../state/SpecificationContext';
import { ResultHeader } from '../components/result/ResultHeader';
import { SpecificationSection } from '../components/result/SpecificationSection';

// Generated Specification page (T028). Renders the eight structured sections of the result.
// The Actions sidebar (download / copy / generate again) is added in User Story 3.

const ICON = 'h-5 w-5';

function formatTimestamp(): string {
  const time = new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `Today at ${time}`;
}

export default function ResultPage() {
  const { state } = useSpecification();
  const timestamp = useMemo(() => formatTimestamp(), []);

  if (state.status !== 'success' || !state.specification) {
    return <Navigate to="/generate" replace />;
  }

  const spec = state.specification;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <ResultHeader title={spec.title} timestamp={timestamp} />

      <div className="mt-8 flex flex-col gap-5">
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
    </div>
  );
}
