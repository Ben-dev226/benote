import { FileText } from "lucide-react";
import { Empty } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { createNote } from "./actions";

export default function NotesIndex() {
  return (
    <div style={{ minHeight: 320, display: "grid", placeItems: "center" }}>
      <Empty icon={<FileText size={24} />} title="Sélectionne une note">
        Choisis une note dans la liste, ou crée-en une nouvelle.
        <form action={createNote} style={{ marginTop: 12 }}><SubmitButton>+ Nouvelle note</SubmitButton></form>
      </Empty>
    </div>
  );
}
