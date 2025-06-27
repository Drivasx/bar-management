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
  const [openAbonoModal, setOpenAbonoModal] = useState(false);
  const [montoAbono, setMontoAbono] = useState("");
  const [abonoMessages, setAbonoMessages] = useState({}); // Objeto para mantener mensajes por cuenta
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
    
    // Crear fechas en zona horaria local
    const getLocalDate = (year, month, day, hour = 0, minute = 0, second = 0, ms = 0) => {
      return new Date(year, month, day, hour, minute, second, ms);
    };

    switch (filter) {
      case "today":
        const startOfToday = getLocalDate(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfToday = getLocalDate(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        return { start: startOfToday, end: endOfToday };
        
      case "yesterday":
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const startOfYesterday = getLocalDate(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
        const endOfYesterday = getLocalDate(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
        return { start: startOfYesterday, end: endOfYesterday };
        
      case "thisWeek":
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startOfWeekLocal = getLocalDate(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate(), 0, 0, 0, 0);
        return { start: startOfWeekLocal, end: now };
        
      case "lastWeek":
        const startOfLastWeek = new Date(now);
        startOfLastWeek.setDate(now.getDate() - now.getDay() - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        const startOfLastWeekLocal = getLocalDate(startOfLastWeek.getFullYear(), startOfLastWeek.getMonth(), startOfLastWeek.getDate(), 0, 0, 0, 0);
        const endOfLastWeekLocal = getLocalDate(endOfLastWeek.getFullYear(), endOfLastWeek.getMonth(), endOfLastWeek.getDate(), 23, 59, 59, 999);
        return { start: startOfLastWeekLocal, end: endOfLastWeekLocal };
        
      case "thisMonth":
        const startOfMonth = getLocalDate(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        return { start: startOfMonth, end: now };
        
      case "lastMonth":
        const startOfLastMonth = getLocalDate(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        const endOfLastMonth = getLocalDate(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return { start: startOfLastMonth, end: endOfLastMonth };
        
      case "custom":
        const customStart = startDate ? new Date(startDate + "T00:00:00.000") : null;
        const customEnd = endDate ? new Date(endDate + "T23:59:59.999") : null;
        return { start: customStart, end: customEnd };
        
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

      console.log("Filtro de fecha:", dateFilter);
      console.log("Rango de fechas:", { start, end });

      if (start && end) {
        filtered = filtered.filter((account) => {
          // Convertir la fecha de la cuenta a fecha local (solo fecha, sin hora)
          const accountDate = new Date(account.created_at);
          const accountLocalDate = new Date(accountDate.getFullYear(), accountDate.getMonth(), accountDate.getDate());
          const isInRange = accountLocalDate >= start && accountLocalDate <= end;
          
          if (dateFilter === "today") {
            console.log("Cuenta:", account.id);
            console.log("Fecha original:", account.created_at);
            console.log("Fecha parseada:", accountDate);
            console.log("Fecha local (solo día):", accountLocalDate);
            console.log("Rango inicio:", start);
            console.log("Rango fin:", end);
            console.log("En rango:", isInRange);
            console.log("---");
          }
          
          return isInRange;
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

  const calculateTotals = () => {
    const totalPagado = filteredAccounts
      .filter(account => account.status === "CLOSED")
      .reduce((total, account) => total + (account.total_amount || 0), 0);
    
    const totalPendiente = filteredAccounts
      .filter(account => account.status === "OPEN" || account.status === "BLOCKED")
      .reduce((total, account) => total + (account.total_amount || 0), 0);
    
    return { totalPagado, totalPendiente };
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

  const handleCloseAbonoModal = () => {
    setOpenAbonoModal(false);
    setMontoAbono("");
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

      const now = new Date();

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      const localTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      const { data, error } = await supabase
        .from("Account")
        .update({
          status: "CLOSED",
          close_date: localTimestamp,
          total_amount: totalAmount,
        })
        .eq("id", selectedAccountId)
        .select();
        

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
                close_date: localTimestamp,
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

  function conviertefecha(fecharecibidatexto){
    if (!fecharecibidatexto || fecharecibidatexto === "N/A") {
      return "N/A";
    }
    
    try {
      let fecha;
      
      if (fecharecibidatexto.match(/^\d{4}-\d{2}-\d{2}$/)) {
        fecha = new Date(fecharecibidatexto + "T12:00:00");
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const anio = fecha.getFullYear();
        return `${dia}/${mes}/${anio}`;
      } else if (fecharecibidatexto.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
        const [datePart, timePart] = fecharecibidatexto.split(' ');
        const [year, month, day] = datePart.split('-');
        const [hour, minute, second] = timePart.split(':');
        
        fecha = new Date(year, month - 1, day, hour, minute, second);
      } else {
        fecha = new Date(fecharecibidatexto);
      }
      
      const anio = fecha.getFullYear();
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const dia = fecha.getDate().toString().padStart(2, '0');
      const hora = fecha.getHours().toString().padStart(2, '0');
      const minutos = fecha.getMinutes().toString().padStart(2, '0');
      
      return `${dia}/${mes}/${anio} ${hora}:${minutos}`;
    } catch (error) {
      console.error("Error convirtiendo fecha:", fecharecibidatexto, error);
      return "Fecha inválida";
    }
  }

  const abonarDinero = async () => {
    if (!selectedAccountId || !montoAbono || isNaN(montoAbono) || parseFloat(montoAbono) <= 0) {
      alert("Por favor ingrese un monto válido");
      return;
    }

    const dineroAAbonar = parseFloat(montoAbono);
    const account = accounts.find((acc) => acc.id === selectedAccountId);
    const nuevoTotal = (account.total_amount || 0) - dineroAAbonar;

    // No permitir que el total sea negativo
    if (nuevoTotal < 0) {
      alert("El monto a abonar no puede ser mayor al total de la cuenta");
      return;
    }

    // Determinar el nuevo estado basado en el total restante
    const newStatus = nuevoTotal === 0 ? "CLOSED" : "BLOCKED";
    
    // Si se está cerrando la cuenta, necesitamos la fecha de cierre
    const updateData = { 
      total_amount: newStatus === "CLOSED" ? account.total_amount + dineroAAbonar : nuevoTotal, // Mostrar total original si se cierra
      status: newStatus
    };
    
    if (newStatus === "CLOSED") {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      updateData.close_date = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    const { data, error } = await supabase
      .from("Account")
      .update(updateData)
      .eq("id", selectedAccountId)
      .select();

    if (error) {
      console.error("Error abonando dinero:", error);
      alert("Error al abonar dinero a la cuenta");
    } else {
      
      const updatedAccounts = accounts.map((acc) =>
        acc.id === selectedAccountId
          ? { 
              ...acc, 
              total_amount: updateData.total_amount, 
              status: newStatus,
              ...(newStatus === "CLOSED" && { close_date: updateData.close_date })
            }
          : acc
      );
      setAccounts(updatedAccounts);

      let newMessage;
      if (newStatus === "CLOSED") {
        newMessage = `Se abonó el resto de la cuenta (${formatCurrency(dineroAAbonar)}). La cuenta ha sido cerrada automáticamente. Total pagado: ${formatCurrency(updateData.total_amount)}`;
      } else {
        newMessage = `Se abonaron ${formatCurrency(dineroAAbonar)} a esta cuenta. Nuevo total: ${formatCurrency(nuevoTotal)}`;
      }
      
      setAbonoMessages(prev => ({
        ...prev,
        [selectedAccountId]: newMessage
      }));
      
      // Cerrar el modal de abono
      handleCloseAbonoModal();
      
      if (newStatus === "CLOSED") {
        alert("Cuenta pagada completamente y cerrada automáticamente");
      } else {
        alert("Dinero abonado con éxito");
      }
    }
  };

  return (
    <main className="flex flex-col h-screen overflow-hidden px-4 py-2">
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <h1 className="text-2xl font-bold text-left items-start">
          Registro de cuentas
        </h1>
        <Button 
          variant="outlined" 
          onClick={() => navigate("/")}
          size="small"
        >
          Volver a las cuentas actuales
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-3 p-3 bg-gray-50 rounded-lg flex-shrink-0">
        <div className="flex-1 min-w-48">
          <input
            type="text"
            placeholder="Buscar por nombre de cliente"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
          />
        </div>

        <FormControl sx={{ minWidth: 180 }} size="small">
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
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fecha inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fecha fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
          </>
        )}
      </div>

      <div className="mb-3 p-3 bg-blue-50 rounded-lg flex-shrink-0">
        <div className="flex justify-between items-center">
          <span className="text-base font-medium">
            Mostrando {filteredAccounts.length} cuenta(s)
            {dateFilter !== "all" && (
              <span className="text-gray-600 ml-2 text-sm">
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
          <div className="flex gap-4 items-center">
            <div className="text-right">
              <div className="text-sm text-green-600 font-medium">
                Pagado: {formatCurrency(calculateTotals().totalPagado)}
              </div>
              <div className="text-sm text-orange-600 font-medium">
                Pendiente: {formatCurrency(calculateTotals().totalPendiente)}
              </div>
            </div>
            <div className="text-lg font-bold text-blue-600">
              Total: {formatCurrency(calculateTotals().totalPagado + calculateTotals().totalPendiente)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <TableContainer
          className="w-full h-full"
          component={Paper}
          sx={{
            maxHeight: "100%",
            overflow: "auto",
            '& .MuiTableCell-root': {
              padding: '8px 12px',
              fontSize: '0.875rem'
            },
            '& .MuiTableCell-head': {
              fontWeight: 'bold',
              backgroundColor: 'white',
              fontSize: '0.875rem'
            }
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>A nombre de</TableCell>
                <TableCell>Fecha Apertura</TableCell>
                <TableCell>Fecha Cierre</TableCell>
                <TableCell align="right">Estado</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow >
                  <TableCell colSpan={6} align="center">
                    No hay cuentas registradas
                  </TableCell>
                </TableRow>
              ) : filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
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
                          {conviertefecha(account.created_at)}
                        </TableCell>
                        <TableCell>
                          {conviertefecha(account.close_date)}
                        </TableCell>
                        <TableCell align="right">
                          {account.status === "OPEN" ? (
                            <span className="text-green-600 font-semibold">
                              Abierta
                            </span>
                          ) : account.status === "BLOCKED" ? (
                            <span className="text-yellow-600 font-semibold">
                              Abonada
                            </span>
                          ) : (
                            <span className="text-red-600 font-semibold">
                              Cerrada
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
                            sx={{ fontSize: '0.75rem', px: 2 }}
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
          {selectedAccountId && abonoMessages[selectedAccountId] && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {abonoMessages[selectedAccountId]}
            </div>
          )}
          {selectedAccountId && accounts.find((acc) => acc.id === selectedAccountId)?.status === "BLOCKED" && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              <strong>⚠️ Cuenta con abonos:</strong> Esta cuenta ha recibido abonos y está bloqueada para modificaciones.
            </div>
          )}
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
                          accounts.find((acc) => acc.id === selectedAccountId)?.total_amount || 0
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
          <Button onClick={handleClose}>Cerrar</Button>
          {selectedAccountId && (
            <>
              {accounts.find((acc) => acc.id === selectedAccountId)?.status === "OPEN" && (
                <>
                  <Button
                    onClick={() => setOpenAbonoModal(true)}
                    variant="contained"
                    color="primary"
                    disabled={loadingDetails || accountDetails.length === 0}
                  >
                    Abonar Dinero
                  </Button>
                  <Button
                    onClick={closeAccountFromModal}
                    variant="contained"
                    color="error"
                    disabled={loadingDetails || accountDetails.length === 0}
                  >
                    Cerrar Cuenta
                  </Button>
                </>
              )}
              {accounts.find((acc) => acc.id === selectedAccountId)?.status === "BLOCKED" && (
                <Button
                  onClick={() => setOpenAbonoModal(true)}
                  variant="contained"
                  color="primary"
                  disabled={loadingDetails}
                >
                  Abonar Más Dinero
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Modal para abonar dinero */}
      <Dialog
        open={openAbonoModal}
        onClose={handleCloseAbonoModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Abonar Dinero a la Cuenta</DialogTitle>
        <DialogContent>
          <div className="mt-4">
            <p className="mb-4 text-gray-600">
              Total actual de la cuenta: {" "}
              <span className="font-bold">
                {formatCurrency(
                  accounts.find((acc) => acc.id === selectedAccountId)?.total_amount || 0
                )}
              </span>
            </p>
            
            {/* Botón para abonar el total completo */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 mb-3">
                <strong>Opción rápida:</strong> Abonar el total completo y cerrar la cuenta
              </p>
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  const totalActual = accounts.find((acc) => acc.id === selectedAccountId)?.total_amount || 0;
                  setMontoAbono(totalActual.toString());
                }}
                fullWidth
                size="small"
              >
                Abonar Total Completo ({formatCurrency(
                  accounts.find((acc) => acc.id === selectedAccountId)?.total_amount || 0
                )})
              </Button>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                O ingrese un monto personalizado:
              </label>
              <input
                type="number"
                value={montoAbono}
                onChange={(e) => setMontoAbono(e.target.value)}
                placeholder="Ingrese el monto"
                className="w-full border border-gray-300 rounded px-3 py-2"
                min="0"
                step="0.01"
                autoFocus
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAbonoModal}>Cancelar</Button>
          <Button
            onClick={abonarDinero}
            variant="contained"
            color="primary"
            disabled={!montoAbono || parseFloat(montoAbono) <= 0}
          >
            Abonar {montoAbono && parseFloat(montoAbono) > 0 ? formatCurrency(parseFloat(montoAbono)) : ''}
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
};
