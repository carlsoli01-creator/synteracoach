import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { FileText, AlertCircle, DollarSign, Clock, Loader2 } from "lucide-react";
import { useInvoiceStore } from "@/hooks/useInvoiceStore";

export default function Dashboard() {
  const { invoices, stats, loading, markAsPaid, sendReminder } = useInvoiceStore();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const unpaidInvoices = invoices.filter((i) => i.status !== "paid");

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
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Overview of your unpaid invoices and payment reminders
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Unpaid Invoices"
            value={stats.totalUnpaid}
            icon={FileText}
            variant="default"
          />
          <StatCard
            title="Overdue"
            value={stats.totalOverdue}
            icon={AlertCircle}
            variant="destructive"
          />
          <StatCard
            title="Total Outstanding"
            value={formatCurrency(stats.totalAmount)}
            icon={DollarSign}
            variant="warning"
          />
          <StatCard
            title="Overdue Amount"
            value={formatCurrency(stats.overdueAmount)}
            icon={Clock}
            variant="destructive"
          />
        </div>

        {/* Recent Invoices */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Unpaid Invoices</h2>
          <InvoiceTable
            invoices={unpaidInvoices}
            onMarkPaid={markAsPaid}
            onSendReminder={sendReminder}
          />
        </div>
      </div>
    </Layout>
  );
}
