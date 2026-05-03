import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RegisterMiddleware = (props) => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const register = () => {
        const userToken = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;

        if (!userToken || userToken === 'undefined') {
            setIsLoggedIn(true);
            toast.error("Erreur de connexion Email ou Mot de passe incorrect !!!"); // Show error toast
            return navigate('/');
        } else {
            setIsLoggedIn(true);
            return navigate('/users');
        }
    }

    useEffect(() => {
        register();
    }, [isLoggedIn]);

    return (
        <React.Fragment>
            <ToastContainer />  {/* Add this to display the toast messages */}
            {
                isLoggedIn ? props.children : null
            }
        </React.Fragment>
    );
}

export default RegisterMiddleware;