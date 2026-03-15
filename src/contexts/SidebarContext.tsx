import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface SidebarContextType {
  expanded: boolean;
  toggle: () => void;
  sidebarWidth: number;
}

const SidebarContext = createContext<SidebarContextType>({
  expanded: false,
  toggle: () => {},
  sidebarWidth: 56,
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded((e) => !e), []);
  const sidebarWidth = expanded ? 220 : 56;

  return (
    <SidebarContext.Provider value={{ expanded, toggle, sidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebarState = () => useContext(SidebarContext);
