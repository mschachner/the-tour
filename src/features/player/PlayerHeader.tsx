import { useRef, useEffect, useState } from 'react';
import { Player } from '../../types/golf';
import PlayerIcon from './PlayerIcon';

interface PlayerHeaderProps {
  player: Player;
  iconSize: number;
  textClass: string;
}

const PlayerHeader = ({ player, iconSize, textClass }: PlayerHeaderProps) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      const el = spanRef.current;
      if (el) {
        setOverflow(el.scrollWidth > el.clientWidth);
      }
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [player.name]);

  return overflow ? (
    <div className="flex items-center justify-center">
      <PlayerIcon name={player.name} color={player.color} size={iconSize} />
    </div>
  ) : (
    <div className="flex items-center space-x-1 justify-center">
      <PlayerIcon name={player.name} color={player.color} size={iconSize} />
      <span ref={spanRef} className={`truncate ${textClass}`}>{player.name}</span>
    </div>
  );
};

export default PlayerHeader;
