import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

interface FuelSelectorProps {
  maxFuel: number;
  currentFuel: number;
  price: number;
  isJerryCan?: boolean;
  isElectric?: boolean;
  isSyphon?: boolean;
  isJerryCanRefuel?: boolean;
  syphonMode?: 'in' | 'out'; // 'in' = refuel car, 'out' = siphon from car
  onConfirm: (amount: number) => void;
  onClose: () => void;
}

const FuelSelector: React.FC<FuelSelectorProps> = ({ maxFuel, currentFuel, price, isJerryCan, isElectric, isSyphon, isJerryCanRefuel, syphonMode, onConfirm, onClose }) => {
  const [amount, setAmount] = useState<number>(0);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setAmount(maxFuel);
  }, [maxFuel]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(Number(e.target.value));
  };

  const getTitle = () => {
      if (isJerryCanRefuel) return 'Abastecendo com Galão';
      if (isSyphon) return syphonMode === 'out' ? 'Drenando Veículo' : 'Abastecendo Veículo';
      if (isJerryCan) return 'Quantidade';
      if (isElectric) return 'Carregamento';
      return 'Abastecimento';
  }

  const getSubtitle = () => {
      if (isJerryCanRefuel) return 'Quanto deseja colocar no veículo?';
      if (isSyphon) return syphonMode === 'out' ? 'Quanto deseja retirar?' : 'Quanto deseja colocar?';
      if (isJerryCan) return 'Quantos galões deseja comprar?';
      if (isElectric) return 'Defina a carga desejada';
      return 'Defina a quantidade de combustível';
  }

  return (
    <div className="flex w-full max-w-4xl bg-dashboard-bg border border-border-color rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
      
       {/* Sidebar / Decoration Left */}
       <div className="w-20 bg-dashboard-card border-r border-border-color flex flex-col items-center py-6 gap-6">
        <div className={`size-10 bg-dashboard-element rounded-lg flex items-center justify-center ${isElectric ? 'text-electric-yellow' : 'text-neon-green'}`}>
          <span className="material-symbols-outlined text-2xl">
              {isJerryCan ? 'propane_tank' : isElectric ? 'bolt' : isSyphon ? 'construction' : isJerryCanRefuel ? 'propane_tank' : 'local_gas_station'}
          </span>
        </div>
        
        <div className="flex-1 w-full px-4 flex flex-col gap-4">
               {/* Spacer */}
        </div>

        <button onClick={toggleTheme} className="size-10 rounded-lg hover:bg-dashboard-element text-text-muted hover:text-primary flex items-center justify-center transition-colors" title="Mudar Tema">
             <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>

        <button onClick={onClose} className="size-10 rounded-lg hover:bg-dashboard-element text-text-muted hover:text-primary flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

      <div className="flex-1 p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-2xl font-bold text-primary tracking-tight">
                    {getTitle()}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded ${isElectric ? 'bg-electric-yellow/10 text-electric-yellow' : 'bg-neon-green/10 text-neon-green'} text-xs font-bold uppercase tracking-wider`}>Passo 2 / 2</span>
                    <p className="text-text-muted text-sm">
                        {getSubtitle()}
                    </p>
                </div>
            </div>
            {!isSyphon && !isJerryCanRefuel && (
                <div className="flex items-center justify-center px-4 py-2 bg-dashboard-card rounded-lg border border-border-color">
                    <span className="text-primary font-bold text-lg">${Math.ceil(amount * price)}</span>
                    <span className="text-text-muted text-xs ml-2 uppercase font-bold tracking-wider">Total</span>
                </div>
            )}
             {/* Hide price for Syphon AND JerryCanRefuel */}
        </div>

        {/* Stats Cards */}
        <div className={`grid ${isJerryCan ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mb-6`}>
             <div className="bg-dashboard-card border border-border-color rounded-xl p-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <span className="material-symbols-outlined text-6xl text-primary">
                          {isJerryCan ? 'shopping_bag' : isElectric ? 'charging_station' : isSyphon && syphonMode === 'out' ? 'output' : 'water_drop'}
                      </span>
                  </div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      {isJerryCan ? 'Quantidade' : isElectric ? 'Energia Selecionada' : 'Volume Selecionado'}
                  </p>
                  <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-primary tracking-tighter">{amount}</span>
                      <span className={`text-sm font-medium ${isElectric ? 'text-electric-yellow' : 'text-neon-green'}`}>
                          {isJerryCan ? 'UNIDADES' : isElectric ? 'kWh' : 'LITROS'}
                      </span>
                  </div>
             </div>

             {!isJerryCan && (
             <div className="bg-dashboard-card border border-border-color rounded-xl p-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <span className="material-symbols-outlined text-6xl text-primary">
                          {isElectric ? 'battery_charging_full' : isSyphon ? 'local_gas_station' : isJerryCanRefuel ? 'local_gas_station' : 'ev_station'}
                      </span>
                  </div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      {isElectric ? 'Bateria Prevista' : 'Tanque Previsto'}
                  </p>
                  <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-primary tracking-tighter">{Math.min(100, Math.round(currentFuel + (isSyphon && syphonMode === 'out' ? -amount : amount)))}%</span>
                      <span className="text-sm font-medium text-text-muted">{isElectric ? 'CARREGADA' : 'CHEIO'}</span>
                  </div>
                  {/* Mini Progress */}
                  <div className="w-full bg-dashboard-bg h-1 rounded-full mt-3 overflow-hidden">
                       <div className={`h-full ${isElectric ? 'bg-electric-yellow' : 'bg-neon-green'} transition-all duration-300`} style={{ width: `${Math.min(100, Math.round(currentFuel + (isSyphon && syphonMode === 'out' ? -amount : amount)))}%` }}></div>
                  </div>
             </div>
             )}
        </div>

        {/* Slider Section */}
        <div className="flex-1 bg-dashboard-card border border-border-color rounded-xl p-6 flex flex-col justify-center gap-6">
             <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary uppercase tracking-wider">Ajuste Manual</span>
                  <span className="text-xs font-bold text-text-muted">
                      {amount} {isJerryCan ? 'UN' : isElectric ? 'kWh' : 'L'} / {maxFuel} {isJerryCan ? 'UN' : isElectric ? 'kWh' : 'L'}
                  </span>
             </div>

             <div className="relative h-8 w-full flex items-center">
                <input 
                  type="range" 
                  min="0" 
                  max={maxFuel} 
                  value={amount} 
                  onChange={handleSliderChange}
                  className={`w-full h-8 opacity-0 z-20 cursor-pointer absolute top-0 left-0`}
                />
                <div className="w-full h-2 bg-dashboard-bg rounded-lg relative z-10 pointer-events-none">
                     <div 
                        className={`h-full ${isElectric ? 'bg-electric-yellow' : 'bg-neon-green'} rounded-lg relative`} 
                        style={{ width: `${(amount / maxFuel) * 100}%` }}
                     >
                        <div className={`absolute right-0 top-1/2 -translate-y-1/2 size-9 bg-white rounded-full shadow-[0_0_20px_rgba(0,0,0,0.3)] translate-x-1/2 flex items-center justify-center border-2 ${isElectric ? 'border-electric-yellow' : 'border-neon-green'} transition-transform active:scale-95 cursor-grab active:cursor-grabbing`}>
                            <span className={`material-symbols-outlined text-xl ${isElectric ? 'text-electric-yellow' : 'text-neon-green'}`}>
                                {isElectric ? 'bolt' : 'local_gas_station'}
                            </span>
                        </div>
                     </div>
                </div>
             </div>
             
             <div className="flex justify-between gap-4">
                 <button onClick={() => setAmount(0)} className="flex-1 py-3 rounded-lg bg-dashboard-element hover:bg-dashboard-element/80 border border-border-color text-primary font-medium transition-colors text-sm">
                    Nivel Atual
                 </button>
                 <button onClick={() => setAmount(maxFuel)} className={`flex-1 py-3 rounded-lg ${isElectric ? 'bg-electric-yellow/10 text-electric-yellow hover:bg-electric-yellow/20' : 'bg-neon-green/10 text-neon-green hover:bg-neon-green/20'} border border-transparent font-bold transition-colors text-sm uppercase`}>
                    Completar
                 </button>
             </div>

             <button onClick={() => onConfirm(amount)} className={`w-full py-4 mt-auto rounded-xl ${isElectric ? 'bg-electric-yellow hover:bg-electric-yellow-hover' : 'bg-neon-green hover:bg-neon-green-hover'} text-white font-bold uppercase tracking-wider transition-all shadow-lg active:scale-[0.98]`}>
                {isJerryCan ? 'Comprar' : 'Confirmar'}
             </button>
        </div>
      </div>
    </div>
  );
};

export default FuelSelector;
