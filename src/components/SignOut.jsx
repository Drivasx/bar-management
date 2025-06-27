import { Button } from '@mui/material'
import React from 'react'

export const SignOut = ({onSignOut}) => {
  return (
    <Button variant='outlined' color='error' onClick={onSignOut} style={{}}>
        Cerrar sesión
    </Button>
  )
}
