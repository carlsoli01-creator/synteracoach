import { useState, useCallback, useEffect } from "react";
import { Client, Invoice } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useInvoiceStore() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch clients and invoices from database
  useEffect(() => {
    if (!user) {
      setClients([]);
      setInvoices([]);
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (clientsError) {
        toast.error("Failed to load clients");
      } else {
        setClients(
          clientsData.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            company: c.company || undefined,
            createdAt: new Date(c.created_at),
          }))
        );
      }

      // Fetch invoices with client info
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select(`
          *,
          clients (name, email)
        `)
        .order("created_at", { ascending: false });

      if (invoicesError) {
        toast.error("Failed to load invoices");
      } else {
        const now = new Date();
        setInvoices(
          invoicesData.map((i) => {
            const dueDate = new Date(i.due_date);
            let status = i.status as Invoice["status"];
            
            // Update status if overdue and not paid
            if (status !== "paid" && dueDate < now) {
              status = "overdue";
            }

            return {
              id: i.id,
              clientId: i.client_id,
              clientName: i.clients?.name || "Unknown",
              clientEmail: i.clients?.email || "",
              amount: Number(i.amount),
              dueDate,
              status,
              description: i.description || undefined,
              createdAt: new Date(i.created_at),
              remindersSent: i.reminders_sent,
              lastReminderAt: i.last_reminder_at ? new Date(i.last_reminder_at) : undefined,
            };
          })
        );
      }

      setLoading(false);
    }

    fetchData();
  }, [user]);

  const addClient = useCallback(
    async (data: { name: string; email: string; company?: string }) => {
      if (!user) return null;

      const { data: newClient, error } = await supabase
        .from("clients")
        .insert({
          user_id: user.id,
          name: data.name,
          email: data.email,
          company: data.company || null,
        })
        .select()
        .single();

      if (error) {
        toast.error("Failed to add client");
        return null;
      }

      const client: Client = {
        id: newClient.id,
        name: newClient.name,
        email: newClient.email,
        company: newClient.company || undefined,
        createdAt: new Date(newClient.created_at),
      };

      setClients((prev) => [client, ...prev]);
      toast.success(`Client "${data.name}" added successfully`);
      return client;
    },
    [user]
  );

  const addInvoice = useCallback(
    async (data: { clientId: string; amount: number; dueDate: string; description?: string }) => {
      if (!user) return null;

      const client = clients.find((c) => c.id === data.clientId);
      if (!client) {
        toast.error("Client not found");
        return null;
      }

      const dueDate = new Date(data.dueDate);
      const isOverdue = dueDate < new Date();

      const { data: newInvoice, error } = await supabase
        .from("invoices")
        .insert({
          user_id: user.id,
          client_id: data.clientId,
          amount: data.amount,
          due_date: data.dueDate,
          status: isOverdue ? "overdue" : "pending",
          description: data.description || null,
        })
        .select()
        .single();

      if (error) {
        toast.error("Failed to create invoice");
        return null;
      }

      const invoice: Invoice = {
        id: newInvoice.id,
        clientId: data.clientId,
        clientName: client.name,
        clientEmail: client.email,
        amount: Number(newInvoice.amount),
        dueDate,
        status: newInvoice.status as Invoice["status"],
        description: newInvoice.description || undefined,
        createdAt: new Date(newInvoice.created_at),
        remindersSent: newInvoice.reminders_sent,
      };

      setInvoices((prev) => [invoice, ...prev]);
      toast.success("Invoice created successfully");
      return invoice;
    },
    [user, clients]
  );

  const markAsPaid = useCallback(
    async (invoiceId: string) => {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "paid" })
        .eq("id", invoiceId);

      if (error) {
        toast.error("Failed to update invoice");
        return;
      }

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId ? { ...inv, status: "paid" as const } : inv
        )
      );
      toast.success("Invoice marked as paid");
    },
    []
  );

  const sendReminder = useCallback(
    async (invoiceId: string) => {
      const invoice = invoices.find((i) => i.id === invoiceId);
      if (!invoice) return;

      toast.loading("Sending reminder email...", { id: "reminder" });

      try {
        const { data, error } = await supabase.functions.invoke("send-reminder", {
          body: { invoiceId },
        });

        if (error) {
          console.error("Edge function error:", error);
          toast.error("Failed to send reminder email", { id: "reminder" });
          return;
        }

        if (data?.error) {
          console.error("Reminder error:", data.error);
          toast.error(data.error, { id: "reminder" });
          return;
        }

        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === invoiceId
              ? {
                  ...inv,
                  remindersSent: inv.remindersSent + 1,
                  lastReminderAt: new Date(),
                }
              : inv
          )
        );
        toast.success(`Reminder email sent to ${invoice.clientEmail}`, { id: "reminder" });
      } catch (err: any) {
        console.error("Failed to send reminder:", err);
        toast.error("Failed to send reminder email", { id: "reminder" });
      }
    },
    [invoices]
  );

  // Calculate stats
  const stats = {
    totalUnpaid: invoices.filter((i) => i.status !== "paid").length,
    totalOverdue: invoices.filter((i) => i.status === "overdue").length,
    totalAmount: invoices
      .filter((i) => i.status !== "paid")
      .reduce((sum, i) => sum + i.amount, 0),
    overdueAmount: invoices
      .filter((i) => i.status === "overdue")
      .reduce((sum, i) => sum + i.amount, 0),
  };

  return {
    clients,
    invoices,
    stats,
    loading,
    addClient,
    addInvoice,
    markAsPaid,
    sendReminder,
  };
}
