import React, { useState } from 'react';

interface FinanceProps {
    balance: number;
    onAction: (action: string, data?: any) => void;
}

const Finance: React.FC<FinanceProps> = ({ balance, onAction }) => {
    const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
    const [amount, setAmount] = useState<string>('');

    const handleConfirm = () => {
        const val = Number(amount);
        if (!val || val <= 0) return;

        if (mode === 'withdraw' && val > balance) return; 

        onAction(`manage:${mode}`, { amount: val });
        setAmount('');
    };

    return (
        <div className="p-8 h-full flex flex-col max-w-2xl mx-auto">
             <div className="mb-8 text-center">
                 <h2 className="text-3xl font-bold text-primary mb-2">Financeiro</h2>
                 <p className="text-text-muted">Gerencie o saldo do seu posto</p>
             </div>

             <div className="bg-dashboard-card border border-border-color rounded-2xl overflow-hidden p-6 mb-8">
                 <div className="flex justify-between items-center mb-2">
                     <span className="text-sm font-bold text-text-muted uppercase tracking-wider">Saldo Atual</span>
                     <div className="p-2 rounded bg-orange-500/10 text-orange-500">
                         <span className="material-symbols-outlined">account_balance_wallet</span>
                     </div>
                 </div>
                 <h3 className="text-4xl font-bold text-primary tracking-tight">${balance.toLocaleString()}</h3>
             </div>

             <div className="flex bg-dashboard-element rounded-xl p-1 mb-6">
                 <button 
                    onClick={() => setMode('deposit')}
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${mode === 'deposit' ? 'bg-neon-green text-black shadow-lg shadow-neon-green/10' : 'text-text-muted hover:text-primary'}`}
                 >
                     Depositar
                 </button>
                 <button 
                    onClick={() => setMode('withdraw')}
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${mode === 'withdraw' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-text-muted hover:text-primary'}`}
                 >
                     Sacar
                 </button>
             </div>

             <div className="space-y-4">
                 <div>
                     <label className="block text-xs font-bold text-text-muted uppercase mb-2">Valor</label>
                     <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">$</span>
                         <input 
                            type="number" 
                            className="w-full bg-dashboard-element border border-border-color rounded-xl py-4 pl-8 pr-4 text-primary font-bold focus:outline-none focus:border-neon-green transition-colors"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                         />
                     </div>
                 </div>
                 
                 <button 
                    onClick={handleConfirm}
                    disabled={!amount || Number(amount) <= 0}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                        mode === 'deposit' 
                        ? 'bg-neon-green text-black hover:bg-neon-green/90 disabled:opacity-50' 
                        : 'bg-red-500 text-white hover:bg-red-600 disabled:opacity-50'
                    }`}
                 >
                     {mode === 'deposit' ? 'Confirmar Depósito' : 'Confirmar Saque'}
                 </button>
             </div>
        </div>
    );
};

export default Finance;
