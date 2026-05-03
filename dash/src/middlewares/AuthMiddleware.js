import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';

const AuthMiddleware = ({ children }) => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const checkUserToken = () => {
        const userToken = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
        if (!userToken || userToken === 'undefined') {
            setIsLoggedIn(false);
            toast.error("Session expirée. Veuillez vous reconnecter.");
            return navigate('/');
        } else {
            setIsLoggedIn(true);
        }
    };

    useEffect(() => {
        checkUserToken();
    }, []);

    return isLoggedIn ? children : null;
};

export default AuthMiddleware;