import React, { useState, useRef, useEffect } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Check
} from "lucide-react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  parseISO,
  startOfDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  align?: "left" | "right";
}

export function CustomDatePicker({ 
  value, 
  onChange, 
  label,
  placeholder = "dd/mm/aaaa",
  align = "right"
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? parseISO(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? parseISO(value) : null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 bg-slate-50 border transition-all duration-300 rounded-xl text-left",
          isOpen 
            ? "border-teal-400 ring-4 ring-teal-100/30 bg-white shadow-sm" 
            : "border-slate-200 hover:border-slate-300"
        )}
      >
        <CalendarIcon className={cn(
          "w-4 h-4 transition-colors duration-300",
          isOpen || value ? "text-teal-500" : "text-slate-400"
        )} />
        
        <span className={cn(
          "flex-1 text-sm font-bold truncate",
          value ? "text-slate-700" : "text-slate-400"
        )}>
          {selectedDate ? format(selectedDate, "dd/MM/yyyy") : placeholder}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            className={cn(
              "absolute top-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[70] p-4 w-[280px]",
              align === "left" ? "left-0" : "right-0"
            )}
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h4 className="text-sm font-bold text-slate-700 capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </h4>
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                <div key={i} className="text-[10px] font-bold text-slate-300 text-center py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isPast = startOfDay(day) < startOfDay(new Date());

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onChange(format(day, "yyyy-MM-dd"));
                      setIsOpen(false);
                    }}
                    className={cn(
                      "aspect-square text-xs font-bold rounded-lg flex items-center justify-center transition-all relative",
                      !isCurrentMonth && "text-slate-200",
                      isCurrentMonth && "text-slate-600 hover:bg-teal-50 hover:text-teal-700",
                      isSelected && "bg-teal-600 text-white hover:bg-teal-700 hover:text-white shadow-lg shadow-teal-200",
                      isToday(day) && !isSelected && "text-teal-600 border border-teal-200",
                    )}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
