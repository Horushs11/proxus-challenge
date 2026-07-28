import { useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import { artifactsQuery } from "../domain/artifacts/atoms.ts";
import { materialsQuery } from "../domain/materials/atoms.ts";

interface SidebarProps {
  readonly selectedArtifactId: string | null;
  readonly onSelectArtifact: (artifactId: string) => void;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function Sidebar({
  selectedArtifactId,
  onSelectArtifact,
  isOpen,
  onClose,
}: SidebarProps) {
  const materials = useAtomValue(materialsQuery);
  const artifacts = useAtomValue(artifactsQuery);

  return (
    <>
    {isOpen && (
    <button
      type="button"
      aria-label="Cerrar menú lateral"
      className="fixed inset-0 z-40 bg-[#010001]/30 md:hidden"
      onClick={onClose}
    />
  )}
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(85vw,320px)] flex-col overflow-y-auto border-r-2 border-[#1F1F1F] bg-white p-5 transition-transform duration-300 ease-out md:static md:h-screen md:w-auto md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="font-bold text-[#010001] text-sm uppercase tracking-widest">
            Materials
          </h2>
        </div>
        {AsyncResult.matchWithError(materials, {
          onInitial: () => <p className="text-[#808080]">Loading materials…</p>,
          onError: (error) => <p className="text-red-200">{String(error)}</p>,
          onDefect: (defect) => (
            <p className="text-red-200">{String(defect)}</p>
          ),
          onSuccess: ({ value }) =>
            value.materials.length === 0 ? (
              <p className="text-[#808080]">No uploaded PDFs yet.</p>
            ) : (
              <details className="rounded-2xl border-2 border-[#010001] bg-[#F7F7FF] shadow-[-3px_3px_0px_0px_rgba(0,0,0,0.4)] transition hover:shadow-[-4px_4px_0px_0px_rgba(0,0,0,0.6)]">
                <summary className="cursor-pointer px-4 py-3 font-medium text-[#010001]">
                  {value.materials.length} Material
                  {value.materials.length === 1 ? "" : "s"}
                </summary>
                <ul className="grid gap-2 border-[#010001] border-t-2 p-3">
                  {value.materials.map((material) => (
                    <li
                      className="rounded-2xl bg-[#E8CDE5] p-3 border-2 border-[#010001]"
                      key={material.id}
                    >
                      <strong className="block text-[#010001]">
                        {material.title}
                      </strong>
                      <span className="mt-1 block text-[#808080] text-sm">
                        {material.pageCount} pages · {material.fileName}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            ),
        })}
      </section>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="font-bold text-[#010001] text-sm uppercase tracking-widest">
            Artifacts
          </h2>
        </div>
        {AsyncResult.matchWithError(artifacts, {
          onInitial: () => <p className="text-[#808080]">Loading artifacts…</p>,
          onError: (error) => <p className="text-red-200">{String(error)}</p>,
          onDefect: (defect) => (
            <p className="text-red-200">{String(defect)}</p>
          ),
          onSuccess: ({ value }) =>
            value.artifacts.length === 0 ? (
              <p className="text-[#808080]">No notes, quizzes, or tests yet.</p>
            ) : (
              <details className="rounded-2xl border-2 border-[#010001] bg-[#F7F7FF] shadow-[-3px_3px_0px_0px_rgba(0,0,0,0.4)] transition hover:shadow-[-4px_4px_0px_0px_rgba(0,0,0,0.6)]">
                <summary className="cursor-pointer px-4 py-3 font-medium text-[#010001] marker:text-[#010001]">
                  {value.artifacts.length} artifact
                  {value.artifacts.length === 1 ? "" : "s"}
                </summary>
                <ul className="grid gap-2 border-[#010001] border-t-2 p-3">
                  {value.artifacts.map((artifact) => (
                    <li key={artifact.id}>
                      <button
                        className={`w-full rounded-2xl cursor-pointer p-3 text-left  ${
                          selectedArtifactId === artifact.id
                            ? "border-2 border-[#010001] bg-[#E8CDE5]/40"
                            : "border-2 border-[#010001] bg-[#E8CDE5]"
                        }`}
                        type="button"
                        onClick={() => onSelectArtifact(artifact.id)}
                      >
                        <strong className="block text-[#010001]">
                          {artifact.title}
                        </strong>
                        <span className="mt-1 block text-[#808080] text-sm">
                          {artifact.kind} · {artifact.id}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            ),
        })}
      </section>
      <div className="mb-8 flex items-center gap-3 mt-auto rounded-2xl bg-[#F7F7FF] p-3 border-2 border-[#010001] shadow-[-3px_3px_0px_0px_rgba(0,0,0,0.4)]">
        <div className="grid size-10 place-items-center rounded-2xl bg-[#959499] font-extrabold text-white">
          P
        </div>

        <div>
          <strong className="block text-[#010001]">Proxus Tutor</strong>
          <span className="block text-slate-400 text-sm">
            Academic assistant
          </span>
        </div>
      </div>
    </aside>
    </>
  );
}
