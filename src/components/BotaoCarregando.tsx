import React from 'react';

interface BotaoProps {
  isLoading: boolean;
  textoNormal: string;
  onClick?: () => void;
}

export const BotaoCarregando: React.FC<BotaoProps> = ({ isLoading, textoNormal, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`w-full py-2 px-4 rounded font-bold text-white transition-all ${
        isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
      }`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Enviando...</span>
        </div>
      ) : (
        <span>{textoNormal}</span>
      )}
    </button>
  );
};
