import supabase from "../utils/SupabaseClient";

/**
 * Servicio para manejar operaciones CRUD de cuentas
 */
export class AccountService {
  
  /**
   * Obtener todas las cuentas con sus totales calculados
   */
  static async getAllAccounts() {
    try {
      const { data: accounts, error } = await supabase
        .from("Account")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(`Error fetching accounts: ${error.message}`);
      }

      if (accounts && accounts.length > 0) {
        // Calcular totales para cada cuenta
        const accountsWithTotals = await Promise.all(
          accounts.map(async (account) => {
            const { data: details, error: detailsError } = await supabase
              .from("AccountDetail")
              .select("total_per_item")
              .eq("account_id", account.id);
            
            if (!detailsError && details) {
              const totalAmount = details.reduce((sum, item) => sum + (item.total_per_item || 0), 0);
              return { ...account, total_amount: totalAmount };
            }
            return account;
          })
        );
        
        return accountsWithTotals;
      }
      
      return [];
    } catch (error) {
      console.error("Exception in getAllAccounts:", error);
      throw error;
    }
  }

  /**
   * Obtener información de una cuenta específica
   */
  static async getAccountById(accountId) {
    try {
      const { data, error } = await supabase
        .from("Account")
        .select("*")
        .eq("id", accountId)
        .single();

      if (error) {
        throw new Error(`Error fetching account: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Exception in getAccountById:", error);
      throw error;
    }
  }

  /**
   * Crear una nueva cuenta
   */
  static async createAccount(clientId) {
    try {
      if (!clientId) {
        throw new Error("Client ID is required");
      }

      const { data, error } = await supabase
        .from("Account")
        .insert([{ client_id: clientId }])
        .select();

      if (error) {
        throw new Error(`Error creating account: ${error.message}`);
      }

      return data[0];
    } catch (error) {
      console.error("Exception in createAccount:", error);
      throw error;
    }
  }

  /**
   * Actualizar una cuenta
   */
  static async updateAccount(accountId, updates) {
    try {
      const { data, error } = await supabase
        .from("Account")
        .update(updates)
        .eq("id", accountId)
        .select();

      if (error) {
        throw new Error(`Error updating account: ${error.message}`);
      }

      return data[0];
    } catch (error) {
      console.error("Exception in updateAccount:", error);
      throw error;
    }
  }

  /**
   * Eliminar una cuenta y todos sus detalles
   */
  static async deleteAccount(accountId) {
    try {
      // Primero eliminar los detalles de la cuenta
      const { error: detailsError } = await supabase
        .from("AccountDetail")
        .delete()
        .eq("account_id", accountId);

      if (detailsError) {
        throw new Error(`Error deleting account details: ${detailsError.message}`);
      }

      // Luego eliminar la cuenta
      const { error: accountError } = await supabase
        .from("Account")
        .delete()
        .eq("id", accountId);

      if (accountError) {
        throw new Error(`Error deleting account: ${accountError.message}`);
      }

      return true;
    } catch (error) {
      console.error("Exception in deleteAccount:", error);
      throw error;
    }
  }

  /**
   * Cerrar una cuenta
   */
  static async closeAccount(accountId, totalAmount) {
    try {
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
        .eq("id", accountId)
        .select();
        
      if (error) {
        throw new Error(`Error closing account: ${error.message}`);
      }

      return data[0];
    } catch (error) {
      console.error("Exception in closeAccount:", error);
      throw error;
    }
  }

  /**
   * Actualizar el total de una cuenta
   */
  static async updateAccountTotal(accountId, total) {
    try {
      const { error } = await supabase
        .from("Account")
        .update({ total_amount: total })
        .eq("id", accountId);

      if (error) {
        throw new Error(`Error updating account total: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error("Exception in updateAccountTotal:", error);
      throw error;
    }
  }

  /**
   * Combinar cuentas
   */
  static async combineAccounts(targetAccountId, accountIdsToCombine) {
    try {
      if (!targetAccountId || !accountIdsToCombine || accountIdsToCombine.length === 0) {
        throw new Error("Target account and accounts to combine are required");
      }

      // Obtener todos los detalles de las cuentas a combinar
      for (const accountId of accountIdsToCombine) {
        const { data: accountDetails, error: detailsError } = await supabase
          .from("AccountDetail")
          .select("*")
          .eq("account_id", accountId);

        if (detailsError) {
          console.error("Error fetching account details:", detailsError);
          continue;
        }

        for (const detail of accountDetails) {
          const { data: existingDetail, error: checkError } = await supabase
            .from("AccountDetail")
            .select("*")
            .eq("account_id", targetAccountId)
            .eq("product_id", detail.product_id)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            console.error("Error checking existing detail:", checkError);
            continue;
          }

          if (existingDetail) {
            const newQuantity = existingDetail.quantity + detail.quantity;
            const newTotal = existingDetail.unit_price * newQuantity;

            const { error: updateError } = await supabase
              .from("AccountDetail")
              .update({
                quantity: newQuantity,
                total_per_item: newTotal
              })
              .eq("account_id", targetAccountId)
              .eq("product_id", detail.product_id);

            if (updateError) {
              console.error("Error updating existing detail:", updateError);
            }
          } else {
            const { error: insertError } = await supabase
              .from("AccountDetail")
              .insert({
                account_id: targetAccountId,
                product_id: detail.product_id,
                quantity: detail.quantity,
                unit_price: detail.unit_price,
                total_per_item: detail.total_per_item
              });

            if (insertError) {
              console.error("Error inserting new detail:", insertError);
            }
          }
        }

        // Eliminar los detalles de la cuenta antes de eliminarla
        const { error: deleteDetailsError } = await supabase
          .from("AccountDetail")
          .delete()
          .eq("account_id", accountId);

        if (deleteDetailsError) {
          console.error("Error deleting account details:", deleteDetailsError);
        }

        // Eliminar la cuenta combinada completamente
        const { error: deleteError } = await supabase
          .from("Account")
          .delete()
          .eq("id", accountId);

        if (deleteError) {
          console.error("Error deleting combined account:", deleteError);
        }
      }

      // Actualizar el total de la cuenta destino
      const { data: finalDetails, error: finalError } = await supabase
        .from("AccountDetail")
        .select("total_per_item")
        .eq("account_id", targetAccountId);

      if (!finalError && finalDetails) {
        const totalAmount = finalDetails.reduce((sum, item) => sum + item.total_per_item, 0);
        
        await supabase
          .from("Account")
          .update({ total_amount: totalAmount })
          .eq("id", targetAccountId);
      }

      return true;
    } catch (error) {
      console.error("Exception in combineAccounts:", error);
      throw error;
    }
  }
}
