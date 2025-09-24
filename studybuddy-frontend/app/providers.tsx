"use client"

import { useSilentRefresh } from "@/hooks/use-silentRefresh";
import { Provider } from "react-redux"
import { store } from "@/store"

function SilentRefreshWrapper({ children }: { children: React.ReactNode }) {
  useSilentRefresh();
  return <>{children}</>;
}

export default function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SilentRefreshWrapper>{children}</SilentRefreshWrapper>
    </Provider>
  );
}
