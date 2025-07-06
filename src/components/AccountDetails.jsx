import { useEffect, useState } from "react";
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
} from "@mui/material";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { formatCurrency } from "../helpers/CurrencyFormatHelper";
import { useForm } from "../hooks/useForm";
import { 
  AccountService, 
  AccountDetailService, 
  ProductService, 
  CategoryService 
} from "../services";

export const AccountDetails = ({ accountId, setAccounts }) => {
  const [accountDetails, setAccountDetails] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [productsToRound, setProductsToRound] = useState([]);
  const [isRoundSaved, setIsRoundSaved] = useState(false);
  const [round, setRound] = useState([]);
  const [editingRoundItem, setEditingRoundItem] = useState(null);
  const [open, setOpen] = useState(false);
  const [accountInfo, setAccountInfo] = useState(null);
  const [hasPayments, setHasPayments] = useState(false);

  const initialForm = {
    name: "",
    price: 0,
    category: 1,
  };

  const {formState, setFormState, onInputChange} = useForm(initialForm);

  const { name, price, category } = formState;

  useEffect(() => {
    if (!accountId) return;

    const fetchAccountInfo = async () => {
      try {
        const data = await AccountService.getAccountById(accountId);
        setAccountInfo(data);
        // Verificar si la cuenta está bloqueada por abonos
        setHasPayments(data?.status === "BLOCKED");
      } catch (error) {
        console.error("Error fetching account info:", error);
      }
    };

    const fetchAccountDetails = async () => {
      try {
        setLoading(true);
        const data = await AccountDetailService.getAccountDetails(accountId);
        setAccountDetails(data);
        calculateTotal(data);
      } catch (error) {
        console.error("Error fetching account details:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchProducts = async () => {
      try {
        const data = await ProductService.getAllProducts();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchAccountInfo();
    fetchAccountDetails();
    fetchProducts();
  }, [accountId]);

  useEffect(() => {
    if (accountId) {
      const savedRound = localStorage.getItem(`round_${accountId}`);
      const savedRoundStatus = localStorage.getItem(`roundSaved_${accountId}`);

      if (savedRound) {
        setRound(JSON.parse(savedRound));
      }
      if (savedRoundStatus) {
        setIsRoundSaved(JSON.parse(savedRoundStatus));
      }
    }
  }, [accountId]);

  useEffect(() => {
    const getCategories = async () => {
      try {
        const data = await CategoryService.getAllCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }

    getCategories();
  }, [])
  

  const saveRoundToStorage = (roundData, isSaved) => {
    localStorage.setItem(`round_${accountId}`, JSON.stringify(roundData));
    localStorage.setItem(`roundSaved_${accountId}`, JSON.stringify(isSaved));
  };

  const calculateTotal = (details) => {
    const total =
      details?.reduce((sum, item) => sum + (item.total_per_item || 0), 0) || 0;
    setTotalAmount(total);

    updateAccountTotal(total);
  };

  const updateAccountTotal = async (total) => {
    try {
      await AccountService.updateAccountTotal(accountId, total);
    } catch (error) {
      console.error("Error updating account total:", error);
    }
  };

  const addProductToAccount = async () => {
    if (!selectedProduct || quantity <= 0) {
      alert("Por favor seleccione un producto y una cantidad válida");
      return;
    }

    try {
      const product = products.find((p) => p.id === Number(selectedProduct));
      if (!product) return;

      const unitPrice = product.price;

      await AccountDetailService.addProductToAccount(
        accountId, 
        selectedProduct, 
        quantity, 
        unitPrice
      );

      // Refrescar los detalles de la cuenta
      const updatedDetails = await AccountDetailService.getAccountDetails(accountId);
      setAccountDetails(updatedDetails);
      calculateTotal(updatedDetails);

      setSelectedProduct("");
      setQuantity(1);
    } catch (error) {
      console.error("Error adding product to account:", error);
      alert(`Error al agregar producto: ${error.message}`);
    }
  };

  const removeProductFromAccount = async (productId) => {
    try {
      await AccountDetailService.removeProductFromAccount(accountId, productId);
      
      const updatedDetails = accountDetails.filter(
        (item) => item.product_id !== productId
      );
      setAccountDetails(updatedDetails);
      calculateTotal(updatedDetails);
    } catch (error) {
      console.error("Error removing product:", error);
      alert(`Error al eliminar producto: ${error.message}`);
    }
  };

  const closeAccount = async (accountId) => {
    try {
      await AccountService.closeAccount(accountId, totalAmount);
      
      setAccounts((prevAccounts) =>
        prevAccounts.filter((account) => account.id !== accountId)
      );
    } catch (error) {
      console.error("Error closing account:", error);
      alert(`Error al cerrar la cuenta: ${error.message}`);
    }
  };

  const registerRound = async () => {
    if (productsToRound.length === 0) {
      alert(
        "Por favor, seleccione al menos un producto para registrar una ronda"
      );
      return;
    }

    try {
      const roundData = productsToRound.map((product) => ({
        account_id: accountId,
        product_id: product.product_id,
        quantity: product.quantity,
        unit_price: product.unit_price,
        total_per_item: product.total_per_item,
        Product: product.Product,
      }));

      setRound(roundData);
      setIsRoundSaved(true);
      saveRoundToStorage(roundData, true);
    } catch (e) {
      console.error("Exception saving round:", e);
    }
  };

  const updateRoundItem = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      deleteRoundItem(productId);
      return;
    }

    const updatedRound = round.map((item) => {
      if (item.product_id === productId) {
        const newTotalPerItem = item.unit_price * newQuantity;
        return {
          ...item,
          quantity: newQuantity,
          total_per_item: newTotalPerItem,
        };
      }
      return item;
    });

    setRound(updatedRound);
    saveRoundToStorage(updatedRound, true);
    setEditingRoundItem(null);
  };

  const deleteRoundItem = (productId) => {
    const updatedRound = round.filter((item) => item.product_id !== productId);
    setRound(updatedRound);

    if (updatedRound.length === 0) {
      deleteEntireRound();
    } else {
      saveRoundToStorage(updatedRound, true);
    }
  };

  const deleteEntireRound = () => {
    localStorage.removeItem(`round_${accountId}`);
    localStorage.removeItem(`roundSaved_${accountId}`);
    setRound([]);
    setIsRoundSaved(false);
    setProductsToRound([]);
  };

  const addItemToRound = (product) => {
    const existingItemIndex = round.findIndex(
      (item) => item.product_id === product.product_id
    );

    if (existingItemIndex !== -1) {
      const updatedRound = [...round];
      updatedRound[existingItemIndex].quantity += product.quantity;
      updatedRound[existingItemIndex].total_per_item =
        updatedRound[existingItemIndex].unit_price *
        updatedRound[existingItemIndex].quantity;

      setRound(updatedRound);
      saveRoundToStorage(updatedRound, true);
    } else {
      const updatedRound = [...round, product];
      setRound(updatedRound);
      saveRoundToStorage(updatedRound, true);
    }
  };

  const addRound = async (round) => {
    try {
      await AccountDetailService.addRoundToAccount(accountId, round);

      alert("Ronda agregada con éxito");
      
      // Refrescar los detalles de la cuenta
      const updatedDetails = await AccountDetailService.getAccountDetails(accountId);
      setAccountDetails(updatedDetails);
      calculateTotal(updatedDetails);
    } catch (error) {
      console.error("Error adding round:", error);
      alert(`Error al agregar la ronda: ${error.message}`);
    }
  };

  const createProduct = async () => {
    try {
      const productData = {
        name: name,
        category_id: category,
        price: price, 
      };

      const newProduct = await ProductService.createProduct(productData);
      setProducts((prevProducts) => [...prevProducts, newProduct]);
      setSelectedProduct(newProduct.id);
      setOpen(false);
      alert("Producto creado con éxito");
    } catch (error) {
      console.error("Error creating product:", error);
      alert(`Error al crear producto: ${error.message}`);
    }
  };

  const openDialog = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };


  if (loading) return <div>Cargando detalles de la cuenta...</div>;

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 flex flex-col h-full">
        <h2 className="text-lg font-bold flex-shrink-0 mb-2">
          Detalles de la Cuenta
        </h2>

        {/* Mensaje de información sobre abonos */}
        {hasPayments && (
          <div className="mb-3 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded flex-shrink-0">
            <strong>⚠️ Cuenta con abonos:</strong> No se pueden agregar, eliminar productos o crear rondas en cuentas que han recibido abonos para mantener la integridad de los pagos.
          </div>
        )}

        {/* Formulario - altura fija optimizada */}
        <div className="p-3 border rounded-lg bg-gray-50 flex-shrink-0 mb-3">
          <h3 className="text-base font-semibold mb-2">Agregar Producto</h3>
          <div className="flex items-end gap-3 justify-between">
            <div className="flex gap-3 items-end">
              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel id="product-select-label">Producto</InputLabel>
                <Select
                  labelId="product-select-label"
                  value={selectedProduct}
                  label="Producto"
                  onChange={(e) => setSelectedProduct(e.target.value)}
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {product.name} - {formatCurrency(product.price)}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {product.Category?.name || "Sin categoría"}
                        </span>
                      </div>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Cantidad"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                InputProps={{ inputProps: { min: 1 } }}
                sx={{ width: 100 }}
                size="small"
              />

              <Button
                variant="contained"
                onClick={addProductToAccount}
                disabled={!selectedProduct || quantity <= 0 || hasPayments}
                size="small"
                title={hasPayments ? "No se pueden agregar productos a una cuenta con abonos" : ""}
              >
                Agregar
              </Button>
            </div>
            <Button 
              variant="contained" 
              color="success" 
              onClick={openDialog}
              size="small"
            >
              Nuevo producto
            </Button>
          </div>
        </div>
        <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Ingrese la información del nuevo producto"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <p>Nombre</p>
        <TextField
          label="Nombre del producto"
          variant="outlined"
          name="name"
          value={name}
          onChange={onInputChange}
          sx={{ marginBottom: 2 }}
        />
        <p>Precio</p>
        <TextField
          type="number"
          step="100"
          variant="outlined"
          name="price"
          value={price}
          onChange={onInputChange}
          sx={{ marginBottom: 2 }}
        />
        <p>Categoría</p>
        <Select
          labelId="category-select-label"
          id="category-select"
          name="category"
          value={category}
          label="Categoría"
          onChange={onInputChange}
          sx={{ marginBottom: 2 }}
        >
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
            </MenuItem>
          ))}
        </Select>
        
      </FormControl>
    </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={createProduct}
            autoFocus
            disabled={false}
            variant="contained"
            color="primary"
          >
            {"Crear producto"}
          </Button>
        </DialogActions>
      </Dialog>

        <div className="flex-1 overflow-hidden mb-3">
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
                  <TableCell>
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        const updatedDetails = accountDetails.map((detail) => ({
                          ...detail,
                          selected: isChecked,
                        }));
                        setAccountDetails(updatedDetails);
                        if (isChecked) {
                          setProductsToRound(updatedDetails);
                        } else {
                          setProductsToRound([]);
                        }
                      }}
                    />
                    &nbsp;Todos
                  </TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell align="right">Precio Unit.</TableCell>
                  <TableCell align="right">Cant.</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody className="">
                {accountDetails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No hay productos en esta cuenta
                    </TableCell>
                  </TableRow>
                ) : (
                  accountDetails.map((detail) => (
                    <TableRow key={detail.product_id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={detail.selected || false}
                          onChange={() => {
                            const updatedDetails = accountDetails.map((d) =>
                              d.product_id === detail.product_id
                                ? { ...d, selected: !d.selected }
                                : d
                            );
                            setAccountDetails(updatedDetails);

                            const updatedProduct = updatedDetails.find(
                              (d) => d.product_id === detail.product_id
                            );

                            if (updatedProduct.selected) {
                              setProductsToRound([
                                ...productsToRound,
                                updatedProduct,
                              ]);
                            } else {
                              setProductsToRound(
                                productsToRound.filter(
                                  (p) => p.product_id !== detail.product_id
                                )
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {detail.Product?.name}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {detail.Product?.Category?.name || "Sin categoría"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(detail.unit_price)}
                      </TableCell>
                      <TableCell align="right">{detail.quantity}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(detail.total_per_item)}
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex gap-1 items-center justify-center">
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() =>
                              removeProductFromAccount(detail.product_id)
                            }
                            sx={{ minWidth: 'auto', px: 1, fontSize: '0.75rem' }}
                            disabled={hasPayments}
                            title={hasPayments ? "No se pueden eliminar productos de una cuenta con abonos" : ""}
                          >
                            Eliminar
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => addItemToRound(detail)}
                            sx={{ minWidth: 'auto', px: 1, fontSize: '0.75rem' }}
                            disabled={hasPayments}
                            title={hasPayments ? "No se pueden agregar productos a rondas en cuentas con abonos" : ""}
                          >
                            Ronda
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow>
                  <TableCell
                    colSpan={4}
                    align="right"
                    sx={{ fontWeight: "bold", backgroundColor: "white" }}
                  >
                    Total:
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: "bold", backgroundColor: "white" }}
                  >
                    {formatCurrency(totalAmount)}
                  </TableCell>
                  <TableCell sx={{ backgroundColor: "white" }}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        <div className="flex justify-between flex-shrink-0 gap-2">

          <Button
            variant="contained"
            color="error"
            onClick={() => closeAccount(accountId)}
            size="small"
            >
            Cerrar cuenta
          </Button>

          <div className="flex gap-2">
            {isRoundSaved && (
              <Button 
                variant="outlined" 
                onClick={deleteEntireRound}
                size="small"
              >
                Cancelar ronda
              </Button>
            )}
            <Button
              variant="contained"
              disabled={productsToRound.length === 0 || isRoundSaved}
              onClick={registerRound}
              size="small"
            >
              Registrar ronda
            </Button>
          </div>
        </div>
      </div>

      <div className="w-72 flex-shrink-0">
        {isRoundSaved && (
          <div className="bg-green-100 text-green-800 p-3 rounded-lg shadow-lg h-fit">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-base">Ronda Guardada</h3>
              <Button
                size="small"
                color="error"
                onClick={deleteEntireRound}
                sx={{ minWidth: "auto", padding: "2px 6px", fontSize: '0.75rem' }}
              >
                ✕
              </Button>
            </div>

            <List
              sx={{
                width: "100%",
                bgcolor: "background.paper",
                borderRadius: 1,
                padding: '4px',
                '& .MuiListItem-root': {
                  padding: '4px 8px'
                }
              }}
            >
              {round.map((item) => (
                <ListItem key={item.product_id} className="border-b">
                  <div className="w-full">
                    <div className="flex justify-between items-center">
                      <ListItemText
                        primary={`${item.Product?.name}`}
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                        secondary={
                          editingRoundItem === item.product_id ? (
                            <div className="flex gap-1 mt-1">
                              <TextField
                                type="number"
                                size="small"
                                defaultValue={item.quantity}
                                inputProps={{ min: 1 }}
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    updateRoundItem(
                                      item.product_id,
                                      parseInt(e.target.value)
                                    );
                                  }
                                }}
                                onBlur={(e) => {
                                  updateRoundItem(
                                    item.product_id,
                                    parseInt(e.target.value)
                                  );
                                }}
                                autoFocus
                                sx={{ width: '60px' }}
                              />
                              <Button
                                size="small"
                                onClick={() => setEditingRoundItem(null)}
                                sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
                              >
                                ✓
                              </Button>
                            </div>
                          ) : (
                            `Cant: ${item.quantity} - ${formatCurrency(item.total_per_item)}`
                          )
                        }
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />

                      {editingRoundItem !== item.product_id && (
                        <div className="flex gap-1">
                          <Button
                            size="small"
                            onClick={() => setEditingRoundItem(item.product_id)}
                            sx={{ minWidth: "auto", padding: "2px 4px", fontSize: '0.75rem' }}
                          >
                            ✏️
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => deleteRoundItem(item.product_id)}
                            sx={{ minWidth: "auto", padding: "2px 4px", fontSize: '0.75rem' }}
                          >
                            🗑️
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </ListItem>
              ))}
            </List>

            <div className="mt-3">
              <Button
                variant="contained"
                onClick={() => addRound(round)}
                fullWidth
                size="small"
                disabled={hasPayments}
                title={hasPayments ? "No se pueden agregar productos a una cuenta con abonos" : ""}
              >
                Agregar a la cuenta
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
