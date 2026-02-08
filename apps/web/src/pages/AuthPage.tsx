import { useState } from 'react';
import { apiClient, setAuthToken } from '../lib/api';
import { Button, Input, Panel } from '../components/ui';

type User = { id: string; email: string; role: string; status: string; name?: string | null };

export function AuthPage({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-hangar-bg text-hangar-text flex items-center justify-center p-6">
      <Panel className="w-full max-w-md">
        <div className="text-lg font-semibold">Hangar</div>
        <div className="text-xs text-hangar-muted">Acesso seguro</div>
        <div className="mt-4 flex items-center gap-2 text-xs">
          <button
            className={`rounded-md border px-3 py-1 ${mode === 'login' ? 'border-hangar-cyan/60 text-hangar-cyan' : 'border-hangar-slate/40 text-hangar-muted'}`}
            onClick={() => setMode('login')}
          >
            Entrar
          </button>
          <button
            className={`rounded-md border px-3 py-1 ${mode === 'signup' ? 'border-hangar-cyan/60 text-hangar-cyan' : 'border-hangar-slate/40 text-hangar-muted'}`}
            onClick={() => setMode('signup')}
          >
            Cadastrar
          </button>
        </div>

        {mode === 'signup' && (
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="mt-4" />
        )}
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email corporativo" className="mt-3" />
        <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" type="password" className="mt-3" />

        {message && <div className="mt-3 text-xs text-hangar-muted">{message}</div>}

        <Button
          className="mt-4 w-full"
          onClick={async () => {
            setMessage(null);
            try {
              if (mode === 'signup') {
                const res = await apiClient.signup({ email, password, name });
                if (res.user.status === 'pending') {
                  setMessage('Cadastro realizado. Aguarde aprovação de um admin.');
                  setPassword('');
                  return;
                }
                setMessage('Cadastro realizado. Faça login.');
                setMode('login');
                return;
              }
              const res = await apiClient.login({ email, password });
              setAuthToken(res.token);
              onAuth(res.user);
            } catch (e: any) {
              setMessage(e.message || 'Erro ao autenticar');
            }
          }}
        >
          {mode === 'login' ? 'Entrar' : 'Cadastrar'}
        </Button>
      </Panel>
    </div>
  );
}
