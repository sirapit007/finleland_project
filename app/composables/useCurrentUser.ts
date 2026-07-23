export function useCurrentUser() {
  const user = useState<any | null>("current-user", () => null);

  const syncFromStorage = () => {
    if (!import.meta.client) {
      return;
    }

    const stored = localStorage.getItem("web-user");
    user.value = stored ? JSON.parse(stored) : null;
  };

  const setCurrentUser = (nextUser: any | null) => {
    user.value = nextUser;

    if (!import.meta.client) {
      return;
    }

    if (nextUser) {
      localStorage.setItem("web-user", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("web-user");
    }
  };

  const clearCurrentUser = () => {
    setCurrentUser(null);
  };

  return {
    clearCurrentUser,
    setCurrentUser,
    syncFromStorage,
    user,
  };
}
