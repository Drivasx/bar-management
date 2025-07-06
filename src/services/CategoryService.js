import supabase from "../utils/SupabaseClient";

/**
 * Servicio para manejar operaciones CRUD de categorías
 */
export class CategoryService {

  /**
   * Obtener todas las categorías
   */
  static async getAllCategories() {
    try {
      const { data, error } = await supabase
        .from("Category")
        .select("*")
        .order("name");

      if (error) {
        throw new Error(`Error fetching categories: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Exception in getAllCategories:", error);
      throw error;
    }
  }

  /**
   * Obtener una categoría por ID
   */
  static async getCategoryById(categoryId) {
    try {
      const { data, error } = await supabase
        .from("Category")
        .select("*")
        .eq("id", categoryId)
        .single();

      if (error) {
        throw new Error(`Error fetching category: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Exception in getCategoryById:", error);
      throw error;
    }
  }

  /**
   * Crear una nueva categoría
   */
  static async createCategory(categoryData) {
    try {
      const { name } = categoryData;

      if (!name || !name.trim()) {
        throw new Error("Category name is required");
      }

      const { data, error } = await supabase
        .from("Category")
        .insert({
          name: name.trim()
        })
        .select();

      if (error) {
        throw new Error(`Error creating category: ${error.message}`);
      }

      return data[0];
    } catch (error) {
      console.error("Exception in createCategory:", error);
      throw error;
    }
  }

  /**
   * Actualizar una categoría
   */
  static async updateCategory(categoryId, categoryData) {
    try {
      const { name } = categoryData;

      if (!name || !name.trim()) {
        throw new Error("Category name is required");
      }

      const { data, error } = await supabase
        .from("Category")
        .update({
          name: name.trim()
        })
        .eq("id", categoryId)
        .select();

      if (error) {
        throw new Error(`Error updating category: ${error.message}`);
      }

      return data[0];
    } catch (error) {
      console.error("Exception in updateCategory:", error);
      throw error;
    }
  }

  /**
   * Eliminar una categoría
   */
  static async deleteCategory(categoryId) {
    try {
      // Verificar si la categoría está siendo usada por productos
      const { data: products, error: checkError } = await supabase
        .from("Product")
        .select("id")
        .eq("category_id", categoryId)
        .limit(1);

      if (checkError) {
        throw new Error(`Error checking category usage: ${checkError.message}`);
      }

      if (products && products.length > 0) {
        throw new Error("No se puede eliminar la categoría porque tiene productos asociados");
      }

      const { error } = await supabase
        .from("Category")
        .delete()
        .eq("id", categoryId);

      if (error) {
        throw new Error(`Error deleting category: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error("Exception in deleteCategory:", error);
      throw error;
    }
  }

  /**
   * Buscar categorías por nombre
   */
  static async searchCategories(searchTerm) {
    try {
      const { data, error } = await supabase
        .from("Category")
        .select("*")
        .ilike("name", `%${searchTerm}%`)
        .order("name");

      if (error) {
        throw new Error(`Error searching categories: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Exception in searchCategories:", error);
      throw error;
    }
  }
}
