import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../api/client';
import { useTranslation } from "react-i18next";

export default function ResetPassword() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (newPassword !== confirm) return setError(t("resetPassword.mismatch"));
    if (newPassword.length < 6) return setError(t("resetPassword.minLength"));
    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      navigate('/login?passwordReset=success');
    } catch {
      setError(t("resetPassword.invalidLink"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-[#f5c842] font-[Syne] mb-6">
          {t("resetPassword.title")}
        </h1>
        <label htmlFor="new-password" className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
          {t("resetPassword.newPasswordLabel")}
        </label>
        <input
          id="new-password"
          type="password"
          placeholder="Nova senha"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 mb-3 focus:outline-none focus:border-[#f5c842]"
        />
        <label htmlFor="confirm-password" className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
          {t("resetPassword.confirmLabel")}
        </label>
        <input
          id="confirm-password"
          type="password"
          placeholder="Confirmar senha"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 mb-4 focus:outline-none focus:border-[#f5c842]"
        />
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#f5c842] text-[#0a0a0f] font-bold py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? t("resetPassword.saving") : t("resetPassword.submit")}
        </button>
      </div>
    </div>
  );
}
