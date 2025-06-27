import { Box, Typography, Button, Chip } from '@mui/material'

export const UserHeader = ({ user, userRole, onSignOut }) => {
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'primary'
      case 'user': return 'primary'
      case 'viewer': return 'secondary'
      default: return 'default'
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrador'
      case 'user': return 'Usuario'
      case 'viewer': return 'Solo Lectura'
      default: return role
    }
  }

  return (
    <Box 
      sx={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e0e0e0',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}
    >
      <Box>
        <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold' }}>
          Gestión de cuentas
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
          <Chip 
            size="small" 
            label={getRoleLabel(userRole)} 
            color={getRoleColor(userRole)}
            variant="outlined"
          />
        </Box>
        
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={onSignOut}
        >
          Cerrar Sesión
        </Button>
      </Box>
    </Box>
  )
}
