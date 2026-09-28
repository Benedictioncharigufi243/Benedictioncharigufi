import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { api, imgSrc } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useContent } from "@/hooks/useContent";
import { Monogram } from "@/components/Nav";
import { PageLoader } from "@/components/Reveal";
import { ActingForm } from "@/components/admin/ActingForm";
import { ScenarioForm } from "@/components/admin/ScenarioForm";

const Login = () => {
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data);
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === "string" ? d : "Connexion impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 pt-16">
      <form
        data-testid="admin-login-form"
        onSubmit={submit}
        className="w-full max-w-sm border border-white/10 bg-coal p-8 space-y-6"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <Monogram />
          <div>
            <h1 className="font-serif text-2xl">Administration</h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">Acc&egrave;s r&eacute;serv&eacute;</p>
          </div>
        </div>
        <input
          data-testid="admin-login-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full bg-smoke border border-white/10 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-gold/60 outline-none transition-colors"
        />
        <input
          data-testid="admin-login-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          className="w-full bg-smoke border border-white/10 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-gold/60 outline-none transition-colors"
        />
        {error && (
          <p data-testid="admin-login-error" className="text-sm text-red-400">
            {error}
          </p>
        )}
        <button
          data-testid="admin-login-submit"
          type="submit"
          disabled={busy}
          className="w-full bg-gold text-black py-3 font-mono text-xs uppercase tracking-[0.25em] hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {busy ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
};

const TabButton = ({ active, onClick, children, testId }) => (
  <button
    data-testid={testId}
    onClick={onClick}
    className={`px-6 py-3 font-mono text-[11px] uppercase tracking-[0.25em] border-b-2 transition-colors ${
      active ? "border-gold text-gold" : "border-transparent text-zinc-500 hover:text-white"
    }`}
  >
    {children}
  </button>
);

export default function Admin() {
  const { user, logout } = useAuth();
  const content = useContent();
  const [tab, setTab] = useState("acting");
  const [scenarios, setScenarios] = useState([]);
  const [editing, setEditing] = useState(null);

  const loadScenarios = () =>
    api
      .get("/scenarios")
      .then((r) => setScenarios(r.data))
      .catch(() => {});

  useEffect(() => {
    if (user) loadScenarios();
  }, [user]);

  if (user === null || (user && !content)) return <PageLoader />;
  if (!user) return <Login />;

  const remove = async (id) => {
    if (!window.confirm("Supprimer définitivement ce scénario ?")) return;
    try {
      await api.delete(`/scenarios/${id}`);
      toast.success("Scénario supprimé");
      loadScenarios();
    } catch {
      toast.error("Suppression impossible");
    }
  };

  return (
    <div data-testid="admin-dashboard" className="min-h-screen pt-28 pb-24 px-6 lg:px-12 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl">Administration</h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">{user.email}</p>
        </div>
        <button
          data-testid="admin-logout-button"
          onClick={logout}
          className="inline-flex items-center gap-2 border border-white/15 text-zinc-300 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] hover:border-gold hover:text-gold transition-colors"
        >
          <LogOut size={13} /> D&eacute;connexion
        </button>
      </div>

      <div className="border-b border-white/10 mb-12 flex">
        <TabButton active={tab === "acting"} onClick={() => setTab("acting")} testId="admin-tab-acting">
          Contenu acting
        </TabButton>
        <TabButton active={tab === "scenarios"} onClick={() => setTab("scenarios")} testId="admin-tab-scenarios">
          Sc&eacute;narios ({scenarios.length})
        </TabButton>
      </div>

      {tab === "acting" && <ActingForm content={content} />}

      {tab === "scenarios" && (
        <div className="space-y-8">
          {editing ? (
            <ScenarioForm
              initial={editing === "new" ? null : editing}
              onSaved={() => {
                setEditing(null);
                loadScenarios();
              }}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <>
              <button
                data-testid="admin-new-scenario"
                onClick={() => setEditing("new")}
                className="inline-flex items-center gap-2 bg-gold text-black px-6 py-3 font-mono text-xs uppercase tracking-[0.25em] hover:bg-gold-light transition-colors"
              >
                <Plus size={14} /> Nouveau sc&eacute;nario
              </button>
              <div className="space-y-3">
                {scenarios.map((s) => (
                  <div
                    key={s.id}
                    data-testid={`admin-scenario-row-${s.id}`}
                    className="flex items-center gap-5 border border-white/10 bg-coal p-4"
                  >
                    {s.poster ? (
                      <img src={imgSrc(s.poster)} alt="" className="w-14 h-14 object-cover border border-white/10 shrink-0" />
                    ) : (
                      <div className="w-14 h-14 border border-dashed border-white/15 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-lg text-white truncate">{s.title}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 truncate">
                        {s.genre} {s.format && `· ${s.format}`} {s.status && `· ${s.status}`}
                      </p>
                    </div>
                    <button
                      data-testid={`admin-scenario-edit-${s.id}`}
                      onClick={() => setEditing(s)}
                      className="text-zinc-400 hover:text-gold transition-colors p-2"
                      aria-label="Modifier"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      data-testid={`admin-scenario-delete-${s.id}`}
                      onClick={() => remove(s.id)}
                      className="text-zinc-400 hover:text-red-400 transition-colors p-2"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
