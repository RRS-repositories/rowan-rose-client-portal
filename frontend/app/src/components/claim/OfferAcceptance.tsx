import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/useToast";
import { gbp } from "@/lib/format";
import type { Claim } from "@/data/types";

/** Acceptance form — typed full name + checkbox (NO drawn signature). Submission mocked. */
export function OfferAcceptance({ claim }: { claim: Claim }) {
  const offer = claim.financials?.offer;
  const { push } = useToast();
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [touched, setTouched] = useState(false);
  const [accepted, setAccepted] = useState(false);
  if (offer == null) return null;

  const nameError = touched && !name.trim() ? "Please type your full name to accept." : undefined;
  const agreeError = touched && !agree ? "Please tick the box to confirm." : undefined;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!name.trim() || !agree) return;
    setAccepted(true);
    push({ title: "Offer accepted", description: "We'll let you know as soon as payment arrives.", tone: "success" });
  }

  if (accepted)
    return (
      <section className="skeuo-card rounded-xl p-md" aria-live="polite">
        <div className="flex items-start gap-md">
          <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-primary-container text-on-primary-container skeuo-inner-highlight">
            <Icon name="task_alt" size={24} fill />
          </span>
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">You've accepted the offer</h3>
            <p className="mt-1 font-body text-body-md text-on-surface-variant">
              Thank you, {name.trim()}. We're now waiting for payment from {claim.lender.name}. You don't need to do anything else — we'll be in touch.
            </p>
          </div>
        </div>
      </section>
    );

  return (
    <section className="skeuo-card rounded-xl p-md" aria-label="Accept this offer">
      <h3 className="font-headline-md text-headline-md text-on-surface">Accept this offer</h3>
      <p className="mt-1 font-body text-body-md text-on-surface-variant">If you're happy with the offer of {gbp(offer)}, type your full name and confirm below.</p>
      <form className="mt-md space-y-md" onSubmit={submit} noValidate>
        <Input label="Type your full name to accept" autoComplete="name" placeholder="e.g. Sarah Holden" value={name} onChange={(e) => setName(e.target.value)} error={nameError} />
        <label className="flex cursor-pointer items-start gap-sm">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-6 w-6 flex-none accent-primary" />
          <span className="font-body text-body-md text-on-surface-variant">
            I confirm I want to accept the offer of {gbp(offer)} from {claim.lender.name} and I understand the next steps will be explained to me before any fee is taken.
          </span>
        </label>
        {agreeError && (
          <p className="flex items-center gap-1 font-body text-label text-error">
            <Icon name="error" size={16} fill />
            {agreeError}
          </p>
        )}
        <div className="flex flex-col gap-sm sm:flex-row">
          <Button type="submit" leadingIcon="check" fullWidth>Accept this offer</Button>
          <Button type="button" variant="secondary" leadingIcon="forum" fullWidth>Ask us a question</Button>
        </div>
      </form>
    </section>
  );
}
