import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import {
  BarChart3,
  TrendingUp,
  Target,
  DollarSign,
  Users,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Settings as SettingsIcon,
  LayoutDashboard,
  Table as TableIcon,
  Download,
  Info,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Edit3,
  Link2,
  X,
  Activity,
  CheckCircle2
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useLeads, useMarketing, MarketingData, Lead } from "../hooks/useSupabase";
import { 
  format, 
  startOfDay, 
  endOfDay, 
  subDays, 
  eachDayOfInterval, 
  isSameDay, 
  parseISO, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  subMonths,
  subWeeks,
  addDays,
  differenceInDays
} from "date-fns";
import { ptBR } from "date-fns/locale";

type Period = 'dia' | 'sem' | 'mês';
type Platform = 'meta_ads' | 'google_ads' | 'no_track';

const PLATFORM_LABELS: Record<Platform, string> = {
  meta_ads: 'META ADS',
  google_ads: 'GOOGLE ADS',
  no_track: 'SEM RASTREIO'
};

const PLATFORM_COLORS: Record<Platform, string> = {
  meta_ads: 'text-indigo-600',
  google_ads: 'text-amber-600',
  no_track: 'text-slate-500'
};

export function MarketingAnalytics() {
  const [period, setPeriod] = useState<Period>('dia');
  const [viewMode, setViewMode] = useState<'dash' | 'tabela'>('tabela');
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 6),
    end: new Date()
  });

  const { data: leads, loading: leadsLoading } = useLeads();
  const { data: marketingData, loading: mktLoading, fetch: fetchMkt, upsert: upsertMkt } = useMarketing();
  const [viewMode, setViewMode] = useState<'dashboard' | 'table'>('table');
  const [isEditing, setIsEditing] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [compareDateRange, setCompareDateRange] = useState<{start: Date, end: Date}>({
    start: subDays(new Date(), 14),
    end: subDays(new Date(), 8)
  });
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [activeRangeLabel, setActiveRangeLabel] = useState("ÚLTIMOS 7 DIAS");

  const setRangeById = (id: string) => {
    const today = new Date();
    let start = today;
    let end = today;
    let label = "";

    switch (id) {
      case 'today':
        label = "HOJE";
        break;
      case 'yesterday':
        start = subDays(today, 1);
        end = subDays(today, 1);
        label = "ONTEM";
        break;
      case 'week':
        start = startOfWeek(today, { weekStartsOn: 0 });
        label = "ESTA SEMANA";
        break;
      case '7days':
        start = subDays(today, 6);
        label = "ÚLTIMOS 7 DIAS";
        break;
      case '30days':
        start = subDays(today, 29);
        label = "ÚLTIMOS 30 DIAS";
        break;
      case 'month':
        start = startOfMonth(today);
        label = "ESTE MÊS";
        break;
      case 'last_month':
        const lastMonth = subMonths(today, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        label = "MÊS PASSADO";
        break;
      case 'last_week':
        const lastWeek = subWeeks(today, 1);
        start = startOfWeek(lastWeek, { weekStartsOn: 0 });
        end = endOfWeek(lastWeek, { weekStartsOn: 0 });
        label = "SEMANA PASSADA";
        break;
    }

    setDateRange({ start, end });
    setActiveRangeLabel(label);
    setIsPeriodOpen(false);
  };

  useEffect(() => {
    // If comparing, fetch from the earliest start to the latest end
    const fetchStart = isComparing 
      ? format(compareDateRange.start < dateRange.start ? compareDateRange.start : dateRange.start, 'yyyy-MM-dd')
      : format(dateRange.start, 'yyyy-MM-dd');
      
    const fetchEnd = isComparing
      ? format(compareDateRange.end > dateRange.end ? compareDateRange.end : dateRange.end, 'yyyy-MM-dd')
      : format(dateRange.end, 'yyyy-MM-dd');
      
    fetchMkt(fetchStart, fetchEnd);
  }, [dateRange, compareDateRange, isComparing, fetchMkt]);

  // Generate periods based on interval and selected grouping (dia, sem, mês)
  const periods = useMemo(() => {
    if (period === 'dia') {
      return eachDayOfInterval({ start: dateRange.start, end: dateRange.end }).map(d => ({
        start: startOfDay(d),
        end: endOfDay(d),
        label: format(d, 'dd/MM')
      }));
    }
    
    if (period === 'sem') {
      const weeks: { start: Date, end: Date, label: string }[] = [];
      let current = startOfWeek(dateRange.start, { weekStartsOn: 0 });
      
      while (current <= dateRange.end) {
        const s = current;
        const e = endOfWeek(current, { weekStartsOn: 0 });
        weeks.push({
          start: s,
          end: e,
          label: `${format(s, 'd/M')} - ${format(e, 'd/M')}`
        });
        current = addDays(e, 1);
      }
      return weeks;
    }

    if (period === 'mês') {
      const months: { start: Date, end: Date, label: string }[] = [];
      let current = startOfMonth(dateRange.start);
      
      while (current <= dateRange.end) {
        const s = current;
        const e = endOfMonth(current);
        months.push({
          start: s,
          end: e,
          label: format(s, 'MMM', { locale: ptBR }).toUpperCase()
        });
        current = addDays(e, 1);
      }
      return months;
    }

    return [];
  }, [dateRange, period]);

  // Generate fixed daily range for editing purposes (always per day)
  const days = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  const dayDelta = useMemo(() => differenceInDays(dateRange.end, dateRange.start) + 1, [dateRange]);

  // Lead sourcing mapping logic
  const getPlatformForLead = (lead: Lead): Platform => {
    const source = lead.source?.toLowerCase() || '';
    if (source.includes('facebook') || source.includes('instagram') || source.includes('meta')) return 'meta_ads';
    if (source.includes('google')) return 'google_ads';
    return 'no_track';
  };

  const calculateStats = (targetPeriods: typeof periods) => {
    const stats: Record<string, Record<Platform, any>> = {};

    targetPeriods.forEach((p, idx) => {
      const pKey = periods[idx].label; // Use original label to keep keys consistent
      stats[pKey] = {
        meta_ads: { leads: 0, convs: 0, investment: 0, conv_value: 0 },
        google_ads: { leads: 0, convs: 0, investment: 0, conv_value: 0 },
        no_track: { leads: 0, convs: 0, investment: 0, conv_value: 0 }
      };

      // Aggregate from marketing_data
      marketingData.forEach(m => {
        const mDate = parseISO(m.date);
        if (mDate >= p.start && mDate <= p.end) {
          const platform = m.platform as Platform;
          if (stats[pKey][platform]) {
            stats[pKey][platform].investment += m.investment;
            stats[pKey][platform].conv_value += m.conversions_value;
            if (m.manual_leads_count !== null) stats[pKey][platform].leads += m.manual_leads_count;
            if (m.manual_conversions_count !== null) stats[pKey][platform].convs += m.manual_conversions_count;
          }
        }
      });

      // Aggregate Leads from leads table if not overridden by manual data for THAT DAY
      leads.forEach(lead => {
        const leadDate = lead.created_at ? parseISO(lead.created_at) : null;
        if (leadDate && leadDate >= p.start && leadDate <= p.end) {
          const platform = getPlatformForLead(lead);
          
          // Check if there's a manual override for this specific day
          const dateStr = format(leadDate, 'yyyy-MM-dd');
          const manualLeads = marketingData.find(d => d.date === dateStr && d.platform === platform)?.manual_leads_count;
          
          if (manualLeads === null || manualLeads === undefined) {
             stats[pKey][platform].leads += 1;
          }

          if (lead.converted_patient_id) {
            const manualConvs = marketingData.find(d => d.date === dateStr && d.platform === platform)?.manual_conversions_count;
            if (manualConvs === null || manualConvs === undefined) {
               stats[pKey][platform].convs += 1;
            }
          }
        }
      });
    });

    return stats;
  };

  const metricsByPeriod = useMemo(() => calculateStats(periods), [periods, leads, marketingData]);
  
  const comparisonMetricsByPeriod = useMemo(() => {
    if (!isComparing) return {};
    
    // Generate comparison periods by subdividing the compareDateRange into 
    // the same number of intervals as the primary range
    const primaryDuration = differenceInDays(dateRange.end, dateRange.start) + 1;
    const compareDuration = differenceInDays(compareDateRange.end, compareDateRange.start) + 1;
    
    const compPeriods = periods.map(p => {
      const offsetStart = differenceInDays(p.start, dateRange.start);
      const offsetEnd = differenceInDays(p.end, dateRange.start);
      
      // Calculate start and end for comparison period based on proportional offsets
      // If durations are same, it's 1:1. If different, we scale.
      const scale = compareDuration / primaryDuration;
      
      return {
        ...p,
        start: addDays(compareDateRange.start, Math.floor(offsetStart * scale)),
        end: addDays(compareDateRange.start, Math.floor(offsetEnd * scale))
      };
    });

    return calculateStats(compPeriods);
  }, [isComparing, periods, dateRange, compareDateRange, leads, marketingData]);

  const handleEditData = () => {
    // Fill initial values for editing
    const initial: Record<string, any> = {};
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      ['meta_ads', 'google_ads', 'no_track'].forEach(p => {
        const key = `${dateStr}-${p}`;
        const existing = marketingData.find(d => d.date === dateStr && d.platform === p);
        initial[`${key}-investment`] = existing?.investment || 0;
        initial[`${key}-leads`] = existing?.manual_leads_count ?? "";
        initial[`${key}-convs`] = existing?.manual_conversions_count ?? "";
        initial[`${key}-value`] = existing?.conversions_value || 0;
      });
    });
    setEditValues(initial);
    setIsEditing(true);
  };

  const saveEditData = async () => {
    const toUpsert: Partial<MarketingData>[] = [];
    
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      (['meta_ads', 'google_ads', 'no_track'] as Platform[]).forEach(p => {
        const key = `${dateStr}-${p}`;
        toUpsert.push({
          date: dateStr,
          platform: p,
          investment: Number(editValues[`${key}-investment`] || 0),
          manual_leads_count: editValues[`${key}-leads`] === "" ? null : Number(editValues[`${key}-leads`]),
          manual_conversions_count: editValues[`${key}-convs`] === "" ? null : Number(editValues[`${key}-convs`]),
          conversions_value: Number(editValues[`${key}-value`] || 0)
        });
      });
    });

    await upsertMkt(toUpsert);
    setIsEditing(false);
    fetchMkt(format(dateRange.start, 'yyyy-MM-dd'), format(dateRange.end, 'yyyy-MM-dd'));
  };

  if (mktLoading && marketingData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 p-6 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-100">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Métricas de Marketing
            </h1>
            <p className="text-slate-500 text-sm font-medium">Acompanhe o ROI e desempenho dos seus anúncios</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
           <div className="flex bg-slate-50 rounded-xl p-1">
              {(['dia', 'sem', 'mês'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                    period === p ? "bg-white text-teal-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {p}
                </button>
              ))}
           </div>
           
           <div className="h-6 w-px bg-slate-200 mx-1" />

           <div className="relative">
              <div 
                onClick={() => setIsPeriodOpen(!isPeriodOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-all border border-transparent hover:border-slate-200 group"
              >
                <Calendar className={cn("w-4 h-4 transition-colors", isPeriodOpen ? "text-teal-600" : "text-slate-400 group-hover:text-teal-600")} />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{activeRangeLabel}</span>
                <ChevronRight className={cn("w-3.5 h-3.5 text-slate-300 transition-transform", isPeriodOpen ? "rotate-90 text-teal-600" : "")} />
              </div>

              <AnimatePresence>
                {isPeriodOpen && (
                  <>
                    <div className="fixed inset-0 z-[105]" onClick={() => setIsPeriodOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-3 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl z-[110] p-4 flex flex-col gap-1 overflow-hidden"
                    >
                      <PeriodOption label="HOJE" onClick={() => setRangeById('today')} active={activeRangeLabel === 'HOJE'} />
                      <PeriodOption label="ONTEM" onClick={() => setRangeById('yesterday')} active={activeRangeLabel === 'ONTEM'} />
                      <PeriodOption label="ESTA SEMANA" onClick={() => setRangeById('week')} active={activeRangeLabel === 'ESTA SEMANA'} />
                      <PeriodOption label="SEMANA PASSADA" onClick={() => setRangeById('last_week')} active={activeRangeLabel === 'SEMANA PASSADA'} />
                      <PeriodOption label="ÚLTIMOS 7 DIAS" onClick={() => setRangeById('7days')} active={activeRangeLabel === 'ÚLTIMOS 7 DIAS'} />
                      <PeriodOption label="ÚLTIMOS 30 DIAS" onClick={() => setRangeById('30days')} active={activeRangeLabel === 'ÚLTIMOS 30 DIAS'} />
                      <PeriodOption label="ESTE MÊS" onClick={() => setRangeById('month')} active={activeRangeLabel === 'ESTE MÊS'} />
                      <PeriodOption label="MÊS PASSADO" onClick={() => setRangeById('last_month')} active={activeRangeLabel === 'MÊS PASSADO'} />
                      
                      <div className="pt-4 mt-2 border-t border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] block mb-3 pl-1">Período Principal</span>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest pl-1">Início</label>
                              <input 
                                type="date" 
                                value={format(dateRange.start, 'yyyy-MM-dd')}
                                onChange={(e) => {
                                  setDateRange(v => ({...v, start: parseISO(e.target.value)}));
                                  setActiveRangeLabel("Personalizado");
                                }}
                                className="w-full bg-slate-50 border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-600 outline-none border focus:ring-1 focus:ring-teal-500/20" 
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest pl-1">Fim</label>
                              <input 
                                type="date" 
                                value={format(dateRange.end, 'yyyy-MM-dd')}
                                onChange={(e) => {
                                  setDateRange(v => ({...v, end: parseISO(e.target.value)}));
                                  setActiveRangeLabel("Personalizado");
                                }}
                                className="w-full bg-slate-50 border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-600 outline-none border focus:ring-1 focus:ring-teal-500/20" 
                              />
                            </div>
                        </div>
                      </div>

                      {isComparing && (
                        <div className="pt-4 mt-2 border-t border-slate-100 bg-teal-50/20 -mx-4 px-4 pb-2">
                          <span className="text-[9px] font-black text-teal-600 uppercase tracking-[2px] block mb-3 pl-1">Período Comparativo</span>
                          <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[8px] font-bold text-teal-600/50 uppercase tracking-widest pl-1">Início</label>
                                <input 
                                  type="date" 
                                  value={format(compareDateRange.start, 'yyyy-MM-dd')}
                                  onChange={(e) => setCompareDateRange(v => ({...v, start: parseISO(e.target.value)}))}
                                  className="w-full bg-white border-teal-100 rounded-xl p-2.5 text-[10px] font-bold text-slate-600 outline-none border focus:ring-1 focus:ring-teal-500/20" 
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-bold text-teal-600/50 uppercase tracking-widest pl-1">Fim</label>
                                <input 
                                  type="date" 
                                  value={format(compareDateRange.end, 'yyyy-MM-dd')}
                                  onChange={(e) => setCompareDateRange(v => ({...v, end: parseISO(e.target.value)}))}
                                  className="w-full bg-white border-teal-100 rounded-xl p-2.5 text-[10px] font-bold text-slate-600 outline-none border focus:ring-1 focus:ring-teal-500/20" 
                                />
                              </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
           </div>

            {!isEditing ? (
              <>
                <Button 
                onClick={() => {
                  if (!isComparing) {
                    // Initialize compareDateRange to previous period
                    const dayDelta = differenceInDays(dateRange.end, dateRange.start) + 1;
                    setCompareDateRange({
                      start: subDays(dateRange.start, dayDelta),
                      end: subDays(dateRange.end, dayDelta)
                    });
                  }
                  setIsComparing(!isComparing);
                }}
                variant="outline" 
                className={cn(
                  "rounded-xl h-9 gap-2 text-[10px] font-bold uppercase transition-all shadow-sm",
                  isComparing ? "bg-teal-50 border-teal-200 text-teal-600 shadow-teal-100" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                )}
               >
                  <RefreshCw className={cn("w-3.5 h-3.5 transition-transform duration-500", isComparing ? "rotate-180 text-teal-600" : "text-slate-400")} />
                  Comparar
               </Button>

               <Button 
                onClick={handleEditData}
                variant="outline" 
                className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 h-9 gap-2 text-[10px] font-bold uppercase transition-all shadow-sm"
               >
                  <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                  Editar Dados
               </Button>

               <Button 
                variant="outline" 
                className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 h-9 gap-2 text-[10px] font-bold uppercase shadow-sm"
               >
                  <Link2 className="w-3.5 h-3.5 text-teal-600" />
                  Integrações
               </Button>
              </>
            ) : (
             <div className="flex items-center gap-2">
               <Button 
                onClick={() => setIsEditing(false)}
                variant="ghost" 
                className="rounded-xl text-slate-500 h-9 px-4 text-[10px] font-bold uppercase"
               >
                  Cancelar
               </Button>
               <Button 
                onClick={saveEditData}
                className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white h-9 px-6 text-[10px] font-black uppercase shadow-lg shadow-teal-100 transition-all active:scale-[0.98]"
               >
                  Salvar
               </Button>
             </div>
           )}
        </div>
      </div>

      {/* View Selector & Main Table */}
      <div className="space-y-4">
        <div className={cn("flex justify-end gap-2 transition-all", isEditing ? "opacity-0 pointer-events-none h-0" : "opacity-100 h-10")}>
           <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
              <button
                onClick={() => setViewMode('dash')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'dash' ? "bg-teal-600 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
                )}
              >
                 <LayoutDashboard className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('tabela')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'tabela' ? "bg-teal-600 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
                )}
              >
                 <TableIcon className="w-4 h-4" />
              </button>
           </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${viewMode}-${period}-${isEditing}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pb-24"
          >
            <Card className="bg-white border-slate-200 shadow-xl rounded-3xl overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="p-6 text-[11px] font-black text-teal-600 uppercase tracking-[2px] border-r border-slate-100">Métrica / Período</th>
                      {periods.map(p => (
                        <th key={p.label} className="p-6 text-[11px] font-black text-slate-500 text-center uppercase tracking-wider min-w-[140px]">
                          {p.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <PlatformRows 
                      platform="meta_ads" 
                      periods={periods} 
                      metricsByPeriod={metricsByPeriod} 
                      comparisonMetricsByPeriod={comparisonMetricsByPeriod}
                      isComparing={isComparing}
                      isEditing={isEditing}
                      editValues={editValues}
                      setEditValues={setEditValues}
                      period={period}
                    />
                    <PlatformRows 
                      platform="google_ads" 
                      periods={periods} 
                      metricsByPeriod={metricsByPeriod} 
                      comparisonMetricsByPeriod={comparisonMetricsByPeriod}
                      isComparing={isComparing}
                      isEditing={isEditing}
                      editValues={editValues}
                      setEditValues={setEditValues}
                      period={period}
                    />
                    <PlatformRows 
                      platform="no_track" 
                      periods={periods} 
                      metricsByPeriod={metricsByPeriod} 
                      comparisonMetricsByPeriod={comparisonMetricsByPeriod}
                      isComparing={isComparing}
                      isEditing={isEditing}
                      editValues={editValues}
                      setEditValues={setEditValues}
                      period={period}
                    />
                    <SummaryRows 
                      periods={periods} 
                      metricsByPeriod={metricsByPeriod} 
                      comparisonMetricsByPeriod={comparisonMetricsByPeriod}
                      isComparing={isComparing}
                    />
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Sticky Save Bar */}
            <AnimatePresence>
              {isEditing && (
                <motion.div 
                   initial={{ y: 100, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   exit={{ y: 100, opacity: 0 }}
                   className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[50] flex items-center gap-3 bg-white/90 backdrop-blur-md border border-slate-200 p-2 pl-6 rounded-2xl shadow-2xl ring-1 ring-slate-900/5 min-w-[400px]"
                >
                   <div className="flex items-center gap-3 mr-auto">
                      <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alterações não salvas</span>
                   </div>
                   <Button onClick={() => setIsEditing(false)} variant="ghost" className="h-10 rounded-xl text-slate-500 font-bold px-4 hover:bg-slate-100">
                      Cancelar
                   </Button>
                   <Button onClick={saveEditData} className="h-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-8 font-black uppercase tracking-tight shadow-lg shadow-teal-100 transition-all active:scale-[0.98] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Salvar Dados
                   </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}


function PeriodOption({ label, onClick, active }: { label: string, onClick: () => void, active: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-black tracking-[1px] transition-all uppercase",
        active 
          ? "bg-teal-50 text-teal-700 border border-teal-100/50 shadow-sm" 
          : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
      )}
    >
      {label}
    </button>
  );
}

function PlatformRows({ platform, periods, metricsByPeriod, comparisonMetricsByPeriod, isComparing, isEditing, editValues, setEditValues, period }: any) {
  return (
    <>
      <tr className="bg-slate-50/50">
        <td className={cn("px-6 py-4 text-[10px] font-black tracking-[3px] border-r border-slate-100", PLATFORM_COLORS[platform])}>
          {PLATFORM_LABELS[platform]}
        </td>
        {periods.map((_: any, idx: number) => <td key={idx} className="px-6 py-4 bg-slate-50/30" />)}
      </tr>
      <MetricRow 
        label="INVESTIMENTO" 
        periods={periods} 
        metrics={metricsByPeriod} 
        compareMetrics={comparisonMetricsByPeriod}
        isComparing={isComparing}
        platform={platform} 
        type="currency" 
        valueKey="investment"
        isEditing={isEditing}
        editValues={editValues}
        setEditValues={setEditValues}
        period={period}
      />
      <MetricRow 
        label="LEADS GERADOS" 
        periods={periods} 
        metrics={metricsByPeriod} 
        compareMetrics={comparisonMetricsByPeriod}
        isComparing={isComparing}
        platform={platform} 
        valueKey="leads"
        isEditing={isEditing}
        editValues={editValues}
        setEditValues={setEditValues}
        period={period}
      />
      <MetricRow 
        label="CUSTO POR LEAD" 
        periods={periods} 
        metrics={metricsByPeriod} 
        compareMetrics={comparisonMetricsByPeriod}
        isComparing={isComparing}
        platform={platform} 
        type="cpl"
        isEditing={isEditing}
        editValues={editValues}
        period={period}
      />
      <MetricRow 
        label="CONVERSÕES" 
        periods={periods} 
        metrics={metricsByPeriod} 
        compareMetrics={comparisonMetricsByPeriod}
        isComparing={isComparing}
        platform={platform} 
        valueKey="convs"
        isEditing={isEditing}
        editValues={editValues}
        setEditValues={setEditValues}
        period={period}
      />
      <MetricRow 
        label="VALOR DE CONVERSÕES" 
        periods={periods} 
        metrics={metricsByPeriod} 
        compareMetrics={comparisonMetricsByPeriod}
        isComparing={isComparing}
        platform={platform} 
        type="currency" 
        valueKey="value"
        isEditing={isEditing}
        editValues={editValues}
        setEditValues={setEditValues}
        period={period}
      />
      <MetricRow 
        label="TAXA DE CONVERSÃO" 
        periods={periods} 
        metrics={metricsByPeriod} 
        compareMetrics={comparisonMetricsByPeriod}
        isComparing={isComparing}
        platform={platform} 
        type="percent"
        isEditing={isEditing}
        editValues={editValues}
        period={period}
      />
    </>
  );
}

function SummaryRows({ periods, metricsByPeriod, comparisonMetricsByPeriod, isComparing }: any) {
  return (
    <>
      <tr className="bg-teal-50/50">
        <td className="px-6 py-4 text-[10px] font-black tracking-[3px] text-teal-600 border-r border-slate-100">
          RESUMO GERAL
        </td>
        {periods.map((_, idx) => <td key={idx} />)}
      </tr>
      <SummaryMetricRow label="TOTAL LEADS" periods={periods} metrics={metricsByPeriod} compareMetrics={comparisonMetricsByPeriod} isComparing={isComparing} type="total_leads" />
      <SummaryMetricRow label="INV. TOTAL" periods={periods} metrics={metricsByPeriod} compareMetrics={comparisonMetricsByPeriod} isComparing={isComparing} type="total_investment" />
      <SummaryMetricRow label="CPL MÉDIO" periods={periods} metrics={metricsByPeriod} compareMetrics={comparisonMetricsByPeriod} isComparing={isComparing} type="avg_cpl" />
      <SummaryMetricRow label="TOTAL CONVERSÕES" periods={periods} metrics={metricsByPeriod} compareMetrics={comparisonMetricsByPeriod} isComparing={isComparing} type="total_convs" />
      <SummaryMetricRow label="VALOR DE CONVERSÕES" periods={periods} metrics={metricsByPeriod} compareMetrics={comparisonMetricsByPeriod} isComparing={isComparing} type="total_value" />
      <SummaryMetricRow label="TAXA GLOBAL" periods={periods} metrics={metricsByPeriod} compareMetrics={comparisonMetricsByPeriod} isComparing={isComparing} type="global_rate" />
    </>
  );
}

function MetricRow({ label, periods, metrics, compareMetrics, isComparing, platform, type, valueKey, isEditing, editValues, setEditValues, period }: any) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="px-6 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-10 border-r border-slate-100 whitespace-nowrap">{label}</td>
      {periods.map((p: any, idx: number) => {
        const pKey = p.label;
        const dateStr = format(p.start, 'yyyy-MM-dd');
        const dayMetrics = metrics[pKey]?.[platform];
        const prevMetrics = compareMetrics?.[pKey]?.[platform];
        
        const useEdit = isEditing && period === 'dia' && valueKey;
        const editKey = `${dateStr}-${platform}-${valueKey}`;
        
        // Current values
        const currentInv = (period === 'dia' ? Number(editValues[`${dateStr}-${platform}-investment`] || 0) : dayMetrics?.investment) || 0;
        const currentLeads = (period === 'dia' 
          ? (editValues[`${dateStr}-${platform}-leads`] === "" ? 0 : Number(editValues[`${dateStr}-${platform}-leads`]))
          : dayMetrics?.leads) || 0;
        const currentConvs = (period === 'dia' 
          ? (editValues[`${dateStr}-${platform}-convs`] === "" ? 0 : Number(editValues[`${dateStr}-${platform}-convs`]))
          : dayMetrics?.convs) || 0;
        const currentValue = (period === 'dia' ? Number(editValues[`${dateStr}-${platform}-value`] || 0) : dayMetrics?.value) || 0;

        // Previous values
        const prevInv = prevMetrics?.investment || 0;
        const prevLeads = prevMetrics?.leads || 0;
        const prevConvs = prevMetrics?.convs || 0;
        const prevValue = prevMetrics?.value || 0;

        let val: number = 0;
        let pVal: number = 0;

        if (type === 'currency' && valueKey === 'investment') { val = currentInv; pVal = prevInv; }
        else if (type === 'currency' && valueKey === 'value') { val = currentValue; pVal = prevValue; }
        else if (type === 'percent') { 
          val = currentLeads > 0 ? (currentConvs / currentLeads) * 100 : 0; 
          pVal = prevLeads > 0 ? (prevConvs / prevLeads) * 100 : 0;
        }
        else if (type === 'cpl') { 
          val = currentLeads > 0 ? currentInv / currentLeads : 0; 
          pVal = prevLeads > 0 ? prevInv / prevLeads : 0;
        }
        else { 
          val = (dayMetrics as any)?.[valueKey] || 0; 
          pVal = (prevMetrics as any)?.[valueKey] || 0; 
        }

        const delta = pVal > 0 ? ((val - pVal) / pVal) * 100 : null;

        if (useEdit) {
           return (
             <td key={idx} className="px-4 py-2 border-r border-slate-50 last:border-r-0">
               <input
                 type="number"
                 value={editValues[editKey]}
                 onChange={e => setEditValues((prev: any) => ({...prev, [editKey]: e.target.value}))}
                 className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-black text-center text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-300"
                 placeholder="0"
               />
             </td>
           );
        }

        return (
          <td key={idx} className="px-6 py-3 text-center border-r border-slate-50 last:border-r-0 whitespace-nowrap">
            <div className="flex flex-col items-center">
              <span className={cn("text-xs font-bold transition-all", isComparing ? "text-slate-900" : "text-slate-600")}>
                {type === 'currency' ? `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 
                 type === 'percent' ? (val > 0 ? `${val.toFixed(1)}%` : '—') :
                 type === 'cpl' ? (val > 0 ? `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—') :
                 val}
              </span>
              
              <AnimatePresence>
                {isComparing && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center mt-1"
                  >
                    {delta !== null && (
                      <div className={cn("text-[8px] font-black flex items-center gap-0.5 px-1.5 py-0.5 rounded-full", 
                        delta > 0 ? "bg-emerald-50 text-emerald-600" : delta < 0 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400")}>
                        {delta > 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : delta < 0 ? <ArrowDownRight className="w-2.5 h-2.5" /> : null}
                        {Math.abs(delta).toFixed(1)}%
                      </div>
                    )}
                    <span className="text-[7px] font-bold text-slate-300 uppercase tracking-tighter mt-0.5">
                      Prev: {type === 'currency' ? `R$ ${pVal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : pVal.toFixed(1)}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </td>
        );
      })}
    </tr>
  );
}

function SummaryMetricRow({ label, periods, metrics, compareMetrics, isComparing, type }: any) {
  return (
    <tr className="border-b border-slate-100 bg-teal-50/10">
      <td className="px-6 py-3 text-[9px] font-bold text-teal-700 uppercase tracking-wider pl-10 border-r border-slate-100">{label}</td>
      {periods.map((p: any, idx: number) => {
        const pKey = p.label;
        const dayStats = metrics[pKey];
        const prevStats = compareMetrics?.[pKey];
        const platforms = ['meta_ads', 'google_ads', 'no_track'] as Platform[];
        
        const getTotals = (stats: any) => {
          if (!stats) return { leads: 0, convs: 0, investment: 0, value: 0 };
          const leads = platforms.reduce((sum, p) => sum + (stats[p]?.leads || 0), 0);
          const convs = platforms.reduce((sum, p) => sum + (stats[p]?.convs || 0), 0);
          const investment = platforms.reduce((sum, p) => sum + (stats[p]?.investment || 0), 0);
          const value = platforms.reduce((sum, p) => sum + (stats[p]?.conv_value || 0), 0);
          return { leads, convs, investment, value };
        };

        const current = getTotals(dayStats);
        const previous = getTotals(prevStats);

        let val: any = 0;
        let pVal: any = 0;
        let formatType: 'num' | 'curr' | 'perc' = 'num';

        if (type === 'total_leads') { val = current.leads; pVal = previous.leads; }
        else if (type === 'total_convs') { val = current.convs; pVal = previous.convs; }
        else if (type === 'total_investment') { val = current.investment; pVal = previous.investment; formatType = 'curr'; } 
        else if (type === 'total_value') { val = current.value; pVal = previous.value; formatType = 'curr'; }
        else if (type === 'avg_cpl') {
           val = current.leads > 0 ? current.investment / current.leads : 0;
           pVal = previous.leads > 0 ? previous.investment / previous.leads : 0;
           formatType = 'curr';
        }
        else if (type === 'global_rate') {
           val = current.leads > 0 ? (current.convs / current.leads) * 100 : 0;
           pVal = previous.leads > 0 ? (previous.convs / previous.leads) * 100 : 0;
           formatType = 'perc';
        }

        const delta = pVal > 0 ? ((val - pVal) / pVal) * 100 : null;

        return (
          <td key={idx} className="px-6 py-3 text-center border-r border-slate-50 last:border-r-0">
             <div className="flex flex-col items-center">
                <span className={cn("text-xs font-black transition-all", isComparing ? "text-slate-900" : "text-slate-800")}>
                  {formatType === 'curr' ? `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 
                   formatType === 'perc' ? (val > 0 ? `${val.toFixed(1)}%` : '—') : val}
                </span>

                <AnimatePresence>
                  {isComparing && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center mt-1"
                    >
                      {delta !== null && (
                        <div className={cn("text-[8px] font-black flex items-center gap-0.5 px-1.5 py-0.5 rounded-full", 
                          delta > 0 ? "bg-emerald-50 text-emerald-600" : delta < 0 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400")}>
                          {Math.abs(delta).toFixed(1)}%
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </td>
        );
      })}
    </tr>
  );
}
