import React, { useState } from 'react';

interface FuelManagementProps {
    stock: number;
    maxStock: number;
    price: number;
    reservePrice: number; // Cost to buy reserves
    onAction: (action: string, data?: any) => void;
}

const FuelManagement: React.FC<FuelManagementProps> = ({ stock, maxStock, price, reservePrice, onAction }) => {
    const [newPrice, setNewPrice] = useState<string>(price.toString());
    const [buyAmount, setBuyAmount] = useState<string>('');
    
    // Convert to numbers safely
    const currentPrice = Number(newPrice);
    const amountToBuy = Number(buyAmount);
    const totalCost = amountToBuy * reservePrice;
    
    // Quick add buttons
    const fillAmount = maxStock - stock;

    return (
        <div className="p-8 h-full flex flex-col gap-8 overflow-y-auto custom-scrollbar">
            
            {/* Header */}
            <div>
                 <h2 className="text-3xl font-bold text-primary mb-2">Combustível</h2>
                 <p className="text-text-muted">Gerencie estoque e preços</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Change Price Section */}
                <div className="bg-dashboard-card border border-border-color rounded-2xl p-6">
                     <div className="flex items-center gap-3 mb-6">
                         <div className="p-2 rounded bg-blue-500/10 text-blue-500">
                             <span className="material-symbols-outlined">sell</span>
                         </div>
                         <div>
                             <h3 className="text-lg font-bold text-primary">Preço de Venda</h3>
                             <p className="text-xs text-text-muted">Defina o valor por litro na bomba</p>
                         </div>
                     </div>

                     <div className="mb-6">
                         <label className="block text-xs font-bold text-text-muted uppercase mb-2">Novo Preço</label>
                         <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">$</span>
                             <input 
                                type="number" 
                                className="w-full bg-dashboard-element border border-border-color rounded-xl py-4 pl-8 pr-4 text-primary font-bold focus:outline-none focus:border-blue-500 transition-colors"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                             />
                         </div>
                     </div>

                     <button 
                         onClick={() => onAction('manage:changePrice', { price: currentPrice })}
                         className="w-full py-4 rounded-xl font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                     >
                         Atualizar Preço
                     </button>
                </div>

                {/* Buy Stock Section */}
                <div className="bg-dashboard-card border border-border-color rounded-2xl p-6">
                     <div className="flex items-center gap-3 mb-6">
                         <div className="p-2 rounded bg-red-500/10 text-red-500">
                             <span className="material-symbols-outlined">shopping_cart</span>
                         </div>
                         <div>
                             <h3 className="text-lg font-bold text-primary">Repor Estoque</h3>
                             <p className="text-xs text-text-muted">Custo: ${reservePrice.toFixed(2)} / litro</p>
                         </div>
                     </div>
                    
                     {/* Stock Progress */}
                     <div className="mb-6">
                         <div className="flex justify-between text-sm mb-2">
                             <span className="text-text-muted">Nível Atual</span>
                             <span className="text-primary font-bold">{stock} / {maxStock} L</span>
                         </div>
                         <div className="w-full h-2 bg-dashboard-element rounded-full overflow-hidden">
                             <div className="h-full bg-red-500 rounded-full" style={{ width: `${(stock/maxStock)*100}%` }}></div>
                         </div>
                     </div>

                     <div className="mb-4">
                         <label className="block text-xs font-bold text-text-muted uppercase mb-2">Quantidade para comprar</label>
                         <div className="flex gap-2 mb-2">
                              <input 
                                type="number" 
                                className="flex-1 bg-dashboard-element border border-border-color rounded-xl py-4 px-4 text-primary font-bold focus:outline-none focus:border-red-500 transition-colors"
                                placeholder="Quantidade em Litros"
                                value={buyAmount}
                                onChange={(e) => setBuyAmount(e.target.value)}
                             />
                             <button 
                                onClick={() => setBuyAmount(fillAmount.toString())}
                                className="px-4 bg-dashboard-element hover:bg-dashboard-element/80 text-primary font-bold rounded-xl border border-border-color transition-colors"
                             >
                                 Encher
                             </button>
                         </div>
                         <p className="text-xs text-right text-text-muted">Custo Total: <span className="text-primary font-bold">${totalCost.toLocaleString()}</span></p>
                     </div>

                     <button 
                         onClick={() => onAction('manage:buyStock', { amount: amountToBuy, price: totalCost })}
                         disabled={!amountToBuy || amountToBuy <= 0 || (stock + amountToBuy) > maxStock}
                         className="w-full py-4 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                         Comprar Estoque
                     </button>
                </div>
            </div>
        </div>
    );
};

export default FuelManagement;
