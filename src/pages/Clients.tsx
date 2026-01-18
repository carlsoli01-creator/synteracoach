import { Layout } from "@/components/layout/Layout";
import { ClientCard } from "@/components/clients/ClientCard";
import { AddClientDialog } from "@/components/clients/AddClientDialog";
import { useInvoiceStore } from "@/hooks/useInvoiceStore";
import { Loader2 } from "lucide-react";

export default function Clients() {
  const { clients, loading, addClient } = useInvoiceStore();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Clients</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your clients and their contact information
            </p>
          </div>
          <AddClientDialog onAddClient={addClient} />
        </div>

        {/* Clients Grid */}
        {clients.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">No clients yet. Add your first client to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
