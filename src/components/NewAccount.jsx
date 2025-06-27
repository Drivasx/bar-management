import { useForm } from "../hooks/useForm";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { useEffect, useState } from "react";
import supabase from "../utils/SupabaseClient";
import { Button } from "@mui/material";
import TextField from "@mui/material/TextField";

export const NewAccount = ({ onClientSelected }) => {
  const [isNewClient, setIsNewClient] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const initialForm = {
    name: "",
  };

  const { formState, onInputChange } = useForm(initialForm);

  const { name } = formState;

  const getClients = async () => {
    const { data: clients, error } = await supabase
      .from("Client")
      .select("*");

    if (error) console.log("error", error);

    setClients(clients);
  };
  useEffect(() => {

    getClients();
  }, []);

  const addClient = async (name) => {
    if (!name.trim()) {
      alert("Por favor, ingrese un nombre de cliente válido");
      return;
    }
    
    const { data, error } = await supabase
      .from("Client")
      .insert([{ name: name }])
      .select();

    if (error) {
      console.log("error", error);
      alert("Error al registrar el cliente: " + error.message);
    } else if (data && data.length > 0) {
      const newClientId = data[0].id;
      setSelectedClientId(newClientId);
      if (onClientSelected) {
        onClientSelected(newClientId);
      }
      setIsNewClient(false); 
      alert("Cliente registrado con éxito");
    }

    getClients(); 
  };

  const changeInput = () => {
    setIsNewClient(true);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        {isNewClient ? (
          <>
            <div className="flex gap-3 mt-4">
              <TextField
                id="standard-basic"
                label="Nombre del nuevo cliente"
                variant="outlined"
                name="name"
                value={name}
                onChange={onInputChange}
              />
            </div>

            <Button type="submit" onClick={() => addClient(name)}>Registrar</Button>
          </>
        ) : (
          <>
            <InputLabel id="demo-simple-select-label">Nombre</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={selectedClientId || ""}
              label="Nombre"
              onChange={(e) => {
                const clientId = e.target.value;
                const selectedClient = clients.find(client => client.id === clientId);
                
                if (selectedClient) {
                  setSelectedClientId(clientId);
                  // Actualizar el formulario con el nombre del cliente seleccionado
                  onInputChange({ target: { name: 'name', value: selectedClient.name } });
                  
                  if (onClientSelected) {
                    onClientSelected(clientId);
                  }
                }
              }}
            >
              {clients.map((client) => (
                <MenuItem key={client.id} value={client.id}>
                  {client.name}
                </MenuItem>
              ))}
            </Select>
            <div className="flex gap-2 mt-4">
              <p>¿Es un cliente nuevo? Registrelo</p>
              <Button size="small" variant="contained" onClick={changeInput}>
                aquí
              </Button>
            </div>
          </>
        )}
      </FormControl>
    </Box>
  );
};
