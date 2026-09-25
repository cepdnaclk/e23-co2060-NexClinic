import Link from "next/link";
import React from "react";

export default function UnauthorizedAccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="bg-emerald-600 px-6 py-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Access Denied</h1>
          <p className="mt-2 text-emerald-100">
            You do not have permission to view this document.
          </p>
        </div>

        <div className="p-8 text-center">
          <p className="mb-8 text-slate-600">
            This document is secured. If you are a patient or doctor and believe
            you should have access, please log in or sign up to continue.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-emerald-700 shadow-sm ring-1 ring-inset ring-emerald-200 transition hover:bg-emerald-50"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
