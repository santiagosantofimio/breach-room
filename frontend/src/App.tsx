import { useState } from "react";
import { BootScreen } from "./boot/BootScreen";
import { InkFilters } from "./boot/InkFilters";
import { Desk } from "./game/Desk";
import { Finale } from "./game/Finale";
import { useGame } from "./game/useGame";
import { I18nProvider } from "./i18n/I18nProvider";

type Screen = "boot" | "desk" | "finale";

export function App() {
  const { progress, begin, solve, revealHint, reset } = useGame();
  const [screen, setScreen] = useState<Screen>("boot");

  return (
    <I18nProvider>
      <InkFilters />
      {screen === "boot" && (
        <BootScreen
          hasStarted={progress.startedAt !== null}
          onBegin={() => {
            begin();
            setScreen(progress.finishedAt === null ? "desk" : "finale");
          }}
        />
      )}
      {screen === "desk" && (
        <Desk
          progress={progress}
          onSolve={solve}
          onRevealHint={revealHint}
          onFinish={() => setScreen("finale")}
        />
      )}
      {screen === "finale" && (
        <Finale
          progress={progress}
          onPlayAgain={() => {
            reset();
            setScreen("boot");
          }}
        />
      )}
    </I18nProvider>
  );
}
