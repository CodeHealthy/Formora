import { ApplicationRouter } from "./router/application-router";
import { ApplicationProviders } from "./providers/application-providers";

export function App() {
  return (
    <ApplicationProviders>
      <ApplicationRouter />
    </ApplicationProviders>
  );
}
