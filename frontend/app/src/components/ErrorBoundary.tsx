import { Component, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

interface Props {
  children: ReactNode;
  /** when this changes (e.g. route path), a caught error is cleared */
  resetKey?: unknown;
}
interface State {
  error: Error | null;
}

/** Catches render errors on a screen so a crash shows a clear message + reload
 *  instead of a blank page. Resets when the route (resetKey) changes. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("Screen error:", error, info);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-md px-margin-mobile py-xl text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-error-container text-on-error-container skeuo-inner-highlight">
            <Icon name="error" size={32} fill />
          </span>
          <h2 className="mt-5 font-headline-md text-headline-md text-on-surface">Something went wrong on this screen</h2>
          <p className="mt-2 font-body text-body-md text-on-surface-variant">
            Sorry — that didn't load properly. Please try again, or contact us if it keeps happening.
          </p>
          <pre className="mt-3 overflow-auto rounded-lg bg-surface-container-low p-3 text-left font-mono text-label text-on-surface-variant">
            {this.state.error.message}
          </pre>
          <div className="mt-6 flex justify-center gap-sm">
            <button
              onClick={() => window.location.reload()}
              className="min-h-[48px] rounded-lg bg-primary px-md font-button text-button text-on-primary skeuo-raise skeuo-press focus-on-primary"
            >
              Reload
            </button>
            <a
              href="/dashboard"
              className="flex min-h-[48px] items-center rounded-lg border border-outline-variant/50 bg-surface-container-high px-md font-button text-button text-on-surface skeuo-raise skeuo-press"
            >
              Back to home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
