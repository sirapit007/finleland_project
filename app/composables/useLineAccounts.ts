export type LineAccount = {
  id: number;
  uuid: string;
  line_user: string;
  line_provider_id: string;
  line_user_id: string;
  line_display_name: string | null;
  line_picture_url: string | null;
  line_connected_at: string;
  line_disconnected_at: string | null;
  line_is_connected: boolean;
  created_at: string;
  updated_at: string | null;
};

export function useLineAccountsState() {
  return useState<LineAccount[]>("line-accounts", () => []);
}

export async function fetchLineAccounts() {
  const response = await $fetch<{ rows: LineAccount[] }>(
    "/api/user/line-accounts",
  );
  const rows = response.rows || [];
  useLineAccountsState().value = rows;

  return rows;
}

export async function disconnectLineAccount(uuid: string) {
  const response = await $fetch<{ row?: LineAccount }>(
    `/api/user/line-accounts/${uuid}`,
    {
      method: "DELETE",
    },
  );

  const updatedAccount = response.row;
  if (updatedAccount) {
    const accounts = useLineAccountsState();
    accounts.value = accounts.value.map((account) =>
      account.uuid === uuid ? { ...account, ...updatedAccount } : account,
    );
  }

  return response;
}
