import { useState } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { ROOM_ENTRY_PATHS, type RoomSlug } from "../rooms/rooms";
import { CookieJarPanel } from "./CookieJarPanel";
import { DecoderPanel } from "./DecoderPanel";
import { MiniBrowser } from "./MiniBrowser";
import { NotesPanel } from "./NotesPanel";
import { Repeater, type RepeaterDraft } from "./Repeater";
import { useTarget } from "./useTarget";

const TABS = ["browser", "repeater", "cookies", "decoder", "notes"] as const;

type Tab = (typeof TABS)[number];

function initialDraft(entryPath: string): RepeaterDraft {
  return { method: "GET", path: entryPath, headers: "Content-Type: application/json", body: "" };
}

export function Toolkit({ slug }: { slug: RoomSlug }) {
  const { t } = useI18n();
  const entryPath = ROOM_ENTRY_PATHS[slug] ?? `/api/rooms/${slug}/`;
  const { cookies, updateCookies, send } = useTarget(slug);
  const [tab, setTab] = useState<Tab>("browser");
  const [draft, setDraft] = useState(() => initialDraft(entryPath));
  const [decoderSeed, setDecoderSeed] = useState("");

  return (
    <section className="kit" aria-label={t.toolkit.label}>
      <nav className="kit__tabs" aria-label={t.toolkit.label}>
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            className="kit__tab"
            aria-current={tab === name ? "true" : undefined}
            onClick={() => setTab(name)}
          >
            {t.toolkit.tabs[name]}
          </button>
        ))}
      </nav>
      <div className="kit__sheet">
        <div hidden={tab !== "browser"}>
          <MiniBrowser
            entryPath={entryPath}
            send={send}
            onOpenInRepeater={(path) => {
              setDraft({ ...draft, path });
              setTab("repeater");
            }}
          />
        </div>
        <div hidden={tab !== "repeater"}>
          <Repeater draft={draft} onDraftChange={setDraft} send={send} />
        </div>
        <div hidden={tab !== "cookies"}>
          <CookieJarPanel
            cookies={cookies}
            onChange={updateCookies}
            onOpenInDecoder={(value) => {
              setDecoderSeed(value);
              setTab("decoder");
            }}
          />
        </div>
        <div hidden={tab !== "decoder"}>
          <DecoderPanel key={decoderSeed} seed={decoderSeed} />
        </div>
        <div hidden={tab !== "notes"}>
          <NotesPanel />
        </div>
      </div>
    </section>
  );
}
