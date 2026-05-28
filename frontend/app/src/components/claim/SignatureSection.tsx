import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SignatureCanvas, type SignatureCanvasRef } from "@/components/ui/SignatureCanvas";

/** Drawn-signature input. The user signs with mouse, finger or stylus on a
 *  full-width canvas; Undo pops the last stroke and Clear empties it. The
 *  parent reads the current data URL via the imperative handle at submit
 *  time so we don't re-encode the canvas on every stroke. */
export interface SignatureValue {
  /** Base64 PNG data URL of the drawn signature. Empty when nothing is drawn. */
  data: string;
  isValid: boolean;
}

export interface SignatureSectionRef {
  getValue: () => SignatureValue;
}

interface Props {
  onChange: (value: SignatureValue) => void;
}

export const SignatureSection = forwardRef<SignatureSectionRef, Props>(function SignatureSection(
  { onChange },
  ref,
) {
  const [empty, setEmpty] = useState(true);
  const canvasRef = useRef<SignatureCanvasRef | null>(null);

  const handleChange = (isEmpty: boolean) => {
    setEmpty(isEmpty);
    if (isEmpty) {
      onChange({ data: "", isValid: false });
    } else {
      const dataUrl = canvasRef.current?.toDataURL() ?? "";
      onChange({ data: dataUrl, isValid: dataUrl.length > 0 });
    }
  };

  useImperativeHandle(ref, () => ({
    getValue: () => {
      const dataUrl = canvasRef.current?.toDataURL() ?? "";
      return {
        data: dataUrl,
        isValid: !empty && dataUrl.length > 0,
      };
    },
  }), [empty]);

  return (
    <section aria-label="Sign to accept">
      <header className="mb-sm">
        <h2 className="font-headline-md text-headline-md text-on-surface">Sign to Accept</h2>
        <p className="mt-1 font-body text-body-md text-on-surface-variant">
          Please provide your signature below to confirm your acceptance of this offer.
        </p>
      </header>

      <SignatureCanvas
        ref={canvasRef}
        onChange={handleChange}
        ariaLabel={empty ? "Empty signature pad" : "Your drawn signature"}
      />
      <p className="mt-2 font-body text-label text-on-surface-variant">
        Draw your signature using your mouse, finger or stylus.
      </p>
      <div className="mt-sm flex flex-col gap-2 sm:flex-row">
        <Button
          size="md"
          variant="ghost"
          leadingIcon="undo"
          onClick={() => {
            canvasRef.current?.undo();
            handleChange(canvasRef.current?.isEmpty() ?? true);
          }}
          aria-label="Undo last stroke"
        >
          Undo
        </Button>
        <Button
          size="md"
          variant="ghost"
          leadingIcon="restart_alt"
          onClick={() => {
            canvasRef.current?.clear();
            handleChange(true);
          }}
          aria-label="Clear signature"
        >
          Clear
        </Button>
      </div>
    </section>
  );
});
