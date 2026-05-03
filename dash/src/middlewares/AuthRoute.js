import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../contexts/UserContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AuthRoute = ({ children, authRequired = true, redirectIfLogged = false, redirectPath = "/" }) => {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const userToken = user?.token || null;

    if (authRequired && !userToken) {
      toast.error("Vous devez être connecté pour accéder à cette page.");
      setTimeout(() => navigate(redirectPath), 1500);
    } else if (redirectIfLogged && userToken) {
      navigate(redirectPath);
    } else {
      setAuthorized(true);
    }
  }, [user, navigate, authRequired, redirectIfLogged, redirectPath]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      {authorized ? children : null}
    </>
  );
};

export default AuthRoute;