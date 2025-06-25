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

export const AccountDetails = ({ accountId, setAccounts, setValue }) => {
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

  const initialForm = {
    name: "",
    price: 0,
    category: 1,
  };

  const {formState, setFormState, onInputChange} = useForm(initialForm);

  const { name, price, category } = formState;

  useEffect(() => {
    if (!accountId) return;

    const fetchAccountDetails = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("AccountDetail")
          .select(
            `
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
          `
          )
          .eq("account_id", accountId);

        if (error) {
          console.error("Error fetching account details:", error);
        } else {
          setAccountDetails(data || []);
          calculateTotal(data);
        }
      } catch (e) {
        console.error("Exception in fetchAccountDetails:", e);
      } finally {
        setLoading(false);
      }
    };

    const fetchProducts = async () => {
      const { data, error } = await supabase.from("Product").select(`
          id, 
          name, 
          price, 
          category_id,
          Category (
            id,
            name
          )
        `);

      if (error) {
        console.error("Error fetching products:", error);
      } else {
        setProducts(data || []);
      }
    };

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
      const { data, error } = await supabase.from("Category").select("*");
      if (error) {
        console.error("Error fetching categories:", error);
      } else {
        setCategories(data || []);
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
    await supabase
      .from("Account")
      .update({ total_amount: total })
      .eq("id", accountId);
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
      const totalPerItem = unitPrice * quantity;

      const existingItem = accountDetails.find(
        (item) => item.product_id === Number(selectedProduct)
      );

      let result;
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        const newTotal = unitPrice * newQuantity;

        result = await supabase
          .from("AccountDetail")
          .update({
            quantity: newQuantity,
            total_per_item: newTotal,
          })
          .eq("account_id", accountId)
          .eq("product_id", selectedProduct)
          .select();
      } else {
        result = await supabase
          .from("AccountDetail")
          .insert({
            account_id: accountId,
            product_id: selectedProduct,
            quantity: quantity,
            unit_price: unitPrice,
            total_per_item: totalPerItem,
          })
          .select();
      }

      if (result.error) {
        console.error("Error adding product to account:", result.error);
        alert("Error al agregar producto");
      } else {
        const { data } = await supabase
          .from("AccountDetail")
          .select(
            `
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
          `
          )
          .eq("account_id", accountId);

        setAccountDetails(data || []);
        calculateTotal(data);

        setSelectedProduct("");
        setQuantity(1);
      }
    } catch (e) {
      console.error("Exception adding product:", e);
    }
  };

  const removeProductFromAccount = async (productId) => {
    try {
      const { error } = await supabase
        .from("AccountDetail")
        .delete()
        .eq("account_id", accountId)
        .eq("product_id", productId);

      if (error) {
        console.error("Error removing product:", error);
        alert("Error al eliminar producto");
      } else {
        const updatedDetails = accountDetails.filter(
          (item) => item.product_id !== productId
        );
        setAccountDetails(updatedDetails);
        calculateTotal(updatedDetails);
      }
    } catch (e) {
      console.error("Exception removing product:", e);
    }
  };

  const closeAccount = async (accountId) => {
    try {
      const { error } = await supabase
        .from("Account")
        .update({
          status: "CLOSED",
          close_date: new Date().toISOString(),
          total_amount: totalAmount,
        })
        .eq("id", accountId);
      if (error) {
        console.error("Error closing account:", error);
        alert("Error al cerrar la cuenta: " + error.message);
      } else {
        console.log("Account closed successfully");
        setAccounts((prevAccounts) =>
          prevAccounts.filter((account) => account.id !== accountId)
        );
        setValue(5); 
      }
    } catch (e) {
      console.error("Exception in closeAccount:", e);
      alert("Error inesperado al cerrar la cuenta");
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

      console.log("Ronda registrada con éxito");
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
      for (const item of round) {
        const { Product, ...itemData } = item;

        const existingItem = accountDetails.find(
          (detail) => detail.product_id === item.product_id
        );

        if (existingItem) {
          const newQuantity = existingItem.quantity + item.quantity;
          const newTotalPerItem = existingItem.unit_price * newQuantity;

          const { error } = await supabase
            .from("AccountDetail")
            .update({
              quantity: newQuantity,
              total_per_item: newTotalPerItem,
            })
            .eq("account_id", accountId)
            .eq("product_id", item.product_id);

          if (error) {
            console.error("Error updating item:", error);
            throw error;
          }
        } else {
          const { error } = await supabase
            .from("AccountDetail")
            .insert(itemData);

          if (error) {
            console.error("Error inserting item:", error);
            throw error;
          }
        }
      }

      alert("Ronda agregada con éxito");
      const { data } = await supabase
        .from("AccountDetail")
        .select(
          `
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
          `
        )
        .eq("account_id", accountId);

      setAccountDetails(data || []);
      calculateTotal(data);
    } catch (e) {
      console.error("Error adding round:", e);
      alert("Error al agregar la ronda");
    }
  };

  const createProduct = async () => {
    const productData = {
      name: name,
      category_id: category,
      price: price, 
    };
    try {
      const { data, error } = await supabase
        .from("Product")
        .insert(productData)
        .select(`
          id,
          name,
          price,
          category_id,
          Category (
            id,
            name
          )`);
      if (error) {
        console.error("Error creating product:", error);
        alert("Error al crear producto");
      } else {
        const newProduct = data[0];
        setProducts((prevProducts) => [...prevProducts, newProduct]);
        setSelectedProduct(newProduct.id);
        setOpen(false);
        alert("Producto creado con éxito");
      }
    } catch (e) {
      console.error("Exception creating product:", e);
      alert("Error inesperado al crear producto");
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
    <div className="flex gap-6 h-full">
      <div className="flex-1 flex flex-col h-full">
        <h2 className="text-xl font-bold flex-shrink-0">
          Detalles de la Cuenta
        </h2>

        {/* Formulario - altura fija */}
        <div className="p-4 border rounded-lg bg-gray-50 flex-shrink-0 mb-4">
          <h3 className="text-lg font-semibold mb-3">Agregar Producto</h3>
          <div className="flex items-end gap-4 justify-between">
            <div className="flex gap-4 items-end">
              <FormControl sx={{ minWidth: 250 }}>
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
                        <span>
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
                sx={{ width: 120 }}
              />

              <Button
                variant="contained"
                onClick={addProductToAccount}
                disabled={!selectedProduct || quantity <= 0}
                sx={{ height: 56 }}
              >
                Agregar
              </Button>
            </div>
            <Button variant="contained" color="success" onClick={openDialog}>Registrar nuevo producto</Button>
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

        <div className="flex-1 overflow-hidden mb-4">
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
                        console.log("Todos seleccionados:", isChecked);
                        console.log("Detalles actualizados:", updatedDetails);
                      }}
                    />
                    &nbsp;&nbsp;Todos
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: "bold", backgroundColor: "white" }}
                  >
                    Producto
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: "bold", backgroundColor: "white" }}
                    align="right"
                  >
                    Precio Unitario
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: "bold", backgroundColor: "white" }}
                    align="right"
                  >
                    Cantidad
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
                      <TableCell align="center">
                        <Button
                          sx={{ marginRight: 1 }}
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() =>
                            removeProductFromAccount(detail.product_id)
                          }
                        >
                          Eliminar
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() =>
                            addItemToRound(detail)
                          }
                        >
                          Agregar a la ronda
                        </Button>
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

        {/* Botones inferiores - altura fija, siempre visibles */}
        <div className="flex justify-between flex-shrink-0">
          <Button
            variant="contained"
            color="error"
            onClick={() => closeAccount(accountId)}
          >
            Cerrar cuenta
          </Button>
          <div className="flex gap-2">
            {isRoundSaved && (
              <Button variant="outlined" onClick={deleteEntireRound}>
                Cancelar ronda
              </Button>
            )}
            <Button
              variant="contained"
              disabled={productsToRound.length === 0 || isRoundSaved}
              onClick={registerRound}
            >
              Registrar una ronda
            </Button>
          </div>
        </div>
      </div>

      {/* Panel de ronda - fijo en el lado derecho */}
      <div className="w-80 flex-shrink-0">
        {isRoundSaved && (
          <div className="bg-green-100 text-green-800 p-4 rounded-lg shadow-lg h-fit">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-lg">Ronda Guardada</h3>
              <Button
                size="small"
                color="error"
                onClick={deleteEntireRound}
                sx={{ minWidth: "auto", padding: "4px 8px" }}
              >
                ✕
              </Button>
            </div>

            <List
              sx={{
                width: "100%",
                bgcolor: "background.paper",
                borderRadius: 1,
              }}
            >
              {round.map((item) => (
                <ListItem key={item.product_id} className="border-b">
                  <div className="w-full">
                    <div className="flex justify-between items-center">
                      <ListItemText
                        primary={`${item.Product?.name}`}
                        secondary={
                          editingRoundItem === item.product_id ? (
                            <div className="flex gap-2 mt-1">
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
                              />
                              <Button
                                size="small"
                                onClick={() => setEditingRoundItem(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            `Cantidad: ${
                              item.quantity
                            } - Total: ${formatCurrency(item.total_per_item)}`
                          )
                        }
                      />

                      {editingRoundItem !== item.product_id && (
                        <div className="flex gap-1">
                          <Button
                            size="small"
                            onClick={() => setEditingRoundItem(item.product_id)}
                            sx={{ minWidth: "auto", padding: "4px 8px" }}
                          >
                            ✏️
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => deleteRoundItem(item.product_id)}
                            sx={{ minWidth: "auto", padding: "4px 8px" }}
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

            <div className="mt-4">
              <Button
                variant="contained"
                onClick={() => addRound(round)}
                fullWidth
                size="large"
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
