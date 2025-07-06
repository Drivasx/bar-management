import supabase from "../utils/SupabaseClient";

/**
 * Servicio para manejar operaciones CRUD de productos
 */
export class ProductService {

  /**
   * Obtener todos los productos con sus categorías
   */
  static async getAllProducts() {
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
        .order("name");

      if (error) {
        throw new Error(`Error fetching products: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Exception in getAllProducts:", error);
      throw error;
    }
  }

  /**
   * Obtener un producto por ID
   */
  static async getProductById(productId) {
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
        .eq("id", productId)
        .single();

      if (error) {
        throw new Error(`Error fetching product: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Exception in getProductById:", error);
      throw error;
    }
  }

  /**
   * Crear un nuevo producto
   */
  static async createProduct(productData) {
    try {
      const { name, price, category_id } = productData;

      if (!name || !price || !category_id) {
        throw new Error("Name, price and category are required");
      }

      const { data, error } = await supabase
        .from("Product")
        .insert({
          name: name.trim(),
          price: parseFloat(price),
          category_id: parseInt(category_id)
        })
        .select(`
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
        throw new Error(`Error creating product: ${error.message}`);
      }

      return data[0];
    } catch (error) {
      console.error("Exception in createProduct:", error);
      throw error;
    }
  }

  /**
   * Actualizar un producto
   */
  static async updateProduct(productId, productData) {
    try {
      const { name, price, category_id } = productData;

      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (price !== undefined) updateData.price = parseFloat(price);
      if (category_id !== undefined) updateData.category_id = parseInt(category_id);

      const { data, error } = await supabase
        .from("Product")
        .update(updateData)
        .eq("id", productId)
        .select(`
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
        throw new Error(`Error updating product: ${error.message}`);
      }

      return data[0];
    } catch (error) {
      console.error("Exception in updateProduct:", error);
      throw error;
    }
  }

  /**
   * Eliminar un producto
   */
  static async deleteProduct(productId) {
    try {
      // Verificar si el producto está siendo usado en alguna cuenta
      const { data: accountDetails, error: checkError } = await supabase
        .from("AccountDetail")
        .select("account_id")
        .eq("product_id", productId)
        .limit(1);

      if (checkError) {
        throw new Error(`Error checking product usage: ${checkError.message}`);
      }

      if (accountDetails && accountDetails.length > 0) {
        throw new Error("No se puede eliminar el producto porque está siendo usado en una o más cuentas");
      }

      const { error } = await supabase
        .from("Product")
        .delete()
        .eq("id", productId);

      if (error) {
        throw new Error(`Error deleting product: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error("Exception in deleteProduct:", error);
      throw error;
    }
  }

  /**
   * Buscar productos por nombre
   */
  static async searchProducts(searchTerm) {
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
        .ilike("name", `%${searchTerm}%`)
        .order("name");

      if (error) {
        throw new Error(`Error searching products: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Exception in searchProducts:", error);
      throw error;
    }
  }

  /**
   * Obtener productos por categoría
   */
  static async getProductsByCategory(categoryId) {
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
        .eq("category_id", categoryId)
        .order("name");

      if (error) {
        throw new Error(`Error fetching products by category: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Exception in getProductsByCategory:", error);
      throw error;
    }
  }
}
