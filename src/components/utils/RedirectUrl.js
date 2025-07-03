const slugify = function (str) {
    return str
        .toString()
        .normalize('NFD')
              .replace(/^https?:\/\//, '') 
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function getBackendUrl() {
    let currentHost = window.location.hostname
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Check for localhost condition
  if (currentHost.includes('local')) {
    return 'http://localhost:8800';
  }

  // Clean and parse the backend URLs
  const sanitized = REACT_APP_BACKEND_URL
    .replace(/'/g, '"')
    .replace(/\s+/g, '');
  const rawUrls = JSON.parse(sanitized);

  // Extract domain after the first dot (e.g., 'dtrader.tech')
  const targetDomain = currentHost.split('.').slice(1).join('.');

  // Find matching backend URL
  const match = rawUrls.find(url => new URL(url).hostname.endsWith(targetDomain));

  // Return matched or fallback URL
  return match || rawUrls[0];
}

export function getBackendPic() {
    let currentHost = window.location.hostname
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Check for localhost condition
  if (currentHost.includes('local')) {
    return 'http://localhost:8000';
  }

  // Clean and parse the backend URLs
  const sanitized = REACT_APP_BACKEND_URL
    .replace(/'/g, '"')
    .replace(/\s+/g, '');
  const rawUrls = JSON.parse(sanitized);

  // Extract domain after the first dot (e.g., 'dtrader.tech')
  const targetDomain = currentHost.split('.').slice(1).join('.');

  // Find matching backend URL
  const match = rawUrls.find(url => new URL(url).hostname.endsWith(targetDomain));

  // Return matched or fallback URL
  const domain =match || rawUrls[0];
  return `${slugify(domain)}-`  ;
}

export function getBackendUrlPic() {
    let currentHost = window.location.hostname

  // Check for localhost condition
  if (currentHost.includes('local')) {
    return ""
  }

  // Extract domain after the first dot (e.g., 'dtrader.tech')
  const targetDomain = currentHost.split('.')[1];
  // Return matched or fallback URL
  return `${targetDomain}-`
}
function capitalizeSecondChar(str) {
  if (str.length < 2) return str.toUpperCase(); // fallback if string is too short
  return str[0] + str[1].toUpperCase() + str.slice(2);
}

 


export function getBackendPicName() {
    let currentHost = window.location.hostname

  // Check for localhost condition
  if (currentHost.includes('local')) {
    return ""
  }

  // Extract domain after the first dot (e.g., 'dtrader.tech')
  const targetDomain = currentHost.split('.')[1];
  // Return matched or fallback URL
 const modifiedDomain = capitalizeSecondChar(targetDomain);

return `${modifiedDomain}`; // Output: "eXample.com"
}

export const manifestData = {
  short_name: `${getBackendPicName()}`,
  name: `${getBackendPicName()} - Trading Platform`,
  icons: [
    {
      src: `${getBackendUrl()}/assets/admin/images/${getBackendPic()}favicon.png`,
      sizes: "64x64 32x32 24x24 16x16",
      type: "image/x-icon"
    },
    {
      src: `${getBackendUrl()}/assets/admin/images/${getBackendPic()}favicon.png`,
      type: "image/png",
      sizes: "192x192"
    },
    {
      src: `${getBackendUrl()}/assets/admin/images/${getBackendPic()}favicon.png`,
      type: "image/png",
      sizes: "512x512"
    }
  ],
  start_url: ".",
  display: "standalone",
  theme_color: "#000000",
  background_color: "#17171a"
};

 export default getBackendUrl;
// const selectedUrl = getBackendUrl();
// console.log(selectedUrl);