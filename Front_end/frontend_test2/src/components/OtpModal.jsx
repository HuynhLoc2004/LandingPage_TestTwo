import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function OtpModal({ isOpen, onClose, onVerify, email, isVerifying, error }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    // Allow pasting
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split('');
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i];
      }
      setOtp(newOtp);
      const nextFocus = Math.min(pasted.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length === 6) {
      onVerify(otpString);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0, rotateX: 10 }}
            animate={{ scale: 1, y: 0, opacity: 1, rotateX: 0 }}
            exit={{ scale: 0.9, y: 20, opacity: 0, rotateX: -10 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative w-full max-w-md perspective-1000"
          >
            {/* 3D Container with Glassmorphism and dynamic shadows for Light/Dark mode */}
            <div className="relative overflow-hidden rounded-3xl bg-white/90 dark:bg-slate-900/90 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1),_0_2px_10px_rgba(0,0,0,0.05),_inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5),_0_2px_10px_rgba(0,0,0,0.3),_inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl border border-white/20 dark:border-slate-700/50 transform-gpu">
              
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-[0_10px_20px_rgba(59,130,246,0.3),_inset_0_2px_0_rgba(255,255,255,0.3)]">
                  <CheckCircle className="text-white" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Xác thực Email</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Chúng tôi đã gửi mã OTP gồm 6 chữ số đến<br />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="flex justify-between gap-2 mb-6">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => inputRefs.current[index] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-500/30 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] outline-none"
                    />
                  ))}
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2 text-red-500 mb-4 text-sm font-medium">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={otp.join('').length !== 6 || isVerifying}
                  className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 text-white font-semibold shadow-[0_10px_20px_rgba(37,99,235,0.3),_inset_0_2px_0_rgba(255,255,255,0.2)] hover:shadow-[0_15px_30px_rgba(37,99,235,0.4),_inset_0_2px_0_rgba(255,255,255,0.2)] transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Đang xác thực...
                    </>
                  ) : (
                    'Xác nhận OTP'
                  )}
                </button>
              </form>
              
              <p className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
                Chưa nhận được mã?{' '}
                <button className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                  Gửi lại
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
