import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Invoice } from "@/types";
import { CheckCircle, Mail } from "lucide-react";

interface InvoiceTableProps {
  invoices: Invoice[];
  onMarkPaid: (id: string) => void;
  onSendReminder: (id: string) => void;
}

const statusVariants: Record<Invoice["status"], "paid" | "overdue" | "pending"> = {
  paid: "paid",
  overdue: "overdue",
  pending: "pending",
};

export function InvoiceTable({ invoices, onMarkPaid, onSendReminder }: InvoiceTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">No invoices found</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold">Client</TableHead>
            <TableHead className="font-semibold">Amount</TableHead>
            <TableHead className="font-semibold">Due Date</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Reminders</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} className="animate-fade-in">
              <TableCell>
                <div>
                  <p className="font-medium text-foreground">{invoice.clientName}</p>
                  <p className="text-sm text-muted-foreground">{invoice.clientEmail}</p>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(invoice.amount)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(invoice.dueDate), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariants[invoice.status]}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {invoice.remindersSent} sent
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {invoice.status !== "paid" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSendReminder(invoice.id)}
                        className="gap-1.5"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Remind
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onMarkPaid(invoice.id)}
                        className="gap-1.5 text-success hover:text-success"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Paid
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
