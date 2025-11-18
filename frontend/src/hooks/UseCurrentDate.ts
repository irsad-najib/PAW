import { useEffect, useState } from "react";

const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

export function useCurrentDate(locale: string = "id-ID") {
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString(locale, DEFAULT_OPTIONS));
  }, [locale]);

  return currentDate;
}
