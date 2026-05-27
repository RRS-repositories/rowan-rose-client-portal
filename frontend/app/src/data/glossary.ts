/** Plain-English explanations for legal/finance jargon (brief §2 soft a11y:
 *  jargon must carry a one-line plain-English explanation on first appearance). */
export const GLOSSARY: Record<string, string> = {
  "Financial Ombudsman":
    "A free, independent service that settles disputes between you and a lender. Its decision is binding on the lender if you accept it.",
  "lending records":
    "The full history of what you borrowed and repaid. We request these from the lender to check whether the lending was affordable.",
  redress:
    "The money you're owed back — usually the interest and charges you were wrongly made to pay, plus 8% statutory interest.",
  "final response":
    "The lender's formal answer to your complaint. They must send one, usually within 8 weeks of the complaint.",
  "irresponsible lending":
    "When a lender gave you credit you couldn't realistically afford to repay at the time.",
  affordability:
    "Whether the lender properly checked you could afford the repayments before lending to you.",
  "statutory interest":
    "An extra 8% a year the law adds on top of refunded charges, to make up for being out of pocket.",
};

export type GlossaryTerm = keyof typeof GLOSSARY;
