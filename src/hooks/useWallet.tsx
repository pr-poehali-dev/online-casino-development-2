import { useState, useCallback } from "react";

const WALLET_URL = "https://functions.poehali.dev/8d950099-a322-4f73-a42f-440c9ce3e8ae";
const TOKEN_KEY = "casino_session_token";

export interface Transaction {
  id: number;
  type: "deposit" | "withdraw" | "bonus";
  amount: number;
  status: "completed" | "pending" | "rejected";
  method: string;
  created_at: string;
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function useWallet() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const call = useCallback(async (body: object): Promise<{ data?: Record<string, unknown>; error?: string }> => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(WALLET_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Id": getToken(),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return { error: data.error }; }
      return { data };
    } catch {
      const msg = "Ошибка соединения";
      setError(msg);
      return { error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const deposit = useCallback(async (amount: number, method: string) => {
    return call({ action: "deposit", amount, method });
  }, [call]);

  const withdraw = useCallback(async (amount: number, method: string) => {
    return call({ action: "withdraw", amount, method });
  }, [call]);

  const fetchHistory = useCallback(async () => {
    const { data } = await call({ action: "history" });
    if (data?.transactions) setTransactions(data.transactions as Transaction[]);
    return data;
  }, [call]);

  return { deposit, withdraw, fetchHistory, transactions, loading, error, setError };
}
