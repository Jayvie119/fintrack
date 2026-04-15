// Initialize Supabase
const SUPABASE_URL = 'https://uanmevyeqycldmgvixwv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhbm1ldnllcXljbGRtZ3ZpeHd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNDAyNjksImV4cCI6MjA5MTgxNjI2OX0.B5waCvDarfmD0j9-8BcAZRpRA8KxX5pwyDqOlXFeip4';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const db = {
  // Fetch from Supabase
  async getTransactions() {
    const { data, error } = await _supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Insert to Supabase
  async addTransaction(newTxn) {
    const { error } = await _supabase
      .from('transactions')
      .insert([newTxn]);
    if (error) throw error;
  },

  // Delete from Supabase
  async deleteTransaction(id) {
    const { error } = await _supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};