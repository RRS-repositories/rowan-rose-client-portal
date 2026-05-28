import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { cn } from "@/lib/cn";

/** Reusable signature pad (Phase 4.1 Task 8).
 *  - Pointer Events cover mouse, touch and stylus uniformly.
 *  - touch-action: none on the canvas suppresses page scroll while drawing
 *    without per-event preventDefault calls.
 *  - The backing canvas is scaled by devicePixelRatio for sharp lines on
 *    retina displays; logical drawing co-ordinates stay in CSS pixels.
 *  - Strokes are stored as point arrays so undo() can pop the last one and
 *    redraw, and so we can repaint after a resize. */
export interface SignatureCanvasRef {
  toDataURL: () => string;
  clear: () => void;
  undo: () => void;
  isEmpty: () => boolean;
}

interface SignatureCanvasProps {
  height?: number;
  penColour?: string;
  penWidth?: number;
  backgroundColour?: string;
  signatureLine?: boolean;
  onChange?: (isEmpty: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

interface Point { x: number; y: number }
type Stroke = Point[];

export const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(function SignatureCanvas(
  {
    height,
    penColour = "#1A1A2E",
    penWidth = 2,
    backgroundColour = "#FFFFFF",
    signatureLine = true,
    onChange,
    disabled = false,
    ariaLabel,
    className,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentRef = useRef<Stroke | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const drawingRef = useRef(false);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height: h } = sizeRef.current;
    if (width === 0 || h === 0) return;

    ctx.save();
    ctx.fillStyle = backgroundColour;
    ctx.fillRect(0, 0, width, h);

    if (signatureLine) {
      const lineY = Math.round(h * 0.85);
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width * 0.05, lineY);
      ctx.lineTo(width * 0.95, lineY);
      ctx.stroke();
    }

    ctx.strokeStyle = penColour;
    ctx.lineWidth = penWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const all = currentRef.current ? [...strokesRef.current, currentRef.current] : strokesRef.current;
    for (const stroke of all) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
      if (stroke.length === 1) {
        ctx.lineTo(stroke[0].x + 0.1, stroke[0].y + 0.1);
      }
      ctx.stroke();
    }
    ctx.restore();
  }, [backgroundColour, penColour, penWidth, signatureLine]);

  const resize = useCallback(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const width = wrapper.clientWidth;
    const h = height ?? (window.matchMedia("(max-width: 640px)").matches ? 220 : 300);
    sizeRef.current = { width, height: h };
    canvas.style.width = `${width}px`;
    canvas.style.height = `${h}px`;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    redraw();
  }, [height, redraw]);

  useEffect(() => {
    resize();
    const ro = new ResizeObserver(() => resize());
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [resize]);

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    if (e.button !== undefined && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    currentRef.current = [pointFromEvent(e)];
    redraw();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || disabled) return;
    currentRef.current?.push(pointFromEvent(e));
    redraw();
  };

  const finishStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (currentRef.current && currentRef.current.length > 0) {
      strokesRef.current = [...strokesRef.current, currentRef.current];
    }
    currentRef.current = null;
    onChange?.(strokesRef.current.length === 0);
    redraw();
  };

  useImperativeHandle(ref, () => ({
    toDataURL: () => {
      // Compose a clean copy with background + signature line at the
      // canvas's current resolution so the saved PNG reads well.
      return canvasRef.current?.toDataURL("image/png") ?? "";
    },
    clear: () => {
      strokesRef.current = [];
      currentRef.current = null;
      onChange?.(true);
      redraw();
    },
    undo: () => {
      if (strokesRef.current.length === 0) return;
      strokesRef.current = strokesRef.current.slice(0, -1);
      onChange?.(strokesRef.current.length === 0);
      redraw();
    },
    isEmpty: () => strokesRef.current.length === 0 && currentRef.current === null,
  }), [onChange, redraw]);

  return (
    <div ref={wrapperRef} className={cn("w-full", className)}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={ariaLabel ?? "Signature drawing area"}
        className={cn(
          "block w-full rounded-lg border border-outline-variant/40 bg-white",
          disabled ? "opacity-50" : "cursor-crosshair",
        )}
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
        onPointerLeave={(e) => {
          if (drawingRef.current) finishStroke(e);
        }}
      />
    </div>
  );
});
