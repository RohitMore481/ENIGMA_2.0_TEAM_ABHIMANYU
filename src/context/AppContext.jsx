import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {

    const [state, setState] = useState({
        user: null,

        // 🔹 Field Management
        fields: [],                 // All dynamic drawn fields
        selectedFields: [],

        // 🔹 AI Results
        stressResults: {
            summary: null,
            prediction: null,   
            fields: {}
        },

        // 🔹 Reports
        reports: [],

        // 🔹 Analysis Controls
        analysisType: 'Combined',
        isOverlayVisible: true,
        loadingState: false,

        // 🔹 UI Controls
        isReportsOpen: false
    });

    // -----------------------------
    // Generic Safe Setter Helper
    // -----------------------------
    const updateState = (key, value) => {
        setState(prev => ({
            ...prev,
            [key]: typeof value === 'function' ? value(prev[key]) : value
        }));
    };

    return (
        <AppContext.Provider value={{
            ...state,

            // 🔹 User
            setUser: (user) => updateState('user', user),

            // 🔹 Fields
            setFields: (fields) => updateState('fields', fields),
            setSelectedFields: (fields) => updateState('selectedFields', fields),

            // 🔹 AI
            setStressResults: (results) => updateState('stressResults', results),
            setLoadingState: (loading) => updateState('loadingState', loading),

            // 🔹 Reports
            setReports: (reports) => updateState('reports', reports),

            // 🔹 Controls
            setAnalysisType: (type) => updateState('analysisType', type),
            setIsOverlayVisible: (visible) => updateState('isOverlayVisible', visible),
            setIsReportsOpen: (open) => updateState('isReportsOpen', open)
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};