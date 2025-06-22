import React, { useEffect, useState } from "react";
import { Box, Button, Tab, Tabs } from "@mui/material";
import supabase from "../utils/SupabaseClient";
import { TabPanel } from "./TabPanel";


const ClientName = ({ clientId }) => {
    const [clientName, setClientName] = useState('')
  useEffect(() => {
    if (!clientId) return;

    const fetchClient = async () => {
      const { data, error } = await supabase
        .from("Account")
        .select(`
          id,
          Client (
            name
          )
        `)
        .eq("client_id", clientId)
        .single();

      if (error) console.error("Error fetching client:", error);
      setClientName(data?.Client?.name)
    };

    fetchClient();
  }, [clientId]);

  return <>{clientName}</>;
};
export const Accounts = () => {
  const [value, setValue] = useState(0);
  const [accounts, setAccounts] = useState([]);



  useEffect(() => {
    const getAccounts = async () => {
      try {
        const { data: accounts, error } = await supabase
          .from("Account")
          .select("*");

        if (error) {
          console.error("Error fetching accounts:", error);
        } else {
          if (accounts && accounts.length > 0) {
            setAccounts(accounts);
          } else {
            console.log("No accounts found in the database");
          }
        }
      } catch (e) {
        console.error("Exception in getAccounts:", e);
      }
    };

    getAccounts();
  }, []);
  

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <main className="flex flex-col justify-center">
      <div>
        <Button variant="contained" color="primary">
          Crear nueva cuenta
        </Button>
      </div>
      <Box sx={{ mt: 2 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons
          allowScrollButtonsMobile
          aria-label="scrollable force tabs example"
        >
          {accounts && accounts.length > 0 ? (
            accounts.map((account, index) => (
              <Tab
                key={account.id || index}
                label={<ClientName clientId={account.client_id}/>}
              />
            ))
          ) : (
            <Tab label="No hay cuentas disponibles" disabled />
          )}
        </Tabs>
        {accounts && accounts.length > 0 ? (
            accounts.map((account, index) => (
              
                <TabPanel value={value} index={account.id}> hol;a</TabPanel>
            ))
          ) : (
            <Tab label="No hay cuentas disponibles" disabled />
          )}
      </Box>
    </main>
  );
};
