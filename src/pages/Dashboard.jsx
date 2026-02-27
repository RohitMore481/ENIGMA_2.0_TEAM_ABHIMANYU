import React from 'react';
import Navbar from '../components/panels/Navbar';
import Sidebar from '../components/panels/Sidebar';
import AnalyticsPanel from '../components/dashboard/AnalyticsPanel';
import MapView from '../components/map/MapContainer';
import Reports from './Reports';
import FieldComparisonPanel from '../components/dashboard/FieldComparisonPanel';
import { useAppContext } from '../context/AppContext';

const Dashboard = () => {

    const {
        isReportsOpen,
        isComparisonOpen
    } = useAppContext();

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-50 relative">

            {/* Top Navigation */}
            <Navbar />

            {/* Main Dashboard View */}
            <div className="flex-1 flex overflow-hidden relative w-full h-full">

                {/* Left Sidebar */}
                <Sidebar />

                {/* Map Area */}
                <div className="flex-1 relative z-0 h-full w-full">
                    <MapView />
                </div>

                {/* Right Analytics Panel */}
                <AnalyticsPanel />
            </div>

            {/* Reports Overlay */}
            {isReportsOpen && (
                <div className="absolute top-16 left-0 right-0 bottom-0 z-30 bg-slate-50 shadow-2xl overflow-hidden flex flex-col">
                    <Reports />
                </div>
            )}

            {/* 🔥 Field Comparison Overlay */}
            {isComparisonOpen && (
                <FieldComparisonPanel />
            )}

        </div>
    );
};

export default Dashboard;