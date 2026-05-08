"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  label?: string;
}

export function DatePicker({ date, setDate, label = "Data do Jogo" }: DatePickerProps) {
  const [time, setTime] = React.useState(
    date ? format(date, "HH:mm") : "18:00"
  );

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) { setDate(undefined); return; }
    const [h, m] = time.split(":").map(Number);
    const combined = new Date(day);
    combined.setHours(h, m, 0, 0);
    setDate(combined);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
    if (date) {
      const [h, m] = e.target.value.split(":").map(Number);
      const updated = new Date(date);
      updated.setHours(h, m, 0, 0);
      setDate(updated);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{label}</div>
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("flex-1 justify-start text-left font-normal", !date && "text-white/25")}
            >
              <CalendarIcon className="mr-2 h-4 w-4 opacity-40" />
              {date ? format(date, "dd 'de' MMM yyyy", { locale: ptBR }) : "Selecione uma data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDaySelect}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        {/* Time input */}
        <input
          type="time"
          value={time}
          onChange={handleTimeChange}
          className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 text-white text-sm focus:outline-none focus:border-white/30 transition text-center"
          style={{ colorScheme: "dark" }}
        />
      </div>
    </div>
  );
}