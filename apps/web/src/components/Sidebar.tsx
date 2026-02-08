import logoDark from '../assets/ic-hangar-dark.png';
import logoLight from '../assets/ic-hangar-light.png';

export type NavItem = {
  key: string;
  label: string;
};

export function Sidebar({
  active,
  onSelect,
  open,
  onClose
}: {
  active: string;
  onSelect: (key: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  const items: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'metas', label: 'Metas' },
    { key: 'tiers', label: 'Tiers' },
    { key: 'clientes', label: 'Clientes' },
    { key: 'projetos', label: 'Projetos' },
    { key: 'impostos', label: 'Impostos' },
    { key: 'registros', label: 'Registros' }
  ];

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/40 transition md:hidden ${open ? 'block' : 'hidden'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed z-40 flex h-full w-64 flex-col gap-6 border-r border-hangar-slate/30 bg-hangar-panel px-5 py-6 transition md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      <div className="flex items-center gap-3">
        <img src={logoLight} alt="Hangar" className="h-10 w-10 dark:hidden" />
        <img src={logoDark} alt="Hangar" className="hidden h-10 w-10 dark:block" />
        <div>
          <div className="text-lg font-semibold tracking-wide">Hangar</div>
          <div className="text-xs text-hangar-muted">Portfolio Control</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              onSelect(item.key);
              onClose();
            }}
            className={`rounded-md px-3 py-2 text-left text-sm transition ${
              active === item.key
                ? 'bg-hangar-accent text-white shadow-sm'
                : 'text-hangar-muted hover:bg-hangar-surface hover:text-hangar-text'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="rounded-md border border-hangar-slate/40 bg-hangar-surface p-3 text-xs text-hangar-muted">
        MVP • v0.1
      </div>
    </aside>
    </>
  );
}
