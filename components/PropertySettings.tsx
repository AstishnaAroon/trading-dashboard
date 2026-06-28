"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../lib/supabaseClient";

interface Property {
  id: string;
  user_id: string;
  name: string;
  type: string;
  options: string[];
  formula_string: string | null;
  is_required: boolean;
}

const PROPERTY_TYPES = [
  { value: "text", label: "Text", desc: "Simple text string" },
  { value: "number", label: "Number", desc: "Integers or decimal values" },
  { value: "select", label: "Select", desc: "Single-option dropdown" },
  { value: "multi-select", label: "Multi-Select", desc: "Multi-option tags" },
  { value: "date", label: "Date & Time", desc: "ISO Timestamp picker" },
  { value: "checkbox", label: "Checkbox", desc: "True/False boolean toggle" },
  { value: "url", label: "URL", desc: "Secure clickable hyperlink" },
  { value: "file", label: "Files & Media", desc: "Secure S3 Object uploads" },
  { value: "formula", label: "Formula", desc: "Automated calculations (f)" },
  { value: "created_time", label: "Created Time", desc: "Automated entry timestamp" },
  { value: "last_edited_time", label: "Last Edited Time", desc: "Automated edit timestamp" },
];

// Predefined core database fields to display at the top of the schema checklist [3, DESIGN (5).md]
const CORE_SYSTEM_PROPERTIES: Property[] = [
  { id: "core-1", user_id: "system-core", name: "Currency Pair / Symbol", type: "text", options: [], formula_string: null, is_required: true },
  { id: "core-2", user_id: "system-core", name: "Direction (Buy/Sell)", type: "select", options: ["LONG (BUY)", "SHORT (SELL)"], formula_string: null, is_required: true },
  { id: "core-3", user_id: "system-core", name: "Net Profit/Loss ($)", type: "number", options: [], formula_string: null, is_required: true },
  { id: "core-4", user_id: "system-core", name: "Entry Date & Time", type: "date", options: [], formula_string: null, is_required: true },
];

export default function PropertySettings() {
  const { user } = useUser();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // New Property Form States
  const [name, setName] = useState<string>("");
  const [type, setType] = useState<string>("text");
  const [isRequired, setIsRequired] = useState<boolean>(false);
  const [formulaString, setFormulaString] = useState<string>("");
  
  // Option builder for select / multi-select
  const [newOption, setNewOption] = useState<string>("");
  const [optionsList, setOptionsList] = useState<string[]>([]);

  // Fetch active custom/system properties [3]
  const fetchProperties = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("user_properties")
      .select("*")
      .or(`user_id.eq.${user.id},user_id.eq.system`)
      .order("created_at", { ascending: true });

    if (!error && data) {
      // Prepend our core system properties so the user sees their entire layout in one unified list! [3, DESIGN (5).md]
      setProperties([...CORE_SYSTEM_PROPERTIES, ...(data as Property[])]);
    } else if (error) {
      setErrorMsg(error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const handleAddOption = () => {
    const cleanOption = newOption.trim();
    if (cleanOption && !optionsList.includes(cleanOption)) {
      setOptionsList([...optionsList, cleanOption]);
      setNewOption("");
    }
  };

  const handleRemoveOption = (opt: string) => {
    setOptionsList(optionsList.filter((o) => o !== opt));
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const cleanName = name.trim();
    if (!cleanName) return;

    // Check for duplicate names across custom AND core fields [3]
    const duplicate = properties.find((p) => p.name.toLowerCase() === cleanName.toLowerCase());
    if (duplicate) {
      setErrorMsg(`A property named "${cleanName}" already exists inside your active schema.`);
      return;
    }

    setSaving(true);
    setErrorMsg("");

    const newProperty = {
      user_id: user.id,
      name: cleanName,
      type,
      options: ["select", "multi-select"].includes(type) ? optionsList : [],
      formula_string: type === "formula" ? formulaString : null,
      is_required: isRequired,
    };

    const { error } = await supabase.from("user_properties").insert([newProperty]);

    setSaving(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setName("");
      setType("text");
      setIsRequired(false);
      setFormulaString("");
      setOptionsList([]);
      setNewOption("");
      fetchProperties();
    }
  };

  const handleDeleteProperty = async (id: string, propName: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the property "${propName}"?\nWarning: This will not delete past trade entries, but users will no longer see this field inside forms or tables [3].`
    );
    if (!confirmDelete) return;

    const { error } = await supabase.from("user_properties").delete().eq("id", id);
    if (!error) {
      setProperties((prev) => prev.filter((p) => p.id !== id));
    } else {
      setErrorMsg(error.message);
    }
  };

  if (loading) {
    return (
      <div className="w-full text-center py-8 text-ash text-xs uppercase tracking-widest font-bold">
        Loading property schemas...
      </div>
    );
  }

  return (
    <div className="w-full bg-slate border border-iron rounded-[10px] p-6 text-bone">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[14px] font-bold uppercase tracking-widest text-ash">Database Properties (Fields)</h3>
        <span className="material-symbols-outlined text-ash text-[18px]">schema</span>
      </div>

      {errorMsg && (
        <div className="bg-graphite border border-ember-gold text-ember-gold text-xs p-3 rounded-sm mb-4 text-center font-mono">
          Error: {errorMsg}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Column 1: Active Properties List (Including pre-pended Core Fields!) [3, DESIGN (5).md] */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          <h4 className="text-[11px] font-bold text-ash uppercase tracking-wider mb-2">Active Database Schema</h4>
          
          <div className="space-y-2 max-h-[420px] overflow-y-auto scrollbar-none pr-1 divide-y divide-iron/20">
            {properties.map((prop) => (
              <div key={prop.id} className="flex items-center justify-between py-3.5">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-bone text-[15px]">{prop.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-graphite border border-iron text-pearl select-none capitalize">
                      {prop.type === "multi-select" ? "Multi-Select" : prop.type}
                    </span>
                    {prop.is_required && (
                      <span className="text-[9px] font-bold text-ember-gold bg-ember-gold/10 px-1.5 py-0.5 rounded-sm">Required</span>
                    )}
                  </div>
                  {prop.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {prop.options.map((opt) => (
                        <span key={opt} className="text-[9px] font-semibold bg-graphite text-ash px-2 py-0.5 rounded-full border border-iron/40">
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}
                  {prop.type === "formula" && prop.formula_string && (
                    <p className="text-[10px] text-ember-gold font-mono mt-1.5">
                      f(x) = {prop.formula_string}
                    </p>
                  )}
                </div>

                {/* Condition-based actions: Only show "DELETE" if the row is a custom user-defined field */}
                {prop.user_id === "system-core" ? (
                  <span className="text-[9px] font-bold text-ember-gold uppercase select-none tracking-widest bg-ember-gold/10 border border-ember-gold/20 px-2 py-0.5 rounded-sm">
                    Core System Required
                  </span>
                ) : prop.user_id === "system" ? (
                  <span className="text-[9px] font-bold text-steel uppercase select-none tracking-wider">
                    System Default
                  </span>
                ) : (
                  <button
                    onClick={() => handleDeleteProperty(prop.id, prop.name)}
                    className="text-xs text-ash hover:text-ember-gold font-bold transition-colors cursor-pointer"
                  >
                    DELETE
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Create Property Form */}
        <form onSubmit={handleCreateProperty} className="col-span-12 lg:col-span-5 bg-graphite/30 border border-iron p-6 rounded-sm space-y-4">
          <h4 className="text-[11px] font-bold text-ash uppercase tracking-wider mb-2">Create Custom Property</h4>

          <div>
            <label className="block text-[10px] font-bold text-ash uppercase tracking-wider mb-2">Property Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hold Duration, Leverage"
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-ash uppercase tracking-wider mb-2">Property Type</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setOptionsList([]);
              }}
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none appearance-none cursor-pointer"
            >
              {PROPERTY_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {pt.label} ( {pt.desc} )
                </option>
              ))}
            </select>
          </div>

          {["select", "multi-select"].includes(type) && (
            <div className="bg-inkwell p-4 border border-iron rounded-sm space-y-3">
              <label className="block text-[10px] font-bold text-ash uppercase tracking-wider mb-2">Configure Dropdown Options</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="e.g. disciplined"
                  className="flex-grow bg-graphite border border-iron text-bone text-xs px-3 py-1.5 rounded-sm outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="bg-white text-inkwell text-xs font-bold px-4 py-1.5 rounded-sm hover:bg-bone cursor-pointer"
                >
                  ADD
                </button>
              </div>

              {optionsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {optionsList.map((opt) => (
                    <span key={opt} className="flex items-center gap-1.5 text-[9px] font-semibold bg-graphite text-bone px-2.5 py-0.5 rounded-full border border-iron">
                      {opt}
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(opt)}
                        className="text-[9px] text-ash hover:text-ember-gold font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {type === "formula" && (
            <div className="bg-inkwell p-4 border border-iron rounded-sm space-y-2">
              <label className="block text-[10px] font-bold text-ember-gold uppercase tracking-wider">Formula Math Equation</label>
              <input
                type="text"
                value={formulaString}
                onChange={(e) => setFormulaString(e.target.value)}
                placeholder="e.g. ({exit_price} - {entry_price}) * 10000"
                className="w-full bg-graphite border border-iron text-bone font-mono text-xs p-2 rounded-sm outline-none"
                required
              />
              <p className="text-[9px] text-ash leading-relaxed">
                Available variables: <code className="text-white font-mono">{`{entry_price}`}</code>, <code className="text-white font-mono">{`{exit_price}`}</code>, <code className="text-white font-mono">{`{pips}`}</code>, <code className="text-white font-mono">{`{pl}`}</code>, <code className="text-white font-mono">{`{risk_pct}`}</code>, <code className="text-white font-mono">{`{rr_actual}`}</code>.
              </p>
            </div>
          )}

          <div className="select-none py-1">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
                isRequired ? "bg-white border-white text-inkwell" : "bg-inkwell border-iron"
              }`}>
                {isRequired && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4L4 7L9 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-xs text-ash font-bold group-hover:text-bone transition-colors">Force Required Property</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-white text-inkwell h-12 font-bold text-[14px] rounded-sm hover:bg-bone transition-all duration-200 cursor-pointer uppercase tracking-wider"
          >
            {saving ? "Creating..." : "Add Property"}
          </button>
        </form>

      </div>
    </div>
  );
}