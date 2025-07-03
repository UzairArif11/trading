import React from 'react';
import './Loader.scss'; // Import your stylesheet
import getBackendUrl, { getBackendPic } from '../RedirectUrl';

const Loader = () => {
  return (
    <div className="logo-loader">
      <div className="loader-container" style={{display: 'flex', justifyContent: 'center'}}>
        <img src={`${getBackendUrl()}/assets/admin/images/logo/${getBackendPic()}logo-full.png`} alt="logo" style={{maxWidth: '85%', height: 'auto'}} />
      </div>
    </div>
  );
};

export default Loader;
