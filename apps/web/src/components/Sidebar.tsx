import logoDark from '../assets/ic-hangar-dark.png';
import logoLight from '../assets/ic-hangar-light.png';
import type { ReactNode } from 'react';

export type NavItem = {
  key: string;
  label: string;
  icon: (props: { active?: boolean }) => ReactNode;
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
    { key: 'dashboard', label: 'Dashboard', icon: GaugeIcon },
    { key: 'metas', label: 'Metas', icon: TargetIcon },
    { key: 'tiers', label: 'Tiers', icon: LayerIcon },
    { key: 'clientes', label: 'Clientes', icon: UsersIcon },
    { key: 'projetos', label: 'Projetos', icon: FolderIcon },
    { key: 'impostos', label: 'Impostos', icon: ReceiptIcon },
    { key: 'registros', label: 'Registros', icon: TableIcon }
  ];

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/40 transition md:hidden ${open ? 'block' : 'hidden'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed z-40 flex h-full w-64 flex-col gap-6 border-r border-hangar-slate/20 bg-hangar-panel/95 px-5 py-6 transition md:static md:translate-x-0 ${
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

      <nav className="flex flex-1 flex-col gap-1.5">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              onSelect(item.key);
              onClose();
            }}
            className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition ${
              active === item.key
                ? 'bg-hangar-accent text-white shadow-sm'
                : 'text-hangar-muted hover:bg-hangar-surface hover:text-hangar-text'
            }`}
          >
            <item.icon active={active === item.key} />
            <span>{item.label}</span>
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

function iconClass(active?: boolean) {
  return active ? 'h-4 w-4 text-white' : 'h-4 w-4 text-hangar-muted group-hover:text-hangar-text';
}

function GaugeIcon({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 512 512" className={iconClass(active)} aria-hidden="true">
      <path fill="currentColor" d="M256 64a192 192 0 1 0 192 192c0-106-86-192-192-192zm0 336a144 144 0 1 1 0-288 144 144 0 1 1 0 288zm95.8-220.2l-76 56.9c-3.8 2.8-8.2 4.6-12.8 5.2l-57.4 8.2c-11.5 1.6-21.8-6.7-23.4-18.2s6.7-21.8 18.2-23.4l49.3-7 68.7-51.5c9.4-7 22.7-5.1 29.7 4.2s5.1 22.7-4.2 29.7z" />
    </svg>
  );
}

function TargetIcon({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 512 512" className={iconClass(active)} aria-hidden="true">
      <path fill="currentColor" d="M256 48c114.9 0 208 93.1 208 208S370.9 464 256 464 48 370.9 48 256 141.1 48 256 48zm0 64a144 144 0 1 0 0 288 144 144 0 1 0 0-288zm0 80a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" />
    </svg>
  );
}

function LayerIcon({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 576 512" className={iconClass(active)} aria-hidden="true">
      <path fill="currentColor" d="M256.5 32.8c20.1-10.7 43.8-10.7 63.9 0l192 102.4c19.2 10.2 19.2 37.7 0 47.9l-192 102.4c-20.1 10.7-43.8 10.7-63.9 0l-192-102.4c-19.2-10.2-19.2-37.7 0-47.9l192-102.4zM64.5 248.8l160 85.3c40.2 21.4 87.8 21.4 128 0l160-85.3c9.8 5.6 15.5 15.6 15.5 26.8 0 10.8-5.2 20.9-14.1 27l-161.4 110.4c-40.4 27.6-93.6 27.6-134 0L78.1 302.6c-8.9-6.1-14.1-16.2-14.1-27 0-11.2 5.8-21.2 15.5-26.8z" />
    </svg>
  );
}

function UsersIcon({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 640 512" className={iconClass(active)} aria-hidden="true">
      <path fill="currentColor" d="M96 224a96 96 0 1 0 0-192 96 96 0 1 0 0 192zm448 0a96 96 0 1 0 0-192 96 96 0 1 0 0 192zM32 480c0-88.4 71.6-160 160-160h64c5.4 0 10.7 .3 16 .8-34.3 26.1-56 67.4-56 113.7V480H32zm288 0v-45.5c0-70.2 57-127.2 127.2-127.2h25.5C551 307.3 608 364.3 608 434.5V480H320z" />
    </svg>
  );
}

function FolderIcon({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 576 512" className={iconClass(active)} aria-hidden="true">
      <path fill="currentColor" d="M64 96c0-17.7 14.3-32 32-32h160l64 64h160c17.7 0 32 14.3 32 32v32H64V96zm-32 96h512v224c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V192z" />
    </svg>
  );
}

function ReceiptIcon({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 384 512" className={iconClass(active)} aria-hidden="true">
      <path fill="currentColor" d="M320 0H64C46.3 0 32 14.3 32 32v448c0 11.5 12.9 18.2 22.2 11.5L96 464l41.8 27.5c6.7 4.4 15.5 4.4 22.2 0L192 464l31.8 27.5c6.7 4.4 15.5 4.4 22.2 0L288 464l41.8 27.5c9.3 6.7 22.2 0 22.2-11.5V32c0-17.7-14.3-32-32-32zM112 128h160c8.8 0 16 7.2 16 16s-7.2 16-16 16H112c-8.8 0-16-7.2-16-16s7.2-16 16-16zm160 224H112c-8.8 0-16-7.2-16-16s7.2-16 16-16h160c8.8 0 16 7.2 16 16s-7.2 16-16 16zm0-96H112c-8.8 0-16-7.2-16-16s7.2-16 16-16h160c8.8 0 16 7.2 16 16s-7.2 16-16 16z" />
    </svg>
  );
}

function TableIcon({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 512 512" className={iconClass(active)} aria-hidden="true">
      <path fill="currentColor" d="M64 64C28.7 64 0 92.7 0 128V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64H64zm384 96v80H272V160H448zM240 160v80H64V160H240zM64 272H240v80H64V272zm208 80V272H448v80H272z" />
    </svg>
  );
}
