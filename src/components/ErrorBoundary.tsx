import { Component, type ErrorInfo, type ReactNode } from "react";
import ActionButton from "./ActionButton";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.warn("Road to 15-0 recovered from an error.", error, info);
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="app-frame grid place-items-center">
        <section className="game-panel max-w-xl p-6 text-center">
          <div className="section-kicker">Something went off script</div>
          <h1 className="mt-3 font-display text-3xl font-black text-frost">The run can be restarted safely.</h1>
          <p className="mt-3 text-sm leading-6 text-steel/74">
            A runtime error was caught before the page could go blank. Your browser may still have a saved run.
          </p>
          <ActionButton className="mt-5" onClick={() => window.location.reload()}>
            Reload app
          </ActionButton>
        </section>
      </main>
    );
  }
}
