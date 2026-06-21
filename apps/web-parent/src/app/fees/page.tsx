'use client';

import { useEffect, useState, Fragment } from 'react';
import { Badge, Button, TabGroup } from '@eduai365/ui';
import { Wallet, ExternalLink, Calendar, Receipt, FileText, ChevronDown, ChevronUp, XCircle, Bus, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ParentShell } from '@/components/parent-shell';
import { apiFetch } from '@/lib/api';
import { formatDate, formatInr } from '@/lib/format';
import type { ParentChild, ParentDashboard } from '@/types/parent';

interface InvoiceLineItem {
  id: string;
  description: string;
  amount: number;
  code?: string;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  term: string;
  totalAmount: number;
  paidAmount: number;
  outstanding: number;
  status: string;
  dueDate: string;
  lineItems?: InvoiceLineItem[];
}

interface UpcomingFee {
  month: string;
  dueDate: string;
  totalAmount: number;
  status: string;
  type?: string;
  lineItems: Array<{
    description: string;
    amount: number;
  }>;
}

interface ChildFeesData {
  outstandingAmount: number;
  status: string;
  dueDate: string;
  paymentUrl: string;
  sessionEnded?: boolean;
  sessionEndingMonth?: string;
  invoices: Invoice[];
  upcomingFees?: UpcomingFee[];
  transportAlloc?: {
    id: string;
    routeId: string;
    stopName: string;
    pickupTime: string;
  } | null;
}

interface TransportRoute {
  id: string;
  name: string;
  code: string;
  stops: Array<{ name: string; time?: string }>;
}

export default function FeesPage() {
  const [dashboard, setDashboard] = useState<ParentDashboard | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [feesData, setFeesData] = useState<ChildFeesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [childLoading, setChildLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  // Transport application states
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [selectedStop, setSelectedStop] = useState<string>('');
  const [applyingBus, setApplyingBus] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const openApplyBusModal = async () => {
    try {
      const data = await apiFetch<TransportRoute[]>('/parent/transport/routes');
      setRoutes(data);
      const firstRoute = data[0];
      if (firstRoute) {
        setSelectedRouteId(firstRoute.id);
        const stops = firstRoute.stops as Array<{ name: string }>;
        const firstStop = stops[0];
        if (firstStop) {
          setSelectedStop(firstStop.name);
        }
      }
      setShowApplyModal(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to fetch transport routes');
    }
  };

  const handleRouteSelect = (routeId: string) => {
    setSelectedRouteId(routeId);
    const route = routes.find((r) => r.id === routeId);
    if (route) {
      const stops = route.stops as Array<{ name: string }>;
      const firstStop = stops[0];
      if (firstStop) {
        setSelectedStop(firstStop.name);
      } else {
        setSelectedStop('');
      }
    }
  };

  const handleSubmitBusApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || !selectedRouteId || !selectedStop) return;

    setApplyingBus(true);
    try {
      await apiFetch(`/parent/children/${selectedChildId}/apply-bus`, {
        method: 'POST',
        body: JSON.stringify({
          routeId: selectedRouteId,
          stopName: selectedStop,
        }),
      });
      alert('Bus service application submitted successfully. Pending school approval.');
      setShowApplyModal(false);
      
      // Reload fees details to fetch the updated transportAlloc
      const raw = await apiFetch<ChildFeesData>(`/parent/children/${selectedChildId}/fees`);
      setFeesData(raw);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setApplyingBus(false);
    }
  };

  // 1. Fetch dashboard context to get children list
  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const dash = await apiFetch<ParentDashboard>('/parent/dashboard');
        if (!cancelled) {
          const rawDash = dash as {
            parentName?: string;
            children?: Array<{
              id?: string;
              name?: string;
              firstName?: string;
              lastName?: string;
              class?: string;
              className?: string;
              section?: string;
            }>;
          };
          const normalisedChildren = Array.isArray(rawDash.children)
            ? rawDash.children.map((child) => {
                const nameParts = (child.name ?? '').split(' ');
                const firstName = child.firstName ?? nameParts[0] ?? '';
                const lastName = child.lastName ?? nameParts.slice(1).join(' ') ?? '';
                return {
                  id: child.id ?? '',
                  firstName,
                  lastName,
                  className: child.className ?? child.class ?? 'Unassigned',
                  section: child.section ?? '',
                };
              })
            : [];

          const normalisedDashboard: ParentDashboard = {
            parentName: rawDash.parentName ?? 'Parent',
            children: normalisedChildren,
          };

          setDashboard(normalisedDashboard);
          if (normalisedChildren.length > 0) {
            setSelectedChildId(normalisedChildren[0]?.id ?? null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Load child fees details when selectedChildId changes
  useEffect(() => {
    if (!selectedChildId) return;

    let cancelled = false;
    setChildLoading(true);
    setError(null);

    async function loadFees() {
      try {
        const raw = await apiFetch<ChildFeesData>(`/parent/children/${selectedChildId}/fees`);
        if (!cancelled) {
          setFeesData(raw);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load fees data');
      } finally {
        if (!cancelled) setChildLoading(false);
      }
    }

    void loadFees();
    return () => {
      cancelled = true;
    };
  }, [selectedChildId]);

  const selectedChild = dashboard?.children.find((c) => c.id === selectedChildId);

  return (
    <ParentShell>
      <div className="space-y-8">
        <header>
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" strokeWidth={1.5} />
            <h1 className="text-headline-lg font-bold text-on-surface">Fees & Payments</h1>
          </div>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Track tuition invoices, outstanding dues, payment receipts, and make safe online school fee payments.
          </p>
        </header>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading portal data…
          </div>
        )}
        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {dashboard && !loading && (
          <>
            {/* Child Selector */}
            {dashboard.children.length > 0 && (
              <TabGroup
                tabs={dashboard.children.map((child: ParentChild) => ({
                  id: child.id,
                  label: `${child.firstName} (${child.className}${child.section})`,
                }))}
                activeTab={selectedChildId ?? dashboard.children[0]?.id ?? ''}
                onChange={setSelectedChildId}
              />
            )}

            {childLoading && (
              <div className="bento-card py-16 text-center text-on-surface-variant">
                Loading fee records…
              </div>
            )}

            {!childLoading && !error && selectedChild && feesData && (
              <div className="space-y-6 animate-fade-in">
                {/* Academic Session Ended Alert Box */}
                {feesData.sessionEnded ? (
                  <div className="flex flex-col gap-4 rounded-xl border border-error/30 bg-error/5 p-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-error/15 text-error">
                        <XCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-title-lg font-bold text-on-surface">Academic Session Closed</p>
                        <p className="text-body-md text-on-surface-variant mt-0.5">
                          The academic session ended in <span className="font-semibold text-on-surface">{feesData.sessionEndingMonth || 'March'}</span>. Online payments are disabled for this session. Please contact the administrative accounts office to clear the remaining balance of <span className="font-bold text-on-surface">{formatInr(feesData.outstandingAmount)}</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : feesData.outstandingAmount > 0 ? (
                  <div className="flex flex-col gap-4 rounded-xl border border-warning/30 bg-warning/5 p-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-title-lg font-bold text-on-surface">Outstanding School Dues</p>
                        <p className="text-body-md text-on-surface-variant mt-0.5">
                          A total amount of <span className="font-semibold text-on-surface">{formatInr(feesData.outstandingAmount)}</span> is outstanding, with next payment deadline by {formatDate(feesData.dueDate)}.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      onClick={() =>
                        window.open(feesData.paymentUrl, '_self')
                      }
                    >
                      Pay Outstanding Fees
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 rounded-xl border border-success/30 bg-success/5 p-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-title-lg font-bold text-success">All Dues Cleared</p>
                        <p className="text-body-md text-success/80 mt-0.5">
                          Excellent! There are no outstanding fees for {selectedChild.firstName} at this time. All invoices have been successfully paid.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upcoming Projected Fees */}
                {feesData.upcomingFees && feesData.upcomingFees.length > 0 && (
                  <div className="space-y-4 animate-fade-in">
                    <h2 className="text-title-lg font-bold text-on-surface flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" strokeWidth={1.5} />
                      Projected Payments (Next 2 Months)
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {feesData.upcomingFees.map((fee, idx) => (
                        <div key={idx} className="bento-card relative overflow-hidden border border-gray-150/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                          <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-primary/5" />
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-label-md font-bold text-primary">
                                  {fee.month}
                                </span>
                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  fee.type === 'Bus Fee Voucher' ? 'bg-secondary/15 text-secondary' : 'bg-gray-100 text-on-surface-variant'
                                }`}>
                                  {fee.type || 'Fee Voucher'}
                                </span>
                              </div>
                              <p className="mt-1.5 text-headline-sm font-black text-on-surface">
                                {formatInr(fee.totalAmount)}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-on-surface-variant font-medium">Due Date</span>
                              <p className="text-body-sm font-semibold text-on-surface">
                                {formatDate(fee.dueDate)}
                              </p>
                            </div>
                          </div>
                          <div className="border-t border-dashed border-gray-200/80 pt-3 space-y-2">
                            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Breakdown</span>
                            <div className="space-y-1.5">
                              {fee.lineItems.map((item, itemIdx) => (
                                <div key={itemIdx} className="flex justify-between items-center text-body-sm">
                                  <span className="text-on-surface-variant">{item.description}</span>
                                  <span className="font-medium text-on-surface">{formatInr(item.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="mt-5 pt-3 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-xs text-success font-semibold flex items-center gap-1">
                              {!feesData.sessionEnded && (
                                <div className="h-1.5 w-1.5 rounded-full bg-success animate-ping" />
                              )}
                              {feesData.sessionEnded ? 'Session Closed' : 'Ready for Payment'}
                            </span>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => alert(`Initiating payment for ${fee.month}: ${formatInr(fee.totalAmount)}`)}
                              disabled={feesData.sessionEnded}
                            >
                              Pay Upcoming
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* School Bus Transport Service Application */}
                <div className="bento-card space-y-4 border border-gray-150/30">
                  <div className="flex justify-between items-center border-b border-gray-100/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Bus className="h-5 w-5 text-secondary" strokeWidth={1.5} />
                      <h2 className="text-title-lg font-bold text-on-surface">School Bus Transport Service</h2>
                    </div>
                    {feesData.transportAlloc ? (
                      <Badge variant={feesData.transportAlloc.pickupTime === 'PENDING_APPROVAL' ? 'warning' : 'success'}>
                        {feesData.transportAlloc.pickupTime === 'PENDING_APPROVAL' ? 'Pending Approval' : 'Active & Approved'}
                      </Badge>
                    ) : (
                      <Badge variant="default">Not Applied</Badge>
                    )}
                  </div>

                  {!feesData.transportAlloc ? (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2">
                      <div>
                        <p className="text-body-md text-on-surface font-semibold">Apply for School Bus Service</p>
                        <p className="text-body-sm text-on-surface-variant mt-0.5">
                          Bus transportation fees are only charged once the application is approved by the school administrator.
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={openApplyBusModal}
                        disabled={feesData.sessionEnded}
                      >
                        Apply for Bus Service
                      </Button>
                    </div>
                  ) : feesData.transportAlloc.pickupTime === 'PENDING_APPROVAL' ? (
                    <div className="space-y-3 py-1">
                      <div className="flex items-start gap-3 rounded-lg bg-warning/5 border border-warning/20 p-4">
                        <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                        <div>
                          <p className="text-body-md text-on-surface font-bold">Application Pending Review</p>
                          <p className="text-body-sm text-on-surface-variant mt-0.5">
                            Your application for bus transport is under review by the transport supervisor. Once approved, the monthly transport fee of <span className="font-semibold text-on-surface">₹800</span> will be added to your monthly invoices.
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 text-body-sm bg-surface-faint/30 p-3 rounded-lg">
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant">Selected Stop</span>
                          <span className="font-medium text-on-surface">{feesData.transportAlloc.stopName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant">Application Status</span>
                          <span className="font-semibold text-warning">Pending Approval</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 py-1">
                      <div className="flex items-start gap-3 rounded-lg bg-success/5 border border-success/20 p-4">
                        <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                        <div>
                          <p className="text-body-md text-success font-bold">Approved & Assigned</p>
                          <p className="text-body-sm text-on-surface-variant mt-0.5">
                            Bus service is active. The monthly transport fee is automatically included in the monthly bus vouchers.
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3 text-body-sm bg-surface-faint/30 p-3.5 rounded-lg border border-gray-100">
                        <div>
                          <span className="text-on-surface-variant block">Assigned Stop</span>
                          <span className="font-semibold text-on-surface mt-0.5 block">{feesData.transportAlloc.stopName}</span>
                        </div>
                        <div>
                          <span className="text-on-surface-variant block">Scheduled Pickup</span>
                          <span className="font-semibold text-on-surface mt-0.5 block">{feesData.transportAlloc.pickupTime}</span>
                        </div>
                        <div>
                          <span className="text-on-surface-variant block">Status</span>
                          <span className="font-semibold text-success mt-0.5 block">Approved</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Invoices List Grid */}
                <div className="bento-card space-y-6">
                  <h2 className="text-title-lg font-bold text-on-surface">Invoice History</h2>
                  {feesData.invoices.length === 0 ? (
                    <p className="text-body-md text-on-surface-variant">No invoices recorded.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-body-md">
                        <thead>
                          <tr className="border-b border-gray-200 text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">
                            <th className="pb-3 pt-2 w-8"></th>
                            <th className="pb-3 pt-2 font-semibold">Invoice No</th>
                            <th className="pb-3 pt-2 font-semibold">Description / Term</th>
                            <th className="pb-3 pt-2 font-semibold text-center">Due Date</th>
                            <th className="pb-3 pt-2 font-semibold text-right">Total Amount</th>
                            <th className="pb-3 pt-2 font-semibold text-right">Amount Paid</th>
                            <th className="pb-3 pt-2 font-semibold text-right">Balance Due</th>
                            <th className="pb-3 pt-2 font-semibold text-center">Status</th>
                            <th className="pb-3 pt-2 font-semibold text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {feesData.invoices.map((invoice) => {
                            const isPaid = invoice.status.toUpperCase() === 'PAID';
                            const isOverdue = !isPaid && new Date(invoice.dueDate) < new Date();
                            const statusColor = isPaid
                              ? 'success'
                              : isOverdue
                                ? 'error'
                                : 'warning';
                            const statusLabel = isPaid
                              ? 'Paid'
                              : isOverdue
                                ? 'Overdue'
                                : 'Pending';
                            const isExpanded = expandedInvoiceId === invoice.id;

                            return (
                              <Fragment key={invoice.id}>
                                <tr
                                  onClick={() => setExpandedInvoiceId(isExpanded ? null : invoice.id)}
                                  className="hover:bg-surface-faint/30 cursor-pointer transition-colors duration-150"
                                >
                                  <td className="py-3.5 text-center text-on-surface-variant">
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4 mx-auto" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 mx-auto" />
                                    )}
                                  </td>
                                  <td className="py-3.5 font-semibold text-on-surface flex items-center gap-1.5">
                                    <FileText className="h-4 w-4 text-on-surface-variant" />
                                    {invoice.invoiceNo}
                                  </td>
                                  <td className="py-3.5 text-on-surface font-medium">{invoice.term}</td>
                                  <td className="py-3.5 text-center text-on-surface-variant">
                                    <span className="flex items-center justify-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      {formatDate(invoice.dueDate)}
                                    </span>
                                  </td>
                                  <td className="py-3.5 text-right font-medium text-on-surface">
                                    {formatInr(invoice.totalAmount)}
                                  </td>
                                  <td className="py-3.5 text-right text-success font-medium">
                                    {formatInr(invoice.paidAmount)}
                                  </td>
                                  <td className={`py-3.5 text-right font-bold ${
                                    invoice.outstanding > 0 ? 'text-error' : 'text-on-surface-variant'
                                  }`}>
                                    {formatInr(invoice.outstanding)}
                                  </td>
                                  <td className="py-3.5 text-center">
                                    <Badge variant={statusColor}>{statusLabel}</Badge>
                                  </td>
                                  <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                                    {!isPaid ? (
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => window.open(feesData.paymentUrl, '_self')}
                                        disabled={feesData.sessionEnded}
                                      >
                                        Pay Now
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => alert(`Receipt downloaded for invoice: ${invoice.invoiceNo}`)}
                                      >
                                        Receipt
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                                {isExpanded && invoice.lineItems && invoice.lineItems.length > 0 && (
                                  <tr className="bg-surface-faint/20">
                                    <td colSpan={9} className="px-6 py-4 border-t border-b border-gray-100">
                                      <div className="space-y-3 max-w-xl animate-slide-down">
                                        <h4 className="text-body-sm font-bold text-on-surface flex items-center gap-1.5 uppercase tracking-wider">
                                          <Receipt className="h-4 w-4 text-primary" />
                                          Fee Item Breakdown ({invoice.invoiceNo})
                                        </h4>
                                        <div className="rounded-xl border border-gray-250/20 bg-white p-4 shadow-sm space-y-2">
                                          {invoice.lineItems.map((item) => (
                                            <div key={item.id} className="flex justify-between items-center text-body-sm">
                                              <span className="text-on-surface-variant font-medium">{item.description}</span>
                                              <span className="font-semibold text-on-surface">{formatInr(item.amount)}</span>
                                            </div>
                                          ))}
                                          <div className="border-t border-gray-150/50 pt-2.5 mt-2 flex justify-between items-center text-body-md font-extrabold text-on-surface">
                                            <span>Subtotal</span>
                                            <span>{formatInr(invoice.totalAmount)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        {/* Bus Service Application Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
            <div className="bento-card max-w-md w-full space-y-5 bg-white shadow-2xl animate-scale-up">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-title-lg font-bold text-on-surface flex items-center gap-2">
                  <Bus className="h-5 w-5 text-primary" />
                  Apply for Bus Service
                </h3>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="rounded-full p-1.5 text-on-surface-variant hover:bg-gray-100"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitBusApplication} className="space-y-4">
                <div>
                  <label htmlFor="routeSelect" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                    Select Bus Route
                  </label>
                  <select
                    id="routeSelect"
                    value={selectedRouteId}
                    onChange={(e) => handleRouteSelect(e.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-350/30 bg-surface-faint px-4 text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.code} — {route.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="stopSelect" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                    Select Stop Point
                  </label>
                  <select
                    id="stopSelect"
                    value={selectedStop}
                    onChange={(e) => setSelectedStop(e.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-350/30 bg-surface-faint px-4 text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {routes.find((r) => r.id === selectedRouteId)?.stops?.map((stop: { name: string }, idx: number) => (
                      <option key={idx} value={stop.name}>
                        {stop.name}
                      </option>
                    )) ?? <option value="">No stops available</option>}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <Button
                    variant="secondary"
                    onClick={() => setShowApplyModal(false)}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={applyingBus || !selectedRouteId || !selectedStop}
                  >
                    {applyingBus ? 'Submitting…' : 'Submit Application'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ParentShell>
  );
}
