import supabase from "../utils/SupabaseClient";

/**
 * Servicio para manejar operaciones CRUD de detalles de cuenta
 */
export class AccountDetailService {

  /**
   * Obtener todos los detalles de una cuenta
   */
  static async getAccountDetails(accountId) {
    try {
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
        throw new Error(`Error fetching account details: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Exception in getAccountDetails:", error);
      throw error;
    }
  }

  /**
   * Agregar un producto a una cuenta
   */
  static async addProductToAccount(accountId, productId, quantity, unitPrice) {
    try {
      if (!accountId || !productId || quantity <= 0) {
        throw new Error("Invalid parameters for adding product to account");
      }

      const totalPerItem = unitPrice * quantity;

      // Verificar si el producto ya existe en la cuenta
      const { data: existingItem, error: checkError } = await supabase
        .from("AccountDetail")
        .select("*")
        .eq("account_id", accountId)
        .eq("product_id", productId)
        .single();

      let result;
      if (existingItem && checkError?.code !== 'PGRST116') {
        // El producto ya existe, actualizar cantidad
        const newQuantity = existingItem.quantity + quantity;
        const newTotal = unitPrice * newQuantity;

        result = await supabase
          .from("AccountDetail")
          .update({
            quantity: newQuantity,
            total_per_item: newTotal,
          })
          .eq("account_id", accountId)
          .eq("product_id", productId)
          .select();
      } else {
        // El producto no existe, crear nuevo registro
        result = await supabase
          .from("AccountDetail")
          .insert({
            account_id: accountId,
            product_id: productId,
            quantity: quantity,
            unit_price: unitPrice,
            total_per_item: totalPerItem,
          })
          .select();
      }

      if (result.error) {
        throw new Error(`Error adding product to account: ${result.error.message}`);
      }

      return result.data[0];
    } catch (error) {
      console.error("Exception in addProductToAccount:", error);
      throw error;
    }
  }

  /**
   * Eliminar un producto de una cuenta
   */
  static async removeProductFromAccount(accountId, productId) {
    try {
      const { error } = await supabase
        .from("AccountDetail")
        .delete()
        .eq("account_id", accountId)
        .eq("product_id", productId);

      if (error) {
        throw new Error(`Error removing product from account: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error("Exception in removeProductFromAccount:", error);
      throw error;
    }
  }

  /**
   * Actualizar la cantidad de un producto en una cuenta
   */
  static async updateProductQuantity(accountId, productId, newQuantity, unitPrice) {
    try {
      if (newQuantity <= 0) {
        // Si la cantidad es 0 o negativa, eliminar el producto
        return await this.removeProductFromAccount(accountId, productId);
      }

      const newTotal = unitPrice * newQuantity;

      const { data, error } = await supabase
        .from("AccountDetail")
        .update({
          quantity: newQuantity,
          total_per_item: newTotal,
        })
        .eq("account_id", accountId)
        .eq("product_id", productId)
        .select();

      if (error) {
        throw new Error(`Error updating product quantity: ${error.message}`);
      }

      return data[0];
    } catch (error) {
      console.error("Exception in updateProductQuantity:", error);
      throw error;
    }
  }

  /**
   * Agregar múltiples productos (ronda) a una cuenta
   */
  static async addRoundToAccount(accountId, roundItems) {
    try {
      for (const item of roundItems) {
        const { Product, ...itemData } = item;

        const existingItem = await this.getAccountDetailByProduct(accountId, item.product_id);

        if (existingItem) {
          // Producto ya existe, actualizar cantidad
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
            throw new Error(`Error updating item in round: ${error.message}`);
          }
        } else {
          // Producto no existe, crear nuevo
          const { error } = await supabase
            .from("AccountDetail")
            .insert(itemData);

          if (error) {
            throw new Error(`Error inserting item in round: ${error.message}`);
          }
        }
      }

      return true;
    } catch (error) {
      console.error("Exception in addRoundToAccount:", error);
      throw error;
    }
  }

  /**
   * Obtener un detalle específico de cuenta por producto
   */
  static async getAccountDetailByProduct(accountId, productId) {
    try {
      const { data, error } = await supabase
        .from("AccountDetail")
        .select("*")
        .eq("account_id", accountId)
        .eq("product_id", productId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Error fetching account detail: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Exception in getAccountDetailByProduct:", error);
      throw error;
    }
  }

  /**
   * Calcular el total de una cuenta
   */
  static async calculateAccountTotal(accountId) {
    try {
      const details = await this.getAccountDetails(accountId);
      const total = details.reduce((sum, item) => sum + (item.total_per_item || 0), 0);
      return total;
    } catch (error) {
      console.error("Exception in calculateAccountTotal:", error);
      throw error;
    }
  }

  /**
   * Eliminar todos los detalles de una cuenta
   */
  static async deleteAllAccountDetails(accountId) {
    try {
      const { error } = await supabase
        .from("AccountDetail")
        .delete()
        .eq("account_id", accountId);

      if (error) {
        throw new Error(`Error deleting all account details: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error("Exception in deleteAllAccountDetails:", error);
      throw error;
    }
  }
}
