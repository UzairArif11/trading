import React, { useState, useEffect, useRef } from "react";
import { useAuthContext } from "../../contexts/Auth-Context";
import { Form, useNavigate } from "react-router-dom";
import APIMiddleware from "../../data/api/Api-Middleware";
import { toast } from "react-toastify";
import { useLocation } from 'react-router-dom';

// import logo from "../../imgs/logo.png";
import {
  API_ENDPOINT_CHECK_EMAIL,
  API_ENDPOINT_DIRECT_LOGIN,
  API_ENDPOINT_LOGIN,
  API_ENDPOINT_USER_DETAILS,
} from "../../data/Endpoints-API";
import "./Login.scss";
import Select from "react-select";
import VariantModal from "./VariantLogout";
import getBackendUrl, { getBackendPic } from "../../components/utils/RedirectUrl";

const Login = () => {
  const [inputActiveEmail, setInputActiveEmail] = useState('free');
  const [inputActivePass, setInputActivePass] = useState('free');

  let p_u_email, p_u_password;
  if (localStorage.userData != undefined) {
    const previousUser = JSON.parse(localStorage.userData);
    p_u_email = previousUser.email;
    p_u_password = previousUser.password;
    // inputActive = true;
    // setInputActiveEmail('filled');
    // setInputActivePass('filled');
  }
  const navigate = useNavigate();
  const { login, logoutWithOutRefresh, isMariginCallVisible, setIsMariginCallVisible } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [loginError, setLoginError] = useState("");

  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [allUserOptions, setAllUserOptions] = useState({});
  const [selectedUserAccount, setSelectedUserAccount] = useState({});
  const [selectedUserUniqueId, setSelectedUserUniqueId] = useState(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const [readyStateRole, setReadyStateRole] = useState("wait");
  const [passwordEyeState, setPasswordEyeState] = useState("password");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // REFS
  const passwordInputRef = useRef(null);
  const readyStateEl = useRef(null);
  
  const location = useLocation();

  useEffect(() => {
    if (showPasswordInput && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [showPasswordInput]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    // console.log(params.get('direct'));
    if (params.has('token')) {

        let token = params.get('token')

        directLogin(token);

    }
}, [location]);

useEffect(() => {
  // Check if the page was reloaded for the user login
  if (localStorage.getItem('userLoggedIn')) {
    localStorage.removeItem('userLoggedIn');
  }
}, []);

  const directLogin = async (token) => {
      if (localStorage.variantId) {
       await logoutWithOutRefresh(localStorage.variantId)
      }
      if (token) {
        const data = {
          token
        };
        if (!localStorage.token) {
          await  directLoginApi(data);
        }
     

      }
  };


  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

      if (email && password && !isSubmitting) {
        setIsSubmitting(true);

        const data = {
          email,
          password,
          unique_id: selectedUserUniqueId
        };
        loginApi(data)

      }
  };

  const directLoginApi = async (data) =>{
    try{
      const response = await APIMiddleware.post(API_ENDPOINT_DIRECT_LOGIN(), data);
          
      if (response && response.data[0]) {
          try{  
            if (response && response.data[0]) {

              if (!localStorage.getItem('userLoggedIn')) {
                localStorage.setItem('userLoggedIn', 'true');
                window.location.reload();
              }
              // Store the token in localStorage
              //localStorage.setItem('authToken', response.data[0].token);
              const userData = { email: email, password: password };
              const jsonUd = JSON.stringify(userData);
              localStorage.setItem('userData', jsonUd);
              localStorage.setItem("userId", response.data[0].userId);         //for time being
              localStorage.setItem("token", response.token);         //for time being
              localStorage.setItem("accountType", response.accountType);         //for time being
              localStorage.setItem("serverUrl", response.data[0]?.server_url);
              // document.body.className = `theme-dark`;
              console.log(response.data[0],"response.data[0]",data)
              // await login(response.data[0]);
        
              const min = Number.MIN_SAFE_INTEGER;
              const max = Number.MAX_SAFE_INTEGER;
              const randomNumber = getRandomNumber(min, max);
              localStorage.setItem("variantId", randomNumber);
              navigate("/home");
              if (!localStorage.getItem('userLoggedIn')) {
                localStorage.setItem('userLoggedIn', 'true');
                window.location.reload();
              }
              if (response.data[0].liquidation_warning == 1) {
                setIsMariginCallVisible(true)
              }
            } else {
              toast.error("Invalid login. Please try again.", {
                position: "top-right",
              });
              // setLoginError('Invalid login. Please try again.');
            }
          } catch (error) {
            console.error(`API request error: ${API_ENDPOINT_LOGIN()}`, error?.response?.status
            );
            if (error?.response?.status == 500) {
              toast.error(error?.response?.data.error, {
                position: "top-right",
              });
            } else {
              toast.error("An error occurred. Please try again later.", {
                position: "top-right",
              });
            }
      
            // setLoginError('An error occurred. Please try again later.');
          } finally {
            setIsSubmitting(false);
          }
          // loginApi({...data,accountType:"admin"})
      } else {
        toast.error("Invalid login. Please try again.", {
          position: "top-right",
        });
        // setLoginError('Invalid login. Please try again.');
      }
    }catch(error){
      console.error(`API request error: ${API_ENDPOINT_DIRECT_LOGIN()}`);
      toast.error("Your session token has expired. Please log in again using your credentials.", {
        position: "top-right",
      });
    }
  }

  const loginApi = async (data) =>{
    try{
      const response = await APIMiddleware.post(API_ENDPOINT_LOGIN(), data);
          
      if (response && response.data[0]) {
        // Store the token in localStorage
        //localStorage.setItem('authToken', response.data[0].token);
        const userData = { email: email, password: password };
        const jsonUd = JSON.stringify(userData);
        localStorage.setItem('userData', jsonUd);
        localStorage.setItem("userId", response.data[0].userId);         //for time being
        localStorage.setItem("token", response.token);         //for time being
        localStorage.setItem("accountType", response.accountType);         //for time being
        // document.body.className = `theme-dark`;
        console.log(response.data[0],"response.data[0]",data)
        // await login(response.data[0]);
  
        const min = Number.MIN_SAFE_INTEGER;
        const max = Number.MAX_SAFE_INTEGER;
        const randomNumber = getRandomNumber(min, max);
        localStorage.setItem("variantId", randomNumber);
        localStorage.setItem("serverUrl", response.data[0]?.server_url);
        navigate("/home");

        if (response.data[0].liquidation_warning == 1) {
          setIsMariginCallVisible(true)
        }
      } else {
        toast.error("Invalid login. Please try again.", {
          position: "top-right",
        });
        // setLoginError('Invalid login. Please try again.');
      }
    } catch (error) {
      console.error(`API request error: ${API_ENDPOINT_LOGIN()}`, error?.response?.status
      );
      if (error?.response?.status == 500) {
        toast.error(error?.response?.data.error, {
          position: "top-right",
        });
      } else {
        toast.error("An error occurred. Please try again later.", {
          position: "top-right",
        });
      }

      // setLoginError('An error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function getRandomNumber(min, max) {
    const randomBuffer = new Uint32Array(2);
    window.crypto.getRandomValues(randomBuffer);
    const randomNumber = (randomBuffer[0] * 0x100000000) + randomBuffer[1];
    return Math.floor((randomNumber / (Number.MAX_SAFE_INTEGER * 2)) * (max - min + 1)) + min;
  }

  const [loadOne, setLoadOne] = useState(false);
  // let loadOne = false;
  // const bothOnload = setInterval(() => {
  //   console.log('inside interval');
  //   loadOne = false;
  //   if (document.getElementById("readyState") != null) {
  //     console.log('element not null: inside interval');
  //     loadOne = true;
  //   }
  // }, 500);
  console.log('render');

  useEffect(() => {
    if (readyStateEl.current != null) {
      setLoadOne(true);
      console.log('inside useEffect');
    }
  }, [readyStateEl]);

  useEffect(() => {
    // clearInterval(bothOnload)
    document.body.style.display = 'block';
    const timeoutId = setTimeout(() => {
      // document.getElementById("readyState")?.setAttribute("role", "ready");
      setReadyStateRole("ready");
    }, 1000);
    // const gridUp = document.querySelector(".grid-up");
    // const columns =
    //   getComputedStyle(gridUp).gridTemplateColumns.split(" ").length;
    // const rows = getComputedStyle(gridUp).gridTemplateRows.split(" ").length;
    // const blocks = columns * rows;
    // for (let i = 0; i < blocks; i++) {
    //   let blockElement = document.createElement("div");
    //   blockElement.className = "box";
    //   gridUp.append(blockElement);
    // }

    // const gridDown = document.querySelector(".grid-down");
    // const second_columns =
    //   getComputedStyle(gridDown).gridTemplateColumns.split(" ").length;
    // const second_rows =
    //   getComputedStyle(gridDown).gridTemplateRows.split(" ").length;
    // const second_blocks = second_columns * second_rows;
    // for (let i = 0; i < second_blocks; i++) {
    //   let blockElement = document.createElement("div");
    //   blockElement.className = "box";
    //   gridDown.append(blockElement);
    // }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [loadOne]);

  // const inputFocused = (e) => {
  //   e.target.parentNode?.setAttribute("role", "focus");
  // };
  const inputFocusedEmail = () => {
    // e.target.parentNode?.setAttribute("role", "focus");
    setInputActiveEmail('focus');
  };
  const inputFocusedPass = () => {
    setInputActivePass('focus');
  };
  // const inputFree = (e) => {
  //   if (e.target.value.split("").length == 0) {
  //     e.target.parentNode.setAttribute("role", "free");
  //   } else {
  //     e.target.parentNode.setAttribute("role", "filled");
  //   }
  // };
  const inputFreeEmail = () => {
    if (!email) {
      setInputActiveEmail('free');
    } else {
      setInputActiveEmail('filled');
    }
  };
  const inputFreePass = () => {
    if (!password) {
      setInputActivePass('free');
    } else {
      setInputActivePass('filled');
    }
  };

  const passwordEye = (val) => {
    // e.target.parentNode?.setAttribute("type", v);
    // e.target.parentNode?.children[1]?.setAttribute("type", v);
    setPasswordEyeState(val);
  };

  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  // window.onmousemove = (e) => {
  //   const heroPointer = document.getElementsByClassName("my-hero-pointer")[0];
  //   if (heroPointer != undefined) {
  //     setTimeout(() => {
  //       heroPointer.style.left = `${e.x + heroPointer.getClientRects()[0]?.width + 4}px`;
  //       heroPointer.style.top = `${e.y + heroPointer.getClientRects()[0]?.height + 6}px`;
  //     }, 100);
  //   }
  // };

  const checkEmailApi = async () => {
    try {
      if (email != '' && email != null && email != undefined && email != 'undefined' && !checkEmail) {
            setCheckEmail(true);
            const response = await APIMiddleware.get(
              API_ENDPOINT_CHECK_EMAIL(email)
            );
            if (response.status == false && response.count >= 3) {
              setIsModalOpen(true);
            }
            
            if (response.data.length > 1) {
              const allSymbolOptions = Object.entries(response.data).map(([key, value]) => ({
                value: value.unique_id,
                label: value.name + ' - ' + value.unique_id,
              }));
              setShowUserDropdown(true);
              setAllUserOptions(allSymbolOptions);
            }else{
              setSelectedUserUniqueId(response.data[0].unique_id);
              setShowPasswordInput(true);
              setShowUserDropdown(false);
            }
          }
    } catch (error) {
      if (error?.response?.status == 500) {
        toast.error(error?.response?.data.error, {
          position: "top-right",
        });
      setShowUserDropdown(false);
      setShowPasswordInput(false);
      setSelectedUserAccount({});
      setSelectedUserUniqueId(null);
      } else {
        toast.error("An error occurred. Please try again later.", {
          position: "top-right",
        });
      }

      console.error(`Error getting user`, error);
    } finally {
      setCheckEmail(false);
    }
  };

  const handleUserOptionChange = (user) => {
    setSelectedUserUniqueId(user.value);
    setSelectedUserAccount(user);
    setShowPasswordInput(true);
  }

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUserUniqueId(null);
    setSelectedUserAccount({});
    setShowPasswordInput(false);
    setShowUserDropdown(false);
    setEmail('');
    setPassword('');
    inputFreeEmail();
    inputFreePass();
  }

  const handleOpenModal = () => {
    setIsModalOpen(false);
  }

  return (
    <>
    <VariantModal show={isModalOpen} onConfirm={handleOpenModal} onCancel={handleCloseModal} title={"Already 3 variants logged in"} message={"Do you want to logout the old one and login with this account?"}/>
      <div id="mybody" role="login">
        {/* <div className="my-hero-pointer"></div>
        <div className="bg-animation">
          <div className="top-to-bottom"></div>
        </div>
        <div className="grid-z-two">
          <div className="grid-up grid-box"></div>
          <div className="grid-down grid-box"></div>
        </div> */}
        <div className="login-window">
          <form id="readyState" ref={readyStateEl} role={readyStateRole} onSubmit={handleLogin}>
          <img src={`${getBackendUrl()}/assets/admin/images/logo/${getBackendPic()}logo-full.png`} alt="Logo" />
            <h2>Welcome back!</h2>
            <p>
              Your gateway to financial success! Unlock a world of opportunities
              and financial growth by simply logging in.
            </p>
            <div className="input-cap" role={inputActiveEmail}>
              <p>Your email address *</p>
              <input
                type="email"
                onBlur={(e) => {
                  // Call your API function here with the email value (optional)
                 !checkEmail&& checkEmailApi(e.target.value); 
                  // inputFree(e);
                  inputFreeEmail();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    !checkEmail&&  checkEmailApi();
                    inputFreeEmail();
                  }
                }}
                // onFocus={(e) => inputFocused(e)}
                onFocus={() => inputFocusedEmail()}
                // onBlur={(e) => inputFree(e)}
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
              />
              <svg viewBox="0 0 22 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 1H19C20.1 1 21 1.9 21 3V15C21 16.1 20.1 17 19 17H3C1.9 17 1 16.1 1 15V3C1 1.9 1.9 1 3 1Z" />
                <path d="M21 3L11 10L1 3" />
              </svg>
            </div>
          {showUserDropdown && (
            <div className="symbol-selector-container">
                <Select
                  className="selected-input-field"
                  classNamePrefix="custom-select"
                  value={selectedUserAccount}
                  onChange={handleUserOptionChange}
                  options={allUserOptions}
                  isSearchable
                  placeholder="Select Account"
                />
            </div>
          )} 
            {showPasswordInput && (
            <div className="input-cap" role={inputActivePass} type={passwordEyeState}>
              <p>Your password *</p>
              <input
                type={passwordEyeState}
                ref={passwordInputRef}
                // onFocus={(e) => inputFocused(e)}
                onFocus={() => inputFocusedPass()}
                // onBlur={(e) => inputFree(e)}
                onBlur={() => inputFreePass()}
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
              />
              {/* closed eye */}
              <svg
                onClick={() => passwordEye("text")}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06003M9.9 4.24002C10.5883 4.0789 11.2931 3.99836 12 4.00003C19 4.00003 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.572 9.14351 13.1984C8.99262 12.8249 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2219 9.18488 10.8539C9.34884 10.4859 9.58525 10.1547 9.88 9.88003" />
                <path d="M1 1L23 23" />
              </svg>
              {/* open eye */}
              <svg
                onClick={() => passwordEye("password")}
                viewBox="0 0 24 18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M1 9C1 9 5 1 12 1C19 1 23 9 23 9C23 9 19 17 12 17C5 17 1 9 1 9Z" />
                <path d="M12 12C13.6569 12 15 10.6569 15 9C15 7.34315 13.6569 6 12 6C10.3431 6 9 7.34315 9 9C9 10.6569 10.3431 12 12 12Z" />
              </svg>
            </div>
            )}
            <div className="input-submit">
              <input
                type="submit"
                id="submitLogin"
                disabled={isSubmitting || !selectedUserUniqueId || !password}
                hidden
              />
              <label htmlFor="submitLogin" className={isSubmitting || !password ?"login-index" : "login-index label-submitting"}>
                {isSubmitting ? "Logging in..." : "Log in"}
              </label>
            </div>
            <div className="signup">
              <p>
                Don't Have Account?{" "}
                <a
                  // href='{process.env.LIVE_URL + /user/register_user}'
                  href={`${getBackendUrl()}/register_user`}
                  target="_blank"
                >
                  Register
                </a>
              </p>
            </div>
            <div className="reset-password">
              <p>
                Forgot Password?{" "}
                <a
                  // href="https://backoffice.rxbt.net/user/login"
                  href={`${getBackendUrl()}/login?tab=forgot-password`}
                  target="_blank"
                >
                  Reset password
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
