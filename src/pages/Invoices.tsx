import { Layout } from "@/components/layout/Layout";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { AddInvoiceDialog } from "@/components/invoices/AddInvoiceDialog";
import { useInvoiceStore } from "@/hooks/useInvoiceStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Invoices() {
  const { clients, invoices, addInvoice, markAsPaid, sendReminder } = useInvoiceStore();

  const allInvoices = invoices;
  const pendingInvoices = invoices.filter((i) => i.status === "pending");
  const overdueInvoices = invoices.filter((i) => i.status === "overdue");
  const paidInvoices = invoices.filter((i) => i.status === "paid");

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Invoices</h1>
            <p className="mt-1 text-muted-foreground">
              Track invoices and send payment reminders
            </p>
          </div>
          <AddInvoiceDialog clients={clients} onAddInvoice={addInvoice} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({allInvoices.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingInvoices.length})</TabsTrigger>
            <TabsTrigger value="overdue">Overdue ({overdueInvoices.length})</TabsTrigger>
            <TabsTrigger value="paid">Paid ({paidInvoices.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <InvoiceTable
              invoices={allInvoices}
              onMarkPaid={markAsPaid}
              onSendReminder={sendReminder}
            />
          </TabsContent>
          <TabsContent value="pending">
            <InvoiceTable
              invoices={pendingInvoices}
              onMarkPaid={markAsPaid}
              onSendReminder={sendReminder}
            />
          </TabsContent>
          <TabsContent value="overdue">
            <InvoiceTable
              invoices={overdueInvoices}
              onMarkPaid={markAsPaid}
              onSendReminder={sendReminder}
            />
          </TabsContent>
          <TabsContent value="paid">
            <InvoiceTable
              invoices={paidInvoices}
              onMarkPaid={markAsPaid}
              onSendReminder={sendReminder}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
