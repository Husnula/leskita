"use client";
import React from "react";
import { logger } from "@/lib/logger";
type Props = { children: React.ReactNode; fallback?: React.ReactNode };
type State = { hasError: boolean; error?: Error };
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { logger.error("ErrorBoundary", { error: error.message, stack: error.stack, info }); try { const { captureError } = require("@/lib/sentry"); captureError(error, { componentStack: info.componentStack } as any); } catch {} }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-16 h-16 bg-danger-50 rounded-full flex items-center justify-center mb-4"><i className="ti ti-alert-triangle text-3xl text-danger-500" /></div>
          <h3 className="text-lg font-bold text-slate-800">Terjadi kesalahan</h3>
          <p className="text-sm text-slate-500 max-w-md mt-2">{this.state.error?.message ?? "Coba refresh halaman."}</p>
          <button onClick={()=>this.setState({ hasError: false })} className="mt-6 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold">Coba lagi</button>
        </div>
      );
    }
    return this.props.children;
  }
}
