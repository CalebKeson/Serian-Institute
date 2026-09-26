import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  FileSearch,
  Hash,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router";
import { normalizeVerificationId } from "../../utils/verification";

const VerificationSearch = () => {
  const navigate = useNavigate();
  const [verificationInput, setVerificationInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const normalizedId = normalizeVerificationId(verificationInput);

    if (!normalizedId) {
      setError("Please enter a registration number or verification ID.");
      return;
    }

    setError("");
    navigate(`/verify/${encodeURIComponent(normalizedId)}`);
  };

  const handleInputChange = (event) => {
    setVerificationInput(event.target.value);

    if (error) {
      setError("");
    }
  };

  const useExample = () => {
    setVerificationInput("SBTC/CNA/001/2026");
    setError("");
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center justify-center">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          {/* Header */}
          <div className="border-b border-slate-200 px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm sm:h-14 sm:w-14">
                <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Certificate Verification
                </p>

                <h1 className="mt-1 text-lg font-bold leading-tight text-slate-900 sm:text-xl">
                  Serian Business and Technology College
                </h1>
              </div>
            </div>
          </div>

          {/* Main */}
          <div className="px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="mx-auto max-w-2xl">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                >
                  <FileSearch className="h-8 w-8" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="mt-6 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
                >
                  Verify a certificate
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base"
                >
                  Enter the registration number or verification ID associated
                  with the certificate you want to verify.
                </motion.p>
              </div>

              {/* Search form */}
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.45 }}
                className="mt-8"
              >
                <label
                  htmlFor="verification-input"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Registration number or verification ID
                </label>

                <div
                  className={`flex flex-col gap-3 sm:flex-row ${
                    error ? "mb-2" : ""
                  }`}
                >
                  <div className="relative min-w-0 flex-1">
                    <Hash className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="verification-input"
                      type="text"
                      value={verificationInput}
                      onChange={handleInputChange}
                      placeholder="e.g. SBTC/CNA/001/2026"
                      autoComplete="off"
                      spellCheck="false"
                      className={`w-full rounded-xl border bg-white py-3.5 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                        error
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-slate-300 focus:border-slate-500 focus:ring-slate-200"
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 active:scale-[0.99]"
                  >
                    <Search className="h-4 w-4" />
                    Verify
                  </button>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm font-medium text-red-600"
                  >
                    {error}
                  </motion.p>
                )}
              </motion.form>

              {/* Example */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Example
                    </p>

                    <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-800">
                      SBTC/CNA/001/2026
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={useExample}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
                  >
                    Use example
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>

              {/* Information */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4"
              >
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                <p className="text-xs leading-5 text-blue-800 sm:text-sm">
                  Enter the number exactly as it appears on the certificate.
                  Registration numbers using "/" are automatically converted
                  into the corresponding verification ID format.
                </p>
              </motion.div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-5 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-2 text-center text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <p>Certificate Verification</p>
              <p>Serian Business and Technology College</p>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
};

export default VerificationSearch;