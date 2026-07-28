import { useState } from "react";
import { ArtifactWorkspace } from "./components/ArtifactWorkspace.tsx";
import { Chat } from "./components/Chat.tsx";
import { Sidebar } from "./components/Sidebar.tsx";

export function App() {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    null,
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div
      className="grid h-dvh min-h-dvh grid-cols-1 overflow-hidden bg-[#F7F6FF] md:grid-cols-[340px_minmax(0,1fr)]"
    >
      <Sidebar
        selectedArtifactId={selectedArtifactId}
        onSelectArtifact={setSelectedArtifactId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {selectedArtifactId === null ? (
        <Chat onOpenSidebar={() => setIsSidebarOpen(true)} />
      ) : (
        <ArtifactWorkspace
          artifactId={selectedArtifactId}
          onCloseArtifact={() => setSelectedArtifactId(null)}
        />
      )}
    </div>
  );
}