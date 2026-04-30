import { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import {
  setCredentials,
  setAccessToken,
  logout,
} from "../features/auth/authSlice";

interface RefreshResponse {
  data: {
    accessToken: string;
  };
}

interface UserResponse {
  user: any;
}

const useRefreshOnLoad = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const currentRole = useSelector((state: any) => state.auth.role);
  const currentUser = useSelector((state: any) => state.auth.user);
  const currentAccessToken = useSelector((state: any) => state.auth.accessToken);

  const BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const refreshAndFetchUser = async () => {
      const hasPersistedAuth = Boolean(currentRole && currentUser);

      // Fresh login already placed a valid token in redux.
      // Skipping refresh here prevents a race that can bounce users to login.
      if (currentAccessToken) {
        setIsLoading(false);
        return;
      }

      try {
        // Always attempt refresh once on app load.
        // In production, auth cookies can be non-readable from JS due to
        // domain/security rules, so cookie-gated refresh causes false logouts.
        const refreshRes = await axios.get<RefreshResponse>(
          `${BASE_URL}/auth/refresh`,
          { withCredentials: true }
        );

        const newAccessToken = refreshRes.data.data.accessToken;

        // Step 2: Fetch full user profile if role is missing
        if (!currentRole) {
          const userRes = await axios.get<UserResponse>(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${newAccessToken}` },
            withCredentials: true,
          });

          const userData = userRes.data.user;

          dispatch(
            setCredentials({
              user: userData,
              accessToken: newAccessToken,
              role: userData.role,
              permissions: userData.permissions || null,
            })
          );
        } else {
          dispatch(setAccessToken(newAccessToken));
        }

        setIsLoading(false);
      } catch (err: any) {
        // If refresh fails:
        // - clear stale client auth only when we had persisted auth in redux/localStorage
        // - otherwise treat as normal guest session
        if (err?.response?.status === 401) {
          if (hasPersistedAuth) dispatch(logout());
        } else {
          console.error("❌ Refresh failed unexpectedly:", err);
          if (hasPersistedAuth) dispatch(logout());
        }
        setIsLoading(false);
      }
    };

    refreshAndFetchUser();
  }, [dispatch, BASE_URL]);

  return isLoading;
};

export default useRefreshOnLoad;