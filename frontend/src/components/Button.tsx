export const Button = ({
  onClick,
  children,
  className = "",
  disabled = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden px-8 py-4 text-lg font-bold rounded-xl bg-[#4F7A5A] text-[#E8E5DC] transition-colors duration-200 hover:bg-[#5D8A67] active:bg-[#446B4F] shadow-[0_4px_12px_rgba(0,0,0,0.18)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4F7A5A] ${className}`}
    >
      <div className="relative flex items-center justify-center gap-2">
        {children}
      </div>
    </button>
  );
};
