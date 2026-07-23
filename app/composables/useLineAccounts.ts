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

export async function fetchLineAccounts() {
  const response = await $fetch<{ rows: LineAccount[] }>(
    "/api/user/line-accounts",
  );

  return response.rows || [];
}

export async function disconnectLineAccount(uuid: string) {
  return $fetch(`/api/user/line-accounts/${uuid}`, {
    method: "DELETE",
  });
}
