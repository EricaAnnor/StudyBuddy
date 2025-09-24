import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { refreshThunk } from "@/store/loginSlice";

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : null; // convert to ms
  } catch {
    return null;
  }
}


export function useSilentRefresh() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.loginUser.access_token);

  useEffect(() => {
    if (!token) return;

    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const now = Date.now();
    const refreshAt = expiry - 2 * 60 * 1000; // 2 minutes before expiry
    const delay = Math.max(refreshAt - now, 0);

    const timer = setTimeout(() => {
      dispatch(refreshThunk());
    }, delay);

    return () => clearTimeout(timer);
  }, [token, dispatch]);
}
