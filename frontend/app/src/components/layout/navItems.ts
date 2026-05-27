export interface NavItem { to: string; label: string; icon: string }

/** Primary navigation — shared by mobile bottom tabs and desktop top nav (Stitch order). */
export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: "home" },
  { to: "/claims", label: "Claims", icon: "account_balance_wallet" },
  { to: "/documents", label: "Docs", icon: "description" },
  { to: "/chat", label: "Chat", icon: "forum" },
  { to: "/profile", label: "Profile", icon: "person" },
];
