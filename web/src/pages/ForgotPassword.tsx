import { useState } from 'react';
import { forgotPassword } from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await forgotPassword(email);
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-[#f5c842] font-[Syne] mb-2">
          Recuperar senha
        </h1>
        {sent ? (
          <p className="text-white/70">
            Se este email estiver cadastrado, você receberá as instruções em breve. Verifique sua caixa de entrada.
          </p>
        ) : (
          <>
            <p className="text-white/60 mb-6">
              Digite seu email e enviaremos um link para redefinir sua senha.
            </p>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 mb-4 focus:outline-none focus:border-[#f5c842]"
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !email}
              className="w-full bg-[#f5c842] text-[#0a0a0f] font-bold py-3 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar link'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}