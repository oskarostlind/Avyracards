"use client";

import { useState } from "react";
import { Save, Loader2, Plus, Trash2, Tag, Layers, Edit, X, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

// --- TYPER ---
interface Variant {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  isActive: boolean;
  type: string;
  colorCode: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  variants: Variant[];
}

interface Discount {
  id: string;
  code: string;
  value: number;
  isActive: boolean;
}

export function ProductManager({ products, initialDiscounts }: { products: Product[], initialDiscounts: Discount[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"products" | "discounts">("products");

  // --- STATE ---
  const [savingId, setSavingId] = useState<string | null>(null); 
  const [edits, setEdits] = useState<Record<string, Partial<Variant>>>({});
  
  // State: Skapa ny variant
  const [newVariant, setNewVariant] = useState({ productId: "", name: "", price: 14900, compareAtPrice: 0, colorCode: "#000000" });
  const [isCreating, setIsCreating] = useState(false);

  // State: Massuppdatera & Produktredigering
  const [activePanel, setActivePanel] = useState<{ type: 'bulk' | 'product', id: string } | null>(null);
  
  // State för formulärvärden (Bulk & Product)
  const [bulkValues, setBulkValues] = useState({ price: 14900, compareAtPrice: 0 });
  const [productValues, setProductValues] = useState({ name: "", description: "" });
  const [isPanelSaving, setIsPanelSaving] = useState(false);

  // State: Rabatter
  const [discounts, setDiscounts] = useState<Discount[]>(initialDiscounts);
  const [newDiscountCode, setNewDiscountCode] = useState("");
  const [newDiscountValue, setNewDiscountValue] = useState(20);

  // --- FUNKTIONER ---
  const handleChange = (variantId: string, field: keyof Variant, value: any) => {
    setEdits((prev) => ({
      ...prev,
      [variantId]: { ...prev[variantId], [field]: value },
    }));
  };

  const handleSaveVariant = async (variantId: string) => {
    const changes = edits[variantId];
    if (!changes) return;
    setSavingId(variantId);

    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, ...changes }),
      });
      if (!res.ok) throw new Error("Fel");
      const newEdits = { ...edits };
      delete newEdits[variantId];
      setEdits(newEdits);
      router.refresh();
    } catch (e) { alert("Kunde inte spara"); } finally { setSavingId(null); }
  };

  const handleCreateVariant = async () => {
    if (!newVariant.productId) return;
    setIsCreating(true);
    try {
        const product = products.find(p => p.id === newVariant.productId);
        const type = product?.name.includes("Metal") || product?.name.includes("Standard") ? "PHYSICAL" : "SUBSCRIPTION";

        const res = await fetch("/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...newVariant, type }),
        });
        if (res.ok) {
            setNewVariant({ productId: "", name: "", price: 14900, compareAtPrice: 0, colorCode: "#000000" }); 
            router.refresh();
        }
    } catch (e) { alert("Fel vid skapande"); } finally { setIsCreating(false); }
  };

  // Massuppdatera PRIS
  const handleBulkUpdate = async (productId: string) => {
      if(!confirm("Detta ändrar priset på ALLA varianter. Säkert?")) return;
      setIsPanelSaving(true);
      try {
        const res = await fetch("/api/admin/products", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                productId, 
                price: bulkValues.price,
                compareAtPrice: bulkValues.compareAtPrice
            }),
        });
        if(res.ok) { setActivePanel(null); router.refresh(); }
      } catch (e) { alert("Fel"); } finally { setIsPanelSaving(false); }
  };

  // Uppdatera PRODUKT (Namn/Beskrivning)
  const handleUpdateProduct = async (productId: string) => {
      setIsPanelSaving(true);
      try {
        const res = await fetch("/api/admin/products", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                productId, 
                updateProduct: true, // Flagga för API
                name: productValues.name,
                description: productValues.description
            }),
        });
        if(res.ok) { setActivePanel(null); router.refresh(); }
      } catch (e) { alert("Fel"); } finally { setIsPanelSaving(false); }
  };

  // Rabatter
  const handleCreateDiscount = async () => {
    try {
        const res = await fetch("/api/admin/discounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: newDiscountCode, value: newDiscountValue }),
        });
        if (res.ok) {
            const created = await res.json();
            setDiscounts([created, ...discounts]);
            setNewDiscountCode("");
        }
    } catch (e) { alert("Fel"); }
  };

  const handleDeleteDiscount = async (id: string) => {
      if(!confirm("Är du säker?")) return;
      await fetch(`/api/admin/discounts?id=${id}`, { method: "DELETE" });
      setDiscounts(discounts.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-6">
      
      {/* --- TABS --- */}
      <div className="flex gap-4 border-b border-nordic-highlight/40 pb-1">
        <button onClick={() => setActiveTab("products")} className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === "products" ? "border-purple-500 text-nordic-secondary" : "border-transparent text-nordic-highlight hover:text-slate-300"}`}>
            <Layers size={16} /> Produkter & Varianter
        </button>
        <button onClick={() => setActiveTab("discounts")} className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === "discounts" ? "border-purple-500 text-nordic-secondary" : "border-transparent text-nordic-highlight hover:text-slate-300"}`}>
            <Tag size={16} /> Rabattkoder
        </button>
      </div>

      {/* --- VY: PRODUKTER --- */}
      {activeTab === "products" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
            {products.map((product) => (
                <div key={product.id} className="bg-slate-900 border border-nordic-highlight/40 rounded-xl overflow-hidden shadow-sm">
                    {/* HEADER */}
                    <div className="bg-nordic-primary px-6 py-4 border-b border-nordic-highlight/40 flex justify-between items-center flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-slate-100 text-lg">{product.name}</h3>
                            <button 
                                onClick={() => {
                                    if(activePanel?.id === product.id && activePanel.type === 'product') setActivePanel(null);
                                    else {
                                        setProductValues({ name: product.name, description: product.description || "" });
                                        setActivePanel({ type: 'product', id: product.id });
                                    }
                                }}
                                className="text-nordic-highlight hover:text-purple-400 transition-colors"
                                title="Redigera produktinfo"
                            >
                                <Settings size={16} />
                            </button>
                        </div>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => {
                                    if(activePanel?.id === product.id && activePanel.type === 'bulk') setActivePanel(null);
                                    else {
                                        if(product.variants[0]) setBulkValues({ price: product.variants[0].price, compareAtPrice: product.variants[0].compareAtPrice || 0 });
                                        setActivePanel({ type: 'bulk', id: product.id });
                                    }
                                }}
                                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-2 ${activePanel?.id === product.id && activePanel.type === 'bulk' ? "bg-blue-600 border-blue-500 text-nordic-secondary" : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-nordic-highlight/40"}`}
                            >
                                <Edit size={14} /> Pris (Alla)
                            </button>

                            <button 
                                onClick={() => setNewVariant({ ...newVariant, productId: product.id })}
                                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-nordic-highlight/40 transition-colors flex items-center gap-2"
                            >
                                <Plus size={14} /> Ny Färg
                            </button>
                        </div>
                    </div>

                    {/* --- PANEL: REDIGERA PRODUKT --- */}
                    {activePanel?.id === product.id && activePanel.type === 'product' && (
                        <div className="bg-slate-800/50 border-b border-nordic-highlight/40 p-4 animate-in slide-in-from-top-2">
                            <h4 className="text-xs font-bold text-nordic-highlight mb-3 uppercase tracking-wider">Redigera Produkt</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div>
                                    <label className="text-xs text-nordic-highlight mb-1 block">Produktnamn</label>
                                    <input type="text" className="w-full bg-slate-900 border border-nordic-highlight/40 rounded px-3 py-2 text-sm text-nordic-secondary focus:ring-2 focus:ring-purple-500" 
                                        value={productValues.name} onChange={e => setProductValues({...productValues, name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs text-nordic-highlight mb-1 block">Beskrivning (kort)</label>
                                    <input type="text" className="w-full bg-slate-900 border border-nordic-highlight/40 rounded px-3 py-2 text-sm text-nordic-secondary focus:ring-2 focus:ring-purple-500" 
                                        value={productValues.description} onChange={e => setProductValues({...productValues, description: e.target.value})} />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleUpdateProduct(product.id)} disabled={isPanelSaving} className="bg-purple-600 hover:bg-purple-500 text-nordic-secondary px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                        {isPanelSaving ? <Loader2 className="animate-spin h-4 w-4"/> : <Save size={16}/>} Spara
                                    </button>
                                    <button onClick={() => setActivePanel(null)} className="px-3 text-nordic-highlight hover:text-nordic-secondary"><X size={18}/></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- PANEL: MASSUPPDATERING --- */}
                    {activePanel?.id === product.id && activePanel.type === 'bulk' && (
                        <div className="bg-blue-500/10 border-b border-blue-500/20 p-4 animate-in slide-in-from-top-2">
                            <h4 className="text-xs font-bold text-blue-300 mb-3 uppercase tracking-wider">Massuppdatera Priser</h4>
                            <div className="flex items-end gap-4 max-w-3xl">
                                <div className="flex-1">
                                    <label className="text-xs text-blue-300/70 mb-1 block">Nytt Pris (Alla)</label>
                                    <input type="number" className="w-full bg-slate-900 border border-nordic-highlight/40 rounded px-3 py-2 text-sm text-nordic-secondary focus:ring-2 focus:ring-blue-500" 
                                        value={bulkValues.price} onChange={e => setBulkValues({...bulkValues, price: parseInt(e.target.value)})} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-blue-300/70 mb-1 block">Nytt Ord. Pris (Alla)</label>
                                    <input type="number" className="w-full bg-slate-900 border border-nordic-highlight/40 rounded px-3 py-2 text-sm text-nordic-secondary focus:ring-2 focus:ring-blue-500" 
                                        value={bulkValues.compareAtPrice} onChange={e => setBulkValues({...bulkValues, compareAtPrice: parseInt(e.target.value)})} />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleBulkUpdate(product.id)} disabled={isPanelSaving} className="bg-blue-600 hover:bg-blue-500 text-nordic-secondary px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                        {isPanelSaving ? <Loader2 className="animate-spin h-4 w-4"/> : <Save size={16}/>} Uppdatera
                                    </button>
                                    <button onClick={() => setActivePanel(null)} className="px-3 text-nordic-highlight hover:text-nordic-secondary"><X size={18}/></button>
                                </div>
                            </div>
                        </div>
                    )}
                
                {/* LISTA MED VARIANTER */}
                <div className="divide-y divide-slate-800">
                    {product.variants.map((variant) => {
                    const pendingChanges = edits[variant.id];
                    const currentName = pendingChanges?.name ?? variant.name;
                    const currentColor = pendingChanges?.colorCode ?? variant.colorCode ?? "#000000";
                    const currentPrice = pendingChanges?.price ?? variant.price;
                    const currentCompareAt = pendingChanges?.compareAtPrice ?? variant.compareAtPrice ?? 0;
                    const currentStock = pendingChanges?.stock ?? variant.stock;
                    const currentActive = pendingChanges?.isActive ?? variant.isActive;
                    const hasChanges = !!pendingChanges;

                    return (
                        <div key={variant.id} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-end hover:bg-slate-800/30 transition-colors">
                            
                            {/* 1. NAMN & FÄRG (REDIGERBART NU) */}
                            <div className="md:col-span-3 space-y-2">
                                <div>
                                    <label className="text-[10px] text-nordic-highlight block mb-1">Variantnamn</label>
                                    <input type="text" value={currentName} onChange={(e) => handleChange(variant.id, "name", e.target.value)} 
                                        className="bg-nordic-primary border border-nordic-highlight/40 rounded px-2 py-1 text-sm w-full text-nordic-secondary focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                                <div className="flex gap-2 items-center">
                                    <input type="color" value={currentColor} onChange={(e) => handleChange(variant.id, "colorCode", e.target.value)} 
                                        className="h-6 w-8 bg-transparent cursor-pointer rounded border-none p-0" title="Välj färg" />
                                    <input type="text" value={currentColor} onChange={(e) => handleChange(variant.id, "colorCode", e.target.value)} 
                                        className="bg-nordic-primary border border-nordic-highlight/40 rounded px-2 py-1 text-xs w-full text-nordic-highlight uppercase font-mono" />
                                </div>
                            </div>

                            {/* 2. PRIS */}
                            <div className="md:col-span-4 flex gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] text-emerald-500 block mb-1 uppercase tracking-wider font-bold">Pris (öre)</label>
                                    <input type="number" value={currentPrice} onChange={(e) => handleChange(variant.id, "price", parseInt(e.target.value))} className="bg-nordic-primary border border-nordic-highlight/40 rounded px-2 py-1 text-sm w-full text-nordic-secondary focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] text-nordic-highlight block mb-1 uppercase tracking-wider">Ord. Pris</label>
                                    <input type="number" value={currentCompareAt || ""} onChange={(e) => handleChange(variant.id, "compareAtPrice", parseInt(e.target.value))} className="bg-nordic-primary border border-nordic-highlight/40 rounded px-2 py-1 text-sm w-full text-nordic-highlight focus:ring-2 focus:ring-purple-500 outline-none" placeholder="-" />
                                </div>
                            </div>

                            {/* 3. LAGER */}
                            <div className="md:col-span-1">
                                <label className="text-[10px] text-nordic-highlight block mb-1 uppercase tracking-wider">Lager</label>
                                <input type="number" value={currentStock} onChange={(e) => handleChange(variant.id, "stock", parseInt(e.target.value))} className="bg-nordic-primary border border-nordic-highlight/40 rounded px-2 py-1 text-sm w-full text-nordic-secondary focus:ring-2 focus:ring-purple-500 outline-none" />
                            </div>

                            {/* 4. STATUS & SPARA */}
                            <div className="md:col-span-4 flex justify-between items-center gap-2">
                                <button onClick={() => handleChange(variant.id, "isActive", !currentActive)} className={`h-8 px-3 rounded text-xs font-bold border transition-colors ${currentActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                                    {currentActive ? "AKTIV" : "INAKTIV"}
                                </button>
                                
                                {hasChanges && (
                                    <button onClick={() => handleSaveVariant(variant.id)} disabled={!!savingId} className="h-8 flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-nordic-secondary px-4 rounded text-sm font-bold transition-all shadow-lg shadow-purple-500/20 animate-in fade-in zoom-in duration-200">
                                        {savingId === variant.id ? <Loader2 className="animate-spin h-4 w-4"/> : <Save size={16}/>} Spara
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                    })}
                    
                    {/* PANEL: NY VARIANT (Samma som förut) */}
                    {newVariant.productId === product.id && (
                        <div className="p-4 bg-purple-500/5 border-l-2 border-purple-500 animate-in slide-in-from-top-2">
                            <h4 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2"><Plus size={14}/> Lägg till ny variant till {product.name}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                <div className="md:col-span-1"><label className="text-xs text-nordic-highlight mb-1 block">Namn</label><input type="text" className="w-full bg-slate-900 border border-nordic-highlight/40 rounded px-2 py-1.5 text-sm" value={newVariant.name} onChange={e => setNewVariant({...newVariant, name: e.target.value})} /></div>
                                <div className="md:col-span-1"><label className="text-xs text-nordic-highlight mb-1 block">Färgkod</label><div className="flex gap-2"><input type="color" className="h-8 w-8 rounded cursor-pointer bg-transparent border-none" value={newVariant.colorCode} onChange={e => setNewVariant({...newVariant, colorCode: e.target.value})} /><input type="text" className="w-full bg-slate-900 border border-nordic-highlight/40 rounded px-2 py-1.5 text-sm uppercase" value={newVariant.colorCode} onChange={e => setNewVariant({...newVariant, colorCode: e.target.value})} /></div></div>
                                <div className="md:col-span-1"><label className="text-xs text-nordic-highlight mb-1 block">Pris (öre)</label><input type="number" className="w-full bg-slate-900 border border-nordic-highlight/40 rounded px-2 py-1.5 text-sm" value={newVariant.price} onChange={e => setNewVariant({...newVariant, price: parseInt(e.target.value)})} /></div>
                                <div className="md:col-span-1"><label className="text-xs text-nordic-highlight mb-1 block">Ord. Pris</label><input type="number" className="w-full bg-slate-900 border border-nordic-highlight/40 rounded px-2 py-1.5 text-sm" value={newVariant.compareAtPrice} onChange={e => setNewVariant({...newVariant, compareAtPrice: parseInt(e.target.value)})} /></div>
                                <div className="md:col-span-1 flex gap-2"><button onClick={handleCreateVariant} disabled={isCreating || !newVariant.name} className="flex-1 bg-purple-600 text-nordic-secondary px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-purple-500">{isCreating ? "..." : "Lägg till"}</button><button onClick={() => setNewVariant({...newVariant, productId: ""})} className="px-3 py-1.5 text-nordic-highlight hover:text-nordic-secondary text-sm">X</button></div>
                            </div>
                        </div>
                    )}
                </div>
                </div>
            ))}
          </div>
      )}

      {/* --- VY: RABATTKODER (Oförändrad) --- */}
      {activeTab === "discounts" && (
          <div className="animate-in fade-in slide-in-from-right-4">
              <div className="bg-slate-900 border border-nordic-highlight/40 rounded-xl p-6 mb-6">
                  <h3 className="font-bold text-nordic-secondary mb-4">Skapa ny kod</h3>
                  <div className="flex gap-4 items-end">
                      <div className="flex-1">
                          <label className="text-xs text-nordic-highlight mb-1 block">Kod (t.ex. SOMMAR20)</label>
                          <input type="text" className="w-full bg-nordic-primary border border-nordic-highlight/40 rounded px-3 py-2 text-nordic-secondary uppercase" 
                              value={newDiscountCode} onChange={e => setNewDiscountCode(e.target.value)} placeholder="ANGE KOD" />
                      </div>
                      <div className="w-32">
                          <label className="text-xs text-nordic-highlight mb-1 block">Rabatt (%)</label>
                          <input type="number" className="w-full bg-nordic-primary border border-nordic-highlight/40 rounded px-3 py-2 text-nordic-secondary" 
                              value={newDiscountValue} onChange={e => setNewDiscountValue(parseInt(e.target.value))} />
                      </div>
                      <button onClick={handleCreateDiscount} disabled={!newDiscountCode} className="bg-emerald-600 hover:bg-emerald-500 text-nordic-secondary px-6 py-2 rounded-lg font-bold">Skapa</button>
                  </div>
              </div>
              <div className="bg-slate-900 border border-nordic-highlight/40 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-nordic-primary text-nordic-highlight"><tr><th className="px-6 py-3">Kod</th><th className="px-6 py-3">Värde</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Åtgärd</th></tr></thead>
                      <tbody className="divide-y divide-slate-800">
                          {discounts.map(d => (
                              <tr key={d.id} className="text-slate-300">
                                  <td className="px-6 py-3 font-mono font-bold">{d.code}</td>
                                  <td className="px-6 py-3 text-emerald-400">{d.value}%</td>
                                  <td className="px-6 py-3"><span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-xs font-bold">AKTIV</span></td>
                                  <td className="px-6 py-3 text-right"><button onClick={() => handleDeleteDiscount(d.id)} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}
    </div>
  );
}