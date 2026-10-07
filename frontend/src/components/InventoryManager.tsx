"use client";

import React, { useState } from "react";
import {
  Package,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Layers,
  ArrowUpRight,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Edit3,
  Flame,
  ShieldCheck,
  Check,
  X
} from "lucide-react";
import { adjustStock, adjustVelocity } from "@/lib/api";

interface InventoryManagerProps {
  inventoryData: any;
  onRefresh: () => void;
}

export default function InventoryManager({ inventoryData, onRefresh }: InventoryManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [editingSku, setEditingSku] = useState<any | null>(null);
  const [newStockVal, setNewStockVal] = useState<number>(0);
  const [newVelocityVal, setNewVelocityVal] = useState<number>(0);
  const [restockReason, setRestockReason] = useState("Warehouse shipment intake");
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const items = Array.isArray(inventoryData)
    ? inventoryData
    : inventoryData?.inventory || [];

  const summary = inventoryData?.summary || {
    total_skus: items.length,
    total_units_in_stock: items.reduce((acc: number, item: any) => acc + (item.stock || item.inventory_stock || 0), 0),
    total_inventory_value: items.reduce((acc: number, item: any) => acc + ((item.stock || item.inventory_stock || 0) * (item.price || item.retail_price || 0)), 0),
    critical_stockout_count: items.filter((i: any) => (i.runout_days <= 2.0)).length,
    warning_stockout_count: items.filter((i: any) => (i.runout_days > 2.0 && i.runout_days <= 5.0)).length,
    healthy_count: items.filter((i: any) => (i.runout_days > 5.0)).length,
  };

  const filteredItems = items.filter((item: any) => {
    const nameMatch = (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sku || "").toLowerCase().includes(searchQuery.toLowerCase());

    const itemStatus = item.status || (item.runout_days <= 2 ? "CRITICAL" : item.runout_days <= 5 ? "WARNING" : "HEALTHY");
    const statusMatch = filterStatus === "ALL" || itemStatus === filterStatus;
    return nameMatch && statusMatch;
  });

  const handleOpenEdit = (item: any) => {
    setEditingSku(item);
    setNewStockVal(item.inventory_stock ?? item.stock ?? 0);
    setNewVelocityVal(item.sales_velocity_7d ?? item.velocity ?? 1.0);
    setRestockReason("Direct warehouse replenishment");
  };

  const handleSaveStock = async () => {
    if (!editingSku) return;
    setSubmitting(true);
    setActionSuccess(null);
    try {
      await adjustStock(editingSku.id, newStockVal, restockReason);
      if (newVelocityVal !== (editingSku.sales_velocity_7d ?? editingSku.velocity)) {
        await adjustVelocity(editingSku.id, newVelocityVal);
      }
      setActionSuccess(`Successfully updated stock for ${editingSku.sku} to ${newStockVal} units!`);
      setEditingSku(null);
      onRefresh();
    } catch (e: any) {
      alert(`Error updating stock: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string, runout: number) => {
    if (status === "CRITICAL" || runout <= 2.0) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-950/80 text-purple-200 border border-purple-500/50">
          <AlertCircle className="w-3 h-3 mr-1 text-purple-400" /> Imminent Stockout ({runout.toFixed(1)}d)
        </span>
      );
    }
    if (status === "WARNING" || runout <= 5.0) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-900/40 text-purple-300 border border-purple-500/30">
          <AlertTriangle className="w-3 h-3 mr-1 text-purple-400" /> Low Stock ({runout.toFixed(1)}d)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-200 border border-purple-500/25">
        <CheckCircle2 className="w-3 h-3 mr-1 text-purple-300" /> Healthy ({runout.toFixed(1)}d)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-purple-100 flex items-center space-x-2">
            <Package className="w-6 h-6 text-purple-400" />
            <span>Warehouse Inventory & SKU Stock Health</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-purple-300/50 mt-1">
            Real-time multi-channel inventory stock levels, unit economics, daily burn velocity, and active ad spend allocation.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 shadow-sm transition interactive-button"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-xs text-purple-200 flex items-center justify-between animate-in fade-in">
          <span className="font-semibold">{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-purple-400 hover:text-purple-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Stock Units */}
        <div className="liquid-glass-card neon-edge-purple p-5 space-y-2 pl-6 interactive-card animate-stagger-1 border border-purple-500/15">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-purple-300/60 uppercase tracking-wider">
            <span>Total Stock Units</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-purple-100 font-mono">
            {summary.total_units_in_stock?.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-purple-300/50">
            Across <span className="font-semibold text-slate-700 dark:text-purple-200">{summary.total_skus}</span> catalog SKUs
          </div>
        </div>

        {/* Total Inventory Value */}
        <div className="liquid-glass-card neon-edge-violet p-5 space-y-2 pl-6 interactive-card animate-stagger-2 border border-purple-500/15">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-purple-300/60 uppercase tracking-wider">
            <span>Inventory Valuation</span>
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono">
            ${Math.round(summary.total_inventory_value || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-purple-300/50">
            Current asset valuation at MSRP
          </div>
        </div>

        {/* Critical Stockouts */}
        <div className="liquid-glass-card neon-edge-electric p-5 space-y-2 pl-6 interactive-card animate-stagger-3 border border-purple-500/15">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-purple-300/60 uppercase tracking-wider">
            <span>Stockout Hazard (&lt;2d)</span>
            <Flame className="w-4 h-4 text-purple-400" />
          </div>
          <div className={`text-2xl font-black font-mono ${summary.critical_stockout_count > 0 ? "text-purple-400" : "text-slate-900 dark:text-purple-100"}`}>
            {summary.critical_stockout_count} SKU{summary.critical_stockout_count === 1 ? "" : "s"}
          </div>
          <div className="text-[11px] text-purple-400 font-semibold">
            {summary.critical_stockout_count > 0 ? "Automatic spend reduction recommended" : "No imminent stockouts"}
          </div>
        </div>

        {/* Healthy Coverage */}
        <div className="liquid-glass-card neon-edge-lavender p-5 space-y-2 pl-6 interactive-card animate-stagger-4 border border-purple-500/15">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-purple-300/60 uppercase tracking-wider">
            <span>Healthy Stock Coverage</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-purple-100 font-mono">
            {summary.healthy_count} SKU{summary.healthy_count === 1 ? "" : "s"}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-purple-300/50">
            Available for budget scaling & arbitrage
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="liquid-glass-card p-4 flex flex-wrap items-center justify-between gap-3 border border-purple-500/15">
        <div className="flex items-center space-x-2 bg-purple-500/05 dark:bg-[#07070a] px-3.5 py-2 rounded-xl border border-purple-500/20 flex-1 max-w-md">
          <Search className="w-4 h-4 text-purple-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SKU code or product title..."
            className="bg-transparent text-xs text-slate-800 dark:text-purple-100 placeholder-purple-300/40 outline-none w-full font-medium"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 dark:text-purple-300/60 font-semibold uppercase text-[10px] tracking-wider">Status:</span>
          <div className="liquid-pill-track">
            {["ALL", "CRITICAL", "WARNING", "HEALTHY"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`liquid-pill-btn ${
                  filterStatus === status ? "active" : ""
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SKU Table & Card List */}
      <div className="liquid-glass-card overflow-hidden border border-purple-500/15">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-purple-500/05 dark:bg-[#07070a] border-b border-purple-500/15 text-[11px] font-bold text-slate-400 dark:text-purple-300/60 uppercase tracking-wider">
                <th className="py-3.5 px-4">SKU & Product</th>
                <th className="py-3.5 px-4 text-center">Stock Level</th>
                <th className="py-3.5 px-4 text-center">Velocity (7D)</th>
                <th className="py-3.5 px-4 text-center">Runout Days</th>
                <th className="py-3.5 px-4 text-center">Unit Economics</th>
                <th className="py-3.5 px-4 text-center">Active Ad Spend</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10 dark:divide-purple-500/15">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No SKU matches the current search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item: any) => {
                  const stock = item.inventory_stock ?? item.stock ?? 0;
                  const velocity = item.sales_velocity_7d ?? item.velocity ?? 1.0;
                  const runout = item.runout_days ?? (stock / Math.max(0.1, velocity));
                  const price = item.retail_price ?? item.price ?? 0;
                  const cogs = item.cogs ?? 0;
                  const shipping = item.shipping_cost ?? 5.0;
                  const marginPct = item.contribution_margin_pct ?? item.margin_pct ?? 40;
                  const unitProfit = item.unit_profit ?? (price - cogs - shipping);
                  const activeSpend = item.active_daily_ad_spend ?? 0;
                  const status = item.status ?? (runout <= 2 ? "CRITICAL" : runout <= 5 ? "WARNING" : "HEALTHY");

                  return (
                    <tr
                      key={item.id || item.sku}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-all duration-150 group"
                    >
                      {/* SKU & Title */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {item.name}
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="font-mono text-[11px] text-[#635bff] font-semibold">
                            {item.sku}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400 text-[11px]">
                            MSRP: ${price.toFixed(2)}
                          </span>
                        </div>
                      </td>

                      {/* Stock Level */}
                      <td className="py-4 px-4 text-center">
                        <span className={`text-base font-bold font-mono ${stock <= 20 ? "text-rose-600 font-extrabold" : "text-slate-800 dark:text-slate-200"}`}>
                          {stock.toLocaleString()}
                        </span>
                        <div className="text-[10px] text-slate-400">units in warehouse</div>
                      </td>

                      {/* 7D Velocity */}
                      <td className="py-4 px-4 text-center">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                          {velocity.toFixed(1)}
                        </span>
                        <div className="text-[10px] text-slate-400">units / day</div>
                      </td>

                      {/* Runout Days Bar */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`text-sm font-bold font-mono ${runout <= 2 ? "text-rose-600" : runout <= 5 ? "text-amber-500" : "text-emerald-600"}`}>
                            {runout.toFixed(1)} days
                          </span>
                          <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${runout <= 2 ? "bg-rose-500" : runout <= 5 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${Math.min(100, (runout / 30) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Unit Economics */}
                      <td className="py-4 px-4 text-center">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {marginPct}% Margin
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Profit: ${unitProfit.toFixed(2)}/unit
                        </div>
                      </td>

                      {/* Linked Ad Spend */}
                      <td className="py-4 px-4 text-center">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          ${activeSpend.toFixed(0)}/day
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {item.linked_campaigns_count || (activeSpend > 0 ? 1 : 0)} linked campaign
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4 text-center">
                        {getStatusBadge(status, runout)}
                      </td>

                      {/* Action Button */}
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition interactive-button group-hover:border group-hover:border-indigo-400/30"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Restock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock & Velocity Edit Modal */}
      {editingSku && (
        <div className="fixed inset-0 z-50 bg-[#050507]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0b0b10] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-purple-500/20 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/15">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-purple-100">
                  Adjust Inventory Stock
                </h3>
                <p className="text-xs text-slate-400 dark:text-purple-300/50">{editingSku.name}</p>
              </div>
              <button
                onClick={() => setEditingSku(null)}
                className="text-purple-400 hover:text-purple-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-purple-300/70 font-semibold mb-1">
                  New Total Stock Units in Warehouse:
                </label>
                <input
                  type="number"
                  value={newStockVal}
                  onChange={(e) => setNewStockVal(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-500/05 dark:bg-[#07070a] border border-purple-500/20 font-mono font-bold text-slate-900 dark:text-purple-100 text-sm outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-purple-300/70 font-semibold mb-1">
                  7-Day Burn Velocity (Units Sold Per Day):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newVelocityVal}
                  onChange={(e) => setNewVelocityVal(parseFloat(e.target.value) || 1.0)}
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-500/05 dark:bg-[#07070a] border border-purple-500/20 font-mono text-slate-900 dark:text-purple-100 text-sm outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-purple-300/70 font-semibold mb-1">
                  Restock Reason / PO Reference:
                </label>
                <input
                  type="text"
                  value={restockReason}
                  onChange={(e) => setRestockReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-500/05 dark:bg-[#07070a] border border-purple-500/20 text-slate-800 dark:text-purple-200 text-xs outline-none focus:border-purple-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-500/05 dark:bg-[#07070a] text-[11px] text-slate-500 dark:text-purple-300/60 space-y-1 border border-purple-500/15">
                <div>
                  Calculated Runout: <span className="font-bold text-slate-800 dark:text-purple-200">
                    {(newStockVal / Math.max(0.1, newVelocityVal)).toFixed(1)} days
                  </span>
                </div>
                <div>
                  Total Valuation: <span className="font-bold text-purple-400">
                    ${((newStockVal) * (editingSku.retail_price || editingSku.price || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-purple-500/15">
              <button
                onClick={() => setEditingSku(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-500/05 dark:bg-[#07070a] text-slate-600 dark:text-purple-300/70 border border-purple-500/15 hover:bg-purple-500/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStock}
                disabled={submitting}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold liquid-btn-primary transition interactive-button"
              >
                <Check className="w-4 h-4" />
                <span>{submitting ? "Saving..." : "Apply Inventory Adjustment"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
