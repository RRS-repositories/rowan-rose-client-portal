import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Page } from "@/components/layout/Page";
import { Container } from "@/components/layout/AppShell";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Icon } from "@/components/ui/Icon";
import { InfoTerm } from "@/components/ui/InfoTerm";
import { LegalFooter } from "./Dashboard";
import { FAQS, type FaqItem } from "@/data/faq";
import { GLOSSARY } from "@/data/glossary";

function AccordionItem({ item, open, onToggle }: { item: FaqItem; open: boolean; onToggle: () => void }) {
  const reduce = useReducedMotion();
  return (
    <li className="skeuo-card overflow-hidden rounded-xl">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-[56px] w-full items-center justify-between gap-sm p-md text-left"
      >
        <span className="font-button text-button text-on-surface">{item.q}</span>
        <Icon name={open ? "remove" : "add"} size={22} className="flex-none text-primary" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? undefined : { height: 0, opacity: 0 }}
            animate={reduce ? undefined : { height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.3, 0, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-outline-variant/20 px-md pb-md pt-sm">
              <p className="font-body-lg text-body-md leading-relaxed text-on-surface-variant">{item.a}</p>
              {item.terms && item.terms.length > 0 && (
                <div className="mt-sm flex flex-wrap gap-xs">
                  {item.terms.map((t) => (
                    <InfoTerm key={t} term={t} className="rounded-full bg-surface-container-high px-3 py-1.5 text-label text-on-surface no-underline">
                      {t}
                    </InfoTerm>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function Faq() {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const fuse = useMemo(
    () => new Fuse(FAQS, { keys: [{ name: "q", weight: 2 }, { name: "a", weight: 1 }], threshold: 0.4, ignoreLocation: true, minMatchCharLength: 2 }),
    [],
  );
  const results: FaqItem[] = query.trim() ? fuse.search(query).map((r) => r.item) : FAQS;

  return (
    <Page label="Help and FAQs">
      <MobileHeader variant="title" title="Help & FAQs" />
      <Container>
        <header className="mb-md hidden md:block">
          <h1 className="font-display-lg-mobile text-display-lg text-on-surface">Help &amp; FAQs</h1>
          <p className="mt-1 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">Answers in plain English. Search, or browse the questions below.</p>
        </header>

        <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
          {/* Left: search + questions */}
          <div className="lg:col-span-8">
            <div className="relative mb-gutter">
              <Icon name="search" size={22} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search help — e.g. how long, fees, Ombudsman"
                aria-label="Search help and FAQs"
                className="skeuo-recessed min-h-[52px] w-full rounded-full border border-outline-variant/20 bg-surface-container-lowest pl-12 pr-4 font-body text-body-md text-on-surface placeholder:text-on-surface-variant/70"
              />
            </div>

            {results.length === 0 ? (
              <div className="skeuo-card rounded-xl p-md text-center">
                <p className="font-body-lg text-body-md text-on-surface-variant">No matches for "{query}". Try different words, or contact us and we'll help.</p>
              </div>
            ) : (
              <ul className="space-y-sm">
                {results.map((item) => (
                  <AccordionItem key={item.id} item={item} open={openId === item.id} onToggle={() => setOpenId(openId === item.id ? null : item.id)} />
                ))}
              </ul>
            )}
          </div>

          {/* Right: common terms + contact */}
          <aside className="space-y-md lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-md">
              <div className="skeuo-card rounded-xl p-md">
                <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">Common terms</h2>
                <p className="mb-sm font-body text-label font-normal text-on-surface-variant">Tap any term for a plain-English explanation.</p>
                <div className="flex flex-wrap gap-xs">
                  {Object.keys(GLOSSARY).map((t) => (
                    <InfoTerm key={t} term={t} className="rounded-full bg-surface-container-high px-3 py-1.5 text-label text-on-surface no-underline">
                      {t}
                    </InfoTerm>
                  ))}
                </div>
              </div>

              <div className="skeuo-card rounded-xl p-md">
                <h2 className="mb-xs font-headline-md text-headline-md text-on-surface">Still need help?</h2>
                <p className="mb-sm font-body text-body-md text-on-surface-variant">We're here Monday to Friday.</p>
                <a href="tel:01615050150" className="mb-sm flex min-h-[48px] items-center gap-sm rounded-lg bg-surface-container-lowest px-3 font-button text-button text-on-surface skeuo-raise skeuo-press">
                  <Icon name="call" size={20} className="text-primary" /> 0161 505 0150
                </a>
                <a href="mailto:contact@rowanrose.co.uk" className="flex min-h-[48px] items-center gap-sm rounded-lg bg-surface-container-lowest px-3 font-button text-button text-on-surface skeuo-raise skeuo-press">
                  <Icon name="mail" size={20} className="text-primary" /> contact@rowanrose.co.uk
                </a>
              </div>
            </div>
          </aside>
        </div>

        <LegalFooter />
      </Container>
    </Page>
  );
}
