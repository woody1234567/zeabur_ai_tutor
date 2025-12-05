<script setup lang="ts">
const { locale, locales } = useI18n();
const switchLocalePath = useSwitchLocalePath();

const onLocaleChanged = async (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const newLocale = target.value;
  const path = switchLocalePath(newLocale as any);
  if (path) {
    await navigateTo(path);
  }
};
</script>

<template>
  <div class="form-control">
    <select
      v-model="locale"
      @change="onLocaleChanged"
      class="select select-bordered select-sm w-full max-w-xs"
    >
      <option v-for="l in locales" :key="l.code" :value="l.code">
        {{ l.name }}
      </option>
    </select>
  </div>
</template>
