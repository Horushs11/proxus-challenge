import { useAtomSet, useAtomValue } from "@effect/atom-react";
import type {
  Artifact,
  ArtifactAttempt,
  MultipleChoiceQuestion,
  QuestionCorrection,
  QuizQuestion,
  SubmitAttemptInput,
  TestQuestion,
} from "@proxus/shared";
import { useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import {
  artifactQuery,
  submitArtifactAttemptAction,
} from "../domain/artifacts/atoms.ts";
import { ArrowRight } from "lucide-react";

type Answers = Record<string, string>;

interface ArtifactWorkspaceProps {
  readonly artifactId: string | null;
  readonly onCloseArtifact: () => void;
}

export function ArtifactWorkspace({
  artifactId,
  onCloseArtifact,
}: ArtifactWorkspaceProps) {
  if (artifactId === null) {
    return <EmptyWorkspace />;
  }

  return (
    <ArtifactDetail artifactId={artifactId} onCloseArtifact={onCloseArtifact} />
  );
}

function EmptyWorkspace() {
  return (
    <main className="h-screen min-w-0 overflow-y-auto border-slate-800 border-r bg-slate-950/60 p-6 max-md:h-auto max-md:border-r-0 max-md:border-b">
      <div className="grid h-full place-items-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
        <div>
          <p className="mb-2 font-bold text-sky-400 text-xs uppercase tracking-widest">
            Practice workspace
          </p>
          <h2 className="text-balance font-bold text-3xl text-slate-100">
            Select a note, quiz, or test from the sidebar.
          </h2>
          <p className="mt-3 max-w-xl text-slate-400">
            Quizzes and tests can be solved directly here. The tutor chat
            remains available for hints and explanations.
          </p>
        </div>
      </div>
    </main>
  );
}

function ArtifactDetail({
  artifactId,
  onCloseArtifact,
}: {
  readonly artifactId: string;
  readonly onCloseArtifact: () => void;
}) {
  const artifact = useAtomValue(artifactQuery(artifactId));

  return (
    <main className="h-screen min-w-0 overflow-y-auto border-slate-800 border-r-2 scrollbar-none p-6 max-md:h-auto max-md:border-r-0 max-md:border-b">
      <div className="mb-5 w-full flex items-center justify-end gap-3">
        <button
        className="mb-5 inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-[#1F1F1F] bg-[#8B4B85] px-4 py-2 text-sm font-medium text-white shadow-[-3px_3px_0px_0px_rgba(0,0,0,0.4)]"
        type="button"
        onClick={onCloseArtifact}
      >
        Back to chat
        <ArrowRight size={20} />
      </button>
      </div>
      
      {AsyncResult.matchWithError(artifact, {
        onInitial: () => <p className="text-[#808080]">Loading artifact…</p>,
        onError: (error) => <p className="text-red-200">{String(error)}</p>,
        onDefect: (defect) => <p className="text-red-200">{String(defect)}</p>,
        onSuccess: ({ value }) => <ArtifactContent artifact={value} />,
      })}
    </main>
  );
}

function ArtifactContent({ artifact }: { readonly artifact: Artifact }) {
  switch (artifact.kind) {
    case "note":
      return <NoteViewer artifact={artifact} />;
    case "quiz":
    case "test":
      return <ExerciseSolver artifact={artifact} />;
  }
}

function NoteViewer({
  artifact,
}: {
  readonly artifact: Extract<Artifact, { readonly kind: "note" }>;
}) {
  return (
    <article className="mx-auto max-w-4xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/30">
      <p className="mb-2 font-bold text-sky-400 text-xs uppercase tracking-widest">
        Note
      </p>
      <h2 className="mb-6 font-bold text-3xl text-slate-100">
        {artifact.title}
      </h2>
      <div className="prose prose-invert max-w-none">
        <Streamdown>{artifact.markdown}</Streamdown>
      </div>
    </article>
  );
}

function ExerciseSolver({
  artifact,
}: {
  readonly artifact: Extract<Artifact, { readonly kind: "quiz" | "test" }>;
}) {
  const [answers, setAnswers] = useState<Answers>({});
  const [attempt, setAttempt] = useState<ArtifactAttempt | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitAttempt = useAtomSet(submitArtifactAttemptAction, {
    mode: "promise",
  });

  const unansweredQuestions = useMemo(
    () =>
      artifact.questions.filter(
        (question) => (answers[question.id] ?? "").trim().length === 0,
      ),
    [answers, artifact.questions],
  );

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const submit = async () => {
    if (unansweredQuestions.length > 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      const payload = buildSubmitInput(artifact, answers);
      const result = await submitAttempt(payload);
      setAttempt(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article className="mx-auto max-w-4xl">
      <header className="mb-5 rounded-2xl border-2 border-[#1F1F1F] bg-white shadow-[-3px_3px_0px_0px_rgba(0,0,0,0.4)] p-6">
        <p className="mb-2 font-bold text-[#1F1F1F] text-xs uppercase tracking-widest">
          {artifact.kind}
        </p>
        <h2 className="font-bold text-3xl text-[#1F1F1F]">{artifact.title}</h2>
        <p className="mt-2 text-[#8A8390]">
          Answer every question, submit, and review your corrections.
        </p>
      </header>

      <div className="grid gap-4">
        {artifact.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            index={index}
            question={question}
            value={answers[question.id] ?? ""}
            correction={
              attempt?.status === "graded"
                ? attempt.corrections.find(
                    (item) => item.questionId === question.id,
                  )
                : undefined
            }
            disabled={attempt !== null}
            onChange={(value) => setAnswer(question.id, value)}
          />
        ))}
      </div>

      {error !== undefined && (
        <p className="mt-4 rounded-2xl border border-red-900 bg-red-950/50 p-4 text-red-100">
          {error}
        </p>
      )}

      {attempt?.status === "graded" && <AttemptSummary attempt={attempt} />}

      <footer className="sticky bottom-0 mt-6 rounded-2xl border-2 border-[#1F1F1F] shadow-[-3px_3px_0px_0px_rgba(0,0,0,0.4)] bg-white p-4 backdrop-blur">
        {attempt === null ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-slate-400 text-sm">
              {unansweredQuestions.length === 0
                ? "Ready to submit."
                : `${unansweredQuestions.length} question${unansweredQuestions.length === 1 ? "" : "s"} unanswered.`}
            </p>
            <button
              className="rounded-full bg-[#8B4B85] border-2 border-[#1F1F1F] px-5 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              type="button"
              disabled={unansweredQuestions.length > 0 || isSubmitting}
              onClick={submit}
            >
              {isSubmitting ? "Submitting…" : `Submit ${artifact.kind}`}
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold text-[#1F1F1F]">Attempt graded.</p>
            <button
              className="rounded-full border-2 border-[#1F1F1F] bg-[#8B4A85] text-white px-5 py-2"
              type="button"
              onClick={() => {
                setAnswers({});
                setAttempt(null);
                setError(undefined);
              }}
            >
              Try again
            </button>
          </div>
        )}
      </footer>
    </article>
  );
}

function QuestionCard({
  index,
  question,
  value,
  correction,
  disabled,
  onChange,
}: {
  readonly index: number;
  readonly question: QuizQuestion | TestQuestion;
  readonly value: string;
  readonly correction: QuestionCorrection | undefined;
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;
}) {
  return (
    <section className="rounded-2xl border-2 border-[#1F1F1F] bg-white shadow-[-3px_3px_0px_0px_rgba(0,0,0,0.4)] p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-[#8A8390] text-sm">
            Question {index + 1} · {question.type}
          </p>
          <h3 className="font-semibold text-lg text-[#1F1F1F]">
            {question.prompt}
          </h3>
        </div>
        {correction !== undefined && (
          <CorrectionBadge correction={correction} />
        )}
      </div>

      {question.type === "multiple-choice" && (
        <MultipleChoiceInput
          question={question}
          value={value}
          disabled={disabled}
          onChange={onChange}
        />
      )}
      {question.type === "true-false" && (
        <TrueFalseInput value={value} disabled={disabled} onChange={onChange} />
      )}
      {question.type === "short-answer" && (
        <textarea
          className="min-h-32 w-full rounded-2xl border border-[#1F1F1F] bg-[#F7F7FF] p-3 text-[#1F1F1F] outline-none focus-within:border-[#8B4A85]"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder="Write your answer…"
        />
      )}

      {correction !== undefined && (
        <CorrectionDetails correction={correction} question={question} />
      )}
    </section>
  );
}

function MultipleChoiceInput({
  question,
  value,
  disabled,
  onChange,
}: {
  readonly question: MultipleChoiceQuestion;
  readonly value: string;
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      {question.options.map((option) => (
        <label
          className="flex cursor-pointer items-center text-[#1F1F1F] gap-3 rounded-2xl border border-[#1F1F1F] bg-[#F7F7FF] p-3 hover:border-[#8B4A85]"
          key={option.id}
        >
          <input
            type="radio"
            className="accent-[#8B4A85]"
            name={question.id}
            value={option.id}
            checked={value === option.id}
            disabled={disabled}
            onChange={() => onChange(option.id)}
          />
          <span>{option.text}</span>
        </label>
      ))}
    </div>
  );
}

function TrueFalseInput({
  value,
  disabled,
  onChange,
}: {
  readonly value: string;
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
      {(
        [
          ["true", "True"],
          ["false", "False"],
        ] as const
      ).map(([nextValue, label]) => (
        <label
          className="flex cursor-pointer items-center gap-3 text-[#1F1F1F] rounded-2xl border border-[#1F1F1F] bg-[#F7F7FF] p-3 hover:border-[#8B4A85]"
          key={nextValue}
        >
          <input
            type="radio"
            className="accent-[#8B4A85]"
            name={`true-false-${label}`}
            value={nextValue}
            checked={value === nextValue}
            disabled={disabled}
            onChange={() => onChange(nextValue)}
          />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}

function AttemptSummary({
  attempt,
}: {
  readonly attempt: Extract<ArtifactAttempt, { readonly status: "graded" }>;
}) {
  return (
    <section className="mt-6 rounded-2xl border-2 border-[#1F1F1F] bg-[#FFFEFE] shadow-[-3px_3px_0px_0px_rgba(0,0,0,0.4)] p-5">
      <p className="font-bold text-[#1F1F1F] text-xl">
        Score: {attempt.score} / {attempt.maxScore}
      </p>
      <p className="mt-1 text-[#1F1F1F]">{attempt.summary}</p>
    </section>
  );
}

function CorrectionBadge({
  correction,
}: {
  readonly correction: QuestionCorrection;
}) {
  if (correction.questionType === "short-answer") {
    return (
      <span className="rounded-full bg-sky-950 px-3 py-1 font-semibold text-sky-200 text-sm">
        {correction.score}/{correction.maxScore}
      </span>
    );
  }

  return correction.correct ? (
    <span className="rounded-full bg-emerald-950 px-3 py-1 font-semibold text-emerald-200 text-sm">
      Correct
    </span>
  ) : (
    <span className="rounded-full bg-red-950 px-3 py-1 font-semibold text-red-200 text-sm">
      Review
    </span>
  );
}

function CorrectionDetails({
  correction,
  question,
}: {
  readonly correction: QuestionCorrection;
  readonly question: QuizQuestion | TestQuestion;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-[#1F1F1F] bg-[#E8CDE5] p-4 text-sm">
      {correction.questionType === "multiple-choice" &&
        question.type === "multiple-choice" && (
          <>
            <p className="text-[#1F1F1F]">
              Correct answer:{" "}
              <strong>
                {optionText(question, correction.correctOptionId)}
              </strong>
            </p>
            <p className="mt-2 text-[#1F1F1F]">{correction.explanation}</p>
          </>
        )}
      {correction.questionType === "true-false" && (
        <>
          <p className="text-[#1F1F1F]">
            Correct answer:{" "}
            <strong>{correction.correctAnswer ? "True" : "False"}</strong>
          </p>
          <p className="mt-2 text-[#1F1F1F]">{correction.explanation}</p>
        </>
      )}
      {correction.questionType === "short-answer" && (
        <p className="text-[#1F1F1F]">{correction.feedback}</p>
      )}
    </div>
  );
}

const optionText = (question: MultipleChoiceQuestion, optionId: string) =>
  question.options.find((option) => option.id === optionId)?.text ?? optionId;

function buildSubmitInput(
  artifact: Extract<Artifact, { readonly kind: "quiz" | "test" }>,
  answers: Answers,
): SubmitAttemptInput {
  const builtAnswers = artifact.questions.map((question) => {
    const value = answers[question.id] ?? "";
    switch (question.type) {
      case "multiple-choice":
        return {
          questionType: "multiple-choice" as const,
          questionId: question.id,
          selectedOptionId: value,
        };
      case "true-false":
        return {
          questionType: "true-false" as const,
          questionId: question.id,
          answer: value === "true",
        };
      case "short-answer":
        return {
          questionType: "short-answer" as const,
          questionId: question.id,
          answer: value,
        };
    }
  });

  if (artifact.kind === "quiz") {
    return {
      artifactKind: "quiz",
      artifactId: artifact.id,
      answers: builtAnswers.filter(
        (answer) => answer.questionType !== "short-answer",
      ),
    };
  }

  return {
    artifactKind: "test",
    artifactId: artifact.id,
    answers: builtAnswers,
  };
}
