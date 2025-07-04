import { useEffect, useState } from "react";
import supabase from "../utils/SupabaseClient";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router";

export const ClientManagement = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);
  const [clientName, setClientName] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("Client")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching clients:", error);
        alert("Error al cargar los clientes");
      } else {
        setClients(data || []);
      }
    } catch (e) {
      console.error("Exception fetching clients:", e);
      alert("Error inesperado al cargar los clientes");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (client) => {
    setClientToEdit(client);
    setClientName(client.name);
    setEditOpen(true);
  };

  const openCreateDialog = () => {
    setClientName("");
    setCreateOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setClientToEdit(null);
    setClientName("");
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
    setClientName("");
  };

  const createClient = async () => {
    if (!clientName.trim()) {
      alert("Por favor, ingrese un nombre válido");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("Client")
        .insert([{ name: clientName.trim() }])
        .select();

      if (error) {
        console.error("Error creating client:", error);
        alert("Error al crear el cliente");
        return;
      }

      alert("Cliente creado exitosamente");
      await fetchClients();
      handleCloseCreate();
    } catch (e) {
      console.error("Exception creating client:", e);
      alert("Error inesperado al crear el cliente");
    }
  };

  const editClient = async () => {
    if (!clientName.trim()) {
      alert("Por favor, ingrese un nombre válido");
      return;
    }

    try {
      const { error } = await supabase
        .from("Client")
        .update({ name: clientName.trim() })
        .eq("id", clientToEdit.id);

      if (error) {
        console.error("Error updating client:", error);
        alert("Error al actualizar el cliente");
        return;
      }

      alert("Cliente actualizado exitosamente");
      await fetchClients();
      handleCloseEdit();
    } catch (e) {
      console.error("Exception updating client:", e);
      alert("Error inesperado al actualizar el cliente");
    }
  };

  const deleteClient = async (clientId, clientName) => {
    // Primero verificar si el cliente tiene cuentas asociadas
    try {
      const { data: accounts, error: accountsError } = await supabase
        .from("Account")
        .select("id")
        .eq("client_id", clientId);

      if (accountsError) {
        console.error("Error checking client accounts:", accountsError);
        alert("Error al verificar las cuentas del cliente");
        return;
      }

      if (accounts && accounts.length > 0) {
        alert(
          `No se puede eliminar este cliente porque tiene ${accounts.length} cuenta(s) asociada(s). ` +
          "Primero debe eliminar todas las cuentas del cliente."
        );
        return;
      }

      if (!window.confirm(`¿Está seguro de que desea eliminar el cliente "${clientName}"? Esta acción no se puede deshacer.`)) {
        return;
      }

      const { error } = await supabase
        .from("Client")
        .delete()
        .eq("id", clientId);

      if (error) {
        console.error("Error deleting client:", error);
        alert("Error al eliminar el cliente");
        return;
      }

      alert("Cliente eliminado exitosamente");
      await fetchClients();
    } catch (e) {
      console.error("Exception deleting client:", e);
      alert("Error inesperado al eliminar el cliente");
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Cargando clientes...</div>
      </div>
    );
  }

  return (
    <main className="flex flex-col h-screen overflow-hidden px-4 py-2">
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <h1 className="text-2xl font-bold">Gestión de Clientes</h1>
        <Button 
          variant="outlined" 
          onClick={() => navigate("/")}
          size="small"
        >
          Volver a Cuentas
        </Button>
      </div>

      <div className="flex gap-3 mb-3 p-3 bg-gray-50 rounded-lg flex-shrink-0">
        <div className="flex-1">
          <TextField
            placeholder="Buscar cliente por nombre"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            fullWidth
          />
        </div>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={openCreateDialog}
          size="small"
        >
          Nuevo Cliente
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <TableContainer
          className="w-full h-full"
          component={Paper}
          sx={{
            maxHeight: "100%",
            overflow: "auto",
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} align="center">
                    {search ? "No se encontraron clientes con ese nombre" : "No hay clientes registrados"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <span className="font-medium">{client.name}</span>
                    </TableCell>
                    <TableCell align="center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => openEditDialog(client)}
                          sx={{ minWidth: 'auto', px: 1, fontSize: '0.75rem' }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => deleteClient(client.id, client.name)}
                          sx={{ minWidth: 'auto', px: 1, fontSize: '0.75rem' }}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Dialog para crear cliente */}
      <Dialog
        open={createOpen}
        onClose={handleCloseCreate}
        aria-labelledby="create-client-dialog-title"
      >
        <DialogTitle id="create-client-dialog-title">
          Crear Nuevo Cliente
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              label="Nombre del cliente"
              fullWidth
              variant="outlined"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  createClient();
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreate}>Cancelar</Button>
          <Button
            onClick={createClient}
            variant="contained"
            color="primary"
            disabled={!clientName.trim()}
          >
            Crear Cliente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para editar cliente */}
      <Dialog
        open={editOpen}
        onClose={handleCloseEdit}
        aria-labelledby="edit-client-dialog-title"
      >
        <DialogTitle id="edit-client-dialog-title">
          Editar Cliente
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              label="Nombre del cliente"
              fullWidth
              variant="outlined"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  editClient();
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Cancelar</Button>
          <Button
            onClick={editClient}
            variant="contained"
            color="primary"
            disabled={!clientName.trim()}
          >
            Actualizar Cliente
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
};
