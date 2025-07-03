import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthContext } from './Auth-Context';
import { useAccountManagerContext } from './Account-Manager-Context';
import { useSymbolContext } from './Symbol-Context';

const MetricsContext = createContext();

export const MetricsProvider = ({ children }) => {
    //CONTEXT
    const { user, platFromData } = useAuthContext();
    const { openPositions } = useAccountManagerContext();
    const { setLoadingSymbolContext } = useSymbolContext();

    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(timezoneOffset / 60));
    const offsetMinutes = Math.abs(timezoneOffset % 60);
    const offsetSign = timezoneOffset > 0 ? '-' : '+';
    const utcOffsetInitial = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;

    const [utcOffset, setUTCOffset] = useState(localStorage.getItem('utc_time') ? localStorage.getItem('utc_time') :utcOffsetInitial );
    const [showDealsModal, setShowDealsModal] = useState(false);
    const [currentUTCDate, setCurrentUTCDate] = useState(new Date());

    const calculateMetrics = (onEffect, newMetrics, prevMetric) => {
        const totalDeposit = onEffect ? newMetrics.totalDeposit : prevMetric.totalDeposit;
        const totalWithdrawal = onEffect ? newMetrics.totalWithdrawal : prevMetric.totalWithdrawal;
        const totalRealizedPnL = onEffect ? newMetrics.totalRealizedPnL : prevMetric.totalRealizedPnL;
        const totalUnrealizedPnL = newMetrics.totalUnrealizedPnL ? newMetrics.totalUnrealizedPnL : 0;
        const todayRealizedPnL = newMetrics.todayRealizedPnL ? newMetrics.todayRealizedPnL : 0;
        const totalUnrealizedGrossPnL = newMetrics.totalUnrealizedGrossPnL ? newMetrics.totalUnrealizedGrossPnL : 0;
        const totalBonus = parseFloat(onEffect ? newMetrics.totalBonus : prevMetric.totalBonus);
        const totalMargin = parseFloat( onEffect ? newMetrics.totalMargin : newMetrics.totalMargin );
      // const totalMargin = openPositions?.reduce(
        //     (acc, position) => acc + (position.margin),
        //     0
        // );

        const estimatedClosingCommission = 0;

        const balance = (parseFloat(totalDeposit) - parseFloat(totalWithdrawal)) + parseFloat(totalRealizedPnL);
        const equity = parseFloat(totalUnrealizedPnL) + parseFloat(balance);

        const freeMargin = parseFloat(equity) - parseFloat(totalMargin);
        const marginLevel =
            (totalMargin == 0 ? 0 : (parseFloat(equity) - parseFloat(estimatedClosingCommission)) / parseFloat(totalMargin == 0 ? 1 : totalMargin)) * 100;

        return {
            totalDeposit,
            totalWithdrawal,
            totalRealizedPnL,
            totalUnrealizedPnL,
            todayRealizedPnL,
            totalUnrealizedGrossPnL,
            estimatedClosingCommission,
            balance,
            equity,
            totalMargin,
            freeMargin,
            marginLevel,
            totalBonus
        }
    };

    const [metrics, setMetrics] = useState({
        totalDeposit: 0,
        totalWithdrawal: 0,
        totalRealizedPnL: 0,
        totalUnrealizedPnL: 0,
        totalUnrealizedGrossPnL: 0,
        estimatedClosingCommission: 0,
        balance: 0,
        equity: 0,
        totalMargin: 0,
        freeMargin: 0,
        marginLevel: 0,
        totalBonus: 0,
        todayRealizedPnL: 0,
        userUnseenNotificationsCount: 0,
    });

    useEffect(() => {
        if (user && user.userId != undefined && user.userId > 0) {
            // const newMetrics = calculateMetrics(true, user, null);
          setMetrics(platFromData[5]);
            // setLoadingSymbolContext(false);
        }

        // console.log(platFromData[5]);
    }, [platFromData[5]]);

    const updateMetrics = (...newMetrics) => {
        setMetrics((...prevMetric) => {
            {
                return calculateMetrics(false, ...newMetrics, ...prevMetric);
            }
        });
    };

    const formatTime = (date) => {
        const day = date.getUTCDate().toString().padStart(2, '0');
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const year = date.getUTCFullYear();
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const seconds = date.getUTCSeconds().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
      };

    const contextValue = {
        metrics,
        updateMetrics,
        currentUTCDate, setCurrentUTCDate,
        utcOffset, setUTCOffset,formatTime,utcOffsetInitial,
        showDealsModal,
        setShowDealsModal
    };


  
    return (
        <MetricsContext.Provider value={contextValue}>
            {children}
        </MetricsContext.Provider>
    );
};

export const useMetricsContext = () => {
    const context = useContext(MetricsContext);
    if (!context) {
        throw new Error('useMetrics must be used within a MetricsProvider');
    }
    return context;
};
