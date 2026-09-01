<template>
  <div
    class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10"
  >
    <div class="space-y-3 px-1.25">
      <div class="badge badge-sm badge-soft badge-primary py-3">
        <NuxtLink to="/">หน้าแรก</NuxtLink>
        <Icon name="lucide:chevron-right" size="15" />
        <span class="text-base-content">ตะกร้าสินค้า</span>
      </div>

      <div
        class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
            ตะกร้าสินค้า
          </h1>
          <p class="mt-1 text-sm text-base-content/60">
            {{ basketRows.length }} รายการ, {{ totalQuantity }} ชิ้น
          </p>
        </div>
        <NuxtLink
          to="/products"
          class="btn btn-ghost btn-sm self-start text-primary sm:self-auto"
        >
          เลือกซื้อสินค้าต่อ <Icon name="lucide:arrow-right" size="16" />
        </NuxtLink>
      </div>

      <div
        v-if="shouldShowLineConnectNotice"
        role="alert"
        class="alert alert-info text-sm"
      >
        <Icon name="lucide:message-circle-more" size="18" />
        <span>
          หากต้องการรับการแจ้งเตือนเพื่อติดตามสถานะคำสั่งซื้อ
          แนะนำให้เชื่อมต่อบัญชี LINE
          <NuxtLink to="/profile" class="link ml-1 font-semibold">
            ไปหน้าโปรไฟล์
          </NuxtLink>
        </span>
      </div>

      <p
        v-if="errorMessage"
        class="rounded-lg bg-error/10 px-4 py-3 text-sm text-error"
      >
        {{ errorMessage }}
      </p>
      <p
        v-if="shippingError"
        class="rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-content"
      >
        {{ shippingError }}
      </p>
      <p
        v-if="taxError"
        class="rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-content"
      >
        {{ taxError }}
      </p>

      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section class="min-w-0 space-y-4">
          <ShoppingShippingAddressSelection
            :current-user="currentUser"
            :selectedShippingAddress="selectedShippingAddress"
            :isShippingLoading="isShippingLoading"
            v-model:shippingAddresses="shippingAddresses"
            v-model:selectedShippingAddressId="selectedShippingAddressId"
            v-model:shippingError="shippingError"
            :formatShippingAddress="formatShippingAddress"
            :loadShippingAddresses="loadShippingAddresses"
          />

          <ShoppingBasketLists
            :isClearing="isClearing"
            v-model:basketRows="basketRows"
            v-model:errorMessage="errorMessage"
            v-model:confirmBasketTarget="confirmBasketTarget"
            v-model:confirmAction="confirmAction"
            v-model:isConfirmModalOpen="isConfirmModalOpen"
            :pricingFor="pricingFor"
            :formatPrice="formatPrice"
          />

          <div
            class="mt-6 rounded-xl border border-base-300 bg-base-200 p-4 sm:p-5"
          >
            <h2 class="mb-3 sm:text-base text-sm font-bold">ตัวเลือกการจัดส่ง</h2>
            <div class="grid gap-4 sm:grid-cols-1 grid-cols-1">
              <label
                v-for="option in deliveryOptions"
                :key="option.id"
                class="relative block cursor-pointer"
              >
                <input
                  v-model="delivery"
                  type="radio"
                  :value="option.id"
                  class="peer sr-only"
                  :disabled="!option.active"
                />
                <div
                  class="flex items-center gap-3 rounded-lg border border-base-300 p-3 transition peer-checked:bg-base-100 peer-checked:ring-1 peer-checked:ring-base-200"
                  :class="!option.active ? 'opacity-50 cursor-not-allowed' : ''"
                >
                  <Icon
                    :name="option.icon"
                    size="23"
                    :class="
                      option.id === 'express'
                        ? 'text-secondary'
                        : option.id === 'thailand_post_ems'
                          ? 'text-accent'
                          : option.id === 'flash_bulky'
                            ? 'text-info'
                            : 'text-primary'
                    "
                  />
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-bold">{{ option.label }}</p>
                    <p class="text-xs text-base-content/55">
                      {{ option.description }}
                    </p>
                    <p
                      v-if="!option.active && option.unavailableReason"
                      class="mt-1 text-[11px] leading-4 text-warning"
                    >
                      {{ option.unavailableReason }}
                    </p>
                    <p
                      v-else-if="option.parcelCount"
                      class="mt-1 text-[11px] text-base-content/45"
                    >
                      {{ option.parcelCount }} พัสดุ
                    </p>
                  </div>
                  <p class="text-right text-sm font-bold">
                    {{
                      !option.active
                        ? isShippingDistanceLoading
                          ? "กำลังคำนวณ"
                          : "ไม่พร้อม"
                        : option.price === null
                          ? "เลือกเพื่อคำนวณ"
                          : option.price === 0
                            ? "ฟรี"
                            : `฿${formatPrice(option.price || 0)}`
                    }}
                  </p>
                </div>
              </label>
            </div>
            <div
              v-if="delivery === 'express' && selectedShippingAddress"
              class="mt-4 space-y-2"
            >
              <p
                v-if="isShippingDistanceLoading"
                class="flex items-center gap-2 text-xs text-base-content/60"
                aria-hidden="true"
              >
                <span class="skeleton h-4 w-4 rounded-full" />
                <span class="skeleton h-3 w-56 max-w-full" />
              </p>
              <div
                v-else-if="shippingDistanceQuote?.isOverWarningDistance"
                role="alert"
                class="alert alert-warning alert-dash text-secondary py-3"
              >
                <Icon name="lucide:clock-alert" size="20" />
                <div>
                  <p class="text-sm font-bold">อยู่นอกพื้นที่ส่งด่วน</p>
                  <p class="mt-0.5 text-xs">
                    ระยะทางตามถนนโดยประมาณ
                    {{ formattedShippingDistance }} กม. จากสาขาเวียงสา
                    (ให้บริการไม่เกิน 10 กม.)
                  </p>
                </div>
              </div>
              <p
                v-else-if="shippingDistanceQuote"
                class="flex items-center gap-2 text-xs text-base-content/60"
              >
                <Icon name="lucide:route" size="15" class="text-primary" />
                ระยะทางตามถนนโดยประมาณ {{ formattedShippingDistance }} กม.
                จากสาขาเวียงสา
              </p>
              <p
                v-else-if="shippingDistanceError"
                role="status"
                class="flex items-start gap-2 text-xs text-warning"
              >
                <Icon
                  name="lucide:triangle-alert"
                  size="15"
                  class="mt-0.5 shrink-0"
                />
                {{ shippingDistanceError }}
              </p>
              <p
                v-if="shippingDistanceQuote || shippingDistanceError"
                class="text-[10px] text-base-content/45"
              >
                ข้อมูลแผนที่
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link link-hover"
                >
                  © OpenStreetMap contributors
                </a>
              </p>
            </div>
            <div
              v-if="
                selectedDeliveryQuote &&
                delivery !== 'express' &&
                delivery !== 'pickup'
              "
              class="mt-4 rounded-lg border border-base-300 bg-base-200/50 p-3"
            >
              <p class="flex items-center gap-2 text-xs font-semibold">
                <Icon
                  name="lucide:package-search"
                  size="15"
                  class="text-primary"
                />
                คำนวณจาก {{ selectedDeliveryQuote.parcelCount }} พัสดุ
              </p>
              <p
                v-if="selectedDeliveryQuote.parcels[0]"
                class="mt-1 text-[11px] leading-5 text-base-content/55"
              >
                {{ selectedDeliveryQuote.parcels[0].productName }}:
                น้ำหนักคิดค่าจัดส่ง
                {{ selectedDeliveryQuote.parcels[0].billableWeightKg }} กก.
                <template v-if="selectedDeliveryQuote.parcels.length > 1">
                  และอีก {{ selectedDeliveryQuote.parcels.length - 1 }} รายการ
                </template>
              </p>
            </div>
          </div>
        </section>

        <aside
          class="rounded-xl border border-base-300 bg-base-100 p-5 lg:sticky lg:top-6"
        >
          <h2 class="text-xl font-bold">สรุปคำสั่งซื้อ</h2>

          <!-- <div class="mt-5 rounded-xl bg-base-200/80 p-4">
            <div class="flex items-center gap-2">
              <Icon name="lucide:map-pin" size="18" class="text-primary" />
              <p class="font-semibold">ที่อยู่จัดส่ง</p>
            </div>
            <template v-if="selectedShippingAddress">
              <p class="mt-3 text-sm font-semibold">
                {{ selectedShippingAddress.shipping_label }}:
                {{ selectedShippingAddress.shipping_recipient }}
              </p>
              <p class="mt-1 text-sm text-base-content/65">
                {{ formatShippingAddress(selectedShippingAddress) }}
              </p>
              <p class="mt-1 text-sm text-base-content/65">
                {{ selectedShippingAddress.shipping_phone }}
              </p>
            </template>
            <template v-else>
              <p class="mt-3 text-sm text-base-content/55">
                ยังไม่ได้เลือกที่อยู่จัดส่ง
              </p>
            </template>
          </div> -->

          <template v-if="!selectedShippingAddress">
            <p class="mt-3 text-sm text-base-content/55">
              ยังไม่ได้เลือกที่อยู่จัดส่ง
            </p>
          </template>

          <div class="mt-5 space-y-3 text-sm">
            <div class="flex justify-between gap-4 text-base-content/70">
              <span>ราคารวมสินค้า ({{ totalQuantity }} ชิ้น)</span>
              <span class="font-semibold text-base-content"
                >฿{{ formatPrice(originalSubtotal) }}</span
              >
            </div>
            <div class="flex justify-between gap-4 text-success">
              <span class="flex items-center gap-1">
                <Icon name="lucide:badge-percent" size="15" /> ส่วนลดโปรโมชั่น
              </span>
              <span class="font-semibold"
                >-฿{{ formatPrice(totalDiscount) }}</span
              >
            </div>
            <div class="flex justify-between gap-4 text-base-content/70">
              <span>ค่าจัดส่ง</span>
              <span class="font-semibold text-base-content"
                >฿{{ formatPrice(shippingFee) }}</span
              >
            </div>
            <div class="flex justify-between gap-4 text-base-content/70">
              <span>ส่วนลด</span>
              <span class="font-semibold text-base-content">-฿0.00</span>
            </div>
          </div>

          <div class="my-5 border-t border-base-300" />

          <div class="flex items-end justify-between gap-4">
            <div>
              <p class="font-bold">รวมเป็นเงิน</p>
              <p class="mt-1 text-xs text-base-content/55">
                รวมภาษีมูลค่าเพิ่มแล้ว
              </p>
            </div>
            <p class="text-3xl font-bold text-primary">
              ฿{{ formatPrice(grandTotal) }}
            </p>
          </div>

          <div class="my-5 border-t border-base-300" />

          <label class="w-full flex cursor-pointer items-start gap-3">
            <input
              v-model="requestTaxInvoice"
              type="checkbox"
              class="checkbox checkbox-primary sm:checkbox-sm checkbox-xs sm:mt-1 mt-2"
            />
            <div class="w-full">
              <div class="flex items-center justify-between gap-2">
                <h2 class="font-bold sm:text-base text-sm">ขอใบกำกับภาษี</h2>

                <button
                  v-if="requestTaxInvoice"
                  class="btn btn-link sm:btn-xs btn-sm"
                  type="button"
                  :disabled="isTaxLoading"
                  @click="openSelectTaxProfileModal"
                >
                  <Icon name="lucide:receipt-text" size="16" />
                  เลือกข้อมูลภาษี
                </button>
              </div>
              <p
                v-if="!requestTaxInvoice"
                class="mt-1 text-[13px] text-base-content/55"
              >
                เลือกเมื่อต้องการระบุข้อมูลผู้เสียภาษีสำหรับคำสั่งซื้อนี้
              </p>
              <div
                v-else-if="selectedTaxProfile"
                class="mt-2 px-2 border border-dashed border-base-content/45 rounded-sm"
              >
                <p class="mt-2 sm:text-sm text-xs font-semibold">
                  {{ selectedTaxProfile.tax_profile_label }}:
                  {{ selectedTaxProfile.taxpayer_name }}
                </p>
                <p class="mt-1 sm:text-sm text-xs text-base-content/65">
                  เลขประจำตัวผู้เสียภาษี {{ selectedTaxProfile.taxpayer_id }}
                </p>
                <p
                  class="mt-1 max-w-3xl text-xs leading-6 text-base-content/65"
                >
                  {{ formatTaxProfileAddress(selectedTaxProfile) }}
                </p>
              </div>
              <template v-else>
                <p class="mt-2 text-[13px] font-semibold text-error">
                  ยังไม่ได้เลือกข้อมูลผู้เสียภาษี
                </p>
                <p class="mt-1 text-[12px] text-base-content/55">
                  เพิ่มหรือเลือกข้อมูลก่อนดำเนินการสั่งซื้อ
                </p>
              </template>
            </div>
          </label>

          <div class="mt-5 border-t border-base-300" />

          <div class="grid lg:grid-cols-1 sm:grid-cols-2 grid-cols-1 gap-4">
            <section
              class="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4"
              aria-labelledby="wiang-sa-contact-title"
            >
              <div class="flex items-start gap-3">
                <Icon
                  name="lucide:store"
                  size="20"
                  class="mt-0.5 shrink-0 text-primary"
                />
                <div class="min-w-0 flex-1">
                  <h3 id="wiang-sa-contact-title" class="text-sm font-bold">
                    ติดต่อร้านค้าสาขาเวียงสา
                  </h3>
                  <p class="mt-1 text-xs leading-5 text-base-content/60">
                    เปิดทุกวัน 08:00 - 20:00 น. หากต้องการสอบถามสถานะสินค้า
                    ติดต่อทางร้านได้ก่อนสั่งซื้อ
                  </p>
                  <div class="mt-3 grid gap-2 md:grid-cols-2">
                    <a
                      href="tel:+66930166996"
                      class="btn btn-outline btn-primary btn-xs"
                    >
                      <Icon name="lucide:phone" size="14" /> 093-0166996
                    </a>
                    <a
                      href="tel:+66955979995"
                      class="btn btn-outline btn-primary btn-xs"
                    >
                      <Icon name="lucide:phone" size="14" /> 095-5979995
                    </a>
                    <a
                      href="https://www.facebook.com/Fillyland.Sa"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="btn btn-outline btn-primary btn-xs md:col-span-2"
                    >
                      <Icon name="ri:facebook-fill" size="14" />
                      ฟินลี่แลนด์ พลาซ่า เวียงสา
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <label
            class="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition"
            :class="
              orderConditionsError
                ? 'border-error/50 bg-error/5'
                : acceptOrderConditions
                  ? 'border-success/40 bg-success/5'
                  : 'border-warning/40 bg-warning/5'
            "
          >
            <input
              v-model="acceptOrderConditions"
              type="checkbox"
              required
              class="checkbox checkbox-primary checkbox-sm mt-0.5 shrink-0"
              aria-describedby="order-conditions-details"
              @change="orderConditionsError = ''"
            />
            <div id="order-conditions-details" class="min-w-0">
              <p class="text-sm font-bold">ยอมรับเงื่อนไขการสั่งซื้อ</p>
              <ol
                class="mt-2 list-decimal space-y-1 pl-4 text-xs leading-5 text-base-content/65"
              >
                <li>
                  หากทางร้านไม่สามารถจัดหาสินค้าได้
                  ทางร้านจะโอนเงินคืนให้ผู้สั่งซื้อ
                </li>
                <li>
                  หากสินค้าอยู่ระหว่างรอเติมสต็อก
                  ผู้สั่งซื้อตกลงรอสินค้าตามระยะเวลาที่ทางร้านแจ้ง
                </li>
              </ol>
            </div>
          </label>

          <button
            class="btn btn-primary mt-5 w-full"
            :disabled="
              (requiresMinimumOrder && subtotal < 1500) ||
              (delivery !== 'pickup' && !selectedShippingAddress) ||
              !selectedDeliveryOption?.active ||
              (requestTaxInvoice && !selectedTaxProfile) ||
              !acceptOrderConditions ||
              isShippingDistanceLoading ||
              isCheckingOut
            "
            @click="requestCheckout"
          >
            ดำเนินการสั่งซื้อ
            <Icon name="lucide:arrow-right" size="18" />
          </button>
          <p
            v-if="requiresMinimumOrder && subtotal < 1500"
            class="mt-2 text-center text-xs text-base-content/55"
          >
            ยอดสั่งซื้อขั้นต่ำ ฿1,500.00
          </p>
          <p
            v-else-if="delivery !== 'pickup' && !selectedShippingAddress"
            class="mt-2 text-center text-xs text-base-content/55"
          >
            กรุณาเลือกที่อยู่จัดส่งก่อน
          </p>
          <p
            v-else-if="requestTaxInvoice && !selectedTaxProfile"
            class="mt-2 text-center text-xs text-base-content/55"
          >
            กรุณาเลือกข้อมูลผู้เสียภาษีก่อน
          </p>
          <p
            v-else-if="!acceptOrderConditions"
            class="mt-2 text-center text-xs text-warning"
          >
            กรุณาอ่านและยอมรับเงื่อนไขการสั่งซื้อ
          </p>
          <button
            class="btn btn-outline btn-primary btn-sm mt-3 w-full"
            disabled
          >
            <Icon name="lucide:tag" size="14" /> ใส่โค้ดส่วนลด ( Coming Soon ...
            )
          </button>
        </aside>
      </div>

      <div
        class="mt-8 grid gap-3 border-t border-base-300 pt-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div
          v-for="benefit in benefits"
          :key="benefit.title"
          class="flex items-center gap-3 rounded-xl bg-base-200 border border-base-300 p-3"
        >
          <Icon :name="benefit.icon" size="27" class="text-primary" />
          <div>
            <p class="text-sm font-bold">{{ benefit.title }}</p>
            <p class="text-xs text-base-content/55">
              {{ benefit.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <dialog ref="selectTaxProfileModal" class="modal">
    <div class="modal-box max-w-3xl p-0">
      <div
        class="flex items-center justify-between border-b border-base-300 px-5 py-4 sm:px-6"
      >
        <div>
          <h2 class="text-xl font-bold">เลือกข้อมูลผู้เสียภาษี</h2>
          <p class="mt-1 text-sm text-base-content/60">
            ข้อมูลที่เลือกจะถูกบันทึกเป็นสำเนาในคำสั่งซื้อนี้
          </p>
        </div>
        <button
          class="btn btn-circle btn-ghost btn-sm"
          type="button"
          @click="selectTaxProfileModal?.close()"
        >
          <Icon name="lucide:x" size="18" />
        </button>
      </div>
      <div class="max-h-[78vh] space-y-5 overflow-y-auto p-5 sm:p-6">
        <div class="flex flex-wrap justify-between gap-2">
          <button
            class="btn btn-primary btn-sm"
            type="button"
            @click="openCreateTaxProfileModal"
          >
            <Icon name="lucide:plus" size="16" /> เพิ่มข้อมูลใหม่
          </button>
          <button
            class="btn btn-outline btn-sm"
            type="button"
            @click="loadTaxProfiles"
          >
            <Icon name="lucide:refresh-cw" size="16" /> โหลดข้อมูลใหม่
          </button>
        </div>
        <div v-if="isTaxLoading" class="space-y-3">
          <SkeletonAddressCards />
        </div>
        <div v-else-if="!taxProfiles.length" class="py-8 text-center">
          <Icon
            name="lucide:receipt"
            size="32"
            class="mx-auto mb-3 text-base-content/30"
          />
          <p class="font-semibold">ยังไม่มีข้อมูลผู้เสียภาษี</p>
          <p class="mt-1 text-sm text-base-content/55">
            กดเพิ่มข้อมูลใหม่เพื่อสร้างรายการแรก
          </p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="taxProfile in taxProfiles"
            :key="taxProfile.uuid"
            class="relative w-full rounded-xl border text-left transition"
            :class="
              selectedTaxProfileId === taxProfile.uuid
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-base-300 hover:border-primary/50'
            "
          >
            <button
              class="flex w-full items-start gap-3 p-4 pr-20 text-left"
              type="button"
              @click="selectTaxProfile(taxProfile.uuid)"
            >
              <Icon
                name="lucide:receipt-text"
                size="18"
                class="mt-0.5 text-primary"
              />
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="font-bold">
                    {{ taxProfile.tax_profile_label }}:
                    {{ taxProfile.taxpayer_name }}
                  </p>
                  <span
                    v-if="taxProfile.tax_profile_is_default"
                    class="badge badge-sm badge-accent"
                    >Default</span
                  >
                </div>
                <p class="mt-1 text-sm text-base-content/65">
                  เลขประจำตัวผู้เสียภาษี {{ taxProfile.taxpayer_id }}
                </p>
                <p class="mt-1 text-sm text-base-content/65">
                  {{ formatTaxProfileAddress(taxProfile) }}
                </p>
              </div>
            </button>
            <button
              class="btn btn-ghost btn-xs absolute right-4 top-4"
              type="button"
              @click="openEditTaxProfileModal(taxProfile)"
            >
              แก้ไข
            </button>
          </div>
        </div>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>ปิด</button></form>
  </dialog>

  <TaxProfileFormModal
    ref="taxProfileFormModal"
    @saved="handleTaxProfileSaved"
  />

  <ModalRemoveConfirm
    v-model="isConfirmModalOpen"
    :title="confirmTitle"
    :message="confirmMessage"
    :confirm-text="confirmButtonText"
    :variant="confirmVariant"
    :loading="isConfirmLoading"
    :shipping-address="confirmShippingAddress"
    :delivery-method="confirmDeliveryMethod"
    @confirm="confirmBasketAction"
  />
</template>

<script setup lang="ts">
type ShippingQuoteOption = {
  id: string;
  serviceCode: string;
  provider: string;
  label: string;
  description: string;
  available: boolean;
  unavailableReason: string | null;
  price: number | null;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
  rateVersion: string;
  parcelCount: number;
  parcels: Array<Record<string, any>>;
  missingProducts: Array<Record<string, any>>;
};

type ShippingDistanceQuote = {
  addressUuid: string;
  store: {
    label: string;
    address: string;
  };
  distanceMeters: number | null;
  distanceKm: number | null;
  durationMinutes: number | null;
  isOverWarningDistance: boolean;
  warningDistanceKm: number;
  approximate: boolean;
  calculatedAt: string;
  attribution: string;
  options: ShippingQuoteOption[];
};

const delivery = ref("pickup");
const requestTaxInvoice = ref(false);
const acceptOrderConditions = ref(false);
const orderConditionsError = ref("");
const errorMessage = ref("");
const shippingError = ref("");
const taxError = ref("");
const isClearing = ref(false);
const isCheckingOut = ref(false);
const currentUser = ref<any>(null);
const lineAccounts = useLineAccountsState();
const isLineAccountsLoaded = ref(false);
const shippingAddresses = ref<ShippingAddress[]>([]);
const selectedShippingAddressId = ref("");
const taxProfiles = ref<TaxProfile[]>([]);
const selectedTaxProfileId = ref("");
const shippingDistanceQuote = ref<ShippingDistanceQuote | null>(null);
const isShippingDistanceLoading = ref(false);
const shippingDistanceError = ref("");
const shippingDistanceQuoteCache = new Map<string, ShippingDistanceQuote>();
let shippingDistanceAbortController: AbortController | null = null;
const isTaxLoading = ref(false);
const isConfirmModalOpen = ref(false);
const confirmAction = ref<"remove" | "clear" | "checkout" | "">("");
const confirmBasketTarget = ref<any>(null);
const isShippingLoading = ref(false);

const shouldShowLineConnectNotice = computed(
  () =>
    isLineAccountsLoaded.value &&
    Boolean(currentUser.value?.uuid) &&
    !lineAccounts.value.some((account) => account.line_is_connected),
);

const selectTaxProfileModal = ref<HTMLDialogElement | null>(null);
const taxProfileFormModal = ref<{
  onCreate: (initial?: Partial<TaxProfileForm>) => void;
  onEdit: (profile: TaxProfile) => void;
} | null>(null);

const benefits = [
  {
    icon: "lucide:shield-check",
    title: "รับประกันสินค้า",
    description: "เปลี่ยนคืนภายใน 7 วัน",
  },
  {
    icon: "lucide:wallet-cards",
    title: "ชำระเงินปลอดภัย",
    description: "รองรับหลายช่องทาง",
  },
  {
    icon: "lucide:headphones",
    title: "บริการลูกค้า",
    description: "ทุกวัน 08:00 - 20:00",
  },
  {
    icon: "lucide:package-check",
    title: "แพ็กสินค้าอย่างดี",
    description: "ดูแลทุกกล่องให้ปลอดภัย",
  },
];

const quotedDeliveryDefaults = [
  {
    id: "express",
    label: "ส่งด่วนใกล้บ้าน",
    description: "ภายใน 1 - 2 ชม. · ไม่เกิน 10 กม. จากร้าน",
    icon: "lucide:bike",
  },
  {
    id: "thailand_post_ems",
    label: "ไปรษณีย์ไทย EMS",
    description: "จัดส่งต่างจังหวัดตามน้ำหนักหลังแพ็ก",
    icon: "lucide:package-check",
  },
  {
    id: "flash_bulky",
    label: "Flash Express Bulky",
    description: "คิดจากน้ำหนักจริงหรือน้ำหนักปริมาตร",
    icon: "lucide:truck",
  },
] as const;

const deliveryOptions = computed(() => [
  {
    id: "pickup",
    label: "รับสินค้าด้วยตัวเอง",
    description: "รับสินค้าได้ที่หน้าร้านหรือจุดรับสินค้า",
    price: 0,
    icon: "lucide:store",
    active: true,
    unavailableReason: null,
    parcelCount: 0,
    rateVersion: null,
  },
  ...quotedDeliveryDefaults.map((defaultOption) => {
    const quote = shippingDistanceQuote.value?.options.find(
      (option) => option.id === defaultOption.id,
    );
    const canRequestQuote = Boolean(
      selectedShippingAddress.value && basketRows.value.length,
    );

    return {
      ...defaultOption,
      description: quote?.description || defaultOption.description,
      price: quote?.price ?? null,
      active: quote
        ? quote.available
        : canRequestQuote && !shippingDistanceError.value,
      unavailableReason:
        quote?.unavailableReason ||
        (!selectedShippingAddress.value
          ? "เลือกที่อยู่เพื่อคำนวณค่าจัดส่ง"
          : isShippingDistanceLoading.value
            ? "กำลังคำนวณค่าจัดส่ง"
            : shippingDistanceError.value || null),
      parcelCount: quote?.parcelCount || 0,
      rateVersion: quote?.rateVersion || null,
    };
  }),
]);

const selectedDeliveryOption = computed(() =>
  deliveryOptions.value.find((option) => option.id === delivery.value),
);
const selectedDeliveryQuote = computed(() =>
  shippingDistanceQuote.value?.options.find(
    (option) => option.id === delivery.value,
  ),
);
const requiresMinimumOrder = computed(
  () => delivery.value === "pickup" || delivery.value === "express",
);

const formatShippingAddress = (address: ShippingAddress) =>
  [
    address.shipping_address,
    address.shipping_subdistrict,
    address.shipping_district,
    address.shipping_province,
    address.shipping_postcode,
  ]
    .filter(Boolean)
    .join(", ");

const confirmShippingAddress = computed(() => {
  const address = selectedShippingAddress.value;
  if (
    confirmAction.value !== "checkout" ||
    delivery.value === "pickup" ||
    !address
  ) {
    return null;
  }

  return {
    label: address.shipping_label,
    recipient: address.shipping_recipient,
    phone: address.shipping_phone,
    address: formatShippingAddress(address),
    note: address.shipping_note,
  };
});

const confirmDeliveryMethod = computed(() => {
  if (confirmAction.value !== "checkout") {
    return null;
  }

  const option = deliveryOptions.value.find(
    (deliveryOption) => deliveryOption.id === delivery.value,
  );

  return option
    ? {
        id: option.id,
        label: option.label,
        description: option.description,
        price: option.price,
        icon: option.icon,
      }
    : null;
});

const confirmTitle = computed(() => {
  if (confirmAction.value === "remove") return "ยืนยันการลบรายการนี้";
  if (confirmAction.value === "clear") return "ยืนยันการลบสินค้าในตะกร้า";
  if (confirmAction.value === "checkout") return "ยืนยันการสั่งซื้อ";
  return "ยืนยันการทำรายการ";
});

const confirmMessage = computed(() => {
  if (confirmAction.value === "remove") {
    return `คุณต้องการลบ ${confirmBasketTarget.value?.product_name || "สินค้ารายการนี้"} ออกจากตะกร้าใช่หรือไม่`;
  }
  if (confirmAction.value === "clear")
    return "สินค้าทุกรายการจะถูกลบออกจากตะกร้า";
  if (confirmAction.value === "checkout")
    return `ยอดสั่งซื้อ ฿${formatPrice(grandTotal.value)} จะถูกส่งให้ร้านตรวจสอบ`;
  return "";
});

const confirmButtonText = computed(() => {
  if (confirmAction.value === "remove" || confirmAction.value === "clear")
    return "ลบ";
  return "ยืนยันการสั่งซื้อ";
});

const confirmVariant = computed<"error" | "primary">(() =>
  confirmAction.value === "remove" || confirmAction.value === "clear"
    ? "error"
    : "primary",
);

const isConfirmLoading = computed(
  () =>
    isClearing.value ||
    isCheckingOut.value ||
    Boolean(
      confirmBasketTarget.value &&
      isItemUpdating(confirmBasketTarget.value.uuid),
    ),
);

const {
  activeItems,
  clearBasket,
  isItemUpdating,
  refreshBasket,
  removeBasketItem,
} = useBasket();
const { showToast } = useToast();

const basketRows = activeItems;

type BasketPromotionPricing = {
  discount: number;
  hasPromotion: boolean;
  isEligible: boolean;
  message: string;
  normalUnitPrice: number;
  originalTotal: number;
  total: number;
  unitPrice: number;
};

const pricingFor = (basket: any): BasketPromotionPricing => {
  const quantity = Math.max(Math.floor(Number(basket.basket_quantity || 0)), 0);
  const storedUnitPrice = quantity
    ? Number(basket.basket_total || 0) / quantity
    : 0;
  const normalUnitPrice = Number(
    basket.product_selling_price || storedUnitPrice,
  );
  const promotionUnitPrice = Number(
    basket.promotion_discounted_price || basket.promotion_bundle_price || 0,
  );
  const minQuantity = Number(basket.promotion_min_quantity || 0);
  const minPurchaseAmount = Number(basket.promotion_min_purchase_amount || 0);
  const hasPromotion =
    promotionUnitPrice > 0 && promotionUnitPrice < normalUnitPrice;
  const originalTotal = normalUnitPrice * quantity;
  const meetsQuantity = !minQuantity || quantity >= minQuantity;
  const meetsPurchaseAmount =
    !minPurchaseAmount || originalTotal >= minPurchaseAmount;
  const isEligible = hasPromotion && meetsQuantity && meetsPurchaseAmount;
  const unitPrice = isEligible ? promotionUnitPrice : normalUnitPrice;
  const total = unitPrice * quantity;
  const discount = Math.max(originalTotal - total, 0);
  const requirements: string[] = [];
  const missingRequirements: string[] = [];

  if (minQuantity) {
    requirements.push(
      `ซื้อขั้นต่ำ ${minQuantity.toLocaleString("th-TH")} ชิ้น`,
    );
    if (quantity < minQuantity) {
      missingRequirements.push(
        `ซื้อเพิ่มอีก ${(minQuantity - quantity).toLocaleString("th-TH")} ชิ้น`,
      );
    }
  }
  if (minPurchaseAmount) {
    requirements.push(`ยอดซื้อขั้นต่ำ ฿${formatPrice(minPurchaseAmount)}`);
    if (originalTotal < minPurchaseAmount) {
      missingRequirements.push(
        `เพิ่มยอดอีก ฿${formatPrice(minPurchaseAmount - originalTotal)}`,
      );
    }
  }

  return {
    discount,
    hasPromotion,
    isEligible,
    message: isEligible
      ? `${requirements.join(" และ ") || "รับราคาพิเศษ"} ได้แล้ว`
      : `${missingRequirements.join(" และ ")} เพื่อรับราคาพิเศษ ฿${formatPrice(promotionUnitPrice)}`,
    normalUnitPrice,
    originalTotal,
    total,
    unitPrice,
  };
};

const selectedShippingAddress = computed(() => {
  if (!shippingAddresses.value.length) {
    return null;
  }

  return (
    shippingAddresses.value.find(
      (address) => address.uuid === selectedShippingAddressId.value,
    ) ||
    shippingAddresses.value.find((address) => address.shipping_is_default) ||
    shippingAddresses.value[0] ||
    null
  );
});

const selectedTaxProfile = computed(() => {
  if (!taxProfiles.value.length) return null;
  return (
    taxProfiles.value.find(
      (profile) => profile.uuid === selectedTaxProfileId.value,
    ) ||
    taxProfiles.value.find((profile) => profile.tax_profile_is_default) ||
    taxProfiles.value[0] ||
    null
  );
});

const selectedShippingAddressQuoteKey = computed(() => {
  const address = selectedShippingAddress.value;
  if (!address) return "";

  return [
    address.uuid,
    address.updated_at,
    address.shipping_subdistrict,
    address.shipping_district,
    address.shipping_province,
    address.shipping_postcode,
    address.shipping_latitude,
    address.shipping_longitude,
    delivery.value,
    ...basketRows.value.map((basket) =>
      [
        basket.uuid,
        basket.basket_quantity,
        basket.product_shipping_weight_grams,
        basket.product_shipping_length_cm,
        basket.product_shipping_width_cm,
        basket.product_shipping_height_cm,
      ].join(":"),
    ),
  ]
    .map((value) => String(value || "").trim())
    .join("|");
});

const shouldLoadShippingDistance = computed(
  () =>
    delivery.value !== "pickup" &&
    Boolean(selectedShippingAddress.value?.uuid) &&
    basketRows.value.length > 0,
);

const totalQuantity = computed(() =>
  basketRows.value.reduce(
    (total, basket) => total + Number(basket.basket_quantity || 0),
    0,
  ),
);

const originalSubtotal = computed(() =>
  basketRows.value.reduce(
    (total, basket) => total + pricingFor(basket).originalTotal,
    0,
  ),
);

const totalDiscount = computed(() =>
  basketRows.value.reduce(
    (total, basket) => total + pricingFor(basket).discount,
    0,
  ),
);

const subtotal = computed(() =>
  basketRows.value.reduce(
    (total, basket) => total + pricingFor(basket).total,
    0,
  ),
);

const shippingFee = computed(() =>
  basketRows.value.length ? (selectedDeliveryOption.value?.price ?? 0) : 0,
);

const grandTotal = computed(() => subtotal.value + shippingFee.value);

const formattedShippingDistance = computed(() => {
  const distance = Number(shippingDistanceQuote.value?.distanceKm);
  if (!Number.isFinite(distance)) return "-";

  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(distance);
});

const formatPrice = (value: number | string) =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const loadShippingDistance = async () => {
  shippingDistanceAbortController?.abort();
  shippingDistanceAbortController = null;
  shippingDistanceQuote.value = null;
  shippingDistanceError.value = "";
  isShippingDistanceLoading.value = false;

  const address = selectedShippingAddress.value;
  if (!shouldLoadShippingDistance.value || !address?.uuid) {
    return;
  }
  const quoteKey = selectedShippingAddressQuoteKey.value || address.uuid;

  const cachedQuote = shippingDistanceQuoteCache.get(quoteKey);
  if (cachedQuote) {
    shippingDistanceQuote.value = cachedQuote;
    return;
  }

  const controller = new AbortController();
  shippingDistanceAbortController = controller;
  isShippingDistanceLoading.value = true;

  try {
    const quote = await $fetch<ShippingDistanceQuote>("/api/shipping/quote", {
      method: "POST",
      body: {
        shipping_address_uuid: address.uuid,
        delivery_method: delivery.value,
      },
      signal: controller.signal,
    });

    if (
      controller.signal.aborted ||
      quoteKey !== selectedShippingAddressQuoteKey.value ||
      !shouldLoadShippingDistance.value
    ) {
      return;
    }

    shippingDistanceQuoteCache.set(quoteKey, quote);
    shippingDistanceQuote.value = quote;
  } catch (error: any) {
    if (controller.signal.aborted) {
      return;
    }

    shippingDistanceError.value =
      error?.data?.statusMessage ||
      "ไม่สามารถคำนวณระยะทางได้ในขณะนี้ แต่ยังสั่งซื้อได้ตามปกติ";
  } finally {
    if (shippingDistanceAbortController === controller) {
      shippingDistanceAbortController = null;
      isShippingDistanceLoading.value = false;
    }
  }
};

const loadCurrentUser = () => {
  if (!import.meta.client) {
    return;
  }

  const stored = localStorage.getItem("web-user");
  currentUser.value = stored ? JSON.parse(stored) : null;
};

const loadLineConnection = async () => {
  isLineAccountsLoaded.value = false;

  if (!currentUser.value?.uuid) {
    lineAccounts.value = [];
    return;
  }

  try {
    await fetchLineAccounts();
    isLineAccountsLoaded.value = true;
  } catch {
    // Do not suggest connecting LINE until the current status is known.
  }
};

const pickSelectedTaxProfile = () => {
  if (!taxProfiles.value.length) {
    selectedTaxProfileId.value = "";
    return;
  }
  if (
    taxProfiles.value.some(
      (profile) => profile.uuid === selectedTaxProfileId.value,
    )
  )
    return;
  selectedTaxProfileId.value =
    taxProfiles.value.find((profile) => profile.tax_profile_is_default)?.uuid ||
    taxProfiles.value[0]?.uuid ||
    "";
};

const loadShippingAddresses = async () => {
  shippingError.value = "";

  if (!currentUser.value?.uuid) {
    shippingAddresses.value = [];
    selectedShippingAddressId.value = "";
    shippingError.value = "กรุณาเข้าสู่ระบบเพื่อจัดการที่อยู่จัดส่ง";
    return;
  }

  isShippingLoading.value = true;

  try {
    shippingAddresses.value = await fetchShippingAddresses(
      currentUser.value?.uuid,
    );
    pickSelectedShippingAddress();
  } catch {
    shippingError.value = "ไม่สามารถโหลดข้อมูลที่อยู่จัดส่งได้";
  } finally {
    isShippingLoading.value = false;
  }
};

const pickSelectedShippingAddress = () => {
  if (!shippingAddresses.value.length) {
    selectedShippingAddressId.value = "";
    return;
  }

  if (
    selectedShippingAddressId.value &&
    shippingAddresses.value.some(
      (address) => address.uuid === selectedShippingAddressId.value,
    )
  ) {
    return;
  }

  selectedShippingAddressId.value =
    shippingAddresses.value.find((address) => address.shipping_is_default)
      ?.uuid ||
    shippingAddresses.value[0]?.uuid ||
    "";
};

const loadTaxProfiles = async () => {
  taxError.value = "";
  if (!currentUser.value?.uuid) {
    taxProfiles.value = [];
    selectedTaxProfileId.value = "";
    return;
  }
  isTaxLoading.value = true;
  try {
    taxProfiles.value = await fetchTaxProfiles(currentUser.value.uuid);
    pickSelectedTaxProfile();
  } catch {
    taxError.value = "ไม่สามารถโหลดข้อมูลผู้เสียภาษีได้";
  } finally {
    isTaxLoading.value = false;
  }
};

const openSelectTaxProfileModal = async () => {
  await loadTaxProfiles();
  if (!selectTaxProfileModal.value?.open)
    selectTaxProfileModal.value?.showModal();
};

const openCreateTaxProfileModal = async () => {
  if (!currentUser.value?.uuid) {
    taxError.value = "กรุณาเข้าสู่ระบบก่อนเพิ่มข้อมูลผู้เสียภาษี";
    return;
  }

  taxError.value = "";
  selectTaxProfileModal.value?.close();
  await nextTick();
  taxProfileFormModal.value?.onCreate({
    tax_profile_user: currentUser.value.uuid,
    taxpayer_name:
      `${currentUser.value.firstname || ""} ${currentUser.value.lastname || ""}`.trim(),
    taxpayer_phone: currentUser.value.phone || "",
    taxpayer_email: currentUser.value.email || "",
    tax_profile_is_default:
      taxProfiles.value.length === 0 ||
      !taxProfiles.value.some((profile) => profile.tax_profile_is_default),
  });
};

const openEditTaxProfileModal = async (profile: TaxProfile) => {
  selectTaxProfileModal.value?.close();
  await nextTick();
  taxProfileFormModal.value?.onEdit(profile);
};

const selectTaxProfile = (uuid: string) => {
  selectedTaxProfileId.value = uuid;
  requestTaxInvoice.value = true;
  selectTaxProfileModal.value?.close();
  showToast("เลือกข้อมูลผู้เสียภาษีเรียบร้อยแล้ว");
};

const handleTaxProfileSaved = async (
  mode: "create" | "edit",
  profile: TaxProfile,
) => {
  await loadTaxProfiles();
  selectedTaxProfileId.value = profile.uuid;
  requestTaxInvoice.value = true;
  showToast(
    mode === "create"
      ? "เพิ่มข้อมูลผู้เสียภาษีเรียบร้อยแล้ว"
      : "บันทึกข้อมูลผู้เสียภาษีเรียบร้อยแล้ว",
  );
};

const onRemoveBasketItem = async (basket: any) => {
  errorMessage.value = "";
  try {
    await removeBasketItem(basket);
  } catch {
    errorMessage.value = "ไม่สามารถลบสินค้าออกจากตะกร้าได้";
  }
};

const onClearBasket = async () => {
  errorMessage.value = "";
  isClearing.value = true;
  try {
    await clearBasket();
  } catch {
    errorMessage.value = "ไม่สามารถลบสินค้าในตะกร้าได้";
  } finally {
    isClearing.value = false;
  }
};

const requestCheckout = () => {
  orderConditionsError.value = "";
  if (isShippingDistanceLoading.value) return;

  if (!selectedDeliveryOption.value?.active) {
    shippingError.value =
      selectedDeliveryOption.value?.unavailableReason ||
      "วิธีจัดส่งที่เลือกไม่พร้อมใช้งาน";
    return;
  }

  if (delivery.value !== "pickup" && !selectedDeliveryQuote.value) {
    shippingError.value = "กรุณารอระบบคำนวณค่าจัดส่งก่อนดำเนินการ";
    return;
  }

  if (!acceptOrderConditions.value) {
    orderConditionsError.value = "กรุณาอ่านและยอมรับเงื่อนไขการสั่งซื้อ";
    return;
  }

  if (requestTaxInvoice.value && !selectedTaxProfile.value) {
    taxError.value = "กรุณาเลือกข้อมูลผู้เสียภาษีก่อนดำเนินการสั่งซื้อ";
    return;
  }

  confirmAction.value = "checkout";
  isConfirmModalOpen.value = true;
};

const onCheckout = async () => {
  errorMessage.value = "";
  shippingError.value = "";
  taxError.value = "";
  orderConditionsError.value = "";

  if (!currentUser.value?.uuid) {
    errorMessage.value = "กรุณาเข้าสู่ระบบก่อนดำเนินการสั่งซื้อ";
    return;
  }

  if (!basketRows.value.length) {
    errorMessage.value = "ไม่พบสินค้าในตะกร้า";
    return;
  }

  if (!acceptOrderConditions.value) {
    orderConditionsError.value = "กรุณาอ่านและยอมรับเงื่อนไขการสั่งซื้อ";
    return;
  }

  if (delivery.value !== "pickup" && !selectedShippingAddress.value) {
    shippingError.value = "กรุณาเลือกที่อยู่จัดส่งก่อนดำเนินการสั่งซื้อ";
    return;
  }

  if (requestTaxInvoice.value && !selectedTaxProfile.value) {
    taxError.value = "กรุณาเลือกข้อมูลผู้เสียภาษีก่อนดำเนินการสั่งซื้อ";
    return;
  }

  isCheckingOut.value = true;

  try {
    const response: any = await $fetch("/api/order", {
      method: "POST",
      body: {
        order_delivery_method: delivery.value,
        order_stock_terms_accepted: acceptOrderConditions.value,
        order_shipping_address_uuid:
          delivery.value === "pickup"
            ? undefined
            : selectedShippingAddress.value?.uuid,
        order_tax_profile_uuid: requestTaxInvoice.value
          ? selectedTaxProfile.value?.uuid
          : undefined,
      },
    });
    const orderUuid = String(response?.row?.uuid || "").trim();
    if (!orderUuid) {
      throw new Error("Created order did not return a uuid");
    }

    await refreshBasket();
    showToast(
      `สร้างคำสั่งซื้อ ${response?.row?.order_number || ""} เรียบร้อยแล้ว`,
      "success",
      3500,
    );
    if (response?.lineNotification?.sent) {
      showToast("แจ้งเตือนคำสั่งซื้อไปยัง LINE กลุ่มแอดมินแล้ว");
    } else if (response?.lineNotification?.reason) {
      showToast(
        `สร้างคำสั่งซื้อสำเร็จ แต่ยังไม่ส่ง LINE: ${response.lineNotification.reason}`,
        "warning",
      );
    }
    await navigateTo(`/orders/${orderUuid}`);
  } catch (error: any) {
    console.error("Unable to create order", error);
    errorMessage.value =
      error?.data?.statusMessage ||
      "ไม่สามารถสร้างคำสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง";
  } finally {
    isCheckingOut.value = false;
  }
};

const confirmBasketAction = async () => {
  let actionSucceeded = false;

  if (confirmAction.value === "remove" && confirmBasketTarget.value) {
    await onRemoveBasketItem(confirmBasketTarget.value);
    actionSucceeded = !errorMessage.value;
  } else if (confirmAction.value === "clear") {
    await onClearBasket();
    actionSucceeded = !errorMessage.value;
  } else if (confirmAction.value === "checkout") {
    await onCheckout();
    actionSucceeded =
      !errorMessage.value &&
      !shippingError.value &&
      !taxError.value &&
      !orderConditionsError.value;
  }

  if (actionSucceeded) {
    isConfirmModalOpen.value = false;
    confirmBasketTarget.value = null;
  }
};

watch(
  [selectedShippingAddressQuoteKey, shouldLoadShippingDistance],
  () => {
    void loadShippingDistance();
  },
  { immediate: true },
);

watch(shippingDistanceQuote, (quote) => {
  if (!quote || delivery.value === "pickup") return;

  const selectedQuote = quote.options.find(
    (option) => option.id === delivery.value,
  );
  if (!selectedQuote?.available) {
    shippingError.value =
      selectedQuote?.unavailableReason ||
      "วิธีจัดส่งที่เลือกไม่พร้อมใช้งานสำหรับที่อยู่นี้";
  }
});

onBeforeUnmount(() => {
  shippingDistanceAbortController?.abort();
});

onMounted(async () => {
  loadCurrentUser();
  await Promise.all([
    loadShippingAddresses(),
    loadTaxProfiles(),
    loadLineConnection(),
  ]);
});
</script>
