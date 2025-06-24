"use client";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { useEffect, useState } from "react";
import supabase from "../utils/SupabaseClient";
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { ClientName } from "./Accounts";
import { useNavigate } from "react-router";
import { formatCurrency } from "../helpers/CurrencyFormatHelper";

export const Reports = () => {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState({});
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [accountDetails, setAccountDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase.from("Client").select("id, name");

      if (error) {
        console.error("Error fetching clients:", error);
      } else {
        const clientMap = {};
        data.forEach((client) => {
          clientMap[client.id] = client.name;
        });
        setClients(clientMap);
      }
    };

    fetchClients();
  }, []);

  const getAccountDetails = async (accountId) => {
    setLoadingDetails(true);
    try {
      const { data, error } = await supabase
        .from("AccountDetail")
        .select(`
          account_id,
          product_id,
          quantity,
          unit_price,
          total_per_item,
          Product (
            id,
            name,
            price,
            category_id,
            Category (
              id,
              name
            )
          )
        `)
        .eq("account_id", accountId);

      if (error) {
        console.error("Error fetching account details:", error);
        setAccountDetails([]);
      } else {
        setAccountDetails(data || []);
      }
    } catch (e) {
      console.error("Exception fetching account details:", e);
      setAccountDetails([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getDateRange = (filter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case "today":
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      case "yesterday":
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          start: yesterday,
          end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      case "thisWeek":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return {
          start: startOfWeek,
          end: now,
        };
      case "lastWeek":
        const startOfLastWeek = new Date(today);
        startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        endOfLastWeek.setHours(23, 59, 59, 999);
        return {
          start: startOfLastWeek,
          end: endOfLastWeek,
        };
      case "thisMonth":
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          start: startOfMonth,
          end: now,
        };
      case "lastMonth":
        const startOfLastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );
        const endOfLastMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          0
        );
        endOfLastMonth.setHours(23, 59, 59, 999);
        return {
          start: startOfLastMonth,
          end: endOfLastMonth,
        };
      case "custom":
        return {
          start: startDate ? new Date(startDate) : null,
          end: endDate ? new Date(endDate + "T23:59:59") : null,
        };
      default:
        return { start: null, end: null };
    }
  };

  useEffect(() => {
    let filtered = accounts;

    if (search.trim() !== "") {
      filtered = filtered.filter((account) => {
        const clientName = clients[account.client_id] || "";
        return clientName.toLowerCase().includes(search.toLowerCase());
      });
    }

    if (dateFilter !== "all") {
      const { start, end } = getDateRange(dateFilter);

      if (start && end) {
        filtered = filtered.filter((account) => {
          const accountDate = new Date(account.created_at);
          return accountDate >= start && accountDate <= end;
        });
      }
    }

    setFilteredAccounts(filtered);
  }, [search, accounts, clients, dateFilter, startDate, endDate]);

  useEffect(() => {
    const getAccounts = async () => {
      const { data, error } = await supabase
        .from("Account")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching accounts:", error);
      } else {
        setAccounts(data);
      }
    };
    getAccounts();
  }, []);

  const calculateTotal = () => {
    return filteredAccounts.reduce((total, account) => {
      return total + (account.total_amount || 0);
    }, 0);
  };

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    if (value !== "custom") {
      setStartDate("");
      setEndDate("");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedAccountId(null);
    setAccountDetails([]);
  };

  const seeDetails = async (accountId) => {
    setSelectedAccountId(accountId);
    setOpen(true);
    await getAccountDetails(accountId);
  };

  const closeAccountFromModal = async () => {
    if (!selectedAccountId) return;

    try {
      const account = accounts.find((acc) => acc.id === selectedAccountId);
      const totalAmount = accountDetails.reduce(
        (sum, detail) => sum + (detail.total_per_item || 0),
        0
      );

      const { error } = await supabase
        .from("Account")
        .update({
          status: "CLOSED",
          close_date: new Date().toISOString(),
          total_amount: totalAmount,
        })
        .eq("id", selectedAccountId);

      if (error) {
        console.error("Error closing account:", error);
        alert("Error al cerrar la cuenta: " + error.message);
      } else {
        alert("Cuenta cerrada exitosamente");

        const updatedAccounts = accounts.map((acc) =>
          acc.id === selectedAccountId
            ? {
                ...acc,
                status: "CLOSED",
                close_date: new Date().toISOString(),
                total_amount: totalAmount,
              }
            : acc
        );
        setAccounts(updatedAccounts);

        handleClose();
      }
    } catch (e) {
      console.error("Exception closing account:", e);
      alert("Error inesperado al cerrar la cuenta");
    }
  };

  return (
    <main className="flex flex-col h-[850px] overflow-hidden m-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-left items-start">
          Registro de cuentas
        </h1>
        <Button variant="outlined" onClick={() => navigate("/")}>
          Volver a las cuentas actuales
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg flex-shrink-0">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Buscar por nombre de cliente"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 w-full"
          />
        </div>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Período</InputLabel>
          <Select
            value={dateFilter}
            label="Período"
            onChange={(e) => handleDateFilterChange(e.target.value)}
          >
            <MenuItem value="all">Todas las fechas</MenuItem>
            <MenuItem value="today">Hoy</MenuItem>
            <MenuItem value="yesterday">Ayer</MenuItem>
            <MenuItem value="thisWeek">Esta semana</MenuItem>
            <MenuItem value="lastWeek">Semana pasada</MenuItem>
            <MenuItem value="thisMonth">Este mes</MenuItem>
            <MenuItem value="lastMonth">Mes pasado</MenuItem>
            <MenuItem value="custom">Rango personalizado</MenuItem>
          </Select>
        </FormControl>

        {dateFilter === "custom" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </>
        )}
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg flex-shrink-0">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium">
            Mostrando {filteredAccounts.length} cuenta(s)
            {dateFilter !== "all" && (
              <span className="text-gray-600 ml-2">
                -{" "}
                {dateFilter === "custom"
                  ? "Rango personalizado"
                  : dateFilter === "today"
                  ? "Hoy"
                  : dateFilter === "yesterday"
                  ? "Ayer"
                  : dateFilter === "thisWeek"
                  ? "Esta semana"
                  : dateFilter === "lastWeek"
                  ? "Semana pasada"
                  : dateFilter === "thisMonth"
                  ? "Este mes"
                  : dateFilter === "lastMonth"
                  ? "Mes pasado"
                  : ""}
              </span>
            )}
          </span>
          <span className="text-xl font-bold text-blue-600">
            Total: {formatCurrency(calculateTotal())}
          </span>
        </div>
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
                <TableCell
                  sx={{ fontWeight: "bold", backgroundColor: "white" }}
                >
                  A nombre de
                </TableCell>
                <TableCell
                  sx={{ fontWeight: "bold", backgroundColor: "white" }}
                >
                  Fecha
                </TableCell>
                <TableCell
                  sx={{ fontWeight: "bold", backgroundColor: "white" }}
                  align="right"
                >
                  Estado
                </TableCell>
                <TableCell
                  sx={{ fontWeight: "bold", backgroundColor: "white" }}
                  align="right"
                >
                  Total
                </TableCell>
                <TableCell
                  sx={{ fontWeight: "bold", backgroundColor: "white" }}
                  align="center"
                >
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No hay cuentas registradas
                  </TableCell>
                </TableRow>
              ) : filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No se encontraron cuentas con los filtros aplicados
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((account) => {
                  return (
                    <>
                      <TableRow key={account.id}>
                        <TableCell>
                          <ClientName clientId={account.client_id} />
                        </TableCell>
                        <TableCell>
                          {new Date(account.created_at).toLocaleDateString(
                            "es-ES",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {account.status === "OPEN" ? (
                            <span className="text-green-600 font-semibold">
                              Abierta
                            </span>
                          ) : (
                            <span className="text-red-600 font-semibold">
                              Cancelada
                            </span>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(account.total_amount)}
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="outlined"
                            color="secondary"
                            size="small"
                            onClick={() => seeDetails(account.id)}
                          >
                            Ver detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        aria-labelledby="account-details-title"
      >
        <DialogTitle id="account-details-title">
          Detalles de la Cuenta
          {selectedAccountId && (
            <div className="text-sm text-gray-600 mt-1">
              Cliente:{" "}
              <ClientName
                clientId={
                  accounts.find((acc) => acc.id === selectedAccountId)
                    ?.client_id
                }
              />
            </div>
          )}
        </DialogTitle>
        <DialogContent>
          {loadingDetails ? (
            <div className="flex justify-center items-center py-8">
              <p>Cargando detalles de la cuenta...</p>
            </div>
          ) : accountDetails.length === 0 ? (
            <div className="text-center py-8">
              <p>No hay productos en esta cuenta</p>
            </div>
          ) : (
            <div className="mt-4">
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Producto
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }} align="right">
                        Precio Unitario
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }} align="right">
                        Cantidad
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }} align="right">
                        Total por Producto
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accountDetails.map((detail) => (
                      <TableRow key={detail.product_id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{detail.Product?.name}</span>
                            <span className="text-gray-500 text-xs">{detail.Product?.Category?.name || 'Sin categoría'}</span>
                          </div>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(detail.unit_price)}
                        </TableCell>
                        <TableCell align="right">{detail.quantity}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(detail.total_per_item)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        align="right"
                        sx={{ fontWeight: "bold", fontSize: "1.1rem" }}
                      >
                        Total de la Cuenta:
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: "bold", fontSize: "1.1rem" }}
                      >
                        {formatCurrency(
                          accountDetails.reduce(
                            (sum, detail) => sum + (detail.total_per_item || 0),
                            0
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          {selectedAccountId &&
            accounts.find((acc) => acc.id === selectedAccountId)?.status ===
              "OPEN" && (
              <Button
                onClick={closeAccountFromModal}
                variant="contained"
                color="error"
                disabled={loadingDetails}
              >
                Cerrar Cuenta
              </Button>
            )}
        </DialogActions>
      </Dialog>
    </main>
  );
};
