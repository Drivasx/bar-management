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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from "@mui/material";
import { useNavigate } from "react-router";
import { formatCurrency } from "../helpers/CurrencyFormatHelper";

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ height: '100%' }}>
    {value === index && <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>{children}</Box>}
  </div>
);

export const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  
  // Estados para productos
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productSearch, setProductSearch] = useState("");
  
  // Estados para categorías
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchProducts(), fetchCategories()]);
    setLoading(false);
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("Product")
        .select(`
          id,
          name,
          price,
          category_id,
          Category (
            id,
            name
          )
        `)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching products:", error);
        alert("Error al cargar los productos");
      } else {
        setProducts(data || []);
      }
    } catch (e) {
      console.error("Exception fetching products:", e);
      alert("Error inesperado al cargar los productos");
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("Category")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error);
        alert("Error al cargar las categorías");
      } else {
        setCategories(data || []);
      }
    } catch (e) {
      console.error("Exception fetching categories:", e);
      alert("Error inesperado al cargar las categorías");
    }
  };

  // Funciones para productos
  const openEditProductDialog = (product) => {
    setProductToEdit(product);
    setProductName(product.name);
    setProductPrice(product.price.toString());
    setProductCategory(product.category_id);
    setEditProductOpen(true);
  };

  const openCreateProductDialog = () => {
    setProductName("");
    setProductPrice("");
    setProductCategory("");
    setCreateProductOpen(true);
  };

  const handleCloseEditProduct = () => {
    setEditProductOpen(false);
    setProductToEdit(null);
    setProductName("");
    setProductPrice("");
    setProductCategory("");
  };

  const handleCloseCreateProduct = () => {
    setCreateProductOpen(false);
    setProductName("");
    setProductPrice("");
    setProductCategory("");
  };

  const createProduct = async () => {
    if (!productName.trim() || !productPrice || !productCategory) {
      alert("Por favor, complete todos los campos");
      return;
    }

    const price = parseFloat(productPrice);
    if (isNaN(price) || price <= 0) {
      alert("Por favor, ingrese un precio válido");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("Product")
        .insert([{
          name: productName.trim(),
          price: price,
          category_id: productCategory
        }])
        .select();

      if (error) {
        console.error("Error creating product:", error);
        alert("Error al crear el producto");
        return;
      }

      alert("Producto creado exitosamente");
      await fetchProducts();
      handleCloseCreateProduct();
    } catch (e) {
      console.error("Exception creating product:", e);
      alert("Error inesperado al crear el producto");
    }
  };

  const editProduct = async () => {
    if (!productName.trim() || !productPrice || !productCategory) {
      alert("Por favor, complete todos los campos");
      return;
    }

    const price = parseFloat(productPrice);
    if (isNaN(price) || price <= 0) {
      alert("Por favor, ingrese un precio válido");
      return;
    }

    try {
      const { error } = await supabase
        .from("Product")
        .update({
          name: productName.trim(),
          price: price,
          category_id: productCategory
        })
        .eq("id", productToEdit.id);

      if (error) {
        console.error("Error updating product:", error);
        alert("Error al actualizar el producto");
        return;
      }

      alert("Producto actualizado exitosamente");
      await fetchProducts();
      handleCloseEditProduct();
    } catch (e) {
      console.error("Exception updating product:", e);
      alert("Error inesperado al actualizar el producto");
    }
  };

  const deleteProduct = async (productId, productName) => {
    // Verificar si el producto está siendo usado en cuentas
    try {
      const { data: accountDetails, error: accountDetailsError } = await supabase
        .from("AccountDetail")
        .select("id")
        .eq("product_id", productId);

      if (accountDetailsError) {
        console.error("Error checking product usage:", accountDetailsError);
        alert("Error al verificar el uso del producto");
        return;
      }

      if (accountDetails && accountDetails.length > 0) {
        alert(
          `No se puede eliminar este producto porque está siendo usado en ${accountDetails.length} cuenta(s). ` +
          "Primero debe eliminar el producto de todas las cuentas."
        );
        return;
      }

      if (!window.confirm(`¿Está seguro de que desea eliminar el producto "${productName}"? Esta acción no se puede deshacer.`)) {
        return;
      }

      const { error } = await supabase
        .from("Product")
        .delete()
        .eq("id", productId);

      if (error) {
        console.error("Error deleting product:", error);
        alert("Error al eliminar el producto");
        return;
      }

      alert("Producto eliminado exitosamente");
      await fetchProducts();
    } catch (e) {
      console.error("Exception deleting product:", e);
      alert("Error inesperado al eliminar el producto");
    }
  };

  // Funciones para categorías
  const openEditCategoryDialog = (category) => {
    setCategoryToEdit(category);
    setCategoryName(category.name);
    setEditCategoryOpen(true);
  };

  const openCreateCategoryDialog = () => {
    setCategoryName("");
    setCreateCategoryOpen(true);
  };

  const handleCloseEditCategory = () => {
    setEditCategoryOpen(false);
    setCategoryToEdit(null);
    setCategoryName("");
  };

  const handleCloseCreateCategory = () => {
    setCreateCategoryOpen(false);
    setCategoryName("");
  };

  const createCategory = async () => {
    if (!categoryName.trim()) {
      alert("Por favor, ingrese un nombre válido");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("Category")
        .insert([{ name: categoryName.trim() }])
        .select();

      if (error) {
        console.error("Error creating category:", error);
        alert("Error al crear la categoría");
        return;
      }

      alert("Categoría creada exitosamente");
      await fetchCategories();
      handleCloseCreateCategory();
    } catch (e) {
      console.error("Exception creating category:", e);
      alert("Error inesperado al crear la categoría");
    }
  };

  const editCategory = async () => {
    if (!categoryName.trim()) {
      alert("Por favor, ingrese un nombre válido");
      return;
    }

    try {
      const { error } = await supabase
        .from("Category")
        .update({ name: categoryName.trim() })
        .eq("id", categoryToEdit.id);

      if (error) {
        console.error("Error updating category:", error);
        alert("Error al actualizar la categoría");
        return;
      }

      alert("Categoría actualizada exitosamente");
      await fetchCategories();
      handleCloseEditCategory();
    } catch (e) {
      console.error("Exception updating category:", e);
      alert("Error inesperado al actualizar la categoría");
    }
  };

  const deleteCategory = async (categoryId, categoryName) => {
    // Verificar si la categoría tiene productos asociados
    try {
      const { data: products, error: productsError } = await supabase
        .from("Product")
        .select("id")
        .eq("category_id", categoryId);

      if (productsError) {
        console.error("Error checking category products:", productsError);
        alert("Error al verificar los productos de la categoría");
        return;
      }

      if (products && products.length > 0) {
        alert(
          `No se puede eliminar esta categoría porque tiene ${products.length} producto(s) asociado(s). ` +
          "Primero debe eliminar o cambiar la categoría de todos los productos."
        );
        return;
      }

      if (!window.confirm(`¿Está seguro de que desea eliminar la categoría "${categoryName}"? Esta acción no se puede deshacer.`)) {
        return;
      }

      const { error } = await supabase
        .from("Category")
        .delete()
        .eq("id", categoryId);

      if (error) {
        console.error("Error deleting category:", error);
        alert("Error al eliminar la categoría");
        return;
      }

      alert("Categoría eliminada exitosamente");
      await fetchCategories();
    } catch (e) {
      console.error("Exception deleting category:", e);
      alert("Error inesperado al eliminar la categoría");
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Cargando productos y categorías...</div>
      </div>
    );
  }

  return (
    <main className="flex flex-col h-screen overflow-hidden px-4 py-2">
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <h1 className="text-2xl font-bold">Gestión de Productos y Categorías</h1>
        <Button 
          variant="outlined" 
          onClick={() => navigate("/")}
          size="small"
        >
          Volver a Cuentas
        </Button>
      </div>

      <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Productos" />
            <Tab label="Categorías" />
          </Tabs>
        </Box>

        {/* Panel de Productos */}
        <TabPanel value={tabValue} index={0}>
          <div className="flex gap-3 mb-3 p-3 bg-gray-50 rounded-lg flex-shrink-0">
            <div className="flex-1">
              <TextField
                placeholder="Buscar producto por nombre"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                size="small"
                fullWidth
              />
            </div>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={openCreateProductDialog}
              size="small"
            >
              Nuevo Producto
            </Button>
          </div>

          <div className="flex-1 overflow-hidden">
            <TableContainer
              className="w-full h-full"
              component={Paper}
              sx={{ maxHeight: "100%", overflow: "auto" }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell align="right">Precio</TableCell>
                    <TableCell>Categoría</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        {productSearch ? "No se encontraron productos con ese nombre" : "No hay productos registrados"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <span className="font-medium">{product.name}</span>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(product.price)}
                        </TableCell>
                        <TableCell>
                          {product.Category?.name || "Sin categoría"}
                        </TableCell>
                        <TableCell align="center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => openEditProductDialog(product)}
                              sx={{ minWidth: 'auto', px: 1, fontSize: '0.75rem' }}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => deleteProduct(product.id, product.name)}
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
        </TabPanel>

        {/* Panel de Categorías */}
        <TabPanel value={tabValue} index={1}>
          <div className="flex gap-3 mb-3 p-3 bg-gray-50 rounded-lg flex-shrink-0">
            <div className="flex-1">
              <TextField
                placeholder="Buscar categoría por nombre"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                size="small"
                fullWidth
              />
            </div>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={openCreateCategoryDialog}
              size="small"
            >
              Nueva Categoría
            </Button>
          </div>

          <div className="flex-1 overflow-hidden">
            <TableContainer
              className="w-full h-full"
              component={Paper}
              sx={{ maxHeight: "100%", overflow: "auto" }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        {categorySearch ? "No se encontraron categorías con ese nombre" : "No hay categorías registradas"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <span className="font-medium">{category.name}</span>
                        </TableCell>
                        <TableCell align="center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => openEditCategoryDialog(category)}
                              sx={{ minWidth: 'auto', px: 1, fontSize: '0.75rem' }}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => deleteCategory(category.id, category.name)}
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
        </TabPanel>
      </Box>

      {/* Diálogos para Productos */}
      <Dialog
        open={createProductOpen}
        onClose={handleCloseCreateProduct}
        aria-labelledby="create-product-dialog-title"
      >
        <DialogTitle id="create-product-dialog-title">
          Crear Nuevo Producto
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              autoFocus
              label="Nombre del producto"
              fullWidth
              variant="outlined"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
            <TextField
              label="Precio"
              type="number"
              fullWidth
              variant="outlined"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={productCategory}
                label="Categoría"
                onChange={(e) => setProductCategory(e.target.value)}
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
          <Button onClick={handleCloseCreateProduct}>Cancelar</Button>
          <Button
            onClick={createProduct}
            variant="contained"
            color="primary"
            disabled={!productName.trim() || !productPrice || !productCategory}
          >
            Crear Producto
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editProductOpen}
        onClose={handleCloseEditProduct}
        aria-labelledby="edit-product-dialog-title"
      >
        <DialogTitle id="edit-product-dialog-title">
          Editar Producto
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              autoFocus
              label="Nombre del producto"
              fullWidth
              variant="outlined"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
            <TextField
              label="Precio"
              type="number"
              fullWidth
              variant="outlined"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={productCategory}
                label="Categoría"
                onChange={(e) => setProductCategory(e.target.value)}
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
          <Button onClick={handleCloseEditProduct}>Cancelar</Button>
          <Button
            onClick={editProduct}
            variant="contained"
            color="primary"
            disabled={!productName.trim() || !productPrice || !productCategory}
          >
            Actualizar Producto
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogos para Categorías */}
      <Dialog
        open={createCategoryOpen}
        onClose={handleCloseCreateCategory}
        aria-labelledby="create-category-dialog-title"
      >
        <DialogTitle id="create-category-dialog-title">
          Crear Nueva Categoría
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              label="Nombre de la categoría"
              fullWidth
              variant="outlined"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  createCategory();
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateCategory}>Cancelar</Button>
          <Button
            onClick={createCategory}
            variant="contained"
            color="primary"
            disabled={!categoryName.trim()}
          >
            Crear Categoría
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editCategoryOpen}
        onClose={handleCloseEditCategory}
        aria-labelledby="edit-category-dialog-title"
      >
        <DialogTitle id="edit-category-dialog-title">
          Editar Categoría
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              label="Nombre de la categoría"
              fullWidth
              variant="outlined"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  editCategory();
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditCategory}>Cancelar</Button>
          <Button
            onClick={editCategory}
            variant="contained"
            color="primary"
            disabled={!categoryName.trim()}
          >
            Actualizar Categoría
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
};
