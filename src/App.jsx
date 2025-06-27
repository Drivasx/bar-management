import { Route, Routes } from "react-router";
import { Box, CircularProgress, Typography } from "@mui/material";
import "./App.css";
import { Accounts } from "./components/Accounts";
import { Reports } from "./components/Reports";
import { Login } from "./components/Login";
import { UserHeader } from "./components/UserHeader";
import { useAuth } from "./hooks/useAuth";

function App() {
  const { user, userRole, loading, signIn, signOut } = useAuth();

  // Pantalla de carga
  if (loading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          gap: 2
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          Verificando autenticación...
        </Typography>
      </Box>
    );
  }

  // Si no hay usuario logueado, mostrar login
  if (!user) {
    return <Login onLogin={signIn} />;
  }

  // Usuario autenticado - mostrar aplicación
  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <UserHeader user={user} userRole={userRole} onSignOut={signOut} />
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Accounts />} />
          <Route path="/reportes" element={<Reports />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
