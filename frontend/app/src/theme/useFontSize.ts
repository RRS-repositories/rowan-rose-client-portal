import { useContext } from "react";
import { FontSizeContext } from "./FontSizeProvider";

export function useFontSize() {
  const ctx = useContext(FontSizeContext);
  if (!ctx) throw new Error("useFontSize must be used within <FontSizeProvider>");
  return ctx;
}
