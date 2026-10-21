import { computed, onMounted, onUnmounted, ref } from 'vue';

const MOBILE_QUERY = '(max-width: 900px)';
const matchesMobile = () =>
  typeof window.matchMedia === 'function' && window.matchMedia(MOBILE_QUERY).matches;

export function useResponsiveSidebar() {
  const isMobile = ref(
    typeof window !== 'undefined' && matchesMobile(),
  );
  const mobileOpen = ref(false);
  const desktopCollapsed = ref(false);

  const sidebarOpen = computed(() =>
    isMobile.value ? mobileOpen.value : !desktopCollapsed.value,
  );

  const updateViewport = () => {
    const nextIsMobile = matchesMobile();
    if (nextIsMobile !== isMobile.value) {
      mobileOpen.value = false;
      isMobile.value = nextIsMobile;
    }
  };

  const toggleSidebar = () => {
    if (isMobile.value) mobileOpen.value = !mobileOpen.value;
    else desktopCollapsed.value = !desktopCollapsed.value;
  };

  const closeSidebar = () => {
    mobileOpen.value = false;
  };

  onMounted(() => window.addEventListener('resize', updateViewport));
  onUnmounted(() => window.removeEventListener('resize', updateViewport));

  return { sidebarOpen, desktopCollapsed, toggleSidebar, closeSidebar };
}
