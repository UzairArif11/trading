import React, { useEffect, useState } from 'react';
import { useMetricsContext } from '../../../contexts/Metrics-Context';
import { useAuthContext } from "../../../contexts/Auth-Context";
import { useChartContext } from '../../../contexts/Chart-Context';
import { TbInfoOctagonFilled } from "react-icons/tb";
import './Metrics-Panel.scss';
import { useSymbolContext } from '../../../contexts/Symbol-Context';
import { API_ENDPOINT_USER_DETAILS } from '../../../data/Endpoints-API';
import APIMiddleware from '../../../data/api/Api-Middleware';

const MetricsPanel = ({ mobileMode = false }) => {
    const { metrics } = useMetricsContext();
    const { user } = useAuthContext();
    const { selectedStyle } = useChartContext();
    const { symbolInfo ,fetchUserDetails2} = useSymbolContext();
    const [stopOut, setStopOut] = useState(null);
    const [totalDeposit, setTotalDeposit] = useState(null); 
    const [totalCommission, setTotalCommission] = useState(null);

    // Fetch user details to get stop_out value
    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const response = await APIMiddleware.post(API_ENDPOINT_USER_DETAILS());
                if (response?.data?.[0]?.stop_out && response?.data?.[0]?.totalDeposit && response?.data?.[0]?.totalCommission !== undefined) {
                    setStopOut(response.data[0].stop_out);
                    setTotalDeposit(Number(response.data[0].totalDeposit));
                    setTotalCommission(Number(response.data[0].totalCommission));
                }
            } catch (error) {
                console.error("Error fetching user details:", error);
            }
        };
        fetchUserDetails();
    }, [fetchUserDetails2]);

    const isValidNumber = (value) => typeof value === 'number' && !isNaN(value);

    // Calculate all metric values
    const balance = `${isValidNumber(metrics?.balance) ? metrics.balance.toFixed(2) : 'N/A'} ${user?.userCurrencyName || 'EUR'}`;
    const equity = `${isValidNumber(metrics?.equity) ? `${metrics.equity.toFixed(2)} ${user?.userCurrencyName || 'EUR'}` : 'N/A'}`;
    const margin = `${isValidNumber(metrics?.totalMargin) ? `${metrics.totalMargin.toFixed(2)} ${user?.userCurrencyName || 'EUR'}` : 'N/A'}`;
    const freeMargin = `${isValidNumber(metrics?.freeMargin) ? `${metrics.freeMargin.toFixed(2)} ${user?.userCurrencyName || 'EUR'}` : 'N/A'}`;
    const bonus = `${isValidNumber(metrics?.totalBonus) ? `${metrics.totalBonus.toFixed(2)} ${user?.userCurrencyName || 'EUR'}` : 'N/A'}`;
    const marginLevel = `${isValidNumber(metrics?.marginLevel) ? `${metrics.marginLevel.toFixed(2)} %` : 'N/A'}`;
    const netPnl = `${isValidNumber(metrics?.totalUnrealizedPnL) ? `${metrics.totalUnrealizedPnL.toFixed(2)} ${user?.userCurrencyName || 'EUR'}` : 'N/A'}`;
    const rlPnl = `${isValidNumber(metrics?.todayRealizedPnL) ? `${metrics.todayRealizedPnL.toFixed(2)} ${user?.userCurrencyName || 'EUR'}` : 'N/A'}`;
    const grossPnl = `${isValidNumber(metrics?.totalUnrealizedGrossPnL) ? `${metrics.totalUnrealizedGrossPnL.toFixed(2)} ${user?.userCurrencyName || 'EUR'}` : 'N/A'}`;
    const stopOutValue = stopOut !== null ? `${stopOut.toFixed(2)} %` : 'N/A';
    const totalDepositValue = totalDeposit !== null 
    ? `${Number(totalDeposit).toFixed(2)} ${user?.userCurrencyName || 'EUR'}`
    : 'N/A';
    const totalCommissionValue = totalCommission !== null 
    ? `${Number(totalCommission).toFixed(2)} ${user?.userCurrencyName || 'EUR'}`
    : 'N/A';

    if (mobileMode) {
        // Mobile view implementation (2-column layout)
        return (
            <div className="metrics-panel mobile">
                <ul className="metrics-list">
                    <span className='mobile-view-style'>
                        <li className='metricsData'>
                            <strong className='multiline-truncate' title='Balance = deposits - withdrawals + total realised net profit and loss'>
                                <i><TbInfoOctagonFilled /></i> Profit
                            </strong>
                            <span className='multiline-truncate'
                            style={{
                                color: parseFloat(metrics?.todayRealizedPnL) >= 0
                                ? selectedStyle.buyColor
                                : selectedStyle.sellColor
                            }} 
                            title={rlPnl}>{rlPnl}</span>
                        </li>
                        <li className='metricsData'>
                            <strong className='multiline-truncate' title='Equity = balance + unrealised net profit and loss'>
                                <i><TbInfoOctagonFilled /></i> Deposit
                            </strong>
                            <span className='multiline-truncate' title={totalDepositValue}>{totalDepositValue}</span>
                        </li>
                    </span>

                    <span className='mobile-view-style'>
                        <li className='metricsData'>
                            <strong className='multiline-truncate' title='A margin sum of all open positions'>
                                <i><TbInfoOctagonFilled /></i> Commission
                            </strong>
                            <span className='multiline-truncate' title={totalCommission}>{totalCommission}</span>
                        </li>
                        <li className='metricsData'>
                            <strong className='multiline-truncate' title='Free margin = equity - margin used'>
                                <i><TbInfoOctagonFilled /></i> Balance
                            </strong>
                            <span className='multiline-truncate' title={balance}>{balance}</span>
                        </li>
                    </span>

                    <span className='mobile-view-style'>
                        <li className='metricsData'>
                            <strong className='multiline-truncate' title='Margin level percentage'>
                                <i><TbInfoOctagonFilled /></i> Margin
                            </strong>
                            <span className='multiline-truncate' title={margin}>{margin}</span>
                        </li>
                        <li className='metricsData'>
                            <strong className='multiline-truncate' title='Today realised net profit and loss'>
                                <i><TbInfoOctagonFilled /></i> Free Margin
                            </strong>
                            <span className='multiline-truncate' title={freeMargin}>
                                {freeMargin}
                            </span>
                        </li>
                    </span>

                    <span className='mobile-view-style'>
                        <li className='metricsData'>
                            <strong className='multiline-truncate' title='Unrealised net profit and loss'>
                                <i><TbInfoOctagonFilled /></i> Margin Level
                            </strong>
                            <span className='multiline-truncate' title={marginLevel}>
                                {marginLevel}
                            </span>
                        </li>
                    </span>

                    {/* {symbolInfo?.show_stop_out_details && (
                        <span className='mobile-view-style bottom-view'>
                            <li className='metricsData stop_out'>
                                <strong className='multiline-truncate' title='Stop Out Level'>
                                    <i><TbInfoOctagonFilled /></i> Stop Out
                                </strong>
                                <span>{stopOutValue}</span>
                            </li>
                        </span>
                    )} */}

                    <span className='mobile-view-style'>
                        <li className='metricsData'>
                            <strong className='multiline-truncate' title='Unrealised net profit and loss'>
                                <i><TbInfoOctagonFilled /></i> UnR Net PNL
                            </strong>
                            <span
                                style={{
                                    color: parseFloat(metrics?.totalUnrealizedPnL) >= 0
                                        ? selectedStyle.buyColor
                                        : selectedStyle.sellColor
                                }}
                                className='multiline-truncate'
                                title={netPnl}
                            >
                                {netPnl}
                            </span>
                        </li>
                    </span>
                </ul>
            </div>
        );
    }

    // Desktop view implementation (horizontal scrolling)
    return (
        <div className="metrics-panel global-platfrom-dd">
            <div className="metrics-scroll-container">
                <ul className="metrics-list">
                    <li className='metric-item'>
                        <div className="metric-content">
                            <strong className='metric-title' title='Balance = deposits - withdrawals + total realised net profit and loss'>
                                <i><TbInfoOctagonFilled /></i> Balance
                            </strong>
                            <span className='metric-value' title={balance}>{balance}</span>
                        </div>
                    </li>
                    <li className='metric-item'>
                        <div className="metric-content">
                            <strong className='metric-title' title='Equity = balance + unrealised net profit and loss'>
                                <i><TbInfoOctagonFilled /></i> Equity
                            </strong>
                            <span className='metric-value' title={equity}>{equity}</span>
                        </div>
                    </li>
                    <li className='metric-item'>
                        <div className="metric-content">
                            <strong className='metric-title' title='A margin sum of all open positions'>
                                <i><TbInfoOctagonFilled /></i> Margin
                            </strong>
                            <span className='metric-value' title={margin}>{margin}</span>
                        </div>
                    </li>
                    <li className='metric-item'>
                        <div className="metric-content">
                            <strong className='metric-title' title='Free margin = equity - margin used'>
                                <i><TbInfoOctagonFilled /></i> Free Margin
                            </strong>
                            <span className='metric-value' title={freeMargin}>{freeMargin}</span>
                        </div>
                    </li>
                    <li className='metric-item'>
                        <div className="metric-content">
                            <strong className='metric-title' title="User's Bonus">
                                <i><TbInfoOctagonFilled /></i> Bonus
                            </strong>
                            <span className='metric-value' title={bonus}>{bonus}</span>
                        </div>
                    </li>
                    <li className='metric-item'>
                        <div className="metric-content">
                            <strong className='metric-title' title='Margin level percentage'>
                                <i><TbInfoOctagonFilled /></i> Margin Level
                            </strong>
                            <span className='metric-value' title={marginLevel}>{marginLevel}</span>
                        </div>
                    </li>
                    <li className='metric-item'>
                        <div className="metric-content">
                            <strong className='metric-title' title='Today realised net profit and loss'>
                                <i><TbInfoOctagonFilled /></i> Today's RL PNL
                            </strong>
                            <span 
                                className='metric-value'
                                title={rlPnl}
                                style={{
                                    color: parseFloat(metrics?.todayRealizedPnL) >= 0
                                        ? selectedStyle.buyColor
                                        : selectedStyle.sellColor
                                }}
                            >
                                {rlPnl}
                            </span>
                        </div>
                    </li>
                    <li className='metric-item'>
                        <div className="metric-content">
                            <strong className='metric-title' title='Unrealised net profit and loss'>
                                <i><TbInfoOctagonFilled /></i> UnR Net PNL
                            </strong>
                            <span 
                                className='metric-value'
                                title={netPnl}
                                style={{
                                    color: parseFloat(metrics?.totalUnrealizedPnL) >= 0
                                        ? selectedStyle.buyColor
                                        : selectedStyle.sellColor
                                }}
                            >
                                {netPnl}
                            </span>
                        </div>
                    </li>
                    {symbolInfo?.show_stop_out_details ? (
                        <li className='metric-item stop_out'>
                            <div className="metric-content">
                                <strong className='metric-title' title='Stop Out Level'>
                                    <i><TbInfoOctagonFilled /></i> Stop Out
                                </strong>
                                <span className='metric-value'>{stopOutValue}</span>
                            </div>
                        </li>
                    ) : null }
                </ul>
            </div>
        </div>
    );
};

export default MetricsPanel;