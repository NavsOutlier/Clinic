import React from "react";
import { Card, CardContent } from "./ui/card";
import { 
  MoreHorizontal, 
  MessageSquare, 
  User, 
  Phone, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Star,
  Plus
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion } from "framer-motion";

const columns = [
  { id: "leads-forms", title: "Leads Forms", icon: User, color: "bg-blue-500" },
  { id: "leads-whatsapp", title: "Leads Whatsapp", icon: Phone, color: "bg-emerald-500" },
  { id: "interessados", title: "Interessados", icon: Star, color: "bg-amber-500" },
  { id: "qualificados", title: "Qualificados", icon: CheckCircle2, color: "bg-indigo-500" },
  { id: "agendados", title: "Agendados", icon: Calendar, color: "bg-purple-500" },
  { id: "orcamento", title: "Orçamento Enviado", icon: DollarSign, color: "bg-teal-500" },
  { id: "convertidos", title: "Convertidos", icon: CheckCircle2, color: "bg-teal-600" },
];

const leads = [
  { id: 1, name: "Ricardo Almeida", source: "Facebook Ads", value: "R$ 450,00", stage: "leads-forms", date: "2h atrás" },
  { id: 2, name: "Sonia Matos", source: "Whatsapp", value: "R$ 1.200,00", stage: "interessados", date: "5h atrás" },
  { id: 3, name: "Bia Ferreira", source: "Instagram", value: "R$ 300,00", stage: "leads-whatsapp", date: "1d atrás" },
  { id: 4, name: "Paulo Cesar", source: "Google", value: "R$ 800,00", stage: "qualificados", date: "2d atrás" },
  { id: 5, name: "Julia Santos", source: "Indicação", value: "R$ 1.500,00", stage: "agendados", date: "15/05" },
];

export function LeadKanban() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full custom-scrollbar min-h-[600px]">
      {columns.map((column) => (
        <div key={column.id} className="w-[300px] shrink-0 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", column.color)} />
              <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">
                {column.title}
              </h3>
              <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                {leads.filter(l => l.stage === column.id).length}
              </span>
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 bg-slate-100/50 rounded-xl p-3 flex flex-col gap-3 min-h-[400px]">
            {leads
              .filter((lead) => lead.stage === column.id)
              .map((lead) => (
                <motion.div
                  key={lead.id}
                  layoutId={String(lead.id)}
                  whileHover={{ y: -2 }}
                  className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {lead.source}
                    </span>
                    <button className="text-slate-300 hover:text-slate-500">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{lead.name}</h4>
                  <div className="flex items-center gap-2 text-slate-500 mb-3">
                    <MessageSquare className="w-3 h-3" />
                    <span className="text-[10px] font-medium">Conversa ativa com IA</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-100">
                      {lead.value}
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">
                      {lead.date}
                    </span>
                  </div>
                </motion.div>
              ))}
            
            <button className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-400 text-xs font-semibold hover:bg-white hover:border-slate-400 transition-all flex items-center justify-center gap-2 mt-auto">
              <Plus className="w-3 h-3" />
              Adicionar Lead
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
