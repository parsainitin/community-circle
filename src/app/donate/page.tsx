"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Heart, Landmark, CheckCircle, ShieldAlert, Award, FileText } from "lucide-react";

interface DonationType {
  _id: string;
  amount: number;
  donor: {
    _id: string;
    name: string;
    gotra?: string;
  };
  transactionId: string;
  createdAt: string;
}

export default function DonatePage() {
  const { user } = useAuth();
  const [amount, setAmount] = useState("500");
  const [customAmount, setCustomAmount] = useState("");
  const [donations, setDonations] = useState<DonationType[]>([]);
  const [loadingReport, setLoadingReport] = useState(true);

  // GPay Sheet States
  const [showGPaySheet, setShowGPaySheet] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [savedTxId, setSavedTxId] = useState("");

  const presetAmounts = ["100", "500", "1000", "5000"];

  useEffect(() => {
    fetchDonationReport();
  }, []);

  const fetchDonationReport = async () => {
    try {
      const res = await fetch("/api/donations");
      if (res.ok) {
        const data = await res.json();
        setDonations(data || []);
      }
    } catch (e) {
      console.error("Failed to load donation report", e);
    } finally {
      setLoadingReport(false);
    }
  };

  const getActiveAmount = () => {
    return customAmount ? Number(customAmount) : Number(amount);
  };

  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const payVal = getActiveAmount();
    if (!payVal || payVal <= 0) {
      alert("Please enter a valid donation amount.");
      return;
    }
    setShowGPaySheet(true);
  };

  const handleConfirmPayment = async () => {
    setProcessing(true);
    const txId = `GPA.${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10000 + Math.random() * 90000)}`;

    setTimeout(async () => {
      try {
        const res = await fetch("/api/donations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            donorId: user?._id || "anonymous-user-id", // safe fallback, but user is logged in
            amount: getActiveAmount(),
            transactionId: txId,
            status: "success",
          }),
        });

        if (res.ok) {
          setSavedTxId(txId);
          setPaymentSuccess(true);
          fetchDonationReport();
        } else {
          alert("Payment completed but logging failed. Please reach out to support.");
        }
      } catch (err) {
        console.error("Save donation error", err);
      } finally {
        setProcessing(false);
      }
    }, 2000); // Simulate Google Pay processing speed
  };

  return (
    <div className="flex flex-col space-y-4 pb-24 relative min-h-[75vh] select-none">
      {/* 📢 DONATION PAGE HEADER */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100/80 text-center space-y-3">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-xs">
          <Heart className="w-6 h-6 fill-red-500" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-800">Support Jambu Community Circle</h2>
          <p className="text-xs text-slate-400">
            Keep the platform running ad-free, secure, and fast for everyone.
          </p>
        </div>
      </div>

      {/* 💌 REQUEST NOTE */}
      <div className="bg-slate-50 border border-slate-150 p-4.5 rounded-3xl leading-relaxed text-xs text-slate-600 font-semibold space-y-2">
        <p>
          Dear Jambu Community Circle Members,
        </p>
        <p>
          To maintain this digital circle without intrusive ads and keep our community database servers responsive and secure, we request your kind support.
        </p>
        <p>
          Your contributions directly fund database storage, API integrations, and ongoing development work to preserve our family lineages and marketplace connections. Any amount you donate makes a huge difference! Thank you. ❤️
        </p>
      </div>

      {/* 💳 DONATION FORM CARD */}
      {!paymentSuccess ? (
        <form onSubmit={handleStartPayment} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Select Amount (INR)</h3>
          
          {/* Presets */}
          <div className="grid grid-cols-4 gap-2.5">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAmount(preset);
                  setCustomAmount("");
                }}
                className={`py-2 px-1 text-center font-bold text-xs rounded-xl border transition-all active:scale-95 cursor-pointer ${
                  amount === preset && !customAmount
                    ? "bg-whatsapp-green text-white border-whatsapp-green shadow-xs"
                    : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                }`}
              >
                ₹{preset}
              </button>
            ))}
          </div>

          {/* Custom Input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Or Enter Custom Amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
              <input
                type="number"
                placeholder="Enter custom amount"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setAmount("");
                }}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green focus:ring-1 focus:ring-whatsapp-green text-xs outline-hidden font-bold transition-all text-slate-800"
              />
            </div>
          </div>

          {/* Google Pay CTA Button */}
          <button
            type="submit"
            className="w-full bg-black text-white hover:bg-slate-900 active:scale-98 transition-transform font-bold text-xs py-3 rounded-2xl flex items-center justify-center space-x-2 border-0 cursor-pointer shadow-md"
          >
            {/* Google Pay Styled Text Logo */}
            <span className="font-semibold text-sm tracking-tight flex items-center">
              Pay with <span className="font-extrabold text-whatsapp-light ml-1 flex items-center">GPay</span>
            </span>
          </button>
        </form>
      ) : (
        /* SUCCESS SCREEN CARD */
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg text-center space-y-4">
          <div className="w-14 h-14 bg-whatsapp-light text-whatsapp-green rounded-full flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-extrabold text-slate-800">Thank You For Your Support!</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Your donation of <span className="text-whatsapp-green font-extrabold">₹{getActiveAmount()}</span> was successfully processed via Google Pay and logged in our registry database.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-left space-y-1 font-mono text-[10px] text-slate-500">
            <div className="flex justify-between">
              <span>Transaction ID:</span>
              <span className="font-bold text-slate-700">{savedTxId}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-bold text-whatsapp-green">COMPLETED</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPaymentSuccess(false);
              setCustomAmount("");
              setAmount("500");
            }}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs active:scale-95 transition-transform border-0 cursor-pointer"
          >
            Make Another Donation
          </button>
        </div>
      )}

      {/* 📜 RECENT CONTRIBUTION REPORT */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-100">
          <FileText className="w-4 h-4 text-whatsapp-green" />
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Contributors Registry Report</h3>
        </div>

        {loadingReport ? (
          <div className="py-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-whatsapp-green"></div>
          </div>
        ) : donations.length === 0 ? (
          <div className="py-8 text-center text-slate-400 italic text-[11px]">
            No donations logged yet. Be the first to appear in this registry!
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {donations.map((d) => (
              <div
                key={d._id}
                className="bg-slate-50 hover:bg-slate-100/70 p-3 rounded-2xl flex items-center justify-between border border-slate-100/50"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 bg-whatsapp-light rounded-full flex items-center justify-center text-[10px] text-whatsapp-green font-bold uppercase">
                    {d.donor?.name ? d.donor.name.charAt(0) : "A"}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">
                      {d.donor?.name || "Anonymous Member"}
                    </span>
                    {d.donor?.gotra && (
                      <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                        Gotra: {d.donor.gotra}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-extrabold text-whatsapp-green block">
                    +₹{d.amount}
                  </span>
                  <span className="text-[8px] text-slate-400 font-medium block mt-0.5">
                    {new Date(d.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📱 MOCK GPAY SLIDE-UP SHEET OVERLAY */}
      {showGPaySheet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end justify-center z-50 p-0 select-none transition-opacity duration-300">
          <div className="bg-slate-950 text-white w-full max-w-md rounded-t-3xl p-5 pb-8 shadow-2xl flex flex-col space-y-5 animate-slide-up">
            
            {/* Header / Drag Bar */}
            <div className="flex flex-col items-center space-y-1">
              <div className="w-10 h-1.5 bg-slate-800 rounded-full" />
              <div className="flex items-center justify-between w-full pt-2">
                <span className="font-extrabold text-sm tracking-tight text-slate-200">
                  Google <span className="text-whatsapp-green">Pay</span>
                </span>
                <button
                  onClick={() => setShowGPaySheet(false)}
                  className="p-1 hover:bg-slate-900 rounded-full text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-900 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Paying To:</span>
                <span className="text-xs font-bold text-slate-200">Jambu Community Circle Support</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-xs text-slate-400">Account Username:</span>
                <span className="text-xs font-semibold text-slate-300">{user?.name} ({user?.mobileNumber})</span>
              </div>
              <div className="flex justify-between items-center pt-1.5">
                <span className="text-sm font-extrabold text-slate-300">Total Amount:</span>
                <span className="text-base font-extrabold text-whatsapp-green">₹{getActiveAmount()}</span>
              </div>
            </div>

            {/* Bank details selection */}
            <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-slate-900/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-300">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block text-slate-200">State Bank of India</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">UPI ID: sbi***@okaxis</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-whatsapp-green">Selected</span>
            </div>

            {/* Action buttons */}
            <button
              onClick={handleConfirmPayment}
              disabled={processing}
              className="w-full py-3 bg-whatsapp-green disabled:bg-whatsapp-green/50 text-slate-950 font-extrabold text-xs rounded-2xl active:scale-95 transition-transform cursor-pointer border-0 flex items-center justify-center space-x-2"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <span>Confirm & Pay ₹{getActiveAmount()}</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// X component local mock
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
