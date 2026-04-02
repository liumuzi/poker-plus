import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ANTE_TYPES = [
  { id: 'standard',  label: '标准前注' },
  { id: 'big_blind', label: '大盲前注' },
  { id: 'button',    label: 'BTN前注'  },
];
const STRADDLE_TYPES = [
  { id: 'utg',         label: 'UTG'         },
  { id: 'button',      label: 'BTN'         },
  { id: 'mississippi', label: 'Mississippi' },
];
const PLAYER_COUNTS = [2, 3, 4, 5, 6, 7, 8, 9, 10];

function makeInitialForm(data) {
  if (!data) {
    return {
      date: new Date().toISOString().split('T')[0],
      sb: '', bb: '',
      anteType: null, anteAmount: '',
      straddleType: null, straddleAmount: '',
      buyIn: '', cashOut: '',
      duration: '', playerCount: null, notes: '',
    };
  }
  return {
    date: data.date ?? new Date().toISOString().split('T')[0],
    sb: data.sb != null ? String(data.sb) : '',
    bb: data.bb != null ? String(data.bb) : '',
    anteType: data.anteType ?? null,
    anteAmount: data.anteAmount != null ? String(data.anteAmount) : '',
    straddleType: data.straddleType ?? null,
    straddleAmount: data.straddleAmount != null ? String(data.straddleAmount) : '',
    buyIn: data.buyIn != null ? String(data.buyIn) : '',
    cashOut: data.cashOut != null ? String(data.cashOut) : '',
    duration: data.duration != null ? String(data.duration) : '',
    playerCount: data.playerCount ?? null,
    notes: data.notes ?? '',
    location: data.location ?? '',
  };
}

function LocationField({ value, onChange, savedLocations }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  const suggestions = savedLocations.filter(
    (loc) => !value || loc.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className="relative">
      <label className="text-xs text-gray-400 font-bold mb-1 block">地址（选填）</label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        className="bg-gray-700 rounded-xl px-3 py-3 text-white text-sm w-full outline-none focus:ring-2 focus:ring-blue-500"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-gray-700 rounded-xl shadow-xl border border-gray-600 overflow-hidden">
          {suggestions.map((loc) => (
            <button
              key={loc}
              type="button"
              onMouseDown={() => { onChange(loc); setShowSuggestions(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-gray-600 transition-colors"
            >
              {loc}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="text-xs text-gray-400 font-bold mb-1 block">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

function NumberInput({ value, onChange, error, className = '' }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-gray-700 rounded-xl px-3 py-3 text-white text-sm w-full outline-none focus:ring-2 ${
        error ? 'ring-2 ring-red-500' : 'focus:ring-blue-500'
      } ${className}`}
    />
  );
}

export default function AddSessionSheet({ onClose, onSave, initialData, recordId, savedLocations = [] }) {
  const isEdit = !!recordId;
  const [form, setForm] = useState(() => makeInitialForm(initialData));
  const [errors, setErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(
    !!(initialData?.anteType || initialData?.straddleType)
  );

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const previewProfit =
    form.cashOut !== '' && form.buyIn !== ''
      ? Number(form.cashOut) - Number(form.buyIn)
      : null;

  const handleSubmit = () => {
    const errs = {};
    if (!form.date) errs.date = '请选择日期';
    if (!form.sb || isNaN(Number(form.sb)) || Number(form.sb) <= 0) errs.sb = '请输入小盲';
    if (!form.bb || isNaN(Number(form.bb)) || Number(form.bb) <= 0) errs.bb = '请输入大盲';
    if (Number(form.bb) < Number(form.sb)) errs.bb = '大盲不能小于小盲';
    if (!form.buyIn || isNaN(Number(form.buyIn)) || Number(form.buyIn) < 1) errs.buyIn = '请输入买入金额';
    if (form.cashOut === '' || isNaN(Number(form.cashOut))) errs.cashOut = '请输入离桌金额';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const payload = {
      date: form.date,
      sb: Number(form.sb), bb: Number(form.bb),
      anteType: form.anteType || null,
      anteAmount: form.anteType && form.anteAmount ? Number(form.anteAmount) : undefined,
      straddleType: form.straddleType || null,
      straddleAmount: form.straddleType && form.straddleAmount ? Number(form.straddleAmount) : undefined,
      buyIn: Number(form.buyIn),
      cashOut: Number(form.cashOut),
      duration: form.duration ? Number(form.duration) : undefined,
      playerCount: form.playerCount || undefined,
      location: form.location || undefined,
      notes: form.notes || undefined,
    };

    onSave(payload, recordId);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-md mx-auto bg-gray-900 rounded-t-3xl overflow-hidden"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-800">
          <button onClick={onClose} className="text-gray-400 text-sm font-medium">取消</button>
          <h2 className="font-black text-white text-base">{isEdit ? '编辑 Session' : '新增 Session'}</h2>
          <button onClick={handleSubmit} className="text-blue-400 text-sm font-bold active:opacity-70">
            完成
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4" style={{ maxHeight: 'calc(90vh - 72px)' }}>
          {/* Date */}
          <Field label="日期" error={errors.date}>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="bg-gray-700 rounded-xl px-3 py-3 text-white text-sm w-full outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>

          {/* SB / BB */}
          <div>
            <label className="text-xs text-gray-400 font-bold mb-1 block">盲注级别</label>
            <div className="flex items-center gap-2">
              <NumberInput value={form.sb} onChange={(v) => set('sb', v)} error={errors.sb} className="flex-1" />
              <span className="text-gray-400 font-bold text-lg">/</span>
              <NumberInput value={form.bb} onChange={(v) => set('bb', v)} error={errors.bb} className="flex-1" />
            </div>
            {(errors.sb || errors.bb) && (
              <p className="text-red-400 text-xs mt-1">{errors.sb || errors.bb}</p>
            )}

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="mt-2 flex items-center gap-1 text-xs text-blue-400 font-medium"
            >
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              高级设置（Ante / Straddle）
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 flex flex-col gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Ante 类型</p>
                      <div className="flex gap-2 flex-wrap">
                        {ANTE_TYPES.map((t) => (
                          <button key={t.id}
                            onClick={() => set('anteType', form.anteType === t.id ? null : t.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              form.anteType === t.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                            }`}
                          >{t.label}</button>
                        ))}
                      </div>
                      {form.anteType && (
                        <NumberInput value={form.anteAmount} onChange={(v) => set('anteAmount', v)} className="mt-2" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Straddle 类型</p>
                      <div className="flex gap-2 flex-wrap">
                        {STRADDLE_TYPES.map((t) => (
                          <button key={t.id}
                            onClick={() => set('straddleType', form.straddleType === t.id ? null : t.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              form.straddleType === t.id ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
                            }`}
                          >{t.label}</button>
                        ))}
                      </div>
                      {form.straddleType && (
                        <NumberInput value={form.straddleAmount} onChange={(v) => set('straddleAmount', v)} className="mt-2" />
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Buy-in */}
          <Field label="买入金额" error={errors.buyIn}>
            <NumberInput value={form.buyIn} onChange={(v) => set('buyIn', v)} error={errors.buyIn} />
          </Field>

          {/* Cash-out */}
          <Field label="离桌金额" error={errors.cashOut}>
            <NumberInput value={form.cashOut} onChange={(v) => set('cashOut', v)} error={errors.cashOut} />
          </Field>

          {previewProfit !== null && (
            <div className={`text-center text-sm font-black rounded-xl py-2 ${
              previewProfit >= 0 ? 'bg-emerald-900/40 text-emerald-400' : 'bg-rose-900/40 text-rose-400'
            }`}>
              本局{previewProfit >= 0 ? '盈利' : '亏损'}：{previewProfit >= 0 ? '+' : ''}{previewProfit}
            </div>
          )}

          {/* Duration */}
          <Field label="时长（小时，选填）">
            <NumberInput value={form.duration} onChange={(v) => set('duration', v)} />
          </Field>

          {/* Player count */}
          <div>
            <label className="text-xs text-gray-400 font-bold mb-1.5 block">入池人数（选填）</label>
            <div className="flex gap-2 flex-wrap">
              {PLAYER_COUNTS.map((n) => (
                <button key={n}
                  onClick={() => set('playerCount', form.playerCount === n ? null : n)}
                  className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${
                    form.playerCount === n ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >{n}</button>
              ))}
            </div>
          </div>

          {/* Location with autocomplete */}
          <LocationField
            value={form.location}
            onChange={(v) => set('location', v)}
            savedLocations={savedLocations}
          />

          {/* Notes */}
          <Field label="备注（选填）">
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              className="bg-gray-700 rounded-xl px-3 py-3 text-white text-sm w-full outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </Field>

          <div className="h-4" />
        </div>
      </motion.div>
    </motion.div>
  );
}
