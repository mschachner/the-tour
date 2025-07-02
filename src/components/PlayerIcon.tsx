
interface PlayerIconProps {
  name: string;
  color?: string;
  size?: number;
}

const PlayerIcon = ({ name, color = '#ccc', size = 24 }: PlayerIconProps) => {
  const initial = name ? name.charAt(0).toUpperCase() : '';
  return (
    <div
      style={{ backgroundColor: color, width: size, height: size }}
      className="rounded-full flex items-center justify-center text-white font-bold"
    >
      {initial}
    </div>
  );
};

export default PlayerIcon;
