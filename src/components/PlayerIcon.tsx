
interface PlayerIconProps {
  name: string;
  color?: string;
  size?: number;
  onClick?: () => void;
}

const PlayerIcon = ({ name, color = '#ccc', size = 24, onClick }: PlayerIconProps) => {
  const initial = name ? name.charAt(0).toUpperCase() : '';
  return (
    <div
      style={{ backgroundColor: color, width: size, height: size }}
      className={`rounded-full flex items-center justify-center text-white font-bold ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      {initial}
    </div>
  );
};

export default PlayerIcon;
