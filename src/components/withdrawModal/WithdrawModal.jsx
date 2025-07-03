import React, { useState } from 'react'
import { Ripple } from 'react-ripple-click'
import Select from 'react-select';
import './withdraw.scss';
import { toast } from "react-toastify";
import { useAccountManagerContext } from '../../contexts/Account-Manager-Context';
import { API_ENDPOINT_MAKE_WITHDRAW } from '../../data/Endpoints-API';
import APIMiddleware from '../../data/api/Api-Middleware';
import { useAuthContext } from '../../contexts/Auth-Context';
import { useChartContext } from '../../contexts/Chart-Context';
import Spinner from '../spinner/Spinner';

const WithdrawModal = () => {

    const options = [
        { value: "btc", label: "BTC" },
        { value: "ltc", label: "LTC" }
    ];
    const customStyle = {
        control: (provided, state) => ({
            ...provided,
            minHeight: '27px !important',
            width: '150px',
            borderColor: '#484848 !important',
            backgroundColor: '#2d2d2d  !important',
            boxShadow: state.isFocused
                ? '0 0 50px #484848 !important'
                : provided.boxShadow,
            cursor: 'pointer',
            '&:hover': {
                borderColor: `${selectedStyle.buyColor} !important`,
                cursor: 'pointer',
                boxShadow: '0 0 0 transparent !important',
            },
        }),
        singleValue: (provided, state) => ({
            ...provided,
            paddingLeft: '10px !important',
            borderColor: state.isFocused
                ? `${selectedStyle.buyColor} !important`
                : '#484848 !important',
            color: '#c5c5c5 !important',
        }),
        option: (provided, state, inSettings = true) => ({
            ...provided,
            padding: inSettings ? '0.3rem !important' : '0 !important',
            cursor: 'pointer',
            color: state.isSelected
                ? `${selectedStyle.buyColor} !important`
                : '#c5c5c5 !important',
            borderBottom: '1px solid #232323',
            backgroundColor: state.isSelected ? '#232323 !important' : 'transparent',
            '&:hover': {
                backgroundColor: `${selectedStyle.buyColor} !important`,
                color: '#2d2d2d !important',
            },
            '&:nth-last-child(1)': {
                borderBottom: 'none !important',
            },
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: '#3b3a3a !important',
            margin: '0.3rem 0.8rem 0 0.8rem !important',
            zIndex: 111,
            left: '-10px'
        }),
        menuList: (provided) => ({
            ...provided,
            maxHeight: '100px', // Reduced height
            minHeight: '3px',
            width: '150px', // Ensures the menu list width matches the menu container
            overflowY: 'auto',
        }),
    };
    const { setShowWithdraw } = useAccountManagerContext();
    const { user } = useAuthContext();
    const { selectedStyle } = useChartContext();
    const [amount, setAmount] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [selectedOption, setSelectedOption] = useState(options[0]);
    const [loading, setLoading] = useState(false)
    const changehandlefunction = (selectedOption) => {
        setSelectedOption(selectedOption);
    }
    const handleSubmit = async () => {

        const errors = [];

        if (!amount) {
            errors.push("Amount is required");
        }

        if (!selectedOption) {
            errors.push("Wallet Type is required");
        }

        if (!walletAddress) {
            errors.push("Wallet Address is required");
        }

        if (errors.length > 0) {
            errors.forEach((error) => {
                toast.error(error, {
                    position: "top-right",
                });
            });
        } else {
            try {
                setLoading(true);
                let payload = { amount: amount, address: walletAddress, coin: selectedOption.value, user_detail_id: user.userId };

                const response = await APIMiddleware.post(API_ENDPOINT_MAKE_WITHDRAW(), payload);

                toast.success(response.message || "Withdraw request submitted successfully!", {
                    position: "top-right",
                });

                setShowWithdraw(false);
            } catch (error) {
                console.log(error?.response?.data?.errors, "error?.response?.status");
                if (error?.response?.status === 422 && error?.response?.data?.errors) {
                    const allErrorMessages = Object.keys(error.response.data.errors)
                        .filter(key => Array.isArray(error.response.data.errors[key]))
                        .map(key => error.response.data.errors[key].join(' '))
                        .join('\n');

                    if (allErrorMessages) {
                        toast.error(allErrorMessages, {
                            position: "top-right",
                        });
                    } else {
                        toast.error(error?.response?.data?.errors, {
                            position: "top-right",
                        });
                    }
                }
                else if (error?.response?.status === 400 && error?.response?.data?.errors?.message) {
                    toast.error(error?.response?.data?.errors?.message || "An unknown error occurred", {
                        position: "top-right",
                    });

                }
                else if (error?.response?.status === 400 && error?.response?.data?.message) {
                    toast.error(error.response.data.message || "An unknown error occurred", {
                        position: "top-right",
                    });
                }
                else {
                    toast.error(error?.response?.data?.message || "An unknown error occurred", {
                        position: "top-right",
                    });
                }
            }
            finally {
                setLoading(false)
            }


        }
    };
    return (
        <div className="confirm-box-2" role='true'>
            <div className="card">
                <h2>
                    Make Withdraw Request
                </h2>

                <div className='input-div-1'>
                    <div>
                        <div className='mt-5 mb-5'>
                            <label className='text-color'>Enter Amount:</label>
                        </div>
                        <input
                            className={`amountInput`}
                            type="number"
                            onChange={(e) => {
                                setAmount(e.target.value)
                            }}
                            placeholder="Enter Amount"
                            value={amount}
                        />
                    </div>
                    <div>
                        <div className='mt-5 mb-5'>
                            <label className='text-color'>Select Wallet Type:</label>
                        </div>
                        <Select
                            options={options}
                            value={selectedOption}
                            onChange={changehandlefunction}
                            styles={customStyle}
                            isSearchable={false}
                            menuPortalTarget={document.body}
                        />
                    </div>
                </div>
                <div>
                    <div className='mx-35 my-15'>
                        <div className='mt-5 mb-5'>
                            <label className='text-color'>Enter Wallet Address:</label>
                        </div>
                        <input
                            className={`amountInput`}
                            type="text"
                            onChange={(e) => {
                                setWalletAddress(e.target.value)
                            }}
                            placeholder="Enter Wallet Address"
                            value={walletAddress}
                        />
                    </div>
                </div>
                <div className="row-scss">



                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{
                            position: "relative",
                            overflow: "hidden",
                            isolation: "isolate",
                            backgroundColor: selectedStyle.buyColor,
                        }}
                    >
                        <Ripple />
                        {loading ? <Spinner /> : "Submit"}
                    </button>
                    <div className="blank"></div>
                    <button
                        onClick={() => setShowWithdraw(false)}
                        style={{
                            position: 'relative',
                            overflow: 'hidden',
                            isolation: 'isolate',
                            backgroundColor: selectedStyle.sellColor,
                        }}
                    >
                        <Ripple />
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}

export default WithdrawModal