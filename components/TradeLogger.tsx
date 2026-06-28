"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../lib/supabaseClient";

interface StrategyOption {
  id: string;
  name: string;
}

interface Property {
  id: string;
  name: string;
  type: "text" | "number" | "select" | "multi-select" | "date" | "checkbox" | "url" | "file" | "formula" | "created_time" | "last_edited_time";
  options: string[];
  formula_string: string | null;
  is_required: boolean;
}

// All constants declared globally at the top level
const PAIR_INPUTS = ["EUR/USD", "GBP/USD", "AUD/USD", "USD/JPY", "EUR/JPY", "GBP/JPY", "XAU/USD (Gold)"];
const SESSIONS = ["London", "New York", "Asian", "Overnight"];
const OUTCOMES = ["WIN", "LOSS", "BE", "UNTAPPED", "INVALID"];
const EMOTIONS = ["disciplined", "greedy", "fearful", "fomo", "impatient", "anxious"];

const cleanInputOnBlur = (value: string, setter: (val: string) => void, fallback = "") => {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    setter(fallback);
  } else {
    setter(Math.abs(parsed).toString());
  }
};

const getLocalISODateTime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

export default function TradeLogger() {
  const { user } = useUser();
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Core Fields (Hardcoded at the top) [DESIGN (5).md]
  const [date, setDate] = useState<string>(getLocalISODateTime());
  const [pair, setPair] = useState<string>("EUR/USD");
  const [direction, setDirection] = useState<string>("LONG");
  const [pl, setPl] = useState<string>("0");

  // Dynamic Properties States [3]
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyValues, setPropertyValues] = useState<{ [key: string]: any }>({});
  
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Fetch active properties (system defaults + user custom ones) [3]
  const fetchProperties = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("user_properties")
      .select("*")
      .or(`user_id.eq.${user.id},user_id.eq.system`)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setProperties(data as Property[]);
      
      const initialValues: { [key: string]: any } = {};
      data.forEach((prop) => {
        if (prop.type === "checkbox") initialValues[prop.name] = false;
        else if (prop.type === "multi-select") initialValues[prop.name] = [];
        else initialValues[prop.name] = "";
      });
      setPropertyValues(initialValues);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  // Handle uploading files/screenshots directly to Supabase S3 Object Storage [3]
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, propName: string) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingField(propName);
    setErrorMsg("");

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from("trades-media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("trades-media")
        .getPublicUrl(filePath);

      setPropertyValues((prev) => ({
        ...prev,
        [propName]: publicUrl,
      }));
    } catch (err: any) {
      console.error("S3 Upload error:", err);
      setErrorMsg(`File upload failed: ${err.message}`);
    } finally {
      setUploadingField(null);
    }
  };

  // Extract Entry/Exit prices from dynamic state to use in automatic calculations [DESIGN (5).md]
  const entryPrice = propertyValues["Entry Price"] || "";
  const exitPrice = propertyValues["Exit Price"] || "";

  // Auto-calculate P&L and Pips based on entry/exit, writing directly to dynamic state [3]
  const handlePriceBlur = () => {
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    if (isNaN(entry) || isNaN(exit)) return;

    const isJPY = pair.includes("JPY");
    const isGold = pair.includes("Gold");

    let calculatedPips = 0;
    if (isJPY) {
      calculatedPips = (exit - entry) * 100;
    } else if (isGold) {
      calculatedPips = (exit - entry) * 10;
    } else {
      calculatedPips = (exit - entry) * 10000;
    }

    if (direction === "SHORT") {
      calculatedPips = -calculatedPips;
    }

    // Save the pips calculation directly inside the dynamic state! [3]
    setPropertyValues((prev) => ({
      ...prev,
      "Pips Gained/Lost": calculatedPips.toFixed(1),
    }));
  };

  // Fixed: Re-named to handleSubmit to perfectly match the JSX form onSubmit trigger [2]
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg("You must be logged in to save trades.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccess(false);

    // Validate required fields [3]
    for (const prop of properties) {
      if (prop.is_required && !propertyValues[prop.name]) {
        setErrorMsg(`The field "${prop.name}" is required.`);
        setLoading(false);
        return;
      }
    }

    const nativeFields: { [key: string]: any } = {};
    const customFieldsJson: { [key: string]: any } = {};

    properties.forEach((prop) => {
      const val = propertyValues[prop.name];

      const nativeMappingKeys: { [key: string]: string } = {
        "trading session": "session",
        "entry price": "entry_price",
        "exit price": "exit_price",
        "pips gained/lost": "pips",
        "risk percentage (%)": "risk_pct",
        "planned r:r": "rr_planned",
        "actual r:r": "rr_actual",
        "outcome": "outcome",
        "emotion": "emotion",
        "confluence score": "confluence_score",
        "followed rules": "followed_rules",
        "moved to be": "be_moved",
        "review notes": "notes",
      };

      const mappedKey = nativeMappingKeys[prop.name.toLowerCase()];
      
      if (mappedKey) {
        if (prop.type === "number") {
          nativeFields[mappedKey] = parseFloat(val) || null;
        } else if (prop.type === "checkbox") {
          nativeFields[mappedKey] = !!val;
        } else {
          nativeFields[mappedKey] = val || null;
        }
      } else {
        customFieldsJson[prop.name] = {
          value: val,
          type: prop.type,
        };
      }
    });

    const tradePayload = {
      user_id: user.id,
      date: new Date(date).toISOString(),
      pair,
      direction,
      pl: parseFloat(pl) || 0,
      outcome: parseFloat(pl) >= 0 ? "WIN" : "LOSS",
      ...nativeFields,
      custom_fields: customFieldsJson,
      is_backtest: false,
    };

    const { error } = await supabase.from("trades").insert([tradePayload]);

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccess(true);
      setPl("0");
      setPair("EUR/USD");
      setDirection("LONG");
      setDate(getLocalISODateTime());
      fetchProperties();
    }
  };

  const CaretIcon = () => (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 ml-2">
      <path d="M1 1L5 5L9 1" stroke="#cc9166" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <form
      onSubmit={handleSubmit} // Aligns perfectly with the state handler!
      className="w-full bg-slate border border-iron rounded-[10px] p-6 text-bone flex flex-col h-full relative"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[14px] font-bold uppercase tracking-widest text-ash">Log New Entry</h3>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777a88" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </div>

      {success && (
        <div className="bg-graphite border border-iron text-bone text-xs p-3 rounded-sm mb-4 text-center">
          Entry successfully logged to private ledger.
        </div>
      )}
      {errorMsg && (
        <div className="bg-graphite border border-ember-gold text-ember-gold text-xs p-3 rounded-sm mb-4 text-center font-mono">
          Error: {errorMsg}
        </div>
      )}

      {activeDropdown && (
        <div className="fixed inset-0 z-30 bg-transparent cursor-default" onClick={() => setActiveDropdown(null)} />
      )}

      <div className="space-y-4 flex-1 max-h-[550px] overflow-y-auto scrollbar-none pr-1">
        
        {/* --- SECTION 1: CORE FIELDS (HARDCODED BOOKKEEPING) [DESIGN (5).md] --- */}
        <div className="space-y-4 pb-4 border-b border-iron/40">
          <span className="block text-[9px] font-bold text-ash uppercase tracking-wider">Core Ledger Parameters</span>
          
          {/* Date Picker */}
          <div>
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Entry Date & Time</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold outline-none tabular-nums"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Pair Select */}
            <div className="relative">
              <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Pair</label>
              <div
                onClick={() => setActiveDropdown(activeDropdown === "pair" ? null : "pair")}
                className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm flex items-center justify-between cursor-pointer select-none"
              >
                <span className="font-semibold">{pair}</span>
                <CaretIcon />
              </div>
              {activeDropdown === "pair" && (
                <div className="absolute left-0 right-0 mt-1 bg-inkwell border border-iron rounded-sm shadow-2xl z-40 max-h-48 overflow-y-auto divide-y divide-iron/20">
                  {PAIR_INPUTS.map((p: string) => (
                    <div
                      key={p}
                      onClick={() => {
                        setPair(p);
                        setActiveDropdown(null);
                      }}
                      className={`px-4 py-2 text-xs text-bone hover:bg-slate cursor-pointer ${pair === p ? "bg-graphite text-white font-bold" : ""}`}
                    >
                      {p}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Direction Select */}
            <div className="relative">
              <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Direction</label>
              <div
                onClick={() => setActiveDropdown(activeDropdown === "direction" ? null : "direction")}
                className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm flex items-center justify-between cursor-pointer select-none"
              >
                <span className="font-semibold">{direction === "LONG" ? "BUY (LONG)" : "SELL (SHORT)"}</span>
                <CaretIcon />
              </div>
              {activeDropdown === "direction" && (
                <div className="absolute left-0 right-0 mt-1 bg-inkwell border border-iron rounded-sm shadow-2xl z-40">
                  <div
                    onClick={() => {
                      setDirection("LONG");
                      setActiveDropdown(null);
                    }}
                    className={`px-4 py-2.5 text-xs text-bone hover:bg-slate cursor-pointer ${direction === "LONG" ? "bg-graphite font-bold" : ""}`}
                  >
                    BUY (LONG)
                  </div>
                  <div
                    onClick={() => {
                      setDirection("SHORT");
                      setActiveDropdown(null);
                    }}
                    className={`px-4 py-2.5 text-xs text-bone hover:bg-slate cursor-pointer ${direction === "SHORT" ? "bg-graphite font-bold" : ""}`}
                  >
                    SELL (SHORT)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Profit & Loss */}
          <div>
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Net Profit/Loss ($)</label>
            <input
              type="number"
              step="0.01"
              value={pl}
              onChange={(e) => setPl(e.target.value)}
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold outline-none font-mono tabular-nums"
              required
            />
          </div>
        </div>

        {/* --- SECTION 2: FLEXIBLE FIELDS (DYNAMICALLY LOADED FROM USER_PROPERTIES) [3, DESIGN (5).md] --- */}
        <div className="space-y-4 pt-2">
          <span className="block text-[9px] font-bold text-ash uppercase tracking-wider">Playbook Analytical Properties</span>
          
          {properties.map((prop) => {
            const val = propertyValues[prop.name];

            return (
              <div key={prop.id} className="space-y-1.5">
                <label className="block text-[11px] text-ash uppercase font-bold">
                  {prop.name} {prop.is_required && <span className="text-ember-gold">*</span>}
                </label>

                {/* Case A: TEXT / URL */}
                {["text", "url"].includes(prop.type) && (
                  <input
                    type={prop.type === "url" ? "url" : "text"}
                    value={val || ""}
                    onChange={(e) => setPropertyValues({ ...propertyValues, [prop.name]: e.target.value })}
                    placeholder={`Enter ${prop.name.toLowerCase()}...`}
                    className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold outline-none"
                    required={prop.is_required}
                  />
                )}

                {/* Case B: NUMBER */}
                {prop.type === "number" && (
                  <input
                    type="number"
                    step="0.00001"
                    value={val || ""}
                    onChange={(e) => setPropertyValues({ ...propertyValues, [prop.name]: e.target.value })}
                    onBlur={handlePriceBlur} // Re-evaluate auto-pip calculation on blur! [DESIGN (5).md]
                    placeholder="e.g. 1.08500"
                    className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold outline-none font-mono"
                    required={prop.is_required}
                  />
                )}

                {/* Case C: DATE */}
                {prop.type === "date" && (
                  <input
                    type="datetime-local"
                    value={val || ""}
                    onChange={(e) => setPropertyValues({ ...propertyValues, [prop.name]: e.target.value })}
                    className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold outline-none tabular-nums"
                    required={prop.is_required}
                  />
                )}

                {/* Case D: SELECT dropdown */}
                {prop.type === "select" && (
                  <div className="relative">
                    <div
                      onClick={() => setActiveDropdown(activeDropdown === prop.id ? null : prop.id)}
                      className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm flex items-center justify-between cursor-pointer select-none"
                    >
                      <span className="font-semibold capitalize">{val || "-- Select Option --"}</span>
                      <CaretIcon />
                    </div>
                    {activeDropdown === prop.id && (
                      <div className="absolute left-0 right-0 mt-1 bg-inkwell border border-iron rounded-sm shadow-2xl z-40 max-h-40 overflow-y-auto">
                        {prop.options.map((opt: string) => (
                          <div
                            key={opt}
                            onClick={() => {
                              setPropertyValues({ ...propertyValues, [prop.name]: opt });
                              setActiveDropdown(null);
                            }}
                            className={`px-4 py-2.5 text-xs text-bone hover:bg-slate cursor-pointer capitalize ${val === opt ? "bg-graphite font-bold" : ""}`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Case E: CHECKBOX [DESIGN (5).md] */}
                {prop.type === "checkbox" && (
                  <label className="flex items-center gap-2.5 cursor-pointer group select-none py-1">
                    <input
                      type="checkbox"
                      checked={!!val}
                      onChange={(e) => setPropertyValues({ ...propertyValues, [prop.name]: e.target.checked })}
                      className="sr-only"
                    />
                    {/* Nice Custom Checkbox with sharp 2px corners */}
                    <div className={`w-4.5 h-4.5 rounded-sm border transition-colors duration-150 flex items-center justify-center ${
                      val ? "bg-white border-white text-inkwell" : "bg-graphite border-iron text-transparent hover:border-ash"
                    }`}>
                      {val && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 4L4 7L9 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-xs text-ash font-bold group-hover:text-bone transition-colors">{prop.name}</span>
                  </label>
                )}

                {/* Case F: S3 MEDIA / FILE UPLOADER [3, DESIGN (5).md] */}
                {prop.type === "file" && (
                  <div className="bg-graphite/40 border border-iron p-4 rounded-sm space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-ash">Screenshot Link:</span>
                      {val ? (
                        <a href={val} target="_blank" rel="noopener noreferrer" className="text-xs text-ember-gold hover:underline">
                          View Attachment
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500 italic">No File Selected</span>
                      )}
                    </div>

                    <div className="relative border border-dashed border-iron bg-inkwell/50 p-4 rounded-sm text-center flex flex-col items-center justify-center hover:border-ash transition-colors duration-150">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload(e, prop.name)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        disabled={uploadingField === prop.name}
                      />
                      <span className="text-xs font-bold text-ash uppercase">
                        {uploadingField === prop.name ? "Uploading to S3..." : "Upload Screenshot"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || uploadingField !== null}
        className="w-full mt-6 bg-white text-inkwell h-12 font-bold text-[14px] rounded-sm hover:bg-bone transition-all duration-200 cursor-pointer uppercase tracking-wider"
      >
        {loading ? "Recording..." : "Log Trade"}
      </button>
    </form>
  );
}