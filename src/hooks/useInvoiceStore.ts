import { useState, useCallback, useEffect } from "react";
import { Client, Invoice } from "@/types";
import { toast } from "sonner";

// Demo data for initial state
const demoClients: Client[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@techstartup.com",
    company: "Tech Startup Inc",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael@designco.com",
    company: "Design Co",
    createdAt: new Date("2024-02-20"),
  },
  {
    id: "3",
    name: "Emily Davis",
    email: "emily@freelance.com",
    createdAt: new Date("2024-03-10"),
  },
];

const demoInvoices: Invoice[] = [
  {
    id: "inv-1",
    clientId: "1",
    clientName: "Sarah Johnson",
    clientEmail: "sarah@techstartup.com",
    amount: 2500,
    dueDate: new Date("2024-01-20"),
    status: "overdue",
    description: "Website development",
    createdAt: new Date("2024-01-05"),
    remindersSent: 3,
    lastReminderAt: new Date("2024-01-25"),
  },
  {
    id: "inv-2",
    clientId: "2",
    clientName: "Michael Chen",
    clientEmail: "michael@designco.com",
    amount: 1800,
    dueDate: new Date("2024-02-15"),
    status: "paid",
    description: "Logo design package",
    createdAt: new Date("2024-02-01"),
    remindersSent: 1,
  },
  {
    id: "inv-3",
    clientId: "3",
    clientName: "Emily Davis",
    clientEmail: "emily@freelance.com",
    amount: 3200,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    status: "pending",
    description: "Consulting services",
    createdAt: new Date(),
    remindersSent: 0,
  },
];

export function useInvoiceStore() {
  const [clients, setClients] = useState<Client[]>(demoClients);
  const [invoices, setInvoices] = useState<Invoice[]>(demoInvoices);

  // Update invoice statuses based on due date
  useEffect(() => {
    const now = new Date();
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.status === "paid") return inv;
        const isOverdue = new Date(inv.dueDate) < now;
        return {
          ...inv,
          status: isOverdue ? "overdue" : "pending",
        };
      })
    );
  }, []);

  const addClient = useCallback((data: { name: string; email: string; company?: string }) => {
    const newClient: Client = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
    };
    setClients((prev) => [...prev, newClient]);
    toast.success(`Client "${data.name}" added successfully`);
    return newClient;
  }, []);

  const addInvoice = useCallback(
    (data: { clientId: string; amount: number; dueDate: string; description?: string }) => {
      const client = clients.find((c) => c.id === data.clientId);
      if (!client) {
        toast.error("Client not found");
        return null;
      }

      const dueDate = new Date(data.dueDate);
      const isOverdue = dueDate < new Date();

      const newInvoice: Invoice = {
        id: crypto.randomUUID(),
        clientId: data.clientId,
        clientName: client.name,
        clientEmail: client.email,
        amount: data.amount,
        dueDate,
        status: isOverdue ? "overdue" : "pending",
        description: data.description,
        createdAt: new Date(),
        remindersSent: 0,
      };
      setInvoices((prev) => [...prev, newInvoice]);
      toast.success("Invoice created successfully");
      return newInvoice;
    },
    [clients]
  );

  const markAsPaid = useCallback((invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: "paid" as const } : inv
      )
    );
    toast.success("Invoice marked as paid");
  }, []);

  const sendReminder = useCallback((invoiceId: string) => {
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
    toast.success("Payment reminder sent");
  }, []);

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
    addClient,
    addInvoice,
    markAsPaid,
    sendReminder,
  };
}
