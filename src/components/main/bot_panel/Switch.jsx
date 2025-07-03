import React, { useState } from 'react';
import styles from './Switch.module.scss';
import { useAuthContext } from '../../../contexts/Auth-Context';
 
function Switch({subscribed, isChecked, handleToggle}) {
    const {  platFromData} =
    useAuthContext();
    return (
        <div className={`${styles.switch} ${!subscribed ? styles.unsubSwitch : ''}`}>
            <span>
                <input
                    type="checkbox"
                    id="toggleInput"
                    checked={isChecked}
                />
                <button
                    className={styles.slider}
                    type="button"
                    disabled={platFromData[5]?.accessRight == 3|| localStorage.getItem('accountType') =="0"||platFromData[5]?.accessRight == 2} 
                    onClick={() => handleToggle(!isChecked)}
                >
                </button>
            </span>
        </div>
    );
}

export default Switch;
