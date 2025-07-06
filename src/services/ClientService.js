import supabase from "../utils/SupabaseClient";

/**
 * Servicio para manejar operaciones CRUD de clientes
 */
export class ClientService {

  /**
   * Obtener todos los clientes
   */
  static async getAllClients() {
    try {
      const { data, error } = await supabase
        .from("Client")
        .select("*")
        .order("name");

      if (error) {
        throw new Error(`Error fetching clients: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Exception in getAllClients:", error);
      throw error;
    }
  }

  /**
   * Obtener un cliente por ID
   */
  static async getClientById(clientId) {
    try {
      const { data, error } = await supabase
        .from("Client")
        .select("*")
        .eq("id", clientId)
        .single();

      if (error) {
        throw new Error(`Error fetching client: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Exception in getClientById:", error);
      throw error;
    }
  }

  /**
   * Crear un nuevo cliente
   */
  static async createClient(clientData) {
    try {
      const { name } = clientData;

      if (!name || !name.trim()) {
        throw new Error("Client name is required");
      }

      const { data, error } = await supabase
        .from("Client")
        .insert({
          name: name.trim()
        })
        .select();

      if (error) {
        throw new Error(`Error creating client: ${error.message}`);
      }

      return data[0];
    } catch (error) {
      console.error("Exception in createClient:", error);
      throw error;
    }
  }

  /**
   * Actualizar un cliente
   */
  static async updateClient(clientId, clientData) {
    try {
      const { name } = clientData;

      if (!name || !name.trim()) {
        throw new Error("Client name is required");
      }

      const { data, error } = await supabase
        .from("Client")
        .update({
          name: name.trim()
        })
        .eq("id", clientId)
        .select();

      if (error) {
        throw new Error(`Error updating client: ${error.message}`);
      }

      return data[0];
    } catch (error) {
      console.error("Exception in updateClient:", error);
      throw error;
    }
  }

  /**
   * Eliminar un cliente
   */
  static async deleteClient(clientId) {
    try {
      // Verificar si el cliente tiene cuentas asociadas
      const { data: accounts, error: checkError } = await supabase
        .from("Account")
        .select("id")
        .eq("client_id", clientId)
        .limit(1);

      if (checkError) {
        throw new Error(`Error checking client usage: ${checkError.message}`);
      }

      if (accounts && accounts.length > 0) {
        throw new Error("No se puede eliminar el cliente porque tiene cuentas asociadas");
      }

      const { error } = await supabase
        .from("Client")
        .delete()
        .eq("id", clientId);

      if (error) {
        throw new Error(`Error deleting client: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error("Exception in deleteClient:", error);
      throw error;
    }
  }

  /**
   * Buscar clientes por nombre
   */
  static async searchClients(searchTerm) {
    try {
      const { data, error } = await supabase
        .from("Client")
        .select("*")
        .ilike("name", `%${searchTerm}%`)
        .order("name");

      if (error) {
        throw new Error(`Error searching clients: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Exception in searchClients:", error);
      throw error;
    }
  }

  /**
   * Obtener clientes con sus cuentas
   */
  static async getClientsWithAccounts() {
    try {
      const { data, error } = await supabase
        .from("Client")
        .select(`
          *,
          Account (
            id,
            status,
            created_at,
            close_date,
            total_amount
          )
        `)
        .order("name");

      if (error) {
        throw new Error(`Error fetching clients with accounts: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Exception in getClientsWithAccounts:", error);
      throw error;
    }
  }
}
