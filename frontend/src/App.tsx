import { useState } from "react";
import { BootScreen } from "./boot/BootScreen";
import { InkFilters } from "./boot/InkFilters";
import { Desk } from "./game/Desk";
import { useGame } from "./game/useGame";
import { I18nProvider } from "./i18n/I18nProvider";

export function App() {
  const { progress, begin, solve, revealHint } = useGame();
  const [isAtDesk, setIsAtDesk] = useState(false);

  return (
    <I18nProvider>
      <InkFilters />
      {isAtDesk ? (
        <Desk progress={progress} onSolve={solve} onRevealHint={revealHint} />
      ) : (
        <BootScreen
          hasStarted={progress.startedAt !== null}
          onBegin={() => {
            begin();
            setIsAtDesk(true);
          }}
        />
      )}
    </I18nProvider>
  );
}
