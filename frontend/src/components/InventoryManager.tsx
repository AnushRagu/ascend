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
  Check,
  X,
  Sparkles,
  Trash2,
  ShieldCheck
} from "lucide-react";
import { adjustStock, adjustVelocity, createSKU, deleteSKU, CreateSKUInput } from "@/lib/api";

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

  // New SKU Creation Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSkuData, setNewSkuData] = useState<CreateSKUInput>({
    sku: "",
    name: "",
    retail_price: 49.0,
    cogs: 14.0,
    shipping_cost: 5.0,
    inventory_stock: 250,
    sales_velocity_7d: 8.0,
  });
  const [addError, setAddError] = useState<string | null>(null);

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

  const handleCreateSkuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAddError(null);
    setActionSuccess(null);

    try {
      if (!newSkuData.sku.trim()) throw new Error("SKU code is required (e.g. HYDRA-SERUM-50ML)");
      if (!newSkuData.name.trim()) throw new Error("Product title is required");
      if (newSkuData.retail_price <= 0) throw new Error("MSRP/Retail price must be greater than 0");
      if (newSkuData.cogs < 0) throw new Error("COGS cannot be negative");

      const res = await createSKU({
        ...newSkuData,
        sku: newSkuData.sku.trim().toUpperCase(),
        name: newSkuData.name.trim(),
      });

      setActionSuccess(res.message || `Added ${newSkuData.sku.toUpperCase()} to inventory successfully!`);
      setIsAddModalOpen(false);
      // Reset form defaults
      setNewSkuData({
        sku: "",
        name: "",
        retail_price: 49.0,
        cogs: 14.0,
        shipping_cost: 5.0,
        inventory_stock: 250,
        sales_velocity_7d: 8.0,
      });
      onRefresh();
    } catch (err: any) {
      setAddError(err.message || "Failed to add product SKU");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSku = async (item: any) => {
    const skuCode = item.sku || item.id;
    if (!window.confirm(`Are you sure you want to remove ${skuCode} (${item.name || "Product"}) from inventory? Linked campaigns will be unlinked.`)) {
      return;
    }

    setSubmitting(true);
    setActionSuccess(null);
    try {
      const res = await deleteSKU(item.id || item.sku);
      setActionSuccess(res.message || `Removed ${skuCode} from inventory.`);
      onRefresh();
    } catch (err: any) {
      alert(`Error removing SKU: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string, runout: number) => {
    if (status === "CRITICAL" || runout <= 2.0) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/30">
          <AlertCircle className="w-3 h-3 mr-1 text-rose-500" /> Imminent Stockout ({runout.toFixed(1)}d)
        </span>
      );
    }
    if (status === "WARNING" || runout <= 5.0) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3 mr-1 text-amber-500" /> Low Stock ({runout.toFixed(1)}d)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" /> Healthy ({runout.toFixed(1)}d)
      </span>
    );
  };

  // Preview unit economics calculation for modal
  const previewMarginDollars = (newSkuData.retail_price - newSkuData.cogs - (newSkuData.shipping_cost || 0));
  const previewMarginPct = newSkuData.retail_price > 0 ? (previewMarginDollars / newSkuData.retail_price) * 100 : 0;
  const previewRunoutDays = (newSkuData.sales_velocity_7d || 0) > 0 ? (newSkuData.inventory_stock || 0) / (newSkuData.sales_velocity_7d || 1) : 999;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Package className="w-6 h-6 text-purple-600 dark:text-white" />
            <span>Warehouse Inventory & SKU Stock Health</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-white/60 mt-1">
            Real-time multi-channel inventory stock levels, unit economics, daily burn velocity, and active ad spend allocation.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 relative">
          {/* Add New Stock Item Button & Anchored Popup */}
          <div className="relative">
            <button
              onClick={() => {
                setAddError(null);
                setNewSkuData({
                  sku: "",
                  name: "",
                  retail_price: 49.0,
                  cogs: 14.0,
                  shipping_cost: 5.0,
                  inventory_stock: 250,
                  sales_velocity_7d: 8.0,
                });
                setIsAddModalOpen(!isAddModalOpen);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold liquid-btn-primary shadow-sm transition interactive-button"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stock Item</span>
            </button>

            {/* Popup Anchored Directly Under 'Add Stock Item' Button with Pure Glass Transparency */}
            {isAddModalOpen && (
              <>
                {/* Transparent click-outside dismisser without any black screen */}
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setIsAddModalOpen(false)}
                />

                <div className="absolute right-0 top-full mt-2 z-50 w-[92vw] sm:w-[460px] p-5 space-y-4 rounded-2xl animate-in fade-in zoom-in-95 bg-slate-900/95 dark:bg-[#0e0f17]/95 border border-slate-700/60 dark:border-white/20 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-600/10 dark:bg-white/10 text-purple-600 dark:text-white flex items-center justify-center">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          Add or Restock Product SKU
                        </h3>
                        <p className="text-[10px] opacity-60">Register new or replenish existing SKU</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {addError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-medium">
                      {addError}
                    </div>
                  )}

                  <form onSubmit={handleCreateSkuSubmit} className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1 opacity-80 text-[11px]">
                          SKU Identifier Code *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. GLOW-BODY-OIL-100"
                          value={newSkuData.sku}
                          onChange={(e) => setNewSkuData({ ...newSkuData, sku: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl bg-white/50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 font-mono uppercase text-slate-900 dark:text-white text-xs outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 opacity-80 text-[11px]">
                          Product Title / Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Luminous Body Glow Oil"
                          value={newSkuData.name}
                          onChange={(e) => setNewSkuData({ ...newSkuData, name: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl bg-white/50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white text-xs outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* Pricing & Costs */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block font-semibold mb-1 opacity-80 text-[11px]">
                          Retail Price ($) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={newSkuData.retail_price}
                          onChange={(e) => setNewSkuData({ ...newSkuData, retail_price: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-white/50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 font-mono text-slate-900 dark:text-white text-xs outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 opacity-80 text-[11px]">
                          Unit COGS ($) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={newSkuData.cogs}
                          onChange={(e) => setNewSkuData({ ...newSkuData, cogs: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-white/50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 font-mono text-slate-900 dark:text-white text-xs outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 opacity-80 text-[11px]">
                          Shipping Cost ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newSkuData.shipping_cost}
                          onChange={(e) => setNewSkuData({ ...newSkuData, shipping_cost: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-white/50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 font-mono text-slate-900 dark:text-white text-xs outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* Stock and Velocity */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1 opacity-80 text-[11px]">
                          Warehouse Units *
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={newSkuData.inventory_stock}
                          onChange={(e) => setNewSkuData({ ...newSkuData, inventory_stock: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-1.5 rounded-xl bg-white/50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 font-mono text-slate-900 dark:text-white text-xs outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 opacity-80 text-[11px]">
                          Burn Velocity (units/day)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.1"
                          required
                          value={newSkuData.sales_velocity_7d}
                          onChange={(e) => setNewSkuData({ ...newSkuData, sales_velocity_7d: parseFloat(e.target.value) || 1.0 })}
                          className="w-full px-3 py-1.5 rounded-xl bg-white/50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 font-mono text-slate-900 dark:text-white text-xs outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* Dynamic Telemetry Unit Economics Preview */}
                    <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 space-y-1 text-[11px]">
                      <div className="font-semibold text-slate-700 dark:text-white flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-purple-500 dark:text-purple-300" />
                        <span>Calculated Economics:</span>
                      </div>
                      <div className="flex items-center justify-between opacity-80">
                        <span>Contribution Profit:</span>
                        <b className="font-mono text-slate-900 dark:text-white">${previewMarginDollars.toFixed(2)} / unit</b>
                      </div>
                      <div className="flex items-center justify-between opacity-80">
                        <span>Contribution Margin:</span>
                        <b className="font-mono text-emerald-600 dark:text-emerald-400">{previewMarginPct.toFixed(1)}%</b>
                      </div>
                      <div className="flex items-center justify-between opacity-80">
                        <span>Runout Buffer:</span>
                        <b className="font-mono text-slate-900 dark:text-white">{previewRunoutDays.toFixed(1)} days</b>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-2 pt-1 border-t border-black/5 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200/60 dark:bg-white/[0.08] text-slate-700 dark:text-white hover:bg-slate-300/60 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold liquid-btn-primary transition interactive-button"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{submitting ? "Saving..." : "Save Product SKU"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>

          <button
            onClick={onRefresh}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-200/60 dark:bg-white/[0.06] hover:bg-slate-300/60 dark:hover:bg-white/[0.12] text-slate-700 dark:text-white border border-slate-300/40 dark:border-white/[0.08] shadow-sm transition interactive-button"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Stock</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-in fade-in">
          <span className="font-semibold">{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 dark:text-emerald-400 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Stock Units */}
        <div className="liquid-glass-card neon-edge-purple p-5 space-y-2 pl-6 interactive-card animate-stagger-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">
            <span>Total Stock Units</span>
            <Layers className="w-4 h-4 opacity-70" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {summary.total_units_in_stock?.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-white/50">
            Across <span className="font-semibold text-slate-700 dark:text-white/90">{summary.total_skus}</span> catalog SKUs
          </div>
        </div>

        {/* Total Inventory Value */}
        <div className="liquid-glass-card neon-edge-violet p-5 space-y-2 pl-6 interactive-card animate-stagger-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">
            <span>Inventory Valuation</span>
            <DollarSign className="w-4 h-4 opacity-70" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            ${Math.round(summary.total_inventory_value || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-white/50">
            Current asset valuation at MSRP
          </div>
        </div>

        {/* Critical Stockouts */}
        <div className="liquid-glass-card neon-edge-electric p-5 space-y-2 pl-6 interactive-card animate-stagger-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">
            <span>Stockout Hazard (&lt;2d)</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className={`text-2xl font-bold font-mono ${summary.critical_stockout_count > 0 ? "text-rose-500" : "text-slate-900 dark:text-white"}`}>
            {summary.critical_stockout_count} SKU{summary.critical_stockout_count === 1 ? "" : "s"}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-white/50 font-medium">
            {summary.critical_stockout_count > 0 ? "Automatic spend reduction recommended" : "No imminent stockouts"}
          </div>
        </div>

        {/* Healthy Coverage */}
        <div className="liquid-glass-card neon-edge-lavender p-5 space-y-2 pl-6 interactive-card animate-stagger-4">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">
            <span>Healthy Stock Coverage</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {summary.healthy_count} SKU{summary.healthy_count === 1 ? "" : "s"}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-white/50">
            Available for budget scaling & arbitrage
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="liquid-glass-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 bg-slate-200/50 dark:bg-white/[0.04] px-3.5 py-2 rounded-xl border border-slate-300/40 dark:border-white/[0.08] flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SKU code or product title..."
            className="bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 outline-none w-full font-medium"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 dark:text-white/60 font-semibold uppercase text-[10px] tracking-wider">Status:</span>
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
      <div className="liquid-glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-white/[0.03] border-b border-slate-200/60 dark:border-white/[0.06] text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">
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
            <tbody className="divide-y divide-slate-200/50 dark:divide-white/[0.05]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-white/40">
                    No matching inventory products found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item: any) => {
                  const runout = item.runout_days ?? ((item.inventory_stock || 0) / Math.max(0.1, item.sales_velocity_7d || 1));
                  const itemStatus = item.status || (runout <= 2 ? "CRITICAL" : runout <= 5 ? "WARNING" : "HEALTHY");

                  return (
                    <tr key={item.id || item.sku} className="hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                        <div className="text-[11px] font-mono opacity-60 flex items-center space-x-2 mt-0.5">
                          <span className="font-semibold">{item.sku}</span>
                          <span>·</span>
                          <span>MSRP: ${item.retail_price || item.price}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                          {(item.inventory_stock ?? item.stock ?? 0).toLocaleString()}
                        </span>
                        <div className="text-[10px] opacity-50">units in warehouse</div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="font-mono font-medium text-slate-900 dark:text-white">
                          {(item.sales_velocity_7d ?? item.velocity ?? 0).toFixed(1)}
                        </span>
                        <div className="text-[10px] opacity-50">units / day</div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className={`font-mono font-bold text-sm ${runout <= 2 ? "text-rose-500 underline" : runout <= 5 ? "text-amber-500" : "text-emerald-500"}`}>
                          {runout.toFixed(1)} days
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {item.contribution_margin_pct ?? 40}% Margin
                        </div>
                        <div className="text-[10px] opacity-50 font-mono">
                          Profit: ${item.unit_profit ? item.unit_profit.toFixed(2) : ((item.retail_price || 0) * 0.4).toFixed(2)}/unit
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">
                          ${item.active_daily_ad_spend ? item.active_daily_ad_spend.toFixed(0) : "0"}/day
                        </span>
                        <div className="text-[10px] opacity-50">
                          {item.linked_campaigns_count ?? (item.linked_campaigns?.length || 0)} campaigns
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        {getStatusBadge(itemStatus, runout)}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Adjust Stock"
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-200/60 dark:bg-white/[0.08] hover:bg-slate-300/60 dark:hover:bg-white/[0.15] text-slate-800 dark:text-white transition flex items-center space-x-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Adjust</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSku(item)}
                            title="Remove SKU"
                            className="p-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/20 transition flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: ADJUST EXISTING STOCK */}
      {editingSku && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-md">
          <div className="liquid-glass-card w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 backdrop-blur-2xl bg-white/75 dark:bg-[#0c0c14]/75 border border-white/80 dark:border-white/15 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Adjust Stock: {editingSku.sku}
                </h3>
                <p className="text-[11px] opacity-60">{editingSku.name}</p>
              </div>
              <button
                onClick={() => setEditingSku(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 opacity-80">
                  New Total Stock Units in Warehouse:
                </label>
                <input
                  type="number"
                  value={newStockVal}
                  onChange={(e) => setNewStockVal(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-300/80 dark:border-white/[0.1] font-mono font-bold text-slate-900 dark:text-white text-sm outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 opacity-80">
                  7-Day Burn Velocity (Units Sold Per Day):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newVelocityVal}
                  onChange={(e) => setNewVelocityVal(parseFloat(e.target.value) || 1.0)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-300/80 dark:border-white/[0.1] font-mono text-slate-900 dark:text-white text-sm outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 opacity-80">
                  Restock Reason / PO Reference:
                </label>
                <input
                  type="text"
                  value={restockReason}
                  onChange={(e) => setRestockReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-300/80 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs outline-none focus:border-purple-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-white/[0.04] text-[11px] opacity-80 space-y-1 border border-slate-200 dark:border-white/[0.08]">
                <div>
                  Calculated Runout: <span className="font-bold text-slate-900 dark:text-white">
                    {(newStockVal / Math.max(0.1, newVelocityVal)).toFixed(1)} days
                  </span>
                </div>
                <div>
                  Total Valuation: <span className="font-bold text-slate-900 dark:text-white">
                    ${((newStockVal) * (editingSku.retail_price || editingSku.price || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-white/[0.08]">
              <button
                onClick={() => setEditingSku(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200/60 dark:bg-white/[0.08] text-slate-700 dark:text-white hover:bg-slate-300/60 transition"
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
