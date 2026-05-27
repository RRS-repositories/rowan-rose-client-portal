# ❓ Open Questions

Things to resolve. Roughly priority-ordered.

---

## Phase A — Design Exploration

- [ ] Brand assets — is there a logo SVG, finalised brand palette, or do we use placeholders during exploration?
- [ ] Typography — is a firm typeface already in use (letterhead, marketing site) or pick during exploration?
- [ ] Tone of voice — any existing client-comms guidelines to align with, or build from scratch?

---

## Phase B — Production Build (later)

- [ ] Stack pick — see [[04 - Stack Decision Worksheet]]
- [ ] Document scanning library on mobile (react-native-document-scanner vs alternatives — depends on stack pick)
- [ ] App Store / Google Play developer accounts already set up?
- [ ] Internal QA / TestFlight / Play Console group ready for testing?

---

## Backend (locked, capture as they come up)

- [ ] Existing CRM auth infrastructure — reuse or rebuild for portal?
- [ ] DB schema docs for client/claim/requirement relationships available?
- [ ] AWS region preference + containerisation (ECS/Docker)?
- [ ] Existing email infrastructure — SES, SendGrid, or other?
- [ ] Twilio account — reuse CRM's existing account or separate sub-account for portal OTP?
- [ ] CI/CD pipeline to integrate with?
- [ ] Penetration test vendor — same as previous firm audits or new?

---

## Compliance / Legal (capture early, resolve before launch)

- [ ] GDPR data flow review — who's the data controller for portal-uploaded docs?
- [ ] SRA confirmation that e-signature (typed name + checkbox) is acceptable for offer acceptance — confirm with COLP
- [ ] Privacy policy URL for portal sign-up consent
- [ ] T&Cs URL for portal use
- [ ] Cookie / tracking disclosure (web version)
