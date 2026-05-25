// src/App.js (extrait modifié, à remplacer dans votre fichier)
import './App.css';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './i18n/index';
import { HelmetProvider } from "react-helmet-async";
import Navbar from './Pages/Navbar/Navbar.jsx';
import CartContextProvider from './context/CartContext.js';
import FavoritesContextProvider from './context/FavoritesContext.js';
import { UserProvider } from './context/UserContext.js';
import Accueil from './Pages/Accueil/Accueil.jsx';
import BlogDetail from './Pages/Components/BlogSection/BlogDetail.jsx';
import BlogList from './Pages/Blog/BlogList.jsx';
import TemoignagesPage from './Pages/Temoignages/TemoignagesPage.jsx';
import CourseDetail from './Pages/Courses/CourseDetail.jsx';
import CertificationDetail from './Pages/Components/CertificationDetail/CertificationDetail.jsx';
import CenterDetail from './Pages/Components/CenterDetail/CenterDetail.jsx';
import ServiceDetail from './Pages/Components/ServiceDetail/ServiceDetail.jsx';
import About from './Pages/About/About.jsx';
import FreeLevelTest from './Pages/FreeLevelTest/FreeLevelTest.jsx';
// import CorporateLanding from './Pages/HomePage/Entreprise/CorporateLanding.jsx';
// import CorporateOffers from './Pages/HomePage/Entreprise/CorporateOffers.jsx';
// import CorporateForm from './Pages/HomePage/Entreprise/CorporateForm.jsx';
// import CorporateConfirmation from './Pages/HomePage/Entreprise/CorporateConfirmation.jsx';
// import IndividualLanding from './Pages/HomePage/Particuliers/IndividualLanding.jsx';
// import IndividualForm from './Pages/HomePage/Particuliers/IndividualForm.jsx';
// import IndividualConfirmation from './Pages/HomePage/Particuliers/IndividualConfirmation.jsx';
// import HomePage from './Pages/HomePage/HomePage.jsx';
// import AdultOffers from './Pages/HomePage/Particuliers adultes/AdultOffers/AdultOffers.jsx';
// import ProgramSheet from './Pages/HomePage/Particuliers adultes/ProgramSheet/ProgramSheet.jsx';
// import LevelTest from './Pages/HomePage/Particuliers adultes/LevelTest/LevelTest.jsx';
// import RegistrationForm from './Pages/HomePage/Particuliers adultes/RegistrationForm/RegistrationForm.jsx';
// import LearnerSpace from './Pages/HomePage/Particuliers adultes/LearnerSpace/LearnerSpace.jsx';
// import KidsLanding from './Pages/HomePage/Enfants & Étudiants/KidsLanding/KidsLanding.jsx';
// import KidsProgram from './Pages/HomePage/Enfants & Étudiants/KidsProgram/KidsProgram.jsx';
// import ParentsAssurance from './Pages/HomePage/Enfants & Étudiants/ParentsAssurance/ParentsAssurance.jsx';
// import KidsRegistration from './Pages/HomePage/Enfants & Étudiants/KidsRegistration/KidsRegistration.jsx';
// import StudentRegistration from './Pages/HomePage/Enfants & Étudiants/StudentRegistration/StudentRegistration.jsx';
import LeadThankYou from './Pages/LeadMagnet/LeadThankYou.jsx';
import LeadMagnetAudit from './Pages/LeadMagnet/LeadMagnetAudit.jsx';
import Contact from './Pages/Contact/Contact.jsx';
import WhatsAppButton from './Pages/Components/WhatsAppButton/WhatsAppButton.jsx';
// import ChatBot from './Pages/Components/ChatBot/ChatBot.jsx';
import AuditGratuit from './Pages/Components/Audit/AuditGratuit.jsx';
import ParcoursEntreprise from './Pages/Parcours/ParcoursEntreprise.jsx';
import ParcoursParticulier from './Pages/Parcours/ParcoursParticulier.jsx';
import ParcoursTunnel from './Pages/Parcours/ParcoursTunnel.jsx';
import BookingCalendar from './Pages/Components/BookingCalendar/BookingCalendar.jsx';
import SimulateurButton from './Pages/Outils/SimulateurButton.jsx';
// import ParentDashboard from './Pages/ParentDashboard/ParentDashboard.jsx';
import MonEspace from './Pages/Mon espace/MonEspace.jsx';
import PaiementRetour from './Pages/Paiement/PaiementRetour.jsx';
import Boutique from './Pages/Boutique/Boutique.jsx';
import UpdatePassword from './Pages/Components/Password/UpdatePassword.jsx';
import FAQ from './Pages/FAQ/FAQ.jsx';
import { supabase } from './config/supabase.js';
import { captureUTM } from './utils/utm.js';

const App = () => {
  const [user, setUser] = useState(null);

  // Capture UTM au chargement + à chaque navigation
  useEffect(() => { captureUTM(); }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);

        // Synchronisation du profil après connexion (email/password ou Google)
        if (event === 'SIGNED_IN' && session?.user) {
          const token = session.access_token;
          // Stocker le token pour compatibilité avec MonEspace (getToken)
          localStorage.setItem('token', token);
          
          try {
            await fetch('http://localhost:5001/api/auth/sync-profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            });
            console.log('✅ Profil synchronisé après connexion');
          } catch (err) {
            console.error('Erreur synchronisation profil:', err);
          }
        }
        
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.access_token) {
        localStorage.setItem('token', session.access_token);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <HelmetProvider>
        <UserProvider>
          <CartContextProvider>
            <FavoritesContextProvider>
              <Router>
                <Navbar user={user} />
                <Routes>
                  <Route path="/" element={<Accueil />} />
                  <Route path="/blog" element={<BlogList />} />
                  <Route path="/blog/:id" element={<BlogDetail />} />
                  <Route path="/temoignages" element={<TemoignagesPage />} />
                  <Route path="/cours/:type" element={<CourseDetail />} />
                  <Route path="/certification/:certId" element={<CertificationDetail />} />
                  <Route path="/centre/:centerId" element={<CenterDetail />} />
                  <Route path="/service/:serviceId" element={<ServiceDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/test-niveau" element={<FreeLevelTest />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/lead-magnet/audit-gratuit" element={<AuditGratuit />} />
                  <Route path="/mon-espace" element={<MonEspace />} />
                  <Route path="/parcours/particulier" element={<ParcoursParticulier />} />
                  <Route path="/parcours/entreprise" element={<ParcoursEntreprise />} />
                  <Route path="/parcours/inscription" element={<ParcoursTunnel />} />
                  <Route path="/lead-magnet/audit-gratuit" element={<LeadMagnetAudit />} />
                  <Route path="/lead-magnet/merci" element={<LeadThankYou />} />
                  <Route path="/update-password" element={<UpdatePassword />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/paiement/retour" element={<PaiementRetour />} />
                  <Route path="/boutique" element={<Boutique />} />
                </Routes>
                {/* <SimulateurButton /> */}
                <WhatsAppButton />
                {/* <BookingCalendar /> */}
              </Router>
            </FavoritesContextProvider>
          </CartContextProvider>
        </UserProvider>
        <Toaster position="top-right" />
      </HelmetProvider>
    </>
  );
};

export default App;