import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(name, email, password);
      navigate("/");
    } catch {
      setError("Erro ao criar conta. Email já em uso?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#f5c842]/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f5c842] to-[#e8a020] text-3xl mb-4 shadow-2xl shadow-yellow-500/30">⚽</div>
          <h1 className="text-3xl font-black text-white tracking-tight">Criar Conta</h1>
          <p className="text-white/30 mt-1 text-sm">Bolão Copa 2026 · Escritório</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</motion.div>
            )}
            {[
              { label: "Nome", value: name, onChange: setName, type: "text", placeholder: "Seu nome" },
              { label: "Email", value: email, onChange: setEmail, type: "email", placeholder: "seu@email.com" },
              { label: "Senha", value: password, onChange: setPassword, type: "password", placeholder: "Mínimo 6 caracteres" },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">{f.label}</label>
                <input
                  type={f.type} value={f.value} onChange={(e) => f.onChange(e.target.value)} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#f5c842]/50 transition text-sm"
                  placeholder={f.placeholder}
                />
              </div>
            ))}
            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="w-full bg-gradient-to-r from-[#f5c842] to-[#e8a020] text-black font-black py-3.5 rounded-xl disabled:opacity-50 shadow-lg shadow-yellow-500/20 text-sm">
              {loading ? "Criando conta..." : "Criar Conta"}
            </motion.button>
          </form>
          <p className="text-center text-sm text-white/20 mt-6">
            Já tem conta?{" "}
            <Link to="/login" className="text-[#f5c842] font-semibold hover:text-yellow-300 transition">Entrar</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}