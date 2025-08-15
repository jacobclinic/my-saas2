
export function getNextMonthPeriod(date: Date = new Date()): { year: number; month: number } {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
    };
  }
  

  export function getLastMonthPeriod(date: Date = new Date()): { year: number; month: number } {
    const d = new Date(date);
    d.setMonth(d.getMonth() - 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
    };
  }