<template>
  <dialog ref="signInModal" class="modal">
    <div class="modal-box max-w-md">
      <form method="dialog">
        <button class="btn btn-sm btn-circle absolute right-4 top-4">X</button>
      </form>
      <AuthSignInForm :key="signInKey" @update:leaving="onSignUp" />
    </div>
  </dialog>

  <dialog ref="signUpModal" class="modal">
    <div class="modal-box max-w-lg">
      <form method="dialog">
        <button class="btn btn-sm btn-circle absolute right-4 top-4">X</button>
      </form>
      <AuthSignUpForm :key="signUpKey" @update:leaving="onSignIn" />
    </div>
  </dialog>
</template>

<script setup lang="ts">
const signInModal = ref<HTMLDialogElement | null>(null);
const signUpModal = ref<HTMLDialogElement | null>(null);
const signInKey = ref(0);
const signUpKey = ref(0);

const onSignIn = () => {
  signUpModal.value?.close();
  signInKey.value += 1;
  signInModal.value?.showModal();
};

const onSignUp = () => {
  signInModal.value?.close();
  signUpKey.value += 1;
  signUpModal.value?.showModal();
};

defineExpose({
  onSignIn,
  onSignUp,
});
</script>
