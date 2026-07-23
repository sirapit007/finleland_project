<template>
  <div class="flex justify-center bg-primary/50">
    <div class="space-y-4 py-8 text-center sm:py-12">
      <h1 class="text-4xl font-bold text-primary-content sm:text-5xl">
        ติดต่อและแสดงความคิดเห็น
      </h1>
      <div class="badge badge-soft badge-primary badge-xs py-3 sm:badge-sm">
        <NuxtLink to="/">หน้าแรก</NuxtLink>
        <Icon name="lucide:chevron-right" size="15" />
        <span class="text-base-content">ติดต่อเรา</span>
      </div>
    </div>
  </div>

  <div class="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
    <section
      class="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm sm:p-8"
    >
      <div class="mb-6 flex items-start gap-3">
        <div
          class="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <Icon name="lucide:message-square-text" size="22" />
        </div>
        <div>
          <h2 class="text-xl font-bold">ส่งความคิดเห็นถึงเรา</h2>
          <p class="mt-1 sm:text-sm text-xs leading-6 text-base-content/60">
            ข้อเสนอแนะของคุณจะช่วยให้เราปรับปรุงสินค้าและบริการให้ดียิ่งขึ้น
          </p>
        </div>
      </div>

      <div
        v-if="!isLoggedIn"
        role="alert"
        class="alert alert-warning mb-5 text-sm"
      >
        <Icon name="lucide:log-in" size="18" />
        <span>กรุณาเข้าสู่ระบบก่อนส่งความคิดเห็น</span>
      </div>

      <form class="space-y-4 flex flex-cols" @submit.prevent="submitFeedback">
        <label class="form-control">
          <span class="label pb-2">
            <span class="label-text font-semibold">ความคิดเห็นของคุณ</span>
          </span>
          <textarea
            v-model="message"
            class="textarea textarea-bordered min-h-44 w-full resize-y leading-7"
            placeholder="บอกเราได้เลยว่าคุณประทับใจอะไร หรือมีส่วนไหนที่อยากให้ปรับปรุง"
            minlength="5"
            maxlength="5000"
            :disabled="isSubmitting || !isLoggedIn"
            required
          />
          <span class="label justify-end pt-2">
            <span class="label-text-alt text-base-content/50">
              {{ message.length.toLocaleString("th-TH") }} / 5,000 ตัวอักษร
            </span>
          </span>
        </label>

        <button
          class="btn btn-primary w-full sm:w-auto sm:min-w-36"
          type="submit"
          :disabled="!canSubmit"
        >
          <Icon
            :name="isSubmitting ? 'lucide:loader-circle' : 'lucide:send'"
            size="17"
            :class="isSubmitting ? 'animate-spin' : ''"
          />
          บันทึกความคิดเห็น
        </button>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
const message = ref("");
const isSubmitting = ref(false);
const { showToast } = useToast();
const { syncFromStorage, user } = useCurrentUser();

const isLoggedIn = computed(() => Boolean(user.value));
const canSubmit = computed(
  () =>
    isLoggedIn.value && message.value.trim().length >= 5 && !isSubmitting.value,
);

const submitFeedback = async () => {
  if (!canSubmit.value) return;

  isSubmitting.value = true;
  try {
    await $fetch("/api/user-contacts", {
      method: "POST",
      body: {
        contact_message: message.value.trim(),
      },
    });
    message.value = "";
    showToast("บันทึกความคิดเห็นเรียบร้อยแล้ว ขอบคุณสำหรับคำแนะนำ", "success");
  } catch (error: any) {
    showToast(
      error?.data?.statusMessage || "ไม่สามารถบันทึกความคิดเห็นได้",
      "error",
    );
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(syncFromStorage);
</script>
