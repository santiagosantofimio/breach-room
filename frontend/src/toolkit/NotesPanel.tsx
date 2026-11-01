import { useState } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { browserStore } from "../progress/safeStorage";

const NOTES_KEY = "breach-room.notes";

export function NotesPanel() {
  const { t } = useI18n();
  const [notes, setNotes] = useState(() => browserStore.read(NOTES_KEY) ?? "");

  return (
    <div className="kit__panel">
      <label className="kit__field">
        <span className="kit__label">{t.toolkit.notes}</span>
        <textarea
          className="kit__input kit__input--notes"
          rows={12}
          value={notes}
          placeholder={t.toolkit.notesPlaceholder}
          onChange={(event) => {
            setNotes(event.target.value);
            browserStore.write(NOTES_KEY, event.target.value);
          }}
        />
      </label>
    </div>
  );
}
