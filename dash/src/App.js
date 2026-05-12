import './App.css';
import {Routes,Route,Navigate} from 'react-router-dom';
import 'animate.css';
import './chartConfig';
import Home from './Pages/Home';
import 'react-toastify/dist/ReactToastify.css';
import NotFoundPage from './Pages/NotFoundPage';
import { UserProvider } from './contexts/UserContext';
// import Profil from './Pages/Profil';
import Newsletter from './Pages/Newsletter';
import Accueil from './Pages/Accueil';
import Administrator from './Pages/Admin/Administrator';
import Tracabilite from './Pages/Statistiques/Tracabilite';
import AdminDashboard from './Pages/AdminDashboard/AdminDashboard';
import TeachersPage from './Pages/Admin/TeachersPage';
import DetailTeacher from './Pages/Admin/DetailTeacher';
import Courses from './Pages/Courses/Courses';
import Exams from './Pages/Exam/Exams';
import Classes from './Pages/Classes/Classes';
import Student from './Pages/Admin/Student';
import Notifications from './Pages/Notifications/Notifications';
import StudentDetail from './Pages/Admin/StudentDetail';
import Rooms from './Pages/Salles/Rooms';
import Bulletins from './Pages/Bulletins/Bulletins';
import Administration from './Pages/Administration/Administration';
import Tests from './Pages/Tests/Tests';
import  { ManagerPage } from './Pages/DRH Entreprise/DRHPage';
import  DRHPage from './Pages/DRH Entreprise/DRHPage';
import EspaceApprenant from './Pages/EspaceApprenant/EspaceApprenant';
import EspaceProfesseur from './Pages/EspaceProfesseur/EspaceProfesseur';
import LoginApprenant from './Pages/Auth/LoginApprenant';
import LoginProfesseur from './Pages/Auth/LoginProfesseur';
import LoginAdmin from './Pages/Auth/LoginAdmin';
import RendezVous from './Pages/Outils/RendezVous';
import SimulateurFormation from './Pages/Outils/SimulateurFormation';
import GestionDroits from './Pages/GestionDroits/GestionDroits';
import CommercialDashboard from './Pages/CommercialDashboard/CommercialDashboard';
import GestionnaireDashboard from './Pages/GestionnaireDashboard/GestionnaireDashboard';
import DashboardApprenant from './Pages/Dashboard/DashboardApprenant';
import DashboardCoach from './Pages/Dashboard/DashboardCoach';
import { DashboardCommercial, DashboardGestionnaire, DashboardRH } from "./Pages/Dashboard/Dashboardsbundle";
import { db } from "./config/firebase";
import { collection, addDoc } from "firebase/firestore";
import RHDashboard from './Pages/DRH Entreprise/RHDashboard';
import ParentDashboard from './Pages/ParentDashboard/ParentDashboard';
import Footer from './Pages/Footer';
import SuperAdminDashboard from './Pages/SuperAdminDashboard/SuperAdminDashboard';
import ResponsableDashboard from './Pages/ResponsableDashboard/ResponsableDashboard';
import DataCollectorDashboard from './Pages/DataCollectorDashboard/DataCollectorDashboard';
import OnboardingDashboard from './Pages/OnboardingDashboard/OnboardingDashboard';
import CorporateDashboard from './Pages/CorporateDashboard/CorporateDashboard';



const DASHBOARD_PAR_ROLE = {
  super_admin:    "/dashboard/superAdmin",
  admin:          "/AdminDashboard",
  manager:        "/AdminDashboard",
  responsable:    "/responsable-dashboard",
  commercial:     "/commercial-dashboard",
  gestionnaire:   "/gestionnaire-dashboard",
  coach:          "/espace-professeur",
  data_collector: "/datacollector-dashboard",
};

// Redirige vers LE BON dashboard si déjà connecté (vérifie uniquement le token)
function PublicAdminRoute({ children }) {
  const token  = localStorage.getItem("admin_token");
  if (!token) return children;
  const profil = JSON.parse(localStorage.getItem("admin_profil") || "null");
  const role   = profil?.role || profil?.profil_type;
  const dest   = DASHBOARD_PAR_ROLE[role] || "/dashboard/superAdmin";
  return <Navigate to={dest} replace />;
}

// Redirige vers le login si pas connecté (utilisé pour TOUS les dashboards staff)
function PrivateAdminRoute({ children }) {
  return localStorage.getItem("admin_token")
    ? children
    : <Navigate to="/login-admin" replace />;
}
// Alias pour clarté
const PrivateStaffRoute = PrivateAdminRoute;

function PublicCoachRoute({ children }) {
  const token = localStorage.getItem("coach_token");
  if (!token) return children;
  return <Navigate to="/espace-professeur" replace />;
}

function PrivateCoachRoute({ children }) {
  const token = localStorage.getItem("coach_token");
  if (!token) return <Navigate to="/login-professeur" replace />;
  return children;
}

export default function App() {
  return (
    <UserProvider>
    <Routes>
    <Route path='/' element={ <Home/> }/>
       <Route path='/Accueil' element={ <Accueil/> }/>
   <Route path="/actions" element={<Tracabilite />} />
     {/* <Route path="/Mon--profil" element={<Profil/>} /> */}
    <Route path="/newsletter" element={<Newsletter />} />
    <Route path="*" element={<NotFoundPage />} />
    <Route path="/administrator" element={<Administrator />} />
    <Route path="/AdminDashboard"           element={<PrivateStaffRoute><AdminDashboard /></PrivateStaffRoute>} />
    <Route path="/TeachersPage"             element={<PrivateStaffRoute><TeachersPage /></PrivateStaffRoute>} />
    <Route path="/teachers/:teacherId"      element={<PrivateStaffRoute><DetailTeacher /></PrivateStaffRoute>} />
    <Route path="/courses"                  element={<PrivateStaffRoute><Courses /></PrivateStaffRoute>} />
    <Route path="/exams"                    element={<PrivateStaffRoute><Exams /></PrivateStaffRoute>} />
    <Route path="/classes"                  element={<PrivateStaffRoute><Classes /></PrivateStaffRoute>} />
    <Route path="/student"                  element={<PrivateStaffRoute><Student /></PrivateStaffRoute>} />
    <Route path="/notifications"            element={<PrivateStaffRoute><Notifications /></PrivateStaffRoute>} />
    <Route path="/student/:id"              element={<PrivateStaffRoute><StudentDetail /></PrivateStaffRoute>} />
    <Route path="/rooms"                    element={<PrivateStaffRoute><Rooms /></PrivateStaffRoute>} />
    <Route path="/bulletins"               element={<PrivateStaffRoute><Bulletins /></PrivateStaffRoute>} />
    <Route path="/administration"           element={<PrivateStaffRoute><Administration /></PrivateStaffRoute>} />
    <Route path="/test-niveau"              element={<PrivateStaffRoute><Tests /></PrivateStaffRoute>} />
    <Route path="/drh"                      element={<PrivateStaffRoute><DRHPage /></PrivateStaffRoute>} />
    <Route path="/managers"                 element={<PrivateStaffRoute><ManagerPage /></PrivateStaffRoute>} />
    <Route path="/gestion-droits"           element={<PrivateStaffRoute><GestionDroits /></PrivateStaffRoute>} />
    <Route path="/commercial-dashboard"     element={<PrivateStaffRoute><CommercialDashboard /></PrivateStaffRoute>} />
    <Route path="/gestionnaire-dashboard"   element={<PrivateStaffRoute><GestionnaireDashboard /></PrivateStaffRoute>} />
    <Route path="/rh-dashboard"             element={<PrivateStaffRoute><RHDashboard /></PrivateStaffRoute>} />
    <Route path="/responsable-dashboard"    element={<PrivateStaffRoute><ResponsableDashboard /></PrivateStaffRoute>} />
    <Route path="/datacollector-dashboard"  element={<PrivateStaffRoute><DataCollectorDashboard /></PrivateStaffRoute>} />
    <Route path="/onboarding-dashboard"     element={<PrivateStaffRoute><OnboardingDashboard /></PrivateStaffRoute>} />
    <Route path="/corporate-dashboard"     element={<PrivateStaffRoute><CorporateDashboard /></PrivateStaffRoute>} />
    <Route path="/dashboard/superAdmin"     element={<PrivateStaffRoute><SuperAdminDashboard /></PrivateStaffRoute>} />
    <Route path="/dashboard/parent"         element={<ParentDashboard />} />
<Route path="/espace-apprenant" element={<EspaceApprenant />} />
<Route path="/espace-professeur" element={<PrivateStaffRoute><EspaceProfesseur /></PrivateStaffRoute>} />
<Route path="/login-apprenant"   element={<LoginApprenant />} />
<Route path="/login-professeur"  element={<PublicCoachRoute><LoginProfesseur /></PublicCoachRoute>} />
<Route path="/login-admin"       element={<PublicAdminRoute><LoginAdmin /></PublicAdminRoute>} />
<Route path="/simulateur"        element={<SimulateurFormation />} />
{/* <Route path="/espace-apprenant"   element={<DashboardApprenant />} />
<Route path="/espace-coach"       element={<DashboardCoach />} />
<Route path="/espace-commercial"  element={<DashboardCommercial />} />
<Route path="/espace-gestionnaire"element={<DashboardGestionnaire />} />
<Route path="/espace-rh"          element={<DashboardRH />} /> */}
  </Routes>
  <Footer/>
 
  </UserProvider>
  );
}

