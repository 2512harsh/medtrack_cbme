"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import {
  getBillingSubscriptions,
  getInvoiceHistory,
  upgradeSubscription,
} from "@/features/advanced/services/advanced";
import { toast } from "sonner";
import { CreditCard, CalendarClock, Users, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SubscriptionRow = {
  id: string;
  plan: string;
  status: string;
  amount: number;
  currency: string;
  billingCycle: string;
  renewalDate: string;
  seats: number;
  institution: string;
};

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  plan: string;
  amount: number;
  currency: string;
  issuedAt: string;
  status: string;
};

const statusColor = (status: string) =>
  status === "ACTIVE" || status === "PAID"
    ? "bg-green-100 text-green-700"
    : status === "CANCELED"
    ? "bg-gray-100 text-gray-700"
    : "bg-amber-100 text-amber-700";

async function getBillingData(): Promise<SubscriptionRow[]> {
  const subs = await getBillingSubscriptions();
  return subs.map((s) => ({
    id: s.id,
    plan: s.plan,
    status: s.status,
    amount: s.amount,
    currency: s.currency,
    billingCycle: s.billingCycle,
    renewalDate: new Date(s.renewalDate).toLocaleDateString(),
    seats: s.seats,
    institution: s.institution,
  }));
}

async function getInvoiceData(): Promise<InvoiceRow[]> {
  const invoices = await getInvoiceHistory();
  return invoices.map((i) => ({
    id: i.id,
    invoiceNumber: i.invoiceNumber,
    plan: i.plan,
    amount: i.amount,
    currency: i.currency,
    issuedAt: new Date(i.issuedAt).toLocaleDateString(),
    status: i.status,
  }));
}

export default function BillingPage() {
  const [data, setData] = useState<SubscriptionRow[] | undefined>(undefined);
  const [invoices, setInvoices] = useState<InvoiceRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [upgradeTarget, setUpgradeTarget] = useState<SubscriptionRow | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [form, setForm] = useState({ plan: "", seats: 0 });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [subs, invs] = await Promise.all([getBillingData(), getInvoiceData()]);
      setData(subs);
      setInvoices(invs);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load billing data"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpgrade = async () => {
    if (!upgradeTarget) return;
    if (!form.plan || form.seats <= 0) {
      toast.error("Select a plan and valid seat count");
      return;
    }
    setUpgrading(true);
    try {
      await upgradeSubscription(upgradeTarget.id, {
        plan: form.plan,
        seats: form.seats,
      });
      toast.success("Subscription updated");
      setUpgradeTarget(null);
      setForm({ plan: "", seats: 0 });
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update subscription");
    } finally {
      setUpgrading(false);
    }
  };

  const totalRevenue = (invoices ?? []).reduce(
    (sum, i) => (i.status === "PAID" ? sum + i.amount : sum),
    0
  );
  const activeSeats = (data ?? []).reduce(
    (sum, s) => (s.status === "ACTIVE" ? sum + s.seats : sum),
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Billing & Subscriptions" description="Manage plans, seat allocations, and invoices" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Subscriptions"
          value={(data ?? []).filter((s) => s.status === "ACTIVE").length}
          icon={<CreditCard className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="Total Seats"
          value={activeSeats}
          icon={<Users className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          title="Revenue (Paid)"
          value={`$${totalRevenue}`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="purple"
        />
        <StatCard
          title="Next Renewal"
          value={(data ?? []).find((s) => s.status === "ACTIVE")?.renewalDate ?? "-"}
          icon={<CalendarClock className="h-5 w-5" />}
          color="orange"
        />
      </div>

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No subscriptions"
        emptyDescription="No subscriptions exist yet."
        loadingColumns={3}
      >
        {(subscriptions) => (
          <div className="grid gap-4 md:grid-cols-2">
            {subscriptions.map((s) => (
              <Card key={s.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      {s.institution}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        {s.plan}
                      </span>
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${statusColor(s.status)}`}
                    >
                      {s.status}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-medium">
                        {s.currency} {s.amount.toLocaleString()} / {s.billingCycle}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Seats</span>
                      <span className="font-medium">{s.seats}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Renewal</span>
                      <span className="font-medium">{s.renewalDate}</span>
                    </div>
                  </div>
                  {s.status === "ACTIVE" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUpgradeTarget(s);
                        setForm({ plan: s.plan, seats: s.seats });
                      }}
                    >
                      Upgrade Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </AsyncContent>

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          <AsyncContent
            data={invoices}
            isLoading={isLoading}
            error={error}
            onRetry={fetchData}
            emptyTitle="No invoices"
            emptyDescription="Invoices will appear here after billing cycles complete."
            loadingColumns={3}
          >
            {(items) => (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Invoice</th>
                      <th className="py-2 pr-4 font-medium">Plan</th>
                      <th className="py-2 pr-4 font-medium">Amount</th>
                      <th className="py-2 pr-4 font-medium">Issued</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i) => (
                      <tr key={i.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{i.invoiceNumber}</td>
                        <td className="py-2 pr-4">{i.plan}</td>
                        <td className="py-2 pr-4">
                          {i.currency} {i.amount.toLocaleString()}
                        </td>
                        <td className="py-2 pr-4">{i.issuedAt}</td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${statusColor(i.status)}`}
                          >
                            {i.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AsyncContent>
        </CardContent>
      </Card>

      <Dialog open={!!upgradeTarget} onOpenChange={(open) => !open && setUpgradeTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upgrade Subscription</DialogTitle>
            <DialogDescription>
              Update the plan and seat allocation for{" "}
              {upgradeTarget?.institution ?? "this institution"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select
                items={{ Institution: "Institution", Department: "Department", Enterprise: "Enterprise" }}
                value={form.plan}
                onValueChange={(value) => setForm({ ...form, plan: value ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Institution">Institution</SelectItem>
                  <SelectItem value="Department">Department</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seats">Seats</Label>
              <Input
                id="seats"
                type="number"
                min={1}
                value={form.seats || ""}
                onChange={(e) => setForm({ ...form, seats: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setUpgradeTarget(null)}
              disabled={upgrading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpgrade} disabled={upgrading}>
              {upgrading ? "Updating..." : "Upgrade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}