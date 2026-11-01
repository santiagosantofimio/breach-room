import { BootScreen } from "./boot/BootScreen";
import { InkFilters } from "./boot/InkFilters";
import { I18nProvider } from "./i18n/I18nProvider";

export function App() {
  return (
    <I18nProvider>
      <InkFilters />
      <BootScreen />
    </I18nProvider>
  );
}
