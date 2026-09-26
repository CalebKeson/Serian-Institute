import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { createVerificationId } from "../../utils/verification";

const CertificateQRCode = ({ registrationNumber }) => {
  if (!registrationNumber) return null;

  const verificationId = createVerificationId(registrationNumber);

  const verificationUrl = `${window.location.origin}/verify/${encodeURIComponent(
    verificationId
  )}`;

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex items-center gap-2 text-slate-800">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />

          <h3 className="text-base font-semibold">
            Scan to Verify
          </h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <QRCodeSVG
            value={verificationUrl}
            size={200}
            level="M"
            includeMargin
          />
        </div>

        <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
          Scan this QR code with a phone camera to open the public
          certificate verification page.
        </p>

        <div className="mt-4 w-full rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Verification ID
          </p>

          <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-700">
            {verificationId}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <ExternalLink className="h-3.5 w-3.5" />

          <span>Opens the public verification page</span>
        </div>
      </div>
    </div>
  );
};

export default CertificateQRCode;