import { useState, useRef, useEffect } from 'react';
import { Player } from '../types/golf';
import PlayerIcon from './PlayerIcon';

interface PlayerSelectProps {
  players: Player[];
  selected?: string | null;
  onSelect: (playerId: string | null) => void;
}

const PlayerSelect = ({ players, selected, onSelect }: PlayerSelectProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [open]);

  const selectedPlayer = players.find((p) => p.id === selected);

  return (
    <div className="relative inline-block align-middle" ref={ref}>
      {selected === null ? (
        <div
          className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center cursor-pointer"
          onClick={() => setOpen(!open)}
        >
          <span className="text-lg font-bold">×</span>
        </div>
      ) : selectedPlayer ? (
        <PlayerIcon
          name={selectedPlayer.name}
          color={selectedPlayer.color}
          size={24}
          onClick={() => setOpen(!open)}
        />
      ) : (
        <div
          className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center cursor-pointer"
          onClick={() => setOpen(!open)}
        />
      )}
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-1 z-20 bg-white border border-gray-300 rounded shadow p-1 flex space-x-1">
          <div
            className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center cursor-pointer"
            onClick={() => {
              onSelect(null);
              setOpen(false);
            }}
          >
            <span className="text-lg font-bold">×</span>
          </div>
          {players.map((p) => (
            <PlayerIcon
              key={p.id}
              name={p.name}
              color={p.color}
              size={32}
              onClick={() => {
                onSelect(p.id);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayerSelect;
