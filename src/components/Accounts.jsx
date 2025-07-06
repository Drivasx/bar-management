import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Button } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { NewAccount } from "./NewAccount";
import { AccountDetails } from "./AccountDetails";
import { useNavigate } from "react-router";
import { AccountService, ClientService } from "../services";

export const ClientName = ({ clientId }) => {
  const [clientName, setClientName] = useState("");
  useEffect(() => {
    if (!clientId) return;

    const fetchClient = async () => {
      try {
        const client = await ClientService.getClientById(clientId);
        setClientName(client?.name || "");
      } catch (error) {
        console.error("Error fetching client:", error);
      }
    };

    fetchClient();
  }, [clientId]);

  return <>{clientName}</>;
};

export const Accounts = () => {
  const [value, setValue] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState();
  const [combineOpen, setCombineOpen] = useState(false);
  const [selectedAccountsToCombine, setSelectedAccountsToCombine] = useState([]);
  const [targetAccount, setTargetAccount] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editAccountOpen, setEditAccountOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);
  const [editClientId, setEditClientId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getAccounts();
  }, []);

  const getAccounts = async () => {
    try {
      const accountsData = await AccountService.getAllAccounts();
      
      setAccounts(accountsData);
      const openAccounts = accountsData.filter(
        (account) => account.status === "OPEN"
      );
      if (openAccounts.length > 0 && !value) {
        setValue(openAccounts[0].id);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const openDialog = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCloseCombine = () => {
    setCombineOpen(false);
    setSelectedAccountsToCombine([]);
    setTargetAccount(null);
  };

  const handleCloseEditAccount = () => {
    setEditAccountOpen(false);
    setAccountToEdit(null);
    setEditClientId(null);
  };

  const openEditAccountDialog = (account) => {
    setAccountToEdit(account);
    setEditClientId(account.client_id);
    setEditAccountOpen(true);
  };

  const deleteAccount = async (accountId) => {
    if (!window.confirm("¿Está seguro de que desea eliminar esta cuenta? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      await AccountService.deleteAccount(accountId);
      
      alert("Cuenta eliminada exitosamente");
      await getAccounts();
      
      // Si la cuenta eliminada era la activa, seleccionar otra
      const remainingAccounts = accounts.filter(acc => acc.id !== accountId && acc.status === "OPEN");
      if (remainingAccounts.length > 0) {
        setValue(remainingAccounts[0].id);
      } else {
        setValue("");
      }
    } catch (error) {
      console.error("Exception deleting account:", error);
      alert(`Error al eliminar la cuenta: ${error.message}`);
    }
  };

  const editAccount = async () => {
    if (!editClientId) {
      alert("Por favor, seleccione un cliente");
      return;
    }

    try {
      await AccountService.updateAccount(accountToEdit.id, { client_id: editClientId });
      
      alert("Cuenta actualizada exitosamente");
      await getAccounts();
      handleCloseEditAccount();
    } catch (error) {
      console.error("Exception updating account:", error);
      alert(`Error al actualizar la cuenta: ${error.message}`);
    }
  };

  const openCombineDialog = () => {
    setCombineOpen(true);
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
    console.log("Selected account ID:", newValue);
  };

  const handleClientSelected = (selectedClientId) => {
    setClientId(selectedClientId);
  };

  const addAccount = async () => {
    if (!clientId) {
      alert("Por favor, seleccione un cliente primero");
      return;
    }

    try {
      const newAccount = await AccountService.createAccount(clientId);
      
      setAccounts((prevAccounts) => [...prevAccounts, newAccount]);
      setValue(newAccount.id); // Establecer la nueva cuenta como activa
      setOpen(false);
      setClientId(null);
    } catch (error) {
      console.error("Exception in addAccount:", error);
      alert(`Error al crear la cuenta: ${error.message}`);
    }
  };

  const combineAccounts = async () => {
    if (!targetAccount || selectedAccountsToCombine.length === 0) {
      alert("Por favor seleccione una cuenta destino y al menos una cuenta para combinar");
      return;
    }

    try {
      await AccountService.combineAccounts(targetAccount, selectedAccountsToCombine);
      
      alert("Cuentas combinadas exitosamente");
      
      await getAccounts();
      setValue(targetAccount);
      setRefreshKey(prev => prev + 1); 

      handleCloseCombine();
    } catch (error) {
      console.error("Exception combining accounts:", error);
      alert(`Error al combinar cuentas: ${error.message}`);
    }
  };

  const toggleAccountSelection = (accountId) => {
    setSelectedAccountsToCombine(prev => {
      if (prev.includes(accountId)) {
        return prev.filter(id => id !== accountId);
      } else {
        return [...prev, accountId];
      }
    });
  };

  const openAccounts = accounts.filter((account) => account.status === "OPEN");

  return (
    <main className="flex flex-col h-screen overflow-hidden px-4 py-2">
      {/* Header con botones - altura fija */}
      <div className="flex justify-between items-center mb-2 flex-shrink-0">
        <div className="flex gap-2">
          <Button 
            variant="contained" 
            color="primary" 
            onClick={openDialog}
            size="small"
          >
            Crear nueva cuenta
          </Button>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={openCombineDialog}
            disabled={openAccounts.length < 2}
            size="small"
          >
            Combinar cuentas
          </Button>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={() => navigate("/reportes")}
            size="small"
          >
            Reportes
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => navigate("/clientes")}
            size="small"
          >
            Gestionar Clientes
          </Button>
          <Button 
            variant="outlined" 
            color="success" 
            onClick={() => navigate("/productos")}
            size="small"
          >
            Gestionar Productos
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {openAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg">
            <div className="text-center p-8">
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No hay cuentas abiertas
              </h3>
              <p className="text-gray-500 mb-4">
                Crea una nueva cuenta para comenzar a registrar productos
              </p>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={openDialog}
                size="large"
              >
                Crear nueva cuenta
              </Button>
            </div>
          </div>
        ) : (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <TabContext value={value}>
              <Box sx={{ borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
                <TabList 
                  onChange={handleChange} 
                  aria-label="lab API tabs example"
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: '40px',
                    '& .MuiTab-root': {
                      minHeight: '40px',
                      padding: '6px 12px',
                      fontSize: '0.875rem'
                    }
                  }}
                >
                  {openAccounts.map((account) => (
                    <Tab
                      key={account.id}
                      label={<ClientName clientId={account.client_id} />}
                      value={account.id}
                    />
                  ))}
                </TabList>
              </Box>
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                {accounts.map((account) => (
                  <TabPanel 
                    key={account.id} 
                    className="w-full h-full p-0" 
                    value={account.id}
                    sx={{ 
                      height: '100%', 
                      overflow: 'auto', 
                      padding: '8px 0 0 0',
                      '&::-webkit-scrollbar': {
                        width: '6px'
                      },
                      '&::-webkit-scrollbar-track': {
                        background: '#f1f1f1'
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#c1c1c1',
                        borderRadius: '3px'
                      }
                    }}
                  >
                    <AccountDetails
                      key={`${account.id}-${refreshKey}`}
                      accountId={account.id}
                      setAccounts={setAccounts}
                      setValue={setValue}
                    />
                  </TabPanel>
                ))}
              </Box>
            </TabContext>
          </Box>
        )}
      </div>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Seleccione el cliente"}
        </DialogTitle>
        <DialogContent>
          <NewAccount onClientSelected={handleClientSelected} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={addAccount}
            autoFocus
            disabled={!clientId}
            variant="contained"
            color="primary"
          >
            {clientId ? "Crear cuenta" : "Seleccione un cliente primero"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={combineOpen}
        onClose={handleCloseCombine}
        maxWidth="md"
        fullWidth
        aria-labelledby="combine-dialog-title"
      >
        <DialogTitle id="combine-dialog-title">
          Combinar Cuentas
        </DialogTitle>
        <DialogContent>
          <div className="mb-4">
            <h4 className="text-lg font-semibold mb-2">1. Selecciona la cuenta destino:</h4>
            <div className="space-y-2">
              {openAccounts.map((account) => (
                <div key={`target-${account.id}`} className="flex items-center p-2 border rounded">
                  <input
                    type="radio"
                    id={`target-${account.id}`}
                    name="targetAccount"
                    value={account.id}
                    checked={targetAccount == account.id}
                    onChange={(e) => setTargetAccount(parseInt(e.target.value))}
                    className="mr-3"
                  />
                  <label htmlFor={`target-${account.id}`} className="flex-1 cursor-pointer">
                    <div className="flex justify-between">
                      <span className="font-medium">
                        <ClientName clientId={account.client_id} />
                      </span>

                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-lg font-semibold mb-2">2. Selecciona las cuentas a combinar:</h4>
            <div className="space-y-2">
              {openAccounts
                .filter(account => account.id !== targetAccount)
                .map((account) => (
                <div key={`combine-${account.id}`} className="flex items-center p-2 border rounded">
                  <input
                    type="checkbox"
                    id={`combine-${account.id}`}
                    checked={selectedAccountsToCombine.includes(account.id)}
                    onChange={() => toggleAccountSelection(account.id)}
                    className="mr-3"
                  />
                  <label htmlFor={`combine-${account.id}`} className="flex-1 cursor-pointer">
                    <div className="flex justify-between">
                      <span className="font-medium">
                        <ClientName clientId={account.client_id} />
                      </span>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {targetAccount && selectedAccountsToCombine.length > 0 && (
            <div className="bg-blue-50 p-3 rounded">
              <h5 className="font-semibold text-blue-800">Resumen:</h5>
              <p className="text-sm text-blue-700">
                Las cuentas seleccionadas se combinarán con la cuenta de{" "}
                <strong><ClientName clientId={openAccounts.find(a => a.id === targetAccount)?.client_id} /></strong>.
                Las cuentas combinadas se eliminarán completamente del sistema.
              </p>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCombine}>Cancelar</Button>
          <Button
            onClick={combineAccounts}
            variant="contained"
            color="primary"
            disabled={!targetAccount || selectedAccountsToCombine.length === 0}
          >
            Combinar Cuentas
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para editar cuenta */}
      <Dialog
        open={editAccountOpen}
        onClose={handleCloseEditAccount}
        aria-labelledby="edit-account-dialog-title"
      >
        <DialogTitle id="edit-account-dialog-title">
          Editar Cuenta
        </DialogTitle>
        <DialogContent>
          <div className="mt-2">
            <p className="mb-4 text-gray-600">Cambiar el cliente asignado a esta cuenta:</p>
            <NewAccount 
              onClientSelected={setEditClientId}
              initialClientId={editClientId}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditAccount}>Cancelar</Button>
          <Button
            onClick={editAccount}
            variant="contained"
            color="primary"
            disabled={!editClientId}
          >
            Actualizar Cuenta
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
};
