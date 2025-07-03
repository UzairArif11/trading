import React, { useRef, useEffect } from 'react';
import './deposit.scss'
import { FaTimes } from 'react-icons/fa';
import { useAccountManagerContext } from '../../contexts/Account-Manager-Context';
import { toast } from "react-toastify";
const BankDetails = () => {
    const { setShowBank, bankDetails } = useAccountManagerContext();
    const { description } = bankDetails;
    const contentRef = useRef(null);

    useEffect(() => {
        const container = contentRef.current;
        container.addEventListener('click', handleCopy);

        return () => {
            container.removeEventListener('click', handleCopy);
        };
    }, []);


    const handleCopy = (event) => {
        if (event.target.innerText) {
            const text = event.target.innerText;
            navigator.clipboard.writeText(text)
                .then(() => {
                    toast.success(`${text} copied to clipboard!`, {
                        position: "top-right",
                    });
                }).catch(err => console.error('Failed to copy: ', err));
        }
    };
    const copyText = async () => {

        if (contentRef.current) {
            const textToCopy = contentRef.current.innerText;

            try {
                await navigator.clipboard.writeText(textToCopy);
                toast.success(`Details copied to clipboard!`, {
                    position: "top-right",
                });
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        }
    };
    return (
        <div className="dialog-modal-1" role={'true'}>
            <div className="card">
                <div className="model-header" style={{ borderBottom: '4px solid #232323' }} >
                    <h2>Bank Details</h2>
                    <button
                        onClick={() => {
                            setShowBank(false)
                        }}
                        className="close-icon"
                    >
                        <FaTimes />
                    </button>
                </div>
                <div className='m-20 p-20 text-color mt-15 pl-4 pb-0'>
                    <div style={{ cursor: "pointer" }} ref={contentRef} dangerouslySetInnerHTML={{ __html: description }} />
                </div>
                <div className='copy-div'>
                    <button className='copy-btn mr-15' onClick={copyText} >
                        📋 Copy
                    </button>
                </div>
            </div>
        </div>
    )
}

export default BankDetails