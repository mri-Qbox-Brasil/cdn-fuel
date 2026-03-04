import React, { useState } from 'react';
import Sidebar from './Sidebar';
import DashboardHome from './DashboardHome';
import Finance from './Finance';
import FuelManagement from './FuelManagement';
import Settings from './Settings';
import Analytics from './Analytics';
import { fetchNui } from '../../utils/nui';

interface ManagementData {
    balance: number;
    fuelStock: number;
    maxStock: number;
    fuelPrice: number;
    ownerName: string;
    stationName: string;
    reservePrice?: number; // Price to buy stock per liter
    isClosed?: boolean; // Station shutoff status
    logo?: string;
}

interface ManagementProps {
    data: ManagementData;
    onClose: () => void;
}

const Management: React.FC<ManagementProps> = ({ data, onClose }) => {
    const [activeTab, setActiveTab] = useState('dashboard');

    const handleAction = (action: string, payload?: any) => {
        // Map UI actions to NUI callbacks
        // action: 'changePrice' (from Dashboard quick action) -> Tab Switch
        // action: 'manage:changePrice' (from FuelManagement) -> NUI Call
        
        console.log(`Action: ${action}`, payload);

        if (action === 'changePrice' || action === 'buyStock') {
            setActiveTab('fuel');
            return;
        }

        if (action === 'rename') {
            setActiveTab('settings');
            return;
        }

        // Direct NUI Calls
        if (action.startsWith('manage:')) {
            fetchNui(action, payload);
            
            // Optimistic UI updates could go here, or we wait for close/refresh
            if (action === 'manage:close') {
                onClose();
            }
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
             <div className="w-full max-w-7xl h-[85vh] bg-dashboard-bg border border-border-color rounded-2xl flex overflow-hidden shadow-2xl relative">
                  
                  {/* Close Button Mobile / Overlay */}
                  <button onClick={onClose} className="absolute top-4 right-4 z-50 text-text-muted hover:text-white transition-colors">
                      <span className="material-symbols-outlined">close</span>
                  </button>

                  <Sidebar activeTab={activeTab} onTabChange={setActiveTab} stationName={data.stationName} logo={data.logo} />
                  
                   <div className="flex-1 h-full bg-dashboard-bg relative">
                        {activeTab === 'dashboard' && <DashboardHome data={data} />}
                        
                        {activeTab === 'analytics' && <Analytics />}
                        
                        {activeTab === 'finance' && (
                           <Finance balance={data.balance} onAction={handleAction} />
                       )}
                       
                       {activeTab === 'fuel' && (
                           <FuelManagement 
                                stock={data.fuelStock} 
                                maxStock={data.maxStock} 
                                price={data.fuelPrice} 
                                reservePrice={data.reservePrice || 2.0} // Fallback if not passed
                                onAction={handleAction} 
                           />
                       )}
                       
                       {activeTab === 'settings' && (
                           <Settings stationName={data.stationName} logo={data.logo} onAction={handleAction} />
                       )}

                       {activeTab === 'employees' && (
                           <div className="h-full flex flex-col items-center justify-center text-text-muted">
                               <span className="material-symbols-outlined text-6xl mb-4 opacity-20">group_off</span>
                               <p>Gestão de funcionários em breve.</p>
                           </div>
                       )}
                  </div>
             </div>
        </div>
    );
};

export default Management;
