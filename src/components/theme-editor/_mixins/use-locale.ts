import { inject, computed, type Ref } from "vue";
import { enUS, dateEnUS } from "naive-ui";
import type { NLocale, NDateLocale } from "naive-ui";
import { createInjectionKey } from "@/components/theme-editor/_utils";
import type { ConfigProviderInjection } from "naive-ui/lib/config-provider/src/internal-interface";
const configProviderInjectionKey =
  createInjectionKey<ConfigProviderInjection>("n-config-provider");

export default function useLocale<T extends keyof NLocale>(
  ns: T
): {
  localeRef: Ref<NLocale[T]>;
  dateLocaleRef: Ref<NDateLocale>;
} {
  const { mergedLocaleRef, mergedDateLocaleRef } =
    inject(configProviderInjectionKey, null) || {};
  const localeRef = computed(() => {
    return mergedLocaleRef?.value?.[ns] ?? enUS[ns];
  });
  const dateLocaleRef = computed(() => {
    return mergedDateLocaleRef?.value ?? dateEnUS;
  });
  return {
    dateLocaleRef,
    localeRef,
  };
}
