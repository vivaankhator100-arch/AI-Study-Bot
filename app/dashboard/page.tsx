import { supabase } from '../../lib/supabase-server';
import DashboardClient from './dashboard-client';
import NavBar from '../components/NavBar';

export default async function DashboardPage() {
  const { data, error } = await supabase
    .from('concepts')
    .select('*')
    .order('last_updated', { ascending: false });

  const concepts = Array.isArray(data) ? data : [];

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
      <DashboardClient concepts={concepts} error={error?.message ?? null} />
    </div>
  );
}
