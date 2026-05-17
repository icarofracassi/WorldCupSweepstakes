import { useState } from 'react';
import { forgotPassword } from '../api/client';
import { useTranslation } from "react-i18next";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError(t("forgotPassword.sendError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-[#f5c842] font-[Syne] mb-2">
          {t("forgotPassword.title")}
        </h1>
        {sent ? (
          <p className="text-white/70">
            {t("forgotPassword.sentMessage")}
          </p>
        ) : (
          <>
            <p className="text-white/60 mb-6">
              {t("forgotPassword.description")}
            </p>
            <label htmlFor="forgot-email" className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
              {t("forgotPassword.emailLabel")}
            </label>
            <input
              id="forgot-email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 mb-4 focus:outline-none focus:border-[#f5c842]"
            />
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={loading || !email}
              className="w-full bg-[#f5c842] text-[#0a0a0f] font-bold py-3 rounded-lg disabled:opacity-50"
            >
              {loading ? t("forgotPassword.sending") : t("forgotPassword.sendLink")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
