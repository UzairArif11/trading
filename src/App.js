import Login from "./pages/login/Login.jsx";
import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, RouterProvider, createBrowserRouter,useNavigate, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/Theme-Context.js";
import { AuthProvider } from "./contexts/Auth-Context";
import { SymbolProvider } from "./contexts/Symbol-Context";
import { AccountManagerProvider } from "./contexts/Account-Manager-Context";
import { ChartProvider } from "./contexts/Chart-Context";
import { MetricsProvider } from "./contexts/Metrics-Context.js";
import { RippleProvider } from "./contexts/Ripple-Context.js";
import Main from "./pages/main/Main.jsx";
import Symbol from "./components/main/symbol/Symbol";
import Chart from "./components/main/chart/Chart";
import OrderPanel from "./components/main/order_panel/Order-Panel";
import OrderBook from "./components/main/order_book/Order-Book";
import AccountManager from "./components/main/account_manager/Account-Manager";
import UserSettings from "./components/main/user_settings/UserSettings";
import MetricsPanel from "./components/main/metrics_panel/Metrics-Panel.jsx";
import "./App.scss";
import { OrderProvider } from "./contexts/Order-Context.js";
import 'react-toastify/dist/ReactToastify.css';
import { PromotionProvider } from "./contexts/promotionContext.js";
import Loader from '../src/components/utils/Loader/Loader.jsx'
import getBackendUrl, { getBackendPic } from "./components/utils/RedirectUrl.js";
import { useChartContext } from "./contexts/Chart-Context.js";
const Layout = () => {
  const navigate = useNavigate();
    const { selectedStyle } = useChartContext();
    const styleVars = {
      '--buy-color': selectedStyle.buyColor,
      '--sell-color': selectedStyle.sellColor,
    };
  useEffect(() => {
    if (localStorage.getItem('userId')) {
      navigate('/home');
    }else{
      navigate('/');
    }
  }, []);
  return (
    <div style={styleVars}>
      <Outlet />
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true, // Use "index: true" for the root path
        element: <Login />, // Render the Login component for the root path    
      },
      {
        path: "home", // Use "home" for the "/home" path
        element: <Main />, // Render the Main component for the "/home" path
      },
      {
        path: "/",
        element: <Main />,
        children: [
          { path: "Symbol", element: <Symbol /> },
          { path: "Chart", element: <Chart /> },
          { path: "Order-Panel", element: <OrderPanel /> },
          { path: "Order-Book", element: <OrderBook /> },
          { path: "Account-Manager", element: <AccountManager /> },
          { path: "UserSettings", element: <UserSettings /> },
          { path: "Login", element: <Login /> },
          { path: "MetricsPanel", element: <MetricsPanel /> },
        ],
      },
    ],
  },
]);

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const favicon = document.querySelector("link[rel~='icon']");
    const isMobile = window.innerWidth <= 960;
    if (favicon) {
      favicon.href =getBackendUrl()+ `/assets/admin/images/${getBackendPic()}favicon.png`;
    }

    console.log(isMobile);
    
    if (isMobile) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000); // Show for 2 seconds
  
      return () => clearTimeout(timer);
    }else{
      setLoading(false);
    }
  }, []);

  
  if (loading) 
    return <Loader />

  return (
    <ThemeProvider>
      <RippleProvider>
        <AuthProvider>
                    <PromotionProvider>
          <AccountManagerProvider>
            <ChartProvider>
              <SymbolProvider>
                <MetricsProvider>
                  <OrderProvider>
                      <div className="App">
                        <RouterProvider router={router} />
                      </div>
                  </OrderProvider>
                </MetricsProvider>
              </SymbolProvider>
            </ChartProvider>
          </AccountManagerProvider>
                  </PromotionProvider>
        </AuthProvider>
      </RippleProvider>
    </ThemeProvider>
  );
}

export default App;
