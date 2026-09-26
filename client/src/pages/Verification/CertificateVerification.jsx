import React from "react";
import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  GraduationCap,
  Hash,
  School,
  ShieldCheck,
  UserRound,
  AlertCircle,
} from "lucide-react";

import CertificateQRCode from "../../components/Verification/CertificateQRCode";
import { createVerificationId } from "../../utils/verification";

const DEMO_CERTIFICATES = [
  {
    registrationNumber: "SBTC/CNA/001/2026",
    studentName: "Lydia Nyambura",
    programme: "Certified Nursing Assistant (CNA)",
    completionDate: "28 September 2026",
    institution: "Serian Business and Technology College",
    school: "School of Medical, Health & Social Sciences",
    status: "verified",
  },
];

const CertificateVerification = () => {
  const { verificationId } = useParams();

  const normalizedId = verificationId
    ? decodeURIComponent(verificationId)
        .trim()
        .replace(/\//g, "-")
        .replace(/\s+/g, "")
        .toUpperCase()
    : "";

  const certificate = DEMO_CERTIFICATES.find(
    (item) => createVerificationId(item.registrationNumber) === normalizedId
  );

  const isVerified = Boolean(certificate);

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-violet-50">
        {/* Header */}
        <header className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-indigo-900 to-violet-800">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />

          <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <Link
              to="/verify"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-100 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Verification
            </Link>

            <div className="mt-8 max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-100 backdrop-blur-sm">
                <ShieldCheck className="h-4 w-4" />
                Certificate Verification
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Verification record not found
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                We could not find a certificate verification record matching
                the verification ID provided.
              </p>
            </div>
          </div>
        </header>

        {/* Invalid State */}
        <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-4 py-12 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-indigo-100/40 sm:p-10"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle className="h-8 w-8" />
            </div>

            <div className="mt-6 text-center">
              <h2 className="text-xl font-bold text-slate-900">
                Verification record not found
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
                The verification ID below does not currently match a
                certificate record in this demonstration environment.
              </p>
            </div>

            <div className="mt-7 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
                Entered Verification ID
              </p>

              <p className="mt-2 break-all font-mono text-sm font-semibold text-indigo-950">
                {normalizedId || "No verification ID provided"}
              </p>
            </div>

            <div className="mt-7 flex justify-center">
              <Link
                to="/verify"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-800 to-violet-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <ArrowLeft className="h-4 w-4" />
                Return to Verification
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/70 via-white to-violet-50/40">
      {/* Branded Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-indigo-900 to-violet-800">
        {/* Decorative background elements */}
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -bottom-36 -left-24 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute right-1/3 top-1/2 h-40 w-40 rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <Link
            to="/verify"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-100 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Verification
          </Link>

          <div className="mt-8 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-100 backdrop-blur-sm">
                <ShieldCheck className="h-4 w-4" />
                Certificate Verification
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Certificate Verification
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                Review the certificate details associated with this
                verification record.
              </p>
            </div>

            {/* Verification Status */}
            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                <BadgeCheck className="h-6 w-6 text-emerald-300" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-blue-200">
                  Status
                </p>
                <p className="mt-0.5 text-sm font-bold text-white">
                  Verified
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
        >
          {/* Left Column */}
          <div className="space-y-6">
            {/* Verification Result */}
            <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-xl shadow-indigo-100/40">
              <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-5 py-5 sm:px-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200">
                    <ShieldCheck className="h-6 w-6" />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Verification Result
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      The certificate record has been located in the
                      verification preview.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <BadgeCheck className="h-6 w-6" />
                    </div>

                    <div>
                      <p className="font-semibold text-emerald-900">
                        Certificate record verified
                      </p>

                      <p className="mt-1 text-sm leading-6 text-emerald-700">
                        The verification ID corresponds to the certificate
                        information displayed below.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Certificate Information */}
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-indigo-100/30">
              <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
                <h2 className="text-lg font-bold text-slate-900">
                  Certificate Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Details associated with this verification record.
                </p>
              </div>

              <div className="grid gap-px bg-slate-100 sm:grid-cols-2">
                {/* Student */}
                <div className="bg-white p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <UserRound className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Student Name
                      </p>

                      <p className="mt-1 break-words text-base font-semibold text-slate-900">
                        {certificate.studentName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Registration Number */}
                <div className="bg-white p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <Hash className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Registration Number
                      </p>

                      <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-900">
                        {certificate.registrationNumber}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Programme */}
                <div className="bg-white p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <GraduationCap className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Programme
                      </p>

                      <p className="mt-1 break-words text-base font-semibold text-slate-900">
                        {certificate.programme}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Completion Date */}
                <div className="bg-white p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <CalendarDays className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Completion Date
                      </p>

                      <p className="mt-1 text-base font-semibold text-slate-900">
                        {certificate.completionDate}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Institution */}
                <div className="bg-white p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <School className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Institution
                      </p>

                      <p className="mt-1 break-words text-base font-semibold text-slate-900">
                        {certificate.institution}
                      </p>
                    </div>
                  </div>
                </div>

                {/* School */}
                <div className="bg-white p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <School className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        School / Faculty
                      </p>

                      <p className="mt-1 break-words text-base font-semibold text-slate-900">
                        {certificate.school}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Prototype Notice */}
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                <div>
                  <p className="font-semibold text-amber-900">
                    Verification Preview
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    This page is currently running with frontend demonstration
                    data. In the production system, verification results will
                    be retrieved from the institution's authorized certificate
                    records.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <aside className="space-y-6">
            {/* QR Verification */}
            <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-1 shadow-xl shadow-indigo-100/40">
              <CertificateQRCode
                registrationNumber={certificate.registrationNumber}
              />
            </div>

            {/* Verification ID Card */}
            <section className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-xl shadow-indigo-100/30 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-900 to-violet-700 text-white">
                  <Hash className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    Verification ID
                  </h3>

                  <p className="text-xs text-slate-500">
                    Public certificate identifier
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-4">
                <p className="break-all font-mono text-sm font-bold leading-6 text-indigo-950">
                  {createVerificationId(certificate.registrationNumber)}
                </p>
              </div>
            </section>

            {/* Institution Card */}
            <section className="rounded-3xl bg-gradient-to-br from-blue-950 via-indigo-900 to-violet-800 p-6 text-white shadow-xl shadow-indigo-200/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                <School className="h-6 w-6 text-blue-100" />
              </div>

              <h3 className="mt-5 text-lg font-bold">
                {certificate.institution}
              </h3>

              <p className="mt-2 text-sm leading-6 text-blue-100">
                Certificate verification service for checking credential
                records.
              </p>

              <div className="mt-5 border-t border-white/10 pt-5">
                <p className="text-xs font-medium uppercase tracking-wider text-blue-200">
                  Verification Service
                </p>

                <p className="mt-1 text-sm font-medium text-white">
                  Public Certificate Verification
                </p>
              </div>
            </section>
          </aside>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-center text-xs text-slate-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:text-left">
          <p>
            Certificate Verification · {certificate.institution}
          </p>

          <p>
            Verification ID:{" "}
            <span className="font-mono text-slate-500">
              {createVerificationId(certificate.registrationNumber)}
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CertificateVerification;